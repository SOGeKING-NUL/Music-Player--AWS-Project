import { Request, Response } from "express";
import { saveArtist, saveAlbum, getAllArtists, getAlbumsByArtist, getSongsByAlbum, getRemainingAlbumQueue, getRandomQueue, searchMusic } from "../services/db.service";
import { getPresignedUrl, getStreamPresignedUrl } from "../services/s3.service";

export async function addArtist(req: Request, res: Response) {
    try {
        const { id, name, s3CoverKey } = req.body;

        if (!id || !name) {
            return res.status(400).json({
                error: 'Missing required fields: id, name'
            });
        }

        const artist = await saveArtist(id, name, s3CoverKey);

        res.json({
            success: true,
            artistId: artist.id,
            message: 'Artist added successfully'
        });
    } catch (err) {
        console.error("Error adding artist:", err);
        res.status(500).json({ error: 'Failed to add artist' });
    }
}

export async function addAlbum(req: Request, res: Response) {
    try {
        const { id, title, artistId, releaseYear, genre } = req.body;

        if (!id || !title || !artistId) {
            return res.status(400).json({
                error: 'Missing required fields: id, title, artistId'
            });
        }

        const album = await saveAlbum(id, title, artistId, releaseYear, genre);

        res.json({
            success: true,
            albumId: album.id,
            message: 'Album added successfully'
        });
    } catch (err: any) {
        console.error("Error adding album:", err);

        if (err.code === '23503') {
            return res.status(404).json({
                error: 'Artist not found'
            });
        }

        res.status(500).json({ error: 'Failed to add album' });
    }
}

export async function getArtists(req: Request, res: Response) {
    try {
        const artists = await getAllArtists();
        res.json({ artists });
    } catch (err) {
        console.error("Error fetching artists:", err);
        res.status(500).json({ error: 'Failed to fetch artists' });
    }
}

export async function getArtistAlbums(req: Request, res: Response) {
    try {
        const { artistId } = req.params as {artistId: string};
        const albums = await getAlbumsByArtist(artistId);
        res.json({ albums });
    } catch (err) {
        console.error("Error fetching albums:", err);
        res.status(500).json({ error: 'Failed to fetch albums' });
    }
}

export async function getAlbumSongs(req: Request, res: Response) {
    try {
        const { albumId } = req.params as {albumId: string};
        const songs = await getSongsByAlbum(albumId);
        res.json({ songs });
    } catch (err) {
        console.error("Error fetching songs:", err);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
}

async function attachPresignedCovers(tracks: any[]) {
    return Promise.all(tracks.map(async (track: any) => {
        if (track.album_cover_key) {
            try {
                const { streamUrl } = await getStreamPresignedUrl(track.album_cover_key, 3600);
                track.albumCoverUrl = streamUrl;
            } catch (err) {
                console.error("Presign error", err);
            }
        }
        return track;
    }));
}

export async function getQueue(req: Request, res: Response) {
    try {
        const { albumId, trackNumber, limit } = req.query;
        let tracks = [];

        if (albumId && trackNumber) {
            tracks = await getRemainingAlbumQueue(String(albumId), Number(trackNumber));
        } else {
            tracks = await getRandomQueue(limit ? Number(limit) : 20);
        }

        const queueWithCovers = await attachPresignedCovers(tracks);
        res.json({ queue: queueWithCovers });
    } catch (err) {
        console.error("Error fetching queue:", err);
        res.status(500).json({ error: 'Failed to fetch queue' });
    }
}

export async function search(req: Request, res: Response) {
    try {
        const { q, limit } = req.query;
        if (!q) {
             return res.status(400).json({ error: 'Missing query parameter q' });
        }

        const tracks = await searchMusic(String(q), limit ? Number(limit) : 20);
        const resultsWithCovers = await attachPresignedCovers(tracks);

        res.json({ results: resultsWithCovers });
    } catch (err) {
        console.error("Error searching:", err);
        res.status(500).json({ error: 'Failed to search' });
    }
}
