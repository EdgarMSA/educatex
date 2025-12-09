import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent-green to-primary-indigo">
          Aprende sin Límites en EDUCATEX
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl">
          La plataforma educativa donde tus puntos valen conocimiento. 
          Cursos de tecnología, diseño y negocios al alcance de un clic.
        </p>
        <div className="flex gap-4">
          <Link 
            to="/courses" 
            className="bg-accent-green text-dark-bg px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition shadow-lg shadow-green-900/50"
          >
            Ver Cursos
          </Link>
          <Link 
            to="/register" 
            className="border border-primary-indigo text-primary-indigo px-8 py-3 rounded-full font-bold text-lg hover:bg-primary-indigo hover:text-white transition"
          >
            Crear Cuenta
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-gray-800">
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-accent-green transition">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-bold mb-2">Progreso Real</h3>
          <p className="text-gray-400">Avanza a tu propio ritmo con nuestro sistema de módulos y videos bajo demanda.</p>
        </div>
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-primary-indigo transition">
          <div className="text-4xl mb-4">💎</div>
          <h3 className="text-xl font-bold mb-2">Gana Puntos</h3>
          <p className="text-gray-400">Completa cursos gratuitos para ganar puntos y canjéalos por cursos premium.</p>
        </div>
        <div className="bg-dark-card p-6 rounded-xl border border-gray-700 hover:border-accent-green transition">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-xl font-bold mb-2">Pagos Flexibles</h3>
          <p className="text-gray-400">Paga fácilmente usando Yape, Plin o Tarjeta con nuestro sistema simulado.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;