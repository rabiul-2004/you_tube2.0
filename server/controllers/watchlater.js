import watchlater from "../Modals/watchlater.js";
import mongoose from "mongoose";

export const handlewatchlater = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  try {
    const removed = await watchlater.findOneAndDelete({ viewer: userId, videoid: videoId });
    if (removed) {
      return res.status(200).json({ watchlater: false });
    }
    await watchlater.findOneAndUpdate(
      { viewer: userId, videoid: videoId },
      { $setOnInsert: { viewer: userId, videoid: videoId } },
      { upsert: true, new: true }
    );
    return res.status(200).json({ watchlater: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletewatchlater = async (req, res) => {
  const { watchlaterId } = req.params;
  try {
    const deleted = await watchlater.findById(watchlaterId);
    if (!deleted) {
      return res.status(404).json({ message: "Watch later not found" });
    }
    if (deleted.viewer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only remove your own items" });
    }
    await watchlater.findByIdAndDelete(watchlaterId);
    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallwatchlater = async (req, res) => {
  const { userId } = req.params;
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const watchlatervideo = await watchlater
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(watchlatervideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
