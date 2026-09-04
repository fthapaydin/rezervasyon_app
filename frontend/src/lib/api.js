export const API_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname.includes('fizyotim.com')
    ? 'https://fizyotim.com/api'
    : 'http://localhost:5001/api');
