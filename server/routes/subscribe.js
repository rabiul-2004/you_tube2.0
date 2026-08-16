import express from "express";
import {
  togglesubscribe,
  getsubscriberinfo,
  getsubscribedchannels,
} from "../controllers/subscribe.js";
import { requireAuth } from "../middleware/auth.js";

const routes = express.Router();
routes.post("/:channelId", requireAuth, togglesubscribe);
routes.get("/channels/:userId", requireAuth, getsubscribedchannels);
routes.get("/:channelId", getsubscriberinfo);
export default routes;
