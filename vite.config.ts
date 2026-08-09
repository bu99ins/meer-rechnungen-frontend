/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The frontend calls the backend directly via VITE_API_URL (see .env.development for local dev,
// build-time env for deployments) and relies on the backend CORS policy — no dev proxy needed.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // Scoped to src/**/*.test.{ts,tsx} so Vitest never picks up the existing test/*.test.js files,
    // which import `node:test` directly and are run separately by `node --test` (see package.json).
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    // No globals: true — test files import `describe`/`it`/`expect` explicitly from 'vitest',
    // matching this repo's existing convention of explicit imports (test/*.test.js import from
    // 'node:test'), and avoiding a tsconfig "types" change to declare ambient globals.
    setupFiles: ['./src/test-setup.ts'],
  },
})
