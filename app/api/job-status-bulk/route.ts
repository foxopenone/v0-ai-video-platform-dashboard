import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!
const RAW_BASE_ID = process.env.AIRTABLE_BASE_ID ?? ""
const AIRTABLE_BASE_ID = RAW_BASE_ID === "appyXXzlQNigMCMOQ" ? "appyXXzIQNigMCMOQ" : RAW_BASE_ID
const AIRTABLE_TABLE = "Jobs"

const normalizeRecord = (record: Record<string, unknown>) => {
  const f = (record.fields || {}) as Record<string, unknown>
  const t = (v: unknown): string | null => (typeof v === "string" ? v.trim() : null)

  return {
    Job_Record_ID: String(record.id || ""),
    Job_ID: f.Job_ID ?? null,
    Status: t(f.Status) ?? "Unknown",
    Callback_Status: t(f.Callback_Status),
    Callback_Error: t(f.Callback_Error),
    Process_Success: typeof f.Process_Success === "boolean" ? f.Process_Success : null,
    Work_Mode: t(f.Work_Mode),
    Lock_Token: t(f.Lock_Token),
    Run_ID: t(f.Run_ID),
    User_ID: t(f.User_ID),
    Bible_R2_Key: t(f.Bible_R2_Key),
    Bible_Version: f.Bible_Version ?? null,
    Script_R2_Key: t(f.Script_R2_Key),
    VO_R2_Key: t(f.VO_R2_Key),
    Video_Parts: f.Video_Parts ?? null,
    Video_Files: f.Video_Files ?? null,
    Folder_A0_ID: t(f.Folder_A0_ID),
    Folder_AA_ID: t(f.Folder_AA_ID),
    Folder_Raw_ID: t(f.Folder_Raw_ID),
    Folder_Export_ID: t(f.Folder_Export_ID),
    Target_Parts: f.Target_Parts ?? null,
    Total_Episodes: f.Total_Episodes ?? null,
    Ep_Assets: f.Ep_Assets ?? null,
    Last_Action: t(f.Last_Action),
    Last_Error: t(f.Last_Error) || t(f.Error_Message) || t(f.Error),
    Final_Video: f.Final_Video ?? null,
  }
}

export async function POST(req: NextRequest) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const recordIds = Array.isArray(body?.record_ids)
      ? body.record_ids.filter((id: unknown) => typeof id === "string" && id.startsWith("rec"))
      : []

    if (recordIds.length === 0) {
      return NextResponse.json({ error: "Missing record_ids" }, { status: 400 })
    }

    const formula = `OR(${recordIds.map((id: string) => `RECORD_ID()='${id}'`).join(",")})`
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`)
    url.searchParams.set("filterByFormula", formula)
    url.searchParams.set("pageSize", String(Math.min(recordIds.length, 100)))

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: "no-store",
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      return NextResponse.json({ error: `Airtable ${res.status}`, detail }, { status: res.status })
    }

    const data = await res.json()
    const records = Array.isArray(data?.records) ? data.records : []
    const normalized = records.map(normalizeRecord)

    return NextResponse.json({ records: normalized })
  } catch (error) {
    console.error("[job-status-bulk] Fetch error:", error)
    return NextResponse.json({ error: "Failed to query Airtable" }, { status: 500 })
  }
}
