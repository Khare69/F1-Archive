import React, { useId } from 'react';
import { getDriverEra, DRIVER_METADATA_REGISTRY } from './constructorEmblems';

export interface DriverHelmetAvatarProps {
  accentColor?: string;
  secondaryColor?: string;
  driverNumber?: number;
  driverCode?: string;
  championships?: number;
  era?: 'vintage' | 'classic' | 'modern';
  lastActiveYear?: number;
  debutYear?: number;
  className?: string;
  alt?: string;
  isDecorative?: boolean;
}

export const DriverHelmetAvatar: React.FC<DriverHelmetAvatarProps> = ({
  accentColor = '#00D2FF',
  secondaryColor,
  driverNumber,
  driverCode,
  championships,
  era: explicitEra,
  lastActiveYear,
  debutYear,
  className = '',
  alt,
  isDecorative = false,
}) => {
  // Scope all SVG <defs> IDs using React's useId() to prevent collisions across multi-card grids
  const rawId = useId();
  const uid = rawId.replace(/:/g, '_');

  // Infer driver metadata from code or alt text if available
  const normalizedKey = (driverCode || alt || '').toUpperCase().trim();
  const reg = DRIVER_METADATA_REGISTRY[normalizedKey];

  const effectiveNumber = driverNumber ?? reg?.number;
  const effectiveChampionships = championships ?? reg?.championships ?? 0;
  const effectiveCode = driverCode ?? reg?.code ?? (alt ? alt.split(' ').map(w => w[0]).slice(0, 3).join('').toUpperCase() : 'DRV');

  // Rule 2: Determine helmet era using lastActiveYear (with era override and debutYear fallback)
  // at < 1970, < 2003, and >= 2003
  const era = getDriverEra(explicitEra, lastActiveYear ?? reg?.lastActiveYear, debutYear ?? reg?.debutYear, normalizedKey);

  const primary = accentColor;
  const secondary = secondaryColor || '#FFFFFF';
  const accessibleLabel = alt || `Driver Avatar ${effectiveCode}`;

  const renderChampionshipBadge = () => {
    if (effectiveChampionships <= 0) return null;

    if (effectiveChampionships <= 3) {
      return (
        <g transform="translate(80, 24)" textAnchor="middle">
          {Array.from({ length: effectiveChampionships }).map((_, idx) => {
            const offset = (idx - (effectiveChampionships - 1) / 2) * 14;
            return (
              <text
                key={idx}
                x={offset}
                y="0"
                fill="#FFD700"
                fontSize="12"
                textAnchor="middle"
                dominantBaseline="central"
              >
                ★
              </text>
            );
          })}
        </g>
      );
    }

    return (
      <g transform="translate(80, 24)">
        <rect x="-24" y="-8" width="48" height="16" rx="8" fill="#11151F" stroke="#FFD700" strokeWidth="1" />
        <text
          x="0"
          y="1"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFD700"
          fontSize="10"
          fontWeight="bold"
          fontFamily="'Share Tech Mono', monospace, sans-serif"
        >
          ★ {effectiveChampionships}x WDC
        </text>
      </g>
    );
  };

  const renderHelmetByEra = () => {
    switch (era) {
      // 1. Vintage Era (< 1970): Open-face helmet, leather chin strap, round aviator goggles
      case 'vintage':
        return (
          <g>
            {/* Open face bowl shell */}
            <path
              d="M36 86 C32 44, 52 32, 80 32 C108 32, 128 44, 124 86 C120 102, 108 116, 96 118 L64 118 C52 116, 40 102, 36 86 Z"
              fill={`url(#${uid}-helmet-grad)`}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2"
            />
            {/* Crown center racing stripe */}
            <path
              d="M74 32 C75 60, 75 90, 75 118 L85 118 C85 90, 85 60, 86 32 Z"
              fill={secondary}
              opacity="0.8"
            />
            {/* Open-face interior shadow */}
            <ellipse cx="80" cy="80" rx="30" ry="24" fill="#0C0E14" />

            {/* Vintage Round Goggles */}
            <g>
              {/* Left Lens */}
              <circle cx="66" cy="74" r="13" fill="#1A2634" stroke={secondary} strokeWidth="2.5" />
              <circle cx="66" cy="74" r="10" fill={`url(#${uid}-visor-grad)`} opacity="0.85" />
              <path d="M59 70 Q66 66 73 70" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />

              {/* Right Lens */}
              <circle cx="94" cy="74" r="13" fill="#1A2634" stroke={secondary} strokeWidth="2.5" />
              <circle cx="94" cy="74" r="10" fill={`url(#${uid}-visor-grad)`} opacity="0.85" />
              <path d="M87 70 Q94 66 101 70" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />

              {/* Bridge and strap */}
              <line x1="79" y1="74" x2="81" y2="74" stroke={secondary} strokeWidth="3" />
              <path d="M36 76 L53 76" stroke="#4A3B32" strokeWidth="3" />
              <path d="M107 76 L124 76" stroke="#4A3B32" strokeWidth="3" />
            </g>

            {/* Leather Chin Strap */}
            <path d="M52 104 Q80 126 108 104" stroke="#5A4738" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="52" cy="104" r="3" fill="#D4AF37" />
            <circle cx="108" cy="104" r="3" fill="#D4AF37" />
          </g>
        );

      // 2. Classic Era (< 2003): Full-face rounded shell, classic horizontal visor aperture
      case 'classic':
        return (
          <g>
            {/* Full-face shell */}
            <path
              d="M34 88 C30 42, 50 30, 80 30 C110 30, 130 42, 126 88 C124 108, 114 122, 98 124 L62 124 C46 122, 36 108, 34 88 Z"
              fill={`url(#${uid}-helmet-grad)`}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2"
            />
            {/* Bold twin crown stripes */}
            <path
              d="M68 30 C70 56, 70 80, 70 124 L74 124 C74 80, 74 56, 72 30 Z"
              fill={secondary}
              opacity="0.9"
            />
            <path
              d="M86 30 C88 56, 88 80, 88 124 L92 124 C92 80, 92 56, 90 30 Z"
              fill={secondary}
              opacity="0.9"
            />

            {/* Classic Horizontal Visor Opening */}
            <path
              d="M44 68 Q80 62 116 68 L114 86 Q80 90 46 86 Z"
              fill={`url(#${uid}-visor-grad)`}
              stroke="#111111"
              strokeWidth="2"
            />

            {/* Tinted visor reflection gloss */}
            <path
              d="M48 72 Q80 66 112 72 L110 76 Q80 70 50 76 Z"
              fill="rgba(255, 255, 255, 0.45)"
            />

            {/* Visor pivot hardware */}
            <circle cx="43" cy="76" r="4" fill="#222222" stroke={secondary} strokeWidth="1" />
            <circle cx="117" cy="76" r="4" fill="#222222" stroke={secondary} strokeWidth="1" />

            {/* Chin vent slits */}
            <line x1="72" y1="106" x2="88" y2="106" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
            <line x1="74" y1="112" x2="86" y2="112" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
          </g>
        );

      // 3. Modern Era (>= 2003): Aerodynamic spoiler, angled visor, HANS post anchors
      case 'modern':
      default:
        return (
          <g>
            {/* Modern aerodynamic helmet shell */}
            <path
              d="M32 84 C30 38, 52 28, 80 28 C108 28, 130 38, 128 84 C126 96, 120 106, 110 114 L98 126 L62 126 L50 114 C40 106, 34 96, 32 84 Z"
              fill={`url(#${uid}-helmet-grad)`}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="2"
            />

            {/* Rear Aero Ducktail Spoiler */}
            <path
              d="M28 80 Q24 92 36 98 L38 90 Q30 84 28 80 Z"
              fill={secondary}
              opacity="0.8"
            />

            {/* Angular dynamic livery slash */}
            <path
              d="M48 34 L112 34 L122 56 L38 56 Z"
              fill={secondary}
              opacity="0.25"
            />
            <path
              d="M74 28 L86 28 L86 126 L74 126 Z"
              fill={secondary}
              opacity="0.8"
            />

            {/* Aggressive angled visor */}
            <path
              d="M40 66 Q80 58 120 66 L116 88 Q80 94 44 88 Z"
              fill={`url(#${uid}-visor-grad)`}
              stroke="#080A0E"
              strokeWidth="2"
            />

            {/* Iridescent visor sheen bar */}
            <path
              d="M44 70 Q80 62 116 70 L114 74 Q80 66 46 74 Z"
              fill="rgba(255, 255, 255, 0.55)"
            />

            {/* Visor tear-off tabs */}
            <circle cx="39" cy="75" r="3.5" fill="#151A22" stroke={secondary} strokeWidth="1" />
            <circle cx="121" cy="75" r="3.5" fill="#151A22" stroke={secondary} strokeWidth="1" />

            {/* HANS anchor post collar studs */}
            <circle cx="46" cy="112" r="3" fill="#A0A5AA" stroke="#000000" strokeWidth="1" />
            <circle cx="114" cy="112" r="3" fill="#A0A5AA" stroke="#000000" strokeWidth="1" />

            {/* Chin aerodynamic intake vents */}
            <path d="M68 104 L92 104 L90 108 L70 108 Z" fill="#0C0E14" />
            <path d="M72 112 L88 112 L86 115 L74 115 Z" fill="#0C0E14" />
          </g>
        );
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      className={`driver-helmet-avatar-svg ${className}`}
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : accessibleLabel}
      aria-hidden={isDecorative ? 'true' : undefined}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        {/* Scoped Helmet Shell Gradient */}
        <linearGradient id={`${uid}-helmet-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="65%" stopColor={primary} />
          <stop offset="100%" stopColor="#0B0D14" />
        </linearGradient>

        {/* Scoped Visor Tint Gradient */}
        <linearGradient id={`${uid}-visor-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#091422" />
          <stop offset="50%" stopColor="#1B2F48" />
          <stop offset="100%" stopColor="#080C14" />
        </linearGradient>

        {/* Background Radial Glow */}
        <radialGradient id={`${uid}-bg-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0B0D14" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Card Base Frame with Subtle Outer Rim */}
      <rect
        x="6"
        y="6"
        width="148"
        height="148"
        rx="18"
        fill="#0D1017"
        stroke="rgba(255, 255, 255, 0.16)"
        strokeWidth="1.5"
      />

      {/* Ambient background glow */}
      <circle cx="80" cy="80" r="60" fill={`url(#${uid}-bg-glow)`} />

      {/* Render era-specific helmet geometry */}
      {renderHelmetByEra()}

      {/* Championship stars badge */}
      {renderChampionshipBadge()}

      {/* Driver Number / Broadcast Code Badge in bottom right */}
      <g transform="translate(122, 136)">
        <rect
          x="-22"
          y="-12"
          width="44"
          height="18"
          rx="4"
          fill="#090B10"
          stroke={primary}
          strokeWidth="1.5"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="bold"
          fontFamily="'Share Tech Mono', monospace, sans-serif"
          letterSpacing="0.5"
        >
          {effectiveNumber ? `#${effectiveNumber}` : effectiveCode}
        </text>
      </g>

      {/* Era tag badge in bottom left */}
      <g transform="translate(36, 136)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.5)"
          fontSize="8"
          fontFamily="'Share Tech Mono', monospace, sans-serif"
          letterSpacing="1"
        >
          {era.toUpperCase()}
        </text>
      </g>
    </svg>
  );
};
