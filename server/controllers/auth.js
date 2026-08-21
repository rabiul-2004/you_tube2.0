import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import { generateOTP, sendOtpEmail } from "../helpers/email.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getISTHour = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const istMs = utcMs + IST_OFFSET_MS;
  return new Date(istMs).getHours();
};

export const getDefaultTheme = () => {
  const hour = getISTHour();
  return hour >= 10 && hour < 12 ? "light" : "dark";
};

export const login = async (req, res) => {
  const { email, name, picture, firebaseUid } = req.auth;
  const { city, state, device } = req.body || {};

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

    const isNewLocation = city && existingUser.lastCity && city !== existingUser.lastCity;
    const isNewState = state && existingUser.lastState && state !== existingUser.lastState;
    const isNewDevice = device && existingUser.lastDevice && device !== existingUser.lastDevice;

    if ((isNewLocation || isNewState || isNewDevice) && existingUser.email) {
      const otp = generateOTP();
      existingUser.otp = otp;
      existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      existingUser.otpPurpose = "login_verification";
      await existingUser.save();

      try {
        await sendOtpEmail({
          to: existingUser.email,
          name: existingUser.name,
          otp,
          city,
          state,
        });
      } catch (emailErr) {
        console.error("OTP email failed:", emailErr.message);
      }

      return res.status(200).json({
        result: { _id: existingUser._id, email: existingUser.email, name: existingUser.name },
        otpRequired: true,
        message: "New device/location detected. OTP sent to your email.",
      });
    }

    existingUser.lastCity = city || existingUser.lastCity;
    existingUser.lastState = state || existingUser.lastState;
    existingUser.lastDevice = device || existingUser.lastDevice;
    existingUser.otp = null;
    existingUser.otpExpiry = null;
    existingUser.otpPurpose = null;

    if (existingUser.isModified()) {
      await existingUser.save();
    }
    return res.status(200).json({ result: existingUser, otpRequired: false });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp, city, state, device } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({ message: "userId and otp are required" });
  }
  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.otpPurpose !== "login_verification") {
      return res.status(400).json({ message: "No pending OTP verification" });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please log in again." });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.otpPurpose = null;
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
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }
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
  if (req.user._id.toString() !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }
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
    const user = await users.findById(id).select("-__v -otp -otpExpiry -otpPurpose");
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
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  if (req.user._id.toString() !== _id) {
    return res
      .status(403)
      .json({ message: "You can only edit your own profile" });
  }
  try {
    const setFields = {};
    if (channelname !== undefined) setFields.channelname = channelname;
    if (description !== undefined) setFields.description = description;
    if (Object.keys(setFields).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }
    const updatedata = await users.findByIdAndUpdate(
      _id,
      { $set: setFields },
      { new: true }
    );
    if (updatedata) {
      await video.updateMany(
        { uploader: _id },
        { $set: { videochanel: updatedata.channelname || "" } }
      );
    }
    return res.status(200).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
