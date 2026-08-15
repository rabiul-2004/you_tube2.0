import express from "express";
import {
  togglesubscribe,
  getsubscriberinfo,
  getsubscribedchannels,
} from "../controllers/subscribe.js";

const routes = express.Router();
routes.post("/:channelId", togglesubscribe);
routes.get("/channels/:userId", getsubscribedchannels);
routes.get("/:channelId", getsubscriberinfo);
export default routes;
