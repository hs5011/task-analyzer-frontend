import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/task-analyzer-frontend/', // <-- CHÚ Ý: đúng tên repo FE
})
