/**
 * Firebase Configuration Template
 * 
 * Instructions:
 * 1. Copy this file to 'firebase-config.js'
 * 2. Replace the placeholder values with your actual Firebase project settings
 * 3. Add firebase-config.js to .gitignore to keep your credentials secure
 * 
 * To get your Firebase config:
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Select your project
 * 3. Go to Project Settings (gear icon)
 * 4. Scroll down to "Your apps" section
 * 5. Click on the web app or create a new web app
 * 6. Copy the config object values
 */

// Firebase Configuration
window.FIREBASE_CONFIG = {
    apiKey: "your-api-key-here",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678"
};

// Optional: Enable Firebase Auth persistence
// This keeps users logged in across browser sessions
window.FIREBASE_AUTH_PERSISTENCE = 'local'; // 'local', 'session', or 'none'
