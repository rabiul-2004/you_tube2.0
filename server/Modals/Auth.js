import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  plan: { type: String, default: "Free" },
  planDetails: {
    name: { type: String, default: "Free" },
    expiresAt: { type: Date, default: null },
  },
});

export default mongoose.model("user", userschema);
