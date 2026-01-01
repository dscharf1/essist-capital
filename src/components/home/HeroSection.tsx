import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Clock } from "lucide-react";
import heroImage from "@/assets/hero-home.jpg";

const benefits = [
  { icon: CheckCircle2, text: "0% APR for 12 months" },
  { icon: Shield, text: "No hidden fees" },
  { icon: Clock, text: "Approval in minutes" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0"
        style={{ background: "var(--gradient-hero)" }}
      />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-1/2 h-full opacity-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Trusted by 50,000+ homeowners
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fade-up stagger-1">
              Transform Your Home,{" "}
              <span className="gradient-text">Pay Over Time</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed animate-fade-up stagger-2">
              Get the home improvements you need today with flexible financing. 
              From kitchen renovations to bathroom upgrades, we make it easy to 
              afford your dream home.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 animate-fade-up stagger-3">
              <Button variant="hero" asChild>
                <Link to="/homeowners" className="gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" asChild>
                <Link to="/#how-it-works">See How It Works</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 animate-fade-up stagger-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <benefit.icon className="w-5 h-5 text-primary" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative animate-fade-up stagger-3">
            <div className="relative rounded-3xl overflow-hidden shadow-card">
              <img
                src={heroImage}
                alt="Beautiful modern home interior"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
            </div>
            
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-5 shadow-card animate-float">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average savings</p>
                  <p className="text-2xl font-bold text-foreground">$2,400/yr</p>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground rounded-xl px-4 py-2 shadow-soft text-sm font-semibold">
              ⭐ 4.9 Rating
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
