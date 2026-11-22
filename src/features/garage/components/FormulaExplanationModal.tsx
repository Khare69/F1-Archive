import React, { useEffect } from 'react';

interface FormulaExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FormulaExplanationModal: React.FC<FormulaExplanationModalProps> = ({
  isOpen,
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="garage-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="formula-modal-title"
    >
      <div
        className="garage-modal-content telemetry-panel corner-bracket"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="garage-modal-header">
          <div className="telemetry-tag-group">
            <span className="telemetry-badge cyan">TELEMETRY ARCHITECTURE</span>
            <span className="telemetry-badge amber">ILLUSTRATIVE MODEL</span>
          </div>
          <button
            type="button"
            className="garage-modal-close"
            onClick={onClose}
            aria-label="Close formula modal"
          >
            ×
          </button>
        </div>

        <h2 id="formula-modal-title" className="headline garage-modal-title">
          SIMULATION MATHEMATICS & <span className="text-gradient-cyan">AERODYNAMICS</span>
        </h2>

        <p className="garage-modal-disclaimer">
          <strong>Notice:</strong> This telemetry engine provides an{' '}
          <span className="highlight-text">Illustrative Physics Model</span> designed for comparative
          analysis and educational visualization. Calculations combine empirical FIA technical regulations
          with deterministic mathematical vectors.
        </p>

        <div className="formula-sections-grid">
          {/* Section 1: Top Speed */}
          <div className="formula-card">
            <h3 className="telemetry formula-card-title">// 01. STRAIGHT-LINE RADAR VELOCITY</h3>
            <div className="formula-equation telemetry">
              V_top = V_base + Δ_aero + Δ_power_unit
            </div>
            <ul className="formula-list">
              <li><strong>Low Downforce:</strong> +8 km/h reduction in induced parasite drag.</li>
              <li><strong>High Downforce:</strong> -9 km/h due to aggressive wing angle-of-attack.</li>
              <li><strong>Overtake Mode:</strong> +6 km/h via MGU-K electrical boost (120 kW).</li>
              <li><strong>Qualifying Mode:</strong> +11 km/h peak deployment &amp; turbine spool.</li>
            </ul>
          </div>

          {/* Section 2: Lateral G-Force */}
          <div className="formula-card">
            <h3 className="telemetry formula-card-title">// 02. CORNERING LATERAL ACCELERATION</h3>
            <div className="formula-equation telemetry">
              G_lat = 4.40G + Δ_aero_load + Δ_tyre_grip
            </div>
            <ul className="formula-list">
              <li><strong>High Downforce Wing:</strong> +0.60G apex adhesion.</li>
              <li><strong>Low Downforce Wing:</strong> -0.40G due to lower venturi tunnel suction.</li>
              <li><strong>Soft Compound (C5):</strong> +0.30G high mechanical surface adhesion.</li>
              <li><strong>Wet Compound:</strong> -0.80G hydroplaning threshold mitigation.</li>
            </ul>
          </div>

          {/* Section 3: Lap Delta vs Record */}
          <div className="formula-card">
            <h3 className="telemetry formula-card-title">// 03. LAP TIME DELTA VS OFFICIAL RECORD</h3>
            <div className="formula-equation telemetry">
              t_lap = max(50.0s, t_record + Δt_circuit + Δt_tyre + Δt_ERS - Driver_Skill + 0.35s)
            </div>
            <ul className="formula-list">
              <li><strong>Track Adaptation:</strong> Low drag yields -0.6s at Monza/Spa/Silverstone; high downforce yields -0.9s at Monaco/Hungaroring.</li>
              <li><strong>Tyre Life &amp; Grip:</strong> Soft (-0.8s), Medium (-0.2s), Hard (+0.5s), Wet (+4.5s).</li>
              <li><strong>Pilot Skill Factor:</strong> Driver skill bonus = (Championships × 0.10s) + (Race Wins × 0.005s).</li>
            </ul>
          </div>
        </div>

        <div className="garage-modal-footer">
          <button type="button" className="f1-btn" onClick={onClose}>
            <span>RETURN TO TELEMETRY BAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
