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
 * GET  — Frontend polls with ?job_id=xxx to check if Bible is ready.
 *   Returns: { ready: true/false, ...data }
 */

import { NextRequest, NextResponse } from "next/server"

// In-memory store for pending Bible callbacks
// Key: Job_ID (string), Value: callback data + timestamp
const pendingBibles = new Map<
  string,
  {
    Job_Record_ID: string
    Job_ID: string
    Lock_Token: string
    Bible_R2_Key: string
    Status: string
    timestamp: number
  }
>()

// Clean up entries older than 2 hours
function cleanup() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
  for (const [key, val] of pendingBibles.entries()) {
    if (val.timestamp < twoHoursAgo) pendingBibles.delete(key)
  }
}

/** n8n POSTs here when Bible generation is complete (S3_Bible_Check) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { Job_Record_ID, Job_ID, Lock_Token, Bible_R2_Key, Status } = body

    if (!Job_Record_ID || Job_ID === undefined || !Bible_R2_Key) {
      console.error("[bible-ready] Missing fields. Got:", JSON.stringify(body))
      return NextResponse.json(
        { error: "Missing required fields: Job_Record_ID, Job_ID, Bible_R2_Key" },
        { status: 400 }
      )
    }

    const jobIdStr = String(Job_ID)
    console.log("[bible-ready] Received callback:", { Job_Record_ID, Job_ID: jobIdStr, Lock_Token, Bible_R2_Key, Status })

    pendingBibles.set(jobIdStr, {
      Job_Record_ID,
      Job_ID: jobIdStr,
      Lock_Token: Lock_Token || "",
      Bible_R2_Key,
      Status: Status || "S3_Bible_Check",
      timestamp: Date.now(),
    })

    cleanup()

    return NextResponse.json({ ok: true, Job_ID: jobIdStr })
  } catch (err) {
    console.error("[bible-ready] POST error:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}

/** Frontend polls here to check if Bible is ready */
export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("job_id")

  if (!jobId) {
    return NextResponse.json({ error: "Missing job_id param" }, { status: 400 })
  }

  const data = pendingBibles.get(jobId)

  if (data) {
    return NextResponse.json({
      ready: true,
      Job_Record_ID: data.Job_Record_ID,
      Job_ID: data.Job_ID,
      Lock_Token: data.Lock_Token,
      Bible_R2_Key: data.Bible_R2_Key,
      Status: data.Status,
    })
  }

  return NextResponse.json({ ready: false })
}
