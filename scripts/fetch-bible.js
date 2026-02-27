// Fetch the actual Bible JSON from R2 to inspect its structure
const R2_CDN = process.env.NEXT_PUBLIC_R2_CDN_URL || "https://video.aihers.live"
const key = "users/f3cf8d14-967e-4a7b-adfb-e579268fea51/jobs/263/03_brain/series_bible.json"
const url = `${R2_CDN}/${key}`

console.log("Fetching:", url)

const res = await fetch(url)
console.log("Status:", res.status)

if (!res.ok) {
  console.log("Error:", await res.text().catch(() => "N/A"))
  process.exit(1)
}

const data = await res.json()

// Print full structure
console.log("\n=== TOP-LEVEL KEYS ===")
console.log(Object.keys(data))

console.log("\n=== FULL JSON (pretty, first 3000 chars) ===")
console.log(JSON.stringify(data, null, 2).slice(0, 3000))

// Examine each top-level key
for (const [k, v] of Object.entries(data)) {
  const type = Array.isArray(v) ? `array[${v.length}]` : typeof v
  console.log(`\n--- Key: "${k}" | Type: ${type} ---`)
  if (typeof v === "object" && v !== null) {
    if (Array.isArray(v)) {
      console.log("First item keys:", v.length > 0 ? Object.keys(v[0]) : "empty")
      if (v.length > 0) console.log("First item:", JSON.stringify(v[0]).slice(0, 500))
    } else {
      console.log("Sub-keys:", Object.keys(v))
      console.log("Preview:", JSON.stringify(v).slice(0, 500))
    }
  } else {
    console.log("Value:", String(v).slice(0, 300))
  }
}
