import { initializeApp, cert } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import users from "../Modals/Auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let authApp = null;
let authService = null;
let authError = null;

export const getFirebaseAuth = () => {
  if (authService) return authService;
  if (authError) throw authError;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT
    ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
    : path.join(__dirname, "..", "firebase-service-account.json");
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
    authApp = initializeApp({ credential: cert(serviceAccount) });
    authService = getAuth(authApp);
    return authService;
  } catch (error) {
    authError = new Error("Firebase auth not configured: " + error.message);
    throw authError;
  }
};

export const verifyIdToken = async (token) => {
  const decoded = await getFirebaseAuth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    firebaseUid: decoded.uid,
    email: (decoded.email || "").toLowerCase(),
    name: decoded.name || "",
    picture: decoded.picture || "",
    email_verified: !!decoded.email_verified,
  };
};

const verifyToken = async (req) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    const error = new Error("Authentication required");
    error.status = 401;
    throw error;
  }
  return verifyIdToken(token);
};

const handleError = (res, error) => {
  if (authError) {
    console.error("Auth middleware error:", error.message);
    return res
      .status(500)
      .json({ message: "Auth is not configured on the server" });
  }
  return res
    .status(error.status || 401)
    .json({ message: error.status === 401 ? error.message : "Invalid or expired token" });
};

export const requireToken = async (req, res, next) => {
  try {
    req.auth = await verifyToken(req);
    next();
  } catch (error) {
    handleError(res, error);
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    const auth = await verifyToken(req);
    let user = await users.findOne({ firebaseUid: auth.uid });
    if (!user) {
      user = await users.findOne({ email: auth.email });
      if (user && !user.firebaseUid) {
        user = await users.findByIdAndUpdate(
          user._id,
          { $set: { firebaseUid: auth.uid } },
          { new: true }
        );
      }
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: "Account not found. Please sign in again." });
    }
    req.user = user;
    req.auth = { ...auth, firebaseUid: user.firebaseUid };
    next();
  } catch (error) {
    handleError(res, error);
  }
};

export const requireVerified = (req, res, next) => {
  if (!req.auth?.email_verified) {
    return res.status(403).json({
      message: "Please verify your email before doing this.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }
  next();
};
