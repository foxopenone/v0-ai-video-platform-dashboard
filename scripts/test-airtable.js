// Thorough Airtable connectivity test
const RAW_KEY = process.env.AIRTABLE_API_KEY || ""
const RAW_BASE = process.env.AIRTABLE_BASE_ID || ""

// Trim whitespace/newlines that might have snuck in
const KEY = RAW_KEY.trim()
const BASE = RAW_BASE.trim()

console.log("=== Airtable Thorough Connectivity Test ===")
console.log("AIRTABLE_API_KEY length:", KEY.length)
console.log("AIRTABLE_API_KEY first 10 chars:", JSON.stringify(KEY.substring(0, 10)))
console.log("AIRTABLE_API_KEY last 5 chars:", JSON.stringify(KEY.substring(KEY.length - 5)))
console.log("AIRTABLE_API_KEY has whitespace:", KEY !== RAW_KEY ? "YES (TRIMMED)" : "No")
console.log("AIRTABLE_BASE_ID raw:", JSON.stringify(RAW_BASE))
console.log("AIRTABLE_BASE_ID trimmed:", JSON.stringify(BASE))
console.log("AIRTABLE_BASE_ID length:", BASE.length)
console.log("AIRTABLE_BASE_ID has whitespace:", BASE !== RAW_BASE ? "YES (TRIMMED)" : "No")

// Print each character of BASE_ID with char code to catch I/l confusion
console.log("\nBase ID character analysis:")
for (let i = 0; i < BASE.length; i++) {
  console.log(`  [${i}] '${BASE[i]}' charCode=${BASE.charCodeAt(i)}`)
}

if (!KEY || !BASE) {
  console.error("FATAL: Missing env vars.")
  process.exit(1)
}

// Try multiple combinations
const TABLE_NAME = "Jobs"
const TABLE_ID = "tblD7QCg8U3hzNKZN"  // From Airtable URL bar screenshot

// Also try the Base ID with I (uppercase) instead of l (lowercase) in case of confusion
const BASE_ALT = BASE.replace(/l/g, 'I')  // Replace all lowercase L with uppercase I
const BASE_ALT2 = BASE.replace(/I/g, 'l')  // Replace all uppercase I with lowercase L

const combos = [
  { label: "Original BASE + table name", base: BASE, table: TABLE_NAME },
  { label: "Original BASE + table ID", base: BASE, table: TABLE_ID },
]

// Only add alternates if they differ from original
if (BASE_ALT !== BASE) {
  combos.push({ label: "BASE (l->I) + table name", base: BASE_ALT, table: TABLE_NAME })
  combos.push({ label: "BASE (l->I) + table ID", base: BASE_ALT, table: TABLE_ID })
}
if (BASE_ALT2 !== BASE && BASE_ALT2 !== BASE_ALT) {
  combos.push({ label: "BASE (I->l) + table name", base: BASE_ALT2, table: TABLE_NAME })
  combos.push({ label: "BASE (I->l) + table ID", base: BASE_ALT2, table: TABLE_ID })
}

for (const combo of combos) {
  const url = `https://api.airtable.com/v0/${combo.base}/${combo.table}?maxRecords=1`
  console.log(`\n--- ${combo.label} ---`)
  console.log(`URL: ${url}`)
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${KEY}` },
    })
    console.log(`HTTP ${res.status}`)
    if (res.ok) {
      const data = await res.json()
      console.log(`SUCCESS! Records: ${data.records?.length}`)
      if (data.records?.[0]) {
        const f = data.records[0].fields
        console.log(`  Record ID: ${data.records[0].id}`)
        console.log(`  Job_ID: ${f.Job_ID}`)
        console.log(`  Status: ${f.Status}`)
      }
      console.log(`\n*** WORKING COMBO: base=${combo.base}, table=${combo.table} ***`)
      
      // If this works, also test the specific record
      console.log(`\n--- Bonus: Fetch recjWDwY4XlxwJAUY with working combo ---`)
      const res2 = await fetch(`https://api.airtable.com/v0/${combo.base}/${combo.table}/recjWDwY4XlxwJAUY`, {
        headers: { Authorization: `Bearer ${KEY}` },
      })
      console.log(`HTTP ${res2.status}`)
      if (res2.ok) {
        const rec = await res2.json()
        console.log(`Record: ${rec.id}`)
        console.log(`All fields:`, JSON.stringify(rec.fields, null, 2))
      } else {
        const errBody = await res2.text()
        console.log(`Failed: ${errBody}`)
      }
      
      // Stop after first success
      break
    } else {
      const errBody = await res.text()
      console.log(`Failed: ${errBody.substring(0, 200)}`)
    }
  } catch (err) {
    console.log(`Exception: ${err.message}`)
  }
}

console.log("\n=== Test Complete ===")
