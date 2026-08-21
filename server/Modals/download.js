import mongoose from "mongoose";

const downloadSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    plan: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("download", downloadSchema);
