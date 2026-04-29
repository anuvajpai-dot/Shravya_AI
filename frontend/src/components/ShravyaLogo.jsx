export default function ShravyaLogo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="shravya-logo-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect width="40" height="40" rx="10" fill="url(#shravya-logo-grad)" />
      {/* Stylised S path */}
      <path
        d="M 27,13 C 27,8 13,8 13,13 C 13,18 27,22 27,27 C 27,32 13,32 13,27"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sparkle dot */}
      <circle cx="32" cy="8" r="2.2" fill="white" opacity="0.75" />
    </svg>
  )
}
