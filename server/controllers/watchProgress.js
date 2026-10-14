import mongoose from "mongoose";
import watchProgress from "../Modals/watchProgress.js";
import { serializeVideo } from "../helpers/videoSerialize.js";

export const saveProgress = async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  const position = Number(req.body?.position);
  const duration = Number(req.body?.duration) || 0;
  if (isNaN(position) || position < 0) {
    return res.status(400).json({ message: "Invalid position" });
  }

  try {
    const doc = await watchProgress.findOneAndUpdate(
      { user: req.user._id, video: videoId },
      { $set: { position: Math.floor(position), duration: Math.floor(duration) } },
      { upsert: true, new: true }
    );
    res.json({ progress: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getProgress = async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    const doc = await watchProgress.findOne({
      user: req.user._id,
      video: videoId,
    });
    res.json({ progress: doc });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAllProgress = async (req, res) => {
  try {
    const docs = await watchProgress
      .find({ user: req.user._id })
      .populate("video", "videotitle filepath videochanel thumbnail duration isPremium uploader")
      .sort({ updatedAt: -1 });
    const serialized = docs.map((item) => {
      const obj = item.toObject();
      if (obj.video) obj.video = serializeVideo(obj.video, req.user);
      return obj;
    });
    res.json(serialized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
