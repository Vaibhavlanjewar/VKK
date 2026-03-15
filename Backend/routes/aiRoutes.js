const express = require("express");
const router = express.Router();
const { getSummary, askQuestion } = require("../controllers/aiController");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

router.get("/summary", verifyFirebaseToken, getSummary);
router.post("/ask", verifyFirebaseToken, askQuestion);

module.exports = router;