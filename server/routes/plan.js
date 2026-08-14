import express from "express";
import {
  createOrder,
  verifyPayment,
  getPlanStatus,
} from "../controllers/plan.js";
const routes = express.Router();

routes.post("/create-order", createOrder);
routes.post("/verify", verifyPayment);
routes.get("/status/:userId", getPlanStatus);
export default routes;
