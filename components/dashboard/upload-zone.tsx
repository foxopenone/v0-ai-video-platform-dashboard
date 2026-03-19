"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Upload,
  X,
  Film,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Link2,
  Plus,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { uploadVideoToR2 } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

const R2_BUCKET_URL = "https://video.aihers.live"

interface UploadFile {
  id: string
  file?: File
  name: string
  progress: number
  status: "queued" | "uploading" | "complete" | "error"
  errorMsg?: string
  r2Key?: string
  sourceUrl?: string
  sourceType: "r2" | "url"
  sortKey: number
  episodeLabel: string
}

export interface SourceVideoEntry {
  url: string
  filename: string
  r2Key?: string
  sourceType: "r2" | "url"
}

interface UploadZoneProps {
  /** Called whenever the set of ready source video entries changes */
  onSourceEntriesChange?: (entries: SourceVideoEntry[]) => void
  /** Called whenever total file count changes (including still-uploading) */
  onTotalCountChange?: (count: number) => void
  /** Expose a clear function so parent can reset after ignition */
  onClearRef?: (clearer: () => void) => void
  userId?: string
}

function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function extractNumericSuffix(filename: string): number {
  const match =
    filename.match(/(?:EP|ep|Ep|e|E)(\d+)/i) || filename.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 999
}

function getEpisodeLabel(filename: string): string {
  const match = filename.match(/(?:EP|ep|Ep)(\d+)/i)
  if (match) return `EP${match[1].padStart(2, "0")}`
  const numMatch = filename.match(/(\d+)/)
  if (numMatch) return `EP${numMatch[1].padStart(2, "0")}`
  return filename.replace(/\.[^.]+$/, "").slice(0, 6)
}

function guessFilenameFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    const pathname = decodeURIComponent(url.pathname || "")
    const last = pathname.split("/").filter(Boolean).pop()
    return last || url.hostname || "remote-video.mp4"
  } catch {
    return "remote-video.mp4"
  }
}

function buildSourceEntries(items: UploadFile[]): SourceVideoEntry[] {
  return items
    .filter((item) => item.status === "complete")
    .map((item) => {
      if (item.sourceType === "url") {
        return {
          url: item.sourceUrl || "",
          filename: item.name,
          sourceType: "url" as const,
        }
      }

      return {
        url: `${R2_BUCKET_URL}/${item.r2Key}`,
        filename: item.name,
        r2Key: item.r2Key,
        sourceType: "r2" as const,
      }
    })
    .filter((entry) => entry.url)
}

function PortraitGuide() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-44 w-[99px] items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20">
        <div className="absolute top-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-muted-foreground/10" />
        <svg
          width="28"
          height="32"
          viewBox="0 0 28 32"
          fill="none"
          className="text-muted-foreground/15"
        >
          <path
            d="M26 14.268a2 2 0 010 3.464L4 29.856a2 2 0 01-3-1.732V3.876A2 2 0 014 2.144l22 12.124z"
            fill="currentColor"
          />
        </svg>
        <span className="absolute -right-7 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[8px] font-medium tracking-widest text-muted-foreground/25">
          9 : 16
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground/30">
        <Smartphone className="h-3 w-3" />
        <span className="text-[10px] font-medium">Portrait Video</span>
      </div>
    </div>
  )
}

function FilmStripItem({
  file,
  onRemove,
}: {
  file: UploadFile
  onRemove: () => void
}) {
  const isUploading = file.status === "uploading" || file.status === "queued"
  return (
    <div className="group relative flex w-16 shrink-0 flex-col items-center gap-1">
      <div
        className={cn(
          "relative flex h-[72px] w-[40px] items-center justify-center rounded-lg border transition-all",
          file.status === "complete"
            ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5"
            : file.status === "error"
              ? "border-destructive/30 bg-destructive/5"
              : "border-border/30 bg-secondary/30"
        )}
        title={file.status === "error" && file.errorMsg ? file.errorMsg : undefined}
      >
        {isUploading && (
          <div
            className="absolute inset-x-0 bottom-0 rounded-b-lg bg-[var(--brand-pink)]/15 transition-all"
            style={{ height: `${file.progress}%` }}
          />
        )}
        {file.status === "complete" ? (
          <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" />
        ) : file.status === "error" ? (
          <AlertCircle className="h-3 w-3 text-destructive" />
        ) : file.sourceType === "url" ? (
          <Link2 className="h-3 w-3 text-muted-foreground/40" />
        ) : (
          <Film className="h-3 w-3 text-muted-foreground/40" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/80 hover:text-destructive-foreground group-hover:opacity-100"
        >
          <X className="h-2 w-2" />
        </button>
      </div>
      <span className="text-center font-mono text-[8px] font-medium leading-tight text-muted-foreground/70">
        {file.episodeLabel}
      </span>
      {isUploading && (
        <Progress value={file.progress} className="h-[2px] w-10" />
      )}
    </div>
  )
}

export function UploadZone({ onSourceEntriesChange, onTotalCountChange, onClearRef, userId = "anonymous" }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const filmStripRef = useRef<HTMLDivElement>(null)
  const jobIdRef = useRef(generateJobId())
  const router = useRouter()

  useEffect(() => {
    onClearRef?.(() => {
      setFiles([])
      setUrlInput("")
      setUrlError(null)
      jobIdRef.current = generateJobId()
    })
  }, [onClearRef])

  const processFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }

      const fileArray = Array.from(newFiles)
      const videoFiles = fileArray
        .filter(
          (f) =>
            f.type.startsWith("video/") ||
            /\.(mp4|mov|avi|mkv|webm)$/i.test(f.name)
        )
        .slice(0, 15 - files.length)

      if (videoFiles.length === 0) return

      // Filter out duplicates (same filename already exists)
      const existingNames = new Set(files.map((f) => f.name.toLowerCase()))
      const uniqueFiles = videoFiles.filter(
        (f) => !existingNames.has(f.name.toLowerCase())
      )
      if (uniqueFiles.length === 0) {
        console.log("[v0] All files are duplicates, skipping")
        return
      }

      const uploadFiles: UploadFile[] = uniqueFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        progress: 0,
        status: "queued" as const,
        sourceType: "r2" as const,
        sortKey: extractNumericSuffix(file.name),
        episodeLabel: getEpisodeLabel(file.name),
      }))

      setFiles((prev) => {
        const combined = [...prev, ...uploadFiles]
        const sorted = combined.sort((a, b) => a.sortKey - b.sortKey).slice(0, 15)
        onTotalCountChange?.(sorted.length)
        return sorted
      })

      const uploadPromises = uploadFiles.map(async (uf) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id ? { ...f, status: "uploading" } : f
          )
        )
        try {
          const r2Key = await uploadVideoToR2(
            uf.file!,
            userId,
            jobIdRef.current,
            (progress) => {
              setFiles((prev) =>
                prev.map((f) => (f.id === uf.id ? { ...f, progress } : f))
              )
            }
          )
          setFiles((prev) => {
            const updated = prev.map((f) =>
              f.id === uf.id
                ? { ...f, status: "complete" as const, progress: 100, r2Key }
                : f
            )
            onSourceEntriesChange?.(buildSourceEntries(updated))
            return updated
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Upload failed"
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id ? { ...f, status: "error" as const, errorMsg } : f
            )
          )
        }
      })

      await Promise.allSettled(uploadPromises)
    },
    [files.length, userId, onSourceEntriesChange, onTotalCountChange, router]
  )

  const addUrlEntry = useCallback(() => {
    const raw = urlInput.trim()
    if (!raw) {
      setUrlError("Please paste a video URL.")
      return
    }

    let parsed: URL
    try {
      parsed = new URL(raw)
    } catch {
      setUrlError("Invalid URL.")
      return
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      setUrlError("Only HTTP/HTTPS URLs are supported.")
      return
    }

    if (files.length >= 15) {
      setUrlError("Maximum 15 videos.")
      return
    }

    // Check for duplicate URL
    const existingUrls = new Set(files.filter((f) => f.sourceUrl).map((f) => f.sourceUrl))
    if (existingUrls.has(raw)) {
      setUrlError("This URL has already been added.")
      return
    }

    const filename = guessFilenameFromUrl(raw)
    const entry: UploadFile = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: filename,
      progress: 100,
      status: "complete",
      sourceType: "url",
      sourceUrl: raw,
      sortKey: extractNumericSuffix(filename),
      episodeLabel: getEpisodeLabel(filename),
    }

    setFiles((prev) => {
      const updated = [...prev, entry].sort((a, b) => a.sortKey - b.sortKey).slice(0, 15)
      onSourceEntriesChange?.(buildSourceEntries(updated))
      onTotalCountChange?.(updated.length)
      return updated
    })
    setUrlInput("")
    setUrlError(null)
  }, [files.length, onSourceEntriesChange, onTotalCountChange, urlInput])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== id)
      onSourceEntriesChange?.(buildSourceEntries(updated))
      onTotalCountChange?.(updated.length)
      return updated
    })
  }

  const hasFiles = files.length > 0
  const completeCount = files.filter((f) => f.status === "complete").length
  const isUploading = files.some((f) => f.status === "uploading" || f.status === "queued")

  return (
    <div className="flex h-full flex-col">
      {hasFiles && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Source Videos
          </span>
          <span className="font-mono text-[11px] font-medium text-foreground/70">
            <span className="text-[var(--brand-pink)]">{completeCount}</span>
            <span className="text-muted-foreground">
              /{files.length} ready
            </span>
            <span className="ml-1 text-muted-foreground/50">of 15 max</span>
          </span>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!isUploading) setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          if (isUploading) {
            e.preventDefault()
            return
          }
          handleDrop(e)
        }}
        onClick={() => {
          if (isUploading) return
          inputRef.current?.click()
        }}
        className={cn(
          "group relative flex flex-col overflow-hidden rounded-lg border border-dashed transition-all",
          hasFiles ? "shrink-0" : "flex-1",
          isUploading
            ? "cursor-wait border-border/30 opacity-70"
            : "cursor-pointer hover:border-[var(--brand-pink)]/30 hover:bg-secondary/10",
          isDragOver
            ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/5"
            : "border-border/40",
          files.length >= 15 && "pointer-events-none opacity-40"
        )}
      >
        {!hasFiles && (
          <>
            <div className="flex flex-1 items-center justify-center">
              <PortraitGuide />
            </div>
            <div className="flex flex-col items-center gap-2 pb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 transition-colors group-hover:bg-[var(--brand-pink)]/10">
                <Upload className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[var(--brand-pink)]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground/80">
                  Drop videos or click to browse
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {"MP4, MOV, AVI, MKV · Max 15 files"}
                </p>
              </div>
            </div>
          </>
        )}

        {hasFiles && (
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            {isUploading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--brand-pink)]/30 border-t-[var(--brand-pink)]" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  Uploading... please wait
                </span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-[var(--brand-pink)]" />
                <span className="text-[11px] font-medium text-foreground/70">
                  Drop more or click to add
                </span>
                <div className="hidden h-6 w-[14px] shrink-0 rounded border border-dashed border-muted-foreground/20 sm:block" />
              </>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              processFiles(e.target.files)
            }
          }}
        />
      </div>

      <div className="mt-3 rounded-lg border border-border/30 bg-secondary/10 p-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-foreground/80">
          <Link2 className="h-3.5 w-3.5 text-[var(--brand-pink)]" />
          Add video URL
        </div>
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value)
              if (urlError) setUrlError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addUrlEntry()
              }
            }}
            placeholder="https://example.com/video.mp4"
            className="flex-1 rounded-md border border-border/40 bg-background px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-[var(--brand-pink)]/40"
          />
          <button
            type="button"
            onClick={addUrlEntry}
            disabled={files.length >= 15}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--brand-pink)]/25 bg-[var(--brand-pink)]/8 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-[var(--brand-pink)]/12 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add URL
          </button>
        </div>
        {urlError && (
          <p className="mt-2 text-[11px] text-destructive">{urlError}</p>
        )}
      </div>

      {hasFiles && (
        <div className="mt-3">
          <div
            ref={filmStripRef}
            className="scrollbar-hide flex gap-2 overflow-x-auto pb-1"
          >
            {files.map((file) => (
              <FilmStripItem
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
