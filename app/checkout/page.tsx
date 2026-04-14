"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Alipay and WeChat icons as simple SVG components
function AlipayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.5 14.5c-1.5.5-3 .5-4.5 0-1.5-.5-2.5-1.5-3.5-2.5-.5-.5-1-1-1.5-1.5 1-.5 2-1 3-1.5.5 1 1 2 2 2.5 1 .5 2 .5 3 0 .5-.5.5-1 0-1.5s-1-.5-2-.5c-1.5 0-3 .5-4 1.5-1 1-1.5 2.5-1 4 .5 1.5 2 2.5 3.5 2.5 1 0 2-.5 2.5-1 .5.5 1 1 1.5 1.5.5.5 1 .5 1.5 0s.5-1 0-1.5c-.5-.5-1-1-1.5-1.5z"/>
    </svg>
  )
}

function WeChatPayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.56 2.78 4.66L4 17l2.5-1.5c.94.32 1.94.5 3 .5.17 0 .33 0 .5-.02-.16-.49-.25-1-.25-1.48 0-3.31 3.36-6 7.5-6 .17 0 .33 0 .5.02C17.08 5.77 13.64 4 9.5 4zm-3 4.5a1 1 0 110-2 1 1 0 010 2zm5 0a1 1 0 110-2 1 1 0 010 2zM22 14.5c0-2.76-2.69-5-6-5s-6 2.24-6 5 2.69 5 6 5c.75 0 1.47-.11 2.13-.3L20 20l-.62-1.86C21.08 17.28 22 15.97 22 14.5zm-7.5-.5a.75.75 0 110-1.5.75.75 0 010 1.5zm3 0a.75.75 0 110-1.5.75.75 0 010 1.5z"/>
    </svg>
  )
}

const PLAN_INFO: Record<string, { name: string; price: number; description: string }> = {
  basic: { name: "Member", price: 29, description: "300 Credits included" },
  pro: { name: "Pro", price: 99, description: "1250 Credits included" },
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)

  const type = searchParams.get("type") || "plan"
  const plan = searchParams.get("plan") || "basic"
  const amount = searchParams.get("amount") || "20"
  const lang = searchParams.get("lang") || "EN"

  const isChinese = lang === "中"

  // Payment methods based on language
  const paymentMethods = isChinese
    ? [
        { id: "card", name: "银行卡", icon: CreditCard, description: "Visa / Mastercard / UnionPay" },
        { id: "alipay", name: "支付宝", icon: AlipayIcon, description: "使用支付宝付款" },
        { id: "wechat", name: "微信支付", icon: WeChatPayIcon, description: "使用微信付款" },
      ]
    : [
        { id: "card", name: "Credit Card", icon: CreditCard, description: "Visa / Mastercard / AMEX" },
        { id: "wallet", name: "Apple Pay / Google Pay", icon: Wallet, description: "Use digital wallet" },
      ]

  // Calculate total
  const getTotal = () => {
    if (type === "credits") {
      return `$${amount}`
    }
    const planInfo = PLAN_INFO[plan]
    return planInfo ? `$${planInfo.price}` : "$0"
  }

  const getTitle = () => {
    if (type === "credits") {
      return isChinese ? `购买 ${amount} 积分` : `Purchase ${amount} Credits`
    }
    const planInfo = PLAN_INFO[plan]
    return isChinese ? `购买 ${planInfo?.name} 套餐` : `Purchase ${planInfo?.name} Plan`
  }

  const handleConfirm = async () => {
    if (!selectedMethod) return

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        type: type === "credits" ? "credits" : "subscription",
        paymentMethod: selectedMethod,
        lang,
      }

      if (type === "plan") {
        body.plan = plan
      } else {
        body.amount = parseInt(amount)
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
      alert(isChinese ? "支付初始化失败，请重试" : "Failed to start checkout. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isChinese ? "返回" : "Back"}
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{getTitle()}</h1>
          <p className="mt-2 text-muted-foreground">
            {isChinese ? "选择支付方式" : "Select payment method"}
          </p>
        </div>

        {/* Order summary */}
        <div className="mb-6 rounded-xl border border-border/40 bg-secondary/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isChinese ? "订单总额" : "Total"}
            </span>
            <span className="text-xl font-bold text-foreground">{getTotal()}</span>
          </div>
          {type === "plan" && PLAN_INFO[plan] && (
            <p className="mt-1 text-xs text-muted-foreground">
              {isChinese ? PLAN_INFO[plan].description.replace("included", "包含") : PLAN_INFO[plan].description}
            </p>
          )}
        </div>

        {/* Payment methods */}
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border p-4 transition-all",
                selectedMethod === method.id
                  ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/5"
                  : "border-border/40 hover:border-border"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  selectedMethod === method.id
                    ? "bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]"
                    : "bg-secondary/30 text-muted-foreground"
                )}
              >
                <method.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{method.name}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              <div
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-all",
                  selectedMethod === method.id
                    ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]"
                    : "border-border/60"
                )}
              >
                {selectedMethod === method.id && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedMethod || loading}
          className={cn(
            "mt-8 w-full rounded-xl py-4 text-sm font-bold transition-all",
            selectedMethod
              ? "bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-purple)] text-white hover:opacity-90"
              : "bg-secondary/30 text-muted-foreground cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            isChinese ? `确认支付 ${getTotal()}` : `Confirm Payment ${getTotal()}`
          )}
        </button>

        {/* Security note */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {isChinese
            ? "您的支付信息由 Stripe 安全加密保护"
            : "Your payment is secured and encrypted by Stripe"}
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
