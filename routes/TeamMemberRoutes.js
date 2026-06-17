const express = require("express");
const router = express.Router();

const {
  submitRequest,
  getMyRequest,
  withdrawRequest,
  getAllRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  deleteRequest,
  getPublicTeam,
  searchEligibleUsers,
  addExistingUserAsMember,
  updateMemberDetails,
} = require("../controllers/TeamMemberController");

const { isLoggedIn, isAdmin } = require("../controllers/UserController");

// ─── PUBLIC ────────────────────────────────────────────────────────────────
// Replaces the old /user/team route — fetch all approved team members
router.get("/public", getPublicTeam);

// ─── LOGGED-IN USER ─────────────────────────────────────────────────────────
// Submit a join request
router.post("/apply", isLoggedIn, submitRequest);

// Check own request status
router.get("/my-request", isLoggedIn, getMyRequest);

// Withdraw a pending request
router.delete("/my-request", isLoggedIn, withdrawRequest);

// ─── ADMIN ──────────────────────────────────────────────────────────────────
// Search registered users not yet on the team (for the "Add Member" picker)
router.get("/eligible-users", isAdmin, searchEligibleUsers);

// Directly add an existing registered user as an approved team member
router.post("/add-existing", isAdmin, addExistingUserAsMember);

// Get all requests (optional ?status=pending|approved|rejected)
router.get("/", isAdmin, getAllRequests);

// Get single request
router.get("/:id", isAdmin, getRequestById);

// Approve a request
router.put("/:id/approve", isAdmin, approveRequest);

// Reject a request
router.put("/:id/reject", isAdmin, rejectRequest);

// Update member details (position/bio/links) — admin edit
router.put("/:id", isAdmin, updateMemberDetails);

// Delete a request record entirely
router.delete("/:id", isAdmin, deleteRequest);

module.exports = router;
