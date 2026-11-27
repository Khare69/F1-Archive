import React from 'react';
import './StatCard.css';

interface StatCardProps {
  label: React.ReactNode;
  value: string | number;
  subtext?: string;
  accentColor?: string;
  isPrimary?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  accentColor = '#00D2FF',
  isPrimary = false,
  className = ''
}) => {
  return (
    <div 
      className={`stat-card corner-bracket ${isPrimary ? 'stat-primary' : ''} ${className}`}
      style={{ '--card-accent': accentColor } as React.CSSProperties}
    >
      <span className="stat-label telemetry">{label}</span>
      <span className="stat-value headline" style={{ color: isPrimary ? accentColor : undefined }}>
        {value}
      </span>
      {subtext && <span className="stat-subtext telemetry">{subtext}</span>}
      <div className="stat-glow"></div>
    </div>
  );
};
