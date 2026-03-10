"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { WorkspaceSection } from "@/components/dashboard/workspace-section"
import { ProjectsSection } from "@/components/dashboard/projects-section"
import { DiscoveryFeed } from "@/components/dashboard/discovery-feed"
import { PricingSection } from "@/components/dashboard/pricing-section"
import { ReviewRoom } from "@/components/dashboard/review-room"
import type { InsertedProject, StepReviewData } from "@/components/dashboard/config-form"
import { stopJob } from "@/lib/mock-api"

export default function Page() {
  const [stepReviewData, setStepReviewData] = useState<StepReviewData | null>(null)
  const [progressData, setProgressData] = useState<{ jobRecordId: string; projectTitle: string } | null>(null)
  const [insertedProjects, setInsertedProjects] = useState<InsertedProject[]>([])
  // Posted items for Discovery feed
  const [postedItems, setPostedItems] = useState<Array<{ id: string; title: string; author: string; videoParts: Array<{ part: string; url: string }> }>>(() => {
    try {
      const saved = localStorage.getItem("postedItems")
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  // Track hidden/deleted project IDs (array for React state diffing)
  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("hiddenProjectIds")
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Restore insertedProjects from localStorage on mount.
  // 1) Remove entries without airtableRecordId (useless - can't track)
  // 2) Deduplicate by id and airtableRecordId
  useEffect(() => {
    try {
      const saved = localStorage.getItem("insertedProjects")
      if (saved) {
        const parsed: InsertedProject[] = JSON.parse(saved)
        const seenIds = new Set<string>()
        const seenRecords = new Set<string>()
        const cleaned = parsed.filter((p) => {
          // Remove entries that have no airtableRecordId -- they can't be tracked
          if (!p.airtableRecordId) return false
          if (seenIds.has(p.id)) return false
          if (seenRecords.has(p.airtableRecordId)) return false
          seenIds.add(p.id)
          seenRecords.add(p.airtableRecordId)
          return true
        })
        localStorage.setItem("insertedProjects", JSON.stringify(cleaned))
        setInsertedProjects(cleaned)
        console.log("[v0] Restored insertedProjects:", cleaned.length, "entries. Removed", parsed.length - cleaned.length, "stale/dupe entries.")
      }
    } catch {}
  }, [])

  // On mount: refresh status of all "processing" cards from Airtable
  // Uses a ref to only run once, after localStorage restore has populated state
  const hasRefreshed = useRef(false)
  useEffect(() => {
    if (hasRefreshed.current) return
    if (insertedProjects.length === 0) return
    hasRefreshed.current = true

    const processingCards = insertedProjects.filter((p) => p.status === "processing" && p.airtableRecordId)
    if (processingCards.length === 0) return

    console.log(`[v0] Refreshing ${processingCards.length} processing cards from Airtable...`)
    processingCards.forEach(async (card) => {
      try {
        const res = await fetch(`/api/job-status?record_id=${encodeURIComponent(card.airtableRecordId!)}`)
        if (!res.ok) {
          // API error (403, 404, etc.) -- mark as completed/stale so it stops spinning
          console.log(`[v0] Refresh card ${card.id}: API returned ${res.status}, marking stale`)
          setInsertedProjects((prev) =>
            prev.map((p) => p.id === card.id ? { ...p, status: "completed" as const, progress: 0 } : p)
          )
          return
        }
        const job = await res.json()
        console.log(`[v0] Refresh card ${card.id}: Airtable Status=${job.Status}, Bible_R2_Key=${job.Bible_R2_Key || "null"}`)

        // Update title from Airtable data if we only have the default name
        const betterTitle = job.Job_ID ? `Job #${job.Job_ID}${job.Total_Episodes ? ` (${job.Total_Episodes} EP)` : ""}` : null

        // Use Bible_R2_Key presence as the real indicator for review-ready
        const hasR2Key = !!job.Bible_R2_Key
        if (hasR2Key) {
          setInsertedProjects((prev) =>
            prev.map((p) => p.id === card.id ? {
              ...p,
              status: "pending_review" as const,
              progress: 100,
              ...(betterTitle && p.title.startsWith("New Project") ? { title: betterTitle } : {}),
              ...(job.Total_Episodes ? { episodes: Number(job.Total_Episodes) } : {}),
            } : p)
          )
        } else if (job.Status === "S9_Done") {
          setInsertedProjects((prev) =>
            prev.map((p) => p.id === card.id ? { ...p, status: "completed" as const, progress: 100 } : p)
          )
        } else if (["Error", "Failed"].includes(job.Status)) {
          // Show error state
          setInsertedProjects((prev) =>
            prev.map((p) => p.id === card.id ? { ...p, status: "completed" as const, progress: 0 } : p)
          )
        }
        // else: still genuinely processing, leave as-is
      } catch {
        // Network error -- mark stale so it stops spinning
        setInsertedProjects((prev) =>
          prev.map((p) => p.id === card.id ? { ...p, status: "completed" as const, progress: 0 } : p)
        )
      }
    })
  }, [insertedProjects])

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
    // Remove from insertedProjects if it's there
    setInsertedProjects((prev) => prev.filter((p) => p.id !== id))
    // Also mark it hidden for mock/placeholder cards
    setHiddenProjectIds((prev) => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      try { localStorage.setItem("hiddenProjectIds", JSON.stringify(next)) } catch {}
      return next
    })
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

  // Browser back button: push history state when entering review/progress mode
  // and listen for popstate to close them gracefully.
  const isInSubView = !!(stepReviewData || progressData)
  useEffect(() => {
    if (isInSubView) {
      window.history.pushState({ reviewOpen: true }, "")
    }
  }, [isInSubView])

  useEffect(() => {
    const handlePopState = () => {
      // User pressed browser back -- close any open sub-view
      if (stepReviewData) setStepReviewData(null)
      if (progressData) setProgressData(null)
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [stepReviewData, progressData])

  // Step Review mode (real data from R2)
  if (stepReviewData) {
    return (
      <ReviewRoom
        key={`review-${stepReviewData.jobRecordId}-${stepReviewData.currentStatus}`}
        mode="step_review"
        jobRecordId={stepReviewData.jobRecordId}
        lockToken={stepReviewData.lockToken}
        bibleR2Key={stepReviewData.bibleR2Key}
        currentStatus={stepReviewData.currentStatus || "S3_Bible_Check"}
        projectTitle={stepReviewData.projectTitle}
        workMode={stepReviewData.workMode}
        onClose={() => {
          setStepReviewData(null)
          if (window.history.state?.reviewOpen) window.history.back()
        }}
        onDelete={() => {
          handleProjectDelete(
            insertedProjects.find((p) => p.airtableRecordId === stepReviewData.jobRecordId)?.id
              ?? stepReviewData.jobRecordId
          )
          setStepReviewData(null)
        }}
        onApproved={() => {
          // Update the card to "approved" so it shows Approved badge
          setInsertedProjects((prev) =>
            prev.map((p) =>
              p.airtableRecordId === stepReviewData.jobRecordId
                ? { ...p, status: "approved" as const }
                : p
            )
          )
        }}
onStop={async () => {
  // Stop job in backend
  if (stepReviewData?.jobRecordId) {
    await stopJob(stepReviewData.jobRecordId)
    // Update local project status
    setInsertedProjects((prev) =>
      prev.map((p) =>
        p.airtableRecordId === stepReviewData.jobRecordId
          ? { ...p, status: "stopped" as InsertedProject["status"] }
          : p
      )
    )
  }
  setStepReviewData(null)
  if (window.history.state?.reviewOpen) window.history.back()
  }}
        onPost={(jobRecordId, videoParts) => {
          const project = insertedProjects.find((p) => p.airtableRecordId === jobRecordId)
          const item = {
            id: jobRecordId,
            title: project?.title || stepReviewData?.projectTitle || "Untitled",
            author: "You",
            videoParts,
          }
          setPostedItems((prev) => {
            if (prev.some((p) => p.id === jobRecordId)) return prev
            const next = [item, ...prev]
            localStorage.setItem("postedItems", JSON.stringify(next))
            return next
          })
          // Update project status to "posted"
          setInsertedProjects((prev) =>
            prev.map((p) =>
              p.airtableRecordId === jobRecordId
                ? { ...p, status: "posted" as InsertedProject["status"] }
                : p
            )
          )
          // Close review room after posting
          setStepReviewData(null)
          if (window.history.state?.reviewOpen) window.history.back()
        }}
      />
    )
  }

  // Progress mode (real project, waiting for review status)
  if (progressData) {
    return (
      <ReviewRoom
        key={`progress-${progressData.jobRecordId}`}
        mode="progress"
        jobRecordId={progressData.jobRecordId}
        projectTitle={progressData.projectTitle}
        onClose={() => {
          setProgressData(null)
          if (window.history.state?.reviewOpen) window.history.back()
        }}
        onDelete={() => {
          handleProjectDelete(
            insertedProjects.find((p) => p.airtableRecordId === progressData.jobRecordId)?.id
              ?? progressData.jobRecordId
          )
          setProgressData(null)
        }}
onStop={async () => {
  // Stop job in backend
  if (progressData?.jobRecordId) {
    await stopJob(progressData.jobRecordId)
    // Update local project status
    setInsertedProjects((prev) =>
      prev.map((p) =>
        p.airtableRecordId === progressData.jobRecordId
          ? { ...p, status: "stopped" as InsertedProject["status"] }
          : p
      )
    )
  }
  setProgressData(null)
  if (window.history.state?.reviewOpen) window.history.back()
  }}
        onPost={(jobRecordId, videoParts) => {
          const project = insertedProjects.find((p) => p.airtableRecordId === jobRecordId)
          const item = {
            id: jobRecordId,
            title: project?.title || progressData.projectTitle,
            author: "You",
            videoParts,
          }
          setPostedItems((prev) => {
            if (prev.some((p) => p.id === jobRecordId)) return prev
            const next = [item, ...prev]
            localStorage.setItem("postedItems", JSON.stringify(next))
            return next
          })
          setInsertedProjects((prev) =>
            prev.map((p) =>
              p.airtableRecordId === jobRecordId
                ? { ...p, status: "posted" as InsertedProject["status"] }
                : p
            )
          )
          setProgressData(null)
          if (window.history.state?.reviewOpen) window.history.back()
        }}
        onReviewReady={(data) => {
          // Transition from progress -> step_review
          setStepReviewData({
            jobRecordId: progressData.jobRecordId,
            lockToken: data.lockToken,
            bibleR2Key: data.bibleR2Key,
            currentStatus: data.currentStatus,
            projectTitle: progressData.projectTitle,
            workMode: data.workMode || "Step_Review",
          })
          setProgressData(null)
        }}
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
          hiddenProjectIds={hiddenProjectIds}
          onProjectClick={async (id) => {
            const inserted = insertedProjects.find((p) => p.id === id)
            const recordId = inserted?.airtableRecordId
            if (!recordId) return

            // For pending_review / approved / completed / posted cards, try quick fetch to jump directly to review
            if (inserted.status === "pending_review" || inserted.status === "approved" || inserted.status === "completed" || inserted.status === "posted") {
              try {
                const res = await fetch(`/api/job-status?record_id=${encodeURIComponent(recordId)}`)
                if (res.ok) {
                  const job = await res.json()
                  // Always use Bible_R2_Key for bible loading; Script_R2_Key is fetched separately by ReviewRoom
                  const bibleKey = job.Bible_R2_Key
                  if (bibleKey) {
                    setStepReviewData({
                      jobRecordId: recordId,
                      lockToken: job.Lock_Token || "",
                      bibleR2Key: bibleKey,
                      currentStatus: job.Status,
                      projectTitle: inserted.title,
                      workMode: job.Work_Mode || "Step_Review",
                    })
                    return
                  }
                }
              } catch { /* fall through to progress */ }
            }

            // Open progress mode for processing cards or if quick fetch failed
            setProgressData({ jobRecordId: recordId, projectTitle: inserted.title })
          }}
          onProjectPost={(projectId) => {
            const project = insertedProjects.find((p) => p.id === projectId)
            if (!project?.airtableRecordId) return
            const recordId = project.airtableRecordId
            // Fetch videos from backend then post
            fetch(`/api/job-status?record_id=${encodeURIComponent(recordId)}`)
              .then((r) => r.ok ? r.json() : Promise.reject(new Error(`API ${r.status}`)))
              .then((job: Record<string, unknown>) => {
                let finalVideos: Array<{ part: string; url: string }> = []
                if (job.Final_Video) {
                  try {
                    finalVideos = typeof job.Final_Video === "string"
                      ? JSON.parse(job.Final_Video as string)
                      : job.Final_Video as Array<{ part: string; url: string }>
                  } catch { /* ignore */ }
                }
                const item = {
                  id: recordId,
                  title: project.title,
                  author: "You",
                  videoParts: finalVideos,
                }
                setPostedItems((prev) => {
                  if (prev.some((p) => p.id === recordId)) return prev
                  const next = [item, ...prev]
                  localStorage.setItem("postedItems", JSON.stringify(next))
                  return next
                })
                setInsertedProjects((prev) =>
                  prev.map((p) =>
                    p.id === projectId
                      ? { ...p, status: "posted" as InsertedProject["status"] }
                      : p
                  )
                )
              })
              .catch((err: Error) => console.error("[v0] Failed to post project:", err))
          }}
          insertedProjects={insertedProjects}
        />
        <div className="my-5 h-px bg-border/20" />
        <DiscoveryFeed 
          postedItems={postedItems} 
          onPostClick={(item) => {
            // Open video player modal for posted item
            if (item.videoParts.length > 0 && item.videoParts[0].url) {
              setStepReviewData({
                jobRecordId: item.id,
                bibleR2Key: "",
                currentStatus: "ALL_DONE",
                title: item.title,
              })
            }
          }}
          onDeletePost={(itemId) => {
            if (confirm("Delete this post from Discovery?")) {
              setPostedItems((prev) => {
                const next = prev.filter((p) => p.id !== itemId)
                localStorage.setItem("postedItems", JSON.stringify(next))
                return next
              })
            }
          }}
        />
        <div className="my-5 h-px bg-border/20" />
        {/* Pricing Section */}
        <PricingSection />
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
