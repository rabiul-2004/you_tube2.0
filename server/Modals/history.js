import mongoose from "mongoose";
const historyschema = mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    likedon: { type: Date, default: Date.now },
    // Last time this viewer's watch was counted toward the video's views.
    // Used to throttle view inflation (one "view" per cooldown per user).
    lastViewedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("history", historyschema);
