import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Phone } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-card rounded-3xl p-8 sm:p-12 lg:p-16 shadow-card text-center max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Start Your{" "}
            <span className="gradient-text">Home Project?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of homeowners who have transformed their homes with HomeFund. 
            Apply in minutes and get instant approval.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <Button variant="hero" asChild>
              <Link to="/homeowners" className="gap-2">
                Apply Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" asChild>
              <Link to="/contact" className="gap-2">
                <Phone className="w-5 h-5" />
                Talk to an Expert
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            No impact on your credit score • Get approved in minutes • 0% APR available
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
