import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Users, DollarSign, Shield, CheckCircle2, BarChart3, Zap } from "lucide-react";

const benefits = [
  {
    icon: DollarSign,
    title: "Faster Payments",
    description: "Get paid quickly with milestone-based funding. No more waiting weeks for checks.",
  },
  {
    icon: Users,
    title: "More Customers",
    description: "Access homeowners who are pre-approved and ready to start their projects.",
  },
  {
    icon: Shield,
    title: "Payment Protection",
    description: "Funds are secured in escrow and released as you complete milestones.",
  },
  {
    icon: BarChart3,
    title: "Business Dashboard",
    description: "Track all your projects, payments, and customer communications in one place.",
  },
];

const paymentMilestones = [
  { phase: "Project Kickoff", percentage: 20, description: "Upon contract signing and material ordering" },
  { phase: "Mid-Project", percentage: 40, description: "After demolition and rough-in work" },
  { phase: "Substantial Completion", percentage: 30, description: "When major work is finished" },
  { phase: "Final Walkthrough", percentage: 10, description: "Upon customer approval and punch list completion" },
];

const Contractors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-6">
                  For Contractors
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
                  Grow Your Business with{" "}
                  <span className="gradient-text">HomeFund</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Partner with us to offer financing to your customers. Get paid faster, 
                  close more deals, and grow your home improvement business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="hero">
                    Become a Partner
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <Button variant="hero-outline">
                    Partner Login
                  </Button>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-foreground text-background rounded-3xl p-8">
                <h3 className="text-2xl font-bold mb-8">Partner Success</h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { value: "40%", label: "Average increase in sales" },
                    { value: "3 days", label: "Average payment time" },
                    { value: "5,000+", label: "Partner contractors" },
                    { value: "$200M+", label: "Paid to contractors" },
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center">
                      <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                      <p className="text-sm text-background/70">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Partner with HomeFund?</h2>
              <p className="text-muted-foreground">
                Join thousands of contractors who've grown their businesses with our financing solutions
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Milestones */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">Milestone-Based Payments</h2>
                <p className="text-muted-foreground mb-8">
                  Get paid as you complete work. Our milestone system ensures you receive 
                  funds throughout the project, not just at the end.
                </p>
                
                <div className="space-y-4">
                  {paymentMilestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-card rounded-xl shadow-soft">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                        {milestone.percentage}%
                      </div>
                      <div>
                        <h4 className="font-semibold">{milestone.phase}</h4>
                        <p className="text-sm text-muted-foreground">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Partner Registration Form */}
              <div className="bg-card rounded-3xl p-8 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Zap className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Partner Registration</h3>
                    <p className="text-sm text-muted-foreground">Join our contractor network</p>
                  </div>
                </div>

                <form className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" placeholder="ABC Renovations" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input id="contactName" placeholder="John Smith" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" placeholder="(555) 123-4567" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Business Email</Label>
                    <Input id="email" type="email" placeholder="john@abcrenovations.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="license">Contractor License #</Label>
                    <Input id="license" placeholder="CA-123456" className="mt-1" />
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>By registering, you agree to our partner terms and conditions</span>
                  </div>
                  <Button className="w-full" size="lg">
                    Submit Application
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contractors;
