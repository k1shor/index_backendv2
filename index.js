const express = require("express");
require("dotenv").config();
require("./database/connection");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const userRoutes = require("./routes/UserRoutes");
const aboutRoutes = require("./routes/AboutRoutes");
const serviceRoutes = require("./routes/ServiceRoutes");
const projectRoutes = require("./routes/ProjectRoutes");
const reasonsRoutes = require("./routes/reasonRoutes");
const blogRoutes = require("./routes/blogRoutes");
const siteContentRoutes = require("./routes/siteContentRoutes");

const app = express();

const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) =>
      origin
        .trim()
        .replace(/^['"]|['"]$/g, "")
        .replace(/\/$/, "")
    )
    .filter(Boolean);

const allowedOrigins = new Set([
  "https://indexithub.com",
  "https://www.indexithub.com",
  ...parseOrigins(process.env.FRONTEND_URL),
  ...parseOrigins(process.env.CORS_ORIGINS),
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5173",
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(morgan("dev"));

app.use("/api/user", userRoutes);
app.use("/api/about", aboutRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/reasons", reasonsRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/sitecontent", siteContentRoutes)

// app.use("/api/public/uploads", express.static(path.join(__dirname, "public/uploads")));

app.get("/", (req, res) => res.send("SERVER is Running"));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log("SERVER STARTED SUCCESSFULLY", port));
