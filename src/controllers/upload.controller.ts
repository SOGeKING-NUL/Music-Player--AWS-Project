import { Request, Response } from "express";
import { generateAlbumKey, generateSongKey } from "../utils/s3KeyGenerator";
import { getPresignedUrl } from "../services/s3.service";


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

        // Include metadata in response
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
