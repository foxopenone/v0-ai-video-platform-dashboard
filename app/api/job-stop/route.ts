import { NextRequest, NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!
const RAW_BASE_ID = process.env.AIRTABLE_BASE_ID ?? ""
const AIRTABLE_BASE_ID = RAW_BASE_ID === "appyXXzlQNigMCMOQ" ? "appyXXzIQNigMCMOQ" : RAW_BASE_ID
const AIRTABLE_TABLE = "Jobs"

export async function POST(req: NextRequest) {
  let body: { Job_Record_ID?: string } = {}

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const recordId = String(body.Job_Record_ID || "").trim()
  if (!recordId || !recordId.startsWith("rec")) {
    return NextResponse.json({ error: "Missing or invalid Job_Record_ID" }, { status: 400 })
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 })
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${recordId}`
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Status: "Stopped",
          Last_Action: "Stopped_By_User",
        },
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return NextResponse.json(
        { error: `Airtable ${res.status}`, detail },
        { status: res.status },
      )
    }

    return NextResponse.json({ success: true, Status: "Stopped" })
  } catch (err) {
    console.error("[job-stop] Patch error:", err)
    return NextResponse.json({ error: "Failed to stop job" }, { status: 500 })
  }
}
