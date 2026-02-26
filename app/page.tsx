"use client"

import { useState, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { WorkspaceSection } from "@/components/dashboard/workspace-section"
import { ProjectsSection } from "@/components/dashboard/projects-section"
import { DiscoveryFeed } from "@/components/dashboard/discovery-feed"
import { ReviewRoom } from "@/components/dashboard/review-room"
import type { InsertedProject, StepReviewData } from "@/components/dashboard/config-form"

export default function Page() {
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null)
  const [stepReviewData, setStepReviewData] = useState<StepReviewData | null>(null)
  const [insertedProjects, setInsertedProjects] = useState<InsertedProject[]>([])

  const handleProjectInsert = useCallback((project: InsertedProject) => {
    setInsertedProjects((prev) => [project, ...prev])
  }, [])

  const handleStepReviewReady = useCallback((data: StepReviewData) => {
    // Auto-open ReviewRoom in step_review mode immediately
    setStepReviewData(data)
  }, [])

  // Step Review mode (real Bible data from n8n callback)
  if (stepReviewData) {
    return (
      <ReviewRoom
        mode="step_review"
        jobRecordId={stepReviewData.jobRecordId}
        lockToken={stepReviewData.lockToken}
        bibleR2Key={stepReviewData.bibleR2Key}
        projectTitle={stepReviewData.projectTitle}
        onClose={() => setStepReviewData(null)}
      />
    )
  }

  // Legacy review mode (clicking existing project cards)
  if (reviewProjectId) {
    return (
      <ReviewRoom
        mode="legacy"
        projectId={reviewProjectId}
        onClose={() => setReviewProjectId(null)}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-5">
        <WorkspaceSection onProjectInsert={handleProjectInsert} onStepReviewReady={handleStepReviewReady} />
        <div className="my-5 h-px bg-border/20" />
        <ProjectsSection
          onProjectClick={(id, status) => {
            if (status === "processing") {
              // Still processing -- do nothing, no click action
              return
            }
            if (status === "pending_review") {
              // Open legacy ReviewRoom for mock pending_review cards
              // Real step_review cards auto-open via polling callback
              setReviewProjectId(id)
              return
            }
            // completed -- open for viewing (legacy ReviewRoom)
            setReviewProjectId(id)
          }}
          insertedProjects={insertedProjects}
        />
        <div className="my-5 h-px bg-border/20" />
        <DiscoveryFeed />
        <div className="my-5 h-px bg-border/20" />
        {/* Pricing Section */}
        <section id="pricing" className="scroll-mt-16 py-6">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Pricing</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {/* Free */}
            <div className="rounded-2xl border border-border/40 bg-secondary/10 p-6">
              <h3 className="text-sm font-semibold text-foreground">Free</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="mt-2 text-xs text-muted-foreground">Get started with basic video creation</p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 3 videos / month</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 720p export</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Community templates</li>
              </ul>
              <button className="mt-5 w-full rounded-lg border border-border/40 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground">
                Current Plan
              </button>
            </div>
            {/* Pro */}
            <div className="relative rounded-2xl border-2 p-6" style={{ borderColor: '#A855F7' }}>
              <span className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #F43F7A, #A855F7)' }}>POPULAR</span>
              <h3 className="text-sm font-semibold text-foreground">Pro</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="mt-2 text-xs text-muted-foreground">For creators who need more power</p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 50 videos / month</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 1080p export</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Priority rendering</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Custom voice cloning</li>
              </ul>
              <button className="mt-5 w-full rounded-lg py-2 text-xs font-bold text-white transition-opacity hover:opacity-90" style={{ background: 'linear-gradient(135deg, #F43F7A, #A855F7)' }}>
                Upgrade to Pro
              </button>
            </div>
            {/* Enterprise */}
            <div className="rounded-2xl border border-border/40 bg-secondary/10 p-6">
              <h3 className="text-sm font-semibold text-foreground">Enterprise</h3>
              <p className="mt-1 text-2xl font-bold text-foreground">Custom</p>
              <p className="mt-2 text-xs text-muted-foreground">For teams and agencies</p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Unlimited videos</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 4K export</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> Dedicated support</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> API access</li>
              </ul>
              <button className="mt-5 w-full rounded-lg border border-border/40 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground">
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/20">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-4 px-6 py-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            Shortee.TV &middot; AI Video Production Suite. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
              Documentation
            </span>
            <span className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
              API Status
            </span>
            <span className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </span>
            <span className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
