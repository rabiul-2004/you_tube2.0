import video from "../Modals/video.js";
import history from "../Modals/history.js";
import mongoose from "mongoose";
import { ensureOwnsUser } from "../middleware/auth.js";

export const handlehistory = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  try {
    await history.findOneAndUpdate(
      { viewer: userId, videoid: videoId },
      {
        $setOnInsert: { viewer: userId, videoid: videoId },
      },
      { upsert: true }
    );
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ history: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletehistory = async (req, res) => {
  const { historyId } = req.params;
  try {
    const found = await history.findById(historyId);
    if (!found) {
      return res.status(404).json({ message: "History not found" });
    }
    if (found.viewer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own history" });
    }
    await history.findByIdAndDelete(historyId);
    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;
  if (!ensureOwnsUser(req, res, userId)) return;
  try {
    const historyvideo = await history
      .find({ viewer: userId })
      .sort({ updatedAt: -1 })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(historyvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
