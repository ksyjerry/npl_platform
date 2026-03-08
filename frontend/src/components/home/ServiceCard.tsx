"use client";

import Link from "next/link";

interface ServiceCardProps {
  title: string;
  desc: string;
  href: string;
  cta: string;
  icon: React.ReactNode;
  tags?: string[];
}

export default function ServiceCard({ title, desc, href, cta, icon, tags }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="block border p-8 transition-all"
      style={{
        borderColor: "#DEDEDE",
        borderRadius: "4px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#D04A02";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#DEDEDE";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
      }}
    >
      <div style={{ color: "#D04A02" }}>{icon}</div>
      <h3
        className="text-xl font-semibold mt-4"
        style={{ color: "#2D2D2D" }}
      >
        {title}
      </h3>
      <p className="text-sm mt-3 leading-relaxed" style={{ color: "#464646" }}>
        {desc}
      </p>
      {tags && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs border border-[#DEDEDE] rounded text-[#7D7D7D]">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm font-semibold mt-6" style={{ color: "#D04A02" }}>
        {cta} →
      </p>
    </Link>
  );
}
