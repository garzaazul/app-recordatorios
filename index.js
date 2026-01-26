require('dotenv').config();

const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware para parsear JSON
app.use(express.json());

// ============================================
// Health Check
// ============================================
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Habit Tracker WhatsApp API is running 🚀',
        phase: 2,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// Webhook GET - Validación de Meta
// ============================================
app.get('/webhook', (req, res) => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ Webhook verificado correctamente');
            res.status(200).send(challenge);
        } else {
            console.log('❌ Token de verificación inválido');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// ============================================
// Webhook POST - Lógica Principal Phase 2
// ============================================
app.post('/webhook', async (req, res) => {
    console.log('📩 Webhook recibido:', JSON.stringify(req.body, null, 2));

    try {
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (message) {
            const from = message.from; // Número de WhatsApp
            const body = message.text?.body?.toLowerCase().trim();

            console.log(`👤 Mensaje de ${from}: "${body}"`);

            if (body === 'listo' || body === 'hecho') {
                console.log('🎯 Procesando registro de hábito...');

                // 1. Verificar/Crear Usuario
                let userResult = await pool.query('SELECT id FROM users WHERE whatsapp_number = $1', [from]);
                let userId;

                if (userResult.rows.length === 0) {
                    console.log('🆕 Usuario nuevo detectado. Creando...');
                    const newUser = await pool.query(
                        'INSERT INTO users (whatsapp_number, name) VALUES ($1, $2) RETURNING id',
                        [from, 'Usuario Nuevo']
                    );
                    userId = newUser.rows[0].id;
                } else {
                    userId = userResult.rows[0].id;
                }

                // 2. Verificar/Crear Hábito
                let habitResult = await pool.query('SELECT id FROM habits WHERE user_id = $1 LIMIT 1', [userId]);
                let habitId;

                if (habitResult.rows.length === 0) {
                    console.log('🌱 No se encontraron hábitos. Creando hábito genérico...');
                    const newHabit = await pool.query(
                        'INSERT INTO habits (user_id, name, reminder_time) VALUES ($1, $2, $3) RETURNING id',
                        [userId, 'Mi primer hábito', '09:00:00']
                    );
                    habitId = newHabit.rows[0].id;
                } else {
                    habitId = habitResult.rows[0].id;
                }

                // 3. Registrar Log (Evitando duplicados por día con el UNIQUE constraint)
                console.log(`📝 Registrando cumplimiento para hábito ID: ${habitId}...`);
                await pool.query(
                    `INSERT INTO habit_logs (habit_id, status, logged_at) 
                     VALUES ($1, $2, CURRENT_DATE) 
                     ON CONFLICT (habit_id, logged_at) DO NOTHING`,
                    [habitId, 'completed']
                );

                console.log('✅ Proceso completado con éxito');
            }
        }

        // Siempre responder 200 OK para evitar reintentos de Meta
        res.sendStatus(200);

    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        // Respondemos 200 de todas formas para que Meta no se buclee, 
        // el error queda en nuestros logs
        res.sendStatus(200);
    }
});

// ============================================
// API: Endpoints de utilidad (para pruebas)
// ============================================
app.post('/api/users', async (req, res) => {
    const { whatsapp_number, name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (whatsapp_number, name) VALUES ($1, $2) RETURNING *',
            [whatsapp_number, name || 'Usuario Nuevo']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/habits', async (req, res) => {
    const { user_id, name, reminder_time } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO habits (user_id, name, reminder_time) VALUES ($1, $2, $3) RETURNING *',
            [user_id, name, reminder_time]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// Iniciar servidor
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor Fase 2 corriendo en puerto ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/`);
    console.log(`📍 Webhook: http://localhost:${PORT}/webhook`);
});
