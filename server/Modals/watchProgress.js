import mongoose from "mongoose";

const watchProgressSchema = mongoose.Schema(
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
    position: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

watchProgressSchema.index({ user: 1, video: 1 }, { unique: true });

export default mongoose.model("watchprogress", watchProgressSchema);
