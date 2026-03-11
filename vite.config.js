import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration pour faire tourner React et Tailwind
export default defineConfig({
  plugins: [react()],
})
