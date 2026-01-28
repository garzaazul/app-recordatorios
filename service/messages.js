/**
 * Colección de mensajes dinámicos categorizados.
 * Variables disponibles: {streak}, {habit_name}, {user_name}
 */

const MESSAGES = {
    // Mensajes cuando el usuario completa un hábito
    SUCCESS: [
        "💪 ¡Excelente! Otro sapo devorado. Tu racha: {streak} días.",
        "🔥 ¡Brutal! {streak} días seguidos. Estás en el top 5% de emprendedores.",
        "🏆 ¡Victoria! '{habit_name}' completado. Racha actual: {streak} días.",
        "⚡ ¡Imparable! {streak} días sin procrastinar. Eso es disciplina real.",
        "🎯 ¡Boom! Otro día ganado. Llevas {streak} días de pura ejecución.",
        "🐸 Sapo eliminado. Tu récord de consistencia: {streak} días.",
        "💎 Día {streak} en la bolsa. Los resultados están llegando.",
    ],

    // Hitos especiales de racha
    STREAK_MILESTONE: {
        3: [
            "🔥 ¡3 DÍAS! Estás creando un nuevo hábito. La ciencia dice que necesitas 21, pero ya arrancaste.",
            "⚡ ¡Tercer día consecutivo! El momentum está de tu lado.",
        ],
        7: [
            "🏆 ¡UNA SEMANA COMPLETA! Eres oficialmente más disciplinado que el 90% de la gente.",
            "💪 7 días. Una semana de pura ejecución. Esto ya no es suerte, es carácter.",
        ],
        15: [
            "🔥 ¡15 DÍAS! Medio mes sin procrastinar. Tu cerebro ya está reprogramándose.",
            "💎 Dos semanas y media. Los hábitos se están solidificando. ¡No pares!",
        ],
        30: [
            "🏆🏆🏆 ¡UN MES COMPLETO! Eres una máquina de ejecución. Esto es transformación real.",
            "⭐ 30 días. Has demostrado que la disciplina vence al talento. Eres imparable.",
        ],
        60: [
            "👑 ¡60 DÍAS! Dos meses de consistencia absoluta. Eres un outlier estadístico.",
        ],
        90: [
            "🚀 ¡90 DÍAS! Tres meses. Has reconfigurado tu identidad. Eres ejecutor, no solo soñador.",
        ],
    },

    // Recordatorios proactivos (para el Scheduler)
    NUDGE: {
        // Para usuarios con racha baja (0-2 días)
        LOW_STREAK: [
            "🐸 El sapo no se va a comer solo. ¿Listo para ganar el día?",
            "⏰ Tu tarea más importante te espera: '{habit_name}'. Un paso a la vez.",
            "🎯 Hoy es el día. '{habit_name}' no se hará sola. ¿Empezamos?",
        ],
        // Para usuarios con racha media (3-7 días)
        MID_STREAK: [
            "🔥 {streak} días y contando. No rompas la cadena. Tu sapo te espera: '{habit_name}'",
            "💪 Llevas {streak} días. Hoy es otro ladrillo en tu imperio. ¿Confirmas victoria?",
            "⚡ Racha de {streak}. El momentum es tuyo. Tarea del día: '{habit_name}'",
        ],
        // Para usuarios con racha alta (>7 días)
        HIGH_STREAK: [
            "🏆 {streak} días de disciplina. Hoy no es diferente. '{habit_name}' te espera.",
            "👑 Eres imparable con {streak} días. ¿Listo para otro más?",
            "🔥 TOP PERFORMER: {streak} días. El sapo de hoy: '{habit_name}'. Demuestra quién manda.",
        ],
    },

    // Cuando el usuario pospone
    DELAY: [
        "⏳ Entendido. Te recuerdo en 15 minutos. Pero recuerda: el sapo no se hace más pequeño.",
        "👀 Ok, pospuesto. Pero ojo: procrastinar hoy es robarle al Carlos del mañana.",
        "⏰ Te doy 15 minutos más. Pero después... ¡sin excusas!",
    ],

    // Cuando el usuario salta/cancela
    SKIP: [
        "📝 Anotado. Mañana es una nueva oportunidad. No te rindas.",
        "💪 Día difícil, lo entiendo. Pero mañana volvemos con todo.",
        "🔄 Sin problema. Recuerda: un mal día no borra una buena racha.",
    ],

    // Mensaje por defecto (fallback)
    DEFAULT: "🐸 ¡Es hora de actuar! Responde 1 para confirmar, 2 para posponer, 3 para saltar.",
};

/**
 * Obtiene un mensaje aleatorio de una categoría.
 * @param {string|Array} category - Categoría o array de mensajes
 * @returns {string} Mensaje aleatorio
 */
const getRandomMessage = (messages) => {
    if (!messages || messages.length === 0) {
        return MESSAGES.DEFAULT;
    }
    return messages[Math.floor(Math.random() * messages.length)];
};

module.exports = { MESSAGES, getRandomMessage };
