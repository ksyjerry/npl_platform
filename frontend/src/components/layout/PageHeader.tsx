import Image from "next/image";

interface PageHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  bgImage?: string;
}

export default function PageHeader({ overline, title, subtitle, bgImage }: PageHeaderProps) {
  return (
    <div className="pwc-divider relative overflow-hidden" style={{ backgroundColor: "#2D2D2D" }}>
      {bgImage && (
        <>
          <Image
            src={bgImage}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(45,45,45,0.65)" }}
          />
        </>
      )}
      <div className="relative z-10 max-w-5xl mx-auto px-8 py-16">
        {overline && (
          <p
            className="text-xs font-medium uppercase"
            style={{
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.12em",
            }}
          >
            {overline}
          </p>
        )}
        <h1
          className="text-4xl font-bold mt-3"
          style={{ color: "white", lineHeight: 1.25 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-lg mt-4 max-w-xl"
            style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.65 }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
