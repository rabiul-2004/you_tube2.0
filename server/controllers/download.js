import mongoose from "mongoose";
import download from "../Modals/download.js";

const DAILY_LIMITS = {
  Free: 1,
  Bronze: 3,
  Silver: 7,
  Gold: 15,
};

export const recordDownload = async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    const plan = req.user.plan || "Free";
    const limit = DAILY_LIMITS[plan] || 1;
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
    const plan = req.user.plan || "Free";
    const limit = DAILY_LIMITS[plan] || 1;
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

  try {
    const downloads = await download
      .find({ user: userId })
      .populate("video", "videotitle filepath videochanel views duration")
      .sort({ createdAt: -1 });

    res.json(downloads);
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
