const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const User = require("../models/UserModel"); // adjust path if needed

console.log("Connecting to URI:", process.env.DATABASE);

mongoose.connect(process.env.DATABASE)
  .then(() => {
    console.log("Database connected successfully.")
    return true
  })
  .catch(err => console.error("Connection Error:", err));

