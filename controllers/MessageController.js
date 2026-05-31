const Contact = require("../models/InquiryModel");
const FAQ = require("../models/FAQModel");
const sendEmail = require("../middleware/emailSender");

const defaultFaqs = [
  {
    _id: "default-services",
    question: "What services does Index IT Hub provide?",
    answer:
      "Index IT Hub helps with websites, custom software, mobile apps, digital marketing, SEO, IT consultation, support, and upgrades.",
    category: "Services",
    keywords: ["services", "website", "software", "mobile app", "marketing", "seo"],
    isDefault: true,
    isActive: true,
  },
  {
    _id: "default-pricing",
    question: "How much does a project cost?",
    answer:
      "Pricing depends on scope, timeline, integrations, and content needs. Share your brief and the team will help define a practical estimate.",
    category: "Pricing",
    keywords: ["price", "pricing", "cost", "budget", "quote"],
    isDefault: true,
    isActive: true,
  },
  {
    _id: "default-timeline",
    question: "How long does development take?",
    answer:
      "Small websites can move quickly, while custom platforms and apps need more planning and testing. The team usually starts by defining the first useful release.",
    category: "Delivery",
    keywords: ["timeline", "time", "duration", "deadline", "delivery"],
    isDefault: true,
    isActive: true,
  },
  {
    _id: "default-support",
    question: "Do you provide support after launch?",
    answer:
      "Yes. Index IT Hub can help with maintenance, improvements, performance, security, and ongoing content or feature updates after launch.",
    category: "Support",
    keywords: ["support", "maintenance", "after launch", "update", "upgrade"],
    isDefault: true,
    isActive: true,
  },
  {
    _id: "default-contact",
    question: "How can I contact Index IT Hub?",
    answer:
      "You can email info@indexithub.com, call +977 9860113289, or leave a message here and the team will follow up.",
    category: "Contact",
    keywords: ["contact", "email", "phone", "call", "location"],
    isDefault: true,
    isActive: true,
  },
];

const clean = (value = "") => String(value || "").trim();

const normalize = (value = "") =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const splitTerms = (value = "") =>
  normalize(value)
    .split(" ")
    .filter((term) => term.length > 2);

const toPublicFaq = (faq) => ({
  _id: faq._id,
  question: faq.question,
  answer: faq.answer,
  category: faq.category || "General",
  keywords: faq.keywords || [],
  isDefault: Boolean(faq.isDefault),
});

const buildFaqQuery = (search) => {
  const safeSearch = clean(search);
  if (!safeSearch) return {};

  return {
    $or: [
      { question: { $regex: safeSearch, $options: "i" } },
      { answer: { $regex: safeSearch, $options: "i" } },
      { category: { $regex: safeSearch, $options: "i" } },
      { keywords: { $elemMatch: { $regex: safeSearch, $options: "i" } } },
    ],
  };
};

const getFaqPool = async () => {
  const faqs = await FAQ.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
  return [...faqs, ...defaultFaqs].map(toPublicFaq);
};

const scoreFaq = (question, faq) => {
  const query = normalize(question);
  const terms = splitTerms(question);
  const faqQuestion = normalize(faq.question);
  const faqAnswer = normalize(faq.answer);
  const keywords = (faq.keywords || []).map(normalize).filter(Boolean);

  let score = 0;
  if (!query) return score;
  if (faqQuestion === query) score += 12;
  if (faqQuestion.includes(query) || query.includes(faqQuestion)) score += 8;

  keywords.forEach((keyword) => {
    if (keyword && query.includes(keyword)) score += 6;
  });

  terms.forEach((term) => {
    if (faqQuestion.includes(term)) score += 2;
    if (faqAnswer.includes(term)) score += 1;
    if (keywords.some((keyword) => keyword.includes(term))) score += 2;
  });

  return score;
};

const findBestFaq = (question, faqs) => {
  return faqs
    .map((faq) => ({ faq, score: scoreFaq(question, faq) }))
    .sort((a, b) => b.score - a.score)[0];
};

const getMessageStatsSummary = async () => {
  const [total, fresh, open, inProgress, resolved, archived] = await Promise.all([
    Contact.countDocuments(),
    Contact.countDocuments({ status: "new" }),
    Contact.countDocuments({ status: "open" }),
    Contact.countDocuments({ status: "in-progress" }),
    Contact.countDocuments({ status: { $in: ["resolved", "closed"] } }),
    Contact.countDocuments({ status: "archived" }),
  ]);

  return { total, new: fresh, open, inProgress, resolved, archived };
};

exports.getPublicFaqs = async (req, res) => {
  try {
    const faqs = await getFaqPool();
    res.json({ success: true, data: faqs, faqs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const message = clean(req.body.message);
    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required." });
    }

    const contact = await Contact.create({
      name: clean(req.body.name) || "Website Visitor",
      email: clean(req.body.email),
      phone: clean(req.body.phone),
      subject: clean(req.body.subject) || "Website inquiry",
      category: clean(req.body.category),
      priority: clean(req.body.priority) || "normal",
      source: clean(req.body.source) || "contact",
      message,
      transcript: Array.isArray(req.body.transcript) ? req.body.transcript : [],
      status: "new",
    });

    res.status(201).json({
      success: true,
      message: "Message received successfully.",
      data: contact,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.chatbotReply = async (req, res) => {
  try {
    const question = clean(req.body.question || req.body.message);
    if (!question) {
      return res.status(400).json({ success: false, error: "Question is required." });
    }

    const faqs = await getFaqPool();
    const best = findBestFaq(question, faqs);

    if (best && best.score >= 4) {
      return res.json({
        success: true,
        type: "faq",
        answer: best.faq.answer,
        faq: best.faq,
        score: best.score,
      });
    }

    const contact = await Contact.create({
      name: clean(req.body.name) || "Website Visitor",
      email: clean(req.body.email),
      phone: clean(req.body.phone),
      subject: "Chatbot follow-up",
      category: "Chatbot",
      source: "chatbot",
      message: question,
      status: "new",
      transcript: [
        { sender: "visitor", text: question },
        {
          sender: "bot",
          text: "I could not find an exact FAQ answer, so I sent this to the team for follow-up.",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      type: "handoff",
      answer:
        "I could not find an exact FAQ answer, so I sent this to the Index IT Hub team. If you share your email or phone, they can follow up directly.",
      messageId: contact._id,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const search = clean(req.query.search);
    const status = clean(req.query.status);
    const source = clean(req.query.source);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};
    if (status && status !== "all") query.status = status;
    if (source && source !== "all") query.source = source;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const [messages, total, stats] = await Promise.all([
      Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Contact.countDocuments(query),
      getMessageStatsSummary(),
    ]);

    res.json({
      success: true,
      data: messages,
      messages,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMessageStats = async (req, res) => {
  try {
    res.json({ success: true, stats: await getMessageStatsSummary() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const message = await Contact.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, error: "Message not found." });
    res.json({ success: true, data: message, message });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const allowed = ["status", "priority", "category", "subject", "name", "email", "phone"];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = clean(req.body[field]);
    });

    const message = await Contact.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!message) return res.status(404).json({ success: false, error: "Message not found." });
    res.json({ success: true, message: "Message updated successfully.", data: message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.replyToMessage = async (req, res) => {
  try {
    const reply = clean(req.body.message);
    if (!reply) return res.status(400).json({ success: false, error: "Reply is required." });

    const message = await Contact.findById(req.params.id);
    if (!message) return res.status(404).json({ success: false, error: "Message not found." });

    const responseEntry = {
      message: reply,
      responderName: clean(req.body.responderName) || req.user?.username || "Index IT Hub Team",
      responder: req.user?._id,
      isPublic: req.body.isPublic !== false,
      emailSent: false,
    };

    const canSendEmail =
      message.email &&
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      req.body.sendEmail !== false;

    if (canSendEmail) {
      try {
        await sendEmail({
          to: message.email,
          subject: `Re: ${message.subject || "Your Index IT Hub message"}`,
          text: reply,
          html: `<p>${reply.replace(/\n/g, "<br />")}</p>`,
        });
        responseEntry.emailSent = true;
      } catch (emailError) {
        responseEntry.emailError = emailError.message;
      }
    }

    message.responses.push(responseEntry);
    message.lastResponseAt = new Date();
    message.status = clean(req.body.status) || "in-progress";

    await message.save();
    res.json({ success: true, message: "Reply saved successfully.", data: message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await Contact.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ success: false, error: "Message not found." });
    res.json({ success: true, message: "Message deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getFaqs = async (req, res) => {
  try {
    const search = clean(req.query.search);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;
    const query = buildFaqQuery(search);

    const [faqs, total] = await Promise.all([
      FAQ.find(query).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit),
      FAQ.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: faqs,
      faqs,
      defaults: defaultFaqs.map(toPublicFaq),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createFaq = async (req, res) => {
  try {
    const faq = await FAQ.create({
      question: clean(req.body.question),
      answer: clean(req.body.answer),
      category: clean(req.body.category) || "General",
      keywords: Array.isArray(req.body.keywords)
        ? req.body.keywords.map(clean).filter(Boolean)
        : clean(req.body.keywords).split(",").map(clean).filter(Boolean),
      isActive: req.body.isActive !== false,
      sortOrder: Number(req.body.sortOrder) || 0,
    });

    res.status(201).json({ success: true, message: "FAQ created successfully.", data: faq });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const updates = {};
    ["question", "answer", "category"].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = clean(req.body[field]);
    });
    if (req.body.keywords !== undefined) {
      updates.keywords = Array.isArray(req.body.keywords)
        ? req.body.keywords.map(clean).filter(Boolean)
        : clean(req.body.keywords).split(",").map(clean).filter(Boolean);
    }
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
    if (req.body.sortOrder !== undefined) updates.sortOrder = Number(req.body.sortOrder) || 0;

    const faq = await FAQ.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!faq) return res.status(404).json({ success: false, error: "FAQ not found." });
    res.json({ success: true, message: "FAQ updated successfully.", data: faq });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ success: false, error: "FAQ not found." });
    res.json({ success: true, message: "FAQ deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
