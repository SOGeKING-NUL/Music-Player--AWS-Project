import { Router } from "express";
import { getCoverUrl, getSongUrl, getArtistImageUrl, confirmSongUpload, confirmCoverUpload, getStreamUrl } from "../controllers/upload.controller";

const router= Router();

router.post('/stream/url', getStreamUrl);
router.post('/song/presigned-url', getSongUrl);
router.post('/cover/presigned-url', getCoverUrl);
router.post('/artist/presigned-url', getArtistImageUrl);
router.post('/song/confirm', confirmSongUpload);
router.post('/cover/confirm', confirmCoverUpload);

export default router;