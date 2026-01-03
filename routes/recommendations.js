import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/**
 * GET /recommendations/:trackId
 */
router.get("/:trackId", async (req, res) => {
  try {
    const { trackId } = req.params;

    if (!trackId) {
      return res.status(400).json({ error: "Missing trackId" });
    }

    const { data, error } = await supabase
      .from("tracks")
      .select("*")
      .neq("id", trackId)
      .limit(6);

    if (error) throw error;

    res.json(data ?? []);
  } catch (err) {
    console.error("❌ Recommendation error:", err);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
});

export default router;
