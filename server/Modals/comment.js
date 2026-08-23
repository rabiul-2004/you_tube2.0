import mongoose from "mongoose";
const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
    commentedon: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
        reason: { type: String, default: "" },
        reportedon: { type: Date, default: Date.now },
      },
    ],
    isFlagged: { type: Boolean, default: false },
    language: { type: String, default: "" },
    location: {
      city: { type: String, default: "" },
      state: { type: String, default: "" },
    },
    showLocation: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
