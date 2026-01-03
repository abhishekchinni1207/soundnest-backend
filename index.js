import express from "express";
import cors from "cors";
import { supabase } from "./supabaseClient.js";

import tracksRouter from "./routes/tracks.js";
import playlistRoutes from "./routes/playlists.js";
import analyticsRoutes from "./routes/analytics.js";
import recommendationsRouter from "./routes/recommendations.js";
// ❌ recommendations intentionally excluded for now

const app = express();
const PORT = process.env.PORT || 5000;

/* ===============================
   🌐 CORS (DEV + PROD SAFE)
================================ */
const allowedOrigins = [
  "http://localhost:5173",          // local dev
  process.env.FRONTEND_URL,         // render frontend
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/* ===============================
   🧠 BODY PARSER
================================ */
app.use(express.json({ limit: "10mb" }));

/* ===============================
   🚦 ROUTES
================================ */
app.use("/tracks", tracksRouter);
app.use("/playlists", playlistRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/recommendations", recommendationsRouter);

/* ===============================
   ❤️ HEALTH CHECK (RENDER)
================================ */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "SoundNest Backend" });
});

/* ===============================
   🧪 DB CHECK (OPTIONAL)
================================ */
app.get("/test-db", async (_req, res) => {
  const { data, error } = await supabase
    .from("tracks")
    .select("id")
    .limit(1);

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  res.json({ ok: true });
});

/* ===============================
   🏁 ROOT
================================ */
app.get("/", (_req, res) => {
  res.send("🎧 SoundNest Backend is running");
});

/* ===============================
   🚀 START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 SoundNest Backend running on port ${PORT}`);
});
