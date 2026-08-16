import express from "express";
import {
  getallwatchlater,
  handlewatchlater,
  deletewatchlater,
} from "../controllers/watchlater.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();
routes.get("/:userId", requireAuth, getallwatchlater);
routes.post("/:videoId", requireAuth, handlewatchlater);
routes.delete("/remove/:watchlaterId", requireAuth, deletewatchlater);
export default routes;
