import { Router } from "express";
import { initSession, logPlay, getLastPlayed, getPrevious } from "../controllers/session.controller";

const router = Router();

router.post("/init", initSession);
router.post("/history", logPlay);
router.get("/last-played", getLastPlayed);
router.get("/previous", getPrevious);

export default router;
