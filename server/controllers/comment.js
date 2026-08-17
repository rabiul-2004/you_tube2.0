import comment from "../Modals/comment.js";
import mongoose from "mongoose";

export const postcomment = async (req, res) => {
  const { videoid, commentbody } = req.body;
  if (!videoid || !mongoose.Types.ObjectId.isValid(videoid)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  if (!commentbody || !commentbody.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  try {
    const postcomment = await comment.create({
      userid: req.user._id,
      videoid,
      commentbody,
      usercommented: req.user.name || req.user.channelname || "User",
    });
    return res.status(200).json(postcomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const commentvideo = await comment.find({ videoid: videoid });
    return res.status(200).json(commentvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }
  try {
    const found = await comment.findById(_id);
    if (!found) {
      return res.status(404).json({ message: "Comment unavailable" });
    }
    if (found.userid.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }
  if (!commentbody || !commentbody.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  try {
    const found = await comment.findById(_id);
    if (!found) {
      return res.status(404).json({ message: "Comment unavailable" });
    }
    if (found.userid.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own comments" });
    }
    const updatecomment = await comment.findByIdAndUpdate(
      _id,
      {
        $set: { commentbody: commentbody },
      },
      { new: true }
    );
    res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
