import React, { useId } from 'react';
import { getConstructorEmblem, CrestPattern } from './constructorEmblems';

export interface ConstructorCrestProps {
  teamIdOrName?: string;
  accentColor?: string;
  secondaryColor?: string;
  className?: string;
  alt?: string;
  isDecorative?: boolean;
}

export const ConstructorCrest: React.FC<ConstructorCrestProps> = ({
  teamIdOrName,
  accentColor,
  secondaryColor,
  className = '',
  alt,
  isDecorative = false,
}) => {
  // Scope all SVG <defs> IDs using React's useId() to prevent collisions across grid cards
  const rawId = useId();
  const uid = rawId.replace(/:/g, '_');

  const emblem = getConstructorEmblem(teamIdOrName);
  const primary = accentColor || emblem.primaryColor;
  const secondary = secondaryColor || emblem.secondaryColor;
  const monogram = emblem.monogram;

  const accessibleLabel = alt || `${emblem.name} Crest`;

  const renderPatternGeometry = (pattern: CrestPattern) => {
    switch (pattern) {
      case 'shield':
        return (
          <g>
            <path
              d="M30 25 L90 25 L85 75 Q60 105 60 105 Q35 75 30 75 Z"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />
            <path
              d="M32 28 L88 28 L60 100 Z"
              fill="none"
              stroke={secondary}
              strokeWidth="2"
              strokeDasharray="4 2"
              opacity="0.7"
            />
            <path
              d="M60 25 L60 98"
              stroke={secondary}
              strokeWidth="2"
              opacity="0.8"
            />
          </g>
        );

      case 'speedmark':
      case 'apex-wing':
        return (
          <g>
            <path
              d="M20 75 Q40 25 100 30 Q70 55 50 85 Q30 95 20 75 Z"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />
            <path
              d="M35 70 Q50 38 95 40 Q65 60 52 82 Z"
              fill={secondary}
              opacity="0.85"
            />
          </g>
        );

      case 'bull-crest':
      case 'chevron':
        return (
          <g>
            <polygon
              points="60,20 95,45 80,95 40,95 25,45"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />
            <polyline
              points="35,60 60,38 85,60"
              fill="none"
              stroke={secondary}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="42,75 60,56 78,75"
              fill="none"
              stroke={secondary}
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>
        );

      case 'tri-star':
      case 'split-carbon':
        return (
          <g>
            <circle
              cx="60"
              cy="60"
              r="38"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />
            <path
              d="M60 25 L64 56 L95 60 L68 68 L60 95 L52 68 L25 60 L56 56 Z"
              fill={secondary}
            />
            <circle cx="60" cy="60" r="8" fill="#111111" stroke={secondary} strokeWidth="2" />
          </g>
        );

      case 'wings':
        return (
          <g>
            <path
              d="M20 50 Q60 40 100 50 Q85 75 60 70 Q35 75 20 50 Z"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />
            <path
              d="M25 55 L95 55 M30 62 L90 62 M40 68 L80 68"
              stroke={secondary}
              strokeWidth="2"
              opacity="0.9"
            />
          </g>
        );

      case 'racing-stripes':
        return (
          <g>
            <rect
              x="25"
              y="25"
              width="70"
              height="70"
              rx="12"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />
            <path d="M42 25 L25 55 L35 95 L52 25 Z" fill={secondary} opacity="0.9" />
            <path d="M58 25 L41 55 L51 95 L68 25 Z" fill={secondary} opacity="0.6" />
          </g>
        );

      case 'heritage-roundel':
        return (
          <g>
            <circle
              cx="60"
              cy="60"
              r="40"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />
            <circle
              cx="60"
              cy="60"
              r="34"
              fill="none"
              stroke={secondary}
              strokeWidth="3"
            />
            <circle cx="60" cy="60" r="28" fill="rgba(0,0,0,0.3)" />
          </g>
        );

      case 'speed-grid':
        return (
          <g>
            <polygon
              points="30,30 90,30 85,90 25,90"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />
            <line x1="30" y1="50" x2="88" y2="50" stroke={secondary} strokeWidth="3" />
            <line x1="28" y1="70" x2="86" y2="70" stroke={secondary} strokeWidth="3" />
            <line x1="50" y1="30" x2="45" y2="90" stroke={secondary} strokeWidth="2" strokeDasharray="3 3" />
            <line x1="70" y1="30" x2="65" y2="90" stroke={secondary} strokeWidth="2" strokeDasharray="3 3" />
          </g>
        );

      case 'industrial-h':
        return (
          <g>
            <rect
              x="26"
              y="26"
              width="68"
              height="68"
              rx="8"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1.5"
            />
            <path
              d="M40 38 L40 82 M80 38 L80 82 M40 60 L80 60"
              stroke={secondary}
              strokeWidth="8"
              strokeLinecap="square"
            />
          </g>
        );

      case 'rings-geometric':
        return (
          <g>
            <rect
              x="24"
              y="32"
              width="72"
              height="56"
              rx="10"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />
            <circle cx="44" cy="54" r="14" fill="none" stroke={secondary} strokeWidth="3" />
            <circle cx="58" cy="54" r="14" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" />
            <circle cx="72" cy="54" r="14" fill="none" stroke={secondary} strokeWidth="3" />
          </g>
        );

      case 'cadillac-crest':
        return (
          <g>
            <polygon
              points="60,22 96,38 90,82 60,102 30,82 24,38"
              fill={`url(#${uid}-grad-primary)`}
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />
            <polygon
              points="60,28 90,42 85,78 60,94 35,78 30,42"
              fill="none"
              stroke={secondary}
              strokeWidth="2.5"
            />
            <path
              d="M38 52 L82 52 M42 66 L78 66"
              stroke={secondary}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          </g>
        );

      default:
        return (
          <polygon
            points="60,20 95,45 80,95 40,95 25,45"
            fill={`url(#${uid}-grad-primary)`}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
          />
        );
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      className={`constructor-crest-svg ${className}`}
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : accessibleLabel}
      aria-hidden={isDecorative ? 'true' : undefined}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        {/* Scoped primary gradient with depth */}
        <linearGradient id={`${uid}-grad-primary`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor="#0B0D12" />
        </linearGradient>

        {/* Subtle carbon background pattern */}
        <pattern id={`${uid}-carbon`} width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="rgba(255,255,255,0.04)" />
          <rect x="2" y="2" width="2" height="2" fill="rgba(0,0,0,0.3)" />
        </pattern>
      </defs>

      {/* Outer base card rim ensuring dark primaries like Cadillac (#1F242B) pop */}
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="16"
        fill="#0D1017"
        stroke="rgba(255, 255, 255, 0.18)"
        strokeWidth="1.5"
      />

      {/* Carbon pattern overlay */}
      <rect x="7" y="7" width="106" height="106" rx="15" fill={`url(#${uid}-carbon)`} />

      {/* Geometric pattern */}
      {renderPatternGeometry(emblem.pattern)}

      {/* Monogram Badge Overlay */}
      <g transform="translate(60, 96)">
        <rect
          x="-24"
          y="-12"
          width="48"
          height="16"
          rx="4"
          fill="#0B0E14"
          stroke={secondary}
          strokeWidth="1"
        />
        <text
          x="0"
          y="0"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize="9"
          fontFamily="'Share Tech Mono', monospace, sans-serif"
          fontWeight="bold"
          letterSpacing="1"
        >
          {monogram}
        </text>
      </g>

      {/* Telemetry Corner Accents */}
      <path d="M 12 20 L 12 12 L 20 12" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.8" />
      <path d="M 108 20 L 108 12 L 100 12" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.8" />
      <path d="M 12 100 L 12 108 L 20 108" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.8" />
      <path d="M 108 100 L 108 108 L 100 108" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
};
