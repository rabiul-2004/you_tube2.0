import express from "express";
import {
  login,
  updateprofile,
  getuserbyid,
} from "../controllers/auth.js";
import { requireToken, requireAuth, requireVerified } from "../middleware/auth.js";
const routes = express.Router();

routes.post("/login", requireToken, login);
routes.get("/:id", getuserbyid);
routes.patch("/update/:id", requireAuth, requireVerified, updateprofile);
export default routes;
