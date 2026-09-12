import RiskBadge from "./RiskBadge.jsx";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Timeline({ cases, onSelect, selectedIds = [] }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-forest/15" />
      <div className="space-y-6">
        {cases.map((item) => {
          const active = selectedIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onSelect && onSelect(item)}
              className="relative block text-left w-full"
            >
              <span
                className={`absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-canvas ${
                  active ? "bg-signal" : "bg-forest/40"
                }`}
              />
              <div
                className={`rounded-2xl border px-4 py-3 transition-colors ${
                  active ? "border-signal bg-signal/5" : "border-forest/10 bg-white hover:border-forest/25"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-forest">{formatDate(item.created_at)}</span>
                  <RiskBadge level={item.risk_level} />
                </div>
                <p className="text-sm text-forest/60 mt-1">
                  {item.prediction} · {item.confidence}% confidence · {item.affected_area}% affected
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
