import { Request, Response } from "express";
import { generateAlbumKey, generateSongKey, generateArtistImageKey } from "../utils/s3KeyGenerator";
import { getPresignedUrl } from "../services/s3.service";
import { saveSong, updateAlbumCover } from "../services/db.service";


export async function getSongUrl(req: Request, res: Response){
    try{
        const {artistId, albumId, songId, trackNumber, fileType} = req.body;

        if(!artistId || !albumId || !songId || !trackNumber || !fileType){
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

        const extension= fileType === 'audio/flac' ? 'flac' : 'mp3'; 

        const s3Key= generateSongKey(artistId, albumId, songId, extension);

        const url= await getPresignedUrl(s3Key, fileType);

        res.json({
            ...url,     //spread operator so url, s3key and expiresIn are all properties
            metadata: {
                artistId,
                albumId,
                songId,
                trackNumber
            }
        });
    }catch(err){
        console.error("Error while generating song URL:", err);
        res.status(500).json({error: "Failed to generate upload URL"});
    }
}

export async function getCoverUrl(req: Request, res: Response){
    try{
        const {artistId, albumId, fileType} = req.body;

        if(!artistId || !albumId || !fileType){
            return res.status(400).json({
                error: 'Missing required fields: artistId, albumId, fileType'
            });
        }

        const extension= fileType === 'image/jpeg' ? 'jpg' : 'png'; 

        const s3Key= generateAlbumKey(artistId, albumId, extension);

        const url= await getPresignedUrl(s3Key, fileType);

        res.json({
            ...url,
            metadata: {
                artistId,
                albumId
            }
        });
    }catch(err){
        console.error("Error while generating album cover URL:", err);
        res.status(500).json({error: "Failed to generate upload URL"});
    }
}

export async function confirmSongUpload(req: Request, res: Response) {
    try {
        const { title, artistId, albumId, trackNumber, s3AudioKey, durationSeconds } = req.body;

        if (!title || !artistId || !albumId || !trackNumber || !s3AudioKey) {
            return res.status(400).json({
                error: 'Missing required fields: title, artistId, albumId, trackNumber, s3AudioKey'
            });
        }

        const song = await saveSong( title, artistId, albumId, trackNumber, s3AudioKey, durationSeconds);

        res.json({
            success: true,
            songId: song.id,
            message: 'Song metadata saved successfully'
        });
    } catch (err: any) {
        console.error("Error confirming song upload:", err);
        
        if (err.code === '23505') {
            return res.status(409).json({
                error: 'Track number already exists for this album'
            });
        }
        
        res.status(500).json({ error: 'Failed to save song metadata' });
    }
}

export async function confirmCoverUpload(req: Request, res: Response) {
    try {
        const { albumId, s3CoverKey } = req.body;

        if (!albumId || !s3CoverKey) {
            return res.status(400).json({
                error: 'Missing required fields: albumId, s3CoverKey'
            });
        }

        await updateAlbumCover(albumId, s3CoverKey);

        res.json({
            success: true,
            message: 'Album cover saved successfully'
        });
    } catch (err) {
        console.error("Error confirming cover upload:", err);
        res.status(500).json({ error: 'Failed to save album cover' });
    }
}

export async function getArtistImageUrl(req: Request, res: Response){
    try{
        const {artistId, fileType} = req.body;

        if(!artistId || !fileType){
            return res.status(400).json({
                error: 'Missing required fields: artistId, fileType'
            });
        }

        const extension= fileType === 'image/jpeg' ? 'jpg' : 'png'; 

        const s3Key= generateArtistImageKey(artistId, extension);

        const url= await getPresignedUrl(s3Key, fileType);

        res.json({
            ...url,
            metadata: {
                artistId
            }
        });
    }catch(err){
        console.error("Error while generating artist image URL:", err);
        res.status(500).json({error: "Failed to generate upload URL"});
    }
}
