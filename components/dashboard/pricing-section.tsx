"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Zap, Crown, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingSectionProps {
  currentPlan?: "free" | "basic" | "pro"
  userCredits?: number
  lang?: string // 语言设置
}

const CREDIT_AMOUNTS = [10, 20, 30, 50, 100]

export function PricingSection({ currentPlan = "free", userCredits = 12, lang = "EN" }: PricingSectionProps) {
  const router = useRouter()
  const [selectedCreditAmount, setSelectedCreditAmount] = useState<number>(20)
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro") // 默认选中 Pro

  // 获取用户当前 plan 对应的 credit 价格
  const getCreditPrice = () => {
    switch (currentPlan) {
      case "pro": return 0.08
      case "basic": return 0.10
      default: return 0.15
    }
  }

  // 跳转到支付方式选择页面
  const handlePurchase = (type: "plan" | "credits", plan?: string, amount?: number) => {
    const params = new URLSearchParams()
    params.set("type", type)
    params.set("lang", lang)
    if (type === "plan" && plan) {
      params.set("plan", plan)
    } else if (type === "credits" && amount) {
      params.set("amount", amount.toString())
    }
    router.push(`/checkout?${params.toString()}`)
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
      name: "Member",
      price: 29,
      credits: 300,
      description: lang === "中" ? "为需要更多能力的创作者" : "For creators who need more power",
      features: [
        lang === "中" ? "包含 300 积分" : "300 Credits included",
        lang === "中" ? "额外积分 $0.10/个" : "Additional credits $0.10 each",
        lang === "中" ? "优先渲染" : "Priority rendering",
        lang === "中" ? "邮件支持" : "Email support",
      ],
      buttonText: currentPlan === "basic" ? (lang === "中" ? "当前套餐" : "Current Plan") : (lang === "中" ? "购买" : "Purchase"),
      buttonDisabled: currentPlan === "basic",
      icon: CreditCard,
    },
    {
      id: "pro",
      name: "Pro",
      price: 99,
      credits: 1250,
      description: lang === "中" ? "为专业创作者" : "For professional creators",
      features: [
        lang === "中" ? "包含 1250 积分" : "1250 Credits included",
        lang === "中" ? "额外积分 $0.08/个" : "Additional credits $0.08 each",
        lang === "中" ? "4K 导出" : "4K export",
        lang === "中" ? "优先支持" : "Priority support",
        lang === "中" ? "自定义声音克隆" : "Custom voice cloning",
      ],
      buttonText: currentPlan === "pro" ? (lang === "中" ? "当前套餐" : "Current Plan") : (lang === "中" ? "购买 Pro" : "Purchase Pro"),
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
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id
          return (
          <div
            key={plan.id}
            onClick={() => setSelectedPlanId(plan.id)}
            className={cn(
              "relative cursor-pointer rounded-2xl p-6 transition-all",
              isSelected
                ? "border-2 border-[var(--brand-purple)]"
                : "border border-dashed border-white/20 bg-secondary/10 hover:border-white/40"
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
                  handlePurchase("plan", plan.id)
                }
              }}
              disabled={plan.buttonDisabled}
              className={cn(
                "mt-5 w-full rounded-lg py-2 text-xs font-medium transition-all",
                plan.popular
                  ? "bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-purple)] text-white hover:opacity-90"
                  : plan.buttonDisabled
                    ? "border border-border/40 text-muted-foreground cursor-not-allowed"
                    : "border border-border/40 text-foreground hover:bg-secondary/30"
              )}
            >
              {plan.buttonText}
            </button>
          </div>
        )})}

        {/* Pay As You Go */}
        <div 
          onClick={() => setSelectedPlanId("payg")}
          className={cn(
            "cursor-pointer rounded-2xl p-6 transition-all",
            selectedPlanId === "payg"
              ? "border-2 border-[var(--brand-purple)]"
              : "border border-dashed border-white/20 bg-secondary/10 hover:border-white/40"
          )}
        >
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
            onClick={() => handlePurchase("credits", undefined, selectedCreditAmount)}
            className="mt-4 w-full rounded-lg bg-[var(--brand-pink)] py-2 text-xs font-bold text-white transition-all hover:opacity-90"
          >
            {lang === "中" ? "购买积分" : "Buy Credits"}
          </button>
        </div>
      </div>
    </section>
  )
}
