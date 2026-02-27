/**
 * TEMPORARY debug endpoint — returns raw Airtable data so we can see field names.
 * DELETE THIS after field mapping is confirmed.
 */
import { NextResponse } from "next/server"

export async function GET() {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({
      error: "Missing env vars",
      has_api_key: !!AIRTABLE_API_KEY,
      has_base_id: !!AIRTABLE_BASE_ID,
    })
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs?maxRecords=3`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: "no-store",
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return NextResponse.json({
        error: `Airtable HTTP ${res.status}`,
        body,
      })
    }

    const data = await res.json()
    // Return raw records so we can see exact field names
    return NextResponse.json({
      record_count: data.records?.length ?? 0,
      raw_records: data.records?.map((r: { id: string; fields: Record<string, unknown> }) => ({
        id: r.id,
        fields: r.fields,
      })),
    })
  } catch (err) {
    return NextResponse.json({
      error: String(err),
    })
  }
}
