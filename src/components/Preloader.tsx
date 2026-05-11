import { useState, useEffect } from 'react';
import { preloaderConfig } from '../config';

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const hasContent = !!preloaderConfig.brandName;
  const [phase, setPhase] = useState<'loading' | 'fading'>('loading');

  useEffect(() => {
    if (!hasContent) {
      onComplete();
      return;
    }
    const fadeTimer = setTimeout(() => setPhase('fading'), 2200);
    const completeTimer = setTimeout(() => onComplete(), 2800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [hasContent, onComplete]);

  if (!hasContent) return null;

  const isFading = phase === 'fading';

  return (
    <div
      // pointer-events-none while fading so taps fall through immediately,
      // even before React unmounts us. Without this, the preloader can sit
      // invisibly on top of the nav for 600ms (or longer on throttled iOS
      // Safari) and swallow the hamburger tap.
      className={`fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center transition-opacity duration-500 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={isFading}
    >
      {/* Logo Icon */}
      <div className="preloader-text mb-6">
        <img
          src="/logo-kopssb.jpeg"
          alt="KOP-SSB"
          className="h-12 w-auto object-contain"
        />
      </div>

      {/* Brand Name */}
      <div className="preloader-text text-center" style={{ animationDelay: '0.2s' }}>
        <h1 className="font-serif text-3xl md:text-4xl text-white tracking-wide mb-2">
          {preloaderConfig.brandName}
        </h1>
        <p className="font-script text-2xl text-gold-400">{preloaderConfig.brandSubname}</p>
      </div>

      {/* Loading Line */}
      <div className="mt-8 w-48 h-px bg-white/10 overflow-hidden">
        <div className="preloader-line h-full bg-gradient-to-r from-gold-500/50 via-gold-500 to-gold-500/50" />
      </div>

      {/* Year */}
      {preloaderConfig.yearText && (
        <p
          className="preloader-text mt-4 text-xs text-white/40 uppercase tracking-[0.3em]"
          style={{ animationDelay: '0.4s' }}
        >
          {preloaderConfig.yearText}
        </p>
      )}
    </div>
  );
}
