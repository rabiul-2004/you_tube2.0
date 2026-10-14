import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import { generateOTP, sendOtpEmail, hashOtp, verifyOtpHash } from "../helpers/email.js";
import { deleteFromCloudinary, userFolder } from "../helpers/cloudinary.js";
import { ensureOwnsUser } from "../middleware/auth.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getISTHour = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const istMs = utcMs + IST_OFFSET_MS;
  return new Date(istMs).getHours();
};

// Device identity derived SERVER-SIDE from the request, so a client cannot
// dodge the new-device OTP challenge by simply omitting a body field. We use
// the same 50-char prefix the client used to store, so existing accounts don't
// all get a one-time OTP challenge after this change.
const deriveDevice = (req) =>
  String(req.headers["user-agent"] || "unknown").slice(0, 50);

export const getDefaultTheme = () => {
  const hour = getISTHour();
  return hour >= 10 && hour < 12 ? "light" : "dark";
};

export const login = async (req, res) => {
  const { email, name, picture, firebaseUid } = req.auth;
  const { city, state } = req.body || {};
  const device = deriveDevice(req);

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({
        email,
        name,
        image: picture,
        firebaseUid,
        theme: getDefaultTheme(),
        lastCity: city || null,
        lastState: state || null,
        lastDevice: device || null,
      });
      return res.status(201).json({ result: newUser, otpRequired: false });
    }

    if (!existingUser.firebaseUid && firebaseUid) {
      existingUser.firebaseUid = firebaseUid;
    }
    if (name && existingUser.name !== name) {
      existingUser.name = name;
    }
    if (picture && existingUser.image !== picture) {
      existingUser.image = picture;
    }

    // A change of city/state/device triggers an OTP challenge. A MISSING value
    // (while one was previously known) also counts as suspicious, so a caller
    // can't bypass the check by simply omitting these fields.
    const isNewLocation = !!existingUser.lastCity && city !== existingUser.lastCity;
    const isNewState = !!existingUser.lastState && state !== existingUser.lastState;
    const isNewDevice = !!existingUser.lastDevice && device !== existingUser.lastDevice;

    if ((isNewLocation || isNewState || isNewDevice) && existingUser.email) {
      const otp = generateOTP();
      existingUser.otp = hashOtp(otp);
      existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      existingUser.otpPurpose = "login_verification";
      existingUser.otpAttempts = 0;
      await existingUser.save();

      let otpSent = true;
      try {
        await sendOtpEmail({
          to: existingUser.email,
          name: existingUser.name,
          otp,
          city,
          state,
        });
      } catch (emailErr) {
        otpSent = false;
        console.error("OTP email failed:", emailErr.message);
      }

      return res.status(200).json({
        result: { _id: existingUser._id, email: existingUser.email, name: existingUser.name },
        otpRequired: true,
        otpSent,
        message: otpSent
          ? "New device/location detected. OTP sent to your email."
          : "New device/location detected, but the OTP email could not be sent. Please try again.",
      });
    }

    existingUser.lastCity = city || existingUser.lastCity;
    existingUser.lastState = state || existingUser.lastState;
    existingUser.lastDevice = device || existingUser.lastDevice;
    existingUser.otp = null;
    existingUser.otpExpiry = null;
    existingUser.otpPurpose = null;
    existingUser.otpAttempts = 0;

    if (existingUser.isModified()) {
      await existingUser.save();
    }
    return res.status(200).json({ result: existingUser, otpRequired: false });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const OTP_MAX_ATTEMPTS = 5;

export const verifyOtp = async (req, res) => {
  const { otp, city, state } = req.body || {};
  const device = deriveDevice(req);
  if (!otp) {
    return res.status(400).json({ message: "otp is required" });
  }
  try {
    // Identity comes from the verified Firebase token — never the body — so an
    // attacker can't brute-force OTPs against an arbitrary userId.
    const uid = req.auth?.firebaseUid;
    const email = req.auth?.email;
    const user =
      (uid && (await users.findOne({ firebaseUid: uid }))) ||
      (email && (await users.findOne({ email })));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.otpPurpose !== "login_verification" || !user.otp) {
      return res.status(400).json({ message: "No pending OTP verification" });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpPurpose = null;
      user.otpAttempts = 0;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please log in again." });
    }
    if ((user.otpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
      user.otp = null;
      user.otpExpiry = null;
      user.otpPurpose = null;
      user.otpAttempts = 0;
      await user.save();
      return res
        .status(429)
        .json({ message: "Too many incorrect attempts. Please log in again." });
    }
    if (!verifyOtpHash(otp, user.otp)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
        user.otp = null;
        user.otpExpiry = null;
        user.otpPurpose = null;
      }
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;
    user.otpAttempts = 0;
    user.lastCity = city || user.lastCity;
    user.lastState = state || user.lastState;
    user.lastDevice = device || user.lastDevice;
    if (!user.theme || user.theme === "auto") {
      user.theme = getDefaultTheme();
    }
    await user.save();

    return res.status(200).json({ result: user, otpRequired: false });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getTheme = async (req, res) => {
  const { userId } = req.params;
  if (!ensureOwnsUser(req, res, userId)) return;
  try {
    const user = await users.findById(userId).select("theme");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const theme = user.theme === "auto" ? getDefaultTheme() : user.theme;
    return res.status(200).json({ theme: user.theme, resolved: theme });
  } catch (error) {
    console.error("getTheme error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const setTheme = async (req, res) => {
  const { userId } = req.params;
  const { theme } = req.body;
  if (!ensureOwnsUser(req, res, userId)) return;
  if (!["light", "dark", "auto"].includes(theme)) {
    return res.status(400).json({ message: "Invalid theme. Use light, dark, or auto." });
  }
  try {
    const user = await users.findByIdAndUpdate(
      userId,
      { $set: { theme } },
      { new: true }
    ).select("theme");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const resolved = user.theme === "auto" ? getDefaultTheme() : user.theme;
    return res.status(200).json({ theme: user.theme, resolved });
  } catch (error) {
    console.error("setTheme error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getuserbyid = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "User unavailable..." });
  }
  try {
    const user = await users.findById(id).select("-__v -otp -otpExpiry -otpPurpose -otpAttempts");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, image, channelImage, coverImage } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  if (req.user._id.toString() !== _id) {
    return res
      .status(403)
      .json({ message: "You can only edit your own profile" });
  }
  const validImage = (v) =>
    v === undefined ||
    (typeof v === "string" && (v === "" || /^https?:\/\//i.test(v)));
  if (!validImage(image) || !validImage(channelImage) || !validImage(coverImage)) {
    return res.status(400).json({ message: "Invalid profile image URL" });
  }
  try {
    const setFields = {};
    if (channelname !== undefined) setFields.channelname = channelname;
    if (description !== undefined) setFields.description = description;
    if (image !== undefined) setFields.image = image;
    if (channelImage !== undefined) setFields.channelImage = channelImage;
    if (coverImage !== undefined) setFields.coverImage = coverImage;
    if (Object.keys(setFields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    const existing = await users.findById(_id);
    const ownerPrefix = userFolder(_id);
    for (const field of ["channelImage", "coverImage"]) {
      if (
        setFields[field] !== undefined &&
        existing?.[field] &&
        setFields[field] !== existing[field] &&
        existing[field].includes("res.cloudinary.com")
      ) {
        await deleteFromCloudinary(existing[field], "image", { prefix: ownerPrefix });
      }
    }
    const updatedata = await users.findByIdAndUpdate(
      _id,
      { $set: setFields },
      { new: true }
    );
    if (updatedata) {
      await video.updateMany(
        { uploader: _id },
        {
          $set: {
            videochanel: updatedata.channelname || "",
            videochanelImage: updatedata.channelImage || "",
          },
        }
      );
    }
    return res.status(200).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
