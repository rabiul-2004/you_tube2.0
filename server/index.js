import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { setupSocket } from "./realtime/watchparty.js";
import { mountPeerServer } from "./realtime/peer.js";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import planroutes from "./routes/plan.js";
import subscriberoutes from "./routes/subscribe.js";
import downloadroutes from "./routes/download.js";
import watchProgressRoutes from "./routes/watchProgress.js";
import locationroutes from "./controllers/location.js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT ||
  path.join(__dirname, "firebase-service-account.json");
if (
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 &&
  !fs.existsSync(SERVICE_ACCOUNT_PATH)
) {
  fs.mkdirSync(path.dirname(SERVICE_ACCOUNT_PATH), { recursive: true });
  fs.writeFileSync(
    SERVICE_ACCOUNT_PATH,
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64")
  );
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));

const httpServer = http.createServer(app);

const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGINS.length ? CLIENT_ORIGINS : true,
    credentials: true,
  },
});

setupSocket(io);

app.get("/", (req, res) => {
  res.send("You tube backend is working");
});

app.use("/user/location", locationroutes);
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/plan", planroutes);
app.use("/subscribe", subscriberoutes);
app.use("/download", downloadroutes);
app.use("/progress", watchProgressRoutes);
const PORT = process.env.PORT || 5000;
const DBURL = process.env.DB_URL;

if (process.env.ENABLE_PEER !== "false") {
  mountPeerServer(app, httpServer);
}

mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
    httpServer.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });