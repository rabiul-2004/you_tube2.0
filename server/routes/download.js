import express from "express";
import {
  recordDownload,
  getDownloadStatus,
  getDownloadHistory,
  deleteDownload,
} from "../controllers/download.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();

routes.get("/status/:videoId", requireAuth, getDownloadStatus);
routes.get("/history/:userId", requireAuth, getDownloadHistory);
routes.post("/:videoId", requireAuth, recordDownload);
routes.delete("/:downloadId", requireAuth, deleteDownload);

export default routes;
