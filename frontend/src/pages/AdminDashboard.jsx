import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
    // ESTADOS GLOBALES
    const [courses, setCourses] = useState([]);
    const [pendingPayments, setPendingPayments] = useState([]);
    
    // ESTADO PARA FORMULARIO DE CURSO (SIRVE PARA CREAR Y EDITAR)
    // Si id es null = Crear. Si tiene id = Editar.
    const [courseForm, setCourseForm] = useState({ 
        id: null, 
        title: '', description: '', is_paid: false, price: 0, points_cost: 0, image_url: '', points_reward: 10 
    });

    // ESTADOS PARA GESTIÓN DE CONTENIDO (VIDEOS/MÓDULOS)
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseDetails, setCourseDetails] = useState(null);
    const [newModule, setNewModule] = useState({ title: '' });
    const [newVideo, setNewVideo] = useState({ title: '', video_url: '', module_id: null });
    const [editingVideo, setEditingVideo] = useState(null);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // --- 1. CARGA INICIAL DE DATOS ---
    const fetchData = async () => {
        try {
            const resCourses = await api.get('/courses');
            setCourses(resCourses.data);
            
            const resPayments = await api.get('/enrollments/pending', config);
            setPendingPayments(resPayments.data);
        } catch (err) { 
            console.error(err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                toast.error("❌ Acceso Denegado. Rol no autorizado.");
            }
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- 2. GESTIÓN DE CURSOS (CREAR / EDITAR / ELIMINAR) ---

    // Enviar Formulario (Detecta si es Crear o Actualizar)
    const handleSubmitCourse = async (e) => {
        e.preventDefault();
        try {
            if (courseForm.id) {
                // MODO EDICIÓN (PUT)
                await api.put(`/courses/${courseForm.id}`, courseForm, config);
                toast.success('Curso actualizado correctamente');
            } else {
                // MODO CREACIÓN (POST)
                await api.post('/courses', courseForm, config);
                toast.success('🚀 Curso creado con éxito!');
            }
            // Limpiar y recargar
            setCourseForm({ id: null, title: '', description: '', is_paid: false, price: 0, points_cost: 0, image_url: '', points_reward: 10 });
            fetchData();
        } catch (err) { toast.error('Error al guardar el curso'); }
    };

    // Cargar datos en el formulario para editar
    const handleEditCourseClick = (course) => {
        setCourseForm({
            id: course.id,
            title: course.title,
            description: course.description,
            is_paid: course.is_paid,
            price: course.price || 0,
            points_cost: course.points_cost || 0,
            image_url: course.image_url || '',
            points_reward: course.points_reward || 10
        });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir para ver el formulario
    };

    // Eliminar Curso
    const handleDeleteCourse = async (id) => {
        if(!window.confirm("¿ESTÁS SEGURO? Se borrarán todos los módulos y videos de este curso.")) return;
        try {
            await api.delete(`/courses/${id}`, config);
            toast.success('Curso eliminado');
            fetchData();
            if(selectedCourse?.id === id) { setSelectedCourse(null); setCourseDetails(null); }
        } catch (err) { toast.error('No se pudo eliminar.'); }
    };

    // Cancelar Edición
    const cancelEdit = () => {
        setCourseForm({ id: null, title: '', description: '', is_paid: false, price: 0, points_cost: 0, image_url: '', points_reward: 10 });
    };

    // --- 3. GESTIÓN DE PAGOS (APROBACIÓN) ---
    const handleApprovePayment = (enrollmentId) => {
        toast((t) => (
            <div className="flex flex-col items-center gap-2">
                <span className="font-bold text-gray-800 text-sm">¿Aprobar pago y dar acceso?</span>
                <div className="flex gap-2 mt-1">
                    <button className="bg-gray-400 text-white px-3 py-1 rounded text-xs" onClick={() => toast.dismiss(t.id)}>Cancelar</button>
                    <button className="bg-accent-green text-dark-bg px-3 py-1 rounded text-xs font-bold" onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                            const loading = toast.loading("Procesando...");
                            await api.put(`/enrollments/approve/${enrollmentId}`, {}, config);
                            toast.dismiss(loading);
                            toast.success("✅ Acceso concedido.");
                            fetchData();
                        } catch (err) { toast.dismiss(); toast.error("Error al aprobar"); }
                    }}>Sí, Aprobar</button>
                </div>
            </div>
        ), { duration: 5000, style: { border: '1px solid #EAB308', padding: '16px' } });
    };

    // --- 4. GESTIÓN DE CONTENIDO (MÓDULOS Y VIDEOS) ---
    
    const handleManageCourse = async (course) => {
        setSelectedCourse(course);
        setEditingVideo(null);
        try {
            const res = await api.get(`/courses/${course.id}`, config);
            setCourseDetails(res.data);
            setTimeout(() => window.scrollTo({ top: 800, behavior: 'smooth' }), 100);
        } catch (err) { console.error(err); }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${selectedCourse.id}/modules`, { title: newModule.title, order: courseDetails.modules.length + 1 }, config);
            setNewModule({ title: '' });
            toast.success('Módulo agregado');
            handleManageCourse(selectedCourse);
        } catch (err) { toast.error('Error creando módulo'); }
    };

    const handleAddVideo = async (e, moduleId) => {
        e.preventDefault();
        try {
            await api.post(`/modules/${moduleId}/videos`, { title: newVideo.title, video_url: newVideo.video_url, order: 1 }, config);
            setNewVideo({ title: '', video_url: '', module_id: null });
            toast.success('Video agregado');
            handleManageCourse(selectedCourse);
        } catch (err) { toast.error('Error agregando video'); }
    };

    const handleEditVideoClick = (video) => {
        setEditingVideo({ id: video.id, title: video.title, video_url: video.video_url });
    };

    const handleUpdateVideo = async (e) => {
        e.preventDefault();
        if (!editingVideo) return;
        try {
            await api.put(`/videos/${editingVideo.id}`, { title: editingVideo.title, video_url: editingVideo.video_url }, config);
            toast.success('Video actualizado');
            setEditingVideo(null);
            handleManageCourse(selectedCourse);
        } catch (err) { 
            const msg = err.response?.data?.message || 'Error al actualizar';
            toast.error(msg); 
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (!window.confirm("¿Eliminar video irreversiblemente?")) return;
        try {
            await api.delete(`/videos/${videoId}`, config);
            toast.success('Video eliminado');
            handleManageCourse(selectedCourse);
        } catch (err) { toast.error('Error al eliminar'); }
    };

    // --- 5. RENDERIZADO: VISTA DE GESTIÓN DE VIDEOS (DETALLE) ---
    if (selectedCourse && courseDetails) {
        return (
            <div className="container mx-auto p-4">
                <button onClick={() => { setSelectedCourse(null); setCourseDetails(null); }} className="mb-4 text-gray-400 hover:text-white">← Volver al Panel</button>
                <h1 className="text-3xl font-bold text-white mb-6">Gestionando Contenido: {selectedCourse.title}</h1>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Crear Módulo */}
                    <div className="lg:col-span-1">
                        <div className="bg-dark-card p-6 rounded-xl border border-primary-indigo sticky top-24">
                            <h3 className="text-xl font-bold text-accent-green mb-4">Nuevo Módulo</h3>
                            <form onSubmit={handleAddModule}>
                                <input type="text" placeholder="Nombre Módulo" className="w-full p-3 mb-4 rounded bg-gray-800 border border-gray-600 text-white" value={newModule.title} onChange={e => setNewModule({...newModule, title: e.target.value})} required />
                                <button className="w-full bg-accent-green text-dark-bg font-bold py-2 rounded">+ Agregar</button>
                            </form>
                        </div>
                    </div>

                    {/* Lista de Módulos y Videos */}
                    <div className="lg:col-span-2 space-y-6">
                        {courseDetails.modules.length === 0 && <p className="text-gray-500 text-center italic">No hay módulos aún.</p>}
                        {courseDetails.modules.map((module) => (
                            <div key={module.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                                <h3 className="text-xl font-bold text-white border-b border-gray-600 pb-2 mb-4">📂 {module.title}</h3>
                                <div className="space-y-3 mb-6">
                                    {module.videos.map(vid => (
                                        <div key={vid.id} className="p-2 rounded flex justify-between items-center bg-dark-bg border border-gray-700">
                                            {editingVideo?.id === vid.id ? (
                                                <form onSubmit={handleUpdateVideo} className="flex items-center gap-2 w-full">
                                                    <input type="text" className="p-1 rounded bg-gray-700 text-white text-sm w-1/3" value={editingVideo.title} onChange={e => setEditingVideo({...editingVideo, title: e.target.value})} />
                                                    <input type="text" className="p-1 rounded bg-gray-700 text-white text-sm w-1/3" value={editingVideo.video_url} onChange={e => setEditingVideo({...editingVideo, video_url: e.target.value})} />
                                                    <button type="submit" className="bg-green-600 text-white text-xs px-2 py-1 rounded">Ok</button>
                                                    <button type="button" onClick={() => setEditingVideo(null)} className="bg-gray-500 text-white text-xs px-2 py-1 rounded">X</button>
                                                </form>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-300 w-full">
                                                    <span>🎥 {vid.title}</span>
                                                    <div className="flex-grow"></div>
                                                    <button onClick={() => handleEditVideoClick(vid)} className="text-yellow-500 hover:text-yellow-400">✏️</button>
                                                    <button onClick={() => handleDeleteVideo(vid.id)} className="text-red-500 hover:text-red-400 ml-2">🗑️</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {!editingVideo && (
                                    <form onSubmit={(e) => handleAddVideo(e, module.id)} className="flex gap-2 border-t border-gray-700 pt-4">
                                        <input type="text" placeholder="Título Video" required className="p-2 rounded bg-gray-700 text-white text-sm w-1/3" value={newVideo.module_id === module.id ? newVideo.title : ''} onChange={e => setNewVideo({...newVideo, title: e.target.value, module_id: module.id})} />
                                        <input type="text" placeholder="URL Youtube" required className="p-2 rounded bg-gray-700 text-white text-sm w-1/3" value={newVideo.module_id === module.id ? newVideo.video_url : ''} onChange={e => setNewVideo({...newVideo, video_url: e.target.value, module_id: module.id})} />
                                        <button className="bg-primary-indigo text-white text-sm px-4 rounded hover:bg-indigo-600">Guardar</button>
                                    </form>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- 6. RENDERIZADO: DASHBOARD PRINCIPAL (LISTAS) ---
    return (
        <div className="container mx-auto p-4 space-y-8">
            <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>

            {/* SECCIÓN PAGOS */}
            <div className="bg-dark-card p-6 rounded-xl border border-yellow-500 shadow-lg shadow-yellow-900/20">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    💰 Solicitudes de Pago <span className="text-sm bg-yellow-400 text-black px-2 py-1 rounded-full">{pendingPayments.length}</span>
                </h2>
                {pendingPayments.length === 0 ? <p className="text-gray-400 italic">No hay pagos pendientes.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingPayments.map(p => (
                            <div key={p.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <h3 className="font-bold text-white">{p.username}</h3>
                                <p className="text-sm text-gray-400">📧 {p.email}</p>
                                <div className="my-2 border-l-2 border-accent-green pl-2"><p className="text-xs text-gray-400">Curso:</p><p className="text-sm text-white font-bold">{p.course_title}</p></div>
                                <p className="text-sm text-white">💵 {p.payment_method} (S/ {p.price})</p>
                                <div className="bg-dark-bg p-2 rounded my-2 text-xs font-mono text-gray-300 break-all">{p.proof_url}</div>
                                <button onClick={() => handleApprovePayment(p.id)} className="w-full bg-accent-green text-dark-bg font-bold py-2 rounded hover:bg-green-500">✅ Aprobar</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SECCIÓN FORMULARIO CURSO (CREAR / EDITAR) */}
                <div className="bg-dark-card p-6 rounded-xl border border-primary-indigo h-fit sticky top-24">
                    <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
                        <span className={courseForm.id ? "text-yellow-400" : "text-accent-green"}>{courseForm.id ? "✏️ Editando Curso" : "✨ Crear Nuevo Curso"}</span>
                        {courseForm.id && <button onClick={cancelEdit} className="text-xs text-gray-400 underline">Cancelar</button>}
                    </h2>
                    <form onSubmit={handleSubmitCourse} className="space-y-4">
                        <input type="text" placeholder="Título" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" value={courseForm.title} onChange={e => setCourseForm({...courseForm, title: e.target.value})} required />
                        <textarea placeholder="Descripción" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} required />
                        <input type="text" placeholder="URL Imagen" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" value={courseForm.image_url} onChange={e => setCourseForm({...courseForm, image_url: e.target.value})} />
                        
                        <div className="flex gap-4">
                            <div className="w-1/2">
                                <label className="text-xs text-gray-400">Puntos Premio</label>
                                <input type="number" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600" value={courseForm.points_reward} onChange={e => setCourseForm({...courseForm, points_reward: e.target.value})} />
                            </div>
                            <div className="w-1/2 flex items-center pt-4">
                                <label className="flex items-center gap-2 text-white cursor-pointer"><input type="checkbox" checked={courseForm.is_paid} onChange={e => setCourseForm({...courseForm, is_paid: e.target.checked})} /> ¿Es de Pago?</label>
                            </div>
                        </div>

                        {courseForm.is_paid && (
                            <div className="grid grid-cols-2 gap-2 bg-gray-800 p-2 rounded border border-gray-700">
                                <input type="number" placeholder="Precio S/" className="p-2 bg-dark-bg text-white rounded border border-gray-600" value={courseForm.price} onChange={e => setCourseForm({...courseForm, price: e.target.value})} />
                                <input type="number" placeholder="Costo Puntos" className="p-2 bg-dark-bg text-white rounded border border-gray-600" value={courseForm.points_cost} onChange={e => setCourseForm({...courseForm, points_cost: e.target.value})} />
                            </div>
                        )}
                        <button className={`w-full font-bold py-2 rounded transition ${courseForm.id ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-primary-indigo hover:bg-indigo-600 text-white'}`}>{courseForm.id ? 'Actualizar Curso' : 'Guardar Curso'}</button>
                    </form>
                </div>

                {/* SECCIÓN LISTA DE CURSOS */}
                <div className="bg-dark-card p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4">Mis Cursos ({courses.length})</h2>
                    <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {courses.map(course => (
                            <div key={course.id} className={`p-4 rounded border transition flex flex-col gap-3 ${courseForm.id === course.id ? 'bg-indigo-900/30 border-yellow-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{course.title}</h3>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded ${course.is_paid ? 'bg-indigo-900 text-indigo-200' : 'bg-green-900 text-green-200'}`}>{course.is_paid ? 'PREMIUM' : 'GRATIS'}</span>
                                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">🎁 {course.points_reward} pts</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditCourseClick(course)} className="bg-gray-700 hover:bg-yellow-600 text-white p-2 rounded transition" title="Editar">✏️</button>
                                        <button onClick={() => handleDeleteCourse(course.id)} className="bg-gray-700 hover:bg-red-600 text-white p-2 rounded transition" title="Eliminar">🗑️</button>
                                    </div>
                                </div>
                                <button onClick={() => handleManageCourse(course)} className="w-full bg-accent-green text-dark-bg text-sm font-bold py-2 rounded hover:bg-green-400 transition">Gestionar Videos ➜</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;