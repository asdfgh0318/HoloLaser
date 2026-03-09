import { useCallback, useEffect, useRef } from 'react';

export function useAnnounce() {
  const regionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);
    regionRef.current = region;

    return () => {
      document.body.removeChild(region);
    };
  }, []);

  const announce = useCallback((message: string) => {
    if (regionRef.current) {
      regionRef.current.textContent = '';
      // Force re-announcement by clearing then setting
      requestAnimationFrame(() => {
        if (regionRef.current) {
          regionRef.current.textContent = message;
        }
      });
    }
  }, []);

  return announce;
}
