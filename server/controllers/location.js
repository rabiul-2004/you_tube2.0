import express from "express";
import http from "http";

const routes = express.Router();

const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    http
      .get(url, { headers: { "User-Agent": "YourTube/1.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({});
          }
        });
      })
      .on("error", () => resolve({}));
  });
};

routes.get("/", async (req, res) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : req.socket.remoteAddress;

    if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1") {
      return res.status(200).json({
        ip: "127.0.0.1",
        city: "Local",
        state: "Local",
        country: "IN",
      });
    }

    const data = await fetchJSON(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
    return res.status(200).json({
      ip: ip || null,
      city: data.city || null,
      state: data.regionName || null,
      country: data.country || null,
    });
  } catch (error) {
    console.error("Location lookup failed:", error.message);
    return res.status(200).json({ ip: null, city: null, state: null, country: null });
  }
});

export default routes;
