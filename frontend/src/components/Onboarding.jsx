import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function Onboarding({ phone, onVerified }) {
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);

    const handleVerify = async () => {
        if (!phone) {
            setResult({ type: 'error', message: 'Ingresa tu número de WhatsApp primero.' });
            return;
        }

        setVerifying(true);
        setResult(null);

        try {
            const res = await fetch(`${API_URL}/api/verify-phone/${phone}`);
            const data = await res.json();

            if (data.exists) {
                setResult({ type: 'success', message: data.message, activeHabits: data.activeHabits });
                if (onVerified) onVerified(data);
            } else {
                setResult({ type: 'info', message: data.message });
            }
        } catch (error) {
            setResult({ type: 'error', message: 'Error de conexión. Verifica tu internet.' });
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="mt-8 p-6 bg-gray-800/50 rounded-2xl border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
                📋 Instrucciones de Activación
            </h3>

            {/* Pasos */}
            <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-xl">
                    <span className="text-2xl">1️⃣</span>
                    <div>
                        <p className="text-white font-medium">Agrega el número de FocusBot</p>
                        <p className="text-gray-400 text-sm">Esto evita que WhatsApp marque los mensajes como spam.</p>
                        <p className="text-emerald-400 font-mono text-sm mt-1">+56 9 XXXX XXXX</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-xl">
                    <span className="text-2xl">2️⃣</span>
                    <div>
                        <p className="text-white font-medium">Envía la palabra "HOLA"</p>
                        <p className="text-gray-400 text-sm">Esto activa la sesión inicial con el bot.</p>
                    </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-700/30 rounded-xl">
                    <span className="text-2xl">3️⃣</span>
                    <div>
                        <p className="text-white font-medium">Responde a tus recordatorios</p>
                        <p className="text-gray-400 text-sm">Usa estos comandos simples:</p>
                        <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs">1 = Listo</span>
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">2 = Después</span>
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">3 = Hoy no</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón de verificación */}
            <button
                onClick={handleVerify}
                disabled={verifying}
                className="w-full py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {verifying ? (
                    <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verificando...
                    </>
                ) : (
                    <>
                        🔍 Probar Conexión
                    </>
                )}
            </button>

            {/* Resultado de verificación */}
            {result && (
                <div
                    className={`mt-4 p-4 rounded-xl text-sm ${result.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : result.type === 'info'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                >
                    {result.message}
                </div>
            )}
        </div>
    );
}

export default Onboarding;
