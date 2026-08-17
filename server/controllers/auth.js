import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import video from "../Modals/video.js";

export const login = async (req, res) => {
  const { email, name, picture, firebaseUid } = req.auth;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({
        email,
        name,
        image: picture,
        firebaseUid,
      });
      return res.status(201).json({ result: newUser });
    } else {
      if (!existingUser.firebaseUid && firebaseUid) {
        existingUser.firebaseUid = firebaseUid;
      }
      if (name && existingUser.name !== name) {
        existingUser.name = name;
      }
      if (picture && existingUser.image !== picture) {
        existingUser.image = picture;
      }
      if (existingUser.isModified()) {
        await existingUser.save();
      }
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getuserbyid = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "User unavailable..." });
  }
  try {
    const user = await users.findById(id).select("-__v");
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
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
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
