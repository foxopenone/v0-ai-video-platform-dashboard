/**
 * /api/bible-ready
 *
 * POST — n8n calls this when Status = S3_Bible_Check.
 *   Body: {
 *     Job_Record_ID: "rec_xxx",
 *     Job_ID: 233,
 *     Lock_Token: "run_xxx",
 *     Bible_R2_Key: "users/.../03_brain/series_bible.json",
 *     Status: "S3_Bible_Check"
 *   }
 *
 * GET  — Frontend polls with ?job_id=xxx or ?latest=true
 *   Returns: { ready: true/false, ...data }
 *
 * Persisted in Supabase table: bible_callbacks
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

/** n8n POSTs here when Bible generation is complete (S3_Bible_Check) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { Job_Record_ID, Job_ID, Lock_Token, Bible_R2_Key, Status } = body

    if (!Job_Record_ID || Job_ID === undefined || !Bible_R2_Key) {
      return NextResponse.json(
        { error: "Missing required fields: Job_Record_ID, Job_ID, Bible_R2_Key" },
        { status: 400 }
      )
    }

    const jobIdStr = String(Job_ID)

    const { error } = await supabase.from("bible_callbacks").insert({
      job_id: jobIdStr,
      job_record_id: Job_Record_ID,
      lock_token: Lock_Token || "",
      bible_r2_key: Bible_R2_Key,
      status: Status || "S3_Bible_Check",
    })

    if (error) {
      console.error("[bible-ready] Supabase insert error:", error)
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, Job_ID: jobIdStr })
  } catch (err) {
    console.error("[bible-ready] POST error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

/** Frontend polls here to check if Bible is ready */
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("job_id")
  const latest = req.nextUrl.searchParams.get("latest")

  // ?latest=true — return the most recent callback (fallback when Job_ID unknown)
  if (latest === "true") {
    const { data } = await supabase
      .from("bible_callbacks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      return NextResponse.json({
        ready: true,
        Job_Record_ID: data.job_record_id,
        Job_ID: data.job_id,
        Lock_Token: data.lock_token,
        Bible_R2_Key: data.bible_r2_key,
        Status: data.status,
      })
    }
    return NextResponse.json({ ready: false })
  }

  // ?job_id=xxx — exact match
  if (!jobId) {
    return NextResponse.json({ error: "Missing job_id or latest param" }, { status: 400 })
  }

  const { data } = await supabase
    .from("bible_callbacks")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (data) {
    return NextResponse.json({
      ready: true,
      Job_Record_ID: data.job_record_id,
      Job_ID: data.job_id,
      Lock_Token: data.lock_token,
      Bible_R2_Key: data.bible_r2_key,
      Status: data.status,
    })
  }

  return NextResponse.json({ ready: false })
}
