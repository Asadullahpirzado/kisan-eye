import { useRef, useState } from "react";
import { UploadCloud, ImageOff, RefreshCcw, Camera, ShieldCheck, ScanLine } from "lucide-react";
import { analyzeImage } from "../api.js";

const CROPS = [
  { id: "tomato", label: "Tomato 🍅" },
  { id: "potato", label: "Potato 🥔" },
  { id: "pepper", label: "Pepper 🌶️" },
];

const STAGES = [
  "Reading image",
  "Checking image quality",
  "Looking at visual symptoms",
  "Estimating disease likelihood",
];

export default function Analyze({ onAnalyzed }) {
  const [crop, setCrop] = useState("tomato");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | scanning | error
  const [stageIndex, setStageIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleFile(selected) {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setErrorMessage("Please choose a JPG, PNG, or other image file.");
      setStatus("error");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setErrorMessage("That photo is larger than 10 MB. Please choose a smaller image.");
      setStatus("error");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("idle");
    setErrorMessage("");
  }

  function onDrop(event) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  async function runAnalysis() {
    if (!file) return;
    setStatus("scanning");
    setStageIndex(0);

    const stageTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 550);

    try {
      const [result] = await Promise.all([
        analyzeImage(crop, file),
        new Promise((resolve) => setTimeout(resolve, STAGES.length * 550)),
      ]);
      clearInterval(stageTimer);

      if (!result.quality_ok) {
        setStatus("error");
        setErrorMessage(result.quality_message);
        return;
      }

      onAnalyzed({ crop, ...result });
    } catch (err) {
      clearInterval(stageTimer);
      setStatus("error");
      setErrorMessage(err.message || "Could not reach the KISAN EYE server. Is the backend running?");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 page-enter">
      <div className="flex items-start gap-4 mb-8">
        <div className="hidden sm:flex h-12 w-12 shrink-0 rounded-2xl bg-leaf/10 items-center justify-center"><ScanLine className="text-leaf" /></div>
        <div>
          <p className="text-signal font-semibold text-sm mb-1">Step 1 of 3 · Visual scan</p>
          <h1 className="text-3xl font-bold text-forest mb-2">Analyze a crop</h1>
          <p className="text-forest/60">Pick the crop, then upload one clear photo of the most affected leaf.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {CROPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCrop(c.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${
              crop === c.id
                ? "bg-leaf text-white border-leaf"
                : "border-forest/15 text-forest/70 hover:border-forest/30"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {status !== "scanning" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-3xl border-2 border-dashed bg-white p-10 text-center transition-colors ${dragging ? "border-leaf bg-leaf/5" : "border-forest/20"}`}
        >
          {preview ? (
            <div className="space-y-4">
              <img src={preview} alt="Selected leaf" className="mx-auto max-h-72 rounded-2xl object-cover" />
              <button
                onClick={() => inputRef.current.click()}
                className="text-sm text-signal font-medium underline underline-offset-2"
              >
                Choose a different photo
              </button>
            </div>
          ) : (
            <button onClick={() => inputRef.current.click()} className="flex flex-col items-center gap-3 mx-auto" aria-label="Choose a leaf photo">
              <div className="h-14 w-14 rounded-2xl bg-leaf/10 flex items-center justify-center">
                <UploadCloud className="text-leaf" size={26} />
              </div>
              <span className="font-semibold text-forest">Upload a crop image</span>
              <span className="text-sm text-forest/50">Tap to browse, or drag a photo here · JPG, PNG up to 10 MB</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {status !== "scanning" && !preview && (
        <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
          {[
            [Camera, "Frame one leaf", "Keep the leaf centered and fill most of the photo."],
            [ShieldCheck, "Use natural light", "Avoid glare, deep shadows, and blurry images."],
            [ScanLine, "Show the symptoms", "Include the spots, edges, or discolouration clearly."],
          ].map(([Icon, title, text]) => <div key={title} className="rounded-2xl bg-white/70 border border-forest/10 p-4"><Icon size={18} className="text-leaf mb-2" /><p className="font-semibold text-forest">{title}</p><p className="mt-1 text-xs leading-relaxed text-forest/55">{text}</p></div>)}
        </div>
      )}

      {status === "error" && (
        <div className="mt-5 rounded-2xl bg-danger/5 border border-danger/20 px-5 py-4 flex items-start gap-3">
          <ImageOff className="text-danger shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-forest/80">{errorMessage}</p>
        </div>
      )}

      {status === "scanning" && (
        <div className="rounded-3xl bg-white p-8 border border-forest/10">
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-forest/5 mb-6">
            {preview && <img src={preview} alt="" className="w-full h-full object-cover opacity-80" />}
            <div className="absolute left-0 right-0 h-1 bg-signal scan-line" />
          </div>
          <div className="space-y-2">
            {STAGES.map((stage, i) => (
              <div key={stage} className="flex items-center gap-3 text-sm">
                <span
                  className={`h-2 w-2 rounded-full ${
                    i < stageIndex ? "bg-leaf" : i === stageIndex ? "bg-signal animate-pulse" : "bg-forest/15"
                  }`}
                />
                <span className={i <= stageIndex ? "text-forest" : "text-forest/35"}>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status !== "scanning" && (
        <div className="mt-8 flex justify-end">
          <button
            disabled={!file}
            onClick={status === "error" ? () => setStatus("idle") : runAnalysis}
            className="rounded-full bg-forest text-canvas px-7 py-3 font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-leaf transition-colors flex items-center gap-2"
          >
            {status === "error" ? (
              <>
                <RefreshCcw size={16} /> Try again
              </>
            ) : (
              "Start analysis"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
