const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded._id).select("-password");
      console.log(req.user)

      if (!req.user) return res.status(401).json({ message: "User not found" });

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) return res.status(401).json({ message: "Not authorized, no token" });
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role == 1) {
    next();
  } else {
    res.status(403).json({ message: "Admin access only" });
  }
};
