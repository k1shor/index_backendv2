require("dotenv").config();
const mongoose = require("mongoose");
const SiteContent = require("../models/SiteContentModel");

const seedData = {
  key: "mission-vision",

  heading: "Mission & Vision",

  intro:
    "We build digital solutions that combine technology, design, SEO, and marketing for measurable growth.",

  mission: {
    title: "Our Mission",
    items: [
      { icon: "code", text: "Deliver scalable web and software solutions" },
      { icon: "ux", text: "Create intuitive UI/UX experiences" },
      { icon: "seo", text: "Improve visibility through SEO" },
      { icon: "marketing", text: "Run data-driven marketing campaigns" },
      { icon: "trust", text: "Build long-term client partnerships" }
    ]
  },

  vision: {
    title: "Our Vision",
    items: [
      { icon: "global", text: "Become a trusted full-service tech partner" },
      { icon: "innovation", text: "Lead in modern web and software innovation" },
      { icon: "growth", text: "Drive sustainable business growth" },
      { icon: "impact", text: "Deliver solutions with real-world impact" }
    ]
  }
};

async function seed() {
  try {
    await mongoose.connect(process.env.DATABASE);

    await SiteContent.findOneAndUpdate(
      { key: "mission-vision" },
      seedData,
      { upsert: true, new: true }
    );

    console.log("✅ Mission & Vision seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
