"use client";

interface AssetTypeCardProps {
  type: string;
  desc: string;
  icon?: React.ReactNode;
  badges?: string[];
}

export default function AssetTypeCard({ type, desc, icon, badges }: AssetTypeCardProps) {
  return (
    <div
      className="border p-8 transition-all duration-200"
      style={{
        borderColor: "#DEDEDE",
        borderRadius: "4px",
        transform: "translateY(0)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#D04A02";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#DEDEDE";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      {icon && <div style={{ color: "#D04A02" }} className="mb-4">{icon}</div>}
      <h3 className="text-xl font-semibold" style={{ color: "#2D2D2D" }}>
        {type}
      </h3>
      <p className="text-sm mt-3 leading-relaxed whitespace-pre-line" style={{ color: "#464646" }}>
        {desc}
      </p>
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {badges.map((b) => (
            <span
              key={b}
              className="px-2 py-0.5 text-xs border border-[#DEDEDE] rounded text-[#7D7D7D]"
            >
              {b}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
