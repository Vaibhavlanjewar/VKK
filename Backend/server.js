require('dotenv').config(); 
const express = require("express");
const cors = require("cors");

// Import your Routes
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const aiRoutes = require("./routes/aiRoutes");

// IMPORT THE AUTH MIDDLEWARE
const verifyFirebaseToken = require("./middleware/verifyFirebaseToken");

const app = express();

// Update CORS to allow your Vercel Frontend
app.use(cors({
  origin: "https://vaibhav-krishi-kendra-b3d8.vercel.app"
}));

app.use(express.json());

// Root test route (Public)
app.get("/", (req, res) => {
  res.send("Krishi Kendra Backend Running 🚀");
});

/** * PROTECT ROUTES
 * By adding verifyFirebaseToken here, every request to products, bills, or AI
 * MUST come from an email in your adminEmails list.
 */
app.use("/api", verifyFirebaseToken, productRoutes);
app.use("/api", verifyFirebaseToken, billRoutes);
app.use("/api/ai", verifyFirebaseToken, aiRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
