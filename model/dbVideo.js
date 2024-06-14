const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  originalName: String,
  filePath: String,
  trimmedFilePath: String,
  startTime: Number,
  endTime: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const VideoDB = mongoose.model("Video", videoSchema);

module.exports = VideoDB;
