interface SectionProps {
  bg?: "white" | "gray" | "dark";
  divider?: boolean;
  children: React.ReactNode;
  className?: string;
}

const BG_MAP = {
  white: "#FFFFFF",
  gray: "#F5F5F5",
  dark: "#2D2D2D",
};

export default function Section({ bg = "white", divider, children, className }: SectionProps) {
  const textColor = bg === "dark" ? "white" : "#2D2D2D";
  return (
    <section
      className={`py-16 md:py-24 ${divider ? "pwc-divider" : ""} ${className || ""}`}
      style={{ backgroundColor: BG_MAP[bg], color: textColor }}
    >
      <div className="max-w-5xl mx-auto px-8">{children}</div>
    </section>
  );
}
