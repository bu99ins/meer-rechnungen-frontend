import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// @testing-library/react's automatic cleanup relies on detecting global test hooks; since this
// config deliberately omits `globals: true` (see vite.config.ts), it must be wired up explicitly,
// or a component rendered in one test leaks into the DOM for the next.
afterEach(() => {
  cleanup();
});
