"use client";

import { type LucideIcon } from "lucide-react";

interface StrengthCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export default function StrengthCard({ icon: Icon, title, desc }: StrengthCardProps) {
  return (
    <div
      className="p-6 transition-all duration-200 cursor-default"
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "4px",
        transform: "translateY(0)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)";
        e.currentTarget.style.borderColor = "rgba(208,74,2,0.5)";
        e.currentTarget.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Icon size={32} color="#D04A02" />
      <h3 className="text-lg font-semibold text-white mt-3">{title}</h3>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
        {desc}
      </p>
    </div>
  );
}
