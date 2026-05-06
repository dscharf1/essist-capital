import { Link } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-28 bg-[#0d1f1e] relative overflow-hidden">
      {/* Background accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(13,148,136,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr,auto] gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div>
            <span className="inline-block text-[#0d9488] text-sm font-semibold tracking-widest uppercase mb-6">
              Ready When You Are
            </span>
            <h2
              className="font-bold text-white leading-tight mb-6"
              style={{ fontSize: "clamp(2.25rem, 4vw, 3.75rem)" }}
            >
              Your project isn't
              <br />
              going to fund itself.
            </h2>
            <p className="text-white/50 text-lg leading-relaxed max-w-xl mb-10">
              Apply in 10 minutes. Get a decision within 24 hours. Start your project
              this week. Essist Capital is built for homeowners who are ready to move.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/apply"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-[#0d1f1e] text-base transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #2dd4bf)",
                  boxShadow: "0 0 40px rgba(13,148,136,0.25)",
                }}
              >
                Apply Now — It's Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-medium text-white/70 hover:text-white border border-white/15 hover:border-white/30 text-base transition-all duration-300 hover:bg-white/5"
              >
                <Phone className="w-4 h-4" />
                Talk to a Person
              </Link>
            </div>

            <p className="text-white/25 text-xs mt-6">
              No hard credit pull · No obligation · NJ &amp; NY licensed lender
            </p>
          </div>

          {/* Right — mini loan calculator preview */}
          <div
            className="hidden lg:block rounded-2xl p-8 w-80 shrink-0"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-6">
              Example — 12 month loan
            </p>
            {[
              { label: "Loan Amount", value: "$15,000" },
              { label: "Flat Rate", value: "15%" },
              { label: "Total Interest", value: "$2,250" },
              { label: "Monthly Payment", value: "$1,437.50" },
              { label: "Origination Fee", value: "$375 (2.5%)" },
            ].map((row, i) => (
              <div
                key={i}
                className="flex justify-between py-3 text-sm"
                style={{
                  borderBottom:
                    i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
              >
                <span className="text-white/40">{row.label}</span>
                <span
                  className={`font-semibold ${
                    row.label === "Monthly Payment"
                      ? "text-[#0d9488]"
                      : "text-white/80"
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
            <Link
              to="/homeowners"
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-[#0d9488] transition-all hover:bg-[#0d9488]/10"
              style={{ border: "1px solid rgba(13,148,136,0.25)" }}
            >
              Run My Numbers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
