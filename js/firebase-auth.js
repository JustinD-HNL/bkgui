// js/firebase-auth.js - Firebase Authentication Service (DISABLED)
// This file maintains the API structure but disables all authentication functionality

console.log('🔓 Firebase Authentication Service - DISABLED MODE');

/**
 * Firebase Authentication Service - Currently Disabled
 * 
 * All authentication functionality has been removed.
 * This file exists to maintain API compatibility if authentication
 * needs to be re-enabled in the future.
 */
class FirebaseAuthService {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.authDisabled = true;
        
        console.log('🚫 Authentication is currently disabled');
        console.log('ℹ️  All auth methods will return null or throw disabled errors');
    }

    /**
     * Initialize Firebase Auth (DISABLED)
     */
    async initialize() {
        console.log('🚫 Firebase Auth initialization skipped - authentication disabled');
        return false;
    }

    /**
     * Check if Firebase is initialized (DISABLED)
     */
    isInitialized() {
        return false;
    }

    /**
     * Get current user (DISABLED)
     */
    getCurrentUser() {
        return null;
    }

    /**
     * Check if user is signed in (DISABLED)
     */
    isSignedIn() {
        return false;
    }

    /**
     * Sign in with Google (DISABLED)
     */
    async signInWithGoogle() {
        console.log('🚫 Sign-in bypassed - authentication disabled');
        throw new Error('Authentication is currently disabled');
    }

    /**
     * Sign out (DISABLED)
     */
    async signOut() {
        console.log('🚫 Sign-out bypassed - authentication disabled');
        return true;
    }

    /**
     * Set up auth state listener (DISABLED)
     */
    onAuthStateChanged(callback) {
        console.log('🚫 Auth state listener bypassed - authentication disabled');
        // Immediately call callback with null user to indicate no authentication
        if (typeof callback === 'function') {
            callback(null);
        }
        return () => {}; // Return empty unsubscribe function
    }

    /**
     * Show error message (DISABLED)
     */
    showError(message) {
        console.log('🚫 Auth error display bypassed:', message);
    }

    /**
     * Show loading state (DISABLED)
     */
    showLoading(loading = true) {
        console.log('🚫 Auth loading state bypassed:', loading);
    }

    /**
     * Update UI with user info (DISABLED)
     */
    updateUI(user = null) {
        console.log('🚫 Auth UI update bypassed');
        
        // Hide any auth-related UI elements that might still exist
        const authContainer = document.getElementById('auth-container');
        const userMenu = document.querySelector('.user-menu');
        
        if (authContainer) {
            authContainer.classList.add('hidden');
        }
        
        if (userMenu) {
            userMenu.classList.add('hidden');
        }
    }

    /**
     * Get user display name (DISABLED)
     */
    getUserDisplayName() {
        return 'Guest User';
    }

    /**
     * Get user email (DISABLED)
     */
    getUserEmail() {
        return null;
    }

    /**
     * Get user photo URL (DISABLED)
     */
    getUserPhotoURL() {
        return null;
    }
}

// Create and export auth service instance
const authService = new FirebaseAuthService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = authService;
} else {
    window.authService = authService;
}

console.log('✅ Firebase Auth Service loaded (DISABLED MODE)');