import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-10">Last updated: March 8, 2026</p>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By creating an account or using Sortify, you agree to these Terms of Service. If you do not agree, please do not use the service. We may update these terms from time to time — continued use constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sortify is an AI-powered document management platform that provides file storage, AI analysis (OCR, summarization, tagging, entity extraction), smart search, expiry reminders, and document sharing. Features vary by plan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed">
                You must provide accurate information during registration. You are responsible for maintaining the security of your account credentials. You must not share your account or use another person's account. Notify us immediately if you suspect unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to: upload illegal, harmful, or copyrighted content you don't have rights to; attempt to reverse-engineer or exploit the service; use the service for spam, phishing, or malicious purposes; exceed reasonable usage limits for your plan; or interfere with the service's operation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Storage & Plan Limits</h2>
              <p className="text-muted-foreground leading-relaxed">
                Each plan has storage limits and feature restrictions. Exceeding your plan's storage limit will pause new uploads until you upgrade or free up space. Existing files remain accessible. We reserve the right to enforce limits.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                You retain full ownership of files you upload. By uploading, you grant Sortify a limited license to process your files for the purpose of providing the service (AI analysis, search indexing). We claim no ownership of your content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                We strive for high availability but do not guarantee uninterrupted service. We may perform maintenance with advance notice when possible. We are not liable for data loss — we recommend maintaining your own backups of critical documents.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may delete your account at any time. We may suspend or terminate accounts that violate these terms. Upon termination, your data will be deleted per our Privacy Policy retention schedule.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Sortify is provided "as is." We are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid in the 12 months preceding the claim. AI-generated metadata is provided for convenience and may contain inaccuracies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by the laws of India. Disputes shall be resolved in the courts of Pune, Maharashtra. For questions, contact{" "}
                <a href="mailto:founders@sortify.in" className="text-primary hover:underline">founders@sortify.in</a>.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;
