import { FileText, CheckCircle, Wallet, Hammer, CreditCard } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Apply Online",
    description: "Complete our simple online application in just 5 minutes. No impact on your credit score.",
    color: "bg-primary",
  },
  {
    icon: CheckCircle,
    title: "Get Approved",
    description: "Receive an instant decision. Most applicants are approved within minutes.",
    color: "bg-secondary",
  },
  {
    icon: Wallet,
    title: "Funds Released",
    description: "Once approved, funds are held securely and released based on project milestones.",
    color: "bg-primary",
  },
  {
    icon: Hammer,
    title: "Project Begins",
    description: "Your contractor starts work. We release payments as milestones are completed.",
    color: "bg-secondary",
  },
  {
    icon: CreditCard,
    title: "Easy Repayment",
    description: "Pay back on your terms with flexible monthly payments and no prepayment penalties.",
    color: "bg-primary",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            From application to completion, we've made home improvement financing straightforward and transparent.
          </p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-[10%] right-[10%] h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center z-10">
                  {idx + 1}
                </div>
                
                <div className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-5 shadow-button`}>
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
