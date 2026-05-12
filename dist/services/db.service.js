"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveArtist = saveArtist;
exports.getAllArtists = getAllArtists;
exports.getAlbumsByArtist = getAlbumsByArtist;
exports.getSongsByAlbum = getSongsByAlbum;
exports.saveAlbum = saveAlbum;
exports.saveSong = saveSong;
exports.updateAlbumCover = updateAlbumCover;
exports.getRemainingAlbumQueue = getRemainingAlbumQueue;
exports.getRandomQueue = getRandomQueue;
exports.searchMusic = searchMusic;
exports.getOrCreateSession = getOrCreateSession;
exports.logPlayback = logPlayback;
exports.getLastPlayedTrack = getLastPlayedTrack;
exports.getPreviousTrack = getPreviousTrack;
const db_config_1 = __importDefault(require("../config/db.config"));
async function saveArtist(id, name, s3CoverKey) {
    const result = await db_config_1.default.query(`INSERT INTO artists (id, name, s3_cover_key) 
         VALUES ($1, $2, $3) 
         RETURNING id`, [id, name, s3CoverKey]);
    return result.rows[0];
}
async function getAllArtists() {
    const result = await db_config_1.default.query(`SELECT * FROM artists ORDER BY created_at DESC`);
    return result.rows;
}
async function getAlbumsByArtist(artistId) {
    const result = await db_config_1.default.query(`SELECT * FROM albums WHERE artist_id = $1 ORDER BY release_year DESC`, [artistId]);
    return result.rows;
}
async function getSongsByAlbum(albumId) {
    const result = await db_config_1.default.query(`SELECT * FROM songs WHERE album_id = $1 ORDER BY track_number ASC`, [albumId]);
    return result.rows;
}
async function saveAlbum(id, title, artistId, releaseYear, genre, s3CoverKey) {
    const result = await db_config_1.default.query(`INSERT INTO albums (id, title, artist_id, release_year, genre, s3_cover_key) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`, [id, title, artistId, releaseYear, genre, s3CoverKey]);
    return result.rows[0];
}
async function saveSong(title, artistId, albumId, trackNumber, s3AudioKey, durationSeconds) {
    const result = await db_config_1.default.query(`INSERT INTO songs (title, artist_id, album_id, track_number, s3_audio_key, duration_seconds) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id`, [title, artistId, albumId, trackNumber, s3AudioKey, durationSeconds]);
    return result.rows[0];
}
async function updateAlbumCover(albumId, s3CoverKey) {
    await db_config_1.default.query(`UPDATE albums SET s3_cover_key = $1 WHERE id = $2`, [s3CoverKey, albumId]);
}
async function getRemainingAlbumQueue(albumId, currentTrackNumber) {
    const result = await db_config_1.default.query(`SELECT 
            s.id as song_id, 
            s.title, 
            a.name as artist_name, 
            al.s3_cover_key as album_cover_key,
            s.s3_audio_key,
            s.track_number,
            s.duration_seconds,
            s.album_id
         FROM songs s
         JOIN artists a ON s.artist_id = a.id
         JOIN albums al ON s.album_id = al.id
         WHERE s.album_id = $1 AND s.track_number > $2 
         ORDER BY s.track_number ASC`, [albumId, currentTrackNumber]);
    return result.rows;
}
async function getRandomQueue(limit = 20) {
    const result = await db_config_1.default.query(`SELECT 
            s.id as song_id, 
            s.title, 
            a.name as artist_name, 
            al.s3_cover_key as album_cover_key,
            s.s3_audio_key,
            s.track_number,
            s.duration_seconds,
            s.album_id
         FROM songs s
         JOIN artists a ON s.artist_id = a.id
         JOIN albums al ON s.album_id = al.id
         ORDER BY RANDOM() 
         LIMIT $1`, [limit]);
    return result.rows;
}
async function searchMusic(query, limit = 20) {
    const result = await db_config_1.default.query(`SELECT 
            s.id as song_id, 
            s.title, 
            a.name as artist_name, 
            al.s3_cover_key as album_cover_key,
            s.s3_audio_key,
            s.track_number,
            s.duration_seconds,
            s.album_id
         FROM songs s
         JOIN artists a ON s.artist_id = a.id
         JOIN albums al ON s.album_id = al.id
         WHERE s.title ILIKE $1 OR a.name ILIKE $1 OR al.title ILIKE $1
         ORDER BY s.title ASC
         LIMIT $2`, [`%${query}%`, limit]);
    return result.rows;
}
async function getOrCreateSession(sessionId) {
    if (sessionId) {
        // Touch last_seen_at and return if exists
        const result = await db_config_1.default.query(`UPDATE user_sessions SET last_seen_at = NOW() WHERE id = $1 RETURNING id`, [sessionId]);
        if (result.rows.length > 0) {
            return result.rows[0];
        }
    }
    // Create a fresh session
    const result = await db_config_1.default.query(`INSERT INTO user_sessions DEFAULT VALUES RETURNING id`);
    return result.rows[0];
}
async function logPlayback(sessionId, songId, progressSeconds = 0) {
    await db_config_1.default.query(`INSERT INTO playback_history (session_id, song_id, progress_seconds)
         VALUES ($1, $2, $3)`, [sessionId, songId, progressSeconds]);
}
async function getLastPlayedTrack(sessionId) {
    const result = await db_config_1.default.query(`SELECT
            ph.progress_seconds,
            ph.played_at,
            s.id as song_id,
            s.title,
            s.s3_audio_key,
            s.track_number,
            s.album_id,
            a.name as artist_name,
            al.s3_cover_key as album_cover_key
         FROM playback_history ph
         JOIN songs s ON ph.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
         JOIN albums al ON s.album_id = al.id
         WHERE ph.session_id = $1
         ORDER BY ph.played_at DESC
         LIMIT 1`, [sessionId]);
    return result.rows[0] || null;
}
async function getPreviousTrack(sessionId, currentSongId) {
    // Get the most recent track that is NOT the currently playing one
    const result = await db_config_1.default.query(`SELECT
            ph.progress_seconds,
            s.id as song_id,
            s.title,
            s.s3_audio_key,
            s.track_number,
            s.album_id,
            a.name as artist_name,
            al.s3_cover_key as album_cover_key
         FROM playback_history ph
         JOIN songs s ON ph.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
         JOIN albums al ON s.album_id = al.id
         WHERE ph.session_id = $1 AND ph.song_id != $2
         ORDER BY ph.played_at DESC
         LIMIT 1`, [sessionId, currentSongId]);
    return result.rows[0] || null;
}
