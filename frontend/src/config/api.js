// In development, we force use of the Vite Proxy at http://127.0.0.1:5173/api
// In production, we use the VITE_API_URL environment variable mapped in Render
export const API_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_URL || '') 
  : ''; 
