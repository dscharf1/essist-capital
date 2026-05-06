import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Slider } from "@/components/ui/slider";
import { ArrowRight } from "lucide-react";
import {
  calculateMonthlyPayment,
  calculateInterestOnlyPayment,
  calculateTotalRepayment,
  calculateOriginationFee,
  calculateFinanceCharge,
  getDisplayRate,
  formatCurrency,
} from "@/lib/calculations";

const TERMS = [6, 12, 18, 24] as const;

const rateTable = [
  { term: "6 months",  rate: "10%",     total: "10% flat",      note: "Shortest, lowest cost" },
  { term: "12 months", rate: "15%/yr",  total: "15% total",     note: "Most popular" },
  { term: "18 months", rate: "18%/yr",  total: "27% total",     note: "Lower monthly payment" },
  { term: "24 months", rate: "19%/yr",  total: "38% total",     note: "Lowest monthly payment" },
];

const Homeowners = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState([15000]);
  const [term, setTerm] = useState<6 | 12 | 18 | 24>(12);

  const apply = () => navigate(user ? "/apply" : "/auth", { state: { from: { pathname: "/apply" } } });

  const monthly = calculateMonthlyPayment(amount[0], term);
  const interestOnly = calculateInterestOnlyPayment(amount[0], term);
  const total = calculateTotalRepayment(amount[0], term);
  const fee = calculateOriginationFee(amount[0]);
  const interest = calculateFinanceCharge(amount[0], term);

  return (
    <div className="min-h-screen" style={{ background: "#091918" }}>
      <Header />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">

          {/* Page header */}
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-[#0d9488] mb-5"
              style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)" }}>
              For Homeowners
            </span>
            <h1 className="font-bold text-white mb-4" style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>
              Know exactly what you'll pay.
            </h1>
            <p className="text-white/40 text-base max-w-lg mx-auto">
              Flat-rate financing — one fee, fixed monthly payments, no surprises.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Calculator */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="p-6 space-y-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Amount */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-white/40 text-sm">Loan Amount</span>
                    <span className="text-2xl font-black text-white">{formatCurrency(amount[0])}</span>
                  </div>
                  <Slider value={amount} onValueChange={setAmount} min={5000} max={30000} step={500} />
                  <div className="flex justify-between text-xs text-white/25 mt-2">
                    <span>$5,000</span><span>$30,000</span>
                  </div>
                </div>

                {/* Term */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white/40 text-sm">Term</span>
                    <span className="text-white/30 text-xs">{getDisplayRate(term)} annual rate</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TERMS.map(t => (
                      <button key={t} onClick={() => setTerm(t)}
                        className="py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: term === t ? "linear-gradient(135deg,#0d9488,#2dd4bf)" : "rgba(255,255,255,0.05)",
                          color: term === t ? "#0d1f1e" : "rgba(255,255,255,0.4)",
                          border: term === t ? "none" : "1px solid rgba(255,255,255,0.07)",
                        }}>
                        {t} mo
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Key numbers */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.15)" }}>
                    <p className="text-[#0d9488]/60 text-xs mb-1">P&amp;I Monthly</p>
                    <p className="text-2xl font-black text-[#0d9488]">{formatCurrency(monthly)}</p>
                  </div>
                  <div className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p className="text-white/40 text-xs mb-1">Interest Only</p>
                    <p className="text-2xl font-black text-white/60">{formatCurrency(interestOnly)}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  {[
                    { l: "Rate", v: getDisplayRate(term) },
                    { l: "Total Interest", v: formatCurrency(interest) },
                    { l: "Origination Fee (2.5%)", v: formatCurrency(fee) },
                    { l: "Total Repayment", v: formatCurrency(total) },
                  ].map((r, i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5"
                      style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span className="text-white/30">{r.l}</span>
                      <span className="text-white/65 font-semibold">{r.v}</span>
                    </div>
                  ))}
                </div>

                <button onClick={apply}
                  className="w-full py-4 rounded-xl font-bold text-[#0d1f1e] flex items-center justify-center gap-2 group transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#0d9488,#2dd4bf)" }}>
                  Apply for This Loan
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="text-center text-white/20 text-xs mt-3">No hard credit pull · 10 minutes</p>
              </div>
            </div>

            {/* Right column: Rate table + basics */}
            <div className="space-y-6">
              {/* Rate table */}
              <div className="rounded-2xl p-6"
                style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.12)" }}>
                <p className="text-[#0d9488] font-bold text-sm mb-4 uppercase tracking-widest">Rate Table</p>
                <div className="space-y-0">
                  {rateTable.map((r, i) => (
                    <div key={i} className="flex items-center gap-4 py-3.5"
                      style={{ borderBottom: i < rateTable.length - 1 ? "1px solid rgba(13,148,136,0.08)" : "none" }}>
                      <div className="w-24 shrink-0 text-white font-semibold text-sm">{r.term}</div>
                      <div className="px-2.5 py-0.5 rounded-lg text-xs font-black text-[#0d1f1e] shrink-0"
                        style={{ background: "#0d9488" }}>{r.rate}</div>
                      <div className="text-white/40 text-xs">{r.total} · {r.note}</div>
                    </div>
                  ))}
                </div>
                <p className="text-white/20 text-xs mt-4">Annual add-on rates applied pro-rata over the loan term.</p>
              </div>

              {/* Quick facts */}
              <div className="rounded-2xl p-6 space-y-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-white/60 font-bold text-sm uppercase tracking-widest">Basics</p>
                {[
                  ["Loan range", "$5,000 – $30,000"],
                  ["Terms", "6, 12, 18, or 24 months"],
                  ["Collateral", "None required"],
                  ["Who qualifies", "Individuals & LLCs in NJ or NY"],
                  ["Approval time", "Within 24 hours"],
                  ["Funding", "Virtual card — use anywhere"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-white/30">{l}</span>
                    <span className="text-white/65 font-medium text-right max-w-[55%]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Homeowners;
