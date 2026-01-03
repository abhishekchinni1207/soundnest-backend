import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/* ===============================
   📌 POST: Log Track Listen
================================ */
router.post("/listen", async (req, res) => {
  try {
    const { trackId, playedSeconds } = req.body;

    // ✅ Strict validation
    if (!trackId || typeof playedSeconds !== "number") {
      return res.status(400).json({
        error: "Invalid payload",
      });
    }

    // Ignore very small plays (noise protection)
    if (playedSeconds < 5) {
      return res.json({ success: true });
    }

    const { error } = await supabase
      .from("track_analytics")
      .insert({
        track_id: trackId,
        played_seconds: playedSeconds,
      });

    if (error) {
      return res.status(500).json({
        error: "Failed to record analytics",
      });
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* ===============================
   📊 GET: Top Tracks
================================ */
router.get("/top-tracks", async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc("top_tracks");

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch top tracks",
      });
    }

    return res.json(Array.isArray(data) ? data : []);
  } catch {
    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* ===============================
   👤 GET: Analytics Summary
================================ */
router.get("/summary", async (_req, res) => {
  try {
    const { data, error } = await supabase.rpc("analytics_summary");

    if (error) {
      return res.status(500).json({
        error: "Failed to fetch analytics summary",
      });
    }

    return res.json(data?.[0] ?? {});
  } catch {
    return res.status(500).json({
      error: "Server error",
    });
  }
});

export default router;
