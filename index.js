require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { getDynamicMessage, getReminderMessage } = require('./service/motivationService');
const { sendWhatsAppMessage } = require('./service/whatsappService');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

// ============================================
// 1. Health Check & Root
// ============================================
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', mission: 'Eliminar procrastinación 🚀' });
});

// ============================================
// 2. Webhook GET - Validación de Meta
// ============================================
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook verificado');
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

// ============================================
// 3. Webhook POST - Lógica Anti-Procrastinación con Mensajes Dinámicos
// ============================================
app.post('/webhook', async (req, res) => {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const fullBody = message.text?.body?.trim() || '';
    const bodyLower = fullBody.toLowerCase();

    try {
        // --- A. IDENTIFICAR INTENCIÓN ---
        let status = null;
        let isDelay = false;

        if (['1', 'listo', 'hecho', 'ok', 'completado'].some(k => bodyLower.startsWith(k))) {
            status = 'completed';
        } else if (['2', 'luego', 'tarde', 'posponer', 'despues'].some(k => bodyLower.startsWith(k))) {
            isDelay = true;
        } else if (['3', 'no', 'saltar', 'no puedo'].some(k => bodyLower.startsWith(k))) {
            status = 'skipped';
        }

        // --- B. PROCESAR SI HAY ACCIÓN ---
        if (status || isDelay) {
            // Buscar usuario y hábito
            const habitQuery = `
                SELECT h.id, h.name, h.user_id 
                FROM habits h 
                JOIN users u ON h.user_id = u.id 
                WHERE u.whatsapp_number = $1 AND h.is_active = true 
                ORDER BY h.priority DESC LIMIT 1
            `;
            const { rows } = await pool.query(habitQuery, [from]);
            const habit = rows[0];

            if (habit) {
                let responseMessage;

                if (status) {
                    // Registro de cumplimiento o salto
                    const logNote = fullBody.split(/[\s,]+/).slice(1).join(' ').trim();
                    await pool.query(
                        `INSERT INTO habit_logs (habit_id, status, feedback_note, logged_at) 
                         VALUES ($1, $2, $3, CURRENT_DATE) 
                         ON CONFLICT (habit_id, logged_at) 
                         DO UPDATE SET status = EXCLUDED.status, feedback_note = EXCLUDED.feedback_note`,
                        [habit.id, status, logNote || null]
                    );
                    console.log(`📝 Hábito ${habit.id} marcado como: ${status}`);

                    // Obtener mensaje dinámico basado en el estado
                    const messageType = status === 'completed' ? 'SUCCESS' : 'SKIP';
                    responseMessage = await getDynamicMessage(habit.user_id, messageType, { habit_name: habit.name });

                } else if (isDelay) {
                    // Lógica de procrastinación
                    await pool.query('UPDATE habits SET delay_count = delay_count + 1 WHERE id = $1', [habit.id]);
                    console.log(`⏳ Hábito ${habit.id} pospuesto (delay_count +1)`);

                    responseMessage = await getDynamicMessage(habit.user_id, 'DELAY', { habit_name: habit.name });
                }

                // Enviar respuesta dinámica (placeholder por ahora)
                if (responseMessage) {
                    await sendWhatsAppMessage(from, responseMessage);
                }
            } else {
                console.log(`⚠️ Usuario ${from} envió acción pero no tiene hábitos activos.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error Webhook:', error.message);
        res.sendStatus(200);
    }
});

// ============================================
// 4. API Endpoints (Admin/PWA)
// ============================================
app.post('/api/users', async (req, res) => {
    const { whatsapp_number, name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (whatsapp_number, name) VALUES ($1, $2) ON CONFLICT (whatsapp_number) DO UPDATE SET name = EXCLUDED.name RETURNING *',
            [whatsapp_number, name]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/habits', async (req, res) => {
    const { user_id, name, reminder_time, priority } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO habits (user_id, name, reminder_time, priority) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, name, reminder_time, priority || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================
// 5. API de Estadísticas (Dashboard)
// ============================================
app.get('/api/stats/:whatsapp_number', async (req, res) => {
    const { whatsapp_number } = req.params;

    try {
        const userResult = await pool.query(
            'SELECT id FROM users WHERE whatsapp_number = $1',
            [whatsapp_number]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userId = userResult.rows[0].id;

        // Racha actual
        const streakQuery = `
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
        const streakResult = await pool.query(streakQuery, [userId]);
        const currentStreak = parseInt(streakResult.rows[0]?.streak || 0);

        // Tasa de éxito (7 días)
        const successRateQuery = `
            SELECT 
                COUNT(*) FILTER (WHERE hl.status = 'completed') as completed,
                COUNT(*) as total
            FROM habit_logs hl
            JOIN habits h ON hl.habit_id = h.id
            WHERE h.user_id = $1 AND hl.logged_at >= CURRENT_DATE - INTERVAL '7 days'
        `;
        const successResult = await pool.query(successRateQuery, [userId]);
        const completed = parseInt(successResult.rows[0]?.completed || 0);
        const total = parseInt(successResult.rows[0]?.total || 0);
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        // Total delays
        const delayQuery = `SELECT COALESCE(SUM(delay_count), 0) as total_delays FROM habits WHERE user_id = $1`;
        const delayResult = await pool.query(delayQuery, [userId]);
        const totalDelays = parseInt(delayResult.rows[0]?.total_delays || 0);

        // Sapos vencidos
        const frogsQuery = `
            SELECT COUNT(*) as frogs_defeated
            FROM habit_logs hl
            JOIN habits h ON hl.habit_id = h.id
            WHERE h.user_id = $1 AND hl.status = 'completed'
        `;
        const frogsResult = await pool.query(frogsQuery, [userId]);
        const frogsDefeated = parseInt(frogsResult.rows[0]?.frogs_defeated || 0);

        res.json({ currentStreak, successRate, totalDelays, frogsDefeated });
    } catch (error) {
        console.error('❌ Error en stats:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 6. Verificación de Teléfono (Onboarding)
// ============================================
app.get('/api/verify-phone/:phone', async (req, res) => {
    const { phone } = req.params;

    try {
        // Verificar si el usuario existe
        const userResult = await pool.query(
            'SELECT id, name, created_at FROM users WHERE whatsapp_number = $1',
            [phone]
        );

        if (userResult.rows.length === 0) {
            return res.json({
                exists: false,
                message: 'Número no registrado. Completa el formulario para vincular.'
            });
        }

        const user = userResult.rows[0];

        // Contar hábitos activos
        const habitsResult = await pool.query(
            'SELECT COUNT(*) as count FROM habits WHERE user_id = $1 AND is_active = true',
            [user.id]
        );
        const activeHabits = parseInt(habitsResult.rows[0]?.count || 0);

        res.json({
            exists: true,
            user: {
                id: user.id,
                name: user.name,
                createdAt: user.created_at
            },
            activeHabits,
            message: activeHabits > 0
                ? `✅ Tu número está vinculado con ${activeHabits} hábito(s) activo(s).`
                : '⚠️ Tu número está registrado pero no tienes hábitos activos.'
        });
    } catch (error) {
        console.error('❌ Error verificando teléfono:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 7. Health Check del Sistema (para Railway)
// ============================================
app.get('/api/health', async (req, res) => {
    try {
        // Verificar conexión a la BD
        await pool.query('SELECT 1');

        res.json({
            status: 'ok',
            database: 'connected',
            whatsapp: process.env.META_ACCESS_TOKEN ? 'configured' : 'pending',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// ============================================
// 8. Inicio del Servidor
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 MVP Tracker Pro activo en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});