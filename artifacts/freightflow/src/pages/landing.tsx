import { Link } from "wouter";
import {
  Boxes, CheckCircle2, ArrowRight, FileText, GitCompare, Truck,
  BarChart3, Shield, Zap, Users, TrendingDown, Star, Menu, X, IndianRupee
} from "lucide-react";
import { useState } from "react";

const FEATURES = [
  {
    icon: FileText,
    title: "Automated Invoice Capture",
    description: "Digitize freight invoices from email, PDF, or manual entry. Eliminate hours of data entry every week.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: GitCompare,
    title: "3-Way Reconciliation Engine",
    description: "Match invoices against purchase orders and shipment data automatically. Catch billing errors before you pay.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: TrendingDown,
    title: "GST & TDS Compliance",
    description: "Built-in GSTR-2B reconciliation, TDS tracking under Section 194C, and HSN code management for India.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Aging & Overdue Reports",
    description: "Know exactly which invoices are 30, 60, or 90+ days overdue. Prioritize collections and manage cash flow.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Star,
    title: "Vendor Performance Scorecards",
    description: "Rate every carrier on on-time delivery, dispute frequency, and invoice accuracy. Negotiate better rates.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Zap,
    title: "Bulk Operations & CSV Export",
    description: "Update hundreds of invoices in one click. Export any report for your finance team or auditors in seconds.",
    color: "bg-cyan-50 text-cyan-600",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: 999,
    period: "month",
    description: "For small logistics teams just getting started.",
    badge: null,
    features: [
      "Up to 200 invoices/month",
      "5 vendor accounts",
      "Basic reconciliation",
      "Aging reports",
      "Email support",
      "CSV export",
    ],
    cta: "Start Free Trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: 2999,
    period: "month",
    description: "For growing SMEs processing lakhs in freight monthly.",
    badge: "Most Popular",
    features: [
      "Up to 2,000 invoices/month",
      "Unlimited vendors",
      "GST reconciliation (GSTR-2B)",
      "TDS tracking & reports",
      "Vendor performance scores",
      "Bulk CSV import/export",
      "Priority support",
      "API access",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 7999,
    period: "month",
    description: "For large operations with complex multi-branch needs.",
    badge: null,
    features: [
      "Unlimited invoices",
      "Multi-branch / multi-GSTIN",
      "Custom ERP integrations",
      "Dedicated account manager",
      "SLA guarantee (99.9% uptime)",
      "Custom white-label branding",
      "On-premise deployment option",
      "Compliance audit support",
    ],
    cta: "Talk to Sales",
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Rajesh Khanna",
    role: "CFO, Apex Cargo Solutions, Mumbai",
    quote: "FreightFlow saved us ₹4.2 lakh in overbilled freight charges in the first quarter. The reconciliation engine is a game-changer for Indian logistics.",
    rating: 5,
  },
  {
    name: "Priya Nair",
    role: "Operations Head, SwiftMove Logistics, Bangalore",
    quote: "Our finance team used to spend 3 days every month on freight invoice reconciliation. Now it's done in 2 hours. The GST report alone is worth the subscription.",
    rating: 5,
  },
  {
    name: "Amit Sharma",
    role: "Founder, FastTrack Transport, Delhi NCR",
    quote: "Finally, a platform built for Indian logistics companies. The TDS tracking and GSTIN management are exactly what we needed. Our audits are now stress-free.",
    rating: 5,
  },
];

const STATS = [
  { value: "₹47 Cr+", label: "Freight invoices processed" },
  { value: "340+", label: "SME logistics companies" },
  { value: "₹3.8 Cr", label: "Billing errors caught" },
  { value: "18 hrs", label: "Saved per month per team" },
];

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">FreightFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Customers</a>
            <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold">
              Open App →
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 px-6 py-4 space-y-3 bg-white">
            <a href="#features" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#testimonials" className="block py-2 text-sm font-medium text-gray-700" onClick={() => setMobileMenuOpen(false)}>Customers</a>
            <Link href="/" className="block w-full text-center px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold">Open App →</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-24 md:py-36">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-full text-sm font-medium text-blue-300 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Built for Indian SME Logistics Companies
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6">
            Stop Overpaying on<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Freight Invoices</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            FreightFlow automates freight invoice reconciliation for Indian logistics SMEs — catching billing errors, managing GST, and giving you full visibility over every rupee spent on transportation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold text-lg rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5"
            >
              Start Free 14-Day Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold text-lg rounded-2xl hover:bg-white/10 transition-all"
            >
              See How It Works
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-5">No credit card required · GST Invoice provided · Cancel anytime</p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="text-3xl md:text-4xl font-bold">{s.value}</p>
                <p className="text-blue-200 text-sm mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Everything you need to control freight costs</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Purpose-built for India's logistics industry — with GST compliance, TDS management, and INR-first reporting baked in.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Up and running in minutes</h2>
            <p className="text-xl text-gray-500">No complex setup. No IT department needed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/3 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 to-blue-300" />
            {[
              { step: "01", title: "Import Your Data", desc: "Upload invoices via CSV or connect your existing system. We support all major freight billing formats." },
              { step: "02", title: "Automatic Reconciliation", desc: "Our engine matches invoices against shipment data and flags discrepancies — no manual checking." },
              { step: "03", title: "Resolve & Pay Accurately", desc: "Approve matched invoices, dispute overbilled ones, and export GST-compliant payment reports." },
            ].map(step => (
              <div key={step.step} className="relative text-center">
                <div className="w-16 h-16 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-blue-600 mx-auto mb-5 relative z-10">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Trusted by logistics companies across India</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-500">All plans include a 14-day free trial. GST invoice provided for all subscriptions.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 relative ${plan.highlight ? "border-blue-500 shadow-xl shadow-blue-100" : "border-gray-100 shadow-sm"}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-500 text-white text-sm font-bold rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-6">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-xl font-bold text-gray-500">₹</span>
                  <span className="text-5xl font-bold text-gray-900">{plan.price.toLocaleString("en-IN")}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                <Link
                  href="/"
                  className={`block w-full text-center py-3.5 rounded-xl font-bold text-base transition-all mb-8 ${
                    plan.highlight 
                      ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30" 
                      : "bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-sm mt-10">All prices + 18% GST. Annual billing available with 2 months free.</p>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-bold mb-5">Ready to stop losing money on freight?</h2>
          <p className="text-blue-200 text-xl mb-10">Join 340+ Indian logistics companies saving lakhs every month with FreightFlow.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-blue-700 font-bold text-xl rounded-2xl hover:bg-blue-50 transition-all hover:shadow-xl hover:-translate-y-1"
          >
            <IndianRupee className="w-6 h-6" />
            Start Your Free 14-Day Trial
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-blue-300 text-sm mt-5">No credit card · Takes 5 minutes · GST invoice provided</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white">FreightFlow</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Customers</a>
              <span className="text-gray-600">|</span>
              <span>GST: 27AABFF1234A1Z5</span>
              <span>© 2026 FreightFlow Technologies Pvt. Ltd.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
