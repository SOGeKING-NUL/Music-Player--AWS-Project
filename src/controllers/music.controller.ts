import { Request, Response } from "express";
import { saveArtist, saveAlbum } from "../services/db.service";

export async function addArtist(req: Request, res: Response) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Missing required field: name'
            });
        }

        const artist = await saveArtist(name);

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
        const { title, artistId, releaseYear, genre } = req.body;

        if (!title || !artistId) {
            return res.status(400).json({
                error: 'Missing required fields: title, artistId'
            });
        }

        const album = await saveAlbum(title, artistId, releaseYear, genre);

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
