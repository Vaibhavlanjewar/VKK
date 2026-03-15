require('dotenv').config();
const admin = require("firebase-admin");

const getPrivateKey = () => {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!rawKey) return undefined;
    
    // If the key is wrapped in quotes, remove them
    const trimmedKey = rawKey.replace(/^['"]|['"]$/g, '');
    
    // If the key contains literal \n characters, convert them to actual newlines
    if (trimmedKey.includes('\\n')) {
        return trimmedKey.replace(/\\n/g, '\n');
    }
    
    return trimmedKey;
};

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: getPrivateKey(),
};

// Check if variables are actually loading
if (!serviceAccount.privateKey || !serviceAccount.projectId) {
    console.error("❌ ERROR: Firebase environment variables are missing!");
}

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log("✅ Firebase Admin Initialized Successfully");
    }
} catch (error) {
    console.error("❌ CRITICAL FIREBASE ERROR:", error.message);
    process.exit(1); // Stop the server so you can see the error clearly
}

const db = admin.database();
module.exports = db;