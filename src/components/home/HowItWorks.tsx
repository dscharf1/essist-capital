import { useState } from "react";
import { ClipboardList, BadgeCheck, CreditCard, HardHat, Banknote } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Apply in 10 Minutes",
    description:
      "Fill out our streamlined online application. Tell us your project, loan amount, and preferred term. No hard credit pull at this stage.",
    detail: "No impact on your credit score",
  },
  {
    number: "02",
    icon: BadgeCheck,
    title: "Get a Decision Fast",
    description:
      "Our team reviews your application and responds within 24 hours. We'll reach out directly with your approval and any next steps.",
    detail: "Typically within 24 hours",
  },
  {
    number: "03",
    icon: CreditCard,
    title: "Virtual Card Issued",
    description:
      "Once approved and funded, you receive an Essist Capital virtual card loaded with your credit line — ready to use with your contractor.",
    detail: "Up to $30,000 credit line",
  },
  {
    number: "04",
    icon: HardHat,
    title: "Your Project Begins",
    description:
      "Your contractor gets paid directly through the card as work progresses. You stay in control of every transaction in your dashboard.",
    detail: "Full visibility in your dashboard",
  },
  {
    number: "05",
    icon: Banknote,
    title: "Simple Monthly Payments",
    description:
      "Pay a fixed monthly amount over 6, 12, 18, or 24 months. Flat-rate interest — you know exactly what you owe from day one.",
    detail: "Fixed payments, no surprises",
  },
];

const HowItWorks = () => {
  const [active, setActive] = useState(0);

  return (
    <section id="how-it-works" className="py-28 bg-[#0d1f1e] scroll-mt-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <span className="inline-block text-[#0d9488] text-sm font-semibold tracking-widest uppercase mb-4">
            The Process
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
            From application
            <br />
            to funded — fast.
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            Five simple steps. No bank visits, no stacks of paperwork, no weeks of waiting.
          </p>
        </div>

        <div className="grid lg:grid-cols-[340px,1fr] gap-6 lg:gap-16 items-start">
          {/* Step List */}
          <div className="space-y-1">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === active;
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className="w-full text-left rounded-xl px-5 py-4 transition-all duration-300 group"
                  style={{
                    background: isActive ? "rgba(13,148,136,0.1)" : "transparent",
                    border: isActive
                      ? "1px solid rgba(13,148,136,0.3)"
                      : "1px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        background: isActive ? "#0d9488" : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <Icon
                        className="w-4 h-4 transition-colors"
                        style={{ color: isActive ? "#0d1f1e" : "rgba(255,255,255,0.3)" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold tabular-nums transition-colors"
                          style={{ color: isActive ? "#0d9488" : "rgba(255,255,255,0.2)" }}
                        >
                          {step.number}
                        </span>
                        <span
                          className="text-sm font-semibold truncate transition-colors"
                          style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)" }}
                        >
                          {step.title}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail Panel */}
          <div
            className="rounded-2xl p-8 sm:p-12 min-h-[300px] flex flex-col justify-between"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <div className="flex items-start justify-between mb-8">
                <span
                  className="text-7xl font-black leading-none"
                  style={{
                    color: "rgba(13,148,136,0.15)",
                    letterSpacing: "-4px",
                  }}
                >
                  {steps[active].number}
                </span>
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(13,148,136,0.12)" }}
                >
                  {(() => { const Icon = steps[active].icon; return <Icon className="w-7 h-7 text-[#0d9488]" />; })()}
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                {steps[active].title}
              </h3>
              <p className="text-white/55 text-lg leading-relaxed mb-8">
                {steps[active].description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#0d9488]" />
              <span className="text-[#0d9488] text-sm font-semibold">
                {steps[active].detail}
              </span>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2 mt-8 lg:ml-[356px]">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="transition-all duration-300 rounded-full h-1"
              style={{
                width: i === active ? "32px" : "8px",
                background: i === active ? "#0d9488" : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
