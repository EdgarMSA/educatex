import React, { useState } from 'react';
import api from '../api/client';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/courses');
      window.location.reload();
    } catch (err) {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-dark-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Ingresar</h2>
        
        {error && <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-center">{error}</div>}
             
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="email" placeholder="Correo" required
            className="w-full p-3 rounded bg-dark-bg border border-gray-600 text-white focus:border-primary-indigo focus:outline-none"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Contraseña" required
            className="w-full p-3 rounded bg-dark-bg border border-gray-600 text-white focus:border-primary-indigo focus:outline-none"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <button className="w-full bg-primary-indigo hover:bg-indigo-600 text-white font-bold py-3 rounded transition">
            INICIAR SESIÓN
          </button>
        </form>
        <br />
        <div className="text-center text-gray-500 mb-6">— O usa tus redes —</div>
        {/* --- BOTONES DE REDES SOCIALES (UI SOLAMENTE) --- */}
        <div className="space-y-3 mb-6">
            <button className="w-full py-2 rounded font-semibold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 transition text-white">
                <span className="font-extrabold text-lg">G</span> Iniciar con Google
            </button>
            <button className="w-full py-2 rounded font-semibold flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 transition text-white">
                <span className="font-extrabold text-lg">f</span> Iniciar con Facebook
            </button>
        </div>

        {/* --- ESTA ES LA PARTE IMPORTANTE --- */}
        <p className="mt-6 text-center text-gray-500">
          ¿No tienes cuenta? <Link to="/register" className="text-accent-green hover:underline ml-1">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;