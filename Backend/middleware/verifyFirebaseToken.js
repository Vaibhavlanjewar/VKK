const admin = require("firebase-admin");
// Ensure the path and file name match your actual config file exactly
const { adminPhones, adminEmails } = require("../config/adminPhones");

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided. Please log in." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Extract identifiers from the decoded token
    const phoneNumber = decodedToken.phone_number;
    const email = decodedToken.email;

    // Safety Check: Ensure the arrays exist before calling .includes()
    const validPhones = Array.isArray(adminPhones) ? adminPhones : [];
    const validEmails = Array.isArray(adminEmails) ? adminEmails : [];

    // Check if the user's phone OR email is in the authorized admin lists
    const isPhoneAdmin = phoneNumber && validPhones.includes(phoneNumber);
    const isEmailAdmin = email && validEmails.includes(email);

    if (!isPhoneAdmin && !isEmailAdmin) {
      console.warn(`Unauthorized access attempt: ${email || phoneNumber}`);
      return res.status(403).json({
        message: "Access denied. You are not authorized as an admin for Vaibhav Krishi Kendra."
      });
    }

    // Attach user info to the request and proceed
    req.user = decodedToken;
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Session expired or invalid token." });
  }
};

module.exports = verifyFirebaseToken;
