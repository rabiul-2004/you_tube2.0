import mongoose from "mongoose";
import video from "../Modals/video.js";
import like from "../Modals/like.js";
import dislike from "../Modals/dislike.js";

export const handlelike = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  try {
    const removed = await like.findOneAndDelete({ viewer: userId, videoid: videoId });
    if (removed) {
      await video.findByIdAndUpdate(videoId, { $inc: { Like: -1 } });
      const removedDislike = await dislike.findOneAndDelete({ viewer: userId, videoid: videoId });
      if (removedDislike) {
        await video.findByIdAndUpdate(videoId, { $inc: { Dislike: -1 } });
      }
      return res.status(200).json({ liked: false });
    }
    const created = await like.findOneAndUpdate(
      { viewer: userId, videoid: videoId },
      { $setOnInsert: { viewer: userId, videoid: videoId } },
      { upsert: true, new: true, rawResult: true }
    );
    if (!created.lastErrorObject?.updatedExisting) {
      const removedDislike = await dislike.findOneAndDelete({ viewer: userId, videoid: videoId });
      const inc = { Like: 1 };
      if (removedDislike) inc.Dislike = -1;
      await video.findByIdAndUpdate(videoId, { $inc: inc });
    }
    return res.status(200).json({ liked: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const handledislike = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  try {
    const removed = await dislike.findOneAndDelete({ viewer: userId, videoid: videoId });
    if (removed) {
      await video.findByIdAndUpdate(videoId, { $inc: { Dislike: -1 } });
      const removedLike = await like.findOneAndDelete({ viewer: userId, videoid: videoId });
      if (removedLike) {
        await video.findByIdAndUpdate(videoId, { $inc: { Like: -1 } });
      }
      return res.status(200).json({ disliked: false });
    }
    const created = await dislike.findOneAndUpdate(
      { viewer: userId, videoid: videoId },
      { $setOnInsert: { viewer: userId, videoid: videoId } },
      { upsert: true, new: true, rawResult: true }
    );
    if (!created.lastErrorObject?.updatedExisting) {
      const removedLike = await like.findOneAndDelete({ viewer: userId, videoid: videoId });
      const inc = { Dislike: 1 };
      if (removedLike) inc.Like = -1;
      await video.findByIdAndUpdate(videoId, { $inc: inc });
    }
    return res.status(200).json({ disliked: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletelike = async (req, res) => {
  const { likeId } = req.params;
  try {
    const deleted = await like.findById(likeId);
    if (!deleted) {
      return res.status(404).json({ message: "Like not found" });
    }
    if (deleted.viewer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only remove your own likes" });
    }
    await like.findByIdAndDelete(likeId);
    await video.findByIdAndUpdate(deleted.videoid, { $inc: { Like: -1 } });
    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallLikedVideo = async (req, res) => {
  const { userId } = req.params;
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const likevideo = await like
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(likevideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getLikeStatus = async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  try {
    const liked = await like.findOne({ viewer: userId, videoid: videoId });
    const disliked = await dislike.findOne({ viewer: userId, videoid: videoId });
    return res.status(200).json({ liked: !!liked, disliked: !!disliked });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
