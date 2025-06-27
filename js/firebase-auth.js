// js/firebase-auth.js
/**
 * Firebase Authentication Service
 * Handles user authentication, state management, and UI updates
 */
class FirebaseAuthService {
    constructor() {
        this.user = null;
        this.initialized = false;
        this.onAuthStateChangedCallbacks = [];
        this.auth = null;
        this.debug = true; // Enable debug mode
        
        console.log('🔐 Firebase Auth Service: Initializing...');
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize Firebase Authentication
     */
    async init() {
        console.log('🔐 Firebase Auth Service: Starting initialization...');
        
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded. Please ensure Firebase scripts are included.');
            }

            console.log('✅ Firebase SDK loaded successfully');

            // Get Firebase configuration
            const firebaseConfig = await this.getFirebaseConfig();
            
            if (!firebaseConfig.apiKey) {
                console.warn('⚠️ Firebase configuration incomplete or missing');
                this.showConfigurationError(firebaseConfig);
                return;
            }

            console.log('✅ Firebase configuration loaded:', {
                projectId: firebaseConfig.projectId,
                authDomain: firebaseConfig.authDomain,
                hasApiKey: !!firebaseConfig.apiKey
            });

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log('✅ Firebase app initialized');
            } else {
                console.log('✅ Firebase app already initialized');
            }

            // Initialize Auth
            this.auth = firebase.auth();
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
                this.user = user;
                this.handleAuthStateChange(user);
                this.updateUI();
            });

            this.initialized = true;
            console.log('✅ Firebase Auth Service: Initialization complete');

        } catch (error) {
            console.error('❌ Firebase Auth Service: Initialization failed:', error);
            this.showError(`Failed to initialize authentication: ${error.message}`);
            this.showDebugInfo(error);
        }
    }

    /**
     * Get Firebase configuration from environment or fallback
     */
    async getFirebaseConfig() {
        console.log('🔧 Loading Firebase configuration...');
        
        try {
            // First try to fetch from server API
            console.log('🔧 Attempting to load config from server...');
            const response = await fetch('/api/firebase-config');
            
            if (response.ok) {
                const config = await response.json();
                console.log('✅ Firebase config loaded from server');
                return config;
            } else {
                console.log(`⚠️ Server config failed with status: ${response.status}`);
                const errorText = await response.text();
                console.log('Server response:', errorText);
            }
        } catch (error) {
            console.log('⚠️ Could not fetch Firebase config from server:', error.message);
        }

        // Fallback to window object (for local development)
        if (window.FIREBASE_CONFIG) {
            console.log('✅ Firebase config loaded from window object');
            return window.FIREBASE_CONFIG;
        }

        // Final fallback - empty config (will show configuration warning)
        console.warn('⚠️ No Firebase configuration found');
        return {
            apiKey: "",
            authDomain: "",
            projectId: "",
            storageBucket: "",
            messagingSenderId: "",
            appId: ""
        };
    }

    /**
     * Sign in with Google using popup
     */
    async signInWithGoogle() {
        if (!this.initialized) {
            this.showError('Authentication service not initialized. Please wait and try again.');
            return null;
        }

        if (!this.auth) {
            this.showError('Firebase Auth not available. Please check your configuration.');
            return null;
        }

        try {
            console.log('🔐 Starting Google sign-in...');
            this.showLoading(true);
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            console.log('🔐 Opening Google sign-in popup...');
            const result = await this.auth.signInWithPopup(provider);
            
            console.log('✅ Google sign-in successful:', result.user.email);
            this.showSuccess('Welcome! Signed in successfully.');
            return result.user;
            
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            
            // Handle specific error cases
            if (error.code === 'auth/popup-blocked') {
                this.showError('Pop-up blocked by browser. Please allow pop-ups for this site and try again.');
            } else if (error.code === 'auth/popup-closed-by-user') {
                this.showError('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/unauthorized-domain') {
                this.showError('This domain is not authorized for Firebase authentication. Please check your Firebase configuration.');
                this.showDebugInfo({
                    error: error,
                    suggestion: 'Add your domain to Firebase Console > Authentication > Sign-in method > Authorized domains'
                });
            } else {
                this.showError(this.getErrorMessage(error));
                this.showDebugInfo(error);
            }
            
            return null;
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Sign out the current user
     */
    async signOut() {
        if (!this.auth) {
            console.warn('Cannot sign out: Firebase Auth not initialized');
            return;
        }

        try {
            await this.auth.signOut();
            console.log('✅ User signed out successfully');
            this.showSuccess('Signed out successfully');
        } catch (error) {
            console.error('❌ Sign out error:', error);
            this.showError('Failed to sign out. Please try again.');
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.user !== null;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Add callback for auth state changes
     */
    onAuthStateChange(callback) {
        if (typeof callback === 'function') {
            this.onAuthStateChangedCallbacks.push(callback);
        }
    }

    /**
     * Handle auth state changes
     */
    handleAuthStateChange(user) {
        this.onAuthStateChangedCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('❌ Auth state change callback error:', error);
            }
        });
    }

    /**
     * Update UI based on authentication state
     */
    updateUI() {
        const authContainer = document.getElementById('auth-container');
        const mainApp = document.getElementById('main-app');
        const userInfo = document.getElementById('user-info');
        const userEmail = document.getElementById('user-email');
        const userAvatar = document.getElementById('user-avatar');

        if (this.isAuthenticated()) {
            console.log('🎨 Updating UI for authenticated user');
            
            // Show main app, hide auth
            if (authContainer) authContainer.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';

            // Update user info
            if (userEmail) userEmail.textContent = this.user.email;
            if (userAvatar && this.user.photoURL) {
                userAvatar.src = this.user.photoURL;
                userAvatar.style.display = 'block';
            }
            if (userInfo) userInfo.style.display = 'flex';

        } else {
            console.log('🎨 Updating UI for unauthenticated state');
            
            // Show auth, hide main app
            if (authContainer) authContainer.style.display = 'flex';
            if (mainApp) mainApp.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    /**
     * Show loading state
     */
    showLoading(loading) {
        const loadingEl = document.getElementById('auth-loading');
        const buttons = document.querySelectorAll('.google-btn');
        
        if (loadingEl) {
            loadingEl.style.display = loading ? 'block' : 'none';
        }
        
        buttons.forEach(btn => {
            btn.disabled = loading;
            btn.style.opacity = loading ? '0.6' : '1';
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('🚨 Auth Error:', message);
        
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 10000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log('✅ Auth Success:', message);
        
        const successEl = document.getElementById('auth-success');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * Show configuration error
     */
    showConfigurationError(config) {
        console.error('🚨 Firebase configuration error');
        
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            const authModal = authContainer.querySelector('.auth-modal');
            if (authModal) {
                authModal.innerHTML = `
                    <div class="auth-header">
                        <h1>⚠️ Configuration Required</h1>
                        <p>Firebase authentication is not properly configured</p>
                    </div>
                    <div class="auth-content">
                        <div class="error-message">
                            <strong>Configuration Issue:</strong><br>
                            Firebase authentication requires proper configuration.<br><br>
                            <strong>For deployment:</strong><br>
                            Set the required environment variables in your deployment settings.<br><br>
                            <strong>For local development:</strong><br>
                            Create a <code>firebase-config.js</code> file with your Firebase project settings.
                        </div>
                        <button class="btn btn-secondary" onclick="location.reload()" style="margin-top: 1rem;">
                            <i class="fas fa-refresh"></i> Retry
                        </button>
                        <details style="margin-top: 1rem;">
                            <summary>Debug Information</summary>
                            <pre style="background: #f5f5f5; padding: 1rem; margin-top: 0.5rem; border-radius: 4px; font-size: 0.8rem;">${JSON.stringify(config, null, 2)}</pre>
                        </details>
                    </div>
                `;
            }
        }
    }

    /**
     * Show debug information
     */
    showDebugInfo(errorInfo) {
        if (!this.debug) return;
        
        const debugEl = document.getElementById('auth-debug');
        const debugDetails = document.getElementById('debug-details');
        
        if (debugEl && debugDetails) {
            debugDetails.innerHTML = `
                <div style="font-family: monospace; font-size: 0.8rem; background: #f5f5f5; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">
                    <strong>Error Details:</strong><br>
                    ${JSON.stringify(errorInfo, null, 2)}
                    <br><br>
                    <strong>Troubleshooting:</strong><br>
                    1. Check that Firebase project is properly configured<br>
                    2. Verify domain is added to authorized domains<br>
                    3. Ensure environment variables are set correctly<br>
                    4. Check browser console for additional errors
                </div>
            `;
            debugEl.style.display = 'block';
        }
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        const errorMessages = {
            'auth/popup-closed-by-user': 'Sign-in was cancelled.',
            'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
            'auth/unauthorized-domain': 'This domain is not authorized. Please check Firebase configuration.',
            'auth/operation-not-allowed': 'Google sign-in is not enabled. Please check Firebase configuration.',
            'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
            'auth/auth-domain-config-required': 'Firebase Auth domain configuration is required.',
            'auth/cancelled-popup-request': 'Another sign-in attempt is in progress.',
            'auth/operation-not-supported-in-this-environment': 'This operation is not supported in this environment.',
            'auth/timeout': 'The operation timed out. Please try again.',
            'auth/user-disabled': 'This user account has been disabled.',
            'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.'
        };

        return errorMessages[error.code] || error.message || 'An authentication error occurred.';
    }
}

// Initialize Firebase Auth Service
console.log('🔐 Creating Firebase Auth Service instance...');
const firebaseAuth = new FirebaseAuthService();

// Expose to global scope for use in HTML onclick handlers
window.firebaseAuth = firebaseAuth;