"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSongUrl = getSongUrl;
exports.getStreamUrl = getStreamUrl;
exports.getCoverUrl = getCoverUrl;
exports.confirmSongUpload = confirmSongUpload;
exports.confirmCoverUpload = confirmCoverUpload;
exports.getArtistImageUrl = getArtistImageUrl;
const s3KeyGenerator_1 = require("../utils/s3KeyGenerator");
const s3_service_1 = require("../services/s3.service");
const db_service_1 = require("../services/db.service");
async function getSongUrl(req, res) {
    try {
        const { artistId, albumId, songId, trackNumber, fileType } = req.body;
        if (!artistId || !albumId || !songId || !trackNumber || !fileType) {
            return res.status(400).json({
                error: 'Missing required fields: artistId, albumId, songId, trackNumber, fileType'
            });
        }
        // Validate track number
        if (trackNumber < 1) {
            return res.status(400).json({
                error: 'trackNumber must be a positive integer'
            });
        }
        const extension = fileType === 'audio/flac' ? 'flac' : 'mp3';
        const s3Key = (0, s3KeyGenerator_1.generateSongKey)(artistId, albumId, songId, extension);
        const url = await (0, s3_service_1.getPresignedUrl)(s3Key, fileType);
        res.json({
            ...url, //spread operator so url, s3key and expiresIn are all properties
            metadata: {
                artistId,
                albumId,
                songId,
                trackNumber
            }
        });
    }
    catch (err) {
        console.error("Error while generating song URL:", err);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
}
async function getStreamUrl(req, res) {
    try {
        const { s3AudioKey } = req.body;
        if (!s3AudioKey) {
            return res.status(400).json({
                error: 'Missing required field: s3AudioKey'
            });
        }
        const url = await (0, s3_service_1.getStreamPresignedUrl)(s3AudioKey);
        res.json({
            ...url
        });
    }
    catch (err) {
        console.error("Error while generating stream URL:", err);
        res.status(500).json({ error: "Failed to generate stream URL" });
    }
}
async function getCoverUrl(req, res) {
    try {
        const { artistId, albumId, fileType } = req.body;
        if (!artistId || !albumId || !fileType) {
            return res.status(400).json({
                error: 'Missing required fields: artistId, albumId, fileType'
            });
        }
        const extension = fileType === 'image/jpeg' ? 'jpg' : 'png';
        const s3Key = (0, s3KeyGenerator_1.generateAlbumKey)(artistId, albumId, extension);
        const url = await (0, s3_service_1.getPresignedUrl)(s3Key, fileType);
        res.json({
            ...url,
            metadata: {
                artistId,
                albumId
            }
        });
    }
    catch (err) {
        console.error("Error while generating album cover URL:", err);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
}
async function confirmSongUpload(req, res) {
    try {
        const { title, artistId, albumId, trackNumber, s3AudioKey, durationSeconds } = req.body;
        if (!title || !artistId || !albumId || !trackNumber || !s3AudioKey) {
            return res.status(400).json({
                error: 'Missing required fields: title, artistId, albumId, trackNumber, s3AudioKey'
            });
        }
        const song = await (0, db_service_1.saveSong)(title, artistId, albumId, trackNumber, s3AudioKey, durationSeconds);
        res.json({
            success: true,
            songId: song.id,
            message: 'Song metadata saved successfully'
        });
    }
    catch (err) {
        console.error("Error confirming song upload:", err);
        if (err.code === '23505') {
            return res.status(409).json({
                error: 'Track number already exists for this album'
            });
        }
        res.status(500).json({ error: 'Failed to save song metadata' });
    }
}
async function confirmCoverUpload(req, res) {
    try {
        const { albumId, s3CoverKey } = req.body;
        if (!albumId || !s3CoverKey) {
            return res.status(400).json({
                error: 'Missing required fields: albumId, s3CoverKey'
            });
        }
        await (0, db_service_1.updateAlbumCover)(albumId, s3CoverKey);
        res.json({
            success: true,
            message: 'Album cover saved successfully'
        });
    }
    catch (err) {
        console.error("Error confirming cover upload:", err);
        res.status(500).json({ error: 'Failed to save album cover' });
    }
}
async function getArtistImageUrl(req, res) {
    try {
        const { artistId, fileType } = req.body;
        if (!artistId || !fileType) {
            return res.status(400).json({
                error: 'Missing required fields: artistId, fileType'
            });
        }
        const extension = fileType === 'image/jpeg' ? 'jpg' : 'png';
        const s3Key = (0, s3KeyGenerator_1.generateArtistImageKey)(artistId, extension);
        const url = await (0, s3_service_1.getPresignedUrl)(s3Key, fileType);
        res.json({
            ...url,
            metadata: {
                artistId
            }
        });
    }
    catch (err) {
        console.error("Error while generating artist image URL:", err);
        res.status(500).json({ error: "Failed to generate upload URL" });
    }
}
