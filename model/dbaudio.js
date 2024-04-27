const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    audioData: {
      type: Buffer,
      // required: true,
    },
    audio1: {
      type: Buffer,
      // required: true,
    },
    audio2: {
      type: Buffer,
      // required: true,
    },
    filePath: {
      type: String,
    },
    // Tambahkan properti lain sesuai kebutuhan
  },
  {
    timestamps: true,
  }
);

const AudioDB = mongoose.model("AudioDB", audioSchema);

module.exports = AudioDB;
