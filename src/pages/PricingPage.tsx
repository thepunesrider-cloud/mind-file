import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, X, Zap, ArrowRight, Crown, Rocket, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SupportChat } from "@/components/SupportChat";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  icon: React.ElementType;
  price: string;
  period: string;
  tagline: string;
  storage: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
  gradient?: string;
}

const plans: Plan[] = [
  {
    name: "Free",
    icon: Zap,
    price: "₹0",
    period: "/month",
    tagline: "Get started with AI-powered file intelligence",
    storage: "100 MB (~50 documents)",
    features: [
      { text: "25 file uploads total", included: true },
      { text: "5 MB max file size", included: true },
      { text: "PDF, JPG, PNG supported", included: true },
      { text: "AI auto-tagging (15 tags/file)", included: true },
      { text: "AI document summary", included: true },
      { text: "Natural language search", included: true },
      { text: "Keyword search", included: true },
      { text: "Date auto-detection", included: true },
      { text: "5 active email reminders", included: true },
      { text: "5 shareable links/month", included: true },
      { text: "Web app only", included: true },
      { text: "Community forum support", included: true },
      { text: "WhatsApp features", included: false },
      { text: "Team features", included: false },
      { text: "API access", included: false },
    ],
    cta: "Get Started Free",
  },
  {
    name: "Starter",
    icon: Rocket,
    price: "₹299",
    period: "/month",
    tagline: "For individuals who need more space & WhatsApp alerts",
    storage: "1 GB (~500 documents)",
    features: [
      { text: "Unlimited file uploads", included: true },
      { text: "25 MB max file size", included: true },
      { text: "PDF, JPG, PNG, DOCX, XLSX", included: true },
      { text: "All AI features (Free plan)", included: true },
      { text: "Unlimited email reminders", included: true },
      { text: "WhatsApp reminder alerts", included: true },
      { text: "Android app access", included: true },
      { text: "50 shareable links/month", included: true },
      { text: "API read access (beta)", included: true },
      { text: "Email support (48hr)", included: true },
      { text: "WhatsApp chatbot", included: false },
      { text: "Team features", included: false },
    ],
    cta: "Start Starter Plan",
  },
  {
    name: "Pro",
    icon: Crown,
    price: "₹799",
    period: "/month",
    tagline: "Full WhatsApp chatbot + team collaboration",
    storage: "50 GB (~25,000 documents)",
    popular: true,
    gradient: "from-primary/20 to-primary/5",
    features: [
      { text: "Everything in Starter", included: true },
      { text: "WhatsApp chatbot — upload docs", included: true },
      { text: "WhatsApp chatbot — search & retrieve", included: true },
      { text: "WhatsApp chatbot — order documents", included: true },
      { text: "WhatsApp reminder management", included: true },
      { text: "Sub-300ms priority search", included: true },
      { text: "Bulk folder upload", included: true },
      { text: "Gmail & Outlook plugin", included: true },
      { text: "Up to 5 team members", included: true },
      { text: "Advanced analytics dashboard", included: true },
      { text: "Custom tags & categories", included: true },
      { text: "Document expiry risk score", included: true },
      { text: "Unlimited shareable links", included: true },
      { text: "Full API access", included: true },
      { text: "Priority email support (24hr)", included: true },
    ],
    cta: "Go Pro",
  },
  {
    name: "Business",
    icon: Building2,
    price: "₹2,499",
    period: "/month",
    tagline: "For teams that need compliance & integrations",
    storage: "1 TB (~500,000 documents)",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited team members", included: true },
      { text: "WhatsApp Group Archiver", included: true },
      { text: "Admin dashboard + user mgmt", included: true },
      { text: "SSO (Google / Microsoft)", included: true },
      { text: "Tally Prime + Zoho integration", included: true },
      { text: "Bulk migration tool", included: true },
      { text: "Custom branding on shared links", included: true },
      { text: "Compliance reports + audit logs", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "WhatsApp + phone support", included: true },
      { text: "4-hour SLA", included: true },
    ],
    cta: "Start Business Plan",
  },
  {
    name: "Enterprise",
    icon: Globe,
    price: "Custom",
    period: "",
    tagline: "Unlimited storage, on-premise, custom AI",
    storage: "Unlimited",
    features: [
      { text: "Everything in Business", included: true },
      { text: "On-premise deployment", included: true },
      { text: "Custom AI model on your data", included: true },
      { text: "DPDP / GDPR compliance packs", included: true },
      { text: "SOC 2 Type II", included: true },
      { text: "Custom integrations", included: true },
      { text: "Dedicated infrastructure", included: true },
      { text: "Legal DPA + custom contract", included: true },
      { text: "24/7 support — 1-hour SLA", included: true },
    ],
    cta: "Contact Sales",
  },
];

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">Sortify</span>
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">
              Sign In
            </Button>
            <Button onClick={() => navigate("/login")} className="text-sm font-semibold gap-2">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4">
            Simple, transparent
            <br />
            <span className="gradient-text">pricing.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI features included in every plan. Upgrade for more storage, WhatsApp chatbot, and team features.
          </p>
        </motion.div>
      </section>

      {/* Plans */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className={cn(
                "relative flex flex-col rounded-3xl border p-6 transition-all duration-300 hover:shadow-xl",
                plan.popular
                  ? "border-primary/50 bg-gradient-to-b from-primary/10 to-background shadow-lg shadow-primary/10 scale-[1.02]"
                  : "border-border/50 bg-card hover:border-primary/30"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <plan.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{plan.tagline}</p>
              </div>

              <div className="mb-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">{plan.storage}</p>

              <Button
                onClick={() => navigate("/login")}
                className={cn(
                  "w-full mb-6 font-semibold",
                  plan.popular ? "" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
                variant={plan.popular ? "default" : "secondary"}
              >
                {plan.cta}
              </Button>

              <div className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <div key={f.text} className="flex items-start gap-2">
                    {f.included ? (
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                    )}
                    <span className={cn("text-xs leading-relaxed", !f.included && "text-muted-foreground/50")}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold gradient-text">Sortify</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Sortify. AI-Powered File Intelligence.</p>
        </div>
      </footer>

      <SupportChat />
    </div>
  );
};

export default PricingPage;
