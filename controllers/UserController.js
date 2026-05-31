const UserModel = require("../models/UserModel");
const TokenModel = require("../models/TokenModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../middleware/emailSender");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");

const getToken = (req) => {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.split(" ")[1];
  return auth;
};

// =============================
// REGISTER
// =============================
exports.register = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      username,
      email,
      password,
      gender,
      age,
      phonenumber,
      address,
    } = req.body;

    if (
      !firstname ||
      !lastname ||
      !username ||
      !email ||
      !password ||
      !gender ||
      !age ||
      !phonenumber
    ) {
      return res.status(400).json({ error: "All required fields must be filled." });
    }

    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "Email or username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const image = req.file?.path || "";
    const image_id = req.file?.filename || "";

    const newUser = new UserModel({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      gender,
      age,
      phonenumber,
      address: {
        tempAddress: address?.tempAddress || [],
        permanentAddress: address?.permanentAddress || "",
      },
      image,
      image_id,
    });

    await newUser.save();

    const tokenDoc = await TokenModel.create({
      token: crypto.randomBytes(24).toString("hex"),
      user: newUser._id,
    });

    if (process.env.FRONTEND_URL) {
      sendEmail({
        to: newUser.email,
        subject: "Verify your email",
        html: `<a href="${process.env.FRONTEND_URL}/verify/${tokenDoc.token}">Verify Email</a>`,
      });
    }

    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        email: newUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
};

// =============================
// VERIFY USER
// =============================
exports.verifyUser = async (req, res) => {
  try {
    const token = req.params.token;
    const tokenData = await TokenModel.findOne({ token });
    if (!tokenData) return res.status(400).json({ error: "Invalid or expired token." });

    const user = await UserModel.findById(tokenData.user);
    if (!user) return res.status(400).json({ error: "User not found." });

    if (user.isVerified) return res.status(400).json({ error: "User already verified." });

    user.isVerified = true;
    await user.save();

    await TokenModel.deleteOne({ _id: tokenData._id });

    return res.json({ message: "User verified successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// RESEND VERIFICATION
// =============================
exports.resendVerification = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: "Email not registered." });

    if (user.isVerified) return res.status(400).json({ error: "User already verified." });

    const tokenDoc = await TokenModel.create({
      token: crypto.randomBytes(24).toString("hex"),
      user: user._id,
    });

    sendEmail({
      to: user.email,
      subject: "Resend Verification",
      html: `<a href="${process.env.FRONTEND_URL}/verify/${tokenDoc.token}">Verify Email</a>`,
    });

    return res.json({ message: "Verification link sent to your email." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// FORGET PASSWORD
// =============================
exports.forgetpassword = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: "Email not registered." });

    const tokenDoc = await TokenModel.create({
      user: user._id,
      token: crypto.randomBytes(24).toString("hex"),
    });

    sendEmail({
      to: user.email,
      subject: "Password Reset",
      html: `<a href="${process.env.FRONTEND_URL}/resetpassword/${tokenDoc.token}">Reset Password</a>`,
    });

    return res.json({ message: "Password reset link sent to your email." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// RESET PASSWORD
// =============================
exports.resetPassword = async (req, res) => {
  try {
    const tokenDoc = await TokenModel.findOne({ token: req.params.token });
    if (!tokenDoc) return res.status(400).json({ error: "Invalid or expired token." });

    const user = await UserModel.findById(tokenDoc.user);
    if (!user) return res.status(400).json({ error: "User not found." });

    const hashed = await bcrypt.hash(req.body.password, 10);
    user.password = hashed;
    await user.save();

    await TokenModel.deleteOne({ _id: tokenDoc._id });

    return res.json({ message: "Password reset successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// LOGIN
// =============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ error: "Email not registered." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials." });

    if (!user.isVerified) return res.status(400).json({ error: "User not verified. Please verify first." });

    const token = jwt.sign(
      { _id: user._id, role: user.role, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// AUTH MIDDLEWARES
// =============================
exports.isLoggedIn = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Not logged in." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token." });
  }
};

exports.isAdmin = async (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: "Not logged in." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserModel.findById(decoded._id);
    if (!user || user.role < 1) return res.status(403).json({ error: "Not authorized." });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
};

// =============================
// ADMIN: GET ALL USERS
// =============================
exports.getAllUsers = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { firstname: { $regex: search, $options: "i" } },
            { lastname: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { position: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [users, total, stats] = await Promise.all([
      UserModel.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(query),
      getUserStatsSummary(),
    ]);

    return res.json({
      data: users,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: GET USER BY ID
// =============================
exports.getUserById = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: UPDATE USER (NO PASSWORD)
// =============================
exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    delete updates.role;

    const user = await UserModel.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    return res.json({ message: "User updated successfully.", user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: DELETE USER + CLOUDINARY CLEANUP
// =============================
exports.deleteUser = async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ error: "You cannot delete your own admin account." });
    }

    const user = await UserModel.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (user.image_id) {
      await cloudinary.uploader.destroy(user.image_id);
    }

    return res.json({ message: "User deleted successfully." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: CHANGE ROLE
// =============================
exports.changeRole = async (req, res) => {
  try {
    const role = Number(req.body.role);
    if (![0, 1, 2].includes(role)) {
      return res.status(400).json({ error: "Invalid role." });
    }

    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ error: "You cannot change your own role." });
    }

    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: VERIFY USER BY ADMIN
// =============================
exports.verifyUserByAdmin = async (req, res) => {
  try {
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getUserStatsSummary = async () => {
  const [total, verified, admins, pending] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ isVerified: true }),
    UserModel.countDocuments({ role: { $gte: 1 } }),
    UserModel.countDocuments({ isVerified: false }),
  ]);

  return { total, verified, admins, pending };
};

exports.getUserStats = async (req, res) => {
  try {
    return res.json(await getUserStatsSummary());
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  const UserModel = require("../models/UserModel");
  const updatedUser = await UserModel.findByIdAndUpdate(req.user._id, req.body, { new: true });
  if (!updatedUser) return res.status(404).json({ error: "User not found" });
  res.json({ message: "Profile updated successfully", user: updatedUser });
}

exports.getProfile = async (req, res) => {
  const UserModel = require("../models/UserModel");
  const user = await UserModel.findById(req.user._id);
  res.json(user);
}
