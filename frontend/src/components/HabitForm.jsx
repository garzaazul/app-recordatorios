import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function HabitForm() {
    const [phone, setPhone] = useState('');
    const [habit, setHabit] = useState('');
    const [time, setTime] = useState('09:00');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // 1. Registrar/Verificar Usuario
            const userRes = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    whatsapp_number: phone,
                    name: 'Emprendedor Pro'
                })
            });

            if (!userRes.ok) {
                throw new Error('Error al registrar usuario');
            }

            const userData = await userRes.json();

            // 2. Crear el hábito con prioridad alta (Eat the Frog = 3)
            const habitRes = await fetch(`${API_URL}/api/habits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userData.id,
                    name: habit,
                    reminder_time: time,
                    priority: 3
                })
            });

            if (!habitRes.ok) {
                throw new Error('Error al crear hábito');
            }

            setMessage({
                type: 'success',
                text: '¡Hábito vinculado! Recibirás un WhatsApp a la hora programada. 🐸'
            });

            // Limpiar formulario
            setPhone('');
            setHabit('');
            setTime('09:00');
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.message || 'Error de conexión. Intenta de nuevo.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-950 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-emerald-500/20">
                {/* Header */}
                <div className="text-center mb-8">
                    <span className="text-6xl mb-4 block">🐸</span>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Eat the Frog
                    </h1>
                    <p className="text-emerald-400 text-sm">
                        Elimina la procrastinación con recordatorios diarios
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* WhatsApp */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            📱 Tu WhatsApp (con código de país)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: 56912345678"
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    {/* Hábito */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            🎯 ¿Qué tarea vas a dejar de procrastinar?
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Terminar propuesta técnica"
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            value={habit}
                            onChange={(e) => setHabit(e.target.value)}
                            required
                        />
                    </div>

                    {/* Hora */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            ⏰ Hora del recordatorio
                        </label>
                        <input
                            type="time"
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>

                    {/* Mensaje de feedback */}
                    {message.text && (
                        <div
                            className={`p-4 rounded-xl text-sm ${message.type === 'success'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Guardando...
                            </span>
                        ) : (
                            '🚀 Activar Tracker en WhatsApp'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-gray-500 text-xs mt-6">
                    Powered by Meta WhatsApp Business API
                </p>
            </div>
        </div>
    );
}

export default HabitForm;
