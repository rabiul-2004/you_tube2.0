import express from "express";
import {
  saveProgress,
  getProgress,
  getAllProgress,
} from "../controllers/watchProgress.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();

routes.get("/all", requireAuth, getAllProgress);
routes.post("/:videoId", requireAuth, saveProgress);
routes.get("/:videoId", requireAuth, getProgress);

export default routes;
