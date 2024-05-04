const mongoose = require("mongoose");

const UploadedAudioSchema = new mongoose.Schema(
  {
    originalname: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    audioData: {
      type: Buffer,
      required: true,
    },
    convertedFiles: [
      {
        name: {
          type: String,
          // required: true,
        },
        type: {
          type: String,
          // required: true,
        },
        size: {
          type: Number,
          // required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const UploadedAudio = mongoose.model("UploadedAudio", UploadedAudioSchema);

module.exports = UploadedAudio;
