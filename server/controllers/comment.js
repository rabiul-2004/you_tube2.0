import comment from "../Modals/comment.js";
import video from "../Modals/video.js";
import mongoose from "mongoose";
import checkComment from "../helpers/moderation.js";
import translate from "google-translate-api-x";

export const detectLanguage = async (text) => {
  try {
    const result = await Promise.race([
      translate(text, { to: "en" }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("detection timeout")), 6000)
      ),
    ]);
    return result?.from?.language?.iso || "";
  } catch {
    return "";
  }
};

export const postcomment = async (req, res) => {
  const { videoid, commentbody, showLocation } = req.body;
  if (!videoid || !mongoose.Types.ObjectId.isValid(videoid)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  const body = typeof commentbody === "string" ? commentbody.trim() : "";
  if (!body) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  const verdict = checkComment(body);
  if (!verdict.ok) {
    return res.status(400).json({ message: verdict.reason, code: "COMMENT_BLOCKED" });
  }
  try {
    const language = await detectLanguage(body);
    const postcomment = await comment.create({
      userid: req.user._id,
      videoid,
      commentbody: body,
      usercommented: req.user.name || req.user.channelname || "User",
      language,
      location: {
        city: req.user.lastCity || "",
        state: req.user.lastState || "",
      },
      showLocation: !!showLocation,
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
      const vid = await video.findById(found.videoid).select("uploader");
      if (!vid || vid.uploader !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "You can only delete your own comments" });
      }
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
  const body = typeof commentbody === "string" ? commentbody.trim() : "";
  if (!body) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }
  const verdict = checkComment(body);
  if (!verdict.ok) {
    return res.status(400).json({ message: verdict.reason, code: "COMMENT_BLOCKED" });
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
    const language = await detectLanguage(body);
    const updatecomment = await comment.findByIdAndUpdate(
      _id,
      {
        $set: { commentbody: body, language },
      },
      { new: true }
    );
    return res.status(200).json(updatecomment);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const getCommentWithVideoOwner = async (_id) => {
  const found = await comment.findById(_id);
  if (!found) return { error: 404 };
  const vid = await video.findById(found.videoid).select("uploader");
  if (!vid) return { error: 404 };
  return { commentDoc: found, uploaderId: vid.uploader.toString() };
};

export const toggleCommentLike = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }
  try {
    const found = await comment.findById(id);
    if (!found) {
      return res.status(404).json({ message: "Comment unavailable" });
    }
    const uid = req.user._id;
    if (found.likes.some((u) => u.toString() === uid.toString())) {
      await comment.findByIdAndUpdate(id, { $pull: { likes: uid } });
    } else {
      await comment.findByIdAndUpdate(id, {
        $addToSet: { likes: uid },
        $pull: { dislikes: uid },
      });
    }
    const updated = await comment.findById(id).select("likes dislikes");
    return res.status(200).json({
      likes: updated.likes.length,
      dislikes: updated.dislikes.length,
      liked: !found.likes.some((u) => u.toString() === uid.toString()),
      disliked: false,
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const toggleCommentDislike = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }
  try {
    const found = await comment.findById(id);
    if (!found) {
      return res.status(404).json({ message: "Comment unavailable" });
    }
    const uid = req.user._id;
    if (found.dislikes.some((u) => u.toString() === uid.toString())) {
      await comment.findByIdAndUpdate(id, { $pull: { dislikes: uid } });
    } else {
      await comment.findByIdAndUpdate(id, {
        $addToSet: { dislikes: uid },
        $pull: { likes: uid },
      });
    }
    const updated = await comment.findById(id).select("likes dislikes");
    return res.status(200).json({
      likes: updated.likes.length,
      dislikes: updated.dislikes.length,
      liked: false,
      disliked: !found.dislikes.some((u) => u.toString() === uid.toString()),
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const reportComment = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }
  try {
    const found = await comment.findById(id);
    if (!found) {
      return res.status(404).json({ message: "Comment unavailable" });
    }
    const uid = req.user._id;
    if (found.reports.some((r) => r.user?.toString() === uid.toString())) {
      return res
        .status(400)
        .json({ message: "You have already reported this comment" });
    }
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 300) : "";
    const updated = await comment.findByIdAndUpdate(
      id,
      {
        $push: { reports: { user: uid, reason, reportedon: new Date() } },
        $set: { isFlagged: true },
      },
      { new: true }
    ).select("reports isFlagged");
    return res.status(200).json({
      reported: true,
      flagged: updated.isFlagged,
      reportCount: updated.reports.length,
    });
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const translateComment = async (req, res) => {
  const { text, target = "en", source = "auto" } = req.body || {};
  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ message: "Nothing to translate" });
  }
  try {
    const result = await Promise.race([
      translate(text, { to: target, from: source }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("translation timeout")), 8000)
      ),
    ]);
    return res.status(200).json({
      translatedText: result.text,
      detectedSource:
        result.from?.language?.iso && result.from.language.iso !== source
          ? result.from.language.iso
          : source,
      target,
    });
  } catch (error) {
    console.error("Translation error:", error.message);
    return res.status(502).json({ message: "Translation failed. Try again." });
  }
};

export const getFlaggedComments = async (req, res) => {
  const { videoId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video" });
  }
  try {
    const vid = await video.findById(videoId).select("uploader");
    if (!vid) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (vid.uploader !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the video owner can review flagged comments" });
    }
    const flagged = await comment
      .find({ videoid: videoId, isFlagged: true })
      .populate("reports.user", "name image")
      .sort({ updatedAt: -1 });
    return res.status(200).json(flagged);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const approveComment = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Comment unavailable" });
  }
  try {
    const { error, commentDoc, uploaderId } = await getCommentWithVideoOwner(id);
    if (error) {
      return res.status(404).json({ message: "Comment unavailable" });
    }
    if (uploaderId !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only the video owner can moderate comments" });
    }
    const updated = await comment
      .findByIdAndUpdate(
        id,
        { $set: { isFlagged: false, reports: [] } },
        { new: true }
      )
      .select("_id isFlagged reports");
    return res.status(200).json(updated);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
