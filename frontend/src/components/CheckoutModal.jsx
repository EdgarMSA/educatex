import React, { useState } from 'react';
import axios from 'axios';

const CheckoutModal = ({ course, userPoints, onClose, onEnrollmentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState('');
    const [proofUrl, setProofUrl] = useState(''); // Simulación de input de comprobante
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validación simple
        if (['yape', 'plin', 'card'].includes(paymentMethod) && !proofUrl.trim()) {
            setError('Por favor escribe el código de operación o URL del comprobante.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/enrollments/buy', {
                courseId: course.id,
                paymentMethod,
                paymentProofUrl: proofUrl
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onEnrollmentSuccess(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al procesar la matrícula');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-dark-card w-full max-w-md p-6 rounded-xl border border-primary-indigo shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">Comprar: {course.title}</h2>
                <p className="text-gray-400 mb-6 text-sm">{course.description}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-accent-green font-semibold">Elige método de pago:</p>
                    
                    {/* Opción PUNTOS */}
                    <label className={`block p-3 rounded cursor-pointer border ${paymentMethod === 'points' ? 'border-accent-green bg-gray-800' : 'border-gray-700'}`}>
                        <div className="flex items-center">
                            <input type="radio" name="pay" value="points" onChange={(e) => setPaymentMethod(e.target.value)} />
                            <span className="ml-2 text-white">Canjear Puntos</span>
                        </div>
                        <div className="ml-6 text-sm">
                            Costo: <span className="font-bold text-yellow-400">{course.points_cost} pts</span> 
                            <span className="text-gray-500"> (Tienes: {userPoints})</span>
                        </div>
                    </label>

                    {/* Opción YAPE/PLIN/TARJETA */}
                    {['yape', 'plin', 'card'].map(method => (
                        <label key={method} className={`block p-3 rounded cursor-pointer border ${paymentMethod === method ? 'border-accent-green bg-gray-800' : 'border-gray-700'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input type="radio" name="pay" value={method} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <span className="ml-2 text-white uppercase font-bold">{method}</span>
                                </div>
                                <span className="text-white">S/ {course.price}</span>
                            </div>
                        </label>
                    ))}

                    {/* Input de Comprobante (Solo si es dinero real) */}
                    {['yape', 'plin', 'card'].includes(paymentMethod) && (
                        <div>
                            <label className="block text-gray-400 text-xs mb-1">Código de Operación / Link Comprobante (Simulado)</label>
                            <input 
                                type="text" 
                                className="w-full bg-dark-bg border border-gray-600 rounded p-2 text-white"
                                placeholder="Ej: 12345678"
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                            />
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={loading || !paymentMethod}
                            className="bg-primary-indigo hover:bg-indigo-600 text-white px-6 py-2 rounded font-bold disabled:opacity-50"
                        >
                            {loading ? 'Procesando...' : 'Confirmar Compra'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutModal;