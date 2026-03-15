require('dotenv').config();
const admin = require("firebase-admin");

const getPrivateKey = () => {
    let key = process.env.FIREBASE_PRIVATE_KEY;
    if (!key) return undefined;

    // 1. Remove all quotes and trim whitespace
    key = key.replace(/['"]/g, '').trim();

    // 2. Convert text \n into actual newline characters
    key = key.replace(/\\n/g, '\n');

    // 3. Remove existing headers/footers to clean out hidden spaces
    key = key.replace(/-----BEGIN PRIVATE KEY-----/g, '');
    key = key.replace(/-----END PRIVATE KEY-----/g, '');
    key = key.replace(/\s/g, ''); // Remove all spaces/tabs/newlines from the middle

    // 4. Rebuild the key with perfect formatting
    // Every 64 characters should technically be a newline, 
    // but the SDK is usually fine with the headers + one big block
    const cleanKey = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----\n`;
    
    return cleanKey;
};

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: getPrivateKey(),
};

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log("✅ Firebase Admin SDK connected successfully!");
    }
} catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
    // Log the first few characters of the key (for debugging only, remove later)
    if (serviceAccount.privateKey) {
        console.log("Key begins with:", serviceAccount.privateKey.substring(0, 40));
    }
}

const db = admin.database();
const auth = admin.auth();
module.exports = { admin, db, auth };