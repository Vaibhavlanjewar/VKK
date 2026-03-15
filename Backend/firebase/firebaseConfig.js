require('dotenv').config();
const admin = require("firebase-admin");

/**
 * Firebase Admin SDK initialization using environment variables.
 * All credentials come from .env (or host platform env vars for deployment).
 * 
 * The private key is stored in .env with literal \n characters.
 * The replace() call converts them to real newlines required by the PEM format.
 */
const serviceAccount = {
    type: process.env.FIREBASE_TYPE || "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_EMAIL
        ? `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
        : "",
    universe_domain: "googleapis.com"
};

let db, auth;

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });
        console.log("✅ Firebase Admin SDK connected successfully!");
    }
    db = admin.database();
    auth = admin.auth();
} catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
    console.error("   Check that all FIREBASE_* variables are set correctly in your .env");
}

module.exports = { admin, db, auth };