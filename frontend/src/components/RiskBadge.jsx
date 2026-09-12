const STYLES = {
  LOW: { bg: "bg-leaf/10", text: "text-leaf", ring: "ring-leaf/30", label: "Low risk" },
  MEDIUM: { bg: "bg-amber/10", text: "text-amber", ring: "ring-amber/30", label: "Needs attention" },
  HIGH: { bg: "bg-danger/10", text: "text-danger", ring: "ring-danger/30", label: "High risk" },
};

export default function RiskBadge({ level, size = "md" }) {
  const style = STYLES[level] || STYLES.LOW;
  const padding = size === "lg" ? "px-5 py-2 text-base" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-semibold ring-1 ${style.bg} ${style.text} ${style.ring} ${padding}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {level} · {style.label}
    </span>
  );
}
