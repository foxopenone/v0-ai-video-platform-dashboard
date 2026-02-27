/**
 * /api/job-status?record_id=recXXX
 *
 * Polls Airtable Jobs table (the SSOT) for a job's current status.
 * When Status == "S3_Bible_Check", returns Bible_R2_Key for frontend to fetch.
 *
 * Returns:
 *   { Status, Bible_R2_Key?, Job_ID?, Lock_Token?, ... }
 */

import { NextRequest, NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!
const AIRTABLE_TABLE = "Jobs"

export async function GET(req: NextRequest) {
  const recordId = req.nextUrl.searchParams.get("record_id")

  if (!recordId) {
    return NextResponse.json({ error: "Missing record_id param" }, { status: 400 })
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 })
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${recordId}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
      // Never cache -- always get latest
      cache: "no-store",
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      console.error("[job-status] Airtable error:", res.status, body)
      return NextResponse.json(
        { error: `Airtable ${res.status}`, detail: body },
        { status: res.status }
      )
    }

    const record = await res.json()
    const fields = record.fields || {}

    return NextResponse.json({
      record_id: record.id,
      Job_ID: fields.Job_ID ?? null,
      Status: fields.Status ?? "Unknown",
      Bible_R2_Key: fields.Bible_R2_Key ?? null,
      Lock_Token: fields.Lock_Token ?? null,
      // Include any other useful fields
      Work_Mode: fields.Work_Mode ?? null,
      Created_At: fields.Created_At ?? null,
    })
  } catch (err) {
    console.error("[job-status] Fetch error:", err)
    return NextResponse.json({ error: "Failed to query Airtable" }, { status: 500 })
  }
}
