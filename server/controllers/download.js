import mongoose from "mongoose";
import download from "../Modals/download.js";
import video from "../Modals/video.js";
import { ensureOwnsUser } from "../middleware/auth.js";
import { hasActivePaidPlan, getEffectivePlan, getDailyDownloadLimit } from "../helpers/plan.js";
import { serializeVideo } from "../helpers/videoSerialize.js";

export const recordDownload = async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    const target = await video.findById(videoId).select("isPremium");
    if (!target) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (target.isPremium && !hasActivePaidPlan(req.user)) {
      return res
        .status(403)
        .json({ message: "Upgrade to a paid plan to download premium videos" });
    }

    const plan = getEffectivePlan(req.user);
    const limit = getDailyDownloadLimit(req.user);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await download.countDocuments({
      user: req.user._id,
      createdAt: { $gte: todayStart },
    });

    if (todayCount >= limit) {
      return res.status(403).json({
        message: "Daily download limit reached",
        limit,
        used: todayCount,
      });
    }

    const doc = await download.create({
      user: req.user._id,
      video: videoId,
      plan,
    });

    res.status(201).json({
      download: doc,
      remaining: limit - todayCount - 1,
      limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getDownloadStatus = async (req, res) => {
  try {
    const plan = getEffectivePlan(req.user);
    const limit = getDailyDownloadLimit(req.user);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await download.countDocuments({
      user: req.user._id,
      createdAt: { $gte: todayStart },
    });

    res.json({
      plan,
      limit,
      used: todayCount,
      remaining: Math.max(0, limit - todayCount),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getDownloadHistory = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }
  if (!ensureOwnsUser(req, res, userId)) return;
  try {
    const downloads = await download
      .find({ user: userId })
      .populate("video", "videotitle filepath videochanel views duration isPremium uploader")
      .sort({ createdAt: -1 });

    // A user who downloaded premium content while subscribed, then downgraded,
    // must not keep a usable stream URL — hide it like everywhere else.
    const serialized = downloads.map((item) => {
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

export const deleteDownload = async (req, res) => {
  const { downloadId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(downloadId)) {
    return res.status(400).json({ message: "Invalid download ID" });
  }

  try {
    const doc = await download.findOneAndDelete({
      _id: downloadId,
      user: req.user._id,
    });

    if (!doc) {
      return res.status(404).json({ message: "Download not found" });
    }

    res.json({ message: "Download removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
