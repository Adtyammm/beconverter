// model/tempaudio.js
const mongoose = require("mongoose");

const tempAudioSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    audioData: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TempAudio = mongoose.model("TempAudio", tempAudioSchema);

module.exports = TempAudio;
