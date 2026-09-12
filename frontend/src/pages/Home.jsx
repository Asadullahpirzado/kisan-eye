import { Eye, Leaf, MessageCircle, TimerReset, CheckCircle2, ArrowUpRight } from "lucide-react";

const PILLARS = [
  {
    icon: Eye,
    title: "Sees the leaf",
    text: "A vision model reads colour, spotting and texture straight from the photo you take in the field.",
  },
  {
    icon: MessageCircle,
    title: "Asks what's missing",
    text: "When the picture alone isn't enough, the agent asks two or three short questions instead of guessing.",
  },
  {
    icon: Leaf,
    title: "Explains the risk",
    text: "Every result comes with plain-language reasoning, not just a disease name and a percentage.",
  },
  {
    icon: TimerReset,
    title: "Remembers last time",
    text: "Upload again in a few days and KISAN EYE tells you if things are getting better or worse.",
  },
];

export default function Home({ onNavigate }) {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 leaf-vein" /><div className="hero-orb absolute -right-20 -top-20 h-96 w-96" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-24 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <p className="text-signal font-semibold text-sm mb-4">AI crop intelligence · built for faster field decisions</p>
            <h1 className="text-4xl md:text-[3.4rem] leading-[1.05] font-extrabold text-forest tracking-tight">
              See crop problems before they spread.
            </h1>
            <p className="mt-6 text-forest/70 text-lg max-w-lg">
              Upload a photo of an affected leaf. KISAN EYE looks at what the
              image shows, asks a few follow-up questions when it needs to,
              and lays out a risk level and an action plan you can actually
              use.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate("analyze")}
                className="rounded-full bg-forest text-canvas px-7 py-3.5 font-semibold hover:bg-leaf transition-colors shadow-soft"
              >
                Analyze my crop
              </button>
              <button
                onClick={() => onNavigate("history")}
                className="rounded-full border border-forest/20 px-7 py-3.5 font-semibold text-forest hover:border-forest/40 transition-colors"
              >
                View previous cases
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-forest/60">
              {['Photo-first diagnosis', 'Plain-language actions', 'Progress tracking'].map(item => <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-leaf" />{item}</span>)}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] bg-white shadow-soft p-6 rotate-1 border border-white/80">
              <div className="rounded-2xl overflow-hidden relative aspect-[4/5] bg-gradient-to-br from-leaf/20 to-sprout/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Leaf size={96} className="text-leaf/60" />
                </div>
                <div className="absolute left-0 right-0 h-1 bg-signal/70 scan-line" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-forest/50">Reading visual symptoms</p>
                  <p className="font-semibold text-forest">Tomato leaf, sample scan</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-signal/10 text-signal">
                  live demo
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-forest/10 pt-4">
                <div><p className="text-[10px] uppercase tracking-wide text-forest/45">Visual match</p><p className="font-bold text-forest">87%</p></div>
                <div><p className="text-[10px] uppercase tracking-wide text-forest/45">Risk</p><p className="font-bold text-amber">Review</p></div>
                <div><p className="text-[10px] uppercase tracking-wide text-forest/45">Next check</p><p className="font-bold text-forest">4 days</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl bg-white border border-forest/10 p-6 card-lift">
              <div className="h-11 w-11 rounded-xl bg-leaf/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-leaf" />
              </div>
              <h3 className="font-semibold text-forest mb-1.5">{title}</h3>
              <p className="text-sm text-forest/60 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-24">
        <div className="rounded-3xl border border-forest/10 bg-white p-7 md:p-10 grid md:grid-cols-[.8fr_1.2fr] gap-8 items-center">
          <div><p className="text-signal text-sm font-semibold mb-2">BUILT FOR THE FIELD</p><h2 className="text-2xl md:text-3xl font-bold text-forest">From a leaf photo to a decision you can explain.</h2><p className="text-forest/60 mt-3 leading-relaxed">KISAN EYE combines visual evidence with a few high-value field questions, so it never turns a weak photo into overconfident advice.</p></div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[['01','Capture','One clear leaf photo'],['02','Confirm','Answer 2–4 field questions'],['03','Act','Get a risk-aware action plan']].map(([n,t,d]) => <div key={n} className="rounded-2xl bg-canvas p-5"><p className="text-leaf font-bold">{n}</p><p className="mt-3 font-semibold text-forest">{t}</p><p className="mt-1 text-sm text-forest/55">{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-10 pb-24">
        <div className="rounded-3xl bg-forest text-canvas px-8 md:px-14 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to check a leaf right now?</h2>
            <p className="text-canvas/70 max-w-md">
              It takes one photo. KISAN EYE handles the rest and tells you
              honestly when it isn't sure.
            </p>
          </div>
          <button
            onClick={() => onNavigate("analyze")}
            className="rounded-full bg-sprout text-forest px-7 py-3.5 font-semibold hover:bg-canvas transition-colors shrink-0"
          >
            Start an analysis <ArrowUpRight size={17} className="inline ml-1 -mt-0.5" />
          </button>
        </div>
      </section>
    </div>
  );
}
