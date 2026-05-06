import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "I had three contractors lined up and no idea how to pay for a $22,000 kitchen gut. Essist Capital approved me in one day. The virtual card made paying the contractor seamless — no checks, no wire transfers.",
    author: "Sarah M.",
    location: "Montclair, NJ",
    project: "Kitchen Renovation · $22,000",
    rating: 5,
  },
  {
    quote:
      "As a contractor I've worked with a dozen financing companies. Essist is the only one that keeps things simple for both me and my client. Payments hit on time, every time. I recommend them to every homeowner I work with.",
    author: "Mike D.",
    location: "Queens, NY",
    project: "Licensed Contractor · 6 years",
    rating: 5,
  },
  {
    quote:
      "We needed a new roof before winter. Our bank said 3–4 weeks just for a decision. Essist Capital had us approved and funded in 48 hours. The flat rate was easy to understand — no APR tricks, just honest numbers.",
    author: "James & Lisa R.",
    location: "Hoboken, NJ",
    project: "Roof Replacement · $18,500",
    rating: 5,
  },
];

const TrustSection = () => {
  return (
    <section className="py-28 bg-[#091918] overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-[#0d9488] text-sm font-semibold tracking-widest uppercase mb-4">
            What Clients Say
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Real people.
            <br />
            Real projects.
          </h2>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl p-8 flex flex-col relative"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Quote className="w-8 h-8 text-[#0d9488] mb-5 opacity-60" />

              <p className="text-white/70 leading-relaxed text-sm flex-1 mb-6">
                {t.quote}
              </p>

              <div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#0d9488] text-[#0d9488]" />
                  ))}
                </div>
                <p className="text-white font-semibold text-sm">{t.author}</p>
                <p className="text-white/40 text-xs mt-0.5">{t.location}</p>
                <div
                  className="mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-semibold text-[#0d9488] tracking-wide"
                  style={{ background: "rgba(13,148,136,0.12)" }}
                >
                  {t.project}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div
          className="rounded-2xl p-10 grid grid-cols-2 lg:grid-cols-4 gap-8"
          style={{
            background: "rgba(13,148,136,0.06)",
            border: "1px solid rgba(13,148,136,0.15)",
          }}
        >
          {[
            { value: "$500M+", label: "Funded to Date", sub: "across NJ & NY" },
            { value: "50K+", label: "Homeowners Served", sub: "and growing" },
            { value: "4.9 / 5", label: "Customer Rating", sub: "verified reviews" },
            { value: "24 hrs", label: "Avg Approval Time", sub: "from application" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-[#0d9488] mb-1">{s.value}</p>
              <p className="text-white/80 font-semibold text-sm">{s.label}</p>
              <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
