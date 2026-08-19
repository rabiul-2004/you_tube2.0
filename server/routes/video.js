import express from "express";
import {
  getallvideo,
  getvideobyid,
  getvideoByChannel,
  uploadvideo,
  updatevideo,
  deletevideo,
  getUploadSignature,
} from "../controllers/video.js";
import { requireAuth, requireVerified } from "../middleware/auth.js";

const routes = express.Router();

routes.post("/upload-signature", requireAuth, getUploadSignature);
routes.post("/upload", requireAuth, requireVerified, uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/channel/:channelId", getvideoByChannel);
routes.patch("/:id", requireAuth, updatevideo);
routes.delete("/:id", requireAuth, deletevideo);
routes.get("/:id", getvideobyid);
export default routes;
