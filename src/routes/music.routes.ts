import { Router } from "express";
import { addArtist, addAlbum } from "../controllers/music.controller";

const router = Router();

router.post('/artist', addArtist);
router.post('/album', addAlbum);

export default router;
