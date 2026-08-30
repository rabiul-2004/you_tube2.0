import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  channelImage: { type: String },
  coverImage: { type: String },
  joinedon: { type: Date, default: Date.now },
  plan: { type: String, default: "Free" },
  planDetails: {
    name: { type: String, default: "Free" },
    expiresAt: { type: Date, default: null },
  },
  theme: { type: String, enum: ["light", "dark", "auto"], default: "auto" },
  lastCity: { type: String, default: null },
  lastState: { type: String, default: null },
  lastDevice: { type: String, default: null },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  otpPurpose: { type: String, enum: [null, "login_verification"], default: null },
});

export default mongoose.model("user", userschema);
