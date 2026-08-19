import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// @testing-library/react's automatic cleanup relies on detecting global test hooks; since this
// config deliberately omits `globals: true` (see vite.config.ts), it must be wired up explicitly,
// or a component rendered in one test leaks into the DOM for the next.
afterEach(() => {
  cleanup();
});

// jsdom has no layout engine, so window.matchMedia is undefined by default. useIsNarrow (and
// anything built on it) needs a real matchMedia stand-in: one that evaluates `max-width` queries
// against a settable "current width" and notifies listeners on change, the same contract the
// browser gives addEventListener('change', ...). Defaults to wide (1024px) so every existing test
// written before the narrow-viewport work — which renders and asserts on the wide table layout —
// keeps passing unchanged.
type Listener = () => void;
const listenersByQuery = new Map<string, Set<Listener>>();
let currentWidth = 1024;

function matchesQuery(query: string, width: number): boolean {
  const maxWidth = query.match(/max-width:\s*([\d.]+)px/);
  if (maxWidth) return width <= Number(maxWidth[1]);
  const minWidth = query.match(/min-width:\s*([\d.]+)px/);
  if (minWidth) return width >= Number(minWidth[1]);
  return false;
}

window.matchMedia = ((query: string): MediaQueryList => {
  const mql = {
    get matches() {
      return matchesQuery(query, currentWidth);
    },
    media: query,
    onchange: null,
    addEventListener: (_type: 'change', listener: Listener) => {
      if (!listenersByQuery.has(query)) listenersByQuery.set(query, new Set());
      listenersByQuery.get(query)!.add(listener);
    },
    removeEventListener: (_type: 'change', listener: Listener) => {
      listenersByQuery.get(query)?.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  return mql;
}) as typeof window.matchMedia;

/** Test helper: move the simulated viewport width and notify every live matchMedia listener. */
export function setViewportWidth(width: number): void {
  currentWidth = width;
  for (const listeners of listenersByQuery.values()) {
    for (const listener of listeners) listener();
  }
}

afterEach(() => {
  currentWidth = 1024;
});
