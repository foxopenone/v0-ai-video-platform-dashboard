"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { WorkspaceSection } from "@/components/dashboard/workspace-section"
import { ProjectsSection } from "@/components/dashboard/projects-section"
import { DiscoveryFeed } from "@/components/dashboard/discovery-feed"
import { ReviewRoom } from "@/components/dashboard/review-room"
import type { InsertedProject, StepReviewData } from "@/components/dashboard/config-form"

export default function Page() {
  const [reviewProjectId, setReviewProjectId] = useState<string | null>(null)
  const [stepReviewData, setStepReviewData] = useState<StepReviewData | null>(null)
  const [progressData, setProgressData] = useState<{ jobRecordId: string; projectTitle: string } | null>(null)
  const [insertedProjects, setInsertedProjects] = useState<InsertedProject[]>([])

  // Restore insertedProjects from localStorage on mount.
  // Version key: bump to force-clear stale data from previous buggy builds.
  const STORAGE_VERSION = "v2"
  useEffect(() => {
    try {
      const ver = localStorage.getItem("insertedProjects_version")
      if (ver !== STORAGE_VERSION) {
        // Clear stale data from previous builds
        localStorage.removeItem("insertedProjects")
        localStorage.setItem("insertedProjects_version", STORAGE_VERSION)
        return
      }
      const saved = localStorage.getItem("insertedProjects")
      if (saved) {
        const parsed: InsertedProject[] = JSON.parse(saved)
        const seenIds = new Set<string>()
        const seenRecords = new Set<string>()
        const deduped = parsed.filter((p) => {
          if (seenIds.has(p.id)) return false
          if (p.airtableRecordId && seenRecords.has(p.airtableRecordId)) return false
          seenIds.add(p.id)
          if (p.airtableRecordId) seenRecords.add(p.airtableRecordId)
          return true
        })
        localStorage.setItem("insertedProjects", JSON.stringify(deduped))
        setInsertedProjects(deduped)
      }
    } catch {}
  }, [])

  // Persist insertedProjects to localStorage on every change (skip first render)
  const hasMounted = useRef(false)
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return }
    try {
      localStorage.setItem("insertedProjects", JSON.stringify(insertedProjects))
    } catch {}
  }, [insertedProjects])

  const handleProjectInsert = useCallback((project: InsertedProject) => {
    setInsertedProjects((prev) => {
      // Prevent duplicate: skip if same id or same airtableRecordId already exists
      if (prev.some((p) => p.id === project.id)) return prev
      if (project.airtableRecordId && prev.some((p) => p.airtableRecordId === project.airtableRecordId)) return prev
      return [project, ...prev]
    })
  }, [])

  const handleProjectDelete = useCallback((id: string) => {
    setInsertedProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleProjectUpdate = useCallback((id: string, updates: Partial<InsertedProject>) => {
    setInsertedProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }, [])

  const handleStepReviewReady = useCallback((data: StepReviewData) => {
    if (data.frontendJobId) {
      setInsertedProjects((prev) =>
        prev.map((p) =>
          p.id === data.frontendJobId
            ? { ...p, status: "pending_review" as const, progress: 100 }
            : p
        )
      )
    }
    setProgressData(null) // close progress if open
    setStepReviewData(data)
  }, [])

  // Step Review mode (real data from R2)
  if (stepReviewData) {
    return (
      <ReviewRoom
        mode="step_review"
        jobRecordId={stepReviewData.jobRecordId}
        lockToken={stepReviewData.lockToken}
        bibleR2Key={stepReviewData.bibleR2Key}
        currentStatus={stepReviewData.currentStatus || "S3_Bible_Check"}
        projectTitle={stepReviewData.projectTitle}
        onClose={() => setStepReviewData(null)}
      />
    )
  }

  // Progress mode (real project, waiting for review status)
  if (progressData) {
    return (
      <ReviewRoom
        mode="progress"
        jobRecordId={progressData.jobRecordId}
        projectTitle={progressData.projectTitle}
        onClose={() => setProgressData(null)}
        onReviewReady={(data) => {
          // Transition from progress -> step_review
          setStepReviewData({
            jobRecordId: progressData.jobRecordId,
            lockToken: data.lockToken,
            bibleR2Key: data.bibleR2Key,
            currentStatus: data.currentStatus,
            projectTitle: progressData.projectTitle,
          })
          setProgressData(null)
        }}
      />
    )
  }

  // Legacy review mode (placeholder/demo cards only)
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
        <WorkspaceSection onProjectInsert={handleProjectInsert} onProjectUpdate={handleProjectUpdate} onStepReviewReady={handleStepReviewReady} />
        <div className="my-5 h-px bg-border/20" />
        <ProjectsSection
          onProjectDelete={handleProjectDelete}
          onProjectClick={async (id) => {
            // Check if this is a real project (dispatched, has airtableRecordId)
            const inserted = insertedProjects.find((p) => p.id === id)
            const recordId = inserted?.airtableRecordId

            if (recordId) {
              // REAL PROJECT: never falls to mock. Query Airtable once to check current state.
              try {
                const res = await fetch(`/api/job-status?record_id=${encodeURIComponent(recordId)}`)
                if (res.ok) {
                  const job = await res.json()
                  const isReviewStatus = ["S3_Bible_Check", "S5_Script_Check"].includes(job.Status)
                  const r2Key = job.Bible_R2_Key || job.Script_R2_Key
                  if (isReviewStatus && r2Key) {
                    // Already in review state -> go directly to step_review
                    setStepReviewData({
                      jobRecordId: recordId,
                      lockToken: job.Lock_Token || "",
                      bibleR2Key: r2Key,
                      currentStatus: job.Status,
                      projectTitle: inserted.title,
                    })
                    return
                  }
                }
              } catch {
                // Network error -- still open progress mode (it will poll)
              }
              // Not in review status -> open progress mode (shows real status + auto-transitions)
              setProgressData({ jobRecordId: recordId, projectTitle: inserted.title })
              return
            }

            // Placeholder card -> open legacy ReviewRoom with placeholder UI
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
