import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The frontend calls the backend directly via VITE_API_URL (see .env.development for local dev,
// build-time env for deployments) and relies on the backend CORS policy — no dev proxy needed.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
