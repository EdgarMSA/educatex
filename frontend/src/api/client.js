// frontend/src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // esto usa el MISMO dominio/IP donde se sirve el frontend
});

export default api;
