import { Request, Response } from "express";
import { saveArtist, saveAlbum, getAllArtists, getAlbumsByArtist, getSongsByAlbum } from "../services/db.service";

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
