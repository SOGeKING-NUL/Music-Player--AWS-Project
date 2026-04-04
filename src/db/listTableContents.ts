import pool from '../config/db.config';

async function listTableContents() {
    const tableName = process.argv[2];

    if (!tableName) {
        console.error('table doesnt exist');
        process.exit(1);
    }

    try {
        console.log(`Fetching data from ${tableName}...\n`);

        const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);

        if (result.rows.length === 0) {
            console.log(`No data found in ${tableName}`);
        } else {
            console.log(`Found ${result.rows.length} rows:\n`);
            console.table(result.rows);
        }
    } catch (err: any) {
        if (err.code === '42P01') {
            console.error(`Table "${tableName}" does not exist`);
        } else {
            console.error('Error:', err.message);
        }
    } finally {
        await pool.end();
        process.exit(0);
    }
}

listTableContents();
