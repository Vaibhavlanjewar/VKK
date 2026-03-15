import axios from 'axios';
import { auth } from '../firebase/firebaseConfig';

const API = axios.create({
  // FIX 1: Use the Environment Variable for your live Vercel backend
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:5000/api',
});

API.interceptors.request.use(async (config) => {
  // FIX 2: Wait for Firebase to finish loading the user
  // This helps prevent sending a 'null' token on first load
  const user = auth.currentUser || await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      unsubscribe();
      resolve(u);
    });
  });

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
