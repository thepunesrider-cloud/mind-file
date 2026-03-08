import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_GUIDE_KEY = "sortify_onboarding_guide";

interface OnboardingGuideState {
  completedSteps: string[];
  dismissed: boolean;
}

export function useOnboardingGuide() {
  const [state, setState] = useState<OnboardingGuideState>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_GUIDE_KEY);
      return saved ? JSON.parse(saved) : { completedSteps: [], dismissed: false };
    } catch {
      return { completedSteps: [], dismissed: false };
    }
  });

  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Show guide if not dismissed and not all steps done
    if (!state.dismissed) {
      setShowGuide(true);
    }
  }, [state.dismissed]);

  const persist = (newState: OnboardingGuideState) => {
    setState(newState);
    localStorage.setItem(ONBOARDING_GUIDE_KEY, JSON.stringify(newState));
  };

  const completeStep = (id: string) => {
    if (!state.completedSteps.includes(id)) {
      persist({ ...state, completedSteps: [...state.completedSteps, id] });
    }
  };

  const dismiss = () => {
    persist({ ...state, dismissed: true });
    setShowGuide(false);
  };

  const reset = () => {
    persist({ completedSteps: [], dismissed: false });
    setShowGuide(true);
  };

  return { showGuide, setShowGuide, completedSteps: state.completedSteps, completeStep, dismiss, reset };
}
