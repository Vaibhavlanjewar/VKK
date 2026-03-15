const express = require("express");
const router = express.Router();
const { getSummary, askQuestion } = require("../controllers/aiController");

// This handles the automatic summary (GET)
router.get("/summary", getSummary);

// This handles the new Prompt Box (POST) <-- THIS IS LIKELY MISSING
router.post("/ask", askQuestion); 

module.exports = router;