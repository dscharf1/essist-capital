import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Target, Heart, Users, Award } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We believe everyone deserves to live in a home they love. Our mission is to make home improvements accessible to all.",
  },
  {
    icon: Heart,
    title: "Customer First",
    description: "Every decision we make starts with the question: How does this help our customers achieve their dreams?",
  },
  {
    icon: Users,
    title: "Community Focus",
    description: "We partner with local contractors and support communities by keeping home improvement dollars local.",
  },
  {
    icon: Award,
    title: "Integrity Always",
    description: "Transparency and honesty are non-negotiable. We believe in clear terms and no hidden surprises.",
  },
];

const team = [
  { name: "Sarah Chen", role: "CEO & Co-Founder", bio: "Former VP at Goldman Sachs with 15 years in consumer finance." },
  { name: "Michael Roberts", role: "CTO & Co-Founder", bio: "Previously led engineering at Square. MIT Computer Science." },
  { name: "Emily Watson", role: "Chief Risk Officer", bio: "20 years in risk management at major consumer lenders." },
  { name: "David Park", role: "Head of Partnerships", bio: "Built contractor networks at HomeAdvisor and Angi." },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                About Us
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Making Home Improvements{" "}
                <span className="gradient-text">Accessible to All</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                HomeFund was founded on a simple belief: everyone deserves to live in a home 
                they're proud of. We're on a mission to remove financial barriers that prevent 
                families from improving their living spaces.
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    HomeFund started when our founders experienced firsthand the frustration 
                    of trying to finance home improvements. Traditional lenders made the process 
                    complicated, slow, and stressful.
                  </p>
                  <p>
                    We knew there had to be a better way. In 2019, we launched HomeFund with 
                    a vision to create a financing platform that's as straightforward as it 
                    should be—fast approvals, transparent terms, and a process designed around 
                    the customer.
                  </p>
                  <p>
                    Today, we've helped over 50,000 homeowners transform their living spaces 
                    and partnered with thousands of contractors across the country. But we're 
                    just getting started.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: "2019", label: "Founded" },
                  { value: "50K+", label: "Homeowners Served" },
                  { value: "$500M+", label: "Funded" },
                  { value: "5K+", label: "Contractor Partners" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-card rounded-2xl p-6 shadow-soft text-center">
                    <p className="text-3xl font-bold text-primary mb-2">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-muted-foreground">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Leadership Team</h2>
              <p className="text-muted-foreground">
                Meet the people building the future of home improvement financing
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, idx) => (
                <div key={idx} className="bg-card rounded-2xl p-6 shadow-soft text-center hover:shadow-card transition-all duration-300">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow mx-auto mb-4" />
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-sm text-primary mb-2">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-foreground text-background rounded-3xl p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
              <p className="text-background/70 mb-8 max-w-2xl mx-auto">
                Whether you're a homeowner looking to improve your space or a contractor 
                wanting to grow your business, we're here to help.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="hero" asChild>
                  <Link to="/homeowners">
                    Apply for Financing
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="outline" className="border-background/30 text-background hover:bg-background/10" asChild>
                  <Link to="/contractors">Become a Partner</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
