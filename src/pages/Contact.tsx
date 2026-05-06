import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, MapPin, Clock, ArrowRight, Loader2 } from "lucide-react";

const contactMethods = [
  { icon: Mail, title: "Email", value: "dscharf@essistcap.com", link: "mailto:dscharf@essistcap.com" },
  { icon: MapPin, title: "Service Area", value: "New Jersey & New York", link: "#" },
  { icon: Clock, title: "Hours", value: "Mon–Fri · 9am–6pm EST", link: "#" },
];

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", subject: "", message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.email || !form.message) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      subject: form.subject || null,
      message: form.message,
    });
    if (!error) {
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
      setForm({ first_name: "", last_name: "", email: "", phone: "", subject: "", message: "" });
    } else {
      toast({ title: "Failed to send message", description: "Please try again.", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#091918" }}>
      <Header />

      {/* Hero */}
      <section className="relative pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 0%,rgba(13,148,136,0.08) 0%,transparent 70%)",
        }} />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-[#0d9488] mb-6"
            style={{ border: "1px solid rgba(13,148,136,0.25)", background: "rgba(13,148,136,0.07)" }}>
            Contact
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">We're here to help.</h1>
          <p className="text-white/45 text-lg max-w-lg mx-auto">
            Questions about your application, loan terms, or anything else — reach us directly.
          </p>
        </div>
      </section>

      {/* Contact methods */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <div className="grid grid-cols-3 gap-4">
            {contactMethods.map((m, i) => (
              <a key={i} href={m.link}
                className="rounded-2xl p-5 text-center transition-all"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "rgba(13,148,136,0.12)" }}>
                  <m.icon className="w-4 h-4 text-[#0d9488]" />
                </div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">{m.title}</p>
                <p className="text-white text-xs font-medium leading-snug">{m.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
          <div className="rounded-2xl p-8"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h2 className="text-xl font-bold text-white mb-1">Send a message</h2>
            <p className="text-white/35 text-sm mb-6">We respond within 24 hours on business days.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/50 text-xs">First Name <span className="text-red-400">*</span></Label>
                  <Input className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30"
                    placeholder="John" value={form.first_name}
                    onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-white/50 text-xs">Last Name</Label>
                  <Input className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30"
                    placeholder="Smith" value={form.last_name}
                    onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label className="text-white/50 text-xs">Email <span className="text-red-400">*</span></Label>
                <Input type="email" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30"
                  placeholder="john@example.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>

              <div>
                <Label className="text-white/50 text-xs">Phone <span className="text-white/25">(optional)</span></Label>
                <Input type="tel" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30"
                  placeholder="(555) 123-4567" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>

              <div>
                <Label className="text-white/50 text-xs">Subject</Label>
                <Input className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30"
                  placeholder="How can we help?" value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
              </div>

              <div>
                <Label className="text-white/50 text-xs">Message <span className="text-red-400">*</span></Label>
                <Textarea className="mt-1 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#0d9488]/30"
                  placeholder="Tell us about your project or question..."
                  value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              </div>

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-bold text-[#0d1f1e] text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#0d9488,#2dd4bf)" }}>
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  : <><ArrowRight className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
