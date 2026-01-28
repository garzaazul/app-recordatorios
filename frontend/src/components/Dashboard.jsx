import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function Dashboard({ whatsappNumber }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!whatsappNumber) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_URL}/api/stats/${whatsappNumber}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setStats(null);
                    } else {
                        throw new Error('Error al cargar estadísticas');
                    }
                } else {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [whatsappNumber]);

    // Estado de carga
    if (loading) {
        return (
            <div className="mt-8 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
                <div className="flex items-center justify-center gap-3 text-gray-400">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Cargando tu panel de disciplina...</span>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="mt-8 p-6 bg-red-500/10 rounded-2xl border border-red-500/30 text-red-400 text-center">
                {error}
            </div>
        );
    }

    // Estado vacío (usuario nuevo o sin datos)
    if (!stats || (stats.currentStreak === 0 && stats.frogsDefeated === 0)) {
        return (
            <div className="mt-8 p-8 bg-gray-800/50 rounded-2xl border border-gray-700 text-center">
                <span className="text-5xl block mb-4">🌱</span>
                <h3 className="text-xl font-bold text-white mb-2">Tu Panel de Disciplina</h3>
                <p className="text-gray-400">
                    Comienza hoy tu primera racha. ¡Responde "1" a tu primer recordatorio!
                </p>
            </div>
        );
    }

    // Dashboard con datos
    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
                🎯 Tu Panel de Disciplina
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Racha de Fuego */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-5 rounded-2xl border border-orange-500/30 text-center">
                    <span className="text-4xl block mb-2">🔥</span>
                    <p className="text-3xl font-bold text-white">{stats.currentStreak}</p>
                    <p className="text-orange-300 text-sm">días seguidos</p>
                </div>

                {/* Eficacia Semanal */}
                <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-5 rounded-2xl border border-emerald-500/30 text-center">
                    <span className="text-4xl block mb-2">📊</span>
                    <p className="text-3xl font-bold text-white">{stats.successRate}%</p>
                    <p className="text-emerald-300 text-sm">eficacia semanal</p>
                </div>

                {/* Sapos Vencidos */}
                <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 p-5 rounded-2xl border border-green-500/30 text-center">
                    <span className="text-4xl block mb-2">🐸</span>
                    <p className="text-3xl font-bold text-white">{stats.frogsDefeated}</p>
                    <p className="text-green-300 text-sm">sapos vencidos</p>
                </div>
            </div>

            {/* Contador de Procrastinación (sutil) */}
            {stats.totalDelays > 0 && (
                <div className="mt-4 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-center">
                    <p className="text-yellow-400 text-sm">
                        ⚠️ Has pospuesto {stats.totalDelays} veces. ¡Reduce ese número!
                    </p>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
