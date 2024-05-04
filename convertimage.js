const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const ImageDB = require("./model/dbImage");
const router = express.Router();
const upload = multer();

router.post("/img/upload", upload.single("image"), async (req, res) => {
  try {
    const imageBuffer = req.file.buffer;
    const processedImageBuffer = await sharp(imageBuffer)
      .resize({
        width: 800,
        height: 600,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .toColorspace("srgb")
      .jpeg({ quality: 50 })
      .toBuffer();

    const newImage = new ImageDB({
      originalName: req.file.originalname,
      processedName: req.file.originalname,
      size: processedImageBuffer.length,
      width: 800,
      height: 600,
      processedUrl: `data:image/jpeg;base64,${processedImageBuffer.toString(
        "base64"
      )}`,
    });

    await newImage.save();
    console.log("Data gambar yang akan disimpan:", newImage);

    res.json({
      processedImageUrl: `http://localhost:5000/images/latest-img`,
      imageDetails: {
        processedImageSize: newImage.size,
        processedImageWidth: newImage.width,
        processedImageHeight: newImage.height,
      },
    });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Image processing failed" });
  }
});



router.get("/latest-img", async (req, res) => {
  try {
    const latestImage = await ImageDB.findOne().sort({ createdAt: -1 });

    if (!latestImage) {
      console.error("Tidak ada gambar yang tersedia.");
      return res.status(404).send("Tidak ada gambar yang tersedia.");
    }

    res.setHeader("Content-Type", "image/jpeg");
    res.send(Buffer.from(latestImage.processedUrl.split(",")[1], "base64"));

    console.log("Mengunduh gambar terbaru:", latestImage.processedName);
  } catch (error) {
    console.error("Terjadi kesalahan saat mengunduh gambar:", error);
    res.status(500).send("Terjadi kesalahan saat mengunduh gambar");
  }
});




// router.get("/download/:imageId", async (req, res) => {
//   try {
//     const imageId = req.params.imageId;

//     const image = await ImageDB.findById(imageId);

//     if (!image) {
//       console.error("Gambar tidak ditemukan:", imageId);
//       return res.status(404).send("Gambar tidak ditemukan");
//     }

//     res.setHeader("Content-Type", "image/jpeg");
//     res.send(Buffer.from(image.processedUrl.split(",")[1], "base64"));

//     console.log("Mengunduh gambar:", image.processedName);
//   } catch (error) {
//     console.error("Terjadi kesalahan saat mengunduh gambar:", error);
//     res.status(500).send("Terjadi kesalahan saat mengunduh gambar");
//   }
// });

module.exports = router;
