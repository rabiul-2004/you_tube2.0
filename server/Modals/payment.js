import mongoose from "mongoose";
const paymentschema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    razorpayOrderId: { type: String, required: true },
    paymentId: { type: String },
    plan: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "pending" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("payment", paymentschema);
