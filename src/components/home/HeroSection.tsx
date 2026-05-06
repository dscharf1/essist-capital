import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, MoveRight } from "lucide-react";
import { LogoIcon } from "@/components/Logo";

const stats = [
  { value: "$30K", label: "Max Credit Line" },
  { value: "24 hrs", label: "Typical Approval" },
  { value: "2.5%", label: "Only Fee" },
  { value: "NJ · NY", label: "Licensed Lender" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleApply = () =>
    navigate(user ? "/apply" : "/auth", {
      state: { from: { pathname: "/apply" } },
    });

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#091918]">
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(13,148,136,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(13,148,136,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(13,148,136,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-20">
        {/* Eyebrow */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#0d9488]/30 bg-[#0d9488]/8 text-[#0d9488] text-sm font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] animate-pulse" />
            NJ &amp; NY Licensed Home Improvement Lender
          </div>
        </div>

        {/* Headline */}
        <div className="text-center max-w-5xl mx-auto mb-8">
          <h1
            className="font-bold leading-[1.05] tracking-tight text-white"
            style={{ fontSize: "clamp(2.75rem, 6vw, 5.5rem)" }}
          >
            Your Home Deserves{" "}
            <br className="hidden sm:block" />
            <span
              style={{
                background: "linear-gradient(90deg, #0d9488, #2dd4bf, #0d9488)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Better Financing.
            </span>
          </h1>
        </div>

        {/* Sub-headline */}
        <p className="text-center text-white/55 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Flat-rate home improvement loans from{" "}
          <span className="text-white/80 font-medium">$5,000 to $30,000</span>.
          No surprises, no equity required, no runaround — just fast funding
          for the project your home needs.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={handleApply}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-[#0d1f1e] text-base transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #0d9488, #2dd4bf)",
              boxShadow: "0 0 40px rgba(13,148,136,0.35)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 60px rgba(13,148,136,0.55)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 40px rgba(13,148,136,0.35)";
            }}
          >
            Check My Rate
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <Link
            to="/homeowners"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-medium text-white/80 hover:text-white text-base border border-white/15 hover:border-white/30 transition-all duration-300 hover:bg-white/5"
          >
            See How It Works
            <MoveRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Stats bar */}
        <div className="max-w-3xl mx-auto">
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center py-5 px-4 text-center"
                style={{ background: "rgba(13,31,30,0.7)" }}
              >
                <p className="text-2xl font-bold text-[#0d9488] mb-0.5">{s.value}</p>
                <p className="text-xs text-white/40 font-medium tracking-wide uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Card mockup */}
        <div className="flex justify-center mt-16">
          <div
            className="relative w-80 sm:w-96 rounded-2xl p-7 select-none"
            style={{
              background:
                "linear-gradient(135deg, #0f2040 0%, #1a3460 40%, #0f2040 100%)",
              boxShadow:
                "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(13,148,136,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Shine overlay */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(115deg, rgba(13,148,136,0.08) 0%, transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="flex justify-between items-start mb-8">
                <LogoIcon size={30} />
                <div className="flex gap-1">
                  <div className="w-7 h-7 rounded-full bg-[#0d9488]/60" />
                  <div className="w-7 h-7 rounded-full bg-[#0d9488]/30 -ml-3" />
                </div>
              </div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Available Credit</p>
              <p className="text-white text-3xl font-bold mb-6">$24,500.00</p>
              <p className="text-white font-mono tracking-widest text-base mb-6">
                •••• •••• •••• 4821
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">Cardholder</p>
                  <p className="text-white text-sm font-semibold">Marcus A. Rivera</p>
                </div>
                <div className="text-right">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">Expires</p>
                  <p className="text-white text-sm font-mono">04/27</p>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div
              className="absolute -top-3 -right-3 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0d1f1e]"
              style={{ background: "linear-gradient(135deg, #0d9488, #2dd4bf)" }}
            >
              Approved ✓
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
