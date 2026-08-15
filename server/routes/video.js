import express from "express";
import {
  getallvideo,
  getvideobyid,
  getvideoByChannel,
  uploadvideo,
} from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post("/upload", upload.single("file"), uploadvideo);
routes.get("/getall", getallvideo);
routes.get("/channel/:channelId", getvideoByChannel);
routes.get("/:id", getvideobyid);
export default routes;
