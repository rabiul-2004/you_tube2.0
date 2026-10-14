import video from "../Modals/video.js";
import history from "../Modals/history.js";
import mongoose from "mongoose";
import { ensureOwnsUser } from "../middleware/auth.js";
import { serializeVideo } from "../helpers/videoSerialize.js";

export const handlehistory = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  try {
    const target = await video.findById(videoId).select("_id duration");
    if (!target) {
      return res.status(404).json({ message: "Video not found" });
    }

    const existing = await history.findOne({ viewer: userId, videoid: videoId });
    const now = Date.now();
    // Count at most one view per cooldown window per user. The cooldown is at
    // least 30s and otherwise follows the video's length (capped at 1h), so a
    // script that replays this request cannot inflate the counter.
    const durationMs = (Number(target.duration) || 0) * 1000;
    const cooldownMs = Math.max(30_000, Math.min(durationMs, 60 * 60 * 1000));
    const shouldCount =
      !existing?.lastViewedAt ||
      now - new Date(existing.lastViewedAt).getTime() >= cooldownMs;

    await history.findOneAndUpdate(
      { viewer: userId, videoid: videoId },
      {
        $setOnInsert: { viewer: userId, videoid: videoId },
        $set: { lastViewedAt: new Date(now) },
      },
      { upsert: true }
    );

    if (shouldCount) {
      await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    }
    return res.status(200).json({ history: true, counted: shouldCount });
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
    // Hide premium stream URLs from users who aren't entitled to them.
    const serialized = historyvideo.map((item) => {
      const obj = item.toObject();
      if (obj.videoid) obj.videoid = serializeVideo(obj.videoid, req.user);
      return obj;
    });
    return res.status(200).json(serialized);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
