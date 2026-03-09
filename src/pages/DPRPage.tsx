import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Shield, Cpu, Users, Search, Bell, MessageCircle, FolderTree, ArrowLeftRight, HardDrive, Smartphone, BarChart3, Upload, Share2, Zap, Lock, Database, Globe, CheckCircle2, Clock, Target, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

const DPRPage = () => {
  const navigate = useNavigate();

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Download className="w-4 h-4" /> Export / Print
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16 print:py-4 print:space-y-8">
        {/* Title Page */}
        <section className="text-center space-y-6 pb-12 border-b border-border">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <FileText className="w-4 h-4" /> Detailed Project Report
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Sortify — AI File Manager
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            An intelligent cloud-based document management system powered by AI for automated metadata extraction, smart categorization, and instant retrieval.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-muted">Version 1.0</span>
            <span className="px-3 py-1 rounded-full bg-muted">March 2026</span>
            <span className="px-3 py-1 rounded-full bg-muted">Status: Live</span>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Table of Contents</h2>
          <div className="grid md:grid-cols-2 gap-2">
            {["1. Executive Summary", "2. Problem Statement", "3. Solution Overview", "4. System Architecture", "5. Core Features (Current)", "6. Technology Stack", "7. Database Schema", "8. Security & Privacy", "9. Current Stage & Milestones", "10. Future Roadmap", "11. Deployment & Infrastructure"].map((item) => (
              <div key={item} className="px-4 py-2.5 rounded-lg bg-muted/50 text-sm font-medium hover:bg-muted transition-colors cursor-default">{item}</div>
            ))}
          </div>
        </section>

        {/* 1. Executive Summary */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> 1. Executive Summary</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Sortify</strong> is an AI-powered cloud file management platform designed for individuals and small businesses who deal with high volumes of documents — invoices, contracts, identity proofs, certificates, and more. The platform automates the traditionally manual process of organizing, tagging, searching, and tracking documents.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Unlike generic cloud storage solutions (Google Drive, Dropbox), Sortify <strong className="text-foreground">understands document content</strong>. Upon upload, AI extracts text, identifies entities (dates, amounts, names, ID numbers), generates summaries, assigns smart tags, and detects expiry dates — all automatically. Users can then search across their entire document library using natural language, compare documents side-by-side, chat with their files using AI, and access documents via WhatsApp.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">9+</p>
                <p className="text-xs text-muted-foreground mt-1">Search Modes</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">15+</p>
                <p className="text-xs text-muted-foreground mt-1">Core Modules</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                <p className="text-2xl font-bold text-primary">100%</p>
                <p className="text-xs text-muted-foreground mt-1">Privacy-First</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Problem Statement */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Search className="w-5 h-5 text-primary" /> 2. Problem Statement</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Individuals and small businesses in India manage hundreds of critical documents — Aadhaar cards, PAN cards, insurance policies, property papers, invoices, contracts, and certificates. These documents are typically:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              {[
                "Scattered across physical folders, email attachments, WhatsApp messages, and multiple cloud drives",
                "Difficult to retrieve when urgently needed (e.g., during hospital visits, tax filing, legal proceedings)",
                "At risk of expiry without any tracking — insurance renewals, license expirations, contract deadlines go unnoticed",
                "Manually organized with inconsistent naming, no tagging, and no searchability beyond file names",
                "Vulnerable to loss from device damage, theft, or accidental deletion with no centralized backup",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-destructive/60 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed pt-2">
              <strong className="text-foreground">The core problem:</strong> There is no affordable, intelligent solution that automatically organizes, understands, and makes documents instantly retrievable — especially one designed for the Indian market with WhatsApp integration and regional document support.
            </p>
          </div>
        </section>

        {/* 3. Solution Overview */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> 3. Solution Overview</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Sortify provides an end-to-end intelligent document management platform with the following core value propositions:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Upload & Auto-Organize", desc: "Drag-and-drop upload with automatic AI categorization, entity extraction, and smart tagging" },
                { title: "Intelligent Search", desc: "9 search modes including semantic search, entity search, date range, and natural language queries" },
                { title: "Document AI Chat", desc: "Ask questions about your documents in natural language and get cited answers" },
                { title: "Expiry Tracking", desc: "Automatic detection of expiry dates with proactive reminders and notifications" },
                { title: "WhatsApp Access", desc: "Search and retrieve documents via WhatsApp — no app installation required" },
                { title: "Team Collaboration", desc: "Share documents with teams, manage folders, and control access with role-based permissions" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. System Architecture */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> 4. System Architecture</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-6">
            <div className="space-y-2">
              <h3 className="font-semibold">High-Level Architecture</h3>
              <div className="p-6 rounded-lg bg-muted/30 border border-border font-mono text-xs leading-relaxed">
                <pre className="overflow-x-auto whitespace-pre">{`
┌──────────────────────────────────────────────────────┐
│                    CLIENT LAYER                       │
│  React + TypeScript + Tailwind CSS + Framer Motion   │
│  (SPA hosted on Lovable Cloud)                       │
└─────────────────────┬────────────────────────────────┘
                      │ HTTPS / REST
┌─────────────────────▼────────────────────────────────┐
│                  API / BACKEND LAYER                   │
│            Supabase (PostgreSQL + Auth)               │
│         Edge Functions (Deno Runtime)                 │
│    ┌────────────┬────────────┬──────────────┐        │
│    │ analyze-   │ doc-chat   │ smart-search │        │
│    │ file       │            │              │        │
│    ├────────────┼────────────┼──────────────┤        │
│    │ categorize │ gdrive-api │ check-expiry │        │
│    │ -files     │            │              │        │
│    ├────────────┼────────────┼──────────────┤        │
│    │ whatsapp-  │ support-   │ semantic-    │        │
│    │ webhook    │ chat       │ search       │        │
│    └────────────┴────────────┴──────────────┘        │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│                 EXTERNAL SERVICES                     │
│  Google Gemini AI  │  Google Drive API  │  WhatsApp  │
│  Lovable AI Gateway│  OAuth 2.0         │  Business  │
└──────────────────────────────────────────────────────┘
                `}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Core Features */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> 5. Core Features (Current — V1.0)</h2>
          <div className="space-y-4">
            {[
              {
                icon: Upload, title: "File Upload & AI Analysis",
                features: [
                  "Drag-and-drop multi-file upload with progress tracking",
                  "Automatic text extraction (OCR for images/PDFs)",
                  "AI-generated summaries and descriptions",
                  "Entity extraction: dates, amounts, names, ID numbers (Aadhaar, PAN, etc.)",
                  "Automatic expiry date detection",
                  "Smart tag assignment with confidence scores",
                  "Semantic keyword generation for enhanced searchability",
                ]
              },
              {
                icon: Search, title: "Advanced Search Engine (9 Modes)",
                features: [
                  "Keyword search across file names, summaries, and extracted text",
                  "Semantic search using AI-generated keywords",
                  "Entity-based search (find by Aadhaar number, PAN, amounts)",
                  "Date range filtering",
                  "File type filtering",
                  "Tag-based search",
                  "Natural language queries via AI smart search",
                  "Combined multi-filter search",
                  "Intent-aware ranking with identifier boost scoring",
                ]
              },
              {
                icon: MessageCircle, title: "AI Document Chat",
                features: [
                  "Natural language Q&A across all uploaded documents",
                  "File-specific chat with context-aware responses",
                  "Streaming responses for real-time interaction",
                  "Source citation — AI references which document info comes from",
                  "Markdown-formatted responses with code blocks and lists",
                ]
              },
              {
                icon: ArrowLeftRight, title: "Document Comparison",
                features: [
                  "Side-by-side comparison of any two documents",
                  "AI-powered similarity analysis and difference highlighting",
                  "Entity comparison (dates, amounts, names)",
                  "Summary comparison for quick overview",
                ]
              },
              {
                icon: Bell, title: "Smart Reminders & Expiry Tracking",
                features: [
                  "Automatic expiry date detection from document content",
                  "Push notifications for upcoming expirations",
                  "Reminders page with calendar view of all deadlines",
                  "Notification bell with unread count in real-time",
                  "Scheduled expiry check via backend cron function",
                ]
              },
              {
                icon: FolderTree, title: "Smart Folders",
                features: [
                  "AI-driven automatic categorization into document types",
                  "Categories: Identity, Financial, Medical, Legal, Education, Insurance, etc.",
                  "Custom folder views with file count badges",
                  "Deep categorization with sub-categories",
                ]
              },
              {
                icon: Users, title: "Teams & Collaboration",
                features: [
                  "Create and manage teams with invite system",
                  "Role-based access control (Owner, Admin, Member)",
                  "Team folders for shared document access",
                  "Add files to team folders for collaborative work",
                ]
              },
              {
                icon: Share2, title: "Secure File Sharing",
                features: [
                  "Generate shareable links with unique tokens",
                  "Time-limited links with automatic expiration",
                  "View-once links that self-destruct after first view",
                  "Public access without requiring recipient login",
                ]
              },
              {
                icon: HardDrive, title: "Google Drive Integration",
                features: [
                  "OAuth 2.0 connection with secure token management",
                  "Browse Google Drive folders within Sortify",
                  "Import files from Drive with automatic AI analysis",
                  "Export Sortify files back to Google Drive",
                  "Automatic token refresh for uninterrupted access",
                ]
              },
              {
                icon: Smartphone, title: "WhatsApp Integration",
                features: [
                  "Search documents by sending WhatsApp messages",
                  "Intent-aware search with identifier matching",
                  "Receive document details and download links via WhatsApp",
                  "Phone number verification with OTP",
                  "No app installation required — works via existing WhatsApp",
                ]
              },
              {
                icon: BarChart3, title: "Analytics Dashboard",
                features: [
                  "Upload trends and activity tracking over time",
                  "Storage usage breakdown by file type",
                  "Search activity metrics",
                  "Document category distribution charts",
                  "Event-based analytics tracking (uploads, searches, shares)",
                ]
              },
              {
                icon: Shield, title: "Authentication & Security",
                features: [
                  "Email/password authentication with email verification",
                  "Password reset flow with secure tokens",
                  "Row-Level Security (RLS) on all database tables",
                  "Role-based access control with separate user_roles table",
                  "Admin panel for user management",
                  "Onboarding flow for new user profile setup",
                ]
              },
            ].map((section, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">{section.title}</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {section.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Technology Stack */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Cpu className="w-5 h-5 text-primary" /> 6. Technology Stack</h2>
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { category: "Frontend", items: ["React 18 (SPA)", "TypeScript", "Tailwind CSS", "Framer Motion", "Shadcn/UI Components", "React Router v6", "TanStack React Query", "Recharts (Analytics)"] },
                { category: "Backend", items: ["Supabase (PostgreSQL)", "Supabase Auth", "Supabase Edge Functions (Deno)", "Supabase Storage (S3-compatible)", "Row-Level Security (RLS)", "Database Functions & Triggers"] },
                { category: "AI & ML", items: ["Lovable AI Gateway", "Google Gemini 3 Flash (Doc Chat)", "Google Gemini 2.5 Flash (Analysis)", "Semantic Keyword Generation", "Entity Extraction (NER)", "Intent Classification"] },
                { category: "Integrations", items: ["Google Drive API v3", "Google OAuth 2.0", "WhatsApp Business API", "WhatsApp Webhook (Inbound)", "Secure Token Management", "OTP Verification System"] },
              ].map((stack, i) => (
                <div key={i} className="space-y-3">
                  <h4 className="font-semibold text-sm text-primary">{stack.category}</h4>
                  <ul className="space-y-1.5">
                    {stack.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Database Schema */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Database className="w-5 h-5 text-primary" /> 7. Database Schema</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <p className="text-sm text-muted-foreground">The system uses a PostgreSQL database with the following core tables:</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { table: "files", desc: "Core file metadata — name, type, size, URL, AI summary, entities, extracted text, expiry dates, semantic keywords", cols: "15 columns" },
                { table: "profiles", desc: "User profile data — name, company, industry, phone, plan, onboarding status", cols: "17 columns" },
                { table: "tags", desc: "Tag definitions for file categorization", cols: "2 columns" },
                { table: "file_tags", desc: "Many-to-many relation between files and tags with confidence scores", cols: "4 columns" },
                { table: "notifications", desc: "User notifications for expiry alerts and system messages", cols: "8 columns" },
                { table: "shared_links", desc: "Shareable file links with tokens, expiration, and view-once support", cols: "8 columns" },
                { table: "teams", desc: "Team definitions with owner reference", cols: "5 columns" },
                { table: "team_members", desc: "Team membership with role assignments", cols: "5 columns" },
                { table: "team_folders", desc: "Shared folders within teams", cols: "5 columns" },
                { table: "team_folder_files", desc: "Files assigned to team folders", cols: "5 columns" },
                { table: "google_drive_tokens", desc: "OAuth tokens for Google Drive integration", cols: "7 columns" },
                { table: "analytics_events", desc: "Event tracking for user activity analytics", cols: "5 columns" },
                { table: "user_roles", desc: "Role-based access control (admin, moderator, user)", cols: "3 columns" },
                { table: "whatsapp_users", desc: "WhatsApp phone verification and user linking", cols: "6 columns" },
                { table: "whatsapp_sessions", desc: "WhatsApp bot session management", cols: "6 columns" },
              ].map((t, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono font-bold text-primary">{t.table}</code>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.cols}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Security & Privacy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> 8. Security & Privacy</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Row-Level Security", desc: "Every database table has RLS policies ensuring users can only access their own data" },
                { title: "Authentication", desc: "Email verification required before access. Secure password reset flow with tokens" },
                { title: "Role Separation", desc: "User roles stored in separate table to prevent privilege escalation attacks" },
                { title: "Service Role Isolation", desc: "Edge functions use service role keys only for cross-user operations, never exposed to client" },
                { title: "Token Security", desc: "Google Drive OAuth tokens encrypted at rest. Automatic refresh with no user intervention" },
                { title: "Data Privacy", desc: "AI processes files for metadata only. No content is stored in AI systems or used for training" },
                { title: "Shared Links", desc: "Cryptographic tokens for sharing. Time-expiring and view-once options for sensitive documents" },
                { title: "DPDP Act Compliance", desc: "Designed with India's Digital Personal Data Protection Act 2023 principles in mind" },
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-primary" /> {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Current Stage */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> 9. Current Stage & Milestones</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold">Current Status: V1.0 — Live & Operational</span>
            </div>

            <div className="space-y-4">
              {[
                { phase: "Phase 1 — Foundation", status: "✅ Complete", date: "Jan–Feb 2026", items: ["User authentication with email verification", "File upload with cloud storage", "Basic dashboard with file management", "Profile setup and onboarding flow"] },
                { phase: "Phase 2 — AI Integration", status: "✅ Complete", date: "Feb 2026", items: ["AI file analysis (summary, entities, text extraction)", "Smart categorization into document types", "Automatic tag assignment with confidence scores", "Expiry date detection and notification system"] },
                { phase: "Phase 3 — Advanced Features", status: "✅ Complete", date: "Feb–Mar 2026", items: ["9-mode search engine with semantic & entity search", "AI document chat with streaming responses", "Document comparison engine", "Smart folders with deep categorization", "Secure sharing with time-limited & view-once links"] },
                { phase: "Phase 4 — Integrations", status: "✅ Complete", date: "Mar 2026", items: ["Google Drive integration (import/export)", "WhatsApp bot for document search", "Analytics dashboard with event tracking", "Teams & collaboration with role-based access", "Admin panel for user management"] },
              ].map((phase, i) => (
                <div key={i} className="p-4 rounded-lg border border-border space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-semibold">{phase.phase}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{phase.date}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">{phase.status}</span>
                    </div>
                  </div>
                  <ul className="grid sm:grid-cols-2 gap-1.5">
                    {phase.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Future Roadmap */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> 10. Future Roadmap</h2>
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            {[
              { version: "V2.0 — Q3–Q4 2026", items: ["Voice-based document search", "Contract risk detection (penalties, liabilities, clauses)", "Document timeline view (visual date-based browsing)", "Bulk operations (multi-select, batch tag, batch delete)", "Advanced OCR for handwritten documents"] },
              { version: "V3.0 — Q1 2027", items: ["Mobile app (React Native)", "Offline mode with sync", "Multi-language document support (Hindi, Marathi, etc.)", "Document versioning and edit history", "Custom AI training on user's document patterns"] },
              { version: "V4.0 — 2027–2028", items: ["Third-party integrations (Tally, Zoho, DigiLocker)", "API access for enterprise customers", "White-label solution for businesses", "Automated compliance checking", "E-signature integration"] },
            ].map((v, i) => (
              <div key={i} className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3">
                <h4 className="font-semibold text-primary">{v.version}</h4>
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {v.items.map((item, j) => (
                    <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 11. Deployment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> 11. Deployment & Infrastructure</h2>
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Hosting", value: "Lovable Cloud (Global CDN)" },
                { label: "Database", value: "Supabase PostgreSQL (Managed)" },
                { label: "File Storage", value: "Supabase Storage (S3-compatible)" },
                { label: "Edge Functions", value: "Deno Runtime (Auto-deployed)" },
                { label: "AI Gateway", value: "Lovable AI Gateway (Managed)" },
                { label: "Domain", value: "mind-file.lovable.app" },
                { label: "SSL/TLS", value: "Automatic HTTPS with TLS 1.3" },
                { label: "CI/CD", value: "Automatic deployment on code push" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="text-center py-8 border-t border-border space-y-2">
          <p className="text-sm text-muted-foreground">Sortify — Detailed Project Report V1.0</p>
          <p className="text-xs text-muted-foreground">Generated March 2026 • Confidential</p>
        </section>
      </div>
    </div>
  );
};

export default DPRPage;
