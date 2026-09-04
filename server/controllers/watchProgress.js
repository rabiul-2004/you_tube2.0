import mongoose from "mongoose";
import watchProgress from "../Modals/watchProgress.js";

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
      .populate("video", "videotitle filepath videochanel thumbnail duration")
      .sort({ updatedAt: -1 });
    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
