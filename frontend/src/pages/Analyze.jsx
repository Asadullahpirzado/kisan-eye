import { useRef, useState } from "react";
import { UploadCloud, ImageOff, RefreshCcw, Camera, ShieldCheck, ScanLine, Leaf, Focus } from "lucide-react";
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
  const [scanMode, setScanMode] = useState("leaf"); // "leaf" | "drone"
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
                ? "bg-forest border-forest text-white"
                : "bg-white border-forest/20 text-forest hover:bg-forest/5"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Drone Mode Toggle */}
      <div className="flex items-center bg-forest/5 rounded-xl p-1 mb-8 max-w-sm">
        <button 
          onClick={() => setScanMode("leaf")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${scanMode === "leaf" ? "bg-white shadow-sm text-forest" : "text-forest/60 hover:text-forest"}`}
        >
          <Leaf size={16} /> Single Leaf
        </button>
        <button 
          onClick={() => setScanMode("drone")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${scanMode === "drone" ? "bg-forest shadow-sm text-white" : "text-forest/60 hover:text-forest"}`}
        >
          <Focus size={16} /> Drone / Aerial
        </button>
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
            <button onClick={() => inputRef.current.click()} className="w-full" aria-label="Choose a leaf photo">
              <div className="flex flex-col items-center p-8 text-center text-forest/50 hover:text-forest transition-colors h-[260px] justify-center border border-dashed border-forest/20 rounded-3xl mx-2 my-2 bg-white/50">
                <UploadCloud className="mb-4 text-leaf" size={40} />
                <p className="font-semibold text-forest mb-1">
                  {scanMode === 'drone' ? 'Upload aerial drone photo' : 'Drag leaf photo here'}
                </p>
                <p className="text-sm px-4">
                  {scanMode === 'drone' ? 'Supports JPG, PNG (Max 10MB)' : 'or click to browse from your device'}
                </p>
              </div>
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
          <div className="relative overflow-hidden rounded-3xl bg-forest/5 aspect-square border border-forest/10 shadow-sm mb-6">
            <img src={preview} alt="Crop preview" className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 bg-forest/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-6">
                {scanMode === 'drone' ? (
                  <div className="w-32 h-32 border-2 border-leaf rounded-xl relative overflow-hidden flex items-center justify-center">
                    <Focus className="text-leaf absolute opacity-20" size={64} />
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(132,204,22,0.8)_100%)] bg-[length:100%_200%] animate-[scan_2s_linear_infinite]" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_95%,rgba(132,204,22,0.8)_100%)] bg-[length:200%_100%] animate-[scan-h_2s_linear_infinite]" />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full border-4 border-leaf/20 border-t-leaf animate-spin" />
                )}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">
                {scanMode === 'drone' ? 'Analyzing field sectors...' : 'Analyzing pathology...'}
              </h2>
              <p className="text-white/70 text-sm max-w-[200px]">
                {STAGES[stageIndex]}
              </p>
            </div>
          </div>

          {/* Add custom CSS for drone animation */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scan { 0% { background-position: 0 -100%; } 100% { background-position: 0 100%; } }
            @keyframes scan-h { 0% { background-position: -100% 0; } 100% { background-position: 100% 0; } }
          `}} />

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
