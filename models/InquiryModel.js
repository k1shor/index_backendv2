const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    responderName: { type: String, default: "Index IT Hub Team" },
    responder: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublic: { type: Boolean, default: true },
    emailSent: { type: Boolean, default: false },
    emailError: { type: String },
  },
  { timestamps: true }
);

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    subject: { type: String, trim: true },
    category: { type: String, trim: true },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    source: {
      type: String,
      enum: ["contact", "chatbot", "admin", "website"],
      default: "contact",
    },
    message: { type: String, required: true, trim: true },
    transcript: [
      {
        sender: { type: String, enum: ["visitor", "bot", "admin"], required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["new", "open", "in-progress", "resolved", "closed", "archived"],
      default: "new",
    },
    responses: [responseSchema],
    lastResponseAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
