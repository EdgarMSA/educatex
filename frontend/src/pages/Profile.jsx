import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(''); // Para mostrar errores en pantalla
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Verificar si hay token
    const token = localStorage.getItem('token');
    if (!token) {
        // Si no hay token, ahí sí mandamos al login
        navigate('/login');
        return;
    }

    // 2. Intentar obtener el perfil
    api.get('/profile', {
      headers: { Authorization: `Bearer ${token}` } // IMPORTANTE: El espacio después de Bearer
    })
    .then(res => {
        setUser(res.data);
    })
    .catch(err => {
      // 3. SI FALLA: No te expulso, te muestro el error para que sepamos qué pasa
      console.error("Error obteniendo perfil:", err);
      if (err.response && err.response.status === 401) {
          setError("Tu sesión ha expirado o el token es inválido. Por favor, haz login de nuevo.");
      } else {
          setError(`Error del servidor: ${err.message}`);
      }
    });
  }, [navigate]);

  const handleChangePass = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.put('/profile/password', passData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Contraseña actualizada con éxito');
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  // Mostrar mensaje de error si algo falló
  if (error) return (
      <div className="text-center mt-20">
          <h2 className="text-red-500 text-xl font-bold">Hubo un problema</h2>
          <p className="text-white mb-4">{error}</p>
          <button onClick={() => { localStorage.removeItem('token'); navigate('/login'); }} className="bg-primary-indigo text-white px-4 py-2 rounded">
              Volver al Login
          </button>
      </div>
  );

  if (!user) return <div className="text-white text-center mt-10">Cargando perfil...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <div className="bg-dark-card p-8 rounded-xl border border-gray-700 shadow-2xl flex flex-col md:flex-row gap-8">
        
        {/* INFO USUARIO */}
        <div className="md:w-1/3 text-center border-b md:border-b-0 md:border-r border-gray-700 pb-6 md:pb-0 md:pr-6">
          <div className="w-24 h-24 bg-primary-indigo rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white mb-4">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white">{user.username}</h2>
          <p className="text-gray-400">{user.email}</p>
          <div className="mt-6 bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Mis Puntos</p>
            <p className="text-3xl font-bold text-accent-green">{user.points}</p>
          </div>
          <div className="mt-2 bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Rol</p>
            <p className="text-xl font-bold text-white capitalize">{user.role}</p>
          </div>
        </div>

        {/* CAMBIAR PASSWORD */}
        <div className="md:w-2/3">
          <h3 className="text-xl font-bold text-white mb-6">Seguridad</h3>
          <form onSubmit={handleChangePass} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Contraseña Actual</label>
              <input 
                type="password" 
                className="w-full mt-1 p-3 rounded bg-dark-bg border border-gray-600 text-white"
                value={passData.currentPassword}
                onChange={e => setPassData({...passData, currentPassword: e.target.value})}
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Nueva Contraseña</label>
              <input 
                type="password" 
                className="w-full mt-1 p-3 rounded bg-dark-bg border border-gray-600 text-white"
                value={passData.newPassword}
                onChange={e => setPassData({...passData, newPassword: e.target.value})}
              />
            </div>
            <button className="bg-accent-green text-dark-bg font-bold py-2 px-6 rounded hover:bg-opacity-90 transition">
              Actualizar Contraseña
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;