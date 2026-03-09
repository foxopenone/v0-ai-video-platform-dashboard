"use client"

import { useState } from "react"
import { Check, Zap, Crown, CreditCard, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingSectionProps {
  currentPlan?: "free" | "basic" | "pro"
  userCredits?: number
}

const CREDIT_AMOUNTS = [10, 20, 30, 50, 100]

export function PricingSection({ currentPlan = "free", userCredits = 12 }: PricingSectionProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [selectedCreditAmount, setSelectedCreditAmount] = useState<number>(20)

  // 获取用户当前 plan 对应的 credit 价格
  const getCreditPrice = () => {
    switch (currentPlan) {
      case "pro": return 0.08
      case "basic": return 0.10
      default: return 0.15
    }
  }

  // 调用 Stripe Checkout API
  const handleCheckout = async (type: "subscription" | "credits", plan?: string, amount?: number) => {
    const key = type === "subscription" ? plan : `credits-${amount}`
    setLoadingPlan(key || null)

    try {
      const body: Record<string, unknown> = { type }
      if (type === "subscription" && plan) {
        body.plan = plan
      } else if (type === "credits" && amount) {
        body.amount = amount
      }

      const res = await fetch("https://n8n-production-8abb.up.railway.app/webhook/stripe-create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error("Failed to create checkout session")
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert("Failed to start checkout. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      credits: 12,
      description: "Get started with basic video creation",
      features: [
        "12 Credits included",
        "Basic video export",
        "Community support",
      ],
      buttonText: currentPlan === "free" ? "Current Plan" : "Downgrade",
      buttonDisabled: currentPlan === "free",
      icon: Zap,
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: 29,
      credits: 300,
      description: "For creators who need more power",
      features: [
        "300 Credits included",
        "Additional credits $0.10 each",
        "Priority rendering",
        "Email support",
      ],
      buttonText: currentPlan === "basic" ? "Current Plan" : "Subscribe",
      buttonDisabled: currentPlan === "basic",
      icon: CreditCard,
    },
    {
      id: "pro",
      name: "Pro",
      price: 99,
      credits: 1250,
      description: "For professional creators",
      features: [
        "1250 Credits included",
        "Additional credits $0.08 each",
        "4K export",
        "Priority support",
        "Custom voice cloning",
      ],
      buttonText: currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      buttonDisabled: currentPlan === "pro",
      popular: true,
      icon: Crown,
    },
  ]

  return (
    <section id="pricing" className="scroll-mt-16 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Pricing</h2>
        <div className="flex items-center gap-2 rounded-full border border-border/40 bg-secondary/20 px-3 py-1.5">
          <Zap className="h-3.5 w-3.5 text-[var(--brand-pink)]" />
          <span className="text-xs font-medium text-foreground">{userCredits} Credits</span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative rounded-2xl p-6 transition-all",
              plan.popular
                ? "border-2 border-[var(--brand-purple)]"
                : "border border-dashed border-white/20 bg-secondary/10"
            )}
          >
            {plan.popular && (
              <span
                className="absolute -top-2.5 left-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #F43F7A, #A855F7)" }}
              >
                POPULAR
              </span>
            )}
            <div className="flex items-center gap-2">
              <plan.icon className={cn(
                "h-4 w-4",
                plan.popular ? "text-[var(--brand-purple)]" : "text-muted-foreground"
              )} />
              <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              ${plan.price}
              <span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                if (plan.id !== "free" && !plan.buttonDisabled) {
                  handleCheckout("subscription", plan.id)
                }
              }}
              disabled={plan.buttonDisabled || loadingPlan === plan.id}
              className={cn(
                "mt-5 w-full rounded-lg py-2 text-xs font-medium transition-all",
                plan.popular
                  ? "bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-purple)] text-white hover:opacity-90"
                  : plan.buttonDisabled
                    ? "border border-border/40 text-muted-foreground cursor-not-allowed"
                    : "border border-border/40 text-foreground hover:bg-secondary/30"
              )}
            >
              {loadingPlan === plan.id ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                plan.buttonText
              )}
            </button>
          </div>
        ))}

        {/* Pay As You Go */}
        <div className="rounded-2xl border border-dashed border-white/20 bg-secondary/10 p-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[var(--brand-pink)]" />
            <h3 className="text-sm font-semibold text-foreground">Pay As You Go</h3>
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">
            ${getCreditPrice().toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">/credit</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Buy credits anytime. Price based on your plan.
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Select Amount
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CREDIT_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setSelectedCreditAmount(amount)
                  }}
                  className={cn(
                    "cursor-pointer rounded-lg border py-1.5 text-xs font-medium transition-all",
                    selectedCreditAmount === amount
                      ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]"
                      : "border-white/20 text-muted-foreground hover:border-[var(--brand-pink)]/40 hover:text-foreground"
                  )}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => handleCheckout("credits", undefined, selectedCreditAmount)}
            disabled={loadingPlan?.startsWith("credits")}
            className="mt-4 w-full rounded-lg bg-[var(--brand-pink)] py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loadingPlan?.startsWith("credits") ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              "Buy Credits"
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
