const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");


const router = express();
const upload = multer({ dest: "uploads_merge_audio/" });

router.post("/merge", upload.array("audioFiles"), (req, res) => {
  const audioFiles = req.files;
  console.log("Uploading files:", audioFiles);

  const outputPath = "merged.mp3";
  const command = ffmpeg();

  audioFiles.forEach((file) => {
    command.input(file.path);
  });

  command
    .on("end", () => {
      console.log("Audio merged successfully");
      res.download(outputPath, "merged-audio.mp3", (err) => {
        if (err) {
          console.error("Error downloading merged audio:", err);
        }

        audioFiles.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error("Error deleting temporary file:", err);
            }
          });
        });

        fs.unlink(outputPath, (err) => {
          if (err) {
            console.error("Error deleting merged audio file:", err);
          }
        });
      });
    })
    .on("error", (error) => {
      console.error("Error merging audio:", error);
      return res.status(500).send("Error merging audio");
    })
    .mergeToFile(outputPath);
});

router.post("/mergewithbacksound", upload.array("audioFiles"), (req, res) => {
  const audioFiles = req.files;
  console.log("Uploading files:", audioFiles);

  const outputPath = "merged-with-backsound.mp3";
  const command = ffmpeg();

  command
    .input(audioFiles[0].path)
    .input(audioFiles[1].path)
    .complexFilter([
      "[0:a]volume=1[a1];[1:a]volume=0.5[a2];[a1][a2]amix=inputs=2:duration=longest",
    ]);

  command
    .on("end", () => {
      console.log("Audio merged with backsound successfully");
      res.download(outputPath, "merged-audio-with-backsound.mp3", (err) => {
        if (err) {
          console.error("Error downloading merged audio with backsound:", err);
        }

        audioFiles.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error("Error deleting temporary file:", err);
            }
          });
        });

        fs.unlink(outputPath, (err) => {
          if (err) {
            console.error(
              "Error deleting merged audio with backsound file:",
              err
            );
          }
        });
      });
    })
    .on("error", (error) => {
      console.error("Error merging audio with backsound:", error);
      return res.status(500).send("Error merging audio with backsound");
    })
    .save(outputPath);
});

module.exports = router;
