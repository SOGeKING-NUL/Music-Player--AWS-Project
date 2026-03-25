import pool from '../config/db.config';

async function listTable() {
    console.log('Listing Tables:\n');
    try {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('Tables in database:');
        result.rows.forEach((row: any) => {
            console.log(`- ${row.table_name}`);
        });
        
        console.log(`\nTotal tables: ${result.rowCount}`);
        
    } catch(err) {
        console.error('Error while listing tables:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

listTable();
