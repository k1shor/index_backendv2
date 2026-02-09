const mongoose = require("mongoose");

const reasonsSchema = new mongoose.Schema(
  {
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    reason_image: {
      type: String,
      default: "",
    },
    sn: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reasons", reasonsSchema);
