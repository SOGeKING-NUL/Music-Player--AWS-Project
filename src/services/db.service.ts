import pool from "../config/db.config";

export async function saveArtist(name: string) {
    const result = await pool.query(
        `INSERT INTO artists (name) 
         VALUES ($1) 
         ON CONFLICT DO NOTHING 
         RETURNING id`,
        [name]
    );
    return result.rows[0];
}

export async function saveAlbum(title: string, artistId: string, releaseYear: number, genre?: string, s3CoverKey?: string) {
    const result = await pool.query(
        `INSERT INTO albums (title, artist_id, release_year, genre, s3_cover_key) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [title, artistId, releaseYear, genre, s3CoverKey]
    );
    return result.rows[0];
}

export async function saveSong(
    title: string,
    artistId: string,
    albumId: string,
    trackNumber: number,
    s3AudioKey: string,
    durationSeconds?: number
) {
    const result = await pool.query(
        `INSERT INTO songs (title, artist_id, album_id, track_number, s3_audio_key, duration_seconds) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`,
        [title, artistId, albumId, trackNumber, s3AudioKey, durationSeconds]
    );
    return result.rows[0];
}

export async function updateAlbumCover(albumId: string, s3CoverKey: string) {
    await pool.query(
        `UPDATE albums SET s3_cover_key = $1 WHERE id = $2`,
        [s3CoverKey, albumId]
    );
}
