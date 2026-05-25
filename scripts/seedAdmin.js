require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const UserModel = require("../models/UserModel");

const mustGetEnv = (k) => {
    const v = process.env[k];
    if (!v) throw new Error(`Missing env: ${k}`);
    return v;
};

async function main() {
    const uri = mustGetEnv("DATABASE");

    const email = (process.env.SEED_ADMIN_EMAIL || "admin2@example.com")
        .toLowerCase()
        .trim();

    const password = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
    const username = process.env.SEED_ADMIN_NAME || "Admin";

    await mongoose.connect(uri);

    const existing = await UserModel.findOne({ email });
    if (existing) {
        console.log(`ℹ️ Admin already exists: ${email}`);
        await mongoose.disconnect();
        process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 12);

    await UserModel.create({
        username,
        email,
        password: hashed,
        role: 1,
    });

    console.log(`✅ Seeded admin: ${email}`);
    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error("❌ Seed failed:", err.message);
    try {
        await mongoose.disconnect();
    } catch { }
    process.exit(1);
});
