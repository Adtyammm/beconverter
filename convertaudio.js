const express = require("express");
const multer = require("multer");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const router = express.Router();

router.use("/uploads_convert_audio", express.static("uploads_convert_audio"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads_convert_audio/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ dest: "uploads_convert_audio/" });


router.post("/upload", upload.single("audio"), (req, res) => {
  if (req.file) {
    const { originalname, mimetype, size } = req.file;
    res.json({
      message: "File uploaded successfully",
      filename: req.file.filename,
      originalname,
      mimetype,
      size,
    });
  } else {
    res.status(400).json({ message: "No file uploaded" });
  }
});


router.post("/convert", upload.single("audio"), (req, res) => {
  if (req.file) {
    const { format } = req.body;
    const filePath = req.file.path;
    const convertedFileName = uuidv4() + "." + format;

    ffmpeg(filePath)
      .toFormat(format)
      .save("uploads_convert_audio/" + convertedFileName)
      .on("end", () => {
        const convertedFilePath = "uploads_convert_audio/" + convertedFileName;
        const convertedFileSize = fs.statSync(convertedFilePath).size;

        const convertedFileDetails = {
          name: convertedFileName,
          type: format,
          size: convertedFileSize,
        };

        res.json({
          message: "File converted successfully",
          convertedFileDetails,
        });
      })
      .on("error", (err) => {
        console.error("Error converting file:", err);
        res.status(500).json({ message: "Error converting file" });
      });
  } else {
    res.status(400).json({ message: "No file uploaded" });
  }
});


router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "uploads_convert_audio", filename);

  res.download(filePath, (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).json({ message: "Error downloading file" });
    }
  });
});

module.exports = router;
