import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs/promises";
import path from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegPath);

export async function generateWaveform(inputPath, bars = 120) {
  console.log("🎵 Waveform input:", inputPath);

  const tempRaw = path.join(os.tmpdir(), `waveform-${Date.now()}.raw`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(44100)
      .format("s16le")
      .save(tempRaw)
      .on("end", async () => {
        try {
          const buffer = await fs.readFile(tempRaw);
          const samples = new Int16Array(buffer.buffer);

          console.log("📊 Samples:", samples.length);

          if (!samples.length) {
            throw new Error("No audio samples found");
          }

          const blockSize = Math.floor(samples.length / bars);
          const peaks = [];

          for (let i = 0; i < bars; i++) {
            let sum = 0;
            let count = 0;

            const start = i * blockSize;
            const end = Math.min(start + blockSize, samples.length);

            for (let j = start; j < end; j++) {
              sum += Math.abs(samples[j]);
              count++;
            }

            peaks.push(count ? sum / count : 0);
          }

          const max = Math.max(...peaks) || 1;
          const normalized = peaks.map(v =>
            Number((v / max).toFixed(3))
          );

          await fs.unlink(tempRaw);
          resolve(normalized);
        } catch (err) {
          await fs.unlink(tempRaw).catch(() => {});
          reject(err);
        }
      })
      .on("error", async (err) => {
        await fs.unlink(tempRaw).catch(() => {});
        reject(err);
      });
  });
}
