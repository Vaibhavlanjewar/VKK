// Import BOTH functions from the service
const { getAiBusinessSummary, processAiQuery } = require("../services/aiService");

const getSummary = async (req, res) => {
  try {
    const summary = await getAiBusinessSummary();
    res.status(200).json({ summary });
  } catch (error) {
    console.error("AI Controller Error (Summary):", error);
    res.status(500).json({ error: "Failed to generate AI business summary" });
  }
};

// NEW: Add the logic for the Prompt Box
const askQuestion = async (req, res) => {
  try {
    const { question } = req.body; // This grabs the text from your frontend input
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const answer = await processAiQuery(question);
    res.status(200).json({ answer });
  } catch (error) {
    console.error("AI Controller Error (Ask):", error);
    res.status(500).json({ error: "AI failed to process the question" });
  }
};

// CRITICAL: Export both so the Router can see them
module.exports = { 
  getSummary, 
  askQuestion 
};