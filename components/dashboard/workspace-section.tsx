"use client"

import { UploadZone } from "@/components/dashboard/upload-zone"
import { ConfigForm } from "@/components/dashboard/config-form"

export function WorkspaceSection() {
  return (
    <section id="workspace">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Workspace</h2>
        <p className="text-xs text-muted-foreground">
          Upload source videos and configure the automation pipeline
        </p>
      </div>

      {/* Equal-height row: flex + items-stretch forces same height on both sides */}
      <div className="flex flex-col items-stretch gap-4 lg:flex-row">
        {/* Left: Upload Area */}
        <div className="flex h-[540px] flex-1 flex-col rounded-xl border border-border/30 bg-card p-4 lg:flex-[1.15]">
          <UploadZone />
        </div>

        {/* Right: Config Form -- pinned button via flex-col + flex-1 spacer inside */}
        <div className="flex h-[540px] flex-1 flex-col rounded-xl border border-border/30 bg-card p-4">
          <ConfigForm />
        </div>
      </div>
    </section>
  )
}
