"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = __importDefault(require("../config/db.config"));
async function createTable() {
    try {
        console.log('Creating tables...\n');
        await db_config_1.default.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
        console.log('Enabled pgcrypto extension'); //lets you use UUID
        await db_config_1.default.query(`
            CREATE TABLE IF NOT EXISTS artists(
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                s3_cover_key TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Created artists table');
        await db_config_1.default.query(`
            CREATE TABLE IF NOT EXISTS albums(
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
                release_year INTEGER,
                genre TEXT,
                s3_cover_key TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Created albums table');
        await db_config_1.default.query(`
            CREATE TABLE IF NOT EXISTS songs(
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                title TEXT NOT NULL,
                artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
                album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
                track_number INTEGER NOT NULL,
                duration_seconds INTEGER,
                s3_audio_key TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(album_id, track_number)
            );
        `);
        console.log('Created songs table');
        await db_config_1.default.query(`
            CREATE INDEX IF NOT EXISTS idx_songs_album 
            ON songs(album_id, track_number);
        `);
        console.log('Created index on songs');
        console.log('\nAll tables created successfully!');
    }
    catch (err) {
        console.error('Error executing queries:', err);
    }
    finally {
        await db_config_1.default.end();
        process.exit(0);
    }
}
createTable();
