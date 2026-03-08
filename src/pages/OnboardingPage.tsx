import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, User, Building2, MapPin, BarChart3, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const industries = [
  "Chartered Accountant (CA)",
  "Legal / Law Firm",
  "Medical / Healthcare",
  "Education",
  "Real Estate",
  "IT / Software",
  "Finance / Banking",
  "Manufacturing",
  "Retail / E-commerce",
  "Government",
  "Freelancer / Consultant",
  "Other",
];

const useCases = [
  "Store & organize business documents",
  "Quick document retrieval for clients",
  "Tax filing & compliance",
  "Team document collaboration",
  "Personal document management",
  "Invoice & billing management",
  "Legal case file management",
  "Other",
];

const docVolumes = [
  "Less than 50/month",
  "50 - 200/month",
  "200 - 500/month",
  "500 - 1000/month",
  "1000+/month",
];

const storageMethods = [
  "Physical files only",
  "Google Drive / Dropbox",
  "Local hard drive / USB",
  "WhatsApp / Email attachments",
  "Existing DMS software",
  "Mix of physical & digital",
];

const teamSizes = ["Just me", "2-5", "6-15", "16-50", "50+"];

const designations = [
  "Founder / Owner",
  "CA / Accountant",
  "Lawyer / Advocate",
  "Manager",
  "Director",
  "CEO / CTO",
  "Freelancer",
  "Student",
  "Other",
];

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Other",
];

const majorCities = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad",
  "Chennai", "Kolkata", "Pune", "Jaipur", "Lucknow",
  "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal",
  "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Surat", "Chandigarh", "Coimbatore",
  "Other",
];

const referralSources = [
  "Google Search",
  "Social Media",
  "Friend / Colleague",
  "WhatsApp",
  "YouTube",
  "Blog / Article",
  "Other",
];

const steps = [
  { icon: User, title: "About You", subtitle: "Tell us about yourself" },
  { icon: Building2, title: "Your Work", subtitle: "Industry & use case" },
  { icon: MapPin, title: "Contact", subtitle: "Location & referral" },
  { icon: BarChart3, title: "Documents", subtitle: "Volume & storage" },
];

interface FormData {
  full_name: string;
  company_name: string;
  designation: string;
  industry: string;
  use_case: string;
  phone_number: string;
  city: string;
  state: string;
  referral_source: string;
  estimated_monthly_docs: string;
  current_storage_method: string;
  team_size: string;
}

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    full_name: "",
    company_name: "",
    designation: "",
    industry: "",
    use_case: "",
    phone_number: "",
    city: "",
    state: "",
    referral_source: "",
    estimated_monthly_docs: "",
    current_storage_method: "",
    team_size: "",
  });

  const update = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canProceed = () => {
    if (step === 0) return form.full_name.trim().length > 0;
    if (step === 1) return form.industry.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase
        .from("profiles")
        .update({
          ...form,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Welcome to Sortify! 🎉");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const next = () => {
    if (step < 3) { setDirection(1); setStep(step + 1); }
    else handleSubmit();
  };
  const prev = () => { setDirection(-1); setStep(step - 1); };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xl font-bold gradient-text">Sortify</span>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < 3 && (
                <div className={`w-8 h-0.5 rounded-full ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl"
        >
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">{steps[step].title}</h2>
            <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-4"
            >
              {step === 0 && (
                <>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Full Name *</Label>
                    <Input
                      value={form.full_name}
                      onChange={(e) => update("full_name", e.target.value)}
                      placeholder="Your full name"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Company / Business Name</Label>
                    <Input
                      value={form.company_name}
                      onChange={(e) => update("company_name", e.target.value)}
                      placeholder="e.g., Sharma & Associates"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Designation / Role</Label>
                    <Select value={form.designation} onValueChange={(v) => update("designation", v)}>
                      <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                      <SelectContent>
                        {designations.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Industry *</Label>
                    <Select value={form.industry} onValueChange={(v) => update("industry", v)}>
                      <SelectTrigger><SelectValue placeholder="Select your industry" /></SelectTrigger>
                      <SelectContent>
                        {industries.map((i) => (
                          <SelectItem key={i} value={i}>{i}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Primary Use Case</Label>
                    <Select value={form.use_case} onValueChange={(v) => update("use_case", v)}>
                      <SelectTrigger><SelectValue placeholder="How will you use Sortify?" /></SelectTrigger>
                      <SelectContent>
                        {useCases.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Phone Number</Label>
                    <Input
                      value={form.phone_number}
                      onChange={(e) => update("phone_number", e.target.value)}
                      placeholder="91XXXXXXXXXX"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">City</Label>
                      <Input
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="e.g., Mumbai"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1.5 block">State</Label>
                      <Input
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                        placeholder="e.g., Maharashtra"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">How did you hear about us?</Label>
                    <Select value={form.referral_source} onValueChange={(v) => update("referral_source", v)}>
                      <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                      <SelectContent>
                        {referralSources.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Estimated Monthly Documents</Label>
                    <Select value={form.estimated_monthly_docs} onValueChange={(v) => update("estimated_monthly_docs", v)}>
                      <SelectTrigger><SelectValue placeholder="Select volume" /></SelectTrigger>
                      <SelectContent>
                        {docVolumes.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Current Storage Method</Label>
                    <Select value={form.current_storage_method} onValueChange={(v) => update("current_storage_method", v)}>
                      <SelectTrigger><SelectValue placeholder="How do you store files now?" /></SelectTrigger>
                      <SelectContent>
                        {storageMethods.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">Team Size</Label>
                    <Select value={form.team_size} onValueChange={(v) => update("team_size", v)}>
                      <SelectTrigger><SelectValue placeholder="How many people?" /></SelectTrigger>
                      <SelectContent>
                        {teamSizes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <Button variant="outline" onClick={prev} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={next}
              disabled={!canProceed() || loading}
              className="gap-2 font-semibold"
            >
              {step === 3 ? (loading ? "Saving..." : "Complete Setup") : "Next"}
              {step < 3 && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {/* Step label */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Step {step + 1} of 4
        </p>
      </div>
    </div>
  );
};

export default OnboardingPage;
