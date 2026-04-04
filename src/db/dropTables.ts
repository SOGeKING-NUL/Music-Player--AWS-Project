import pool from '../config/db.config';

async function dropTables() {
    try {
        console.log('Dropping tables...\n');
        
        // Drop tables in reverse order of dependencies
        await pool.query(`DROP TABLE IF EXISTS songs CASCADE;`);
        console.log('Dropped songs table');
        
        await pool.query(`DROP TABLE IF EXISTS albums CASCADE;`);
        console.log('Dropped albums table');
        
        await pool.query(`DROP TABLE IF EXISTS artists CASCADE;`);
        console.log('Dropped artists table');
        
        console.log('\nAll tables dropped successfully!');
    } catch(err) {
        console.error('Error dropping tables:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

dropTables();
