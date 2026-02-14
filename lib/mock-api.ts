// Mock API calls that simulate n8n webhook triggers
const N8N_WEBHOOK_BASE = "https://your-n8n-instance.app/webhook"

interface WebhookPayload {
  [key: string]: unknown
}

export async function triggerWebhook(
  endpoint: string,
  payload: WebhookPayload
): Promise<{ success: boolean; message: string }> {
  // In production, replace with actual fetch to n8n
  console.log(`[n8n Webhook] ${N8N_WEBHOOK_BASE}/${endpoint}`, payload)

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  return { success: true, message: `Webhook ${endpoint} triggered successfully` }
}

export async function submitProject(data: WebhookPayload) {
  return triggerWebhook("submit-project", data)
}

export async function uploadVideo(file: File, onProgress: (progress: number) => void) {
  // Simulate upload progress
  return new Promise<{ success: boolean; url: string }>((resolve) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        resolve({
          success: true,
          url: `https://storage.example.com/${file.name}`,
        })
      }
      onProgress(Math.min(progress, 100))
    }, 300)
  })
}

export async function fetchVoices() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return [
    { id: "v1", name: "Rachel", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream" },
    { id: "v2", name: "Clyde", accent: "American", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/2EiwWnXFnvU5JabPnv8n/stream" },
    { id: "v3", name: "Domi", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/AZnzlk1XvdvUeBnXmlld/stream" },
    { id: "v4", name: "Dave", accent: "British", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/CYw3kZ02Hs0563khs1Fj/stream" },
    { id: "v5", name: "Fin", accent: "Irish", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/D38z5RcWu1voky8WS1ja/stream" },
    { id: "v6", name: "Sarah", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL/stream" },
    { id: "v7", name: "Antoni", accent: "American", gender: "Male", preview: "https://api.elevenlabs.io/v1/text-to-speech/ErXwobaYiN019PkySvjV/stream" },
    { id: "v8", name: "Elli", accent: "American", gender: "Female", preview: "https://api.elevenlabs.io/v1/text-to-speech/MF3mGyEYCl7XYWbV9V6O/stream" },
  ]
}

export async function fetchBGM() {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return [
    { id: "b1", name: "Cinematic Rise", mood: "Epic", duration: "2:34", preview: "#" },
    { id: "b2", name: "Lo-Fi Chill", mood: "Relaxed", duration: "3:12", preview: "#" },
    { id: "b3", name: "Tech Pulse", mood: "Energetic", duration: "2:48", preview: "#" },
    { id: "b4", name: "Ambient Dreams", mood: "Calm", duration: "4:01", preview: "#" },
    { id: "b5", name: "Urban Beat", mood: "Upbeat", duration: "2:22", preview: "#" },
    { id: "b6", name: "Soft Piano", mood: "Emotional", duration: "3:45", preview: "#" },
    { id: "b7", name: "Dark Synthwave", mood: "Intense", duration: "3:18", preview: "#" },
    { id: "b8", name: "Nature Flow", mood: "Peaceful", duration: "4:30", preview: "#" },
  ]
}

export async function fetchProjects() {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    { id: "p1", title: "Product Launch EP01-EP12", status: "processing" as const, progress: 67, date: "2026-02-14", thumbnail: null, episodes: 12 },
    { id: "p2", title: "Tutorial Series S02", status: "pending_review" as const, progress: 100, date: "2026-02-13", thumbnail: null, episodes: 8 },
    { id: "p3", title: "Brand Story Ads", status: "completed" as const, progress: 100, date: "2026-02-12", thumbnail: null, episodes: 5 },
    { id: "p4", title: "Podcast Highlights", status: "completed" as const, progress: 100, date: "2026-02-10", thumbnail: null, episodes: 15 },
    { id: "p5", title: "Event Recap Q1", status: "completed" as const, progress: 100, date: "2026-02-08", thumbnail: null, episodes: 6 },
    { id: "p6", title: "Customer Testimonials", status: "completed" as const, progress: 100, date: "2026-02-05", thumbnail: null, episodes: 10 },
  ]
}

export async function fetchDiscoveryFeed() {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [
    { id: "d1", title: "How AI Rewrites Content", author: "Sarah K.", likes: 1420, views: 28400, aspect: "9:16" },
    { id: "d2", title: "10x Your Shorts Output", author: "TechViral", likes: 892, views: 15600, aspect: "9:16" },
    { id: "d3", title: "From Blog to Reels", author: "ContentLab", likes: 2100, views: 45200, aspect: "1:1" },
    { id: "d4", title: "Voice Cloning Deep Dive", author: "AI Weekly", likes: 3400, views: 67800, aspect: "9:16" },
    { id: "d5", title: "Batch Processing Tips", author: "ProEditor", likes: 760, views: 12300, aspect: "9:16" },
    { id: "d6", title: "Multilingual Strategies", author: "GlobalMedia", likes: 1850, views: 31500, aspect: "1:1" },
    { id: "d7", title: "Hook Patterns That Work", author: "GrowthHQ", likes: 4200, views: 89100, aspect: "9:16" },
    { id: "d8", title: "Auto-Caption Mastery", author: "SubStudio", likes: 1100, views: 21700, aspect: "9:16" },
    { id: "d9", title: "Trending Sound Design", author: "AudioPro", likes: 980, views: 17400, aspect: "1:1" },
    { id: "d10", title: "Platform Algorithm Hacks", author: "ViralScience", likes: 5600, views: 112000, aspect: "9:16" },
    { id: "d11", title: "Storytelling Frameworks", author: "NarrativeAI", likes: 2300, views: 39800, aspect: "9:16" },
    { id: "d12", title: "Color Grading for Shorts", author: "VisualPro", likes: 1650, views: 27900, aspect: "1:1" },
  ]
}
