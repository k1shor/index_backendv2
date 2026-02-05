const UserModel = require('../models/UserModel')
const TokenModel = require('../models/tokenModel')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const sendEmail = require('../middleware/emailSender')
const jwt = require('jsonwebtoken')

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

    // Validate required fields
    if (!firstname || !lastname || !username || !email || !password || !gender || !age || !phonenumber) {
      return res.status(400).json({ error: "All required fields must be filled." });
    }

    // Check if user exists
    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: "Email or username already exists." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle uploaded file
    let imagePath = "";
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

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
        tempAddress: address.tempAddress,
        permanentAddress: address.permanentAddress,
      },
      image: imagePath,
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
}

// =============================
// VERIFY USER
// =============================
exports.verifyUser = async (req, res) => {
  try {
    let token = req.params.token
    let tokenData = await TokenModel.findOne({ token })
    if (!tokenData)
      return res.status(400).json({ error: "Invalid or expired token." })

    let user = await UserModel.findById(tokenData.user)
    if (!user)
      return res.status(400).json({ error: "User not found." })

    if (user.isVerified)
      return res.status(400).json({ error: "User already verified." })

    user.isVerified = true
    await user.save()

    res.send({ message: "User verified successfully." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// =============================
// RESEND VERIFICATION EMAIL
// =============================
exports.resendVerification = async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ error: "Email not registered." })
    if (user.isVerified)
      return res.status(400).json({ error: "User already verified." })

    let token = await TokenModel.create({
      token: crypto.randomBytes(24).toString('hex'),
      user: user._id
    })

    sendEmail({
      from: 'something@something.com',
      to: req.body.email,
      subject: "Resend Verification",
      html: `<a href="${process.env.FRONTEND_URL}/verify/${token.token}">
              <button style="background:#ef4444;color:white;padding:10px 20px;border:none;border-radius:6px;">Verify Email</button>
            </a>`
    })

    res.send({ message: "Verification link sent to your email." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// =============================
// FORGET PASSWORD
// =============================
exports.forgetpassword = async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ error: "Email not registered." })

    let token = await TokenModel.create({
      user: user._id,
      token: crypto.randomBytes(24).toString('hex')
    })

    sendEmail({
      from: 'noreply@something.com',
      to: req.body.email,
      subject: "Password Reset",
      html: `<a href='${process.env.FRONTEND_URL}/resetpassword/${token.token}'><button>Reset Password</button></a>`
    })

    res.send({ message: "Password reset link sent to your email." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// =============================
// RESET PASSWORD
// =============================
exports.resetPassword = async (req, res) => {
  try {
    let token = await TokenModel.findOne({ token: req.params.token })
    if (!token) return res.status(400).json({ error: "Invalid or expired token." })

    let user = await UserModel.findById(token.user)
    if (!user) return res.status(400).json({ error: "User not found." })

    let salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(req.body.password, salt)
    await user.save()

    res.send({ message: "Password reset successfully." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// =============================
// LOGIN
// =============================
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body
    let user = await UserModel.findOne({ email })
    if (!user) return res.status(400).json({ error: "Email not registered." })

    let validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword)
      return res.status(400).json({ error: "Invalid credentials." })

    if (!user.isVerified)
      return res.status(400).json({ error: "User not verified. Please verify first." })

    let token = jwt.sign({
      _id: user._id,
      role: user.role,
      username: user.username,
      email: user.email
    }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.send({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getToken = (req) => {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.split(" ")[1];
  return auth; // fallback: raw token
};

// =============================
// AUTH MIDDLEWARE
// =============================
exports.isLoggedIn = async (req, res, next) => {
  const token = getToken(req);
  if (!token)
    return res.status(401).json({ error: "Not logged in." })
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: "Invalid token." })
  }
}

exports.isAdmin = async (req, res, next) => {
  const token = getToken(req);
  if (!token)
    return res.status(401).json({ error: "Not logged in." })
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET)
    let user = await UserModel.findById(decoded._id)
    if (!user || user.role < 1)
      return res.status(403).json({ error: "Not authorized." })
    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}

// =============================
// ADMIN FEATURES
// =============================

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    let users = await UserModel.find().sort({ createdAt: -1 })
    res.send(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    let user = await UserModel.findById(req.params.id)
    if (!user) return res.status(404).json({ error: "User not found." })
    res.send(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Update user (admin)
exports.updateUser = async (req, res) => {
  try {
    let updates = req.body
    delete updates.password // prevent direct password changes here

    let user = await UserModel.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!user) return res.status(404).json({ error: "User not found." })

    res.send({ message: "User updated successfully.", user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    let user = await UserModel.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ error: "User not found." })
    res.send({ message: "User deleted successfully." })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Promote/Demote Role
exports.changeRole = async (req, res) => {
  try {
    let user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true }
    )
    if (!user) return res.status(404).json({ error: "User not found." })
    res.send(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Verify user manually by admin
exports.verifyUserByAdmin = async (req, res) => {
  try {
    let user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    )
    if (!user) return res.status(404).json({ error: "User not found." })
    res.send(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
