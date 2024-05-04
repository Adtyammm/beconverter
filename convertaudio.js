const express = require("express");
const multer = require("multer");
const UploadedAudio = require("./model/convert");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (req.file) {
      const { originalname, mimetype, size, filename } = req.file;

      const uploadedAudio = new UploadedAudio({
        originalname,
        mimetype,
        size,
        filename,
        audioData: req.file.buffer,
      });

      await uploadedAudio.save();

      res.json({
        message: "File uploaded successfully",
        originalname,
        mimetype,
        size,
      });
    } else {
      res.status(400).json({ message: "No file uploaded" });
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Error uploading file" });
  }
});

router.get("/getData", async (req, res) => {
  try {
    const latestAudios = await UploadedAudio.find().sort({ createdAt: -1 });

    if (latestAudios.length === 0) {
      console.error("Tidak ada audio yang tersedia.");
      return res.status(404).send("Tidak ada audio yang tersedia.");
    }

    const audioDataArray = latestAudios.map((audio) => ({
      id: audio._id,
      originalname: audio.originalname,
      mimetype: audio.mimetype,
      size: audio.size,
      filename: audio.filename,
      createdAt: audio.createdAt,
    }));

    res.json(audioDataArray);
    console.log("Success, total latest audio:", latestAudios.length);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
  }
});

router.get("/getdual", async (req, res) => {
  try {
    const latestAudios = await UploadedAudio.find().sort({ createdAt: -1 });

    if (latestAudios.length === 0) {
      console.error("Tidak ada audio yang tersedia.");
      return res.status(404).send("Tidak ada audio yang tersedia.");
    }

    const audioDataArray = latestAudios.map((audio) => ({
      _id: audio._id,
      originalname: audio.originalname,
      mimetype: audio.mimetype,
      size: audio.size,
      audioData: audio.audioData.toString("base64"),
      convertedFiles: audio.convertedFiles,
      createdAt: audio.createdAt,
      updatedAt: audio.updatedAt,
      __v: audio.__v,
    }));

    res.set("Content-Type", "application/json");
    res.json(audioDataArray);
    console.log("Success, total latest audio:", latestAudios.length);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
  }
});

router.get("/getLatestAudio", async (req, res) => {
  try {
    const latestAudio = await UploadedAudio.findOne().sort({ createdAt: -1 });

    if (!latestAudio) {
      console.error("Tidak ada audio yang tersedia.");
      return res.status(404).send("Tidak ada audio yang tersedia.");
    }

    res.set("Content-Type", "audio/mpeg");
    res.send(latestAudio.audioData);
    console.log("Success", latestAudio.originalname);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
  }
});

router.get("/getLastAudioId", async (req, res) => {
  try {
    const latestAudio = await UploadedAudio.findOne().sort({ createdAt: -1 });

    if (!latestAudio) {
      console.error("Tidak ada audio yang tersedia.");
      return res.status(404).send("Tidak ada audio yang tersedia.");
    }

    res.json({ id: latestAudio._id });
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
  }
});

module.exports = router;
