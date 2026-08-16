import express from "express";
import {
  createOrder,
  verifyPayment,
  getPlanStatus,
} from "../controllers/plan.js";
import { requireAuth } from "../middleware/auth.js";
const routes = express.Router();

routes.post("/create-order", requireAuth, createOrder);
routes.post("/verify", requireAuth, verifyPayment);
routes.get("/status/:userId", requireAuth, getPlanStatus);
export default routes;
