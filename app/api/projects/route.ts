/**
 * /api/projects
 *
 * Lists all jobs from Airtable, mapped to the card format the frontend expects.
 * SSOT = Airtable Jobs table.
 */

import { NextResponse } from "next/server"

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!
const AIRTABLE_TABLE = "Jobs"

// Map Airtable Status to frontend card status
function mapStatus(
  s: string,
): "processing" | "pending_review" | "completed" {
  if (!s) return "processing"
  // Any review-check status => pending_review
  if (s.includes("Check")) return "pending_review"
  // Final status
  if (s === "S9_Done" || s === "Done" || s === "Completed") return "completed"
  // Everything else is still processing
  return "processing"
}

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return NextResponse.json([])
  }

  try {
    // List records sorted by Created descending, max 50
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`,
    )
    url.searchParams.set("maxRecords", "50")
    url.searchParams.set("sort[0][field]", "Created")
    url.searchParams.set("sort[0][direction]", "desc")

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      cache: "no-store",
    })

    if (!res.ok) {
      console.error("[api/projects] Airtable error:", res.status)
      return NextResponse.json([])
    }

    const data = await res.json()
    const records = data.records || []

    const projects = records.map(
      (rec: { id: string; fields: Record<string, unknown> }) => {
        const f = rec.fields
        const status = mapStatus(String(f.Status || ""))
        return {
          id: rec.id,
          title: String(f.Title || f.Project_Name || `Job ${f.Job_ID || rec.id.slice(-6)}`),
          status,
          progress: status === "completed" ? 100 : status === "pending_review" ? 100 : 50,
          date: f.Created
            ? String(f.Created).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          thumbnail: null,
          episodes: Number(f.Episode_Count || f.Video_Count || 1),
          airtableRecordId: rec.id,
        }
      },
    )

    return NextResponse.json(projects)
  } catch (err) {
    console.error("[api/projects] Error:", err)
    return NextResponse.json([])
  }
}
