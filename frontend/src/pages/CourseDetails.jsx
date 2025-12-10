import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // 👈 Importamos Link
import { toast } from 'react-hot-toast';
import api from '../api/client';
import YouTube from 'react-youtube'; 
import CheckoutModal from '../components/CheckoutModal'; 

const CourseDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [activeVideo, setActiveVideo] = useState(null);
    const [showModal, setShowModal] = useState(false);
    
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [isRedirecting, setIsRedirecting] = useState(false);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    // Helper Youtube ID
    const getYouTubeID = (url) => {
        if (!url) return "";
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const fetchCourse = async () => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await api.get(`/courses/${id}`, { headers });
            
            setData(res.data);
            setError(null);

            if(res.data.isEnrolled && res.data.modules.length > 0 && res.data.modules[0].videos.length > 0 && !activeVideo) {
                 setActiveVideo(res.data.modules[0].videos[0]);
            }
        } catch (err) { 
            console.error("Error al cargar curso:", err);        
            
            if (err.response && err.response.status === 401) {
                setIsRedirecting(true);
                toast.error('🔒 Debes iniciar sesión para ver los detalles del curso.', {
                    id: 'auth-error-toast', // ID Único para evitar duplicados
                    duration: 5000,
                    style: {
                        background: '#1E293B',
                        color: '#F87171', 
                        border: '1px solid #4F46E5', 
                    },
                    iconTheme: { primary: '#F87171', secondary: '#1E293B' },
                });
                navigate('/login');
            } else {
                setError('No se pudo cargar el curso. Verifica la conexión del Backend.');
            }
        }
    };

    useEffect(() => { 
        if (!isRedirecting) fetchCourse(); 
    }, [id, isRedirecting]);

    const handleMarkSeen = async () => {
        if (!activeVideo) return;
        try {
            await api.put(`/progress/video/${activeVideo.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourse(); 
        } catch (err) { console.error("Error marcando video"); }
    };

    const opts = {
        height: '100%', width: '100%',
        playerVars: { autoplay: 0, rel: 0 },
    };

    if (error) return <div className="text-red-500 text-center mt-10 p-4 bg-dark-card rounded-lg mx-auto max-w-sm">{error}</div>; 
    if (!data) return <div className="text-white text-center mt-10">Cargando curso...</div>;

    return (
        <div className="container mx-auto px-4 py-6">
            
            {/* === NUEVA CABECERA DE NAVEGACIÓN === */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 border-b border-gray-700 pb-4">
                <Link 
                    to="/mis-cursos" 
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition bg-dark-card px-4 py-2 rounded-lg border border-gray-700 hover:border-primary-indigo w-fit"
                >
                    <span>←</span> 
                    <span className="font-semibold text-sm">Volver a Mis Cursos</span>
                </Link>
                
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                    <span className="text-primary-indigo opacity-80 text-lg">Curso:</span>
                    {data.course.title}
                </h1>
            </div>
            
            {/* ==================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* COLUMNA IZQUIERDA: REPRODUCTOR */}
                <div className="lg:col-span-2">
                    {data.isEnrolled ? (
                        <div className="bg-black aspect-video rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
                            {activeVideo ? (
                                <div className="w-full h-full">
                                    {getYouTubeID(activeVideo.video_url || activeVideo.url) ? (
                                        <YouTube 
                                            videoId={getYouTubeID(activeVideo.video_url || activeVideo.url)} 
                                            opts={opts} 
                                            onEnd={handleMarkSeen}
                                            className="w-full h-full"
                                            iframeClassName="w-full h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-red-400">Video no compatible</div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">Selecciona una lección</div>
                            )}
                        </div>
                    ) : (
                         <div className="bg-gray-900 aspect-video rounded-xl flex flex-col items-center justify-center border border-gray-700 p-8 text-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-primary-indigo/20 to-transparent"></div>
                         <span className="text-6xl mb-4 relative z-10">🔒</span>
                         <h2 className="text-3xl text-white font-bold mb-2 relative z-10">Contenido Exclusivo</h2>
                         <button onClick={() => setShowModal(true)} className="bg-accent-green text-dark-bg px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition shadow-lg shadow-green-900/50 relative z-10">
                             Desbloquear Curso Ahora
                         </button>
                     </div>
                    )}

                    {/* TITULO VIDEO ACTUAL */}
                    <div className="mt-6 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-accent-green mb-1">
                                {activeVideo ? `Lección: ${activeVideo.title}` : "Bienvenido al curso"}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {activeVideo ? "Mira el video completo para marcarlo como visto." : data.course.description}
                            </p>
                        </div>
                        {activeVideo && (
                            <button 
                                onClick={handleMarkSeen}
                                disabled={activeVideo.is_completed}
                                className={`px-4 py-2 rounded font-bold transition flex items-center gap-2 text-sm ${
                                    activeVideo.is_completed 
                                    ? 'bg-green-900/30 text-green-400 border border-green-600 cursor-default' 
                                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                                }`}
                            >
                                {activeVideo.is_completed ? <><span>✓</span> Completado</> : <>Marcar Visto</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* TEMARIO */}
                <div className="bg-dark-card rounded-xl p-6 h-fit border border-gray-800 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Contenido</h3>
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.modules.map(module => (
                            <div key={module.id}>
                                <h4 className="text-primary-indigo font-bold text-xs uppercase mb-3 tracking-wider">{module.title}</h4>
                                <div className="space-y-2">
                                    {module.videos.map(video => (
                                        <div 
                                            key={video.id}
                                            onClick={() => data.isEnrolled && setActiveVideo(video)}
                                            className={`p-3 rounded-lg flex justify-between cursor-pointer transition ${
                                                activeVideo?.id === video.id 
                                                ? 'bg-accent-green text-dark-bg font-bold shadow-md' 
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            } ${!data.isEnrolled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className="text-sm truncate">{video.title}</span>
                                            {video.is_completed && <span>✓</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showModal && (
                <CheckoutModal 
                    course={data.course} userPoints={user.points || 0}
                    onClose={() => setShowModal(false)}
                    onEnrollmentSuccess={(msg) => { 
                        setShowModal(false); 
                        toast.success(msg, { duration: 5000, style: { background: '#1E293B', color: '#10B981', border: '1px solid #4F46E5' } }); 
                        fetchCourse(); 
                    }}
                />
            )}
        </div>
    );
};

export default CourseDetails;