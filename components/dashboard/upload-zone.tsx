"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, X, Film, CheckCircle2, AlertCircle } from "lucide-react"
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

  return (
    <div className="flex h-full flex-col">
      {/* Drop Zone - compact */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 transition-all",
          isDragOver
            ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/5"
            : "border-border/50 hover:border-[var(--brand-pink)]/40 hover:bg-secondary/20",
          files.length >= 15 && "pointer-events-none opacity-40"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/60">
          <Upload className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-[var(--brand-pink)]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-foreground">
            Drop videos or click to browse
          </p>
          <p className="text-[10px] text-muted-foreground">
            MP4, MOV, AVI, MKV &middot; Max 15 files &middot; {files.length}/15
          </p>
        </div>
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
      {files.length > 0 && (
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
