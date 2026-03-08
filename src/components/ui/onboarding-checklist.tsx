"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export type Step = {
  id: string;
  title: string;
  description?: string;
  targetSelector: string;
  completed?: boolean;
};

export interface InteractiveOnboardingChecklistProps {
  steps: Step[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
  onCompleteStep?(id: string): void;
  onFinish?(): void;
  accentColorVar?: string;
  placement?: "left" | "right";
}

const getElementPosition = (selector: string) => {
  const element = document.querySelector(selector) as HTMLElement;
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    element,
  };
};

const CoachmarkOverlay = ({
  step,
  onNext,
  onPrev,
  onComplete,
  onClose,
  isFirst,
  isLast,
  stepIndex,
  totalSteps,
}: {
  step: Step;
  onNext: () => void;
  onPrev: () => void;
  onComplete: () => void;
  onClose: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepIndex: number;
  totalSteps: number;
}) => {
  const [targetPosition, setTargetPosition] = useState(getElementPosition(step.targetSelector));

  const updatePosition = useCallback(() => {
    setTargetPosition(getElementPosition(step.targetSelector));
  }, [step.targetSelector]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    const resizeObserver = new ResizeObserver(updatePosition);
    const targetElement = document.querySelector(step.targetSelector);
    if (targetElement) resizeObserver.observe(targetElement);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      resizeObserver.disconnect();
    };
  }, [step.targetSelector, updatePosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" && !isLast) onNext();
      else if (e.key === "ArrowLeft" && !isFirst) onPrev();
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onComplete();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev, onComplete, isFirst, isLast]);

  if (!targetPosition) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50">
        <div className="bg-card border border-border rounded-xl p-6 max-w-sm shadow-xl">
          <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Target element not found. Please ensure the element with selector &quot;{step.targetSelector}&quot; exists.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" onClick={onComplete}>Mark Complete</Button>
          </div>
        </div>
      </div>
    );
  }

  const { top, left, width, height } = targetPosition;
  const spotlightPadding = 8;

  const getCardPosition = () => {
    const cardWidth = 384;
    const cardHeight = 200;
    const margin = 16;

    const positions = [
      { top: top + height + margin, left: left + width / 2 - cardWidth / 2, priority: 1 },
      { top: top - cardHeight - margin, left: left + width / 2 - cardWidth / 2, priority: 2 },
      { top: top + height / 2 - cardHeight / 2, left: left + width + margin, priority: 3 },
      { top: top + height / 2 - cardHeight / 2, left: left - cardWidth - margin, priority: 4 },
    ];

    const best = positions
      .filter(
        (pos) =>
          pos.left >= margin &&
          pos.left + cardWidth <= window.innerWidth - margin &&
          pos.top >= margin &&
          pos.top + cardHeight <= window.innerHeight - margin
      )
      .sort((a, b) => a.priority - b.priority)[0];

    if (best) return { top: best.top, left: best.left };

    return {
      top: Math.max(margin, Math.min(top + height + margin, window.innerHeight - cardHeight - margin)),
      left: Math.max(margin, Math.min(left + width / 2 - cardWidth / 2, window.innerWidth - cardWidth - margin)),
    };
  };

  const cardPos = getCardPosition();

  return (
    <div className="fixed inset-0 z-[9998]">
      {/* Dark overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={left - spotlightPadding}
              y={top - spotlightPadding}
              width={width + spotlightPadding * 2}
              height={height + spotlightPadding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Spotlight border */}
      <div
        className="absolute border-2 border-primary rounded-lg pointer-events-none animate-pulse"
        style={{
          top: top - spotlightPadding,
          left: left - spotlightPadding,
          width: width + spotlightPadding * 2,
          height: height + spotlightPadding * 2,
        }}
      />

      {/* Coachmark card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="absolute z-[9999] bg-card border border-border rounded-xl p-4 shadow-xl max-w-sm"
        style={{ top: cardPos.top, left: cardPos.left, width: 384 }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
          <span className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>

        {step.description && (
          <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
        )}

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onPrev} disabled={isFirst} className="gap-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </Button>
          <Button size="sm" onClick={onComplete} className="gap-1">
            Mark Done
          </Button>
          <Button variant="ghost" size="sm" onClick={onNext} disabled={isLast} className="gap-1">
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export function InteractiveOnboardingChecklist({
  steps,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onCompleteStep,
  onFinish,
  placement = "right",
}: InteractiveOnboardingChecklistProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internalCompletedSteps, setInternalCompletedSteps] = useState<Set<string>>(new Set());
  const [activeCoachmark, setActiveCoachmark] = useState<string | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const completedSteps = new Set([
    ...steps.filter((step) => step.completed).map((step) => step.id),
    ...internalCompletedSteps,
  ]);

  const completedCount = steps.filter((step) => completedSteps.has(step.id)).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;
  const allStepsCompleted = completedCount === totalSteps;

  const advanceToNextStep = useCallback(
    (completedStepId: string) => {
      const newCompleted = new Set([
        ...steps.filter((s) => s.completed).map((s) => s.id),
        ...internalCompletedSteps,
        completedStepId,
      ]);
      const idx = steps.findIndex((s) => s.id === completedStepId);
      const next = steps.slice(idx + 1).find((s) => !newCompleted.has(s.id));
      setActiveCoachmark(next ? next.id : null);
      if (steps.every((s) => newCompleted.has(s.id))) {
        setTimeout(() => onFinish?.(), 100);
      }
    },
    [steps, internalCompletedSteps, onFinish]
  );

  useEffect(() => {
    if (open && !activeCoachmark) {
      const first = steps.find((s) => !completedSteps.has(s.id));
      if (first) {
        const timer = setTimeout(() => setActiveCoachmark(first.id), 400);
        return () => clearTimeout(timer);
      }
    }
  }, [open]);

  const handleCompleteStep = (stepId: string) => {
    setInternalCompletedSteps((prev) => new Set([...prev, stepId]));
    onCompleteStep?.(stepId);
    setTimeout(() => advanceToNextStep(stepId), 500);
  };

  const handleStepClick = (step: Step) => {
    if (completedSteps.has(step.id)) return;
    setActiveCoachmark(step.id);
  };

  const handleClose = () => {
    setActiveCoachmark(null);
    if (!isControlled) setInternalOpen(false);
    onOpenChange?.(false);
  };

  const activeStep = activeCoachmark ? steps.find((s) => s.id === activeCoachmark) : null;
  const activeStepIndex = activeStep ? steps.indexOf(activeStep) : -1;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(v) => (v ? (isControlled ? onOpenChange?.(true) : setInternalOpen(true)) : handleClose())}>
        <Dialog.Portal>
          <Dialog.Content
            onOpenAutoFocus={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            className={cn(
              "fixed z-[9997] bottom-4 w-80 bg-card border border-border rounded-2xl shadow-2xl p-0 overflow-hidden",
              placement === "right" ? "right-4" : "left-4"
            )}
          >
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="font-bold text-foreground text-sm">Getting Started</h3>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-md hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Progress */}
              <div className="px-4 pb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Progress</span>
                  <span>{completedCount}/{totalSteps}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Steps */}
              <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
                {steps.map((step) => {
                  const isCompleted = completedSteps.has(step.id);
                  const isActive = activeCoachmark === step.id;

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(step)}
                      disabled={isCompleted}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring",
                        isCompleted && "bg-success/10 border-success/30 cursor-default",
                        isActive && "ring-2 ring-primary",
                        !isCompleted && !isActive && "border-border"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <div className="text-success">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isCompleted && "line-through text-muted-foreground"
                            )}
                          >
                            {step.title}
                          </span>
                          {step.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {step.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Finish button */}
              {allStepsCompleted && (
                <div className="p-3 pt-0">
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      onFinish?.();
                      handleClose();
                    }}
                  >
                    <Check className="w-4 h-4" />
                    Finish Setup
                  </Button>
                </div>
              )}
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Coachmark overlay */}
      <AnimatePresence>
        {activeStep && (
          <CoachmarkOverlay
            step={activeStep}
            stepIndex={activeStepIndex}
            totalSteps={totalSteps}
            isFirst={activeStepIndex === 0}
            isLast={activeStepIndex === totalSteps - 1}
            onNext={() => {
              for (let i = activeStepIndex + 1; i < totalSteps; i++) {
                if (!completedSteps.has(steps[i].id)) {
                  setActiveCoachmark(steps[i].id);
                  return;
                }
              }
            }}
            onPrev={() => {
              for (let i = activeStepIndex - 1; i >= 0; i--) {
                if (!completedSteps.has(steps[i].id)) {
                  setActiveCoachmark(steps[i].id);
                  return;
                }
              }
            }}
            onComplete={() => handleCompleteStep(activeStep.id)}
            onClose={() => setActiveCoachmark(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
