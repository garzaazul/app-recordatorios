const pool = require('./db');

async function checkSchema() {
    try {
        console.log('--- Checking habits table columns ---');
        const habitsCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'habits';
        `);
        console.table(habitsCols.rows);

        console.log('--- Checking habit_logs table columns ---');
        const logsCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'habit_logs';
        `);
        console.table(logsCols.rows);

        console.log('--- Checking unique constraint on habit_logs ---');
        const constraints = await pool.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conname = 'unique_habit_day';
        `);
        console.table(constraints.rows);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkSchema();
