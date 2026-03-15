import axios from 'axios';
import { auth } from '../firebase/firebaseConfig';

const API = axios.create({
  // Cleanly handle the URL formatting
  baseURL: (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000') + '/api',
});

API.interceptors.request.use(async (config) => {
  // 1. Check if user is already loaded
  let user = auth.currentUser;

  // 2. If not loaded (common on refresh), wait for it
  if (!user) {
    user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
    });
  }

  // 3. Attach Token
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;