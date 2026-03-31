import { Router } from "express";
import { addArtist, addAlbum, getArtists, getArtistAlbums, getAlbumSongs } from "../controllers/music.controller";

const router = Router();

router.post('/artist', addArtist);
router.post('/album', addAlbum);
router.get('/artists', getArtists);
router.get('/artist/:artistId/albums', getArtistAlbums);
router.get('/album/:albumId/songs', getAlbumSongs);

export default router;
