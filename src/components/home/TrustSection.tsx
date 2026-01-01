import { Shield, Lock, Award, Star } from "lucide-react";

const trustBadges = [
  { icon: Shield, label: "Bank-Level Security" },
  { icon: Lock, label: "256-bit Encryption" },
  { icon: Award, label: "BBB A+ Rated" },
];

const testimonials = [
  {
    quote: "HomeFund made our kitchen renovation possible. The process was seamless and the team was incredibly supportive throughout.",
    author: "Sarah M.",
    role: "Homeowner in California",
    rating: 5,
  },
  {
    quote: "As a contractor, I love working with HomeFund. Payments are always on time and my clients are happy with the financing options.",
    author: "Mike D.",
    role: "Licensed Contractor",
    rating: 5,
  },
  {
    quote: "We got approved in minutes and started our bathroom remodel the same week. Couldn't be happier with the experience.",
    author: "James & Lisa R.",
    role: "Homeowners in Texas",
    rating: 5,
  },
];

const TrustSection = () => {
  return (
    <section className="py-24 bg-foreground text-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {trustBadges.map((badge, idx) => (
            <div key={idx} className="flex items-center gap-3 px-6 py-3 rounded-xl bg-background/10 backdrop-blur-sm">
              <badge.icon className="w-6 h-6 text-primary" />
              <span className="font-medium">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-background/70 text-lg">
            See what our customers and partners have to say
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              className="bg-background/5 backdrop-blur-sm rounded-2xl p-8 border border-background/10 hover:bg-background/10 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>
              
              <blockquote className="text-background/90 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              
              <div>
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-sm text-background/60">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16 pt-16 border-t border-background/10">
          {[
            { value: "$500M+", label: "Funded Projects" },
            { value: "50,000+", label: "Happy Homeowners" },
            { value: "5,000+", label: "Partner Contractors" },
            { value: "4.9/5", label: "Customer Rating" },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-3xl sm:text-4xl font-bold text-primary mb-2">{stat.value}</p>
              <p className="text-background/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
