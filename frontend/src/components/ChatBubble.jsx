import Logo from "./Logo.jsx";

export default function ChatBubble({ from, children }) {
  if (from === "agent") {
    return (
      <div className="flex items-start gap-3 rise-in">
        <div className="h-8 w-8 shrink-0 rounded-full bg-white shadow-soft flex items-center justify-center">
          <Logo className="h-5 w-5" />
        </div>
        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-md shadow-soft text-sm text-forest leading-relaxed">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end rise-in">
      <div className="bg-forest text-canvas rounded-2xl rounded-tr-sm px-4 py-3 max-w-md text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
