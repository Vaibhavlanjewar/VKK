require('dotenv').config(); // Must be at the very top
const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const aiRoutes = require("./routes/aiRoutes"); // 1. Import AI Routes

const app = express();

app.use(cors());
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.send("Krishi Kendra Backend Running 🚀");
});

// API routes
app.use("/api", productRoutes);
app.use("/api", billRoutes);
app.use("/api/ai", aiRoutes); // 2. Mount AI Routes with /ai prefix

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});