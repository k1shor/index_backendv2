const mongoose = require("mongoose");
const slugify = require("slugify");

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },

    shortDescription: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        required: true,
    },

    // Image uploaded via Multer
    image: {
        type: String,
        required: true,
        trim: true,           // optional improvement
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },

    metaTitle: {
        type: String,
        trim: true,
    },

    metaDescription: {
        type: String,
        trim: true,
    },

    keywords: {
        type: [String],
        default: [],
    },

    category: {
        type: String,
        trim: true,
        default: "General",
    },

    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft",
    },

    author: {
        type: String,
        default: "Admin",
    },

}, { timestamps: true });


// ----------------------------------------------------------
// AUTO-GENERATE SLUG (Make Unique)
// ----------------------------------------------------------
BlogSchema.pre("save", async function (next) {
    if (this.isModified("title")) {
        let generatedSlug = slugify(this.title, { lower: true, strict: true });
        const exists = await this.constructor.findOne({ slug: generatedSlug });

        if (exists) {
            generatedSlug = `${generatedSlug}-${Date.now()}`;
        }
        this.slug = generatedSlug;
    }
    next();
});


// ----------------------------------------------------------
// AUTO-GENERATE META TITLE & DESCRIPTION
// ----------------------------------------------------------
BlogSchema.pre("save", function (next) {
    if (!this.metaTitle) {
        this.metaTitle = this.title.substring(0, 70);
    }
    if (!this.metaDescription) {
        this.metaDescription = this.shortDescription.substring(0, 160);
    }
    next();
});


// ----------------------------------------------------------
// CONVERT KEYWORDS STRING TO ARRAY
// ----------------------------------------------------------
BlogSchema.pre("save", function (next) {
    if (typeof this.keywords === "string") {
        this.keywords = this.keywords
            .split(",")
            .map(k => k.trim())
            .filter(k => k.length > 0);
    }
    next();
});

module.exports = mongoose.model("Blog", BlogSchema);
