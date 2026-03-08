import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-10">Last updated: March 8, 2026</p>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you use Sortify, we collect information you provide directly: your email address, name, company details (during onboarding), and the files you upload. Our AI processes file content to generate metadata (summaries, tags, entities) — this data is stored securely and associated with your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use your data to: provide and improve Sortify's services, generate AI-powered metadata for your files, send expiry reminders, authenticate your identity, and communicate service updates. We do <strong>not</strong> sell your data or use your files to train AI models.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                All files are encrypted at rest using AES-256 encryption on secure cloud infrastructure. Data is transmitted over TLS 1.3. We implement role-based access controls and operate a zero-knowledge policy — our team cannot access your file contents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. DPDP Act Compliance</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sortify complies with India's Digital Personal Data Protection Act 2023. You have the right to: access your data, correct inaccuracies, delete your account and all associated data, and withdraw consent at any time. Data processing is based on your explicit consent provided during registration.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your files and account data are retained as long as your account is active. Upon account deletion, all files, metadata, and personal information are permanently deleted within 30 days. Backup copies are purged within 90 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use AI services for document analysis (text extraction, summarization, tagging). File content is processed in real-time and not stored by third-party AI providers. We do not share your data with advertisers or data brokers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies & Analytics</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies for authentication and session management. We may use analytics to understand usage patterns and improve the product. You can manage cookie preferences in your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For privacy-related inquiries, data access/deletion requests, or complaints, contact us at{" "}
                <a href="mailto:founders@sortify.in" className="text-primary hover:underline">founders@sortify.in</a>.
                We respond within 72 hours.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
