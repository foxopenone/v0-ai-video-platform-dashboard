"use client"

import { useState, useRef, useCallback } from "react"
import { UploadZone } from "@/components/dashboard/upload-zone"
import { ConfigForm } from "@/components/dashboard/config-form"
import type { UploadFileRef } from "@/components/dashboard/upload-zone"
import type { InsertedProject } from "@/components/dashboard/config-form"

interface WorkspaceSectionProps {
  onProjectInsert?: (project: InsertedProject) => void
}

export function WorkspaceSection({ onProjectInsert }: WorkspaceSectionProps) {
  const [r2Keys, setR2Keys] = useState<string[]>([])

  // Refs to bridge UploadZone controls into ConfigForm
  const getFilesRef = useRef<(() => UploadFileRef[]) | null>(null)
  const clearUploadsRef = useRef<(() => void) | null>(null)
  const controlRef = useRef<{
    setProgress: (fileId: string, progress: number) => void
    setComplete: (fileId: string, r2Key: string) => void
    setError: (fileId: string, errorMsg: string) => void
  } | null>(null)

  const getUploadFiles = useCallback(() => getFilesRef.current?.() ?? [], [])
  const clearUploads = useCallback(() => clearUploadsRef.current?.(), [])
  const onFileProgress = useCallback((fileId: string, progress: number) => controlRef.current?.setProgress(fileId, progress), [])
  const onFileComplete = useCallback((fileId: string, r2Key: string) => controlRef.current?.setComplete(fileId, r2Key), [])
  const onFileError = useCallback((fileId: string, msg: string) => controlRef.current?.setError(fileId, msg), [])

  return (
    <section id="workspace">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Workspace</h2>
        <p className="text-xs text-muted-foreground">
          Upload source videos and configure the automation pipeline
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-4 lg:flex-row">
        <div className="flex h-[540px] flex-1 flex-col rounded-xl border border-border/30 bg-card p-4 lg:flex-[1.15]">
          <UploadZone
            onR2KeysChange={setR2Keys}
            onFilesRef={(getter) => { getFilesRef.current = getter }}
            onClearRef={(clearer) => { clearUploadsRef.current = clearer }}
            onControlRef={(ctrl) => { controlRef.current = ctrl }}
          />
        </div>

        <div className="flex h-[540px] flex-1 flex-col rounded-xl border border-border/30 bg-card p-4">
          <ConfigForm
            r2Keys={r2Keys}
            getUploadFiles={getUploadFiles}
            onFileProgress={onFileProgress}
            onFileComplete={onFileComplete}
            onFileError={onFileError}
            clearUploads={clearUploads}
            onProjectInsert={onProjectInsert}
          />
        </div>
      </div>
    </section>
  )
}
