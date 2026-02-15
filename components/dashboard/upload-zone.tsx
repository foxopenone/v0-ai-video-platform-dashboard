"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, X, Film, CheckCircle2, AlertCircle, Smartphone } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { uploadVideo } from "@/lib/mock-api"
import { cn } from "@/lib/utils"

interface UploadFile {
  id: string
  file: File
  name: string
  progress: number
  status: "queued" | "uploading" | "complete" | "error"
  sortKey: number
}

function extractNumericSuffix(filename: string): number {
  const match = filename.match(/(?:EP|ep|Ep|e|E)(\d+)/i) || filename.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 999
}

/** SVG portrait guide illustration shown in the empty state */
function PortraitGuide() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* 9:16 dashed frame */}
      <div className="relative flex h-44 w-[99px] items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20">
        {/* Phone notch hint */}
        <div className="absolute top-2 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-muted-foreground/10" />
        {/* Play triangle in center */}
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
        {/* Aspect label */}
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

export function UploadZone() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const videoFiles = fileArray
        .filter((f) => f.type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(f.name))
        .slice(0, 15 - files.length)

      if (videoFiles.length === 0) return

      const uploadFiles: UploadFile[] = videoFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        progress: 0,
        status: "queued" as const,
        sortKey: extractNumericSuffix(file.name),
      }))

      const sortedNew = uploadFiles.sort((a, b) => a.sortKey - b.sortKey)

      setFiles((prev) => {
        const combined = [...prev, ...sortedNew]
        return combined.sort((a, b) => a.sortKey - b.sortKey).slice(0, 15)
      })

      for (const uf of sortedNew) {
        setFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, status: "uploading" } : f))
        )
        try {
          await uploadVideo(uf.file, (progress) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === uf.id ? { ...f, progress } : f))
            )
          })
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id ? { ...f, status: "complete", progress: 100 } : f
            )
          )
        } catch {
          setFiles((prev) =>
            prev.map((f) => (f.id === uf.id ? { ...f, status: "error" } : f))
          )
        }
      }
    },
    [files.length]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles]
  )

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const hasFiles = files.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-dashed transition-all",
          hasFiles ? "min-h-[100px]" : "min-h-[280px]",
          isDragOver
            ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/5"
            : "border-border/40 hover:border-[var(--brand-pink)]/30 hover:bg-secondary/10",
          files.length >= 15 && "pointer-events-none opacity-40"
        )}
      >
        {/* Empty state: Portrait guide in center, upload CTA in lower third */}
        {!hasFiles && (
          <>
            {/* Upper 2/3: Portrait frame guide */}
            <div className="flex flex-1 items-center justify-center pt-2">
              <PortraitGuide />
            </div>

            {/* Lower 1/3: Upload CTA */}
            <div className="flex flex-col items-center gap-2 pb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 transition-colors group-hover:bg-[var(--brand-pink)]/10">
                <Upload className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[var(--brand-pink)]" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground/80">
                  Drop videos or click to browse
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  MP4, MOV, AVI, MKV &middot; Max 15 files
                </p>
              </div>
            </div>
          </>
        )}

        {/* Has files: compact inline trigger */}
        {hasFiles && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/50">
              <Upload className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[var(--brand-pink)]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">
                Drop more or click to browse
              </p>
              <p className="text-[10px] text-muted-foreground">
                {files.length}/15 files &middot; Portrait 9:16 recommended
              </p>
            </div>
            {/* Tiny 9:16 indicator */}
            <div className="hidden h-8 w-[18px] shrink-0 rounded border border-dashed border-muted-foreground/20 sm:block" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {/* Compact file list */}
      {hasFiles && (
        <ScrollArea className="mt-3 flex-1">
          <div className="flex flex-col gap-1.5">
            {files.map((file, index) => (
              <div
                key={file.id}
                className="group/item flex items-center gap-2.5 rounded-md bg-secondary/20 px-3 py-2 transition-colors hover:bg-secondary/35"
              >
                <span className="w-5 shrink-0 text-center font-mono text-[10px] text-muted-foreground">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Film className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-[11px] font-medium text-foreground/90">
                    {file.name}
                  </p>
                </div>
                {(file.status === "uploading" || file.status === "queued") && (
                  <div className="flex w-20 items-center gap-1.5">
                    <Progress value={file.progress} className="h-[3px] flex-1" />
                    <span className="w-7 shrink-0 text-right font-mono text-[9px] text-muted-foreground">
                      {Math.round(file.progress)}%
                    </span>
                  </div>
                )}
                {file.status === "complete" && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[hsl(var(--success))]" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(file.id) }}
                  className="rounded p-0.5 opacity-0 transition-opacity hover:bg-secondary group-hover/item:opacity-100"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
