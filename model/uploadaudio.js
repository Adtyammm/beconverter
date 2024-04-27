const mongoose = require("mongoose");

const dualAudioSchema = new mongoose.Schema(
  {
    audio1: {
      fileName: {
        type: String,
        required: true,
      },
      audioData: {
        type: Buffer,
        required: true,
      },
    },
    audio2: {
      fileName: {
        type: String,
        required: true,
      },
      audioData: {
        type: Buffer,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const DualAudioDB = mongoose.model("DualAudioDB", dualAudioSchema);

module.exports = DualAudioDB;
