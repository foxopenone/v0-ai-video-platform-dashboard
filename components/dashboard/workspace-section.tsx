"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { UploadZone } from "@/components/dashboard/upload-zone"
import { ConfigForm } from "@/components/dashboard/config-form"
import type { InsertedProject, StepReviewData } from "@/components/dashboard/config-form"
import type { SourceVideoEntry } from "@/components/dashboard/upload-zone"

interface WorkspaceSectionProps {
  onProjectInsert?: (project: InsertedProject) => void
  onProjectUpdate?: (id: string, updates: Partial<InsertedProject>) => void
  onStepReviewReady?: (data: StepReviewData) => void
}

export function WorkspaceSection({ onProjectInsert, onProjectUpdate, onStepReviewReady }: WorkspaceSectionProps) {
  const [sourceEntries, setSourceEntries] = useState<SourceVideoEntry[]>([])
  const [totalFileCount, setTotalFileCount] = useState(0)
  const clearUploadsRef = useRef<(() => void) | null>(null)
  const [userId, setUserId] = useState<string>("anonymous")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id)
    })
  }, [])

  const clearUploads = useCallback(() => {
    clearUploadsRef.current?.()
    setSourceEntries([])
    setTotalFileCount(0)
  }, [])

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
            userId={userId}
            onSourceEntriesChange={setSourceEntries}
            onTotalCountChange={setTotalFileCount}
            onClearRef={(clearer) => { clearUploadsRef.current = clearer }}
          />
        </div>

        <div className="flex h-[540px] flex-1 flex-col rounded-xl border border-border/30 bg-card p-4">
          <ConfigForm
            sourceEntries={sourceEntries}
            totalFileCount={totalFileCount}
            clearUploads={clearUploads}
            onProjectInsert={onProjectInsert}
            onProjectUpdate={onProjectUpdate}
            onStepReviewReady={onStepReviewReady}
          />
        </div>
      </div>
    </section>
  )
}
