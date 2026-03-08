const STATUS_STYLE = {
  active: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE", label: "진행" },
  closed: { bg: "#F5F5F5", text: "#464646", border: "#DEDEDE", label: "종결" },
  cancelled: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA", label: "중단/유찰" },
} as const;

type PoolStatus = keyof typeof STATUS_STYLE;

export default function PoolStatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status as PoolStatus] || STATUS_STYLE.active;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
    >
      {s.label}
    </span>
  );
}
