"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { WorkspaceSection } from "@/components/dashboard/workspace-section"
import { ProjectsSection } from "@/components/dashboard/projects-section"
import { DiscoveryFeed } from "@/components/dashboard/discovery-feed"
import { ReviewRoom } from "@/components/dashboard/review-room"
import type { InsertedProject } from "@/components/dashboard/config-form"

export default function Page() {
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null)
  const [insertedProjects, setInsertedProjects] = useState<InsertedProject[]>([])

  const handleProjectInsert = useCallback((project: InsertedProject) => {
    setInsertedProjects((prev) => [project, ...prev])
  }, [])

  if (reviewProjectId) {
    return (
      <ReviewRoom
        projectId={reviewProjectId}
        onClose={() => setReviewProjectId(null)}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-5">
        <WorkspaceSection onProjectInsert={handleProjectInsert} />
        <div className="my-5 h-px bg-border/20" />
        <ProjectsSection
          onProjectClick={(id) => setReviewProjectId(id)}
          insertedProjects={insertedProjects}
        />
        <div className="my-5 h-px bg-border/20" />
        <DiscoveryFeed />
      </main>

      <footer className="border-t border-border/20">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-4 px-6 py-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            Shortee.TV &middot; AI Video Production Suite. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Documentation
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              API Status
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
