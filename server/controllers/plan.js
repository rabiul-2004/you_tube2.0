import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import users from "../Modals/Auth.js";
import payment from "../Modals/payment.js";
import { sendInvoiceEmail } from "../helpers/email.js";

const PLANS = {
  Bronze: { amount: 100, currency: "INR", durationDays: 30 },
  Silver: { amount: 200, currency: "INR", durationDays: 30 },
  Gold: { amount: 300, currency: "INR", durationDays: 30 },
};

let razorpay = null;
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const error = new Error("Razorpay keys missing in server/.env");
    error.status = 500;
    throw error;
  }
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

export const hasActivePaidPlan = (user) => {
  return (
    user &&
    user.plan &&
    user.plan !== "Free" &&
    user.planDetails &&
    user.planDetails.expiresAt &&
    new Date(user.planDetails.expiresAt) > new Date()
  );
};

export const createOrder = async (req, res) => {
  const { plan } = req.body;
  const userId = req.user._id;
  if (!PLANS[plan]) {
    return res.status(400).json({ message: "Invalid plan" });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user" });
  }
  const planConfig = PLANS[plan];
  try {
    const order = await getRazorpay().orders.create({
      amount: planConfig.amount,
      currency: planConfig.currency,
      receipt: `receipt_${userId}`,
      notes: { plan },
    });
    await payment.create({
      user: userId,
      razorpayOrderId: order.id,
      plan,
      amount: planConfig.amount,
      status: "created",
    });
    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Failed to create order" });
  }
};

export const verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature, plan } = req.body;
  const userId = req.user._id;
  if (!PLANS[plan]) {
    return res.status(400).json({ message: "Invalid plan" });
  }
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    const sigBuf = Buffer.from(signature || "", "utf8");
    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return res.status(400).json({ message: "Invalid signature" });
    }
  } catch {
    return res.status(400).json({ message: "Invalid signature" });
  }
  try {
    const payDoc = await payment.findOne({
      razorpayOrderId: orderId,
      user: userId,
    });
    if (!payDoc) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (payDoc.status === "paid") {
      return res
        .status(200)
        .json({ success: true, emailSent: false, message: "Already verified" });
    }
    if (payDoc.plan !== plan) {
      return res
        .status(400)
        .json({ message: "Plan does not match the paid order" });
    }
    await payment.findByIdAndUpdate(payDoc._id, {
      $set: { paymentId, status: "paid" },
    });
    const expiresAt = new Date(
      Date.now() + PLANS[plan].durationDays * 24 * 3600 * 1000
    );
    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        $set: {
          plan,
          "planDetails.name": plan,
          "planDetails.expiresAt": expiresAt,
        },
      },
      { new: true }
    );
    let emailSent = false;
    if (updatedUser?.email) {
      try {
        await sendInvoiceEmail({
          to: updatedUser.email,
          name: updatedUser.name || updatedUser.email,
          plan,
          amountPaise: payDoc.amount,
          paymentId,
          orderId,
          expiresAt,
        });
        emailSent = true;
      } catch (error) {
        console.error("Invoice email failed (check SMTP config):", error.message);
      }
    }
    return res
      .status(200)
      .json({ success: true, emailSent, user: updatedUser });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getPlanStatus = async (req, res) => {
  const { userId } = req.params;
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user" });
  }
  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      plan: user.plan,
      expiresAt: user.planDetails.expiresAt,
      active: hasActivePaidPlan(user),
    });
  } catch (error) {
    console.error("getPlanStatus error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
