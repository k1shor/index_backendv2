const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const SectionSchema = new mongoose.Schema({
  title: String,
  items: [ItemSchema]
}, { _id: false });

const SiteContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },

  heading: String,
  intro: String,

  mission: SectionSchema,
  vision: SectionSchema

}, { timestamps: true });

module.exports = mongoose.model("SiteContent", SiteContentSchema);
