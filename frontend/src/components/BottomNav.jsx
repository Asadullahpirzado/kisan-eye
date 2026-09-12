import { Home, ScanLine, History, Activity } from "lucide-react";

const ITEMS = [
  { key: "home", label: "Home", icon: Home },
  { key: "analyze", label: "Analyze", icon: ScanLine },
  { key: "monitor", label: "Monitor", icon: Activity },
  { key: "history", label: "History", icon: History },
];

export default function BottomNav({ view, onNavigate }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-forest/10 flex justify-around py-2 pb-safe">
      {ITEMS.map(({ key, label, icon: Icon }) => {
        const active = view === key;
        return (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className="flex flex-col items-center gap-1 px-3 py-1.5"
          >
            <Icon
              size={20}
              strokeWidth={active ? 2.4 : 1.8}
              className={active ? "text-leaf" : "text-forest/40"}
            />
            <span className={`text-[11px] ${active ? "text-leaf font-semibold" : "text-forest/40"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
