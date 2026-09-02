import mongoose from "mongoose";
import subscription from "../Modals/subscription.js";
import { ensureOwnsUser } from "../middleware/auth.js";

export const togglesubscribe = async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !mongoose.Types.ObjectId.isValid(channelId)
  ) {
    return res.status(400).json({ message: "Invalid user or channel" });
  }
  if (userId.toString() === channelId) {
    return res.status(400).json({ message: "You cannot subscribe to yourself" });
  }
  try {
    const removed = await subscription.findOneAndDelete({
      subscriber: userId,
      channel: channelId,
    });
    if (removed) {
      const count = await subscription.countDocuments({ channel: channelId });
      return res.status(200).json({ subscribed: false, count });
    }
    await subscription.findOneAndUpdate(
      { subscriber: userId, channel: channelId },
      { $setOnInsert: { subscriber: userId, channel: channelId } },
      { upsert: true, new: true }
    );
    const count = await subscription.countDocuments({ channel: channelId });
    return res.status(200).json({ subscribed: true, count });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getsubscriberinfo = async (req, res) => {
  const { channelId } = req.params;
  const { userId } = req.query;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ message: "Invalid channel" });
  }
  try {
    const count = await subscription.countDocuments({ channel: channelId });
    let subscribed = false;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const sub = await subscription.findOne({
        subscriber: userId,
        channel: channelId,
      });
      subscribed = !!sub;
    }
    return res.status(200).json({ count, subscribed });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getsubscribedchannels = async (req, res) => {
  const { userId } = req.params;
  if (!ensureOwnsUser(req, res, userId)) return;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user" });
  }
  try {
    const subs = await subscription
      .find({ subscriber: userId })
      .populate({
        path: "channel",
        model: "user",
      })
      .exec();
    return res.status(200).json(subs);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
