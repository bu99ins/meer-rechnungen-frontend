import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import axios from 'axios'

// Configure axios with default settings
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Interim backend edge gate (see backend spec backend-api-edge-gate). When the build is configured with
// VITE_API_GATE_KEY, attach the shared credential to every API request so the gated deployed backend
// admits it. It is unset locally (Vite dev + docker-compose), so this is a no-op there. Removed when
// JWT enforcement replaces the gate.
const apiGateKey = import.meta.env.VITE_API_GATE_KEY;
if (apiGateKey) {
  axios.defaults.headers.common['X-Api-Gate'] = apiGateKey;
}
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
