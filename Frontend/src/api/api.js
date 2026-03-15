import axios from 'axios';
import { auth } from '../firebase/firebaseConfig';

const API = axios.create({
  // Ensure the prefix is VITE_ and we handle the trailing slash
  baseURL: (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000') + '/api',
});

// DEBUG: This will show in your browser console to verify the URL
console.log("Current API Base URL:", API.defaults.baseURL);

API.interceptors.request.use(async (config) => {
  let user = auth.currentUser;

  // Wait for Firebase to initialize if user is null
  if (!user) {
    user = await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((u) => {
        unsubscribe();
        resolve(u);
      });
      // Safety: stop waiting after 4 seconds
      setTimeout(() => resolve(null), 4000);
    });
  }

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;