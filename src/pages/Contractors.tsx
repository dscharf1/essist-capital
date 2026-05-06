import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/calculations";
import { DollarSign, CheckCircle2, Loader2, ArrowRight, HelpCircle, ChevronDown } from "lucide-react";

const SERVICE_AREAS = ["Hudson","Essex","Bergen","Union","Passaic","Middlesex","Monmouth","Other NJ","NY"];

const HOW_IT_WORKS = [
  { step: "01", title: "Refer Your Client", desc: "Tell your clients about Essist Capital and share our application link. They apply online in minutes." },
  { step: "02", title: "They Get Funded", desc: "Once approved, your client receives their loan funds quickly and your project can start." },
  { step: "03", title: "You Earn Your Fee", desc: "After funding is confirmed, we pay you 2% of the financed project value directly." },
];

const FAQ = [
  { q: "How much can I earn per referral?", a: "You earn 2% of the total project amount financed. For example, a $20,000 project earns you $400." },
  { q: "When do I get paid?", a: "Referral fees are paid within 15 business days after your client's loan is funded and the project begins." },
  { q: "Is there a limit to how many clients I can refer?", a: "No limit. Refer as many clients as you like." },
  { q: "Does my client need to be approved for me to earn a fee?", a: "Referral fees are only paid when a client is funded. Applications that are not approved do not generate a fee." },
  { q: "Do I need to be licensed to participate?", a: "You should hold a valid contractor license in NJ or NY. License information is collected during signup and may be verified." },
];

const Contractors = () => {
  const { toast } = useToast();
  const [projectValue, setProjectValue] = useState(15000);
  const referralFee = Math.round(projectValue * 0.02 * 100) / 100;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company_name: "",
    phone: "",
    email: "",
    license_number: "",
    service_area: [] as string[],
    years_in_business: "",
  });

  const setField = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }));
  const toggleArea = (area: string) =>
    setForm((p) => ({
      ...p,
      service_area: p.service_area.includes(area)
        ? p.service_area.filter((a) => a !== area)
        : [...p.service_area, area],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from("contractor_leads").insert({
        name: form.name,
        company_name: form.company_name || null,
        phone: form.phone,
        email: form.email,
        license_number: form.license_number || null,
        service_area: form.service_area.join(", ") || null,
        years_in_business: form.years_in_business ? parseInt(form.years_in_business) : null,
        referral_count: 0,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "Application submitted!", description: "We will be in touch within 1-2 business days." });
    } catch {
      toast({ title: "Submission failed. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-[#0d1f1e] text-white py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
            <span className="inline-block bg-[#0d9488]/20 text-[#0d9488] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              For Contractors
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Earn More from Every Project</h1>
            <p className="text-white/70 text-lg mb-8">
              Partner with Essist Capital to offer your clients flexible home improvement financing and earn a 2% referral fee on every funded project in NJ and NY.
            </p>
            <Button
              className="bg-[#0d9488] hover:bg-[#a8893c] text-[#0d1f1e] font-semibold px-8"
              size="lg"
              onClick={() => document.getElementById("signup-form")?.scrollIntoView({ behavior: "smooth" })}
            >
              Join as a Partner <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2">How It Works</h2>
              <p className="text-muted-foreground">Three simple steps to start earning</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#0d1f1e] text-[#0d9488] flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Referral Calculator */}
        <section className="py-16 bg-[#0d1f1e]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Referral Fee Calculator</h2>
              <p className="text-white/60">See how much you can earn</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <Label className="text-white">Project Value</Label>
                  <span className="text-2xl font-bold text-[#0d9488]">{formatCurrency(projectValue)}</span>
                </div>
                <Slider
                  value={[projectValue]}
                  onValueChange={([v]) => setProjectValue(v)}
                  min={5000}
                  max={30000}
                  step={500}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>$5,000</span>
                  <span>$30,000</span>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-[#0d9488]/10 border border-[#0d9488]/30 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#0d9488]/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#0d9488]" />
                </div>
                <div>
                  <p className="text-white/60 text-sm">Your Referral Fee (2%)</p>
                  <p className="text-3xl font-bold text-[#0d9488]">{formatCurrency(referralFee)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Signup Form */}
        <section id="signup-form" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-2">Join the Partner Network</h2>
              <p className="text-muted-foreground">
                Sign up below and our team will reach out within 1-2 business days.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">You are on the list!</h3>
                <p className="text-muted-foreground">We will reach out shortly to get you set up as a partner.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card rounded-3xl p-8 shadow-card space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name *</Label>
                    <Input className="mt-1" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="John Smith" required />
                  </div>
                  <div>
                    <Label>Company Name</Label>
                    <Input className="mt-1" value={form.company_name} onChange={(e) => setField("company_name", e.target.value)} placeholder="Smith Contracting LLC" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone *</Label>
                    <Input className="mt-1" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="(201) 555-0100" required />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input className="mt-1" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="john@smithcontracting.com" required />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>License Number</Label>
                    <Input className="mt-1" value={form.license_number} onChange={(e) => setField("license_number", e.target.value)} placeholder="NJ-12345" />
                  </div>
                  <div>
                    <Label>Years in Business</Label>
                    <Input className="mt-1" type="number" min="0" value={form.years_in_business} onChange={(e) => setField("years_in_business", e.target.value)} placeholder="10" />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Service Area (select all that apply)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {SERVICE_AREAS.map((area) => (
                      <label key={area} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox checked={form.service_area.includes(area)} onCheckedChange={() => toggleArea(area)} />
                        <span className="text-sm">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full bg-[#0d1f1e] hover:bg-[#1a3330] text-white" size="lg" disabled={isLoading}>
                  {isLoading
                    ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting...</>
                    : <>Submit Application <ArrowRight className="w-5 h-5 ml-2" /></>
                  }
                </Button>
              </form>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
            <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {FAQ.map((item, idx) => (
                <div key={idx} className="bg-card rounded-2xl overflow-hidden border">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-sm"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                      {item.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openFaq === idx ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4 text-sm text-muted-foreground border-t pt-3">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Contractors;
