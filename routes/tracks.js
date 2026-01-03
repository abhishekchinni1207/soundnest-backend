import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { supabase } from "../supabaseClient.js";
import { generateWaveform } from "../utils/waveform.js";

const router = express.Router();

/* ===============================
   MULTER CONFIG (TEMP STORAGE)
================================ */
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/* ===============================
   GET ALL TRACKS
================================ */
router.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch tracks error:", error);
    return res.status(500).json({ error: "Failed to fetch tracks" });
  }

  res.json(data || []);
});

/* ===============================
   ADMIN UPLOAD TRACK (AUTO WAVEFORM)
================================ */
router.post(
  "/upload",
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    let audioTmp;
    let coverTmp;

    try {
      console.log("📥 Upload request received");

      const { title, artist, genre, mood } = req.body;
      const audioFile = req.files?.audio?.[0];
      const coverFile = req.files?.cover?.[0];

      if (!title || !artist) {
        return res.status(400).json({ error: "Title and artist are required" });
      }

      if (!audioFile || !coverFile) {
        return res.status(400).json({ error: "Audio and cover files required" });
      }

      audioTmp = audioFile.path;
      coverTmp = coverFile.path;

      /* ===============================
         1️⃣ Upload AUDIO
      ================================ */
      const audioBuffer = await fs.readFile(audioTmp);
      const audioExt = path.extname(audioFile.originalname);
      const audioPath = `tracks/${Date.now()}${audioExt}`;

      const { error: audioUploadError } = await supabase.storage
        .from("audio")
        .upload(audioPath, audioBuffer, {
          contentType: audioFile.mimetype,
          upsert: false,
        });

      if (audioUploadError) throw audioUploadError;

      const audio_url = supabase.storage
        .from("audio")
        .getPublicUrl(audioPath).data.publicUrl;

      /* ===============================
         2️⃣ Upload COVER
      ================================ */
      const coverBuffer = await fs.readFile(coverTmp);
      const coverExt = path.extname(coverFile.originalname);
      const coverPath = `covers/${Date.now()}${coverExt}`;

      const { error: coverUploadError } = await supabase.storage
        .from("covers")
        .upload(coverPath, coverBuffer, {
          contentType: coverFile.mimetype,
          upsert: false,
        });

      if (coverUploadError) throw coverUploadError;

      const cover_url = supabase.storage
        .from("covers")
        .getPublicUrl(coverPath).data.publicUrl;

      /* ===============================
         3️⃣ Insert TRACK (waveform later)
      ================================ */
      const { data: track, error: insertError } = await supabase
        .from("tracks")
        .insert({
          title,
          artist,
          genre,
          mood,
          audio_url,
          cover_url,
          waveform_peaks: [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      /* ===============================
         4️⃣ Generate WAVEFORM
      ================================ */
      console.log("🧠 Generating waveform...");
      let peaks = [];

      try {
        peaks = await generateWaveform(audioTmp);
        console.log("📈 Waveform bars:", peaks.length);
      } catch (wfError) {
        console.error("❌ Waveform generation failed:", wfError);
      }

      if (Array.isArray(peaks) && peaks.length > 0) {
        const { error: waveUpdateError } = await supabase
          .from("tracks")
          .update({ waveform_peaks: peaks })
          .eq("id", track.id);

        if (waveUpdateError) {
          console.error("❌ Waveform DB update failed:", waveUpdateError);
        }
      }

      /* ===============================
         5️⃣ Cleanup TEMP FILES
      ================================ */
      await fs.unlink(audioTmp);
      await fs.unlink(coverTmp);

      console.log("✅ Upload complete");

      res.json({
        success: true,
        trackId: track.id,
        waveformGenerated: peaks.length > 0,
      });
    } catch (err) {
      console.error("❌ Upload error:", err);

      if (audioTmp) await fs.unlink(audioTmp).catch(() => {});
      if (coverTmp) await fs.unlink(coverTmp).catch(() => {});

      res.status(500).json({ error: "Upload failed" });
    }
  }
);

export default router;
