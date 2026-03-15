"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            style={{
              borderBottom: "1px solid #DEDEDE",
              borderLeft: isOpen ? "4px solid #D04A02" : "4px solid transparent",
              backgroundColor: isOpen ? "#FFF5EE" : "transparent",
              transition: "background-color 200ms ease, border-color 200ms ease",
            }}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors duration-150 cursor-pointer"
              onMouseEnter={(e) => {
                if (!isOpen) e.currentTarget.parentElement!.style.backgroundColor = "#FAFAFA";
              }}
              onMouseLeave={(e) => {
                if (!isOpen) e.currentTarget.parentElement!.style.backgroundColor = "transparent";
              }}
            >
              <span className="font-semibold text-base" style={{ color: "#2D2D2D" }}>
                {item.question}
              </span>
              {isOpen ? (
                <ChevronUp size={20} style={{ color: "#D04A02", flexShrink: 0 }} />
              ) : (
                <ChevronDown size={20} style={{ color: "#7D7D7D", flexShrink: 0 }} />
              )}
            </button>
            <div
              style={{
                maxHeight: isOpen ? "500px" : "0",
                overflow: "hidden",
                transition: "max-height 200ms ease",
              }}
            >
              <p
                className="px-6 pb-5 text-sm whitespace-pre-line leading-relaxed"
                style={{ color: "#464646" }}
              >
                {item.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
