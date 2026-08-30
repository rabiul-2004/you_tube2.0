import mongoose from "mongoose";
import video from "../Modals/video.js";
import like from "../Modals/like.js";
import dislike from "../Modals/dislike.js";
import comment from "../Modals/comment.js";
import watchlater from "../Modals/watchlater.js";
import history from "../Modals/history.js";
import { generateVideoSignature, deleteFromCloudinary } from "../helpers/cloudinary.js";

export const getUploadSignature = async (req, res) => {
  try {
    const sig = generateVideoSignature();
    return res.status(200).json(sig);
  } catch (error) {
    console.error("Signature error:", error);
    return res.status(500).json({ message: "Failed to generate upload signature" });
  }
};

export const uploadvideo = async (req, res) => {
  const { videotitle, videochanel, uploader, isPremium, filepath, filename, filetype, filesize, duration, description, thumbnail } = req.body;
  if (!filepath || !filepath.startsWith("http")) {
    return res.status(400).json({ message: "Invalid video URL" });
  }
  if (thumbnail && !/^https?:\/\//i.test(thumbnail)) {
    return res.status(400).json({ message: "Invalid thumbnail URL" });
  }
  try {
    const file = new video({
      videotitle,
      filename: filename || "video",
      filepath,
      filetype: filetype || "video/mp4",
      filesize: filesize || "0",
      videochanel: req.user.channelname || req.user.name || videochanel || "",
      videochanelImage: req.user.channelImage || "",
      uploader: req.user._id.toString(),
      description:
        typeof description === "string" ? description.trim().slice(0, 5000) : "",
      thumbnail: typeof thumbnail === "string" ? thumbnail : "",
      isPremium: isPremium === "true" || isPremium === true,
      duration: Number(duration) || 0,
    });
    await file.save();
    return res.status(201).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
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
  const { videotitle, isPremium, description, thumbnail } = req.body;
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
    if (thumbnail && !/^https?:\/\//i.test(thumbnail)) {
      return res.status(400).json({ message: "Invalid thumbnail URL" });
    }
    const updateFields = {};
    if (videotitle !== undefined) updateFields.videotitle = videotitle;
    if (isPremium !== undefined)
      updateFields.isPremium = isPremium === "true" || isPremium === true;
    if (description !== undefined)
      updateFields.description = String(description).trim().slice(0, 5000);
    let oldThumbnail = null;
    if (thumbnail !== undefined && thumbnail !== file.thumbnail) {
      updateFields.thumbnail = thumbnail;
      oldThumbnail = file.thumbnail;
    }
    const updatedfile = await video.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );
    if (oldThumbnail) await deleteFromCloudinary(oldThumbnail, "image");
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
    await deleteFromCloudinary(file.filepath);
    if (file.thumbnail) await deleteFromCloudinary(file.thumbnail, "image");
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
