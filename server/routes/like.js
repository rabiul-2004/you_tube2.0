import express from "express";
import {
  handlelike,
  handledislike,
  deletelike,
  getallLikedVideo,
} from "../controllers/like.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();
routes.get("/:userId", requireAuth, getallLikedVideo);
routes.post("/dislike/:videoId", requireAuth, handledislike);
routes.post("/:videoId", requireAuth, handlelike);
routes.delete("/remove/:likeId", requireAuth, deletelike);
export default routes;
