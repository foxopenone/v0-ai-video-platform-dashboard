"use client"

import { useState, useEffect } from "react"
import { 
  Users, Film, Layout, ChevronUp, ChevronDown, Trash2, Edit2, 
  Search, RefreshCw, ArrowLeft, CreditCard, Eye, MoreVertical, Lock
} from "lucide-react"
import Link from "next/link"

// Simple password protection - change this password!
const ADMIN_PASSWORD = "shortee2024"

// Types
interface DiscoveryPost {
  id: string
  title: string
  author: string
  videoParts: Array<{ part: string; url: string }>
  order?: number
  createdAt?: string
}

interface User {
  id: string
  email: string
  name: string
  plan: "free" | "basic" | "pro"
  credits: number
  createdAt: string
}

interface Project {
  id: string
  title: string
  status: string
  userId: string
  userEmail?: string
  createdAt: string
}

type Tab = "discovery" | "users" | "projects"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("discovery")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Discovery state - must be before conditional return
  const [posts, setPosts] = useState<DiscoveryPost[]>([])
  
  // Users state (mock for now)
  const [users] = useState<User[]>([
    { id: "1", email: "user@example.com", name: "Demo User", plan: "free", credits: 12, createdAt: "2024-01-15" },
    { id: "2", email: "pro@example.com", name: "Pro User", plan: "pro", credits: 1250, createdAt: "2024-02-20" },
    { id: "3", email: "basic@example.com", name: "Basic User", plan: "basic", credits: 280, createdAt: "2024-03-10" },
  ])
  
  // Projects state (mock for now)
  const [projects] = useState<Project[]>([
    { id: "p1", title: "Episode 1 +4 EP", status: "ALL_DONE", userId: "1", createdAt: "2024-03-15" },
    { id: "p2", title: "Marketing Video", status: "S5_VO_Check", userId: "2", createdAt: "2024-03-14" },
    { id: "p3", title: "Tutorial Series", status: "S3_Bible_Check", userId: "3", createdAt: "2024-03-13" },
  ])
  
  // Check if already logged in + load posts
  useEffect(() => {
    const auth = localStorage.getItem("admin_auth")
    if (auth === "true") {
      setIsAuthenticated(true)
    }
    // Load posts from localStorage
    const stored = localStorage.getItem("postedItems")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setPosts(parsed.map((p: DiscoveryPost, i: number) => ({ ...p, order: i })))
      } catch (e) {
        console.error("Failed to parse postedItems:", e)
      }
    }
  }, [])

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("admin_auth", "true")
      setLoginError("")
    } else {
      setLoginError("Incorrect password")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("admin_auth")
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6 rounded-xl border border-border/50 bg-card p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-pink)]/10">
              <Lock className="h-6 w-6 text-[var(--brand-pink)]" />
            </div>
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter password to continue</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full rounded-lg border border-border/50 bg-secondary/30 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-pink)]/50"
            />
            {loginError && (
              <p className="text-xs text-red-400">{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-[var(--brand-pink)] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-pink)]/90"
            >
              Login
            </button>
          </div>
          <Link href="/" className="block text-center text-xs text-muted-foreground hover:text-foreground">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // Save posts to localStorage
  const savePosts = (newPosts: DiscoveryPost[]) => {
    setPosts(newPosts)
    localStorage.setItem("postedItems", JSON.stringify(newPosts.map(({ order, ...rest }) => rest)))
  }

  // Move post up/down
  const movePost = (index: number, direction: "up" | "down") => {
    const newPosts = [...posts]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newPosts.length) return
    ;[newPosts[index], newPosts[targetIndex]] = [newPosts[targetIndex], newPosts[index]]
    newPosts.forEach((p, i) => (p.order = i))
    savePosts(newPosts)
  }

  // Delete post
  const deletePost = (id: string) => {
    if (confirm("Delete this post? This cannot be undone.")) {
      savePosts(posts.filter((p) => p.id !== id))
    }
  }

  // Filter by search
  const filteredPosts = posts.filter((p) => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: "discovery" as Tab, label: "Discovery", icon: Layout, count: posts.length },
    { id: "users" as Tab, label: "Users", icon: Users, count: users.length },
    { id: "projects" as Tab, label: "Projects", icon: Film, count: projects.length },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to App</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 rounded-lg border border-border/40 bg-secondary/20 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--brand-purple)] focus:outline-none"
              />
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex h-9 items-center gap-2 rounded-lg border border-border/40 bg-secondary/20 px-3 text-sm text-muted-foreground hover:bg-secondary/40"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--brand-purple)] text-white"
                  : "bg-secondary/20 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id ? "bg-white/20" : "bg-secondary/40"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border/40 bg-card">
          {/* Discovery Tab */}
          {activeTab === "discovery" && (
            <div>
              <div className="border-b border-border/40 px-4 py-3">
                <h2 className="text-sm font-medium text-foreground">Discovery Posts</h2>
                <p className="text-xs text-muted-foreground">Drag to reorder, or use arrows to change position</p>
              </div>
              {filteredPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Layout className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No posts yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredPosts.map((post, index) => (
                    <div key={post.id} className="flex items-center gap-4 px-4 py-3 hover:bg-secondary/10">
                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => movePost(index, "up")}
                          disabled={index === 0}
                          className="rounded p-0.5 text-muted-foreground hover:bg-secondary/30 hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => movePost(index, "down")}
                          disabled={index === filteredPosts.length - 1}
                          className="rounded p-0.5 text-muted-foreground hover:bg-secondary/30 hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Order number */}
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/30 text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      
                      {/* Thumbnail */}
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-black">
                        {post.videoParts[0]?.url && (
                          <video
                            src={post.videoParts[0].url}
                            className="h-full w-full object-cover"
                            muted
                          />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{post.author} · {post.videoParts.length} parts</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deletePost(post.id)}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-medium text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div>
              <div className="border-b border-border/40 px-4 py-3">
                <h2 className="text-sm font-medium text-foreground">User Management</h2>
                <p className="text-xs text-muted-foreground">View and manage user accounts</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Credits</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          user.plan === "pro" 
                            ? "bg-[var(--brand-purple)]/20 text-[var(--brand-purple)]"
                            : user.plan === "basic"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-secondary/40 text-muted-foreground"
                        }`}>
                          {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          {user.credits}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.createdAt}</td>
                      <td className="px-4 py-3">
                        <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary/30 hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div>
              <div className="border-b border-border/40 px-4 py-3">
                <h2 className="text-sm font-medium text-foreground">Project Management</h2>
                <p className="text-xs text-muted-foreground">Monitor all video generation projects</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-foreground">{project.title}</p>
                        <p className="text-xs text-muted-foreground">ID: {project.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          project.status === "ALL_DONE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : project.status.includes("S3") || project.status.includes("S4")
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{project.userEmail}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{project.createdAt}</td>
                      <td className="px-4 py-3">
                        <button className="flex h-8 items-center gap-1.5 rounded-lg border border-border/40 bg-secondary/20 px-3 text-xs font-medium text-muted-foreground hover:bg-secondary/40 hover:text-foreground">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
