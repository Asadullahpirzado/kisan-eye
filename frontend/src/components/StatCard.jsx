import { useEffect, useState } from "react";

export default function StatCard({ label, value, accent = "text-forest" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 700;

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(progress * value));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="rounded-2xl bg-white border border-forest/10 px-5 py-4">
      <div className={`text-3xl font-bold ${accent}`}>{display}</div>
      <div className="text-sm text-forest/50 mt-1">{label}</div>
    </div>
  );
}
