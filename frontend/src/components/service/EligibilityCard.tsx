"use client";

import { type LucideIcon } from "lucide-react";

interface EligibilityCardProps {
  icon: LucideIcon;
  title: string;
  items: string[];
  note: string;
}

export default function EligibilityCard({ icon: Icon, title, items, note }: EligibilityCardProps) {
  return (
    <div
      className="border p-6 transition-all duration-200"
      style={{
        borderColor: "#DEDEDE",
        borderRadius: "4px",
        borderTop: "4px solid #D04A02",
        transform: "translateY(0)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      <Icon size={32} color="#D04A02" />
      <h3 className="text-lg font-semibold mt-3" style={{ color: "#2D2D2D" }}>
        {title}
      </h3>
      <ul className="space-y-2 mt-4">
        {items.map((item) => (
          <li key={item} className="text-sm flex items-start gap-2" style={{ color: "#464646" }}>
            <span style={{ color: "#D04A02" }} className="font-bold">•</span>
            {item}
          </li>
        ))}
      </ul>
      <p
        className="text-xs mt-4 pt-4"
        style={{ color: "#7D7D7D", borderTop: "1px solid #DEDEDE" }}
      >
        {note}
      </p>
    </div>
  );
}
