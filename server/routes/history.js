import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  deletehistory,
} from "../controllers/history.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();
routes.get("/:userId", requireAuth, getallhistoryVideo);
routes.post("/:videoId", requireAuth, handlehistory);
routes.delete("/remove/:historyId", requireAuth, deletehistory);
export default routes;
