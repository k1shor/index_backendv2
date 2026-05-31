const express = require("express");
const {
  chatbotReply,
  createFaq,
  createMessage,
  deleteFaq,
  deleteMessage,
  getFaqs,
  getMessageById,
  getMessages,
  getMessageStats,
  getPublicFaqs,
  replyToMessage,
  updateFaq,
  updateMessage,
} = require("../controllers/MessageController");
const { isAdmin } = require("../controllers/UserController");

const router = express.Router();

router.get("/faqs", getPublicFaqs);
router.post("/", createMessage);
router.post("/chat", chatbotReply);

router.get("/admin/faqs", isAdmin, getFaqs);
router.post("/admin/faqs", isAdmin, createFaq);
router.put("/admin/faqs/:id", isAdmin, updateFaq);
router.delete("/admin/faqs/:id", isAdmin, deleteFaq);

router.get("/admin/stats", isAdmin, getMessageStats);
router.get("/admin", isAdmin, getMessages);
router.get("/admin/:id", isAdmin, getMessageById);
router.put("/admin/:id", isAdmin, updateMessage);
router.post("/admin/:id/reply", isAdmin, replyToMessage);
router.delete("/admin/:id", isAdmin, deleteMessage);

module.exports = router;
