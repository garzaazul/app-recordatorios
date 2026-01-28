# Guía de Despliegue - Railway

## Prerrequisitos
1. Cuenta en [Railway](https://railway.app)
2. Repositorio Git conectado
3. Base de datos PostgreSQL (en Railway o externa)
4. Cuenta de Meta Business configurada

---

## Paso 1: Configurar PostgreSQL

En Railway:
1. Click "New" → "Database" → PostgreSQL
2. Copia la `DATABASE_URL` de las variables

---

## Paso 2: Desplegar Backend

1. Click "New" → "GitHub Repo" → Selecciona `app-recordatorios`
2. Railway detectará Node.js automáticamente

### Variables de Entorno (Backend)
```env
DATABASE_URL=postgres://...
PORT=8080
WHATSAPP_VERIFY_TOKEN=tu_token_secreto
META_ACCESS_TOKEN=tu_token_permanente
META_API_VERSION=v18.0
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
```

### Configurar Start Command
En Settings → Deploy → Start Command:
```bash
node index.js
```

---

## Paso 3: Desplegar Frontend

1. Crear nuevo servicio → "GitHub Repo" → Carpeta `frontend/`
2. O usar Vercel/Netlify para el frontend estático

### Variables de Entorno (Frontend)
```env
VITE_API_URL=https://tu-backend.railway.app
```

### Build Command
```bash
npm run build
```

### Start Command (Static)
```bash
npx serve dist -s
```

---

## Paso 4: Configurar Webhook de Meta

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. WhatsApp → Configuration → Webhook
3. Callback URL: `https://tu-backend.railway.app/webhook`
4. Verify Token: tu `WHATSAPP_VERIFY_TOKEN`
5. Suscribirse a: `messages`

---

## Paso 5: Ejecutar Scheduler

Railway ejecuta solo un proceso por defecto. Para el scheduler:

### Opción A: Mismo servicio (no recomendado)
Importar scheduler en index.js:
```javascript
require('./scheduler');
```

### Opción B: Worker separado (recomendado)
1. Crear nuevo servicio → GitHub Repo → Misma carpeta
2. Start Command: `node scheduler.js`
3. Configurar mismas variables de entorno

---

## Verificación

1. `https://tu-backend.railway.app/api/health`
   - Debe retornar: `{"status":"ok","database":"connected"}`

2. Probar el formulario en el frontend

3. Verificar que el webhook responda a Meta

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| CORS error | Verificar que VITE_API_URL esté correcto |
| 500 en /api | Revisar DATABASE_URL |
| Webhook falla | Verificar WHATSAPP_VERIFY_TOKEN |
| No llegan mensajes | Revisar META_ACCESS_TOKEN |
