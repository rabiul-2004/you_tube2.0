import express from "express";
import {
  handlelike,
  handledislike,
  deletelike,
  getallLikedVideo,
} from "../controllers/like.js";

const routes = express.Router();
routes.get("/:userId", getallLikedVideo);
routes.post("/dislike/:videoId", handledislike);
routes.post("/:videoId", handlelike);
routes.delete("/remove/:likeId", deletelike);
export default routes;
