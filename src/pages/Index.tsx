import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, CheckCircle } from "lucide-react";
import {
  calculateMonthlyPayment,
  calculateFinanceCharge,
  calculateOriginationFee,
  calculateInterestOnlyPayment,
  getDisplayRate,
  formatCurrency,
  type BorrowerType,
  type ValidTerm,
} from "@/lib/calculations";

// Brand tokens
const FOREST  = "#0d1f1e";
const SAGE    = "#e8f0ea";
const CREAM   = "#faf8f4";
const TERRA   = "#0d9488";
const TERRA_L = "#2dd4bf";
const INK     = "#1a1f1a";
const MIST    = "#f2f7f3";

const TERMS = [3, 6, 12] as const;

const steps = [
  { n: "01", title: "Apply online",   desc: "10-minute form. No hard credit pull." },
  { n: "02", title: "Get approved",   desc: "Decision within 24 hours by email." },
  { n: "03", title: "Start building", desc: "Funds arrive fast so work can begin." },
];

const perks = [
  "No home equity required",
  "Flat, predictable rate",
  "No prepayment penalty",
  "NJ & NY licensed lender",
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount]             = useState([15000]);
  const [term, setTerm]                 = useState<ValidTerm>(12);
  const [paymentType, setPaymentType]   = useState<"pi" | "io">("pi");
  const [borrowerType, setBorrowerType] = useState<BorrowerType>("individual");

  const apply = () => navigate(user ? "/apply" : "/auth", { state: { from: { pathname: "/apply" } } });

  const monthly      = calculateMonthlyPayment(amount[0], term, borrowerType);
  const interestOnly = calculateInterestOnlyPayment(amount[0], term, borrowerType);
  const interest     = calculateFinanceCharge(amount[0], term, borrowerType);
  const fee          = calculateOriginationFee(amount[0], borrowerType);
  const displayPayment = paymentType === "pi" ? monthly : interestOnly;

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <Header />

      {/* ── Hero ── */}
      <section className="relative flex flex-col justify-center min-h-screen overflow-hidden"
        style={{ background: FOREST }}>

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }} />
        {/* Warm glow from bottom-left */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 55% at 20% 100%,rgba(13,148,136,0.18) 0%,transparent 65%)",
        }} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-28 pb-20">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <span className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
              style={{ border: "1px solid rgba(13,148,136,0.4)", background: "rgba(13,148,136,0.12)", color: TERRA_L }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: TERRA_L }} />
              NJ &amp; NY Licensed Lender
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center font-black text-white leading-[1.05] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.75rem, 6vw, 5.5rem)" }}>
            Home Improvement<br />
            <span style={{
              background: `linear-gradient(90deg,${TERRA},${TERRA_L},${TERRA})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Financing, Simplified.</span>
          </h1>

          <p className="text-center text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            $5,000 – $30,000. Flat rate. No equity. No runaround.<br className="hidden sm:block" />
            Apply in 10 minutes and hear back in 24 hours.
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-16">
            <button onClick={apply}
              className="group inline-flex items-center gap-2.5 px-9 py-4 rounded-xl font-bold text-white text-base transition-all duration-300"
              style={{ background: `linear-gradient(135deg,${TERRA},${TERRA_L})`, boxShadow: `0 0 40px rgba(13,148,136,0.4)` }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 60px rgba(13,148,136,0.6)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 40px rgba(13,148,136,0.4)")}>
              Check My Rate
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Stats bar */}
          <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            {[
              { v: "$30K",    l: "Max Loan" },
              { v: "24 hrs",  l: "Approval Time" },
              { v: "6–24 mo", l: "Terms" },
              { v: "NJ · NY", l: "Licensed" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center py-5 px-4"
                style={{ background: "rgba(13,31,30,0.8)" }}>
                <p className="text-2xl font-bold mb-0.5" style={{ color: TERRA_L }}>{s.v}</p>
                <p className="text-xs text-white/30 uppercase tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — light sage ── */}
      <section className="py-24" style={{ background: SAGE }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: TERRA }}>The Process</p>
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-14" style={{ color: INK }}>Three steps to funded.</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="rounded-2xl p-7 bg-white"
                style={{ boxShadow: "0 2px 16px rgba(13,31,30,0.06)", border: "1px solid rgba(13,31,30,0.07)" }}>
                <p className="text-5xl font-black leading-none mb-5" style={{ color: "rgba(13,148,136,0.15)" }}>{s.n}</p>
                <p className="font-bold text-lg mb-2" style={{ color: INK }}>{s.title}</p>
                <p className="text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Perks */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {perks.map(p => (
              <span key={p} className="flex items-center gap-2 text-sm" style={{ color: INK }}>
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: TERRA }} />
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calculator — warm cream ── */}
      <section className="py-24" style={{ background: CREAM }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest mb-3" style={{ color: TERRA }}>Payment Calculator</p>
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-10" style={{ color: INK }}>See your numbers instantly.</h2>

          <div className="max-w-lg mx-auto rounded-2xl overflow-hidden bg-white"
            style={{ boxShadow: "0 24px 60px rgba(13,31,30,0.12)", border: "1px solid rgba(13,31,30,0.08)" }}>

            <div className="p-7 space-y-6" style={{ borderBottom: "1px solid #f0ede8" }}>
              {/* Borrower type */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: MIST }}>
                {([
                  { key: "individual", label: "Individual" },
                  { key: "llc",        label: "LLC / Business" },
                ] as const).map(opt => (
                  <button key={opt.key} onClick={() => setBorrowerType(opt.key)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                    style={{
                      background: borrowerType === opt.key ? `linear-gradient(135deg,${TERRA},${TERRA_L})` : "transparent",
                      color: borrowerType === opt.key ? "#fff" : "#9ca3af",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-sm text-gray-400">Loan Amount</span>
                  <span className="text-3xl font-black" style={{ color: INK }}>{formatCurrency(amount[0])}</span>
                </div>
                <Slider value={amount} onValueChange={setAmount} min={5000} max={30000} step={500} />
                <div className="flex justify-between text-xs text-gray-300 mt-2">
                  <span>$5,000</span><span>$30,000</span>
                </div>
              </div>

              {/* Term */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-400">Repayment Term</span>
                  <span className="text-xs text-gray-400">{getDisplayRate(term, borrowerType)}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {TERMS.map(t => (
                    <button key={t} onClick={() => setTerm(t)}
                      className="py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                      style={{
                        background: term === t ? `linear-gradient(135deg,${TERRA},${TERRA_L})` : MIST,
                        color: term === t ? "#fff" : "#6b7280",
                        border: term === t ? "none" : `1px solid #e5e7eb`,
                      }}>
                      {t} mo
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="p-7">
              {/* P+I / IO toggle */}
              <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: MIST }}>
                {([
                  { key: "pi", label: "Principal + Interest" },
                  { key: "io", label: "Interest Only" },
                ] as const).map(opt => (
                  <button key={opt.key} onClick={() => setPaymentType(opt.key)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                    style={{
                      background: paymentType === opt.key ? `linear-gradient(135deg,${TERRA},${TERRA_L})` : "transparent",
                      color: paymentType === opt.key ? "#fff" : "#9ca3af",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Monthly display */}
              <div className="rounded-xl p-5 mb-5 text-center"
                style={{ background: "rgba(13,148,136,0.07)", border: `1px solid rgba(13,148,136,0.18)` }}>
                <p className="text-xs mb-1 uppercase tracking-widest font-medium" style={{ color: `${TERRA}99` }}>
                  {paymentType === "pi" ? "Monthly Payment" : "Monthly Interest Payment"}
                </p>
                <p className="text-4xl font-black" style={{ color: TERRA }}>{formatCurrency(displayPayment)}</p>
                {paymentType === "io" && (
                  <p className="text-gray-400 text-xs mt-2">
                    + {formatCurrency(amount[0])} balloon due at end of term
                  </p>
                )}
              </div>

              {/* Breakdown */}
              <div className="space-y-2 mb-6">
                {(paymentType === "pi" ? [
                  { l: "Rate",               v: getDisplayRate(term, borrowerType) },
                  { l: "Total Interest",     v: formatCurrency(interest) },
                  { l: `Origination Fee (${borrowerType === "individual" ? "6" : "3"}%)`, v: formatCurrency(fee) },
                ] : [
                  { l: "Rate",               v: getDisplayRate(term, borrowerType) },
                  { l: "Monthly Interest",   v: formatCurrency(interestOnly) },
                  { l: "Total Interest Paid",v: formatCurrency(interest) },
                  { l: "Balloon Payment",    v: formatCurrency(amount[0]) },
                  { l: `Origination Fee (${borrowerType === "individual" ? "6" : "3"}%)`, v: formatCurrency(fee) },
                ]).map((r, i, arr) => (
                  <div key={i} className="flex justify-between text-sm py-1.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid #f0ede8" : "none" }}>
                    <span className="text-gray-400">{r.l}</span>
                    <span className="font-semibold" style={{ color: INK }}>{r.v}</span>
                  </div>
                ))}
              </div>

              <button onClick={apply}
                className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all hover:brightness-110 group"
                style={{ background: `linear-gradient(135deg,${TERRA},${TERRA_L})` }}>
                Apply for This Loan
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <p className="text-center text-gray-300 text-xs mt-3">No hard credit pull · Takes 10 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA — forest green ── */}
      <section className="py-24" style={{ background: FOREST }}>
        {/* Warm glow */}
        <div className="absolute inset-x-0 pointer-events-none" style={{
          height: "400px",
          background: "radial-gradient(ellipse 50% 60% at 80% 50%,rgba(13,148,136,0.15) 0%,transparent 70%)",
        }} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="mb-8 text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>Apply in 10 minutes. No hard pull. Real decision.</p>
          <button onClick={apply}
            className="inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-white text-base group transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg,${TERRA},${TERRA_L})`, boxShadow: `0 0 40px rgba(13,148,136,0.35)` }}>
            Apply Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>NJ &amp; NY Licensed Lender · No obligation</p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
