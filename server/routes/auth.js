import express from "express";
import {
  login,
  updateprofile,
  getuserbyid,
  verifyOtp,
  getTheme,
  setTheme,
} from "../controllers/auth.js";
import { requireToken, requireAuth, requireVerified } from "../middleware/auth.js";
const routes = express.Router();

routes.post("/login", requireToken, login);
routes.post("/verify-otp", verifyOtp);
routes.get("/theme/:userId", requireAuth, getTheme);
routes.put("/theme/:userId", requireAuth, setTheme);
routes.get("/:id", getuserbyid);
routes.patch("/update/:id", requireAuth, requireVerified, updateprofile);
export default routes;
