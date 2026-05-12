"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addArtist = addArtist;
exports.addAlbum = addAlbum;
exports.getArtists = getArtists;
exports.getArtistAlbums = getArtistAlbums;
exports.getAlbumSongs = getAlbumSongs;
exports.getQueue = getQueue;
exports.search = search;
const db_service_1 = require("../services/db.service");
const s3_service_1 = require("../services/s3.service");
async function addArtist(req, res) {
    try {
        const { id, name, s3CoverKey } = req.body;
        if (!id || !name) {
            return res.status(400).json({
                error: 'Missing required fields: id, name'
            });
        }
        const artist = await (0, db_service_1.saveArtist)(id, name, s3CoverKey);
        res.json({
            success: true,
            artistId: artist.id,
            message: 'Artist added successfully'
        });
    }
    catch (err) {
        console.error("Error adding artist:", err);
        res.status(500).json({ error: 'Failed to add artist' });
    }
}
async function addAlbum(req, res) {
    try {
        const { id, title, artistId, releaseYear, genre } = req.body;
        if (!id || !title || !artistId) {
            return res.status(400).json({
                error: 'Missing required fields: id, title, artistId'
            });
        }
        const album = await (0, db_service_1.saveAlbum)(id, title, artistId, releaseYear, genre);
        res.json({
            success: true,
            albumId: album.id,
            message: 'Album added successfully'
        });
    }
    catch (err) {
        console.error("Error adding album:", err);
        if (err.code === '23503') {
            return res.status(404).json({
                error: 'Artist not found'
            });
        }
        res.status(500).json({ error: 'Failed to add album' });
    }
}
async function getArtists(req, res) {
    try {
        const artists = await (0, db_service_1.getAllArtists)();
        res.json({ artists });
    }
    catch (err) {
        console.error("Error fetching artists:", err);
        res.status(500).json({ error: 'Failed to fetch artists' });
    }
}
async function getArtistAlbums(req, res) {
    try {
        const { artistId } = req.params;
        const albums = await (0, db_service_1.getAlbumsByArtist)(artistId);
        res.json({ albums });
    }
    catch (err) {
        console.error("Error fetching albums:", err);
        res.status(500).json({ error: 'Failed to fetch albums' });
    }
}
async function getAlbumSongs(req, res) {
    try {
        const { albumId } = req.params;
        const songs = await (0, db_service_1.getSongsByAlbum)(albumId);
        res.json({ songs });
    }
    catch (err) {
        console.error("Error fetching songs:", err);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
}
async function attachPresignedCovers(tracks) {
    return Promise.all(tracks.map(async (track) => {
        if (track.album_cover_key) {
            try {
                const { streamUrl } = await (0, s3_service_1.getStreamPresignedUrl)(track.album_cover_key, 3600);
                track.albumCoverUrl = streamUrl;
            }
            catch (err) {
                console.error("Presign error", err);
            }
        }
        return track;
    }));
}
async function getQueue(req, res) {
    try {
        const { albumId, trackNumber, limit } = req.query;
        let tracks = [];
        if (albumId && trackNumber) {
            tracks = await (0, db_service_1.getRemainingAlbumQueue)(String(albumId), Number(trackNumber));
        }
        else {
            tracks = await (0, db_service_1.getRandomQueue)(limit ? Number(limit) : 20);
        }
        const queueWithCovers = await attachPresignedCovers(tracks);
        res.json({ queue: queueWithCovers });
    }
    catch (err) {
        console.error("Error fetching queue:", err);
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
}
async function search(req, res) {
    try {
        const { q, limit } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Missing query parameter q' });
        }
        const tracks = await (0, db_service_1.searchMusic)(String(q), limit ? Number(limit) : 20);
        const resultsWithCovers = await attachPresignedCovers(tracks);
        res.json({ results: resultsWithCovers });
    }
    catch (err) {
        console.error("Error searching:", err);
        res.status(500).json({ error: 'Failed to search' });
    }
}
