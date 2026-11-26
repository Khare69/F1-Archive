import React, { useState, useEffect, useRef } from 'react';
import { Share2, Check } from 'lucide-react';

export interface CopyShareLinkButtonProps {
  className?: string;
  label?: string;
  copiedLabel?: string;
}

export const CopyShareLinkButton: React.FC<CopyShareLinkButtonProps> = ({
  className = '',
  label = 'Share View',
  copiedLabel = 'Link Copied',
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Graceful fallback for non-secure / headless browser contexts
    } finally {
      setCopied(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-telemetry font-bold tracking-wider uppercase transition-colors border ${
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
          : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
      } ${className}`}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Share2 className="w-3.5 h-3.5 text-slate-400" />
      )}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
};
