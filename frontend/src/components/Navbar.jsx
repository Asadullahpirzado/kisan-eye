import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "analyze", label: "Analyze Crop" },
  { key: "history", label: "History" },
  { key: "monitor", label: "Monitoring" },
];

export default function Navbar({ view, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <header className="hidden md:flex items-center justify-between px-10 py-5 sticky top-0 z-40 bg-canvas/90 backdrop-blur border-b border-forest/10">
      <button
        onClick={() => onNavigate("home")}
        className="flex items-center gap-3"
      >
        <Logo />
        <span className="text-lg font-bold tracking-tight text-forest">KISAN EYE</span>
      </button>

      <nav className="flex items-center gap-1">
        {LINKS.map((link) => (
          <button
            key={link.key}
            onClick={() => onNavigate(link.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              view === link.key
                ? "bg-forest text-canvas"
                : "text-forest/70 hover:text-forest hover:bg-forest/5"
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-sm text-forest/60">👤 {user}</span>
        <button
          onClick={() => onNavigate("analyze")}
          className="rounded-full bg-leaf text-white px-5 py-2.5 text-sm font-semibold hover:bg-forest transition-colors shadow-soft"
        >
          Analyze My Crop
        </button>
        <button
          onClick={logout}
          className="rounded-full border border-red-300 text-red-500 px-4 py-2 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
