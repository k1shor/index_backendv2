const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: 150,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: Types.ObjectId,
      ref: "Service",
      required: [true, "Project category is required"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
    },
    technologies: {
      type: [String], // Array of tech stack
      default: [],
    },
    images: {
      type: [String], // Multiple project images
      default: [],
    },
    client: {
      name: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    links: {
      demo: { type: String, trim: true },
      repository: { type: String, trim: true },
      caseStudy: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["completed", "ongoing", "paused"],
      default: "completed",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Project", projectSchema);
