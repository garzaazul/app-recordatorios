const pool = require('./db');

async function migrate() {
    try {
        console.log('🚀 Iniciando migración de base de datos...');

        // 1. Asegurar que los logs sean únicos por día
        console.log('📊 Actualizando habit_logs...');
        await pool.query(`
      ALTER TABLE habit_logs 
      ALTER COLUMN logged_at TYPE DATE;
    `);

        // El constraint ya podría existir si se corrió antes o si el schema estaba "adelantado"
        // Pero según el pedido del usuario, debo asegurarme.
        // Verificamos si existe antes de añadir para evitar error.
        try {
            await pool.query(`
          ALTER TABLE habit_logs 
          ADD CONSTRAINT unique_habit_day UNIQUE (habit_id, logged_at);
        `);
            console.log('✅ Constraint unique_habit_day añadido.');
        } catch (e) {
            if (e.code === '42710') { // duplicate_object
                console.log('ℹ️ El constraint unique_habit_day ya existe.');
            } else {
                throw e;
            }
        }

        // 2. Añadir inteligencia de ejecución a la tabla de hábitos
        console.log('🧠 Actualizando habits...');
        const habitsAddColumns = [
            'ALTER TABLE habits ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;',
            'ALTER TABLE habits ADD COLUMN IF NOT EXISTS delay_count INTEGER DEFAULT 0;',
            'ALTER TABLE habits ADD COLUMN IF NOT EXISTS habit_type VARCHAR(20) DEFAULT \'habit\';'
        ];
        for (const sql of habitsAddColumns) {
            await pool.query(sql);
        }
        console.log('✅ Columnas de inteligencia añadidas a habits.');

        // 3. Añadir feedback a los logs
        console.log('💬 Añadiendo feedback_note a habit_logs...');
        await pool.query('ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS feedback_note TEXT;');
        console.log('✅ feedback_note añadido.');

        console.log('🎉 Migración completada exitosamente.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error durante la migración:', err);
        process.exit(1);
    }
}

migrate();
