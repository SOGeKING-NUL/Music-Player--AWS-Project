import pool from '../config/db.config';

async function migrate() {
    try {
        console.log('Running migrations...\n');

        // Table: user_sessions
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                created_at TIMESTAMP DEFAULT NOW(),
                last_seen_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✓ user_sessions table ready');

        // Table: playback_history
        await pool.query(`
            CREATE TABLE IF NOT EXISTS playback_history (
                id SERIAL PRIMARY KEY,
                session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
                song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
                played_at TIMESTAMP DEFAULT NOW(),
                progress_seconds INTEGER DEFAULT 0
            );
        `);
        console.log('✓ playback_history table ready');

        // Index for fast lookups by session, newest first
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_playback_history_session_time
            ON playback_history(session_id, played_at DESC);
        `);
        console.log('✓ Index on playback_history created');

        console.log('\n✅ Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

migrate();
