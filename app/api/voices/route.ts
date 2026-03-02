/**
 * /api/voices
 *
 * Fetches the "voices" table from Airtable.
 * Returns: [{ name, voice_id, preview_url }]
 *
 * Airtable fields used:
 *   - Name          -> name (display label)
 *   - ElevenLabs_ID -> voice_id (production voice_id for ElevenLabs)
 *   - Preview_Audio -> preview_url (optional audio preview URL)
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
  preview_url: string | null
}

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 })
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}?pageSize=100`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      next: { revalidate: 300 }, // cache 5 min
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
    const records: Array<{ id: string; fields: Record<string, unknown> }> = data.records || []

    const voices: VoiceRecord[] = records
      .filter((r) => r.fields.ElevenLabs_ID) // must have a voice_id
      .map((r) => ({
        name: String(r.fields.Name || "Unnamed").trim(),
        voice_id: String(r.fields.ElevenLabs_ID).trim(),
        preview_url: r.fields.Preview_Audio
          ? String(r.fields.Preview_Audio).trim()
          : null,
      }))

    return NextResponse.json(voices)
  } catch (err) {
    console.error("[voices] Fetch error:", err)
    return NextResponse.json({ error: "Failed to query Airtable voices" }, { status: 500 })
  }
}
