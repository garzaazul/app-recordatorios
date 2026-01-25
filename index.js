require('dotenv').config();

const express = require('express');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// ============================================
// Health Check
// ============================================
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Habit Tracker WhatsApp API is running 🚀',
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
// Webhook POST - Recibir notificaciones de WhatsApp
// ============================================
app.post('/webhook', (req, res) => {
    console.log('📩 Webhook recibido:', JSON.stringify(req.body, null, 2));

    // TODO: Procesar mensajes entrantes de WhatsApp
    // Por ahora solo hacemos log del body

    res.sendStatus(200);
});

// ============================================
// API: Crear un nuevo hábito
// ============================================
app.post('/api/habits', async (req, res) => {
    const { user_id, name, reminder_time } = req.body;

    // Validación básica
    if (!user_id || !name) {
        return res.status(400).json({
            error: 'user_id y name son requeridos'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO habits (user_id, name, reminder_time) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
            [user_id, name, reminder_time || null]
        );

        console.log('✅ Hábito creado:', result.rows[0]);

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Error al crear hábito:', error);
        res.status(500).json({
            error: 'Error al crear el hábito',
            details: error.message
        });
    }
});

// ============================================
// Iniciar servidor
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/`);
    console.log(`📍 Webhook: http://localhost:${PORT}/webhook`);
});
