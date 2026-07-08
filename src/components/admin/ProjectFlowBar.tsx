"use client";

import {
  PROJECT_FLOW_STEPS,
  deriveProjectActiveIndex,
  isProjectStepDone,
  type ProjectPipelineSignals,
} from "@/lib/project-pipeline";

type ProjectFlowBarProps = {
  signals: ProjectPipelineSignals;
  /** compact = menos padding, tipografía más chica (listados) */
  size?: "default" | "compact";
  className?: string;
};

export function ProjectFlowBar({
  signals,
  size = "default",
  className = "",
}: ProjectFlowBarProps) {
  const activeIndex = deriveProjectActiveIndex(signals);
  const allDone = PROJECT_FLOW_STEPS.every((step) => isProjectStepDone(step.key, signals));
  const compact = size === "compact";

  return (
    <div
      className={`flex overflow-x-auto rounded border ${className}`}
      style={{ borderColor: "rgba(19,25,69,0.12)" }}
      role="list"
      aria-label="Progreso del proyecto"
    >
      {PROJECT_FLOW_STEPS.map((step, i) => {
        const done = isProjectStepDone(step.key, signals);
        const isActive = !allDone && i === activeIndex;
        return (
          <div
            key={step.key}
            role="listitem"
            className={`flex-1 min-w-[52px] text-center border-r last:border-r-0 ${compact ? "py-1.5 px-0.5" : "py-2 px-1"}`}
            style={{
              borderColor: "rgba(19,25,69,0.08)",
              background: done ? "#131945" : isActive ? "#F03172" : "#F2F2F2",
              color: done
                ? step.key === "entregado" && allDone
                  ? "#fff"
                  : "rgba(255,255,255,0.45)"
                : isActive
                  ? "#fff"
                  : "rgba(19,25,69,0.42)",
            }}
            title={step.label}
          >
            <div className={compact ? "text-[10px] mb-0" : "text-xs mb-0.5"}>
              {done ? "✓" : isActive ? "●" : "○"}
            </div>
            <div
              className={`uppercase tracking-wider leading-tight ${compact ? "text-[6px]" : "text-[7px]"}`}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
