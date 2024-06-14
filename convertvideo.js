const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const VideoDB = require("./model/dbVideo");
const router = express.Router();
const upload = multer();
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "videos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

router.post("/upload", upload.single("video"), async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const videoBuffer = req.file?.buffer;

    if (!videoBuffer) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const filePath = path.join(
      uploadsDir,
      `${Date.now()}-${req.file.originalname}`
    );

    fs.writeFileSync(filePath, videoBuffer);

    const newVideo = new VideoDB({
      originalName: req.file.originalname,
      filePath: filePath,
      startTime: Number(startTime),
      endTime: Number(endTime),
    });

    await newVideo.save();
    console.log("Berhasil upload video:", newVideo);

    res.json(newVideo);
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Video upload failed" });
  }
});

router.post("/trim/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { compress } = req.body;
    const video = await VideoDB.findById(id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const outputFilePath = path.join(
      uploadsDir,
      `trimmed-${Date.now()}-${video.originalName}`
    );

    const ffmpegCommand = ffmpeg(video.filePath)
      .setStartTime(video.startTime)
      .setDuration(video.endTime - video.startTime)
      .output(outputFilePath);

    if (compress) {
      ffmpegCommand.videoBitrate("512k");
    }

    ffmpegCommand
      .on("end", async () => {
        video.trimmedFilePath = outputFilePath;
        await video.save();
        res.json(video);
      })
      .on("error", (err) => {
        console.error("Error trimming video:", err);
        res.status(500).json({ error: "Video trimming/compressing failed" });
      })
      .run();
    console.log("Berhasil trim video:");
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ error: "Video processing failed" });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const latestVideo = await VideoDB.findOne().sort({ createdAt: -1 });

    if (!latestVideo) {
      console.error("No video available.");
      return res.status(404).send("No video available.");
    }
    console.log("Berhasil get video:");

    res.setHeader("Content-Type", "video/mp4");
    res.sendFile(latestVideo.trimmedFilePath || latestVideo.filePath);

    console.log("Downloading latest video:", latestVideo.originalName);
  } catch (error) {
    console.error("Error downloading video:", error);
    res.status(500).json({ error: "video get latest failed" });
  }
});

router.get("/getVideos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const getVideo = await VideoDB.findById(id);

    if (!getVideo) {
      console.error("Video not found");
      return res.status(404).send("video not found");
    }
    console.log("Berhasil get video berdasrkan ID: ", id);

    res.setHeader("Content-Type", "video/mp4");
    res.sendFile(getVideo.trimmedFilePath || getVideo.filePath);
  } catch (error) {
    console.log("Gagal");

    console.error("Error downloading video:", error);
    res.status(500).json({ error: "video get  failed" });
  }
});

router.get("/allVideos", async (req, res) => {
  try {
    const allVideos = await VideoDB.find();
    res.json(allVideos);
  } catch (error) {
    console.error("Error fetching all videos:", error);
    res.status(500).json({ error: "Failed to fetch all videos" });
  }
});

router.get("/trimmed/latest", async (req, res) => {
  try {
    const latestVideo = await VideoDB.findOne().sort({ createdAt: -1 });

    if (!latestVideo) {
      console.error("No video available.");
      return res.status(404).send("No video available.");
    }

    if (!latestVideo.trimmedFilePath) {
      console.error("Trimmed video not available");
      return res.status(404).send("Trimmed video not available");
    }

    res.setHeader("Content-Type", "video/mp4");
    res.sendFile(latestVideo.trimmedFilePath);
  } catch (error) {
    console.error("Error fetching trimmed video:", error);
    res.status(500).json({ error: "Failed to fetch trimmed video" });
  }
});

module.exports = router;
