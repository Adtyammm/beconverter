const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    processedName: {
      type: String,
      required: true,
    },
    processedUrl: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ImageDB = mongoose.model("ImageDB", imageSchema);

module.exports = ImageDB;
