import { NextResponse } from "next/server"

const DISPATCHER_URL =
  "https://n8n-production-8abb.up.railway.app/webhook/job-dispatcher-01a"

const API_KEY = "7043cdf229ea2c813b1ec646264cda891c047a69"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const res = await fetch(DISPATCHER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()

    if (!res.ok) {
      return NextResponse.json(
        { error: `n8n responded with ${res.status}`, detail: text },
        { status: res.status }
      )
    }

    // Forward whatever n8n sent back
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text || "OK" }
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown proxy error"
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
