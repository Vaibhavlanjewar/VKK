const admin = require("firebase-admin");
const { adminPhones, adminEmails } = require("../config/adminPhones");

const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // 1. Get the email and phone from the token
    // 2. Convert them to lowercase and remove any accidental spaces
    const userEmail = decodedToken.email ? decodedToken.email.toLowerCase().trim() : null;
    const userPhone = decodedToken.phone_number ? decodedToken.phone_number.trim() : null;

    // 3. Clean your admin list as well (just in case)
    const cleanAdminEmails = adminEmails.map(email => email.toLowerCase().trim());

    const isEmailAdmin = userEmail && cleanAdminEmails.includes(userEmail);
    const isPhoneAdmin = userPhone && adminPhones.includes(userPhone);

    if (!isEmailAdmin && !isPhoneAdmin) {
      console.warn(`Blocked access for: ${userEmail || userPhone}`);
      return res.status(403).json({
        message: "Access denied. User not authorized."
      });
    }

    req.user = decodedToken;
    next();

  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = verifyFirebaseToken;
