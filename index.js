const express = require("express");
const app = express();
const cors = require("cors");
const convertAudio = require("./convertaudio");
const convertImage = require("./convertimage");
const mergeAudio = require("./mergeaudio");
const convertVideo = require("./convertvideo");

const dbConfig = require("./mongoDB");

app.use(cors());

app.use(express.json());

app.get("/", async (req, res, next) => {
  return res.status(200).json({
    title: "Server Jalan",
    message: "Server siap digunakan!",
  });
});

app.use("/convert", convertAudio);
app.use("/images", convertImage);
app.use("/merge", mergeAudio);
app.use("/videos", convertVideo);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("Server is running on port", port));
