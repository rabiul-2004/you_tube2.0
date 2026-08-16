import mongoose from "mongoose";
import path from "path";
import { unlink } from "fs/promises";
import video from "../Modals/video.js";
import like from "../Modals/like.js";
import dislike from "../Modals/dislike.js";
import comment from "../Modals/comment.js";
import watchlater from "../Modals/watchlater.js";
import history from "../Modals/history.js";

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(404)
      .json({ message: "plz upload a mp4 video file only" });
  } else {
    try {
      const file = new video({
        videotitle: req.body.videotitle,
        filename: req.file.originalname,
        filepath: req.file.path.split(path.sep).join("/"),
        filetype: req.file.mimetype,
        filesize: req.file.size,
        videochanel: req.user.channelname || req.user.name || "",
        uploader: req.user._id.toString(),
        isPremium: req.body.isPremium === "true" || req.body.isPremium === true,
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getvideobyid = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Video not found" });
  }
  try {
    const file = await video.findById(id);
    if (!file) {
      return res.status(404).json({ message: "Video not found" });
    }
    return res.status(200).json(file);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getvideoByChannel = async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res.status(400).json({ message: "Invalid channel" });
  }
  try {
    const files = await video
      .find({ uploader: channelId })
      .sort({ createdAt: -1 });
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const updatevideo = async (req, res) => {
  const { id } = req.params;
  const { videotitle, isPremium } = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Video not found" });
  }
  try {
    const file = await video.findById(id);
    if (!file) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (file.uploader !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own videos" });
    }
    const updatedfile = await video.findByIdAndUpdate(
      id,
      {
        $set: {
          videotitle: videotitle,
          isPremium: isPremium === "true" || isPremium === true,
        },
      },
      { new: true }
    );
    return res.status(200).json(updatedfile);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const deletevideo = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Video not found" });
  }
  try {
    const file = await video.findById(id);
    if (!file) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (file.uploader !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own videos" });
    }
    try {
      if (file.filepath) {
        await unlink(file.filepath);
      }
    } catch (err) {
      console.error(" file delete error:", err);
    }
    await video.findByIdAndDelete(id);
    await like.deleteMany({ videoid: id });
    await dislike.deleteMany({ videoid: id });
    await comment.deleteMany({ videoid: id });
    await watchlater.deleteMany({ videoid: id });
    await history.deleteMany({ videoid: id });
    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
