import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-[400px] rounded-2xl border border-border/30 bg-card p-8 text-center">
        <div className="mb-4 text-4xl">!</div>
        <h1 className="mb-2 text-lg font-semibold text-foreground">Authentication Error</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {params?.error || "An unspecified error occurred during authentication."}
        </p>
        <Link
          href="/login"
          className="brand-gradient inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-[#fff] transition-opacity hover:opacity-90"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
