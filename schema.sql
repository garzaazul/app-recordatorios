-- ============================================
-- Habit Tracker WhatsApp - Database Schema
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    whatsapp_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de hábitos
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    reminder_time TIME,
    priority INTEGER DEFAULT 1,         -- 1: Normal, 3: "Eat the Frog"
    delay_count INTEGER DEFAULT 0,      -- Veces que el usuario pospuso hoy
    habit_type VARCHAR(20) DEFAULT 'habit', -- 'habit' o 'reminder'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros de hábitos (logs)
CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'skipped', 'pending')),
    logged_at DATE DEFAULT CURRENT_DATE,
    feedback_note TEXT,
    UNIQUE (habit_id, logged_at)
);

-- ============================================
-- Índices para optimización
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_logged_at ON habit_logs(logged_at);

-- ============================================
-- Comentarios descriptivos
-- ============================================
COMMENT ON TABLE users IS 'Usuarios registrados via WhatsApp';
COMMENT ON TABLE habits IS 'Hábitos definidos por los usuarios';
COMMENT ON TABLE habit_logs IS 'Registro de cumplimiento de hábitos';
