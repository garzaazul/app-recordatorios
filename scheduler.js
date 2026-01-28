require('dotenv').config();
const cron = require('node-cron');
const pool = require('./db');
const { sendWhatsAppMessage } = require('./service/whatsappService');

console.log('🕐 Scheduler iniciado. Revisando hábitos cada minuto...');

// Se ejecuta cada minuto para revisar recordatorios
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // Formato HH:MM

    console.log(`⏰ [${currentTime}] Buscando hábitos pendientes...`);

    try {
        // Buscar hábitos cuya hora de recordatorio coincida con la hora actual
        const query = `
            SELECT h.id, h.name, h.priority, u.whatsapp_number 
            FROM habits h 
            JOIN users u ON h.user_id = u.id 
            WHERE h.reminder_time::text LIKE $1 
              AND h.is_active = true
        `;
        const { rows: pendingHabits } = await pool.query(query, [`${currentTime}%`]);

        if (pendingHabits.length === 0) {
            console.log('   No hay hábitos para esta hora.');
            return;
        }

        for (const habit of pendingHabits) {
            let alertMsg;

            if (habit.priority >= 3) {
                // Mensaje especial para "Eat the Frog" (prioridad alta)
                alertMsg = `🔥 *EAT THE FROG* 🔥\n\nTu tarea más crítica del día:\n*${habit.name}*\n\nNo procrastines. ¡Hazlo AHORA!\n\n1️⃣ Ya lo hice\n2️⃣ Posponer 15 min\n3️⃣ Hoy no puedo`;
            } else {
                // Mensaje estándar
                alertMsg = `🚀 *¡HORA DE ACTUAR!*\n\nMeta: *${habit.name}*\n\n1️⃣ Ya lo hice\n2️⃣ Posponer\n3️⃣ Hoy no puedo`;
            }

            await sendWhatsAppMessage(habit.whatsapp_number, alertMsg);
            console.log(`   📩 Recordatorio enviado a ${habit.whatsapp_number} (Hábito: ${habit.name})`);
        }
    } catch (error) {
        console.error('❌ Error en el Scheduler:', error.message);
    }
});

// Mantener el proceso vivo
process.on('SIGINT', () => {
    console.log('🛑 Scheduler detenido.');
    process.exit();
});