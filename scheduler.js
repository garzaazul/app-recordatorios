require('dotenv').config();
const cron = require('node-cron');
const pool = require('./db');
const { sendWhatsAppMessage } = require('./service/whatsappService');
const { getReminderMessage } = require('./service/motivationService');

console.log('🕐 Scheduler iniciado. Revisando hábitos cada minuto...');

// Se ejecuta cada minuto para revisar recordatorios
cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // Formato HH:MM

    console.log(`⏰ [${currentTime}] Buscando hábitos pendientes...`);

    try {
        // Buscar hábitos cuya hora de recordatorio coincida con la hora actual
        const query = `
            SELECT h.id, h.name, h.priority, h.user_id, u.whatsapp_number 
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
            try {
                // Usar el servicio de motivación para obtener mensaje personalizado
                const alertMsg = await getReminderMessage(habit.user_id, habit);

                await sendWhatsAppMessage(habit.whatsapp_number, alertMsg);
                console.log(`   📩 Recordatorio enviado a ${habit.whatsapp_number} (Hábito: ${habit.name})`);
            } catch (msgError) {
                console.error(`   ❌ Error enviando a ${habit.whatsapp_number}:`, msgError.message);
            }
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