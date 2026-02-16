// Mock API calls that simulate n8n webhook triggers
const N8N_WEBHOOK_BASE = "https://your-n8n-instance.app/webhook"

interface WebhookPayload {
  [key: string]: unknown
}

export async function triggerWebhook(
  endpoint: string,
  payload: WebhookPayload
): Promise<{ success: boolean; message: string }> {
  // In production, replace with actual fetch to n8n
  console.log(`[n8n Webhook] ${N8N_WEBHOOK_BASE}/${endpoint}`, payload)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return { success: true, message: `Webhook ${endpoint} triggered successfully` }
}

export async function submitProject(data: WebhookPayload) {
  return triggerWebhook("submit-project", data)
}

// ── R2 Direct Upload ──────────────────────────────────────────────
const UPLOAD_TICKET_URL =
  "https://n8n-production-8abb.up.railway.app/webhook/get-upload-ticket"

/**
 * Get a pre-signed upload ticket from the n8n webhook,
 * then PUT the file directly to R2 with real progress tracking.
 * Returns the r2_key on success.
 */
export async function uploadVideoToR2(
  file: File,
  userId: string,
  jobId: string,
  onProgress: (progress: number) => void
): Promise<string> {
  // Phase 1 – obtain upload ticket
  onProgress(2) // small tick so the UI shows activity immediately
  const ticketRes = await fetch(UPLOAD_TICKET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      job_id: jobId,
      filename: file.name,
    }),
  })

  if (!ticketRes.ok) {
    const errorMsg = await ticketRes.text()
    throw new Error(`Ticket request failed: ${errorMsg}`)
  }

  const data = await ticketRes.json()
  if (!data.upload_url || !data.r2_key) {
    throw new Error("Invalid ticket structure from server")
  }

  const { upload_url, r2_key } = data

  // Phase 2 – PUT to R2 with XHR for real progress
  onProgress(5)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", upload_url)

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        // Map 5-100 range so the ticket phase occupies 0-5
        const pct = 5 + (e.loaded / e.total) * 95
        onProgress(Math.round(pct))
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        onProgress(100)
        resolve()
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`))
      }
    })

    xhr.addEventListener("error", () => reject(new Error("Network error during R2 upload")))
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")))

    xhr.send(file)
  })

  return r2_key
}

export async function fetchVoices() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return [
    { id: "v1", name: "Rachel", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream" },
    { id: "v2", name: "Clyde", accent: "American", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/2EiwWnXFnvU5JabPnv8n/stream" },
    { id: "v3", name: "Domi", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/AZnzlk1XvdvUeBnXmlld/stream" },
    { id: "v4", name: "Dave", accent: "British", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/CYw3kZ02Hs0563khs1Fj/stream" },
    { id: "v5", name: "Fin", accent: "Irish", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/D38z5RcWu1voky8WS1ja/stream" },
    { id: "v6", name: "Sarah", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream" },
    { id: "v7", name: "Antoni", accent: "American", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/ErXwobaYiN019PkySvjV/stream" },
    { id: "v8", name: "Elli", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/MF3mGyEYCl7XYWbV9V6O/stream" },
  ]
}

export async function fetchBGM() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return [
    { id: "b1", name: "Cinematic Rise", mood: "Epic", duration: "2:34", preview: "#" },
    { id: "b2", name: "Lo-Fi Chill", mood: "Relaxed", duration: "3:12", preview: "#" },
    { id: "b3", name: "Tech Pulse", mood: "Energetic", duration: "2:48", preview: "#" },
    { id: "b4", name: "Ambient Dreams", mood: "Calm", duration: "4:01", preview: "#" },
    { id: "b5", name: "Urban Beat", mood: "Upbeat", duration: "2:22", preview: "#" },
    { id: "b6", name: "Soft Piano", mood: "Emotional", duration: "3:45", preview: "#" },
    { id: "b7", name: "Dark Synthwave", mood: "Intense", duration: "3:18", preview: "#" },
    { id: "b8", name: "Nature Flow", mood: "Peaceful", duration: "4:30", preview: "#" },
  ]
}

export async function fetchProjects() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    { id: "p1", title: "Product Launch EP01-EP12", status: "processing" as const, progress: 67, date: "2026-02-14", thumbnail: null, episodes: 12 },
    { id: "p2", title: "Tutorial Series S02", status: "pending_review" as const, progress: 100, date: "2026-02-13", thumbnail: null, episodes: 8 },
    { id: "p3", title: "Brand Story Ads", status: "completed" as const, progress: 100, date: "2026-02-12", thumbnail: null, episodes: 5 },
    { id: "p4", title: "Podcast Highlights", status: "completed" as const, progress: 100, date: "2026-02-10", thumbnail: null, episodes: 15 },
    { id: "p5", title: "Event Recap Q1", status: "completed" as const, progress: 100, date: "2026-02-08", thumbnail: null, episodes: 6 },
    { id: "p6", title: "Customer Testimonials", status: "completed" as const, progress: 100, date: "2026-02-05", thumbnail: null, episodes: 10 },
  ]
}

// Review Room API
export async function fetchProjectDetail(projectId: string) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  const projects = await fetchProjects()
  const p = projects.find((x) => x.id === projectId)
  if (!p) return null

  // Generate mock episode data
  const episodes = Array.from({ length: p.episodes }, (_, i) => ({
    id: `${projectId}-ep${i + 1}`,
    number: i + 1,
    title: `Episode ${String(i + 1).padStart(2, "0")}`,
    status: (p.status === "completed"
      ? "locked"
      : i < Math.floor(p.episodes * 0.3)
        ? "locked"
        : i === Math.floor(p.episodes * 0.3)
          ? "reviewing"
          : "pending") as "locked" | "reviewing" | "pending",
    videoUrl: null as string | null,
  }))

  return {
    ...p,
    synopsis:
      "A compelling series exploring the transformative power of AI in content creation. Each episode takes viewers on a journey through different aspects of automation, from script generation to voice synthesis, revealing how creators are leveraging technology to produce engaging short-form content at unprecedented scale. The narrative weaves together expert insights, real-world case studies, and practical demonstrations.",
    script: Array.from({ length: p.episodes }, (_, i) => ({
      ep: i + 1,
      text: `[EP${String(i + 1).padStart(2, "0")} Script]\n\nHook: "What if you could create a week's worth of content in just one hour?"\n\nNarration: In this episode, we explore the cutting-edge tools that are revolutionizing how creators approach short-form video production...\n\nCTA: "Follow for more insights on AI-powered content creation."`,
    })),
    episodes,
    finalized: episodes.filter((e) => e.status === "locked").length,
  }
}

export async function reviewSynopsis(projectId: string, action: "approve" | "retry", feedback?: string) {
  return triggerWebhook("review/synopsis", { projectId, action, feedback })
}

export async function reviewScript(projectId: string, action: "approve" | "retry", edits?: string) {
  return triggerWebhook("review/script", { projectId, action, edits })
}

export async function reviewEpisode(projectId: string, episodeId: string, action: "approve" | "retry") {
  return triggerWebhook("review/episode", { projectId, episodeId, action })
}

export async function downloadEpisode(episodeId: string) {
  return triggerWebhook("download/episode", { episodeId })
}

export async function fetchDiscoveryFeed() {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [
    { id: "d1", title: "How AI Rewrites Content", author: "Sarah K.", likes: 1420, views: 28400, aspect: "9:16" },
    { id: "d2", title: "10x Your Shorts Output", author: "TechViral", likes: 892, views: 15600, aspect: "9:16" },
    { id: "d3", title: "From Blog to Reels", author: "ContentLab", likes: 2100, views: 45200, aspect: "1:1" },
    { id: "d4", title: "Voice Cloning Deep Dive", author: "AI Weekly", likes: 3400, views: 67800, aspect: "9:16" },
    { id: "d5", title: "Batch Processing Tips", author: "ProEditor", likes: 760, views: 12300, aspect: "9:16" },
    { id: "d6", title: "Multilingual Strategies", author: "GlobalMedia", likes: 1850, views: 31500, aspect: "1:1" },
    { id: "d7", title: "Hook Patterns That Work", author: "GrowthHQ", likes: 4200, views: 89100, aspect: "9:16" },
    { id: "d8", title: "Auto-Caption Mastery", author: "SubStudio", likes: 1100, views: 21700, aspect: "9:16" },
    { id: "d9", title: "Trending Sound Design", author: "AudioPro", likes: 980, views: 17400, aspect: "1:1" },
    { id: "d10", title: "Platform Algorithm Hacks", author: "ViralScience", likes: 5600, views: 112000, aspect: "9:16" },
    { id: "d11", title: "Storytelling Frameworks", author: "NarrativeAI", likes: 2300, views: 39800, aspect: "9:16" },
    { id: "d12", title: "Color Grading for Shorts", author: "VisualPro", likes: 1650, views: 27900, aspect: "1:1" },
  ]
}
