const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const AudioDB = require("./model/dbaudio");

const router = express();
const upload = multer({ dest: "uploads_merge_audio/" });

router.post("/merge", upload.array("audioFiles"), async (req, res) => {
  try {
    const audioFiles = req.files;
    console.log("Uploading files:", audioFiles);

    const outputPath = "merged.mp3";
    const command = ffmpeg();

    audioFiles.forEach((file) => {
      command.input(file.path);
    });

    await new Promise((resolve, reject) => {
      command.on("end", resolve).on("error", reject).mergeToFile(outputPath);
    });

    console.log("Audio merged successfully");

    const audioData = await fs.readFile(outputPath);

    const mergedAudio = new AudioDB({
      fileName: "merged-audio.mp3",
      audioData: audioData,
    });
    console.log("Simpan audio ke MongoDB:", mergedAudio.fileName);
    await mergedAudio.save();

    await fs.unlink(outputPath);

    console.log("File audio dihapus");

    res.status(200).send("Audio merged and saved successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error merging and saving audio");
  }
});

// router.post(
//   "/mergewithbacksound",
//   upload.array("audioFiles"),
//   async (req, res) => {
//     try {
//       const audioFiles = req.files;
//       console.log("Uploading files:", audioFiles);

//       const outputPath = "merged-with-backsound.mp3";
//       const command = ffmpeg();

//       command
//         .input(audioFiles[0].path)
//         .input(audioFiles[1].path)
//         .complexFilter([
//           "[0:a]volume=1[a1];[1:a]volume=0.5[a2];[a1][a2]amix=inputs=2:duration=longest",
//         ]);

//       command
//         .on("end", async () => {
//           console.log("Audio merged with backsound successfully");

//           const mergedAudio = new AudioDB({
//             fileName: "merged-audio-with-backsound.mp3",
//             filePath: outputPath,
//           });
//           await mergedAudio.save();

//           res.download(outputPath, "merged-audio-with-backsound.mp3", (err) => {
//             if (err) {
//               console.error(
//                 "Error downloading merged audio with backsound:",
//                 err
//               );
//             }

//             audioFiles.forEach((file) => {
//               fs.unlink(file.path, (err) => {
//                 if (err) {
//                   console.error("Error deleting temporary file:", err);
//                 }
//               });
//             });

//             fs.unlink(outputPath, (err) => {
//               if (err) {
//                 console.error(
//                   "Error deleting merged audio with backsound file:",
//                   err
//                 );
//               }
//             });
//           });
//         })
//         .on("error", (error) => {
//           console.error("Error merging audio with backsound:", error);
//           return res.status(500).send("Error merging audio with backsound");
//         })
//         .save(outputPath);
//     } catch (error) {
//       console.error("Error:", error);
//       return res.status(500).send("Error merging audio with backsound");
//     }
//   }
// );

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

module.exports = router;