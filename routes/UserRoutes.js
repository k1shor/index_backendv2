const express = require('express')
const router = express.Router()
const {
  register,
  verifyUser,
  resendVerification,
  forgetpassword,
  resetPassword,
  login,
  changeRole,
  verifyUserByAdmin,
  getAllUsers,
  isLoggedIn,
  isAdmin,
} = require('../controllers/UserController')

const UserModel = require('../models/UserModel')
const upload = require('../middleware/fileUpload')

// ✅ AUTHENTICATION ROUTES
router.post('/register', upload.single("image"), register)
router.get('/verify/:token', verifyUser)
router.post('/resendverification', resendVerification)
router.post('/forgetpassword', forgetpassword)
router.post('/resetpassword/:token', resetPassword)
router.post('/signin', login)
// router.post('/getUser', getUser)

// ✅ ADMIN-ONLY ROUTES
// Get all users (admin only)
router.get('/getallusers', isAdmin, getAllUsers)

// Get a single user by ID
router.get('/getuser/:id', isAdmin, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update user details (admin only)
router.put('/updateuser/:id', isAdmin, async (req, res) => {
  try {
    const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ message: 'User updated successfully', user })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete a user (admin only)
router.delete('/deleteuser/:id', isAdmin, async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Change user role (admin only)
router.put('/changerole/:id', isAdmin, changeRole)

// Verify user manually (admin only)
router.put('/verifyuserbyadmin/:id', isAdmin, verifyUserByAdmin)

// ✅ LOGGED-IN USER ROUTES
// Get current logged-in user's profile
router.get("/profile", isLoggedIn, async (req, res) => {
  const user = await UserModel.findById(req.user._id);
  res.json(user);
});

// Update logged-in user's own profile
router.put('/updateprofile', isLoggedIn, async (req, res) => {
  try {
    const token = req.headers.authorization
    const jwt = require('jsonwebtoken')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const updatedUser = await UserModel.findByIdAndUpdate(decoded._id, req.body, { new: true })
    if (!updatedUser) return res.status(404).json({ error: 'User not found' })
    res.json({ message: 'Profile updated successfully', user: updatedUser })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
