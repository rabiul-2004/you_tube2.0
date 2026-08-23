import express from "express";
import {
  deletecomment,
  getallcomment,
  postcomment,
  editcomment,
  toggleCommentLike,
  toggleCommentDislike,
  reportComment,
  translateComment,
  getFlaggedComments,
  approveComment,
} from "../controllers/comment.js";
import { requireAuth, requireVerified } from "../middleware/auth.js";

const routes = express.Router();
routes.post("/translate", requireAuth, translateComment);
routes.get("/flagged/:videoId", requireAuth, getFlaggedComments);
routes.post("/approve/:id", requireAuth, approveComment);
routes.post("/like/:id", requireAuth, toggleCommentLike);
routes.post("/dislike/:id", requireAuth, toggleCommentDislike);
routes.post("/report/:id", requireAuth, reportComment);
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", requireAuth, requireVerified, postcomment);
routes.delete("/deletecomment/:id", requireAuth, deletecomment);
routes.post("/editcomment/:id", requireAuth, editcomment);
export default routes;
