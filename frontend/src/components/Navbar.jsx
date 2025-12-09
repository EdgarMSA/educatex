import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Si user.points es null/undefined, mostramos 0
  const pointsDisplay = user.points !== undefined ? `${user.points} pts` : '0 pts';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav className="bg-dark-card border-b border-primary-indigo fixed w-full z-50 top-0 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          <Link to="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-primary-indigo">
            EDUCATEX
          </Link>
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/courses" className="hover:text-primary-indigo transition">Cursos</Link>
            {token ? (
              <>
                <Link to="/mis-cursos" className="hover:text-primary-indigo transition">Mis Cursos</Link>
                {user.role === 'admin' && (
                   <Link to="/admin" className="text-yellow-400 border border-yellow-400 px-3 py-1 rounded text-sm font-bold">Panel Admin</Link>
                )}
                <Link to="/profile" className="hover:text-white">Perfil ({pointsDisplay})</Link>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-bold">Salir</button>
              </>
            ) : (
              <Link to="/login" className="bg-primary-indigo px-4 py-2 rounded text-white font-bold">Ingresar</Link>
            )}
          </div>

          {/* Mobile Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-dark-card px-4 pt-2 pb-4 space-y-3 border-t border-gray-700">
          <Link to="/courses" className="block py-2 text-gray-300" onClick={() => setIsOpen(false)}>Cursos</Link>
          {token ? (
              <>
                <Link to="/mis-cursos" className="block py-2 text-primary-indigo font-bold" onClick={() => setIsOpen(false)}>Mis Cursos</Link>

                {user.role === 'admin' && <Link to="/admin" className="block py-2 text-yellow-400" onClick={() => setIsOpen(false)}>Panel Admin</Link>}
                <Link to="/profile" className="block py-2 text-gray-300" onClick={() => setIsOpen(false)}>Mi Perfil</Link>
                <button onClick={handleLogout} className="block w-full text-left py-2 text-red-400 font-bold">Cerrar Sesión</button>
              </>
            ) : (
              <Link to="/login" className="block py-2 text-white font-bold" onClick={() => setIsOpen(false)}>Ingresar</Link>
            )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;