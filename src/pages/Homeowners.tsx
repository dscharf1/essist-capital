import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CheckCircle2, ArrowRight, Calculator, FileText, Shield, Clock } from "lucide-react";

const projectTypes = [
  "Kitchen Renovation",
  "Bathroom Remodel",
  "Roof Replacement",
  "HVAC System",
  "Windows & Doors",
  "Flooring",
  "Outdoor Living",
  "Other",
];

const Homeowners = () => {
  const navigate = useNavigate();
  const [loanAmount, setLoanAmount] = useState([25000]);
  const [loanTerm, setLoanTerm] = useState([36]);
  const [selectedProject, setSelectedProject] = useState("");

  const monthlyPayment = (loanAmount[0] / loanTerm[0]).toFixed(0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                  For Homeowners
                </span>
                <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
                  Finance Your Dream{" "}
                  <span className="gradient-text">Home Project</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Get pre-qualified in minutes without affecting your credit score. 
                  Choose flexible payment terms that work for your budget.
                </p>
                <div className="space-y-4">
                  {[
                    "Instant approval decisions",
                    "No prepayment penalties",
                    "0% APR promotional financing available",
                    "Loan amounts from $1,000 to $100,000",
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility Checker */}
              <div className="bg-card rounded-3xl p-8 shadow-card">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Payment Calculator</h2>
                    <p className="text-sm text-muted-foreground">Estimate your monthly payment</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Loan Amount</Label>
                      <span className="text-lg font-bold text-primary">${loanAmount[0].toLocaleString()}</span>
                    </div>
                    <Slider
                      value={loanAmount}
                      onValueChange={setLoanAmount}
                      min={1000}
                      max={100000}
                      step={1000}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>$1,000</span>
                      <span>$100,000</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Loan Term</Label>
                      <span className="text-lg font-bold text-primary">{loanTerm[0]} months</span>
                    </div>
                    <Slider
                      value={loanTerm}
                      onValueChange={setLoanTerm}
                      min={12}
                      max={84}
                      step={12}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>12 months</span>
                      <span>84 months</span>
                    </div>
                  </div>

                  <div>
                    <Label>Project Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {projectTypes.map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedProject(type)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedProject === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-accent rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Payment</p>
                    <p className="text-3xl font-bold text-primary">${monthlyPayment}<span className="text-sm font-normal text-muted-foreground">/mo*</span></p>
                    <p className="text-xs text-muted-foreground mt-2">*0% APR for qualified applicants. Actual rate may vary.</p>
                  </div>

                  <Button className="w-full" size="lg" onClick={() => navigate("/apply")}>
                    Check Your Rate
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Checking your rate won't affect your credit score
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">How to Get Started</h2>
              <p className="text-muted-foreground">Simple steps to finance your home improvement project</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: FileText,
                  title: "1. Apply Online",
                  description: "Fill out our simple application form in just 5 minutes. We'll ask about your project and financial situation.",
                },
                {
                  icon: Clock,
                  title: "2. Get Approved",
                  description: "Receive an instant decision. Most applicants get approved within minutes with competitive rates.",
                },
                {
                  icon: Shield,
                  title: "3. Start Your Project",
                  description: "Once approved, work with your contractor to begin. We release funds as work is completed.",
                },
              ].map((step, idx) => (
                <div key={idx} className="bg-card rounded-2xl p-8 shadow-soft text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form Preview */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto bg-card rounded-3xl p-8 shadow-card">
              <h2 className="text-2xl font-bold mb-6 text-center">Start Your Application</h2>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Smith" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="(555) 123-4567" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" placeholder="12345" className="mt-1" />
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate("/apply")}>
                  Start Full Application
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Homeowners;
