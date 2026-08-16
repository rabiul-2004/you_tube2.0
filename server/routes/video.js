import express from "express";
import {
  getallvideo,
  getvideobyid,
  getvideoByChannel,
  uploadvideo,
  updatevideo,
  deletevideo,
} from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";
import { requireAuth, requireVerified } from "../middleware/auth.js";

const routes = express.Router();

routes.post("/upload", requireAuth, requireVerified, upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/channel/:channelId", getvideoByChannel);
routes.patch("/:id", requireAuth, updatevideo);
routes.delete("/:id", requireAuth, deletevideo);
routes.get("/:id", getvideobyid);
export default routes;
