// const express = require("express");
// const multer = require("multer");
// const ffmpeg = require("fluent-ffmpeg");
// const fs = require("fs").promises;
// const AudioDB = require("./model/dbaudio");
// const MergeDB = require("./model/dbmerge");
// const DualAudioDB = require("./model/uploadaudio");
// const TempAudio = require("./model/tempaudio");

// const router = express();

// const upload = multer();

// router.post("/upload", upload.array("audioFiles"), async (req, res) => {
//   try {
//     const audioFiles = req.files;
//     console.log("Uploading files:", audioFiles);

//     const audio1 = new DualAudioDB({
//       audio1: {
//         fileName: audioFiles[0].originalname,
//         audioData: audioFiles[0].buffer,
//       },
//       audio2: {
//         fileName: audioFiles[1].originalname,
//         audioData: audioFiles[1].buffer,
//       },
//     });

//     await audio1.save();
//     console.log("Uploaded audio files saved to MongoDB");

//     res.status(200).json(audio1);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Error uploading audio");
//   }
// });

// router.post("/merge", async (req, res) => {
//   try {
//     // Ambil data DualAudioDB berdasarkan _id
//     const dualAudio = await DualAudioDB.findById(req.body.id);

//     if (!dualAudio) {
//       return res.status(404).send("Dual audio not found");
//     }

//     // Simpan data audio dari DualAudioDB ke dalam file sementara
//     const tempAudio1Path = `temp_${Date.now()}_${dualAudio.audio1.fileName}`;
//     const tempAudio2Path = `temp_${Date.now()}_${dualAudio.audio2.fileName}`;

//     await fs.writeFile(tempAudio1Path, dualAudio.audio1.audioData);
//     await fs.writeFile(tempAudio2Path, dualAudio.audio2.audioData);

//     // Proses penggabungan audio menggunakan ffmpeg
//     const outputPath = "merged_audio.mp3";
//     await new Promise((resolve, reject) => {
//       ffmpeg()
//         .input(tempAudio1Path)
//         .input(tempAudio2Path)
//         .complexFilter("[0:a][1:a]amerge=inputs=2")
//         .output(outputPath)
//         .on("end", resolve)
//         .on("error", reject)
//         .run();
//     });

//     // Baca file hasil penggabungan
//     const mergedAudioBuffer = await fs.readFile(outputPath);

//     const tempAudio1 = new TempAudio({
//       fileName: dualAudio.audio1.fileName,
//       audioData: await fs.readFile(tempAudio1Path),
//     });
//     await tempAudio1.save();

//     const tempAudio2 = new TempAudio({
//       fileName: dualAudio.audio2.fileName,
//       audioData: await fs.readFile(tempAudio2Path),
//     });
//     await tempAudio2.save();

//     const mergedAudio = new AudioDB({
//       fileName: "merged_audio.mp3",
//       audioData: mergedAudioBuffer,
//     });
//     await mergedAudio.save();

//     await fs.unlink(tempAudio1Path);
//     await fs.unlink(tempAudio2Path);
//     await fs.unlink(outputPath);

//     res.setHeader("Content-Type", "audio/mpeg");
//     res.send(mergedAudioBuffer);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).send("Error merging audio");
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
