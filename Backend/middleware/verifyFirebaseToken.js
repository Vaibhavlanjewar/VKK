const admin = require("firebase-admin");
// Destructure both lists from your config
const { adminPhones, adminEmails } = require("../config/adminPhones");

const verifyFirebaseToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Extract both potential identifiers
    const phoneNumber = decodedToken.phone_number;
    const email = decodedToken.email;

    // CHECK LOGIC: 
    // Is the phone in the phone list OR is the email in the email list?
    const isPhoneAdmin = phoneNumber && adminPhones.includes(phoneNumber);
    const isEmailAdmin = email && adminEmails.includes(email);

    if (!isPhoneAdmin && !isEmailAdmin) {
      return res.status(403).json({
        message: "Access denied. User not authorized as admin."
      });
    }

    req.user = decodedToken;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = verifyFirebaseToken;