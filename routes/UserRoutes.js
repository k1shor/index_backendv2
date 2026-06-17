const express = require("express");
const router = express.Router();

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
  getUserById,
  updateUser,
  deleteUser,
  isLoggedIn,
  isAdmin,
  getUserStats,
  updateProfile,
  getProfile,
} = require("../controllers/UserController");

const cloudinaryUpload = require("../middleware/cloudinaryUpload");
const upload = cloudinaryUpload("users");

// AUTH
router.post("/register", upload.single("image"), register);
router.get("/verify/:token", verifyUser);
router.post("/resendverification", resendVerification);
router.post("/forgetpassword", forgetpassword);
router.post("/resetpassword/:token", resetPassword);
router.post("/signin", login);

// ADMIN
router.get("/stats", isAdmin, getUserStats);
router.get("/getallusers", isAdmin, getAllUsers);
router.get("/getuser/:id", isAdmin, getUserById);
// router.put("/updateuser/:id", isAdmin, updateUser);
router.put("/updateuser/:id", isAdmin, upload.single("image"), updateUser);
router.delete("/deleteuser/:id", isAdmin, deleteUser);
router.put("/changerole/:id", isAdmin, changeRole);
router.put("/verifyuserbyadmin/:id", isAdmin, verifyUserByAdmin);

// LOGGED-IN USER
router.get("/profile", isLoggedIn, getProfile);
router.put("/updateprofile", isLoggedIn, upload.single("image"), updateProfile);

// NOTE: Public team endpoint moved to TeamMemberRoutes → GET /team/public

module.exports = router;
