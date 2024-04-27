// const express = require("express");
// const multer = require("multer");
// const ffmpeg = require("fluent-ffmpeg");
// const fs = require("fs").promises;
// const AudioDB = require("./model/dbaudio");
// const MergeDB = require("./model/dbmerge");

// const router = express();

// const upload = multer();

// router.post("/merge", upload.array("audioFiles"), async (req, res) => {
//   try {
//     const audioFiles = req.files;
//     console.log("Uploading files:", audioFiles);

//     const fileNames = [];
//     audioFiles.forEach((file) => {
//       console.log("Processing file:", file.originalname);
//       const tempFileName = `temp_${Date.now()}_${file.originalname}`;
//       fileNames.push(tempFileName);
//       fs.writeFile(tempFileName, file.buffer);
//     });

//     const command = ffmpeg();
//     fileNames.forEach((fileName) => {
//       command.input(fileName);
//     });

//     const outputPath = "merged.mp3";
//     await new Promise((resolve, reject) => {
//       command
//         .on("end", () => {
//           console.log("Merge process completed");

//           fs.readFile(outputPath)
//             .then(async (mergedAudioBuffer) => {
//               console.log("Audio merged successfully");

//               const mergedAudio = new AudioDB({
//                 fileName: "audio-gab.mp3",
//                 audioData: mergedAudioBuffer,
//               });
//               await mergedAudio.save();
//               console.log("Audio saved to MongoDB:", mergedAudio.fileName);

//               fileNames.forEach((fileName) => {
//                 fs.unlink(fileName);
//               });

//               res.setHeader("Content-Type", "audio/mpeg");
//               res.send(mergedAudioBuffer);
//             })
//             .catch((err) => {
//               console.error("Error reading merged audio file:", err);
//               reject(err);
//             });
//         })
//         .on("error", (err) => {
//           console.error("Error during merge:", err);
//           reject(err);
//         })
//         .mergeToFile(outputPath);
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Error merging and saving audio");
//   }
// });

// router.post(
//   "/mergewithbacksound",
//   upload.array("audioFiles"),
//   async (req, res) => {
//     try {
//       const audioFiles = req.files;
//       console.log("Uploading files:", audioFiles);

//       const tempFilePaths = [];
//       for (const file of audioFiles) {
//         console.log("Processing file:", file.originalname);
//         const tempFileName = `temp_${Date.now()}_${file.originalname}`;
//         tempFilePaths.push(tempFileName);
//         await fs.writeFile(tempFileName, file.buffer);
//       }

//       const outputPath = "audio-back.mp3";
//       const command = ffmpeg();

//       for (const filePath of tempFilePaths) {
//         command.input(filePath);
//       }

//       command
//         .complexFilter([
//           "[0:a]volume=1[a1];[1:a]volume=0.5[a2];[a1][a2]amix=inputs=2:duration=longest",
//         ])
//         .on("end", async () => {
//           console.log("Audio merged with backsound successfully");

//           const mergedAudio = new MergeDB({
//             fileName: "merged-audio-with-backsound.mp3",
//             audioData: await fs.readFile(outputPath),
//           });
//           await mergedAudio.save();

//           for (const filePath of tempFilePaths) {
//             await fs.unlink(filePath);
//           }

//           res.setHeader("Content-Type", "audio/mpeg");
//           res.send(await fs.readFile(outputPath));
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

// router.get("/download/:id", async (req, res) => {
//   try {
//     const audio = await AudioDB.findById(req.params.id);
//     if (!audio) {
//       return res.status(404).json({ error: "Audio not found" });
//     }

//     const filePath = audio.filePath;

//     fs.readFile(filePath, (err, data) => {
//       if (err) {
//         console.error("Error reading file:", err);
//         return res.status(500).json({ error: "Internal server error" });
//       }

//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=${audio.fileName}`
//       );
//       res.setHeader("Content-Type", "audio/mpeg");
//       res.send(data);
//     });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// router.get("/latest-audio", async (req, res) => {
//   try {
//     const latestAudio = await AudioDB.findOne().sort({ createdAt: -1 });

//     if (!latestAudio) {
//       console.error("Tidak ada audio yang tersedia.");
//       return res.status(404).send("Tidak ada audio yang tersedia.");
//     }

//     res.set("Content-Type", "audio/mpeg");
//     res.send(latestAudio.audioData);
//     console.log("succes", latestAudio.fileName);
//   } catch (error) {
//     console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
//     res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
//   }
// });

// router.get("/latest-mergewithbacksound", async (req, res) => {
//   try {
//     const latestAudio = await MergeDB.findOne().sort({ createdAt: -1 });

//     if (!latestAudio) {
//       console.error("Tidak ada audio yang tersedia.");
//       return res.status(404).send("Tidak ada audio yang tersedia.");
//     }

//     res.set("Content-Type", "audio/mpeg");
//     res.send(latestAudio.audioData);
//     console.log("succes", latestAudio.fileName);
//   } catch (error) {
//     console.error("Terjadi kesalahan saat mengambil audio terbaru:", error);
//     res.status(500).send("Terjadi kesalahan saat mengambil audio terbaru");
//   }
// });

// router.get("/audio/:id", async (req, res) => {
//   try {
//     const audio = await AudioDB.findById(req.params.id);
//     if (!audio) {
//       return res.status(404).json({ error: "Audio not found" });
//     }

//     res.set("Content-Type", "audio/mpeg");
//     res.send(audio.audioData);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// router.get("/getmerge", async (req, res) => {
//   try {
//     const mergedAudios = await AudioDB.find();
//     res.json(mergedAudios);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// router.get("/getmergewithbacksound", async (req, res) => {
//   try {
//     const mergedAudios = await MergeDB.find();
//     res.json(mergedAudios);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;
