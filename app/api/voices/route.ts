/**
 * /api/voices
 *
 * Fetches the "voices" table from Airtable.
 * Returns: [{ name, voice_id, gender, language, preview_url }]
 *
 * Airtable fields used:
 *   - Name          -> name (display label)
 *   - ElevenLabs_ID -> voice_id (production voice_id for ElevenLabs)
 *   - Gender        -> gender (male / female / neutral)
 *   - Language       -> language (e.g. "en")
 *   - Preview_Audio -> preview_url (Airtable ATTACHMENT field: [{url, filename}])
 *
 * Caches for 5 minutes to avoid excessive Airtable reads.
 */

import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!
const RAW_BASE_ID = process.env.AIRTABLE_BASE_ID ?? ""
const AIRTABLE_BASE_ID = RAW_BASE_ID === "appyXXzlQNigMCMOQ" ? "appyXXzIQNigMCMOQ" : RAW_BASE_ID
const AIRTABLE_TABLE = "voices"

export interface VoiceRecord {
  name: string
  voice_id: string
  gender: string
  language: string
  preview_url: string | null
}

/** Extract URL from an Airtable attachment field (array of {url, filename, ...}) */
function extractAttachmentUrl(field: unknown): string | null {
  if (Array.isArray(field) && field.length > 0 && typeof field[0]?.url === "string") {
    return field[0].url
  }
  return null
}

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 })
  }

  try {
    // Fetch all records (paginate if > 100)
    let allRecords: Array<{ id: string; fields: Record<string, unknown> }> = []
    let offset: string | undefined

    do {
      const params = new URLSearchParams({ pageSize: "100" })
      if (offset) params.set("offset", offset)

      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?${params}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        next: { revalidate: 300 },
      })

      if (!res.ok) {
        const body = await res.text().catch(() => "")
        console.error("[voices] Airtable error:", res.status, body)
        return NextResponse.json(
          { error: `Airtable ${res.status}`, detail: body },
          { status: res.status },
        )
      }

      const data = await res.json()
      allRecords = allRecords.concat(data.records || [])
      offset = data.offset // undefined when no more pages
    } while (offset)

    const voices: VoiceRecord[] = allRecords
      .filter((r) => r.fields.ElevenLabs_ID)
      .map((r) => ({
        name: String(r.fields.Name || "Unnamed").trim(),
        voice_id: String(r.fields.ElevenLabs_ID).trim(),
        gender: String(r.fields.Gender || "").trim().toLowerCase(),
        language: String(r.fields.Language || "en").trim().toLowerCase(),
        preview_url: extractAttachmentUrl(r.fields.Preview_Audio),
      }))

    return NextResponse.json(voices)
  } catch (err) {
    console.error("[voices] Fetch error:", err)
    return NextResponse.json({ error: "Failed to query Airtable voices" }, { status: 500 })
  }
}
