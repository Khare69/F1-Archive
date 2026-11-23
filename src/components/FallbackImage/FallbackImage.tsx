import React, { useState, useEffect } from 'react';
import { ConstructorCrest } from './ConstructorCrest';
import { DriverHelmetAvatar } from './DriverHelmetAvatar';
import { resolveCanonicalTeamId } from './constructorEmblems';
import './FallbackImage.css';

export interface FallbackImageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  accentColor?: string;
  secondaryColor?: string;
  type?: 'team' | 'driver' | 'car' | 'badge';
  variant?: 'team' | 'driver' | 'car' | 'badge';
  teamId?: string;
  driverCode?: string;
  driverNumber?: number | null;
  championships?: number;
  era?: 'vintage' | 'classic' | 'modern';
  lastActiveYear?: number;
  debutYear?: number;
  className?: string;
  isDecorative?: boolean;
}

export const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  fallbackText,
  accentColor = '#00D2FF',
  secondaryColor,
  type = 'badge',
  variant,
  teamId,
  driverCode,
  driverNumber,
  championships,
  era,
  lastActiveYear,
  debutYear,
  className = '',
  isDecorative = false,
  ...props
}) => {
  const effectiveType = variant || type;
  const hasValidSrc = Boolean(src && src.trim().length > 0);

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(hasValidSrc);

  // Reset error & loading when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(Boolean(src && src.trim().length > 0));
  }, [src]);

  // Render the parametric vector graphics fallback
  const renderVectorFallback = () => {
    if (effectiveType === 'driver') {
      return (
        <DriverHelmetAvatar
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          driverNumber={driverNumber}
          driverCode={driverCode || fallbackText}
          championships={championships}
          era={era}
          lastActiveYear={lastActiveYear}
          debutYear={debutYear}
          alt={alt}
          isDecorative={isDecorative}
          className="fallback-vector-svg"
        />
      );
    }

    // Default to Constructor Crest for 'team', 'car', 'badge'
    const resolvedTeamKey = teamId || resolveCanonicalTeamId(fallbackText) || resolveCanonicalTeamId(alt) || fallbackText || alt;
    return (
      <ConstructorCrest
        teamIdOrName={resolvedTeamKey}
        accentColor={accentColor}
        secondaryColor={secondaryColor}
        alt={alt}
        isDecorative={isDecorative}
        className="fallback-vector-svg"
      />
    );
  };

  // Rule 4: If no valid src is provided, immediately render vector component with zero network requests
  if (!hasValidSrc || hasError) {
    return (
      <div
        className={`fallback-vector-container fallback-${effectiveType} ${className}`}
        style={{ '--fallback-color': accentColor } as React.CSSProperties}
        role={isDecorative ? undefined : 'img'}
        aria-label={isDecorative ? undefined : alt}
        aria-hidden={isDecorative ? 'true' : undefined}
      >
        {renderVectorFallback()}
      </div>
    );
  }

  // When src is present, attempt normal load with loading skeleton and error fallback
  return (
    <div
      className={`fallback-image-wrapper ${isLoading ? 'is-loading' : ''} ${className}`}
      style={{ '--fallback-color': accentColor } as React.CSSProperties}
      {...props}
    >
      <img
        src={src!}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <div className="image-skeleton-loader" aria-hidden="true">
          <div className="skeleton-pulse"></div>
        </div>
      )}
    </div>
  );
};
