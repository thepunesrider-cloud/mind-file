import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground text-sm mb-8">Manage your account and preferences</p>
        </motion.div>

        {/* Storage Upgrade Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Storage & Plan</h2>
              <p className="text-xs text-muted-foreground">Manage your storage and subscription</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Need more storage, WhatsApp chatbot access, or team features? Check out our plans starting at ₹299/month.
          </p>

          <Button
            onClick={() => navigate("/pricing")}
            className="gap-2 font-semibold"
          >
            Get More Storage <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
