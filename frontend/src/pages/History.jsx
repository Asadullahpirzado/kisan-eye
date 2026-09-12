import { useEffect, useState } from "react";
import { getCases, fileUrl } from "../api.js";
import RiskBadge from "../components/RiskBadge.jsx";
import { Sprout } from "lucide-react";

export default function History({ onSelectCase }) {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-12">
      <h1 className="text-3xl font-bold text-forest mb-2">Case history</h1>
      <p className="text-forest/60 mb-8">Every crop you've checked with KISAN EYE, in one place.</p>

      {error && <p className="text-danger text-sm">{error}</p>}

      {cases && cases.length === 0 && (
        <div className="rounded-3xl border border-dashed border-forest/20 bg-white p-12 text-center">
          <Sprout className="mx-auto text-forest/30 mb-3" size={32} />
          <p className="font-semibold text-forest mb-1">No crop analyses yet</p>
          <p className="text-sm text-forest/50">Start your first crop health check to see it here.</p>
        </div>
      )}

      <div className="space-y-3">
        {cases &&
          cases.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectCase(item)}
              className="w-full text-left flex items-center gap-4 rounded-2xl bg-white border border-forest/10 p-4 hover:border-forest/25 transition-colors"
            >
              <img
                src={fileUrl(item.image_path)}
                alt=""
                className="h-16 w-16 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-forest capitalize">
                  {item.crop} · {item.prediction}
                </p>
                <p className="text-sm text-forest/50">
                  {new Date(item.created_at).toLocaleDateString()} · {item.confidence}% confidence
                </p>
              </div>
              <RiskBadge level={item.risk_level} />
            </button>
          ))}
      </div>
    </div>
  );
}
