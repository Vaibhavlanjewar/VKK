import axios from 'axios';
import { auth } from '../firebase/firebaseConfig';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

API.interceptors.request.use(async (config) => {
  const user = auth.currentUser; // If auth is broken, this crashes the app
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;