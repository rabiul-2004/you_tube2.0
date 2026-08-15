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

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/channel/:channelId", getvideoByChannel);
routes.patch("/:id", updatevideo);
routes.delete("/:id", deletevideo);
routes.get("/:id", getvideobyid);
export default routes;
