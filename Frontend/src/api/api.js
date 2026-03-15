require('dotenv').config(); 
const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const aiRoutes = require("./routes/aiRoutes");
const verifyFirebaseToken = require("./middleware/verifyFirebaseToken");

const app = express();

app.use(cors({
  origin: [
    "https://vaibhav-krishi-kendra-b3d8.vercel.app",
    "https://vaibhav-krishi-kendra.vercel.app",
    "http://localhost:5173" 
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Public health check
app.get("/", (req, res) => res.send("Vaibhav Krishi Kendra API Active 🚀"));

// Apply verification to all /api routes
app.use("/api/products", verifyFirebaseToken, productRoutes);
app.use("/api/bills", verifyFirebaseToken, billRoutes);
app.use("/api/ai", verifyFirebaseToken, aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));