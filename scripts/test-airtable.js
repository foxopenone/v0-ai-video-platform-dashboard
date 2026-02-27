// Test Airtable connectivity with current env vars
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID

console.log("=== Airtable Connectivity Test ===")
console.log("AIRTABLE_API_KEY exists:", !!AIRTABLE_API_KEY)
console.log("AIRTABLE_API_KEY prefix:", AIRTABLE_API_KEY ? AIRTABLE_API_KEY.substring(0, 6) + "..." : "MISSING")
console.log("AIRTABLE_BASE_ID:", AIRTABLE_BASE_ID || "MISSING")

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error("FATAL: Missing env vars. Cannot test.")
  process.exit(1)
}

// Test 1: List records from Jobs table (limit 1)
const listUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs?maxRecords=1`
console.log("\n--- Test 1: List Jobs (limit 1) ---")
console.log("URL:", listUrl)

try {
  const res = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  })
  console.log("HTTP Status:", res.status)
  const body = await res.text()
  if (res.ok) {
    const data = JSON.parse(body)
    if (data.records && data.records.length > 0) {
      const rec = data.records[0]
      console.log("SUCCESS - Record ID:", rec.id)
      console.log("Fields:", JSON.stringify(rec.fields, null, 2))

      // Test 2: Fetch that specific record by ID
      console.log("\n--- Test 2: Fetch record by ID ---")
      const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs/${rec.id}`
      const res2 = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      })
      console.log("HTTP Status:", res2.status)
      if (res2.ok) {
        const rec2 = await res2.json()
        console.log("SUCCESS - Record fetched:", rec2.id)
        console.log("Status field:", rec2.fields?.Status)
        console.log("Job_ID field:", rec2.fields?.Job_ID)
        console.log("Folder_A0_ID:", rec2.fields?.Folder_A0_ID || "NOT SET")
        console.log("Folder_AA_ID:", rec2.fields?.Folder_AA_ID || "NOT SET")
        console.log("Lock_Token:", rec2.fields?.Lock_Token || "NOT SET")
      } else {
        console.error("FAILED:", await res2.text())
      }
    } else {
      console.log("No records found in Jobs table")
    }
  } else {
    console.error("FAILED:", body)
  }
} catch (err) {
  console.error("EXCEPTION:", err.message)
}

// Test 3: Try to fetch the specific record from user's screenshot
console.log("\n--- Test 3: Fetch recjWDwY4XlxwJAUY (Job 257) ---")
try {
  const getUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Jobs/recjWDwY4XlxwJAUY`
  const res3 = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
  })
  console.log("HTTP Status:", res3.status)
  const body3 = await res3.text()
  if (res3.ok) {
    const rec3 = JSON.parse(body3)
    console.log("SUCCESS - Full record fields:")
    console.log(JSON.stringify(rec3.fields, null, 2))
  } else {
    console.error("FAILED:", body3)
  }
} catch (err) {
  console.error("EXCEPTION:", err.message)
}
