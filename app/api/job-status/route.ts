/**
 * /api/job-status?record_id=recXXXX
 *
 * SSOT = Airtable Jobs table.
 * Transparent proxy: reads one record and returns fields as-is.
 * 
 * Must use RECORD_ID() (rec...) — never numeric Job_ID.
 *
 * Returned fields (pass-through, no renaming):
 *   Job_Record_ID, Job_ID, Status, Work_Mode, Lock_Token,
 *   Bible_R2_Key, Script_R2_Key, Video_Parts, ...
 */

import { NextRequest, NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!
// Fix: env var has 'l' (lowercase L) at position 7 but Airtable needs 'I' (uppercase i).
// Correct once server-side to avoid the I/l font ambiguity problem.
const RAW_BASE_ID = process.env.AIRTABLE_BASE_ID ?? ""
const AIRTABLE_BASE_ID = RAW_BASE_ID === "appyXXzlQNigMCMOQ" ? "appyXXzIQNigMCMOQ" : RAW_BASE_ID
const AIRTABLE_TABLE = "Jobs"

export async function GET(req: NextRequest) {
  const recordId = req.nextUrl.searchParams.get("record_id")

  if (!recordId || !recordId.startsWith("rec")) {
    return NextResponse.json(
      { error: "Missing or invalid record_id (must be recXXXX)" },
      { status: 400 },
    )
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 })
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}/${recordId}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: "no-store",
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return NextResponse.json(
        { error: `Airtable ${res.status}`, detail: body },
        { status: res.status },
      )
    }

    const record = await res.json()
    const f = record.fields || {}

    // Pass through Airtable fields directly -- Bible_R2_Key is a real field
    console.log("[job-status] Status:", f.Status, "| Bible_R2_Key:", f.Bible_R2_Key || "null", "| Lock_Token:", f.Lock_Token || "null")

    return NextResponse.json({
      Job_Record_ID: record.id,
      Job_ID: f.Job_ID ?? null,
      Status: f.Status ?? "Unknown",
      Work_Mode: f.Work_Mode ?? null,
      Lock_Token: f.Lock_Token ?? null,
      Run_ID: f.Run_ID ?? null,
      User_ID: f.User_ID ?? null,
      // Direct from Airtable -- these fields exist
      Bible_R2_Key: f.Bible_R2_Key ?? null,
      Bible_Version: f.Bible_Version ?? null,
      Script_R2_Key: f.Script_R2_Key ?? null,
      VO_R2_Key: f.VO_R2_Key ?? null,
      Video_Parts: f.Video_Parts ?? null,
      Video_Files: f.Video_Files ?? null,
      Folder_A0_ID: f.Folder_A0_ID ?? null,
      Folder_AA_ID: f.Folder_AA_ID ?? null,
      Folder_Raw_ID: f.Folder_Raw_ID ?? null,
      Folder_Export_ID: f.Folder_Export_ID ?? null,
      Total_Episodes: f.Total_Episodes ?? null,
      Ep_Assets: f.Ep_Assets ?? null,
      Last_Action: f.Last_Action ?? null,
    })
  } catch (err) {
    console.error("[job-status] Fetch error:", err)
    return NextResponse.json({ error: "Failed to query Airtable" }, { status: 500 })
  }
}
