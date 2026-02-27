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

/**
 * Two-phase upload: fetch a pre-signed ticket, then PUT the file to R2.
 * Matches the handleVideoUpload contract exactly.
 * Falls back to safe defaults for userId / jobId to prevent any blocking.
 */
export async function uploadVideoToR2(
  file: File,
  userId: string,
  jobId: string,
  onProgress: (progress: number) => void
): Promise<string> {
  // Force safe defaults
  const targetUid = userId || "test_user"
  const targetJid = jobId || Date.now().toString()

  // Phase 1 – obtain upload ticket
  console.log(`[Phase 1] Target: ${targetUid}/${targetJid}. Fetching ticket...`)
  onProgress(5)

  let ticketRes: Response
  try {
    ticketRes = await fetch(
      "https://n8n-production-8abb.up.railway.app/webhook/get-upload-ticket",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: targetUid,
          job_id: targetJid,
          filename: file.name,
        }),
      }
    )
  } catch (err) {
    console.error("[v0] Phase 1 NETWORK ERROR:", err)
    throw new Error("Ticket fetch network error: " + (err instanceof Error ? err.message : String(err)))
  }

  console.log("[v0] Phase 1 response status:", ticketRes.status)

  if (!ticketRes.ok) {
    const body = await ticketRes.text().catch(() => "")
    console.error("[v0] Phase 1 FAIL body:", body)
    throw new Error("Ticket request failed: " + ticketRes.status + " " + body)
  }

  const ticketJson = await ticketRes.json()
  console.log("[v0] Phase 1 ticket:", JSON.stringify(ticketJson))

  const { upload_url, r2_key } = ticketJson

  if (!upload_url || !r2_key) {
    console.error("[v0] Invalid ticket structure:", ticketJson)
    throw new Error("Invalid ticket structure from server")
  }

  // Phase 2 – PUT file directly to R2
  console.log("[v0] Phase 2 Pushing to R2...", upload_url)
  onProgress(15)

  let uploadRes: Response
  try {
    uploadRes = await fetch(upload_url, {
      method: "PUT",
      body: file,
    })
  } catch (err) {
    console.error("[v0] Phase 2 NETWORK ERROR (likely CORS):", err)
    throw new Error("R2 upload network error: " + (err instanceof Error ? err.message : String(err)))
  }

  console.log("[v0] Phase 2 response status:", uploadRes.status)

  if (uploadRes.status === 200) {
    console.log("%c[SUCCESS] R2 Key: " + r2_key, "color: green")
    onProgress(100)
    return r2_key
  } else {
    const errBody = await uploadRes.text().catch(() => "")
    console.error("[v0] Phase 2 FAIL body:", errBody)
    throw new Error("R2 Upload Error: " + uploadRes.status + " " + errBody)
  }
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

/** No more mock cards. Only real dispatched projects appear in My Projects. */
export async function fetchProjects() {
  return []
}

// ── Step Review API ──────────────────────────────────────────────
const N8N_BASE = "https://n8n-production-8abb.up.railway.app/webhook"
const R2_CDN = "https://video.aihers.live"
const R2_WRITEBACK = "https://reel.digipalca.workers.dev/"

/** Bible JSON shape from backend */
export interface BibleCharacter {
  name: string
  role: string
  description: string
  [key: string]: unknown
}

export interface BibleEpisode {
  episode_number: number
  title: string
  script: string
  voiceover_text: string
  [key: string]: unknown
}

export interface BibleJSON {
  story_summary: string
  characters: BibleCharacter[]
  episodes?: BibleEpisode[]
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

/** Fetch JSON asset from R2 CDN (Bible, Script, VO). Never returns mock data. */
export async function fetchBibleFromR2(r2Key: string): Promise<BibleJSON> {
  if (!r2Key) throw new Error("R2 Key is empty — asset not generated yet")
  const url = `${R2_CDN}/${r2Key}`
  const res = await fetch(url)
  if (res.status === 404) {
    throw new Error(`R2 404: File not found at ${r2Key}`)
  }
  if (!res.ok) {
    throw new Error(`R2 ${res.status}: Failed to fetch ${r2Key}`)
  }
  let json: BibleJSON
  try {
    json = await res.json()
  } catch {
    throw new Error(`JSON parse failed for ${r2Key}`)
  }
  return json
}

// ── Approve / Redo — per V56 spec ──────────────────────────────

/**
 * Unified Approve (all review stages).
 * POST /webhook/04-review-action  { action: "approve" }
 */
export async function reviewApprove(jobRecordId: string, lockToken: string) {
  const res = await fetch(`${N8N_BASE}/04-review-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Job_Record_ID: jobRecordId,
      Lock_Token: lockToken,
      action: "approve",
    }),
  })
  if (!res.ok) throw new Error("Approve failed: " + res.status)
  return res.json()
}

/**
 * Redo routing — different endpoint per status.
 *   S3_Bible_Check  -> POST /webhook/agent0-redo
 *   S5_Script_Check -> POST /webhook/04-review-action
 *   S8_Render       -> POST /webhook/05-redo (with Part_Index)
 */
export async function reviewRedo(
  jobRecordId: string,
  lockToken: string,
  currentStatus: string,
  partIndex?: number,
) {
  let endpoint: string
  const body: Record<string, unknown> = {
    Job_Record_ID: jobRecordId,
    Lock_Token: lockToken,
    action: "redo",
  }

  if (currentStatus === "S3_Bible_Check") {
    endpoint = "agent0-redo"
  } else if (currentStatus === "S5_Script_Check") {
    endpoint = "04-review-action"
  } else if (currentStatus === "S8_Render") {
    endpoint = "05-redo"
    if (partIndex !== undefined) body.Part_Index = partIndex
  } else {
    throw new Error(`Redo not allowed for status: ${currentStatus}`)
  }

  const res = await fetch(`${N8N_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Redo failed (${endpoint}): ` + res.status)
  return res.json()
}

/**
 * Edit & Continue (writeback to R2, then approve).
 * Works for both Bible (S3) and Script/VO (S5).
 */
export async function reviewEditContinue(
  jobRecordId: string,
  lockToken: string,
  r2Key: string,
  editedJson: Record<string, unknown>,
) {
  // Step 1: Writeback original-structure JSON to R2
  const writeRes = await fetch(R2_WRITEBACK, {
    method: "POST",
    headers: {
      Authorization: "Bearer upload number",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key: r2Key,
      raw_content: JSON.stringify(editedJson),
      content_type: "application/json",
    }),
  })
  if (!writeRes.ok) {
    const errBody = await writeRes.text().catch(() => "")
    throw new Error("R2 writeback failed: " + writeRes.status + " " + errBody)
  }

  // Step 2: Approve to continue pipeline
  return reviewApprove(jobRecordId, lockToken)
}

/** Legacy fetchProjectDetail -- no longer returns mock data. */
export async function fetchProjectDetail(_projectId: string) {
  return null
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
