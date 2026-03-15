const express = require("express");
const router = express.Router();
const { createBill, generateBillPDF, getAllBills } = require("../controllers/billController");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

router.post("/bills", verifyFirebaseToken, createBill);
router.get("/bills", verifyFirebaseToken, getAllBills);
router.get("/bills/:id/pdf", verifyFirebaseToken, generateBillPDF);

module.exports = router;