/**
 * /api/voices
 *
 * Fetches voices from both "voices" (ElevenLabs) and "Azure_Voices" tables.
 * Returns: [{ name, voice_id, gender, language, preview_url, provider }]
 *
 * ElevenLabs table fields:
 *   - Name          -> name (display label)
 *   - ElevenLabs_ID -> voice_id (production voice_id for ElevenLabs)
 *   - Gender        -> gender (male / female / neutral)
 *   - Language      -> language (e.g. "en")
 *   - Preview_Audio -> preview_url (Airtable ATTACHMENT field)
 *
 * Azure table fields:
 *   - Name          -> name (display label)
 *   - Azure_ID      -> voice_id (Azure voice identifier, e.g. "zh-CN-XiaoxiaoNeural")
 *   - Gender        -> gender
 *   - Language      -> language (e.g. "zh-CN")
 *   - Preview_Audio -> preview_url (direct URL string, NOT attachment)
 *
 * Caches for 5 minutes to avoid excessive Airtable reads.
 */

import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!
const RAW_BASE_ID = process.env.AIRTABLE_BASE_ID ?? ""
const AIRTABLE_BASE_ID = RAW_BASE_ID === "appyXXzlQNigMCMOQ" ? "appyXXzIQNigMCMOQ" : RAW_BASE_ID

export interface VoiceRecord {
  name: string
  voice_id: string
  gender: string
  language: string
  preview_url: string | null
  provider: "ElevenLabs" | "Azure"
}

/** Extract URL from an Airtable attachment field (array of {url, filename, ...}) */
function extractAttachmentUrl(field: unknown): string | null {
  if (Array.isArray(field) && field.length > 0 && typeof field[0]?.url === "string") {
    return field[0].url
  }
  return null
}

/** Fetch all records from an Airtable table with pagination */
async function fetchAirtableTable(tableName: string): Promise<Array<{ id: string; fields: Record<string, unknown> }>> {
  const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams({ pageSize: "100" })
    if (offset) params.set("offset", offset)

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${params}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: "no-store", // Always fetch fresh data from Airtable
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error(`[voices] Airtable error for ${tableName}:`, res.status, body)
      throw new Error(`Airtable ${res.status}: ${body}`)
    }

    const data = await res.json()
    allRecords.push(...(data.records || []))
    offset = data.offset
  } while (offset)

  return allRecords
}

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 })
  }

  try {
    // Fetch from both tables in parallel
    const [elevenLabsRecords, azureRecords] = await Promise.all([
      fetchAirtableTable("voices").catch((e) => { console.error("[voices] ElevenLabs fetch error:", e); return [] }),
      fetchAirtableTable("Azure_Voices").catch((e) => { console.error("[voices] Azure fetch error:", e); return [] }),
    ])

    // Parse ElevenLabs voices
    const elevenLabsVoices: VoiceRecord[] = elevenLabsRecords
      .filter((r) => r.fields.ElevenLabs_ID)
      .map((r) => ({
        name: String(r.fields.Name || "Unnamed").trim(),
        voice_id: String(r.fields.ElevenLabs_ID).trim(),
        gender: String(r.fields.Gender || "").trim().toLowerCase(),
        language: String(r.fields.Language || "en").trim().toLowerCase(),
        preview_url: extractAttachmentUrl(r.fields.Preview_Audio),
        provider: "ElevenLabs" as const,
      }))

    // Parse Azure voices
    // Azure table uses Azure_ID as the voice identifier (e.g. "zh-CN-XiaoxiaoNeural")
    // Preview_Audio is a direct URL string, NOT an attachment array
    const azureVoices: VoiceRecord[] = azureRecords
      .filter((r) => r.fields.Azure_ID)
      .map((r) => {
        const lang = String(r.fields.Language || "zh-CN").trim().toLowerCase()
        // Normalize language: "zh-cn" -> "zh", keep others as-is
        const normalizedLang = lang.startsWith("zh") ? "zh" : lang.split("-")[0] || "zh"
        return {
          name: String(r.fields.Name || "Unnamed").trim(),
          voice_id: `azure:${String(r.fields.Azure_ID || "").trim()}`, // Prefix with azure:
          gender: String(r.fields.Gender || "").trim().toLowerCase(),
          language: normalizedLang,
          preview_url: typeof r.fields.Preview_Audio === "string" ? r.fields.Preview_Audio : null,
          provider: "Azure" as const,
        }
      })

    // Merge and return all voices with cache headers
    const allVoices = [...elevenLabsVoices, ...azureVoices]
    return NextResponse.json(allVoices, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (err) {
    console.error("[voices] Fetch error:", err)
    return NextResponse.json({ error: "Failed to query Airtable voices" }, { status: 500 })
  }
}
