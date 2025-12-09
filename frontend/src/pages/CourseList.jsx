import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/courses')
      .then(res => setCourses(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold text-white mb-6">Cursos Disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-dark-card rounded-lg overflow-hidden shadow-lg border border-gray-700 hover:border-accent-green transition">
            <div className="p-6">
                <div className="h-32 overflow-hidden">
                    <img 
                        src={course.image_url || 'https://via.placeholder.com/400x200?text=EDUCATEX'} 
                        alt={`Imagen de ${course.title}`} 
                        className="w-full h-full object-cover"
                    />
                </div>
              <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <span className={`px-2 py-1 rounded text-xs ${course.is_paid ? 'bg-indigo-900 text-indigo-200' : 'bg-green-900 text-green-200'}`}>
                  {course.is_paid ? `S/ ${course.price}` : 'GRATIS'}
                </span>
                <span className="text-yellow-500 text-xs font-bold">💎 {course.points_cost} Pts</span>
              </div>

              <Link to={`/courses/${course.id}`} className="block w-full text-center bg-primary-indigo py-2 rounded text-white font-semibold hover:bg-opacity-90">
                Ver Detalles
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseList;