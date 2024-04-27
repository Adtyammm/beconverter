const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const AudioDB = require("./model/dbaudio");
const MergeDB = require("./model/dbmerge");
const DualAudioDB = require("./model/uploadaudio");
const TempAudio = require("./model/tempaudio");
const { Readable } = require("stream");

const { PassThrough } = require("stream");


const router = express();

const upload = multer();

router.post("/upload", upload.array("audioFiles"), async (req, res) => {
  try {
    const audioFiles = req.files;
    console.log("Uploading files:", audioFiles);

    const audio1 = new DualAudioDB({
      audio1: {
        fileName: audioFiles[0].originalname,
        audioData: audioFiles[0].buffer,
      },
      audio2: {
        fileName: audioFiles[1].originalname,
        audioData: audioFiles[1].buffer,
      },
    });

    await audio1.save();
    console.log("Uploaded audio files saved to MongoDB");

    res.status(200).json(audio1);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error uploading audio");
  }
});

router.post("/merge", async (req, res) => {
  try {
    const dualAudio = await DualAudioDB.findById(req.body.id);
    if (!dualAudio) {
      console.log("Dual audio not found");
      return res.status(404).send("Dual audio not found");
    }
    console.log("Dual audio found:");

    const buffer1 = dualAudio.audio1.audioData;
    const buffer2 = dualAudio.audio2.audioData;

    const mergedBuffer = Buffer.concat([buffer1, buffer2]);

    const audioStream = new PassThrough();
    audioStream.end(mergedBuffer);

    const outputPath = "merged_audio.mp3";

    ffmpeg()
      .input(audioStream)
      .output(outputPath)
      .on("start", (commandLine) => {
        console.log("ffmpeg command:", commandLine);
      })
      .on("progress", (progress) => {
        console.log("ffmpeg progress:", progress);
      })
      .on("end", () => {
        console.log("Audio merging completed");
        res.download(outputPath, "merged_audio.mp3", (err) => {
          if (err) {
            console.error("Error sending merged audio:", err);
            res.status(500).send("Error sending merged audio");
          } else {
            console.log("Merged audio sent successfully");
          }
        });
      })

      .on("error", (error) => {
        console.error("Error merging audio:", error);
        res.status(500).send("Error merging audio");
      })
      .run();
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error merging audio");
  }
});





router.post(
  "/mergewithbacksound",
  upload.array("audioFiles"),
  async (req, res) => {
    try {
      const audioFiles = req.files;
      console.log("Uploading files:", audioFiles);

      const tempFilePaths = [];
      for (const file of audioFiles) {
        console.log("Processing file:", file.originalname);
        const tempFileName = `temp_${Date.now()}_${file.originalname}`;
        tempFilePaths.push(tempFileName);
        await fs.writeFile(tempFileName, file.buffer);
      }

      const outputPath = "audio-back.mp3";
      const command = ffmpeg();

      for (const filePath of tempFilePaths) {
        command.input(filePath);
      }

      command
        .complexFilter([
          "[0:a]volume=1[a1];[1:a]volume=0.5[a2];[a1][a2]amix=inputs=2:duration=longest",
        ])
        .on("end", async () => {
          console.log("Audio merged with backsound successfully");

          const mergedAudio = new MergeDB({
            fileName: "merged-audio-with-backsound.mp3",
            audioData: await fs.readFile(outputPath),
          });
          await mergedAudio.save();

          for (const filePath of tempFilePaths) {
            await fs.unlink(filePath);
          }

          res.setHeader("Content-Type", "audio/mpeg");
          res.send(await fs.readFile(outputPath));
        })
        .on("error", (error) => {
          console.error("Error merging audio with backsound:", error);
          return res.status(500).send("Error merging audio with backsound");
        })
        .save(outputPath);
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send("Error merging audio with backsound");
    }
  }
);

router.get("/download/:id", async (req, res) => {
  try {
    const audio = await AudioDB.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: "Audio not found" });
    }

    const filePath = audio.filePath;

    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error("Error reading file:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${audio.fileName}`
      );
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(data);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/latest-audio", async (req, res) => {
  try {
    const latestAudio = await AudioDB.findOne().sort({ createdAt: -1 });

    if (!latestAudio) {
      console.error("Tidak ada audio yang tersedia.");
      return res.status(404).send("Tidak ada audio yang tersedia.");
    }

    res.set("Content-Type", "audio/mpeg");
    res.send(latestAudio.audioData);
    console.log("succes", latestAudio.fileName);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
  }
});

router.get("/latest-mergewithbacksound", async (req, res) => {
  try {
    const latestAudio = await MergeDB.findOne().sort({ createdAt: -1 });

    if (!latestAudio) {
      console.error("Tidak ada audio yang tersedia.");
      return res.status(404).send("Tidak ada audio yang tersedia.");
    }

    res.set("Content-Type", "audio/mpeg");
    res.send(latestAudio.audioData);
    console.log("succes", latestAudio.fileName);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
  }
});

router.get("/audio/:id", async (req, res) => {
  try {
    const audio = await AudioDB.findById(req.params.id);
    if (!audio) {
      return res.status(404).json({ error: "Audio not found" });
    }

    res.set("Content-Type", "audio/mpeg");
    res.send(audio.audioData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getmerge", async (req, res) => {
  try {
    const mergedAudios = await AudioDB.find();
    res.json(mergedAudios);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getmergewithbacksound", async (req, res) => {
  try {
    const mergedAudios = await MergeDB.find();
    res.json(mergedAudios);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
