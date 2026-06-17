const TeamMemberModel = require("../models/TeammemberModel");
const UserModel = require("../models/UserModel");

// =============================
// USER: SUBMIT JOIN REQUEST
// =============================
exports.submitRequest = async (req, res) => {
  try {
    const { position, bio, skills, linkedin, github } = req.body;

    if (!position) {
      return res.status(400).json({ error: "Position is required." });
    }

    // Check if this user already has an active request
    const existing = await TeamMemberModel.findOne({ user: req.user._id });
    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({
          error: "You already have a pending team member request.",
        });
      }
      if (existing.status === "approved") {
        return res.status(400).json({
          error: "You are already an approved team member.",
        });
      }
      // If rejected, allow them to re-apply by updating the old record
      existing.position = position;
      existing.bio = bio || "";
      existing.skills = skills || [];
      existing.linkedin = linkedin || "";
      existing.github = github || "";
      existing.status = "pending";
      existing.adminNote = "";
      existing.reviewedAt = undefined;
      existing.reviewedBy = undefined;
      await existing.save();

      return res.status(200).json({
        message: "Your team member request has been resubmitted for review.",
        request: existing,
      });
    }

    const newRequest = new TeamMemberModel({
      user: req.user._id,
      position,
      bio: bio || "",
      skills: skills || [],
      linkedin: linkedin || "",
      github: github || "",
    });

    await newRequest.save();

    return res.status(201).json({
      message: "Your request has been submitted. An admin will review it soon.",
      request: newRequest,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// USER: GET OWN REQUEST STATUS
// =============================
exports.getMyRequest = async (req, res) => {
  try {
    const request = await TeamMemberModel.findOne({
      user: req.user._id,
    }).populate("user", "firstname lastname username email image");

    if (!request) {
      return res.status(404).json({ error: "No team member request found." });
    }

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// USER: WITHDRAW REQUEST
// =============================
exports.withdrawRequest = async (req, res) => {
  try {
    const request = await TeamMemberModel.findOne({ user: req.user._id });

    if (!request) {
      return res.status(404).json({ error: "No request found to withdraw." });
    }

    if (request.status === "approved") {
      return res.status(400).json({
        error: "Cannot withdraw an already approved request. Contact admin.",
      });
    }

    await TeamMemberModel.deleteOne({ _id: request._id });

    return res.json({
      message: "Your team member request has been withdrawn.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: GET ALL REQUESTS (with filters)
// =============================
exports.getAllRequests = async (req, res) => {
  try {
    const status = req.query.status || ""; // 'pending' | 'approved' | 'rejected' | ''
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      100
    );
    const skip = (page - 1) * limit;

    const query = status ? { status } : {};

    const [requests, total] = await Promise.all([
      TeamMemberModel.find(query)
        .populate("user", "firstname lastname username email image role")
        .populate("reviewedBy", "firstname lastname username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TeamMemberModel.countDocuments(query),
    ]);

    // Summary counts
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      TeamMemberModel.countDocuments({ status: "pending" }),
      TeamMemberModel.countDocuments({ status: "approved" }),
      TeamMemberModel.countDocuments({ status: "rejected" }),
    ]);

    return res.json({
      data: requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: GET SINGLE REQUEST
// =============================
exports.getRequestById = async (req, res) => {
  try {
    const request = await TeamMemberModel.findById(req.params.id)
      .populate(
        "user",
        "firstname lastname username email image role phonenumber"
      )
      .populate("reviewedBy", "firstname lastname username");

    if (!request) return res.status(404).json({ error: "Request not found." });

    return res.json(request);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: APPROVE REQUEST
// =============================
exports.approveRequest = async (req, res) => {
  try {
    const request = await TeamMemberModel.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found." });

    if (request.status === "approved") {
      return res.status(400).json({ error: "Request is already approved." });
    }

    request.status = "approved";
    request.adminNote = req.body.adminNote || "";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    return res.json({ message: "Team member approved successfully.", request });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: REJECT REQUEST
// =============================
exports.rejectRequest = async (req, res) => {
  try {
    const request = await TeamMemberModel.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found." });

    if (request.status === "rejected") {
      return res.status(400).json({ error: "Request is already rejected." });
    }

    request.status = "rejected";
    request.adminNote = req.body.adminNote || "";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    return res.json({ message: "Team member request rejected.", request });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: DELETE REQUEST
// =============================
exports.deleteRequest = async (req, res) => {
  try {
    const request = await TeamMemberModel.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found." });
    return res.json({ message: "Team member request deleted." });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: SEARCH REGISTERED USERS NOT YET ON TEAM
// =============================
exports.searchEligibleUsers = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();

    // IDs of users who already have a team member record (any status)
    const existingUserIds = await TeamMemberModel.find({}).distinct("user");

    const query = {
      _id: { $nin: existingUserIds },
      ...(search
        ? {
            $or: [
              { firstname: { $regex: search, $options: "i" } },
              { lastname: { $regex: search, $options: "i" } },
              { username: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    const users = await UserModel.find(query)
      .select("firstname lastname username email image role position about")
      .sort({ firstname: 1 })
      .limit(20);

    return res.json({ data: users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: DIRECTLY ADD EXISTING USER AS APPROVED TEAM MEMBER
// =============================
exports.addExistingUserAsMember = async (req, res) => {
  try {
    const { userId, position, bio, skills, linkedin, github } = req.body;

    if (!userId || !position) {
      return res.status(400).json({ error: "User and position are required." });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const existing = await TeamMemberModel.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({
        error: "This user already has a team member record.",
      });
    }

    const newMember = new TeamMemberModel({
      user: userId,
      position,
      bio: bio || "",
      skills: skills || [],
      linkedin: linkedin || "",
      github: github || "",
      status: "approved",  
      reviewedAt: new Date(),
      reviewedBy: req.user._id,
    });

    await newMember.save();

    return res.status(201).json({
      message: "Team member added successfully.",
      member: newMember,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// ADMIN: UPDATE TEAM MEMBER DETAILS 
// =============================
exports.updateMemberDetails = async (req, res) => {
  try {
    const { position, bio, linkedin, github, skills } = req.body;

    const member = await TeamMemberModel.findById(req.params.id);
    if (!member)
      return res.status(404).json({ error: "Team member not found." });

    if (position !== undefined) member.position = position;
    if (bio !== undefined) member.bio = bio;
    if (linkedin !== undefined) member.linkedin = linkedin;
    if (github !== undefined) member.github = github;
    if (skills !== undefined) member.skills = skills;

    await member.save();

    return res.json({ message: "Team member updated.", member });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// =============================
// PUBLIC: GET APPROVED TEAM MEMBERS
// =============================
exports.getPublicTeam = async (req, res) => {
  try {
    const members = await TeamMemberModel.find({ status: "approved" })
      .populate("user", "firstname lastname username image")
      .sort({ reviewedAt: 1 });

    return res.json({ data: members });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
