import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useWorkflow } from "@/hooks/useWorkflow";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

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

const Apply = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { submitApplication, isLoading } = useWorkflow();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    projectType: "",
    projectDescription: "",
    requestedAmount: 25000,
    materialsPercentage: 60,
  });

  // Pre-fill form with user profile data
  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || prev.firstName,
        lastName: profile.last_name || prev.lastName,
        email: profile.email || user.email || prev.email,
        phone: profile.phone || prev.phone,
      }));
    }
  }, [user, profile]);

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const materialsAmount = (formData.requestedAmount * formData.materialsPercentage) / 100;
  const laborAmount = formData.requestedAmount - materialsAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await submitApplication({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        projectType: formData.projectType,
        projectDescription: formData.projectDescription,
        requestedAmount: formData.requestedAmount,
        materialsAmount,
        laborAmount,
        userId: user?.id,
      });

      navigate(`/application/${result.applicationId}`);
    } catch (error) {
      console.error("Application submission failed:", error);
    }
  };

  const canProceedStep1 = formData.firstName && formData.lastName && formData.email;
  const canProceedStep2 = formData.address && formData.city && formData.state && formData.zipCode;
  const canProceedStep3 = formData.projectType && formData.requestedAmount > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-12">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  {s < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 rounded transition-all ${
                        step > s ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="bg-card rounded-3xl p-8 shadow-card">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold mb-2">Personal Information</h1>
                      <p className="text-muted-foreground">Tell us about yourself</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => updateField("firstName", e.target.value)}
                          placeholder="John"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => updateField("lastName", e.target.value)}
                          placeholder="Smith"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                      />
                    </div>

                    <Button
                      type="button"
                      className="w-full"
                      size="lg"
                      disabled={!canProceedStep1}
                      onClick={() => setStep(2)}
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Address */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold mb-2">Property Address</h1>
                      <p className="text-muted-foreground">Where is the project located?</p>
                    </div>

                    <div>
                      <Label htmlFor="address">Street Address *</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => updateField("address", e.target.value)}
                        placeholder="123 Main Street"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => updateField("city", e.target.value)}
                          placeholder="New York"
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => updateField("state", e.target.value)}
                          placeholder="NY"
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="zipCode">Zip Code *</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => updateField("zipCode", e.target.value)}
                        placeholder="10001"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        size="lg"
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        size="lg"
                        disabled={!canProceedStep2}
                        onClick={() => setStep(3)}
                      >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Project Details */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold mb-2">Project Details</h1>
                      <p className="text-muted-foreground">Tell us about your project</p>
                    </div>

                    <div>
                      <Label>Project Type *</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {projectTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateField("projectType", type)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                              formData.projectType === type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="projectDescription">Project Description</Label>
                      <Textarea
                        id="projectDescription"
                        value={formData.projectDescription}
                        onChange={(e) => updateField("projectDescription", e.target.value)}
                        placeholder="Describe what you want to accomplish..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Total Project Amount *</Label>
                        <span className="text-lg font-bold text-primary">
                          ${formData.requestedAmount.toLocaleString()}
                        </span>
                      </div>
                      <Slider
                        value={[formData.requestedAmount]}
                        onValueChange={([v]) => updateField("requestedAmount", v)}
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
                        <Label>Materials vs Labor Split</Label>
                        <span className="text-sm font-medium">
                          {formData.materialsPercentage}% Materials / {100 - formData.materialsPercentage}% Labor
                        </span>
                      </div>
                      <Slider
                        value={[formData.materialsPercentage]}
                        onValueChange={([v]) => updateField("materialsPercentage", v)}
                        min={20}
                        max={80}
                        step={5}
                        className="py-2"
                      />
                      <div className="flex justify-between text-sm mt-3 p-4 bg-muted rounded-xl">
                        <div>
                          <span className="text-muted-foreground">Materials:</span>
                          <span className="ml-2 font-semibold text-primary">
                            ${materialsAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Labor:</span>
                          <span className="ml-2 font-semibold text-warm">
                            ${laborAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        size="lg"
                        onClick={() => setStep(2)}
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        size="lg"
                        disabled={!canProceedStep3}
                        onClick={() => setStep(4)}
                      >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {step === 4 && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-bold mb-2">Review Your Application</h1>
                      <p className="text-muted-foreground">Please confirm your information</p>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-xl">
                        <h3 className="font-semibold mb-2">Personal Information</h3>
                        <p className="text-sm text-muted-foreground">
                          {formData.firstName} {formData.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{formData.email}</p>
                        {formData.phone && (
                          <p className="text-sm text-muted-foreground">{formData.phone}</p>
                        )}
                      </div>

                      <div className="p-4 bg-muted rounded-xl">
                        <h3 className="font-semibold mb-2">Property Address</h3>
                        <p className="text-sm text-muted-foreground">
                          {formData.address}
                          <br />
                          {formData.city}, {formData.state} {formData.zipCode}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-xl">
                        <h3 className="font-semibold mb-2">Project Details</h3>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Type:</span> {formData.projectType}
                        </p>
                        {formData.projectDescription && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formData.projectDescription}
                          </p>
                        )}
                      </div>

                      <div className="p-4 bg-accent rounded-xl">
                        <h3 className="font-semibold mb-3">Funding Breakdown</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-bold text-lg">
                              ${formData.requestedAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Materials (Unlocked):</span>
                            <span className="font-semibold text-primary">
                              ${materialsAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Labor (Locked):</span>
                            <span className="font-semibold text-warm">
                              ${laborAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-border rounded-xl text-sm text-muted-foreground">
                        <p>
                          By submitting this application, you agree to receive a DocuSign document
                          for electronic signature. Once signed, your prepaid card will be issued
                          with materials funds unlocked. Labor funds will be released after
                          inspection approval.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        size="lg"
                        onClick={() => setStep(3)}
                        disabled={isLoading}
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Application
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;
