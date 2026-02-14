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
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Upload Videos
        </h3>
        <span className="text-xs text-muted-foreground">
          {files.length}/15 files
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-all",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-border/50 hover:border-primary/50 hover:bg-secondary/30",
          files.length >= 15 && "pointer-events-none opacity-40"
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <Upload className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <p className="mb-1 text-sm font-medium text-foreground">
          Drop video files here
        </p>
        <p className="text-xs text-muted-foreground">
          MP4, MOV, AVI, MKV up to 500MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ScrollArea className="mt-4 flex-1">
          <div className="flex flex-col gap-2 pr-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="group/item flex items-center gap-3 rounded-lg border border-border/30 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <Film className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-medium text-foreground">
                      {file.name}
                    </p>
                    <div className="ml-2 flex shrink-0 items-center gap-1.5">
                      {file.status === "complete" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(142,71%,45%)]" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
                        }}
                        className="rounded p-0.5 opacity-0 transition-opacity hover:bg-secondary group-hover/item:opacity-100"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  {(file.status === "uploading" || file.status === "queued") && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={file.progress} className="h-1" />
                      <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
                        {Math.round(file.progress)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
