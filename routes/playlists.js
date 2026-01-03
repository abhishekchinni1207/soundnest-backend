import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

/* ===============================
   CREATE PLAYLIST
================================ */
router.post("/", async (req, res) => {
  const { name, user_id } = req.body;

  if (!name || !user_id) {
    return res.status(400).json({ error: "Missing playlist name or user" });
  }

  const { data, error } = await supabase
    .from("playlists")
    .insert({ name, user_id })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: "Failed to create playlist" });
  }

  res.json(data);
});

/* ===============================
   GET PLAYLIST TRACKS (⚠️ MUST BE FIRST)
================================ */
router.get("/tracks/:playlistId", async (req, res) => {
  const { playlistId } = req.params;

  const { data, error } = await supabase
    .from("playlist_tracks")
    .select(`
      tracks (
        id,
        title,
        artist,
        cover_url,
        audio_url,
        waveform_peaks
      )
    `)
    .eq("playlist_id", playlistId);

  if (error) {
    console.error("Playlist tracks error:", error);
    return res.status(500).json({ error: "Failed to load tracks" });
  }

  res.json({ data: data || [] });
});

/* ===============================
   GET USER PLAYLISTS
================================ */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: "Failed to load playlists" });
  }

  res.json({ data });
});

/* ===============================
   ADD TRACK TO PLAYLIST
================================ */
router.post("/add-track", async (req, res) => {
  const { playlist_id, track_id } = req.body;

  if (!playlist_id || !track_id) {
    return res.status(400).json({ error: "Missing playlist or track" });
  }

  const { error } = await supabase
    .from("playlist_tracks")
    .insert({ playlist_id, track_id });

  if (error) {
    return res.status(500).json({ error: "Failed to add track" });
  }

  res.json({ success: true });
});

/* ===============================
   REMOVE TRACK FROM PLAYLIST
================================ */
router.delete("/remove-track", async (req, res) => {
  const { playlist_id, track_id } = req.body;

  if (!playlist_id || !track_id) {
    return res.status(400).json({ error: "Missing playlist or track" });
  }

  const { error } = await supabase
    .from("playlist_tracks")
    .delete()
    .eq("playlist_id", playlist_id)
    .eq("track_id", track_id);

  if (error) {
    return res.status(500).json({ error: "Failed to remove track" });
  }

  res.json({ success: true });
});

export default router;
