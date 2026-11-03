import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Expose MAPBOX_ACCESS_TOKEN (public pk.* token) from the shell, alongside
// any VITE_* vars in .env files. Never put a secret sk.* token here.
export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'MAPBOX_ACCESS_TOKEN'],
})
