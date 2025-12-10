// frontend/src/api/client.js
import axios from 'axios';

// Siempre usa el mismo origen donde se sirve la app (http://34.229.119.99)
const api = axios.create({
  baseURL: window.location.origin + '/api',
  // baseURL quedará como: "http://34.229.119.99/api"
});

export default api;
