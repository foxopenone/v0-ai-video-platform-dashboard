import { NextRequest, NextResponse } from "next/server"

const DISPATCHER_URL =
  process.env.N8N_DISPATCHER_URL ||
  "https://n8n-production-8abb.up.railway.app/webhook/job-ingestion-final"

const API_KEY =
  process.env.N8N_API_KEY ||
  "7043cdf229ea2c813b1ec646264cda891c047a69"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    let body = rawBody
    try {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>
      const asr = String(parsed.ASR_Language ?? "").trim()
      if (!asr || asr.toUpperCase() === "AUTO") {
        parsed.ASR_Language = "EN"
      }
      body = JSON.stringify(parsed)
    } catch {
      // Keep raw body when payload is not valid JSON
    }

    const upstream = await fetch(DISPATCHER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body,
      cache: "no-store",
    })

    const text = await upstream.text()

    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json; charset=utf-8",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "dispatch_failed",
        message: error instanceof Error ? error.message : "Unknown dispatch error",
      },
      { status: 500 },
    )
  }
}
