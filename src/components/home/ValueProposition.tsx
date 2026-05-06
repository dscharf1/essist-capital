import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const pillars = [
  {
    number: "01",
    title: "Flat-Rate Pricing",
    description:
      "Interest is calculated once on the original loan amount. Your rate never changes, your payment never changes. What you see is exactly what you pay.",
  },
  {
    number: "02",
    title: "No Equity Required",
    description:
      "Unlike HELOCs or second mortgages, we don't touch your home's equity. You keep full ownership — we just help you fund the project.",
  },
  {
    number: "03",
    title: "Virtual Card Funding",
    description:
      "Funds go on a virtual card you control. Pay your contractor as work gets done. No lump sum handed out blindly — full project oversight.",
  },
  {
    number: "04",
    title: "One Fee. That's It.",
    description:
      "A single 2.5% origination fee, deducted at funding. No prepayment penalty, no annual fee, no late-payment hidden charges buried in the fine print.",
  },
];

const ValueProposition = () => {
  return (
    <section className="py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header — asymmetric layout */}
        <div className="grid lg:grid-cols-[1fr,1.4fr] gap-16 lg:gap-24 items-start mb-20">
          <div>
            <span className="inline-block text-[#0d9488] text-sm font-semibold tracking-widest uppercase mb-5">
              Why Essist Capital
            </span>
            <h2
              className="font-bold leading-tight text-foreground"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
            >
              Built for homeowners
              <br />
              who are done with
              <br />
              <span className="text-[#0d9488]">complicated lending.</span>
            </h2>
          </div>
          <div className="flex flex-col justify-end">
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Most lenders make you feel like you're doing them a favor by borrowing money.
              We built Essist Capital around the opposite idea — fast, honest, and
              designed entirely for the borrower.
            </p>
            <Link
              to="/homeowners"
              className="inline-flex items-center gap-2 text-[#0d9488] font-semibold text-sm hover:gap-3 transition-all"
            >
              See loan options <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Pillars grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="group bg-card hover:bg-[#0d1f1e] p-8 transition-all duration-500 cursor-default"
            >
              <p
                className="text-5xl font-black mb-6 leading-none transition-colors duration-500"
                style={{ color: "rgba(13,148,136,0.2)" }}
              >
                {p.number}
              </p>
              <h3 className="text-lg font-bold text-foreground group-hover:text-white mb-3 transition-colors duration-500">
                {p.title}
              </h3>
              <p className="text-muted-foreground group-hover:text-white/55 text-sm leading-relaxed transition-colors duration-500">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom KPI strip */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {[
            { figure: "$5K–$30K", caption: "Loan range" },
            { figure: "6–24 mo", caption: "Flexible terms" },
            { figure: "10%–19%", caption: "Flat add-on rate" },
            { figure: "2.5%", caption: "Only fee charged" },
          ].map((kpi, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-bold text-foreground mb-1">{kpi.figure}</p>
              <p className="text-sm text-muted-foreground">{kpi.caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
