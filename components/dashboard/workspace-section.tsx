"use client"

import { UploadZone } from "@/components/dashboard/upload-zone"
import { ConfigForm } from "@/components/dashboard/config-form"

export function WorkspaceSection() {
  return (
    <section id="workspace" className="px-6 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Workspace</h2>
        <p className="text-sm text-muted-foreground">
          Upload your source videos and configure the automation pipeline
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Upload Area */}
        <div className="rounded-xl border border-border/30 bg-card p-5">
          <UploadZone />
        </div>

        {/* Right: Config Form */}
        <div className="rounded-xl border border-border/30 bg-card p-5">
          <ConfigForm />
        </div>
      </div>
    </section>
  )
}
