import React, { useState, useEffect } from 'react'; // 👈 Importa useEffect
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    captchaAnswer: '' // 👈 Nuevo campo
  });
  
  // Estado para guardar el SVG y el Token del Captcha
  const [captchaData, setCaptchaData] = useState({ svg: '', token: '' });

  const navigate = useNavigate();

  // --- FUNCIÓN PARA CARGAR EL CAPTCHA ---
  const fetchCaptcha = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/auth/captcha');
        setCaptchaData(res.data);
        // Limpiamos el input del usuario por si acaso
        setFormData(prev => ({ ...prev, captchaAnswer: '' }));
    } catch (err) {
        console.error("Error cargando captcha");
    }
  };

  // Cargar captcha al iniciar la página
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  /* 
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviamos también el token del captcha
      const res = await axios.post('http://localhost:5000/api/auth/register', {
          ...formData,
          captchaToken: captchaData.token 
      });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('¡Registro exitoso! Bienvenido.');
      navigate('/');
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error en el registro');
      fetchCaptcha(); // Si falla, recargamos el captcha para que intente con uno nuevo
    }
  };
  */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Enviamos datos + token del captcha
      const res = await axios.post('http://localhost:5000/api/auth/register', {
          ...formData,
          captchaToken: captchaData.token 
      });
      
      // Guardamos sesión
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // ✅ 1. Mostrar la alerta (Le damos 2 segundos de duración)
      toast.success('¡Registro exitoso! Bienvenido a EDUCATEX.', {
          duration: 1000,
          style: {
              background: '#10B981', // Verde éxito
              color: '#FFFFFF',
              fontWeight: 'bold'
          }
      });

      // ✅ 2. Esperar 2 segundos antes de redirigir para que el usuario VEA la alerta
      setTimeout(() => {
          navigate('/');
          window.location.reload(); // Recarga para actualizar el Navbar
      }, 2000);

    } catch (err) {
      // Si falla, mostramos error y recargamos el captcha
      toast.error(err.response?.data?.message || 'Error en el registro');
      fetchCaptcha(); 
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-dark-card p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Crear Cuenta</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-gray-400 text-sm">Nombre de Usuario</label>
            <input type="text" name="username" placeholder="Tu nombre" className="w-full bg-dark-bg text-white p-3 rounded-lg border border-gray-600 focus:border-primary-indigo outline-none transition" onChange={handleChange} required />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm">Correo Electrónico</label>
            <input type="email" name="email" placeholder="ejemplo@correo.com" className="w-full bg-dark-bg text-white p-3 rounded-lg border border-gray-600 focus:border-primary-indigo outline-none transition" onChange={handleChange} required />
          </div>
          
          <div>
            <label className="text-gray-400 text-sm">Contraseña</label>
            <input type="password" name="password" placeholder="••••••••" className="w-full bg-dark-bg text-white p-3 rounded-lg border border-gray-600 focus:border-primary-indigo outline-none transition" onChange={handleChange} required />
          </div>

          {/* === SECCIÓN DEL CAPTCHA === */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600">
              <label className="text-gray-400 text-xs mb-2 block">Verificación de seguridad</label>
              
              <div className="flex items-center gap-3 mb-3">
                  {/* Renderizamos el SVG que viene del backend */}
                  <div 
                    className="rounded overflow-hidden bg-white"
                    dangerouslySetInnerHTML={{ __html: captchaData.svg }} 
                  />
                  
                  {/* Botón para recargar si no se entiende */}
                  <button 
                    type="button" 
                    onClick={fetchCaptcha}
                    className="text-gray-400 hover:text-white text-xs underline"
                    title="Cambiar imagen"
                  >
                    ↻ Recargar
                  </button>
              </div>

              <input 
                type="text" 
                name="captchaAnswer" 
                placeholder="Resuelve la suma" 
                className="w-full bg-dark-bg text-white p-2 rounded border border-gray-500 focus:border-accent-green outline-none text-center tracking-widest font-bold" 
                value={formData.captchaAnswer}
                onChange={handleChange} 
                required 
                autoComplete="off"
              />
          </div>
          {/* ========================== */}

          <button className="w-full bg-accent-green hover:bg-green-500 text-dark-bg font-bold py-3 rounded-lg transition transform hover:scale-105 shadow-lg shadow-green-900/50">
            Registrarse
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          ¿Ya tienes cuenta? <Link to="/login" className="text-primary-indigo font-bold hover:underline">Ingresa aquí</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;