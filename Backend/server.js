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

// 1. IMPROVED CORS: Allow the specific frontend and localhost for testing
// app.use(cors({
//   origin: [
//     "https://vaibhav-krishi-kendra-b3d8.vercel.app",
//     "http://localhost:5173" 
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true
// }));

app.use(cors({
  origin: [
    "https://vaibhav-krishi-kendra-b3d8.vercel.app", // Preview URL
    "https://vaibhav-krishi-kendra.vercel.app",      // Production URL
    "http://localhost:5173"                          // Local Testing
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// 2. PUBLIC TEST ROUTE
app.get("/", (req, res) => {
  res.send("Vaibhav Krishi Kendra Backend is Live 🚀");
});

/** * 3. PROTECTED API ROUTES
 * Note: If your productRoutes.js defines router.get("/products"), 
 * using "/api" here makes the final URL: [YOUR_URL]/api/products
 */
app.use("/api", verifyFirebaseToken, productRoutes);
app.use("/api", verifyFirebaseToken, billRoutes);
app.use("/api/ai", verifyFirebaseToken, aiRoutes);

// 4. GLOBAL ERROR HANDLER (Helps debug 500 errors in Vercel logs)
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});