const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const ImageDB = require("./model/dbImage");
const path = require("path");
const router = express.Router();
const upload = multer({ dest: "uploads_convert_image/" });

router.use("/uploads_convert_image", express.static("uploads_convert_image"));

router.post("/api/upload", upload.single("image"), async (req, res) => {
  const imagePath = req.file.path;
  const processedImagePath = `processed_${req.file.originalname}`;
  const fileExtension = req.file.originalname.split(".").pop().toLowerCase();

  let format = "jpeg";

  if (fileExtension === "png") {
    format = "png";
  }

  sharp(imagePath)
    .resize({
      width: 800,
      height: 600,
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toColorspace("srgb")
    .jpeg({ quality: 50 })
    .toFormat(format)
    .toFile(
      `uploads_convert_image/${processedImagePath}`,
      async (error, info) => {
        fs.unlink(imagePath, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting temporary file:", unlinkError);
          }
        });

        if (error) {
          console.error("Error processing image:", error);
          res.status(500).json({ error: "Image processing failed" });
        } else {
          const processedImageUrl = `/uploads_convert_image/${processedImagePath}`;
          const imageDetails = {
            processedImageSize: info.size,
            processedImageWidth: info.width,
            processedImageHeight: info.height,
          };

          try {
            const newImage = new ImageDB({
              originalName: req.file.originalname,
              processedName: processedImagePath,
              processedUrl: processedImageUrl,
              size: info.size,
              width: info.width,
              height: info.height,
            });

            await newImage.save();
            console.log("Data gambar yang akan disimpan:", newImage);

            res.json({ processedImageUrl, imageDetails });
          } catch (err) {
            console.error("Error saving image to database:", err);
            res.status(500).json({ error: "Error saving image to database" });
          }
        }
      }
    );
});

router.get("/api/download/:imageName", async (req, res) => {
  try {
    const imageName = req.params.imageName;

    const image = await ImageDB.findOne({ processedName: imageName });

    if (!image) {
      console.error("Gambar tidak ditemukan:", imageName);
      return res.status(404).send("Gambar tidak ditemukan");
    }

    res.setHeader("Content-Type", "image/jpeg");

    const imagePath = path.join(__dirname, "uploads_convert_image", imageName);
    const imageStream = fs.createReadStream(imagePath);

    imageStream.pipe(res);

    console.log("Mengunduh gambar:", imageName);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengunduh gambar:", error);
    res.status(500).send("Terjadi kesalahan saat mengunduh gambar");
  }
});



module.exports = router;
