import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap, Brain, Search, Shield, Tag, Clock, FileText, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { SupportChat } from "@/components/SupportChat";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  { icon: Brain, title: "AI Summarization", desc: "Every document gets an intelligent summary — search by meaning, not just keywords." },
  { icon: Search, title: "10 Search Methods", desc: "Keyword, tag, entity, date, natural language, semantic, summary search and more." },
  { icon: Tag, title: "Auto Tagging", desc: "AI reads your files and generates relevant tags automatically on upload." },
  { icon: Shield, title: "Entity Extraction", desc: "Names, PAN numbers, GST numbers, amounts — all extracted and searchable." },
  { icon: Clock, title: "Smart Reminders", desc: "Never miss a deadline. AI detects expiry dates and sends you alerts." },
  { icon: Upload, title: "Drag & Drop Upload", desc: "Upload any file type. AI processes it in seconds with full metadata." },
];

const stats = [
  { value: "10+", label: "Search Methods" },
  { value: "<3s", label: "AI Processing" },
  { value: "100%", label: "Auto Tagged" },
  { value: "∞", label: "File Types" },
];

const Index = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">Sortify</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/pricing")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold gap-2"
            >
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered File Intelligence</span>
          </motion.div>

          <motion.h1
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold leading-[0.9] tracking-tight mb-6"
          >
            <span className="block">Find any</span>
            <span className="block gradient-text">document.</span>
            <span className="block text-muted-foreground/60">Instantly.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload your files. AI reads, summarizes, tags, and extracts every detail.
            Then search by describing what you remember — not the filename.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="h-14 px-8 text-base font-bold gap-2 rounded-2xl shadow-lg shadow-primary/25"
            >
              Start Organizing <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="h-14 px-8 text-base font-medium rounded-2xl"
            >
              See How It Works
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-extrabold gradient-text">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Not just storage.
              <br />
              <span className="text-muted-foreground/50">Intelligence.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 px-6 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-20"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
              How It Works
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Three steps.
              <br />
              <span className="text-muted-foreground/50">Zero effort.</span>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-16"
          >
            {[
              { step: "01", title: "Upload", desc: "Drag any document — PDF, image, spreadsheet, anything. Our AI takes it from here.", icon: Upload },
              { step: "02", title: "AI Analyzes", desc: "In seconds, AI extracts text, generates summaries, tags, entities, dates, and descriptions.", icon: Brain },
              { step: "03", title: "Search & Find", desc: "Describe what you remember. \"That invoice from last month\" — Sortify finds it instantly.", icon: Search },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                custom={i}
                variants={fadeUp}
                className="flex items-start gap-8"
              >
                <div className="shrink-0 w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-black gradient-text">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Stop searching.
            <br />
            <span className="gradient-text">Start finding.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join thousands who never lose a document again. AI-powered, privacy-first, blazing fast.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="h-14 px-10 text-base font-bold gap-2 rounded-2xl shadow-lg shadow-primary/25"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
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
    </div>
  );
};

export default Index;
