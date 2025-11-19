import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configuración opcional para asegurar que Vite funcione correctamente con la API_URL
  server: {
    // Si necesitas que Vite use otro puerto para evitar conflictos (ej: si tienes otra cosa en 5173)
    // port: 3000, 
    // Proxy (solo si tu API no estuviera en localhost:8000, pero la tuya sí lo está)
  }
})