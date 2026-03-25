import pool from '../config/db.config';

async function createTable() {
    try{
        console.log('Starting... ');
        await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

        await pool.query(
            `CREATE TABLE IF NOT EXISTS artists(
                id UUID PRIMARY KEY,
                name TEXT NOT NULL
            );`
        );

        await pool.query(`
            CREATE TABLE IF NOT EXISTS songs(
                id UUID PRIMARY KEY,
                title TEXT NOT NULL,
                artist_id UUID REFERENCES artists(id),
                genre TEXT,
                s3_audio_key TEXT NOT NULL,
                s3_album_cover_key TEXT
            );
        `)

        console.log('End... ');
    }catch(err){
        console.log('error executing queries: ', err)
    }finally{
        await pool.end();
    };
}


createTable();