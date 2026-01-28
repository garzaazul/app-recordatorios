// src/components/HabitForm.jsx
import React, { useState } from 'react';

const HabitForm = () => {
    const [phone, setPhone] = useState('');
    const [habit, setHabit] = useState('');
    const [time, setTime] = useState('09:00');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // 1. Primero registramos/verificamos al usuario
        const userRes = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ whatsapp_number: phone, name: 'Emprendedor Pro' })
        });
        const userData = await userRes.json();

        // 2. Creamos el hábito con prioridad alta (Eat the Frog)
        await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userData.id,
                name: habit,
                reminder_time: time,
                priority: 3
            })
        });

        alert("¡Hábito vinculado! Recibirás un WhatsApp a la hora programada.");
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Configura tu "Sapo" del Día</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tu WhatsApp (con código de país)</label>
                    <input
                        type="text"
                        placeholder="Ej: 56912345678"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">¿Qué tarea vas a dejar de procrastinar?</label>
                    <input
                        type="text"
                        placeholder="Ej: Terminar propuesta técnica"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        value={habit} onChange={(e) => setHabit(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Hora del recordatorio</label>
                    <input
                        type="time"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        value={time} onChange={(e) => setTime(e.target.value)}
                    />
                </div>
                <button className="w-full bg-green-500 text-white p-3 rounded-lg font-bold hover:bg-green-600 transition">
                    Activar Tracker en WhatsApp
                </button>
            </form>
        </div>
    );
};

export default HabitForm;