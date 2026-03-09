import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/40 bg-secondary/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Payment Successful!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for your purchase. Your credits have been added to your account.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-lg bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-purple)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
