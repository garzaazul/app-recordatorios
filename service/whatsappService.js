const axios = require('axios');

/**
 * Envía un mensaje de WhatsApp usando la API de Meta.
 * NOTA: Esta función está preparada pero el token permanente se configurará después.
 * @param {string} to - Número de WhatsApp del destinatario (con código de país)
 * @param {string} message - Mensaje a enviar
 */
const sendWhatsAppMessage = async (to, message) => {
    // Si no hay token configurado, solo logueamos (placeholder)
    if (!process.env.META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN === 'tu_token_aqui') {
        console.log(`📤 [PLACEHOLDER] Mensaje para ${to}: "${message}"`);
        return { status: 'placeholder', to, message };
    }

    try {
        const url = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v18.0'}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

        const data = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: { body: message }
        };

        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ Mensaje enviado a ${to}`);
        return response.data;
    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };