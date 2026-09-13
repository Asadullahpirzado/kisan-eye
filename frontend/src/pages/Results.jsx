import { CheckCircle2, ArrowRight, Printer, CalendarClock, Info } from "lucide-react";
import ConfidenceRing from "../components/ConfidenceRing.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { fileUrl } from "../api.js";

import { useState } from "react";

export default function Results({ caseData, onNavigate }) {
  const [acres, setAcres] = useState(2);
  const [val, setVal] = useState(1500);
  const [cost, setCost] = useState(caseData?.risk_level === 'HIGH' ? 80 : 40);

  const risk_level = caseData?.risk_level || 'LOW';
  const lossPct = risk_level === 'HIGH' ? 0.4 : risk_level === 'MEDIUM' ? 0.15 : 0.05;
  const costNum = Number(cost) || 0;
  const estLoss = (Number(acres) || 0) * (Number(val) || 0) * lossPct;
  const netSavings = Math.max(0, estLoss - costNum);
  const {
    crop,
    image_path,
    prediction,
    confidence,
    explanation,
    evidence,
    action_plan,
    affected_area,
  } = caseData;

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 page-enter">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-sm text-forest/50 capitalize">{crop} · analyzed just now</p>
          <h1 className="text-3xl font-bold text-forest">Crop health analysis</h1>
        </div>
        <RiskBadge level={risk_level} size="lg" />
      </div>

      <div className={`mb-6 rounded-2xl border px-5 py-4 flex flex-wrap items-center justify-between gap-3 ${risk_level === "HIGH" ? "bg-danger/5 border-danger/20" : risk_level === "MEDIUM" ? "bg-amber/5 border-amber/20" : "bg-leaf/5 border-leaf/20"}`}>
        <div className="flex items-start gap-3"><Info size={19} className="text-forest mt-0.5" /><div><p className="font-semibold text-forest">{risk_level === "HIGH" ? "Act within 24 hours" : risk_level === "MEDIUM" ? "Inspect and act this week" : "No urgent action needed"}</p><p className="text-sm text-forest/65">{risk_level === "HIGH" ? "Check nearby plants today and seek local expert confirmation." : risk_level === "MEDIUM" ? "Follow the plan below, then take another observation in 4–5 days." : "Keep your regular checks and capture a new photo if symptoms change."}</p></div></div>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-leaf"><Printer size={16} /> Save / print</button>
      </div>

      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-3xl overflow-hidden bg-white border border-forest/10">
          <img src={fileUrl(image_path)} alt="Analyzed leaf" className="w-full h-64 object-cover" />
          <div className="p-6">
            <p className="text-sm text-forest/50 mb-1">Possible condition</p>
            <h2 className="text-2xl font-bold text-forest mb-4">{prediction}</h2>
            <div className="flex items-center gap-6">
              <ConfidenceRing value={confidence} />
              <div className="text-sm text-forest/60">
                <p className="mb-1">
                  <span className="font-semibold text-forest">{affected_area}%</span> of the leaf area shows
                  visible symptoms.
                </p>
                <p>This estimate combines the image and your answers, not the image alone.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-forest/10 p-6">
          <h3 className="font-semibold text-forest mb-3">Why KISAN EYE thinks this</h3>
          <p className="text-sm text-forest/70 leading-relaxed mb-5">{explanation}</p>
          <h4 className="text-xs font-semibold text-forest/50 mb-2">Evidence considered</h4>
          <ul className="space-y-2">
            {evidence.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-forest/70">
                <CheckCircle2 size={16} className="text-leaf mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-bold text-forest mb-4">Recommended next steps</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {action_plan.map((step, i) => (
            <div key={step.title} className="rounded-2xl bg-white border border-forest/10 p-5 card-lift">
              <span className="text-xs font-semibold text-leaf">{String(i + 1).padStart(2, "0")}</span>
              <h4 className="font-semibold text-forest mt-1 mb-1.5">{step.title}</h4>
              <p className="text-sm text-forest/60 leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Yield Loss ROI Calculator */}
      <div className="mt-10 rounded-3xl bg-white border border-forest/10 p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-forest mb-4">Financial Impact & ROI Calculator</h3>
        <p className="text-sm text-forest/70 mb-6">Estimate your potential losses if this disease is left untreated, and the ROI of taking immediate action.</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Farm Size (Acres)</label>
              <input type="number" value={acres} onChange={(e) => setAcres(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-leaf" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Expected Yield Value per Acre ($)</label>
              <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-leaf" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-forest mb-2">Estimated Treatment Cost ($)</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-forest/20 bg-forest/5 focus:outline-none focus:border-leaf" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-forest/5 to-forest/10 rounded-2xl p-6 flex flex-col justify-center border border-forest/10">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-forest/10 pb-3">
                <span className="text-forest/70 font-medium">Estimated Loss Without Action ({risk_level === 'HIGH' ? '40%' : risk_level === 'MEDIUM' ? '15%' : '5%'} yield)</span>
                <span className="text-xl font-bold text-danger">-${estLoss.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-forest/10 pb-3">
                <span className="text-forest/70 font-medium">Treatment Investment</span>
                <span className="text-xl font-bold text-forest">-${costNum.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-forest">Net Savings by Acting Today</span>
                <span className="text-2xl font-black text-leaf">+${netSavings.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-forest/5 border border-forest/10 px-5 py-4 text-xs text-forest/60">
        KISAN EYE provides AI-based early-warning and decision support. Results may be
        uncertain and should not be treated as a definitive agricultural diagnosis.
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => onNavigate("analyze")}
          className="rounded-full bg-forest text-canvas px-6 py-3 font-semibold hover:bg-leaf transition-colors"
        >
          Analyze another crop
        </button>
        <button
          onClick={() => onNavigate("monitor")}
          className="rounded-full border border-forest/20 px-6 py-3 font-semibold text-forest hover:border-forest/40 transition-colors"
        >
          <CalendarClock size={17} className="inline mr-2 -mt-0.5" />Track progress
        </button>
        <button
          onClick={() => onNavigate("history")}
          className="rounded-full border border-forest/20 px-6 py-3 font-semibold text-forest hover:border-forest/40 transition-colors"
        >
          View case history
        </button>
      </div>
    </div>
  );
}
