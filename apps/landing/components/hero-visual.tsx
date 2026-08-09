/**
 * Copyright (c) 2026 GYlove1994 <gylove1994@acgsteps.com>
 * SPDX-License-Identifier: BUSL-1.1
 */

/** Full-bleed product atmosphere: queue → Printer Agent → receipt. */
export function HeroVisual() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        role="img"
      >
        <defs>
          <linearGradient id="lane" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.72 0.12 165)" stopOpacity="0" />
            <stop offset="40%" stopColor="oklch(0.78 0.12 165)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="oklch(0.85 0.08 200)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.97 0.02 110)" />
            <stop offset="100%" stopColor="oklch(0.92 0.03 95)" />
          </linearGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        <rect width="1440" height="900" fill="url(#lane)" opacity="0.15" />

        {/* Queue lanes */}
        <g opacity="0.55">
          <rect className="queue-sweep" x="80" y="220" width="520" height="10" rx="5" fill="url(#lane)" />
          <rect className="queue-sweep" x="80" y="260" width="420" height="10" rx="5" fill="url(#lane)" style={{ animationDelay: '0.7s' }} />
          <rect className="queue-sweep" x="80" y="300" width="470" height="10" rx="5" fill="url(#lane)" style={{ animationDelay: '1.4s' }} />
        </g>

        {/* Printer Agent node */}
        <g transform="translate(640 210)">
          <rect
            x="0"
            y="0"
            width="180"
            height="140"
            rx="16"
            fill="oklch(0.22 0.03 250 / 0.55)"
            stroke="oklch(0.85 0.04 165 / 0.55)"
            strokeWidth="2"
          />
          <text
            x="90"
            y="48"
            textAnchor="middle"
            fill="oklch(0.92 0.02 160)"
            fontFamily="ui-monospace, monospace"
            fontSize="14"
          >
            Printer Agent
          </text>
          <circle cx="48" cy="88" r="8" fill="oklch(0.72 0.15 155)" />
          <text x="68" y="93" fill="oklch(0.88 0.02 160)" fontSize="13" fontFamily="ui-sans-serif, sans-serif">
            lease → print
          </text>
          <text x="28" y="120" fill="oklch(0.75 0.03 200)" fontSize="12" fontFamily="ui-monospace, monospace">
            TCP · USB · Serial
          </text>
        </g>

        {/* Receipt paper plane */}
        <g transform="translate(920 160)">
          <rect
            x="0"
            y="0"
            width="280"
            height="420"
            rx="8"
            fill="url(#paper)"
            filter="url(#soft)"
            opacity="0.35"
          />
          <rect x="18" y="18" width="244" height="384" rx="4" fill="url(#paper)" />
          <rect x="48" y="56" width="184" height="10" rx="2" fill="oklch(0.28 0.03 250 / 0.75)" />
          <rect x="64" y="84" width="152" height="6" rx="2" fill="oklch(0.4 0.03 250 / 0.45)" />
          <rect x="48" y="120" width="184" height="6" rx="2" fill="oklch(0.35 0.03 250 / 0.5)" />
          <rect x="48" y="140" width="160" height="6" rx="2" fill="oklch(0.35 0.03 250 / 0.4)" />
          <rect x="48" y="160" width="172" height="6" rx="2" fill="oklch(0.35 0.03 250 / 0.4)" />
          <rect x="48" y="200" width="184" height="8" rx="2" fill="oklch(0.3 0.03 250 / 0.55)" />
          <rect x="48" y="230" width="120" height="6" rx="2" fill="oklch(0.35 0.03 250 / 0.35)" />
          <rect x="48" y="250" width="140" height="6" rx="2" fill="oklch(0.35 0.03 250 / 0.35)" />
          <rect x="70" y="300" width="140" height="70" rx="4" fill="none" stroke="oklch(0.3 0.03 250 / 0.55)" strokeWidth="3" />
          <text
            x="140"
            y="342"
            textAnchor="middle"
            fill="oklch(0.3 0.03 250 / 0.7)"
            fontFamily="ui-monospace, monospace"
            fontSize="18"
          >
            QR
          </text>
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
