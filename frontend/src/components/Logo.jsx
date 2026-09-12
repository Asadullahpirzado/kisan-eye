export default function Logo({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none">
      <path
        d="M24 12C14 12 6 20 3 24c3 4 11 12 21 12s18-8 21-12c-3-4-11-12-21-12Z"
        fill="#12372A"
      />
      <path
        d="M24 16c3.5 4 3.5 12 0 16-3.5-4-3.5-12 0-16Z"
        fill="#8BC34A"
      />
      <circle cx="24" cy="24" r="6.5" fill="#F7F9F4" />
      <circle cx="24" cy="24" r="3.4" fill="#2E7D32" />
    </svg>
  );
}
