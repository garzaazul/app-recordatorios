require('dotenv').config();
const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

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
// 3. Webhook POST - Lógica Anti-Procrastinación
// ============================================
app.post('/webhook', async (req, res) => {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) return res.sendStatus(200);

    const from = message.from; // Número de WhatsApp del usuario
    const fullBody = message.text?.body?.trim() || '';
    const bodyLower = fullBody.toLowerCase();

    try {
        // --- A. IDENTIFICAR INTENCIÓN (Números o Palabras clave) ---
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
            // Buscamos al usuario y su hábito más prioritario (Eat the Frog)
            const habitQuery = `
                SELECT h.id, h.name 
                FROM habits h 
                JOIN users u ON h.user_id = u.id 
                WHERE u.whatsapp_number = $1 AND h.is_active = true 
                ORDER BY h.priority DESC LIMIT 1
            `;
            const { rows } = await pool.query(habitQuery, [from]);
            const habit = rows[0];

            if (habit) {
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
                } else if (isDelay) {
                    // Lógica de procrastinación
                    await pool.query('UPDATE habits SET delay_count = delay_count + 1 WHERE id = $1', [habit.id]);
                    console.log(`⏳ Hábito ${habit.id} pospuesto (delay_count +1)`);
                }
            } else {
                console.log(`⚠️ Usuario ${from} envió acción pero no tiene hábitos activos.`);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error Webhook:', error.message);
        res.sendStatus(200); // Meta requiere 200 para no reintentar
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
// 5. Inicio del Servidor
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 MVP Tracker Pro activo en puerto ${PORT}`);
});