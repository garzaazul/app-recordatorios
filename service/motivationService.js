const pool = require('../db');
const { MESSAGES, getRandomMessage } = require('./messages');

/**
 * Servicio de Motivación Dinámica.
 * Selecciona mensajes basados en el progreso real del usuario.
 */

/**
 * Obtiene la racha actual del usuario.
 * @param {number} userId - ID del usuario
 * @returns {Promise<number>} Días consecutivos con 'completed'
 */
const getCurrentStreak = async (userId) => {
    try {
        const query = `
            WITH daily_status AS (
                SELECT DISTINCT hl.logged_at
                FROM habit_logs hl
                JOIN habits h ON hl.habit_id = h.id
                WHERE h.user_id = $1 AND hl.status = 'completed'
                ORDER BY hl.logged_at DESC
            ),
            streak_calc AS (
                SELECT logged_at,
                       logged_at - (ROW_NUMBER() OVER (ORDER BY logged_at DESC))::int AS grp
                FROM daily_status
            )
            SELECT COUNT(*) as streak
            FROM streak_calc
            WHERE grp = (SELECT grp FROM streak_calc LIMIT 1)
        `;
        const result = await pool.query(query, [userId]);
        return parseInt(result.rows[0]?.streak || 0);
    } catch (error) {
        console.error('❌ Error obteniendo racha:', error.message);
        return 0;
    }
};

/**
 * Reemplaza variables en un mensaje.
 * @param {string} message - Mensaje con placeholders
 * @param {Object} data - Datos para reemplazar
 * @returns {string} Mensaje con variables reemplazadas
 */
const replaceVariables = (message, data) => {
    let result = message;
    for (const [key, value] of Object.entries(data)) {
        result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
};

/**
 * Obtiene un mensaje dinámico basado en el tipo y contexto del usuario.
 * @param {number} userId - ID del usuario
 * @param {string} type - Tipo de mensaje: 'SUCCESS', 'NUDGE', 'DELAY', 'SKIP'
 * @param {Object} context - Contexto adicional (habit_name, user_name, etc.)
 * @returns {Promise<string>} Mensaje personalizado
 */
const getDynamicMessage = async (userId, type, context = {}) => {
    try {
        // Obtener racha actual
        const streak = await getCurrentStreak(userId);

        // Preparar datos para reemplazo de variables
        const data = {
            streak: streak,
            habit_name: context.habit_name || 'Tu hábito',
            user_name: context.user_name || 'Emprendedor',
            ...context
        };

        let message;

        switch (type) {
            case 'SUCCESS':
                // Verificar si es un hito de racha
                const milestoneKey = [90, 60, 30, 15, 7, 3].find(m => streak === m);
                if (milestoneKey && MESSAGES.STREAK_MILESTONE[milestoneKey]) {
                    message = getRandomMessage(MESSAGES.STREAK_MILESTONE[milestoneKey]);
                } else {
                    message = getRandomMessage(MESSAGES.SUCCESS);
                }
                break;

            case 'NUDGE':
                // Seleccionar categoría según racha
                if (streak > 7) {
                    message = getRandomMessage(MESSAGES.NUDGE.HIGH_STREAK);
                } else if (streak >= 3) {
                    message = getRandomMessage(MESSAGES.NUDGE.MID_STREAK);
                } else {
                    message = getRandomMessage(MESSAGES.NUDGE.LOW_STREAK);
                }
                break;

            case 'DELAY':
                message = getRandomMessage(MESSAGES.DELAY);
                break;

            case 'SKIP':
                message = getRandomMessage(MESSAGES.SKIP);
                break;

            default:
                message = MESSAGES.DEFAULT;
        }

        // Reemplazar variables
        return replaceVariables(message, data);

    } catch (error) {
        console.error('❌ Error en MotivationService:', error.message);
        // Fallback resiliente
        return MESSAGES.DEFAULT;
    }
};

/**
 * Obtiene mensaje de recordatorio para el scheduler.
 * Considera el nivel de racha y prioridad del hábito.
 * @param {number} userId - ID del usuario
 * @param {Object} habit - Objeto del hábito
 * @returns {Promise<string>} Mensaje de recordatorio
 */
const getReminderMessage = async (userId, habit) => {
    try {
        const streak = await getCurrentStreak(userId);

        const data = {
            streak: streak,
            habit_name: habit.name || 'Tu hábito',
        };

        let message;

        // Si es prioridad alta (Eat the Frog)
        if (habit.priority >= 3) {
            if (streak > 7) {
                message = `🔥 *EAT THE FROG* 🔥\n\n👑 Llevas ${streak} días siendo imparable.\n\nTu misión crítica: *${habit.name}*\n\nNo hay excusas. Responde:\n1️⃣ Ya lo hice\n2️⃣ 15 min más\n3️⃣ Hoy no puedo`;
            } else {
                message = `🔥 *EAT THE FROG* 🔥\n\nTu tarea más crítica del día:\n*${habit.name}*\n\nNo procrastines. Hazlo AHORA.\n\n1️⃣ Ya lo hice\n2️⃣ Posponer 15 min\n3️⃣ Hoy no puedo`;
            }
        } else {
            // Mensaje estándar basado en racha
            message = await getDynamicMessage(userId, 'NUDGE', { habit_name: habit.name });
            message += '\n\n1️⃣ Listo\n2️⃣ Después\n3️⃣ Hoy no';
        }

        return message;

    } catch (error) {
        console.error('❌ Error en getReminderMessage:', error.message);
        return `🐸 *¡HORA DE ACTUAR!*\n\nMeta: *${habit.name}*\n\n1️⃣ Ya lo hice\n2️⃣ Posponer\n3️⃣ Hoy no puedo`;
    }
};

module.exports = {
    getCurrentStreak,
    getDynamicMessage,
    getReminderMessage,
    replaceVariables
};
