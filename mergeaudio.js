const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs").promises;
const DualAudioDB = require("./model/uploadaudio");

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
      return res.status(404).send("Dual audio not found");
    }

    const tempAudio1Path = `temp_${Date.now()}_${dualAudio.audio1.fileName}`;
    const tempAudio2Path = `temp_${Date.now()}_${dualAudio.audio2.fileName}`;

    await fs.writeFile(tempAudio1Path, dualAudio.audio1.audioData);
    await fs.writeFile(tempAudio2Path, dualAudio.audio2.audioData);

    const outputPath = "merged_audio.mp3";

    const command = ffmpeg();

    command
      .input(tempAudio1Path)
      .input(tempAudio2Path)
      .outputOptions("-y")
      .complexFilter("[0:a][1:a]concat=n=2:v=0:a=1")
      .output(outputPath)

      .on("end", async () => {
        console.log("Audio merged successfully");

        const mergedAudioBuffer = await fs.readFile(outputPath);

        dualAudio.mergedData.push({
          fileName: "merged_audio.mp3",
          audioData: mergedAudioBuffer,
        });

        await dualAudio.save();

        await fs.unlink(tempAudio1Path);
        await fs.unlink(tempAudio2Path);
        await fs.unlink(outputPath);

        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(mergedAudioBuffer);
      })
      .on("error", (error) => {
        console.error("Error merging audio:", error);
        return res.status(500).send("Error merging audio");
      })
      .run();
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error merging audio");
  }
});

router.post("/mergewithbacksound", async (req, res) => {
  try {
    const dualAudioId = req.body.id;
    const dualAudio = await DualAudioDB.findById(dualAudioId);

    if (!dualAudio) {
      return res.status(404).send("Dual audio not found");
    }

    const tempAudio1Path = `temp_${Date.now()}_${dualAudio.audio1.fileName}`;
    const tempAudio2Path = `temp_${Date.now()}_${dualAudio.audio2.fileName}`;

    await fs.writeFile(tempAudio1Path, dualAudio.audio1.audioData);
    await fs.writeFile(tempAudio2Path, dualAudio.audio2.audioData);

    const outputPath = "audio-back.mp3";
    const command = ffmpeg();

    command
      .input(tempAudio1Path)
      .input(tempAudio2Path)
      .complexFilter(
        "[0:a]volume=1[a1];[1:a]volume=0.5[a2];[a1][a2]amix=inputs=2:duration=longest"
      )
      .output(outputPath)
      .on("end", async () => {
        console.log("Audio merged with backsound successfully");

        const mergedAudioBuffer = await fs.readFile(outputPath);

        dualAudio.mergedDataBacksound.push({
          fileName: "merged-audio-with-backsound.mp3",
          audioData: mergedAudioBuffer,
        });

        await dualAudio.save();

        await fs.unlink(tempAudio1Path);
        await fs.unlink(tempAudio2Path);
        await fs.unlink(outputPath);

        res.setHeader("Content-Type", "audio/mpeg");
        return res.send(mergedAudioBuffer);
      })
      .on("error", (error) => {
        console.error("Error merging audio with backsound:", error);
        return res.status(500).send("Error merging audio with backsound");
      })
      .run();
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send("Error merging audio with backsound");
  }
});

module.exports = router;

router.get("/getdual", async (req, res) => {
  try {
    const latestAudios = await DualAudioDB.find().sort({ createdAt: -1 });

    if (latestAudios.length === 0) {
      console.error("Tidak ada audio yang tersedia.");
      return res.status(404).send("Tidak ada audio yang tersedia.");
    }

    const audioDataArray = latestAudios.map((audio) => ({
      id: audio.id,
      audio1: {
        fileName: audio.audio1.fileName,
        audioData: audio.audio1.audioData.toString("base64"),
      },
      audio2: {
        fileName: audio.audio2.fileName,
        audioData: audio.audio2.audioData.toString("base64"),
      },
      mergedData: audio.mergedData.map((mergedItem) => ({
        fileName: mergedItem.fileName,
        audioData: mergedItem.audioData.toString("base64"),
      })),
      mergedDataBacksound: audio.mergedDataBacksound.map((mergedBacksound) => ({
        fileName: mergedBacksound.fileName,
        audioData: mergedBacksound.audioData.toString("base64"),
      })),
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

module.exports = router;
