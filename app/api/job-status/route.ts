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
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!
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

    // Return fields with original Airtable names — no renaming
    console.log("[job-status] Record fields:", JSON.stringify(f))

    // Extract user UUID and Job_ID from Folder_A0_ID if available
    // Format: "users/{uuid}/jobs/{jobNum}/02_a0"
    let extractedUserId: string | null = null
    const folderPath = f.Folder_A0_ID || f.Folder_AA_ID || ""
    const folderMatch = folderPath.match?.(/users\/([a-f0-9-]+)\/jobs\/(\d+)/)
    if (folderMatch) {
      extractedUserId = folderMatch[1]
    }

    // Construct Bible R2 key from convention since Airtable doesn't have Bible_R2_Key field
    let bibleR2Key: string | null = null
    if (f.Status === "S3_Bible_Check" && extractedUserId && f.Job_ID) {
      bibleR2Key = `users/${extractedUserId}/jobs/${f.Job_ID}/03_brain/series_bible.json`
      console.log("[job-status] Constructed Bible R2 key:", bibleR2Key)
    }

    let scriptR2Key: string | null = null
    if (f.Status === "S5_Script_Check" && extractedUserId && f.Job_ID) {
      scriptR2Key = `users/${extractedUserId}/jobs/${f.Job_ID}/04_script/script.json`
      console.log("[job-status] Constructed Script R2 key:", scriptR2Key)
    }

    return NextResponse.json({
      Job_Record_ID: record.id,
      Job_ID: f.Job_ID ?? null,
      Status: f.Status ?? "Unknown",
      Work_Mode: f.Work_Mode ?? null,
      Lock_Token: f.Lock_Token ?? null,
      Run_ID: f.Run_ID ?? null,
      // Bible_R2_Key: constructed from convention (Airtable doesn't have this field)
      Bible_R2_Key: bibleR2Key,
      Script_R2_Key: scriptR2Key,
      VO_R2_Key: null,
      Video_Parts: f.Video_Parts ?? null,
      // Pass extracted user ID so frontend doesn't need localStorage for it
      Extracted_User_ID: extractedUserId,
      Folder_A0_ID: f.Folder_A0_ID ?? null,
      Folder_AA_ID: f.Folder_AA_ID ?? null,
    })
  } catch (err) {
    console.error("[job-status] Fetch error:", err)
    return NextResponse.json({ error: "Failed to query Airtable" }, { status: 500 })
  }
}
