"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Shield, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

// Card brand SVG icons
function VisaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#1A1F71"/>
      <path d="M19.5 21H17L18.7 11H21.2L19.5 21ZM15.3 11L12.9 17.8L12.6 16.3L11.7 12C11.7 12 11.6 11 10.3 11H6.1L6 11.2C6 11.2 7.5 11.5 9.2 12.5L11.4 21H14L18 11H15.3ZM35.2 21H37.5L35.5 11H33.5C32.4 11 32.1 11.9 32.1 11.9L28 21H30.7L31.3 19.4H34.6L35.2 21ZM32 17.3L33.4 13.5L34.2 17.3H32ZM28.5 13.8L28.9 11.3C28.9 11.3 27.6 10.8 26.2 10.8C24.7 10.8 21.3 11.5 21.3 14.5C21.3 17.3 25.2 17.3 25.2 18.8C25.2 20.3 21.7 19.9 20.5 18.9L20.1 21.5C20.1 21.5 21.4 22.2 23.4 22.2C25.4 22.2 28.4 21.1 28.4 18.4C28.4 15.6 24.5 15.3 24.5 14.1C24.5 12.9 27.3 13.1 28.5 13.8Z" fill="white"/>
    </svg>
  )
}

function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#000"/>
      <circle cx="19" cy="16" r="9" fill="#EB001B"/>
      <circle cx="29" cy="16" r="9" fill="#F79E1B"/>
      <path d="M24 9.2C26 10.8 27.3 13.2 27.3 16C27.3 18.8 26 21.2 24 22.8C22 21.2 20.7 18.8 20.7 16C20.7 13.2 22 10.8 24 9.2Z" fill="#FF5F00"/>
    </svg>
  )
}

function AmexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#006FCF"/>
      <path d="M8 18H10L10.5 17H11.5L12 18H16V17.3L16.4 18H18.5L18.9 17.3V18H30V16.5H31.5V18H34V15H31.5V13.5H34V11H28L27 13L26 11H18V11.7L17.5 11H15L12.5 17V11H9L8 18ZM9.5 17L10.8 13.5H11.7L13 17H12L11.7 16H10.8L10.5 17H9.5ZM11 15.3L11.3 14.3L11.6 15.3H11ZM14 17V12H15.5L16.5 15L17.5 12H19V17H18V13.5L16.8 17H16.2L15 13.5V17H14ZM20 17V12H25V13H21V14H24.8V15H21V16H25V17H20ZM26 17V12H27.5L29 14.5L30.5 12H32V17H31V13.5L29.3 16.5H28.7L27 13.5V17H26ZM36 15H38V13H36V15ZM33 18H35V16H38C39 16 40 15.5 40 14C40 12.5 39 12 38 12H33V18ZM35 13H37.5C38 13 38.5 13.3 38.5 14C38.5 14.7 38 15 37.5 15H35V13Z" fill="white"/>
    </svg>
  )
}

function ApplePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#000"/>
      <path d="M15.5 10.5C16 9.9 16.3 9.1 16.2 8.3C15.5 8.4 14.6 8.8 14.1 9.4C13.6 9.9 13.2 10.7 13.3 11.5C14.1 11.6 14.9 11.1 15.5 10.5ZM16.2 11.7C15.1 11.6 14.2 12.3 13.6 12.3C13 12.3 12.2 11.7 11.3 11.7C10.1 11.8 9 12.5 8.4 13.6C7.1 15.8 8.1 19.1 9.4 20.9C10 21.8 10.7 22.8 11.7 22.7C12.6 22.7 12.9 22.1 14 22.1C15.1 22.1 15.4 22.7 16.4 22.7C17.4 22.7 18 21.8 18.6 20.9C19.3 19.9 19.6 18.9 19.6 18.8C19.6 18.8 17.7 18.1 17.7 16C17.7 14.2 19.2 13.4 19.3 13.3C18.4 12 17 11.8 16.2 11.7Z" fill="white"/>
      <path d="M24.5 22.5V11H28.3C30.5 11 32 12.5 32 14.7C32 16.9 30.4 18.4 28.2 18.4H26.5V22.5H24.5ZM26.5 12.7V16.7H28C29.3 16.7 30 15.9 30 14.7C30 13.5 29.3 12.7 28 12.7H26.5ZM32.8 20C32.8 18.5 33.9 17.6 35.9 17.5L38.2 17.4V16.7C38.2 15.8 37.6 15.3 36.6 15.3C35.7 15.3 35.1 15.7 35 16.4H33.3C33.4 14.8 34.8 13.7 36.7 13.7C38.7 13.7 40 14.8 40 16.5V22.5H38.3V21.2H38.2C37.7 22.1 36.6 22.7 35.5 22.7C33.9 22.7 32.8 21.6 32.8 20ZM38.2 19.1V18.4L36.2 18.5C35.2 18.6 34.6 19 34.6 19.8C34.6 20.6 35.2 21.1 36.2 21.1C37.4 21.1 38.2 20.2 38.2 19.1Z" fill="white"/>
    </svg>
  )
}

function GooglePayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#fff" stroke="#E5E5E5"/>
      <path d="M23.5 16.4V19H22.3V12H25.2C25.9 12 26.5 12.2 27 12.7C27.5 13.2 27.7 13.7 27.7 14.4C27.7 15 27.5 15.6 27 16C26.5 16.5 25.9 16.7 25.2 16.7H23.5V16.4ZM23.5 13.1V15.6H25.2C25.6 15.6 25.9 15.5 26.1 15.2C26.4 15 26.5 14.7 26.5 14.4C26.5 14 26.4 13.7 26.1 13.5C25.9 13.2 25.6 13.1 25.2 13.1H23.5Z" fill="#5F6368"/>
      <path d="M30.5 14.4C31.2 14.4 31.8 14.6 32.2 15.1C32.6 15.5 32.8 16.1 32.8 16.9V19H31.6V18.3H31.5C31.2 18.8 30.6 19.1 30 19.1C29.4 19.1 28.9 18.9 28.5 18.6C28.1 18.2 27.9 17.8 27.9 17.2C27.9 16.6 28.1 16.2 28.5 15.8C28.9 15.5 29.5 15.3 30.2 15.3C30.8 15.3 31.3 15.4 31.6 15.6V15.4C31.6 15 31.4 14.7 31.2 14.5C30.9 14.3 30.6 14.2 30.2 14.2C29.6 14.2 29.1 14.5 28.9 14.9L27.8 14.4C28.2 13.7 28.9 14.4 30.5 14.4ZM29.1 17.2C29.1 17.5 29.2 17.7 29.5 17.9C29.7 18.1 30 18.2 30.3 18.2C30.7 18.2 31.1 18 31.4 17.7C31.7 17.4 31.8 17 31.8 16.6C31.5 16.4 31.1 16.3 30.5 16.3C30.1 16.3 29.7 16.4 29.4 16.6C29.2 16.8 29.1 17 29.1 17.2Z" fill="#5F6368"/>
      <path d="M37.8 14.5L34.5 22H33.2L34.4 19.4L32.2 14.5H33.6L35.1 18L36.5 14.5H37.8Z" fill="#5F6368"/>
      <path d="M18.2 15.9C18.2 15.5 18.2 15.2 18.1 14.8H14V16.8H16.4C16.3 17.5 16 18 15.4 18.4V19.7H16.9C17.7 18.9 18.2 17.6 18.2 15.9Z" fill="#4285F4"/>
      <path d="M14 21C15.4 21 16.6 20.5 17.2 19.7L15.7 18.4C15.3 18.7 14.7 18.9 14 18.9C12.7 18.9 11.6 18 11.3 16.8H9.7V18.1C10.5 19.8 12.1 21 14 21Z" fill="#34A853"/>
      <path d="M11.3 16.8C11.1 16.2 11.1 15.6 11.3 15V13.7H9.7C9 15.1 9 16.7 9.7 18.1L11.3 16.8Z" fill="#FBBC04"/>
      <path d="M14 12.9C14.8 12.9 15.5 13.2 16 13.7L17.3 12.4C16.4 11.6 15.3 11.1 14 11.1C12.1 11.1 10.5 12.3 9.7 14L11.3 15.3C11.6 14.1 12.7 12.9 14 12.9Z" fill="#EA4335"/>
    </svg>
  )
}

function UPIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#5F259F"/>
      <path d="M12 8H16L20 16L16 24H12L16 16L12 8Z" fill="#097939"/>
      <path d="M18 8H22L26 16L22 24H18L22 16L18 8Z" fill="#ED752E"/>
      <text x="28" y="18" fill="white" fontSize="8" fontWeight="bold">UPI</text>
    </svg>
  )
}

function AlipayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#1677FF"/>
      <path d="M34 19.5c-2.5-1-5-2-7.5-3.2 1-1.8 1.8-3.8 2.2-6H25v-1.5h5V7h-12v1.8h5v1.5H17v1.5h8.5c-.4 1.5-1 3-1.8 4.3-2-.8-4-1.2-5.7-1.2-2.5 0-4 1.2-4 3s1.5 3 4 3c2 0 4-.8 5.5-2.5 2.5 1.2 5 2.3 7.5 3.3V19.5zM18 20c-1.2 0-2-.5-2-1.3s.8-1.2 2-1.2c1.5 0 3 .4 4.5 1-1 1-2.5 1.5-4.5 1.5z" fill="white"/>
    </svg>
  )
}

function WeChatPayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#07C160"/>
      <path d="M21 9c-5 0-9 3.5-9 7.8 0 2.5 1.4 4.7 3.6 6.2l-.9 2.7 3.2-1.6c1 .3 2 .5 3.1.5.2 0 .4 0 .6-.02-.2-.6-.3-1.2-.3-1.8 0-4.3 4.3-7.8 9.5-7.8.2 0 .4 0 .6.02C30 11.3 25.8 9 21 9zm-4 5.5c-.7 0-1.2-.5-1.2-1.2s.5-1.2 1.2-1.2 1.2.5 1.2 1.2-.5 1.2-1.2 1.2zm6 0c-.7 0-1.2-.5-1.2-1.2s.5-1.2 1.2-1.2 1.2.5 1.2 1.2-.5 1.2-1.2 1.2z" fill="white"/>
      <path d="M36 22.8c0-3.5-3.4-6.3-7.5-6.3s-7.5 2.8-7.5 6.3 3.4 6.3 7.5 6.3c.9 0 1.8-.1 2.7-.4l2.5 1.3-.5-2.4c1.7-1.2 2.8-3 2.8-4.8zm-10-.5c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9zm5 0c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9z" fill="white"/>
    </svg>
  )
}

const PLAN_INFO: Record<string, { name: string; nameCn: string; price: number; description: string; descriptionCn: string; features: string[]; featuresCn: string[] }> = {
  basic: {
    name: "Member",
    nameCn: "会员",
    price: 29,
    description: "300 Credits included",
    descriptionCn: "包含 300 积分",
    features: ["Priority rendering", "Email support"],
    featuresCn: ["优先渲染", "邮件支持"]
  },
  pro: {
    name: "Pro",
    nameCn: "Pro 专业版",
    price: 99,
    description: "1250 Credits included",
    descriptionCn: "包含 1250 积分",
    features: ["4K export", "Priority support", "Voice cloning"],
    featuresCn: ["4K 导出", "优先支持", "声音克隆"]
  },
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<string>("card")

  const type = searchParams.get("type") || "plan"
  const plan = searchParams.get("plan") || "basic"
  const amount = searchParams.get("amount") || "20"
  const lang = searchParams.get("lang") || "EN"

  const isChinese = lang === "中"

  // Payment methods based on language
  const paymentMethods = isChinese
    ? [
        {
          id: "card",
          name: "银行卡",
          description: "信用卡 / 借记卡",
          icons: [VisaIcon, MastercardIcon, AmexIcon],
        },
        {
          id: "alipay",
          name: "支付宝",
          description: "使用支付宝付款",
          icons: [AlipayIcon],
        },
        {
          id: "wechat",
          name: "微信支付",
          description: "使用微信付款",
          icons: [WeChatPayIcon],
        },
      ]
    : [
        {
          id: "card",
          name: "Credit / Debit Card",
          description: "All major cards accepted",
          icons: [VisaIcon, MastercardIcon, AmexIcon],
        },
        {
          id: "wallet",
          name: "Digital Wallet",
          description: "Fast and secure checkout",
          icons: [ApplePayIcon, GooglePayIcon],
        },
        {
          id: "upi",
          name: "UPI",
          description: "Pay with UPI apps",
          icons: [UPIIcon],
        },
      ]

  // Calculate total
  const getTotal = () => {
    if (type === "credits") {
      return parseInt(amount)
    }
    const planInfo = PLAN_INFO[plan]
    return planInfo ? planInfo.price : 0
  }

  const planInfo = PLAN_INFO[plan]

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[var(--brand-purple)]/5">
      <div className="mx-auto max-w-xl px-4 py-8 sm:py-12">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {isChinese ? "返回" : "Back"}
        </button>

        {/* Order Summary Card */}
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-[var(--brand-pink)]/10 via-background to-[var(--brand-purple)]/10 p-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-[var(--brand-pink)]/20 to-[var(--brand-purple)]/20 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-gradient-to-br from-[var(--brand-purple)]/20 to-[var(--brand-pink)]/20 blur-2xl" />
          
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Plan/Product Name */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-pink)] to-[var(--brand-purple)]">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-foreground">
                    {type === "credits" 
                      ? (isChinese ? "充值积分" : "Top Up Credits")
                      : (isChinese ? planInfo?.nameCn : planInfo?.name)
                    }
                  </span>
                </div>
                
                {/* Credits - LARGE AND PROMINENT */}
                <div className="mb-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-purple)] bg-clip-text text-transparent">
                    {type === "credits" ? amount : (plan === "pro" ? "1250" : "300")}
                  </span>
                  <span className="ml-2 text-xl font-semibold text-foreground">
                    {isChinese ? "积分" : "Credits"}
                  </span>
                </div>
                
                {/* Price - smaller, less prominent */}
                <p className="text-sm text-muted-foreground">
                  {isChinese ? "仅需" : "Only"} <span className="font-medium text-foreground">${getTotal()}</span>
                </p>
              </div>
            </div>

            {/* Features for plans */}
            {type === "plan" && planInfo && (
              <div className="mt-5 pt-4 border-t border-border/20">
                <p className="text-xs text-muted-foreground mb-2">{isChinese ? "包含权益" : "Included benefits"}</p>
                <div className="flex flex-wrap gap-2">
                  {(isChinese ? planInfo.featuresCn : planInfo.features).map((feature, i) => (
                    <span key={i} className="inline-flex items-center rounded-full bg-[var(--brand-pink)]/10 border border-[var(--brand-pink)]/20 px-3 py-1 text-xs font-medium text-[var(--brand-pink)]">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="mb-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
            {isChinese ? "选择支付方式" : "Payment Method"}
          </h2>
          
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200",
                  selectedMethod === method.id
                    ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/5 shadow-lg shadow-[var(--brand-pink)]/10"
                    : "border-border/40 hover:border-border bg-secondary/5 hover:bg-secondary/10"
                )}
              >
                {/* Card brand icons */}
                <div className="flex -space-x-1">
                  {method.icons.map((Icon, i) => (
                    <div key={i} className="relative h-8 w-12 overflow-hidden rounded-md shadow-sm">
                      <Icon className="h-full w-full" />
                    </div>
                  ))}
                </div>
                
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{method.name}</p>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
                
                {/* Radio indicator */}
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 transition-all flex items-center justify-center",
                    selectedMethod === method.id
                      ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]"
                      : "border-border/60"
                  )}
                >
                  {selectedMethod === method.id && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedMethod || loading}
          className={cn(
            "w-full rounded-xl py-4 text-base font-bold transition-all duration-200 flex items-center justify-center gap-2",
            "bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-purple)] text-white",
            "hover:shadow-lg hover:shadow-[var(--brand-pink)]/25 hover:scale-[1.02]",
            "active:scale-[0.98]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          )}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {isChinese ? `确认支付 $${getTotal()}` : `Pay $${getTotal()}`}
            </>
          )}
        </button>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-emerald-500" />
          <span>
            {isChinese
              ? "由 Stripe 提供安全加密保护"
              : "Secured by Stripe with 256-bit encryption"}
          </span>
        </div>

        {/* Accepted Cards Footer */}
        <div className="mt-8 flex items-center justify-center gap-3 opacity-60">
          <VisaIcon className="h-6 w-auto" />
          <MastercardIcon className="h-6 w-auto" />
          <AmexIcon className="h-6 w-auto" />
          <ApplePayIcon className="h-6 w-auto" />
          <GooglePayIcon className="h-6 w-auto" />
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-pink)]" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
