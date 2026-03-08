"use client";

interface Step {
  step: string;
  title: string;
  desc: string;
}

interface ProcessStepsProps {
  steps: Step[];
}

export default function ProcessSteps({ steps }: ProcessStepsProps) {
  const gridCols =
    steps.length === 5
      ? "md:grid-cols-3 lg:grid-cols-5"
      : steps.length === 4
        ? "md:grid-cols-4"
        : "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 gap-8 ${gridCols}`}>
      {steps.map((s, i) => (
        <div
          key={s.step}
          className="relative text-center md:text-left transition-all duration-200 group"
          style={{ transform: "translateY(0)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Connector line (desktop only) */}
          {i < steps.length - 1 && (
            <div
              className="hidden md:block absolute top-6 left-1/2 w-full h-0.5"
              style={{ backgroundColor: "#DEDEDE" }}
            />
          )}
          {/* Step badge */}
          <div
            className="relative mx-auto md:mx-0 flex items-center justify-center rounded-full text-white font-bold text-sm transition-shadow duration-200 group-hover:shadow-lg"
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "#D04A02",
            }}
          >
            {s.step}
          </div>
          <h4
            className="font-semibold mt-4"
            style={{ color: "#2D2D2D" }}
          >
            {s.title}
          </h4>
          <p className="text-sm mt-2 whitespace-pre-line" style={{ color: "#7D7D7D" }}>
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}
