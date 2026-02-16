"use client"

import { useState } from "react"
import { UploadZone } from "@/components/dashboard/upload-zone"
import { ConfigForm } from "@/components/dashboard/config-form"

export function WorkspaceSection() {
  const [r2Keys, setR2Keys] = useState<string[]>([])

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
          <UploadZone onR2KeysChange={setR2Keys} />
        </div>

        <div className="flex h-[540px] flex-1 flex-col rounded-xl border border-border/30 bg-card p-4">
          <ConfigForm r2Keys={r2Keys} />
        </div>
      </div>
    </section>
  )
}
