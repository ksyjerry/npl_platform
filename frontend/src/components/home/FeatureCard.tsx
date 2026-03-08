interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export default function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="text-center">
      <div
        className="mx-auto flex items-center justify-center"
        style={{ width: "48px", height: "48px", color: "#D04A02" }}
      >
        {icon}
      </div>
      <h3
        className="text-xl font-semibold mt-4"
        style={{ color: "#2D2D2D" }}
      >
        {title}
      </h3>
      <p className="text-sm mt-2" style={{ color: "#464646" }}>
        {desc}
      </p>
    </div>
  );
}
