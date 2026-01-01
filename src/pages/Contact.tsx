import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Clock, MessageCircle, ArrowRight } from "lucide-react";

const contactMethods = [
  {
    icon: Phone,
    title: "Phone",
    description: "Talk to our team",
    value: "1-800-123-4567",
    link: "tel:1-800-123-4567",
  },
  {
    icon: Mail,
    title: "Email",
    description: "Send us a message",
    value: "hello@homefund.com",
    link: "mailto:hello@homefund.com",
  },
  {
    icon: MapPin,
    title: "Office",
    description: "Visit our headquarters",
    value: "123 Finance St, New York, NY",
    link: "#",
  },
  {
    icon: Clock,
    title: "Hours",
    description: "When we're available",
    value: "Mon-Fri: 8am-8pm EST",
    link: "#",
  },
];

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                Contact Us
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-6">
                We're Here to Help
              </h1>
              <p className="text-xl text-muted-foreground">
                Have questions about financing your home project? Our team is ready to assist you every step of the way.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, idx) => (
                <a
                  key={idx}
                  href={method.link}
                  className="bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                    <method.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-1">{method.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                  <p className="text-sm font-medium text-primary">{method.value}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">Send Us a Message</h2>
                <p className="text-muted-foreground mb-8">
                  Fill out the form below and we'll get back to you within 24 hours. 
                  For urgent matters, please call us directly.
                </p>

                <div className="bg-accent rounded-2xl p-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Live Chat Available</h3>
                      <p className="text-sm text-muted-foreground">Get instant answers from our support team</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">For Homeowners:</strong> Questions about your 
                    application, payment options, or project financing? We're here to help.
                  </p>
                  <p>
                    <strong className="text-foreground">For Contractors:</strong> Interested in becoming 
                    a partner or need support with the portal? Reach out anytime.
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-3xl p-8 shadow-card">
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
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input id="phone" type="tel" placeholder="(555) 123-4567" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" placeholder="How can we help?" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us more about your question or project..."
                      className="mt-1 min-h-[150px]"
                    />
                  </div>
                  <Button className="w-full" size="lg">
                    Send Message
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

export default Contact;
