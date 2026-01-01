import { DollarSign, Zap, Shield, HeartHandshake } from "lucide-react";

const values = [
  {
    icon: DollarSign,
    title: "Flexible Payments",
    description: "Split your project cost into manageable monthly payments that fit your budget.",
  },
  {
    icon: Zap,
    title: "Instant Decisions",
    description: "Get approved in minutes with our streamlined application process. No waiting.",
  },
  {
    icon: Shield,
    title: "Protected Projects",
    description: "Your funds are released in milestones, ensuring quality work every step of the way.",
  },
  {
    icon: HeartHandshake,
    title: "Contractor Network",
    description: "Access our vetted network of certified contractors ready to bring your vision to life.",
  },
];

const ValueProposition = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Why Homeowners Choose <span className="gradient-text">HomeFund</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We've simplified home improvement financing so you can focus on what matters most—creating your dream home.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, idx) => (
            <div
              key={idx}
              className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:shadow-button transition-all duration-300">
                <value.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
