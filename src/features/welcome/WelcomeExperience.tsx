import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryHUD } from './TelemetryHUD';
import { F1CarAnimation } from './F1CarAnimation';
import { usePreferencesContext } from '../../contexts/UserPreferencesContext';
import './WelcomeExperience.css';

interface WelcomeExperienceProps {
  onComplete: () => void;
}

type Phase = 'init' | 'loading' | 'ready' | 'exit';

export const WelcomeExperience: React.FC<WelcomeExperienceProps> = ({
  onComplete
}) => {
  const {
    hasReducedMotion,
    isFirstVisit,
    isSlowConnection
  } = usePreferencesContext();
  const effectiveReducedMotion = hasReducedMotion || isSlowConnection;
  const [phase, setPhase] = useState<Phase>('init');
  const [progress, setProgress] = useState<number>(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const durationMs = 3200; // 3.2s cinematic load

  const handleFinish = useCallback(() => {
    setPhase('exit');
    setTimeout(() => {
      onComplete();
    }, 800);
  }, [onComplete]);

  // Skip handler (ESC key or skip button)
  const handleSkip = useCallback(() => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }
    setProgress(100);
    handleFinish();
  }, [handleFinish]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Main Animation Loop
  useEffect(() => {
    // If reduced motion or returning visitor, brief splash then exit
    if (effectiveReducedMotion || !isFirstVisit) {
      setPhase('ready');
      const timer = setTimeout(() => {
        handleFinish();
      }, 1200);
      return () => clearTimeout(timer);
    }

    setPhase('loading');

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearT = Math.min(elapsed / durationMs, 1);

      // EaseOutQuad: t * (2 - t)
      const easedT = linearT * (2 - linearT);
      const currentProgress = easedT * 100;
      setProgress(currentProgress);

      if (linearT < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('ready');
        setTimeout(() => {
          handleFinish();
        }, 600);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [effectiveReducedMotion, isFirstVisit, handleFinish]);

  return (
    <div 
      className={`welcome-experience-overlay phase-${phase}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to F1 Archive"
    >
      {/* Perspective Animated Grid Background */}
      <div className="environment-grid"></div>
      <div className="carbon-texture"></div>

      {/* Simplified Fallback for Reduced Motion */}
      {effectiveReducedMotion ? (
        <div className="reduced-motion-fallback">
          <div className="headline welcome-title">F1 // ARCHIVE</div>
          <p className="telemetry">RACE CONTROL ONLINE // LOADING 100%</p>
        </div>
      ) : (
        <>
          {/* Animated 2D F1 Car */}
          <F1CarAnimation progress={progress} />

          {/* Telemetry HUD Overlay */}
          <TelemetryHUD
            progress={progress}
            onSkip={handleSkip}
          />
        </>
      )}
    </div>
  );
};
