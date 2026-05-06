import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  calculateMonthlyPayment,
  calculateTotalRepayment,
  calculateFinanceCharge,
  calculateOriginationFee,
  calculateAPR,
  getFlatRate,
  formatCurrency,
} from "@/lib/calculations";
import { email as emailLib } from "@/lib/email";
import { analytics } from "@/lib/analytics";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, Building2, User, Download } from "lucide-react";
import jsPDF from "jspdf";

const VALID_TERMS = [3, 6, 12] as const;
type ValidTerm = (typeof VALID_TERMS)[number];

const PROJECT_TYPES = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "roof", label: "Roof" },
  { value: "hvac", label: "HVAC" },
  { value: "windows", label: "Windows" },
  { value: "flooring", label: "Flooring" },
  { value: "outdoor", label: "Outdoor" },
  { value: "other", label: "Other" },
];

const PROPERTY_TYPES = [
  { value: "single_family", label: "Single Family" },
  { value: "multi_family", label: "Multi-Family" },
  { value: "condo", label: "Condo" },
  { value: "mixed_use", label: "Mixed Use" },
];

const NJ_COUNTIES = ["Hudson", "Essex", "Bergen", "Union", "Passaic", "Middlesex", "Monmouth"];

const STEPS = [
  "Borrower Type",
  "Personal Info",
  "Property Info",
  "Project Details",
  "TILA Disclosure",
  "Sign & Submit",
];

interface FormData {
  borrowerType: "individual" | "llc";
  llcName: string;
  ein: string;
  yearsInBusiness: string;
  stateOfFormation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: "NJ" | "NY" | "";
  propertyZip: string;
  propertyType: string;
  projectType: string;
  projectDescription: string;
  contractorName: string;
  loanAmount: number;
  termMonths: ValidTerm;
  paymentType: "interest_only" | "principal_and_interest";
  tilaAccepted: boolean;
  esignatureText: string;
  esignatureAgreed: boolean;
}

const Apply = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    borrowerType: "individual",
    llcName: "",
    ein: "",
    yearsInBusiness: "",
    stateOfFormation: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    propertyAddress: "",
    propertyCity: "",
    propertyState: "",
    propertyZip: "",
    propertyType: "",
    projectType: "",
    projectDescription: "",
    contractorName: "",
    loanAmount: 15000,
    termMonths: 12 as ValidTerm,

    paymentType: "principal_and_interest",
    tilaAccepted: false,
    esignatureText: "",
    esignatureAgreed: false,
  });

  useEffect(() => {
    if (user && profile) {
      setForm((prev) => ({
        ...prev,
        firstName: profile.first_name || prev.firstName,
        lastName: profile.last_name || prev.lastName,
        email: profile.email || user.email || prev.email,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [user, profile]);

  useEffect(() => {
    if (step === 1) analytics.applicationStarted();
  }, []);

  const set = (field: keyof FormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Computed loan values (borrower-type aware)
  const bt = form.borrowerType;
  const monthly        = calculateMonthlyPayment(form.loanAmount, form.termMonths, bt);
  const totalRepayment = calculateTotalRepayment(form.loanAmount, form.termMonths, bt);
  const financeCharge  = calculateFinanceCharge(form.loanAmount, form.termMonths, bt);
  const originationFee = calculateOriginationFee(form.loanAmount, bt);
  const apr            = calculateAPR(form.loanAmount, form.termMonths, bt);

  const downloadTILA = () => {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const navy = [13, 31, 30] as [number, number, number];
    const gold = [13, 148, 136] as [number, number, number];
    const w = doc.internal.pageSize.getWidth();

    // Header bar
    doc.setFillColor(...navy);
    doc.rect(0, 0, w, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("ESSIST CAPITAL LLC", 14, 12);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.setTextColor(...gold);
    doc.text("FEDERAL TRUTH IN LENDING DISCLOSURE", 14, 20);
    doc.setTextColor(200, 200, 200);
    doc.text("Required by 15 U.S.C. § 1601 et seq. (Truth in Lending Act)", w - 14, 20, { align: "right" });

    // Borrower info
    doc.setTextColor(60, 60, 60); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Borrower: ${form.firstName} ${form.lastName}`, 14, 36);
    doc.text(`Date: ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`, 14, 42);
    doc.text(`Property: ${form.propertyAddress}, ${form.propertyCity}, ${form.propertyState} ${form.propertyZip}`, 14, 48);

    // Divider
    doc.setDrawColor(220, 220, 220); doc.line(14, 53, w - 14, 53);

    // TILA boxes
    const boxes = [
      { label: "Annual Percentage Rate (APR)", sub: "The cost of your credit as a yearly rate", value: `${apr.toFixed(2)}%` },
      { label: "Finance Charge", sub: "Dollar amount the credit will cost you", value: `$${financeCharge.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: "Amount Financed", sub: "The amount of credit provided to you", value: `$${form.loanAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
      { label: "Total of Payments", sub: "Amount you will have paid after all payments", value: `$${totalRepayment.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
    ];
    const bw = (w - 28 - 9) / 2;
    boxes.forEach((b, i) => {
      const x = 14 + (i % 2) * (bw + 9);
      const y = 58 + Math.floor(i / 2) * 32;
      doc.setFillColor(245, 245, 245); doc.roundedRect(x, y, bw, 27, 2, 2, "F");
      doc.setTextColor(120, 120, 120); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text(b.label.toUpperCase(), x + 4, y + 7);
      doc.setTextColor(...navy); doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text(b.value, x + 4, y + 17);
      doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont("helvetica", "normal");
      doc.text(b.sub, x + 4, y + 23);
    });

    // Payment schedule
    const py = 126;
    doc.setFillColor(...navy); doc.rect(14, py, w - 28, 8, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("PAYMENT SCHEDULE", 18, py + 5.5);
    const rows = [
      ["Number of Payments", `${form.termMonths}`],
      ["Amount of Each Payment", `$${monthly.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ["Payment Frequency", "Monthly"],
      ["Origination Fee", `$${originationFee.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ];
    rows.forEach(([l, v], i) => {
      const ry = py + 13 + i * 8;
      if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(14, ry - 4, w - 28, 8, "F"); }
      doc.setTextColor(80, 80, 80); doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(l, 18, ry);
      doc.setFont("helvetica", "bold");
      doc.text(v, w - 18, ry, { align: "right" });
    });

    // Disclosure note
    const noteY = py + 50;
    doc.setFillColor(255, 248, 220); doc.roundedRect(14, noteY, w - 28, 22, 2, 2, "F");
    doc.setDrawColor(220, 180, 80); doc.roundedRect(14, noteY, w - 28, 22, 2, 2, "S");
    doc.setTextColor(100, 70, 0); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("IMPORTANT NOTICE:", 18, noteY + 7);
    doc.setFont("helvetica", "normal");
    const noteText = `The flat add-on rate (${`${(getFlatRate(form.termMonths as ValidTerm, form.borrowerType) * 100).toFixed(0)}% flat`}) is applied to the original principal for the full term. The APR above reflects the true cost of credit as required by federal law. These are not the same figure.`;
    const noteLines = doc.splitTextToSize(noteText, w - 36);
    doc.text(noteLines, 18, noteY + 14);

    // Footer
    doc.setFillColor(...navy); doc.rect(0, doc.internal.pageSize.getHeight() - 16, w, 16, "F");
    doc.setTextColor(180, 180, 180); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text("Essist Capital LLC · Licensed in New Jersey & New York · dscharf@essistcap.com", w / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });

    doc.save(`essist-capital-tila-${form.firstName.toLowerCase()}-${form.lastName.toLowerCase()}.pdf`);
  };

  const canProceed: Record<number, boolean> = {
    1:
      form.borrowerType === "individual" ||
      (!!form.llcName && !!form.ein && !!form.yearsInBusiness),
    2: !!form.firstName && !!form.lastName && !!form.email && !!form.dateOfBirth,
    3: !!form.propertyAddress && !!form.propertyCity && !!form.propertyState && !!form.propertyZip && !!form.propertyType,
    4: !!form.projectType && form.loanAmount >= 5000 && form.loanAmount <= 30000 && !!form.paymentType,
    5: form.tilaAccepted,
    6: !!form.esignatureText && form.esignatureAgreed,
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          borrower_type: form.borrowerType,
          loan_amount: form.loanAmount,
          term_months: form.termMonths,
          monthly_payment: monthly,
          total_repayment: totalRepayment,
          origination_fee: originationFee,
          finance_charge: financeCharge,
          apr,
          project_type: form.projectType,
          project_description: form.projectDescription || null,
          property_address: form.propertyAddress,
          property_city: form.propertyCity,
          property_state: form.propertyState,
          property_zip: form.propertyZip,
          property_type: form.propertyType,
          contractor_name: form.contractorName || null,
          llc_name: form.borrowerType === "llc" ? form.llcName : null,
          ein: form.borrowerType === "llc" ? form.ein : null,
          payment_type: form.paymentType,
          status: "pending",
          tila_accepted: true,
          tila_accepted_at: now,
          esignature_text: form.esignatureText,
          esignature_timestamp: now,
        })
        .select()
        .single();

      if (error) throw error;

      try { await emailLib.onApplicationSubmit(data.id); } catch (_) { /* non-fatal */ }
      analytics.applicationCompleted(form.loanAmount);

      toast({ title: "Application submitted!", description: "We'll review your application and be in touch shortly." });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Step Indicators */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((label, idx) => {
                  const s = idx + 1;
                  return (
                    <div key={s} className="flex flex-col items-center flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          step > s
                            ? "bg-primary text-white"
                            : step === s
                            ? "bg-[#0d1f1e] text-white ring-2 ring-[#0d9488]"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                      </div>
                      <span className="text-[10px] mt-1 text-center text-muted-foreground hidden sm:block leading-tight max-w-[60px]">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-1.5 bg-muted rounded-full mt-2">
                <div
                  className="h-1.5 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-card rounded-3xl p-8 shadow-card">
              {/* ── Step 1: Borrower Type ── */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">Borrower Type</h2>
                    <p className="text-muted-foreground text-sm">Are you applying as an individual or as a business?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: "individual", label: "Individual", Icon: User },
                      { value: "llc", label: "LLC / Business", Icon: Building2 },
                    ].map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => set("borrowerType", value)}
                        className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                          form.borrowerType === value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <Icon className="w-8 h-8" />
                        <span className="font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>

                  {form.borrowerType === "llc" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div>
                        <Label>LLC Name *</Label>
                        <Input className="mt-1" value={form.llcName} onChange={(e) => set("llcName", e.target.value)} placeholder="Acme LLC" />
                      </div>
                      <div>
                        <Label>EIN *</Label>
                        <Input className="mt-1" value={form.ein} onChange={(e) => set("ein", e.target.value)} placeholder="12-3456789" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Years in Business *</Label>
                          <Input className="mt-1" type="number" min="0" value={form.yearsInBusiness} onChange={(e) => set("yearsInBusiness", e.target.value)} placeholder="5" />
                        </div>
                        <div>
                          <Label>State of Formation</Label>
                          <Select value={form.stateOfFormation} onValueChange={(v) => set("stateOfFormation", v)}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="State" /></SelectTrigger>
                            <SelectContent>
                              {["NJ", "NY", "DE", "CT", "PA", "Other"].map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button className="w-full" size="lg" disabled={!canProceed[1]} onClick={() => setStep(2)}>
                    Continue <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}

              {/* ── Step 2: Personal Info ── */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">Personal Information</h2>
                    <p className="text-muted-foreground text-sm">Tell us about yourself</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input className="mt-1" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="John" />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input className="mt-1" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Smith" />
                    </div>
                  </div>
                  <div>
                    <Label>Email Address *</Label>
                    <Input className="mt-1" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input className="mt-1" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(201) 555-0100" />
                  </div>
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input className="mt-1" type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(1)}>
                      <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                    <Button className="flex-1" size="lg" disabled={!canProceed[2]} onClick={() => setStep(3)}>
                      Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Property Info ── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">Property Information</h2>
                    <p className="text-muted-foreground text-sm">Where is the project located?</p>
                  </div>
                  <div>
                    <Label>Street Address *</Label>
                    <Input className="mt-1" value={form.propertyAddress} onChange={(e) => set("propertyAddress", e.target.value)} placeholder="123 Main Street" />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <Label>City *</Label>
                      <Input className="mt-1" value={form.propertyCity} onChange={(e) => set("propertyCity", e.target.value)} placeholder="Newark" />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Select value={form.propertyState} onValueChange={(v) => set("propertyState", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NJ">New Jersey</SelectItem>
                          <SelectItem value="NY">New York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ZIP Code *</Label>
                      <Input className="mt-1" value={form.propertyZip} onChange={(e) => set("propertyZip", e.target.value)} placeholder="07101" maxLength={5} />
                    </div>
                  </div>
                  <div>
                    <Label>Property Type *</Label>
                    <Select value={form.propertyType} onValueChange={(v) => set("propertyType", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select property type" /></SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((pt) => (
                          <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(2)}>
                      <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                    <Button className="flex-1" size="lg" disabled={!canProceed[3]} onClick={() => setStep(4)}>
                      Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Project Details ── */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">Project Details</h2>
                    <p className="text-muted-foreground text-sm">Tell us about your project and loan needs</p>
                  </div>
                  <div>
                    <Label>Project Type *</Label>
                    <Select value={form.projectType} onValueChange={(v) => set("projectType", v)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select project type" /></SelectTrigger>
                      <SelectContent>
                        {PROJECT_TYPES.map((pt) => (
                          <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Project Description</Label>
                    <Textarea className="mt-1 min-h-[90px]" value={form.projectDescription} onChange={(e) => set("projectDescription", e.target.value)} placeholder="Describe what you'd like to accomplish..." />
                  </div>
                  <div>
                    <Label>Contractor Name (if known)</Label>
                    <Input className="mt-1" value={form.contractorName} onChange={(e) => set("contractorName", e.target.value)} placeholder="ABC Contractors" />
                  </div>

                  {/* Loan Amount Slider */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label>Loan Amount *</Label>
                      <span className="text-lg font-bold text-primary">{formatCurrency(form.loanAmount)}</span>
                    </div>
                    <Slider
                      value={[form.loanAmount]}
                      onValueChange={([v]) => set("loanAmount", v)}
                      min={5000}
                      max={30000}
                      step={500}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>$5,000</span>
                      <span>$30,000</span>
                    </div>
                  </div>

                  {/* Term Selector */}
                  <div>
                    <Label className="mb-2 block">Repayment Term *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {VALID_TERMS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set("termMonths", t)}
                          className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                            form.termMonths === t
                              ? "border-primary bg-primary text-white"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          {t} months
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Structure Choice */}
                  <div>
                    <Label className="mb-2 block">Payment Structure *</Label>
                    <p className="text-xs text-muted-foreground mb-3">How would you like to make your monthly payments?</p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        {
                          value: "principal_and_interest",
                          label: "Principal & Interest",
                          desc: `Pay ${formatCurrency(monthly)}/mo — reduces your balance each month`,
                        },
                        {
                          value: "interest_only",
                          label: "Interest Only",
                          desc: `Pay ${formatCurrency(calculateFinanceCharge(form.loanAmount, form.termMonths) / form.termMonths)}/mo — lower payment, full balance due at end of term`,
                        },
                      ].map(({ value, label, desc }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set("paymentType", value)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            form.paymentType === value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <p className={`font-semibold text-sm ${form.paymentType === value ? "text-primary" : ""}`}>{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Payment Preview */}
                  <div className="p-4 bg-[#0d1f1e] rounded-2xl text-white">
                    <h4 className="font-semibold text-[#0d9488] mb-3">Payment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Monthly Payment</span>
                        <span className="font-bold text-lg text-[#0d9488]">{formatCurrency(monthly)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Total Repayment</span>
                        <span className="font-semibold">{formatCurrency(totalRepayment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Origination Fee</span>
                        <span>{formatCurrency(originationFee)}</span>
                      </div>
                    </div>
                    <p className="text-white/40 text-xs mt-3">Rate shown is a flat add-on rate, not APR.</p>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(3)}>
                      <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                    <Button className="flex-1" size="lg" disabled={!canProceed[4]} onClick={() => setStep(5)}>
                      Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 5: TILA Disclosure ── */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">Truth in Lending Disclosure</h2>
                    <p className="text-muted-foreground text-sm">Federal law requires we provide this disclosure before you sign</p>
                  </div>

                  <div className="border-2 border-[#0d1f1e] rounded-2xl overflow-hidden">
                    <div className="bg-[#0d1f1e] px-6 py-4">
                      <h3 className="text-white font-bold text-lg">FEDERAL TRUTH IN LENDING DISCLOSURE</h3>
                      <p className="text-white/60 text-xs mt-1">Essist Capital LLC — Required by 15 U.S.C. § 1601 et seq.</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-xl">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Annual Percentage Rate (APR)</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{apr.toFixed(2)}%</p>
                          <p className="text-xs text-muted-foreground mt-1">The cost of your credit as a yearly rate</p>
                        </div>
                        <div className="p-3 bg-muted rounded-xl">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Finance Charge</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(financeCharge)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Dollar amount the credit will cost you</p>
                        </div>
                        <div className="p-3 bg-muted rounded-xl">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Amount Financed</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(form.loanAmount)}</p>
                          <p className="text-xs text-muted-foreground mt-1">The amount of credit provided to you</p>
                        </div>
                        <div className="p-3 bg-muted rounded-xl">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total of Payments</p>
                          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalRepayment)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Amount you will have paid after all payments</p>
                        </div>
                      </div>

                      <div className="border border-border rounded-xl p-4">
                        <h4 className="font-semibold mb-3">Payment Schedule</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Number of Payments</span>
                            <span className="font-medium">{form.termMonths}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount of Each Payment</span>
                            <span className="font-medium">{formatCurrency(monthly)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frequency</span>
                            <span className="font-medium">Monthly</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Origination Fee</span>
                            <span className="font-medium">{formatCurrency(originationFee)}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <strong>Note:</strong> The rate shown ({`${(getFlatRate(form.termMonths as ValidTerm, form.borrowerType) * 100).toFixed(0)}% flat`}) is a flat add-on rate applied to the original loan amount, not an Annual Percentage Rate (APR). The APR above reflects the true cost of credit over the loan term as required by federal law.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-muted rounded-xl">
                    <Checkbox
                      id="tilaAccepted"
                      checked={form.tilaAccepted}
                      onCheckedChange={(checked) => set("tilaAccepted", !!checked)}
                      className="mt-0.5"
                    />
                    <Label htmlFor="tilaAccepted" className="text-sm leading-relaxed cursor-pointer">
                      I have read, understand, and acknowledge receipt of the Federal Truth in Lending Disclosure above. I confirm that I understand the Annual Percentage Rate, Finance Charge, Amount Financed, and Total of Payments before proceeding.
                    </Label>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={downloadTILA}
                      className="flex items-center gap-2 text-sm font-medium text-[#0d1f1e] hover:text-[#0d9488] transition-colors">
                      <Download className="w-4 h-4" /> Download TILA Disclosure (PDF)
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(4)}>
                      <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                    <Button className="flex-1" size="lg" disabled={!canProceed[5]} onClick={() => setStep(6)}>
                      Continue <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Step 6: E-Signature & Submit ── */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-1">Review &amp; Sign</h2>
                    <p className="text-muted-foreground text-sm">Review your loan agreement and provide your electronic signature</p>
                  </div>

                  {/* Application Summary */}
                  <div className="space-y-3 text-sm">
                    <div className="p-4 bg-muted rounded-xl">
                      <h4 className="font-semibold mb-2 text-[#0d1f1e]">Borrower</h4>
                      <p>{form.firstName} {form.lastName} {form.borrowerType === "llc" ? `(${form.llcName})` : ""}</p>
                      <p className="text-muted-foreground">{form.email}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-xl">
                      <h4 className="font-semibold mb-2 text-[#0d1f1e]">Property</h4>
                      <p>{form.propertyAddress}, {form.propertyCity}, {form.propertyState} {form.propertyZip}</p>
                    </div>
                    <div className="p-4 bg-[#0d1f1e] rounded-xl text-white">
                      <h4 className="font-semibold mb-3 text-[#0d9488]">Loan Agreement</h4>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">Loan Amount</span>
                          <span className="font-semibold">{formatCurrency(form.loanAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Term</span>
                          <span>{form.termMonths} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Monthly Payment</span>
                          <span className="font-bold text-[#0d9488]">{formatCurrency(monthly)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">Origination Fee</span>
                          <span>{formatCurrency(originationFee)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/20 pt-1.5 mt-1.5">
                          <span className="text-white/70">Total Repayment</span>
                          <span className="font-bold">{formatCurrency(totalRepayment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/70">APR</span>
                          <span>{apr.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Repayment Schedule Preview */}
                  <div className="border rounded-xl overflow-hidden">
                    <div className="bg-muted px-4 py-2">
                      <h4 className="font-semibold text-sm">Repayment Schedule (first 3 payments shown)</h4>
                    </div>
                    <div className="divide-y">
                      {Array.from({ length: Math.min(3, form.termMonths) }, (_, i) => {
                        const date = new Date();
                        date.setMonth(date.getMonth() + i + 1);
                        return (
                          <div key={i} className="flex justify-between px-4 py-2 text-sm">
                            <span className="text-muted-foreground">Payment {i + 1} — {date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                            <span className="font-medium">{formatCurrency(monthly)}</span>
                          </div>
                        );
                      })}
                      {form.termMonths > 3 && (
                        <div className="px-4 py-2 text-xs text-muted-foreground bg-muted/50">
                          + {form.termMonths - 3} more payments of {formatCurrency(monthly)} each
                        </div>
                      )}
                    </div>
                  </div>

                  {/* E-Signature */}
                  <div className="space-y-3">
                    <div>
                      <Label>Electronic Signature *</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">Type your full legal name to sign this agreement</p>
                      <Input
                        className="mt-1 font-serif text-lg"
                        value={form.esignatureText}
                        onChange={(e) => set("esignatureText", e.target.value)}
                        placeholder="Full legal name"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Signed: {new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="esignatureAgreed"
                        checked={form.esignatureAgreed}
                        onCheckedChange={(checked) => set("esignatureAgreed", !!checked)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="esignatureAgreed" className="text-sm leading-relaxed cursor-pointer">
                        I agree that this electronic signature is legally binding and constitutes my agreement to the loan terms above, including the TILA disclosures I reviewed.
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" size="lg" onClick={() => setStep(5)} disabled={isLoading}>
                      <ArrowLeft className="w-5 h-5 mr-2" /> Back
                    </Button>
                    <Button
                      className="flex-1 bg-[#0d1f1e] hover:bg-[#1a3330] text-white"
                      size="lg"
                      disabled={!canProceed[6] || isLoading}
                      onClick={handleSubmit}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting...</>
                      ) : (
                        <>Submit Application <ArrowRight className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;
