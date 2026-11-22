import React, { useMemo } from 'react';
import './F1CarAnimation.css';

interface F1CarAnimationProps {
  progress: number; // 0 to 100
}

export const F1CarAnimation: React.FC<F1CarAnimationProps> = ({ progress }) => {
  // Speed calculation based on progress: 0 -> 100 by 20% -> 320 by 80% -> 350 by 100%
  const speed = useMemo(() => {
    if (progress < 20) {
      return Math.round((progress / 20) * 100);
    } else if (progress < 80) {
      return Math.round(100 + ((progress - 20) / 60) * 220);
    } else {
      return Math.round(320 + ((progress - 80) / 20) * 30);
    }
  }, [progress]);

  // Generate 25 deterministic speed lines
  const speedLines = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      top: `${(i * 4) + (i % 3) * 2}%`,
      duration: `${0.15 + ((i * 7) % 5) * 0.08}s`,
      delay: `${((i * 13) % 10) * 0.05}s`,
      isFast: i % 4 === 0,
      width: `${60 + (i % 5) * 30}px`
    }));
  }, []);

  const showAeroTrails = progress >= 25 && progress <= 95;
  const showExhaustFlame = progress >= 20 && progress <= 95;

  return (
    <div className="f1-car-anim-container" aria-hidden="true">
      {/* Flying Speed Lines Background */}
      <div className="speed-lines-wrapper">
        {speedLines.map((line) => (
          <div
            key={line.id}
            className={`speed-line ${line.isFast ? 'speed-line-fast' : ''}`}
            style={{
              top: line.top,
              width: line.width,
              animationDuration: line.duration,
              animationDelay: line.delay
            }}
          />
        ))}
      </div>

      {/* Translating Car Wrapper */}
      <div 
        className="car-motion-wrapper"
        style={{
          transform: `translateX(${progress * 1.3}vw)`
        }}
      >
        {/* Telemetry Speed Readout Above Car */}
        <div className="car-telemetry-badge telemetry">
          <span className="telemetry-icon">⚡</span>
          <span>SPEED: <strong>{speed}</strong> KM/H</span>
        </div>

        {/* 2D SVG Formula 1 Car */}
        <svg
          className="anim-f1-svg"
          viewBox="0 0 300 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="animCarBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0E1424" />
              <stop offset="60%" stopColor="#00D2FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00D2FF" />
            </linearGradient>

            <linearGradient id="aeroTrailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D2FF" stopOpacity="0" />
              <stop offset="50%" stopColor="#00D2FF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="flameGrad" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#FF1E1E" />
              <stop offset="60%" stopColor="#FF8000" />
              <stop offset="100%" stopColor="#FFFF00" stopOpacity="0" />
            </linearGradient>

            <filter id="animGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Aero Trails */}
          {showAeroTrails && (
            <g className="aero-trails-group">
              <path
                d="M 50 50 C 20 48, -40 40, -100 35"
                stroke="url(#aeroTrailGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                className="aero-trail-line"
              />
              <path
                d="M 60 70 C 10 72, -30 80, -90 85"
                stroke="url(#aeroTrailGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="aero-trail-line"
              />
            </g>
          )}

          {/* Exhaust Flame */}
          {showExhaustFlame && (
            <path
              d="M 50 62 L 15 58 L 15 66 Z"
              fill="url(#flameGrad)"
              className="exhaust-flame"
            />
          )}

          {/* Car Body Silhouette */}
          <path
            d="M 50 60 L 80 50 L 150 45 L 200 40 L 250 45 L 280 60 Z"
            fill="url(#animCarBody)"
            stroke="#00D2FF"
            strokeWidth="2.5"
            filter="url(#animGlow)"
          />

          {/* Front Wing */}
          <path
            d="M 280 60 L 295 65 L 295 72 L 250 70 Z"
            fill="#00D2FF"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />

          {/* Rear Wing */}
          <path
            d="M 50 60 L 35 38 L 65 38 Z"
            fill="#FF1E1E"
            stroke="#FF1E1E"
            strokeWidth="1.5"
          />

          {/* Halo / Cockpit */}
          <path
            d="M 160 42 L 180 34 L 200 40 Z"
            stroke="#FFFFFF"
            strokeWidth="2"
            fill="none"
          />

          {/* Wheel 1 (Rear) */}
          <g className="wheel-group">
            <circle cx="80" cy="70" r="15" fill="#05070C" stroke="#FF1E1E" strokeWidth="3" />
            <circle cx="80" cy="70" r="6" fill="#00D2FF" />
            <line x1="80" y1="58" x2="80" y2="82" stroke="#FFFFFF" strokeWidth="1.5" className="spoke-line" />
            <line x1="68" y1="70" x2="92" y2="70" stroke="#FFFFFF" strokeWidth="1.5" className="spoke-line" />
          </g>

          {/* Wheel 2 (Front) */}
          <g className="wheel-group">
            <circle cx="230" cy="70" r="15" fill="#05070C" stroke="#FF1E1E" strokeWidth="3" />
            <circle cx="230" cy="70" r="6" fill="#00D2FF" />
            <line x1="230" y1="58" x2="230" y2="82" stroke="#FFFFFF" strokeWidth="1.5" className="spoke-line" />
            <line x1="218" y1="70" x2="242" y2="70" stroke="#FFFFFF" strokeWidth="1.5" className="spoke-line" />
          </g>
        </svg>

        {/* Floor Reflection Under Car */}
        <div className="car-floor-glow"></div>
      </div>
    </div>
  );
};
