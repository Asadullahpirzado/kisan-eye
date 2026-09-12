import { useEffect, useState } from "react";
import { ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { getCasesForCrop, compareCases, fileUrl } from "../api.js";
import Timeline from "../components/Timeline.jsx";
import RiskBadge from "../components/RiskBadge.jsx";

const CROPS = ["tomato", "potato", "wheat", "cotton"];

export default function Monitoring({ selectedCase, onSelectCase }) {
  const [crop, setCrop] = useState(selectedCase?.crop || "tomato");
  const [cases, setCases] = useState([]);
  const [picked, setPicked] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setComparison(null);
    setPicked([]);
    getCasesForCrop(crop)
      .then((items) => {
        setCases(items);
        if (selectedCase?.crop === crop) {
          const matching = items.find((item) => item.id === selectedCase.id);
          if (matching) setPicked([matching]);
        }
      })
      .catch((err) => setError(err.message));
  }, [crop, selectedCase]);

  useEffect(() => {
    if (selectedCase?.crop) setCrop(selectedCase.crop);
  }, [selectedCase]);

  function handleSelect(item) {
    setComparison(null);
    setPicked((prev) => {
      if (prev.find((p) => p.id === item.id)) {
        return prev.filter((p) => p.id !== item.id);
      }
      const next = [...prev, item].slice(-2);
      return next;
    });
  }

  async function runComparison() {
    if (picked.length < 2) return;
    const [a, b] = [...picked].sort((x, y) => new Date(x.created_at) - new Date(y.created_at));
    setLoading(true);
    setError("");
    try {
      const result = await compareCases(a.id, b.id);
      setComparison(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const TrendIcon = comparison
    ? comparison.risk_direction > 0
      ? TrendingUp
      : comparison.risk_direction < 0
      ? TrendingDown
      : Minus
    : Minus;

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-12">
      <h1 className="text-3xl font-bold text-forest mb-2">Monitor progress</h1>
      <p className="text-forest/60 mb-8">Pick two observations of the same crop to see how things are changing. {selectedCase && "Your latest assessment is preselected as the starting point."}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {CROPS.map((c) => (
          <button
            key={c}
            onClick={() => setCrop(c)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium border capitalize transition-colors ${
              crop === c ? "bg-leaf text-white border-leaf" : "border-forest/15 text-forest/70 hover:border-forest/30"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {cases.length < 2 && (
        <div className="rounded-2xl border border-dashed border-forest/20 bg-white p-8 text-center text-sm text-forest/50">
          You need at least two saved analyses of this crop to compare progress.
        </div>
      )}

      {cases.length >= 2 && (
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-8">
          <div>
            <p className="text-sm font-semibold text-forest mb-3">Select two observations</p>
            <Timeline cases={cases} onSelect={handleSelect} selectedIds={picked.map((p) => p.id)} />
            <button
              disabled={picked.length < 2}
              onClick={runComparison}
              className="mt-6 w-full rounded-full bg-forest text-canvas px-6 py-3 font-semibold disabled:opacity-30 hover:bg-leaf transition-colors"
            >
              {loading ? "Comparing..." : "Compare selected"}
            </button>
          </div>

          <div>
            {comparison ? (
              <div className="rounded-3xl bg-white border border-forest/10 p-6 rise-in">
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <p className="text-xs text-forest/50 mb-1">Previous</p>
                    <img
                      src={fileUrl(comparison.previous.image_path)}
                      className="rounded-xl h-28 w-full object-cover mb-2"
                      alt=""
                    />
                    <RiskBadge level={comparison.previous.risk_level} />
                  </div>
                  <div>
                    <p className="text-xs text-forest/50 mb-1">Current</p>
                    <img
                      src={fileUrl(comparison.current.image_path)}
                      className="rounded-xl h-28 w-full object-cover mb-2"
                      alt=""
                    />
                    <RiskBadge level={comparison.current.risk_level} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <TrendIcon
                    size={18}
                    className={
                      comparison.risk_direction > 0
                        ? "text-danger"
                        : comparison.risk_direction < 0
                        ? "text-leaf"
                        : "text-forest/40"
                    }
                  />
                  <span className="text-sm font-semibold text-forest">
                    Affected area {comparison.area_change >= 0 ? "+" : ""}
                    {comparison.area_change}%
                  </span>
                </div>

                <p className="text-sm text-forest/70 leading-relaxed">{comparison.summary}</p>

                <div className="mt-4 flex items-center gap-2 text-xs text-forest/50">
                  <span>{comparison.previous.risk_level}</span>
                  <ArrowRight size={14} />
                  <span className="font-semibold text-forest">{comparison.current.risk_level}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-forest/20 bg-white p-10 text-center text-sm text-forest/50 h-full flex items-center justify-center">
                Pick two points on the timeline to see how the crop is trending.
              </div>
            )}
          </div>
        </div>
      )}

      {cases.length > 0 && (
        <button onClick={() => onSelectCase?.(cases[cases.length - 1])} className="mt-8 text-sm font-semibold text-signal hover:text-leaf">
          View most recent assessment <ArrowRight size={15} className="inline ml-1" />
        </button>
      )}
    </div>
  );
}
