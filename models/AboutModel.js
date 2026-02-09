const mongoose = require("mongoose");

const AboutSchema = new mongoose.Schema(
  {
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    image_id: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("About", AboutSchema);
