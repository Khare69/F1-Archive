import React, { useState, useEffect } from 'react';
import './FallbackImage.css';

interface FallbackImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  fallbackText?: string;
  accentColor?: string;
  type?: 'team' | 'driver' | 'car' | 'badge';
  className?: string;
}

export const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  fallbackText,
  accentColor = '#00D2FF',
  type = 'badge',
  className = '',
  ...props
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset error and loading state whenever the image source changes
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  // Extract initials or default fallback text
  const displayText = fallbackText || alt.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (!src || error) {
    return (
      <div 
        className={`fallback-placeholder fallback-${type} ${className}`}
        style={{ '--fallback-color': accentColor } as React.CSSProperties}
        title={alt}
        role="img"
        aria-label={alt}
      >
        <div className="fallback-inner">
          <span className="fallback-text">{displayText}</span>
          <div className="fallback-scanner"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fallback-image-wrapper ${loading ? 'is-loading' : ''} ${className}`}
      style={{ '--fallback-color': accentColor } as React.CSSProperties}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        {...props}
      />
      {loading && (
        <div className="image-skeleton-loader">
          <div className="skeleton-pulse"></div>
        </div>
      )}
    </div>
  );
};
