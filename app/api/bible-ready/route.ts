/**
 * /api/bible-ready
 *
 * POST — n8n calls this when Bible generation is done.
 *   Body: { job_id, Job_Record_ID, Lock_Token, Bible_R2_Key }
 *
 * GET  — Frontend polls this with ?job_id=xxx to check if Bible is ready.
 *   Returns: { ready: true/false, ...data }
 */

import { NextRequest, NextResponse } from "next/server"

// In-memory store for pending Bible callbacks
// Key: job_id, Value: { Job_Record_ID, Lock_Token, Bible_R2_Key, timestamp }
const pendingBibles = new Map<
  string,
  {
    Job_Record_ID: string
    Lock_Token: string
    Bible_R2_Key: string
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

/** n8n POSTs here when Bible is ready */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { job_id, Job_Record_ID, Lock_Token, Bible_R2_Key } = body

    if (!job_id || !Job_Record_ID || !Bible_R2_Key) {
      return NextResponse.json(
        { error: "Missing required fields: job_id, Job_Record_ID, Bible_R2_Key" },
        { status: 400 }
      )
    }

    console.log("[bible-ready] Received callback for job:", job_id)
    console.log("[bible-ready] Data:", { Job_Record_ID, Lock_Token, Bible_R2_Key })

    pendingBibles.set(job_id, {
      Job_Record_ID,
      Lock_Token: Lock_Token || "",
      Bible_R2_Key,
      timestamp: Date.now(),
    })

    cleanup()

    return NextResponse.json({ ok: true, job_id })
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
    // Don't delete yet -- frontend might poll multiple times
    return NextResponse.json({
      ready: true,
      Job_Record_ID: data.Job_Record_ID,
      Lock_Token: data.Lock_Token,
      Bible_R2_Key: data.Bible_R2_Key,
    })
  }

  return NextResponse.json({ ready: false })
}
