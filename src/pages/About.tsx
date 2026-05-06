import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const team = [
  {
    name: "Daniel Scharf",
    role: "Founder & CEO",
    bio: "NJ-based entrepreneur with deep roots in real estate and alternative lending. Built Essist Capital to solve a gap he saw firsthand in home improvement financing.",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Rachel Torres",
    role: "Chief Lending Officer",
    bio: "15 years structuring consumer loan products at regional banks across NJ and NY. Expert in flat-rate and BNPL credit structures.",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "James Okafor",
    role: "Head of Risk & Compliance",
    bio: "Former compliance officer at a top-10 consumer lender. Ensures Essist meets all NJ and NY lending regulations and TILA requirements.",
    photo: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    name: "Maria Delgado",
    role: "Director of Contractor Relations",
    bio: "Built and managed contractor partner networks across the tri-state area for over a decade. Fluent in English and Spanish.",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const About = () => (
  <div className="min-h-screen" style={{ background: "#091918" }}>
    <Header />

    {/* Hero */}
    <section className="relative pt-36 pb-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 40% at 50% 0%,rgba(13,148,136,0.08) 0%,transparent 70%)",
      }} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-[#0d9488] mb-6"
          style={{ border: "1px solid rgba(13,148,136,0.25)", background: "rgba(13,148,136,0.07)" }}>
          About Us
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
          Built for homeowners.<br />
          <span style={{
            background: "linear-gradient(90deg,#0d9488,#2dd4bf)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Licensed in NJ &amp; NY.</span>
        </h1>
        <p className="text-white/45 text-lg max-w-xl mx-auto leading-relaxed">
          Essist Capital makes home improvement financing fast, transparent, and accessible —
          no equity required, no runaround.
        </p>
      </div>
    </section>

    {/* Mission */}
    <section className="py-20" style={{ background: "#0d1f1e" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[#0d9488] text-xs font-bold uppercase tracking-widest mb-3">Our Mission</p>
            <h2 className="text-3xl font-bold text-white mb-5">The financing gap is real.</h2>
            <div className="space-y-4 text-white/45 leading-relaxed text-sm">
              <p>
                Most homeowners who need $5,000–$30,000 for a home project are stuck between credit cards
                with high variable rates and HELOCs that take months and require equity they don't have.
              </p>
              <p>
                Essist Capital fills that gap — a straightforward flat-rate loan, funded as a virtual card,
                approved in 24 hours. No home equity. No appraisal. No hard pull to apply.
              </p>
              <p>
                We're licensed in New Jersey and New York and built around one standard: doing right by the borrower.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { v: "$30K", l: "Maximum loan" },
              { v: "24 hrs", l: "Decision time" },
              { v: "2.5%", l: "Origination fee" },
              { v: "NJ · NY", l: "Licensed states" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-6 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-2xl font-black text-[#0d9488] mb-1">{s.v}</p>
                <p className="text-xs text-white/30 uppercase tracking-wider">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="py-20" style={{ background: "#091918" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <p className="text-[#0d9488] text-xs font-bold uppercase tracking-widest mb-3 text-center">What We Stand For</p>
        <h2 className="text-3xl font-bold text-white text-center mb-12">Principles, not promises.</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {[
            { title: "Flat rates, always.", body: "No variable rates. No hidden fees. You know your total cost before you sign — we display it in plain English." },
            { title: "No equity required.", body: "You shouldn't need to leverage your home to fix your home. Our loans are unsecured by design." },
            { title: "Fast and honest.", body: "Real decisions in 24 hours. If we can't lend to you, we'll tell you why — no ghosting, no runaround." },
            { title: "Local first.", body: "NJ and NY licensed. Built for tri-state homeowners and the contractors who serve them." },
          ].map((v, i) => (
            <div key={i} className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="text-white font-bold mb-2">{v.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Team */}
    <section className="py-20" style={{ background: "#0d1f1e" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <p className="text-[#0d9488] text-xs font-bold uppercase tracking-widest mb-3 text-center">The Team</p>
        <h2 className="text-3xl font-bold text-white text-center mb-12">Who's behind Essist Capital.</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map((member, i) => (
            <div key={i} className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="relative">
                <img src={member.photo} alt={member.name}
                  className="w-full h-48 object-cover object-top grayscale-[30%]" />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top,rgba(13,31,30,0.85) 0%,transparent 60%)" }} />
              </div>
              <div className="p-5">
                <p className="text-white font-bold">{member.name}</p>
                <p className="text-[#0d9488] text-xs font-semibold mb-2">{member.role}</p>
                <p className="text-white/40 text-xs leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20" style={{ background: "#091918" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to move forward?</h2>
        <p className="text-white/35 mb-8">Apply in 10 minutes. No hard pull. Real decision in 24 hours.</p>
        <Link to="/apply"
          className="inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-[#0d1f1e] text-base transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#0d9488,#2dd4bf)" }}>
          Apply Now <ArrowRight className="w-5 h-5" />
        </Link>
        <p className="text-white/20 text-xs mt-4">NJ &amp; NY Licensed · NMLS #[pending]</p>
      </div>
    </section>

    <Footer />
  </div>
);

export default About;
