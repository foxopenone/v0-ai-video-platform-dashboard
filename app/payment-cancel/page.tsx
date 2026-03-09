import Link from "next/link"
import { XCircle } from "lucide-react"

export default function PaymentCancelPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-secondary/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Payment Cancelled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your payment was cancelled. No charges were made to your account.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/#pricing"
            className="w-full rounded-lg bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-purple)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="w-full rounded-lg border border-border/40 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/30 hover:text-foreground"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
