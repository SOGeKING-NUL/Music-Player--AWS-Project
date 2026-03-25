import { Router } from "express";
import { getCoverUrl, getSongUrl } from "../controllers/upload.controller";

const router= Router();

router.post('/song/presigned-url', getSongUrl);
router.post('/cover/presigned-url', getCoverUrl);

export default router;