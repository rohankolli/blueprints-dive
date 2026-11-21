export function RouteMap({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 720 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="720" y2="320" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d7377" stopOpacity="0.18" />
          <stop offset="1" stopColor="#1c5f7a" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="land" x1="80" y1="40" x2="640" y2="280" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0a5558" />
          <stop offset="1" stopColor="#d4922a" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="720" height="320" rx="28" fill="url(#sea)" />
      <path
        d="M70 210C120 150 170 130 230 145C280 158 300 120 360 110C430 96 470 140 520 155C580 172 640 140 680 170"
        stroke="url(#land)"
        strokeWidth="18"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        className="route-line"
        d="M90 200C150 150 210 145 270 160C330 176 360 120 430 125C500 130 560 170 640 150"
        stroke="#0d7377"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="90" cy="200" r="10" fill="#0d7377" />
      <circle cx="90" cy="200" r="18" stroke="#0d7377" strokeOpacity="0.35" />
      <circle cx="430" cy="125" r="8" fill="#d4922a" />
      <circle cx="640" cy="150" r="11" fill="#0a5558" />
    </svg>
  );
}
