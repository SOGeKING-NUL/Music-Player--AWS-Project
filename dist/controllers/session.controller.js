"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSession = initSession;
exports.logPlay = logPlay;
exports.getLastPlayed = getLastPlayed;
exports.getPrevious = getPrevious;
const db_service_1 = require("../services/db.service");
const s3_service_1 = require("../services/s3.service");
const SESSION_COOKIE = "mp_session_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year
/** Helper to enrich a DB track row with a presigned cover URL */
async function enrichTrack(row) {
    if (!row)
        return null;
    let albumCoverUrl = "";
    if (row.album_cover_key) {
        try {
            const { streamUrl } = await (0, s3_service_1.getStreamPresignedUrl)(row.album_cover_key, 3600);
            albumCoverUrl = streamUrl;
        }
        catch {
            // non-fatal
        }
    }
    return {
        songId: row.song_id,
        title: row.title,
        artistName: row.artist_name,
        albumCoverUrl,
        s3AudioKey: row.s3_audio_key,
        albumId: row.album_id,
        trackNumber: row.track_number,
        progressSeconds: row.progress_seconds ?? 0
    };
}
/** POST /api/session/init — create or resume a session */
async function initSession(req, res) {
    try {
        const existingId = req.cookies?.[SESSION_COOKIE];
        const session = await (0, db_service_1.getOrCreateSession)(existingId);
        res.cookie(SESSION_COOKIE, session.id, {
            httpOnly: true,
            maxAge: COOKIE_MAX_AGE,
            sameSite: "lax",
        });
        res.json({ sessionId: session.id });
    }
    catch (err) {
        console.error("initSession error:", err);
        res.status(500).json({ error: "Failed to init session" });
    }
}
/** POST /api/session/history — log a played song */
async function logPlay(req, res) {
    try {
        const sessionId = req.cookies?.[SESSION_COOKIE];
        if (!sessionId)
            return res.status(401).json({ error: "No session" });
        const { songId, progressSeconds = 0 } = req.body;
        if (!songId)
            return res.status(400).json({ error: "Missing songId" });
        await (0, db_service_1.logPlayback)(sessionId, songId, progressSeconds);
        res.json({ success: true });
    }
    catch (err) {
        console.error("logPlay error:", err);
        res.status(500).json({ error: "Failed to log play" });
    }
}
/** GET /api/session/last-played — get the most recently played track */
async function getLastPlayed(req, res) {
    try {
        const sessionId = req.cookies?.[SESSION_COOKIE];
        if (!sessionId)
            return res.json({ track: null });
        const row = await (0, db_service_1.getLastPlayedTrack)(sessionId);
        const track = await enrichTrack(row);
        res.json({ track });
    }
    catch (err) {
        console.error("getLastPlayed error:", err);
        res.status(500).json({ error: "Failed to get last played" });
    }
}
/** GET /api/session/previous?currentSongId=xxx — get the previous track */
async function getPrevious(req, res) {
    try {
        const sessionId = req.cookies?.[SESSION_COOKIE];
        if (!sessionId)
            return res.json({ track: null });
        const { currentSongId } = req.query;
        if (!currentSongId)
            return res.status(400).json({ error: "Missing currentSongId" });
        const row = await (0, db_service_1.getPreviousTrack)(sessionId, String(currentSongId));
        const track = await enrichTrack(row);
        res.json({ track });
    }
    catch (err) {
        console.error("getPrevious error:", err);
        res.status(500).json({ error: "Failed to get previous track" });
    }
}
