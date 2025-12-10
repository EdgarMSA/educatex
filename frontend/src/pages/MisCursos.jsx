import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link, useNavigate } from 'react-router-dom';

const MisCursos = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchEnrolledCourses = async () => {
            try {
                const res = await api.get('/profile/courses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(res.data);
            } catch (err) {
                console.error("Error fetching enrolled courses:", err);
                if (err.response && err.response.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEnrolledCourses();
    }, [token, navigate]);

    if (loading) return <div className="text-white text-center mt-10">Cargando tus cursos...</div>;

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Mis Cursos Activos ({courses.length})</h1>
            
            {courses.length === 0 ? (
                <div className="bg-dark-card p-10 rounded-xl text-center border border-gray-700">
                    <p className="text-gray-400 text-lg">Aún no estás matriculado en ningún curso. ¡Explora el catálogo!</p>
                    <Link to="/courses" className="mt-4 inline-block bg-accent-green text-dark-bg px-6 py-2 rounded font-bold">Ver Catálogo</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-dark-card rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-primary-indigo transition">
                            <div className="h-32 overflow-hidden">
                                <img src={course.image_url || 'https://via.placeholder.com/400x200?text=EDUCATEX'} alt={`Imagen de ${course.title}`} className="w-full h-full object-cover"/>
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
                                
                                <div className="flex justify-between items-center mb-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${course.enrollment_status === 'completed' ? 'bg-green-700 text-white' : 'bg-primary-indigo text-white'}`}>
                                        {course.enrollment_status === 'completed' ? 'FINALIZADO ✓' : 'EN CURSO'}
                                    </span>
                                </div>
                                <Link to={`/courses/${course.id}`} className="block w-full text-center bg-primary-indigo py-2 rounded text-white font-semibold hover:bg-opacity-90">
                                    Continuar Lecciones
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisCursos;