import { Header } from "@/components/dashboard/header"
import { WorkspaceSection } from "@/components/dashboard/workspace-section"
import { ProjectsSection } from "@/components/dashboard/projects-section"
import { DiscoveryFeed } from "@/components/dashboard/discovery-feed"
import { Separator } from "@/components/ui/separator"

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <WorkspaceSection />
        <Separator className="mx-6 bg-border/30" />
        <ProjectsSection />
        <Separator className="mx-6 bg-border/30" />
        <DiscoveryFeed />
      </main>

      <footer className="border-t border-border/30 px-6 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-xs text-muted-foreground">
            ClipForge AI Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Documentation
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              API Status
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
