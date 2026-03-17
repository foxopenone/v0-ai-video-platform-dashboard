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
  // Add timestamp to filename to prevent caching issues
  const timestamp = Date.now()
  const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : ''
  const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name
  const timestampedFilename = `${baseName}_${timestamp}${ext}`
  
  console.log(`[Phase 1] Target: ${targetUid}/${targetJid}. Fetching ticket for ${timestampedFilename}...`)
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
          filename: timestampedFilename,
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

/**
 * Fetch voices from Airtable via /api/voices.
 * Returns: { id, name, gender, language, preview, provider }
 * The `id` IS the real voice_id used in production.
 * For Azure voices, id is prefixed with "azure:" (e.g. "azure:zh-CN-XiaoxiaoNeural")
 * The `provider` indicates which TTS service: "ElevenLabs" or "Azure"
 */
export interface VoiceOption {
  id: string       // voice_id -> used as Voice_Select value
  name: string     // Display label
  gender: string   // male / female / neutral
  language: string // e.g. "en"
  preview: string  // Audio preview URL (may be empty)
  provider: "ElevenLabs" | "Azure"  // TTS provider
}

export async function fetchVoices(): Promise<VoiceOption[]> {
  try {
    const res = await fetch("/api/voices")
    if (!res.ok) throw new Error(`/api/voices returned ${res.status}`)
    const data: Array<{
      name: string
      voice_id: string
      gender: string
      language: string
      preview_url: string | null
      provider: "ElevenLabs" | "Azure"
    }> = await res.json()
    return data.map((v) => ({
      id: v.voice_id,
      name: v.name,
      gender: v.gender || "",
      language: v.language || "en",
      preview: v.preview_url || "",
      provider: v.provider || "ElevenLabs",
    }))
  } catch (err) {
    console.error("[fetchVoices] Failed to load from /api/voices, using empty list:", err)
    return []
  }
}

/**
 * Fetch BGM list from Workers API.
 * Returns: { id: r2_key, name: track_name, category, preview: url }
 * The `id` IS the r2_key passed directly as BGM_Select to n8n.
 */
// BGM assets base URL
const BGM_ASSETS_BASE = "https://assets.aihers.live"

export async function fetchBGM(): Promise<
  Array<{ id: string; name: string; category: string; preview: string }>
> {
  try {
    const res = await fetch("https://reel.digipalca.workers.dev/api/bgm/list")
    if (!res.ok) throw new Error(`BGM API returned ${res.status}`)
    const json = await res.json()
    if (!json.success || !Array.isArray(json.data)) {
      throw new Error("BGM API returned invalid data")
    }
    return json.data.map((t: { track_name: string; category: string; r2_key: string; url: string }) => {
      // Build preview URL using new assets domain
      // r2_key format: "BGM/BGM/Cheerful/Ch01.MP3" -> "https://assets.aihers.live/BGM/BGM/Cheerful/Ch01.MP3"
      let previewUrl = ""
      if (t.r2_key) {
        // Ensure path doesn't start with slash when concatenating
        const path = t.r2_key.startsWith("/") ? t.r2_key.slice(1) : t.r2_key
        previewUrl = `${BGM_ASSETS_BASE}/${path}`
      } else if (t.url) {
        // Fallback: if url is provided, use it (may already be full URL or relative)
        if (t.url.startsWith("http")) {
          previewUrl = t.url
        } else {
          const path = t.url.startsWith("/") ? t.url.slice(1) : t.url
          previewUrl = `${BGM_ASSETS_BASE}/${path}`
        }
      }
      return {
        id: t.r2_key,         // r2_key IS the BGM_Select value
        name: t.track_name,
        category: t.category,
        preview: previewUrl,
      }
    })
  } catch (err) {
    console.error("[fetchBGM] Failed to load from BGM API:", err)
    return []
  }
}

export async function fetchProjects() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    { id: "p1", title: "Product Launch EP01-EP12", status: "completed" as const, progress: 100, date: "2026-02-14", thumbnail: null, episodes: 12 },
    { id: "p2", title: "Tutorial Series S02", status: "completed" as const, progress: 100, date: "2026-02-13", thumbnail: null, episodes: 8 },
    { id: "p3", title: "Brand Story Ads", status: "completed" as const, progress: 100, date: "2026-02-12", thumbnail: null, episodes: 5 },
    { id: "p4", title: "Podcast Highlights", status: "completed" as const, progress: 100, date: "2026-02-10", thumbnail: null, episodes: 15 },
    { id: "p5", title: "Event Recap Q1", status: "completed" as const, progress: 100, date: "2026-02-08", thumbnail: null, episodes: 6 },
    { id: "p6", title: "Customer Testimonials", status: "completed" as const, progress: 100, date: "2026-02-05", thumbnail: null, episodes: 10 },
  ]
}

// ── Step Review API ──────────────────────────────────────────────
const N8N_BASE = "https://n8n-production-8abb.up.railway.app/webhook"
const R2_CDN = "https://video.aihers.live"
const R2_WRITEBACK = "https://reel.digipalca.workers.dev/"

/** Bible JSON shape -- normalized from R2 real data.
 *  R2 actual structure: { meta, character_graph, episode_index }
 *  We normalize to this interface for the review UI.
 */
export interface BibleCharacter {
  name: string
  role: string
  description: string          // mapped from visual_feature
  relation_map?: string
  intent_tag?: string
  visual_feature?: string
  [key: string]: unknown
}

export interface BibleEpisode {
  key: string                  // "Ep01", "Ep02", etc.
  setting: string
  summary: string
  special_alerts: string[]
  visual_anchors: string[]
  [key: string]: unknown
}

export interface BibleJSON {
  story_summary: string        // from meta.story_summary
  characters: BibleCharacter[] // normalized from character_graph
  episodes: BibleEpisode[]     // normalized from episode_index
  meta?: { language?: string; total_episodes?: number; [key: string]: unknown }
  // Keep raw data for approve/redo payloads
  _raw?: Record<string, unknown>
  [key: string]: unknown
}

// ── Voice Over Script JSON ──
// Real R2 structure: { series_meta, parts: [{ part_id, timeline: [...] }] }
export interface VOTimelineEvent {
  type: string              // "VO_HOOK", "ORIGINAL_SOUND", "VO_NARRATION", etc.
  text: string              // Voice-over text (editable by user)
  visual_query?: string     // Suggested visual (read-only)
  description?: string      // For ORIGINAL_SOUND events (read-only)
  [key: string]: unknown    // Preserve all hidden fields (event_id, suggested_clip_ids, etc.)
}

export interface VOPart {
  part_id: number
  timeline: VOTimelineEvent[]
  [key: string]: unknown    // Preserve all hidden fields
}

export interface ScriptJSON {
  parts: VOPart[]
  series_meta?: Record<string, unknown>
  _raw: Record<string, unknown>   // Full original JSON for lossless writeback
}

/** Fetch JSON asset from R2 CDN (Bible, Script, VO). Never returns mock data.
 *  Handles nested wrappers like { series_bible: {...} } or { Series_Bible_Data: {...} }.
 */
export async function fetchBibleFromR2(r2Key: string): Promise<BibleJSON> {
  if (!r2Key) throw new Error("R2 Key is empty — asset not generated yet")
  const url = `${R2_CDN}/${r2Key}`
  console.log("[v0] fetchBibleFromR2 URL:", url)

  const res = await fetch(url)
  if (res.status === 404) {
    throw new Error(`R2 404: File not found at ${r2Key}`)
  }
  if (!res.ok) {
    throw new Error(`R2 ${res.status}: Failed to fetch ${r2Key}`)
  }

  let raw: unknown
  try {
    raw = await res.json()
  } catch {
    throw new Error(`JSON parse failed for ${r2Key}`)
  }

  const rawObj = raw as Record<string, unknown>
  console.log("[v0] R2 raw JSON top-level keys:", Object.keys(rawObj))

  // ── Normalize R2 Bible structure to BibleJSON ──
  // R2 real format: { meta, character_graph, episode_index }
  // We need:        { story_summary, characters, episodes }

  // 1) Characters: from character_graph (multiple formats supported)
  let charGraph = rawObj.character_graph
  console.log("[v0] Raw character_graph:", typeof charGraph, charGraph ? Object.keys(charGraph as object).slice(0, 5) : "null")
  
  let characters: BibleCharacter[] = []
  
  if (Array.isArray(charGraph)) {
    // Format A: character_graph is an array of character objects
    characters = (charGraph as Array<Record<string, unknown>>).map((c) => ({
      name: String(c.name ?? "Unknown").trim(),
      role: String(c.role ?? "Supporting").trim(),
      description: String(c.visual_feature ?? c.description ?? "").trim(),
      relation_map: c.relation_map ? String(c.relation_map).trim() : undefined,
      intent_tag: c.intent_tag ? String(c.intent_tag).trim() : undefined,
      visual_feature: c.visual_feature ? String(c.visual_feature).trim() : undefined,
    }))
  } else if (charGraph && typeof charGraph === "object") {
    const nested = charGraph as Record<string, unknown>
    
    // Format B: { characters: [...] } - nested array
    if (Array.isArray(nested.characters)) {
      characters = (nested.characters as Array<Record<string, unknown>>).map((c) => ({
        name: String(c.name ?? "Unknown").trim(),
        role: String(c.role ?? "Supporting").trim(),
        description: String(c.visual_feature ?? c.description ?? "").trim(),
        relation_map: c.relation_map ? String(c.relation_map).trim() : undefined,
        intent_tag: c.intent_tag ? String(c.intent_tag).trim() : undefined,
        visual_feature: c.visual_feature ? String(c.visual_feature).trim() : undefined,
      }))
    }
    // Format C: { "周小雪": { role: "...", ... }, "乔森": { ... } } - name-keyed object
    else if (Object.keys(nested).length > 0 && !("name" in nested)) {
      characters = Object.entries(nested).map(([name, data]) => {
        const c = data as Record<string, unknown>
        return {
          name: name.trim(),
          role: String(c.role ?? "Supporting").trim(),
          description: String(c.visual_feature ?? c.description ?? "").trim(),
          relation_map: c.relation_map ? String(c.relation_map).trim() : undefined,
          intent_tag: c.intent_tag ? String(c.intent_tag).trim() : undefined,
          visual_feature: c.visual_feature ? String(c.visual_feature).trim() : undefined,
        }
      })
    }
    // Format D: Single character object with name field
    else if ("name" in nested) {
      characters = [{
        name: String(nested.name ?? "Unknown").trim(),
        role: String(nested.role ?? "Supporting").trim(),
        description: String((nested as Record<string, unknown>).visual_feature ?? nested.description ?? "").trim(),
        relation_map: nested.relation_map ? String(nested.relation_map).trim() : undefined,
        intent_tag: nested.intent_tag ? String(nested.intent_tag).trim() : undefined,
        visual_feature: nested.visual_feature ? String(nested.visual_feature).trim() : undefined,
      }]
    }
  }
  console.log("[v0] Parsed characters count:", characters.length)

  // 2) Episodes: from episode_index (multiple formats supported)
  const epIndex = rawObj.episode_index
  console.log("[v0] Raw episode_index:", typeof epIndex, epIndex ? Object.keys(epIndex as object).slice(0, 5) : "null")
  
  let episodes: BibleEpisode[] = []
  
  if (Array.isArray(epIndex)) {
    // Format A: episode_index is array: [{ key: "Ep01", ... }]
    episodes = (epIndex as Array<Record<string, unknown>>).map((ep) => ({
      key: String(ep.key ?? ep.episode_id ?? ep.ep_id ?? "").trim(),
      setting: String(ep.setting ?? "").trim(),
      summary: String(ep.summary ?? "").trim(),
      special_alerts: Array.isArray(ep.special_alerts) ? ep.special_alerts.map((s: unknown) => String(s).trim()) : [],
      visual_anchors: Array.isArray(ep.visual_anchors) ? ep.visual_anchors.map((s: unknown) => String(s).trim()) : [],
    }))
  } else if (epIndex && typeof epIndex === "object") {
    const nested = epIndex as Record<string, unknown>
    
    // Format B: { episodes: [...] } - nested array
    if (Array.isArray(nested.episodes)) {
      episodes = (nested.episodes as Array<Record<string, unknown>>).map((ep) => ({
        key: String(ep.key ?? ep.episode_id ?? ep.ep_id ?? "").trim(),
        setting: String(ep.setting ?? "").trim(),
        summary: String(ep.summary ?? "").trim(),
        special_alerts: Array.isArray(ep.special_alerts) ? ep.special_alerts.map((s: unknown) => String(s).trim()) : [],
        visual_anchors: Array.isArray(ep.visual_anchors) ? ep.visual_anchors.map((s: unknown) => String(s).trim()) : [],
      }))
    }
    // Format C: { Ep01: {...}, Ep02: {...} } - key-value object
    else {
      const entries = Object.entries(nested)
      // Check if keys look like episode keys (Ep01, Episode_1, etc.) or have episode data
      const looksLikeEpisodes = entries.some(([key, val]) => 
        /ep|episode/i.test(key) || (val && typeof val === "object" && ("summary" in (val as object) || "setting" in (val as object)))
      )
      
      if (looksLikeEpisodes && entries.length > 0) {
        episodes = entries
          .filter(([, val]) => val && typeof val === "object")
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, val]) => {
            const ep = val as Record<string, unknown>
            return {
              key: key.trim(),
              setting: String(ep.setting ?? "").trim(),
              summary: String(ep.summary ?? "").trim(),
              special_alerts: Array.isArray(ep.special_alerts) ? ep.special_alerts.map((s: unknown) => String(s).trim()) : [],
              visual_anchors: Array.isArray(ep.visual_anchors) ? ep.visual_anchors.map((s: unknown) => String(s).trim()) : [],
            }
          })
      }
    }
  }
  console.log("[v0] Parsed episodes count:", episodes.length)

  // 3) Story summary: read from meta.story_summary (NEVER concatenate episodes)
  const meta = rawObj.meta as BibleJSON["meta"] | undefined
  const storySummary = (
    (meta as Record<string, unknown>)?.story_summary as string
    ?? (rawObj as Record<string, unknown>).story_summary as string
    ?? ""
  ).trim()

  // Validate: Step 1 - Check field EXISTENCE (separate from emptiness check)
  const hasCharacterGraphField = "character_graph" in rawObj
  const hasEpisodeIndexField = "episode_index" in rawObj
  
  // If missing required fields, check for old format fallback
  if (!hasCharacterGraphField && !hasEpisodeIndexField) {
    // Fallback: maybe it's already in the old format (story_summary + characters)
    if (rawObj.story_summary || rawObj.characters) {
      console.log("[v0] Bible already in normalized format, using as-is")
      if (!Array.isArray(rawObj.characters)) rawObj.characters = []
      return rawObj as unknown as BibleJSON
    }
    throw new Error(
      `Bible JSON is missing required fields: character_graph, episode_index. ` +
      `Top-level keys: [${Object.keys(rawObj).join(", ")}]`
    )
  }
  
  // Validate: Step 2 - Check if fields are EMPTY (different from not existing)
  const emptyFields: string[] = []
  if (hasCharacterGraphField && characters.length === 0) emptyFields.push("character_graph")
  if (hasEpisodeIndexField && episodes.length === 0) emptyFields.push("episode_index")
  
  if (emptyFields.length > 0) {
    console.warn(`[v0] Bible JSON fields exist but are empty: ${emptyFields.join(", ")}`)
    // Don't throw - empty arrays/objects are valid, just log a warning
  }
  
  // If we have at least one of characters or episodes, proceed
  if (characters.length === 0 && episodes.length === 0) {
    console.error("[v0] Bible parse failed. Raw structure:", JSON.stringify(rawObj, null, 2).substring(0, 1000))
    throw new Error(
      `Bible JSON fields exist but failed to parse. ` +
      `character_graph type: ${typeof rawObj.character_graph}, episode_index type: ${typeof rawObj.episode_index}. ` +
      `Top-level keys: [${Object.keys(rawObj).join(", ")}]`
    )
  }

  console.log(`[v0] Bible normalized: ${characters.length} characters, ${episodes.length} episodes`)

  return {
    story_summary: storySummary,
    characters,
    episodes,
    meta,
    _raw: rawObj,
  }
}

/** Fetch Voice Over Script JSON from R2 CDN.
 *  Real structure: { series_meta: {...}, parts: [{ part_id, timeline: [...] }] }
 *  We preserve the FULL raw JSON in _raw for lossless writeback.
 */
export async function fetchScriptFromR2(r2Key: string): Promise<ScriptJSON> {
  if (!r2Key) throw new Error("Script R2 Key is empty -- script not generated yet")
  const url = `${R2_CDN}/${r2Key}`
  console.log("[v0] fetchScriptFromR2 URL:", url)

  const res = await fetch(url)
  if (res.status === 404) throw new Error(`R2 404: Script not found at ${r2Key}`)
  if (!res.ok) throw new Error(`R2 ${res.status}: Failed to fetch script at ${r2Key}`)

  let raw: unknown
  try { raw = await res.json() } catch { throw new Error(`Script JSON parse failed for ${r2Key}`) }

  const rawObj = raw as Record<string, unknown>
  console.log("[v0] Script R2 raw JSON top-level keys:", Object.keys(rawObj))

  // Parse parts array
  const rawParts = rawObj.parts as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(rawParts) || rawParts.length === 0) {
    throw new Error(
      `Script JSON has no "parts" array. Top-level keys: [${Object.keys(rawObj).join(", ")}]`
    )
  }

  const parts: VOPart[] = rawParts.map((p) => {
    const timeline = Array.isArray(p.timeline)
      ? (p.timeline as Array<Record<string, unknown>>).map((evt) => ({
          ...evt,
          type: String(evt.type ?? "UNKNOWN").trim(),
          text: String(evt.text ?? "").trim(),
          visual_query: evt.visual_query ? String(evt.visual_query).trim() : undefined,
          description: evt.description ? String(evt.description).trim() : undefined,
        } as VOTimelineEvent))
      : []
    return { ...p, part_id: Number(p.part_id ?? 0), timeline } as VOPart
  })

  const totalEvents = parts.reduce((s, p) => s + p.timeline.length, 0)
  console.log(`[v0] Script normalized: ${parts.length} parts, ${totalEvents} timeline events`)

  return {
    parts,
    series_meta: rawObj.series_meta as Record<string, unknown> | undefined,
    _raw: rawObj,
  }
}

// ── Approve / Redo — per V56 spec ──────────────────────────────

/**
 * Status-based Approve routing:
 *   S3_Bible_Check  -> POST /webhook/04-review-action  { action: "approve" }
 *   S5_Script_Check -> POST /webhook/05-redo           { action: "approve" }
 *   Others          -> POST /webhook/05-redo           { action: "approve" }
 */
export async function reviewApprove(
  jobRecordId: string,
  lockToken: string,
  currentStatus: string,
) {
  // Bible phase -> 04, everything else -> 05
  const endpoint = currentStatus === "S3_Bible_Check" ? "04-review-action" : "05-redo"

  console.log(`[v0] reviewApprove -> POST /${endpoint}  { action: "approve", status: ${currentStatus} }`)

  const res = await fetch(`${N8N_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Job_Record_ID: jobRecordId,
      Lock_Token: lockToken,
      action: "approve",
    }),
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    throw new Error(`Approve failed (${endpoint}): ${res.status} ${errBody}`)
  }
  return res.json()
}

/**
 * Status-based Redo routing:
 *   S3_Bible_Check  -> POST /webhook/04-review-action  { action: "redo" }
 *   S5_Script_Check -> POST /webhook/05-redo           { action: "redo" }
 *   S8_Render       -> POST /webhook/05-redo           { action: "redo", Part_Index }
 */
export async function reviewRedo(
  jobRecordId: string,
  lockToken: string,
  currentStatus: string,
  partIndex?: number,
) {
  const endpoint = currentStatus === "S3_Bible_Check" ? "04-review-action" : "05-redo"

  const body: Record<string, unknown> = {
    Job_Record_ID: jobRecordId,
    Lock_Token: lockToken,
    action: "redo",
  }

  // For video part redo, include Part_Index as string per n8n spec
  if (partIndex !== undefined) {
    body.Part_Index = String(partIndex)
  }

  console.log(`[v0] reviewRedo -> POST /${endpoint}`, JSON.stringify(body))

  const res = await fetch(`${N8N_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    throw new Error(`Redo failed (${endpoint}): ${res.status} ${errBody}`)
  }
  return res.json()
}

/**
 * Edit & Continue (writeback to R2, then approve via correct route).
 * Works for both Bible (S3) and Script/VO (S5).
 * currentStatus is REQUIRED for routing the approve to the correct webhook.
 */
export async function reviewEditContinue(
  jobRecordId: string,
  lockToken: string,
  r2Key: string,
  editedJson: Record<string, unknown>,
  currentStatus: string,
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

  // Step 2: Approve to continue pipeline (routed by status)
  return reviewApprove(jobRecordId, lockToken, currentStatus)
}

// fetchProjectDetail has been permanently deleted.
// All review data MUST come from R2 via fetchBibleFromR2. No mock fallback.

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

/**
 * Stop a running job by updating its status to "Stopped" in Airtable
 */
export async function stopJob(jobRecordId: string): Promise<{ success: boolean }> {
  const airtableToken = process.env.NEXT_PUBLIC_AIRTABLE_TOKEN || process.env.AIRTABLE_TOKEN
  const baseId = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || "appJFy7BarX1GpBOs"
  const tableId = "tblFrameData"

  if (!airtableToken) {
    console.warn("[stopJob] No Airtable token, skipping API call")
    return { success: true }
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${baseId}/${tableId}/${jobRecordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: { Status: "Stopped" },
        }),
      }
    )
    if (!res.ok) {
      console.error("[stopJob] Airtable update failed:", res.status)
      return { success: false }
    }
    return { success: true }
  } catch (err) {
    console.error("[stopJob] Error:", err)
    return { success: false }
  }
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
