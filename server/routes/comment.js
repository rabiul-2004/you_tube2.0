import express from "express";
import {
  deletecomment,
  getallcomment,
  postcomment,
  editcomment,
} from "../controllers/comment.js";
import { requireAuth, requireVerified } from "../middleware/auth.js";

const routes = express.Router();
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", requireAuth, requireVerified, postcomment);
routes.delete("/deletecomment/:id", requireAuth, deletecomment);
routes.post("/editcomment/:id", requireAuth, editcomment);
export default routes;
