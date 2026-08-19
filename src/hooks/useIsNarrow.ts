import { useSyncExternalStore } from 'react';

// The single narrow/wide breakpoint for the whole app (header menu + list card layouts). Recorded
// in docs/features-and-workflows.md once the narrow-viewport work lands (spec requirement 22).
// 767.98px, not 768px, so the query and Tailwind's `md:` prefix (which activates AT 768px) never
// both claim the same 768.0px pixel.
export const NARROW_BREAKPOINT_QUERY = '(max-width: 767.98px)';

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia(NARROW_BREAKPOINT_QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(NARROW_BREAKPOINT_QUERY).matches;
}

/**
 * True below the app's narrow-viewport breakpoint. Backed by matchMedia (not a resize listener)
 * so it fires only when the query's truth value actually flips, and useSyncExternalStore keeps it
 * safe to read during render — callers use it to mount exactly one of two layouts, never both.
 */
export const useIsNarrow = (): boolean => useSyncExternalStore(subscribe, getSnapshot, () => false);
