const express = require("express");
const router = express.Router();
const { createBill, generateBillPDF, getAllBills } = require("../controllers/billController");

router.post("/bills", createBill); 
router.get("/bills", getAllBills); // <-- ADD THIS LINE
router.get("/bills/:id/pdf", generateBillPDF);

module.exports = router;