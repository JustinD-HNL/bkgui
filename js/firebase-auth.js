/**
 * Firebase Authentication Service
 * Handles user authentication, state management, and UI updates
 */
class FirebaseAuthService {
    constructor() {
        this.user = null;
        this.initialized = false;
        this.onAuthStateChangedCallbacks = [];
        this.auth = firebase.auth();
        
        // Initialize Firebase when DOM is ready
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
        try {
            // Check if Firebase is loaded
            if (typeof firebase === 'undefined') {
                console.error('Firebase SDK not loaded');
                return;
            }

            // Firebase configuration will be set via environment variables or config
            const firebaseConfig = await this.getFirebaseConfig();
            
            if (!firebaseConfig.apiKey) {
                console.warn('Firebase configuration not found. Authentication disabled.');
                this.showConfigurationWarning();
                return;
            }

            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.user = user;
                this.onAuthStateChanged(user);
                this.updateUI();
            });

            this.initialized = true;
            console.log('Firebase Auth initialized successfully');

        } catch (error) {
            console.error('Failed to initialize Firebase Auth:', error);
            this.showError('Failed to initialize authentication');
        }
    }

    /**
     * Get Firebase configuration from environment or fallback
     */
    async getFirebaseConfig() {
        try {
            // First try to fetch from server API
            const response = await fetch('/api/firebase-config');
            if (response.ok) {
                const config = await response.json();
                console.log('Firebase config loaded from server');
                return config;
            }
        } catch (error) {
            console.log('Could not fetch Firebase config from server:', error.message);
        }

        // Fallback to window object (for local development)
        if (window.FIREBASE_CONFIG) {
            console.log('Firebase config loaded from window object');
            return window.FIREBASE_CONFIG;
        }

        // Final fallback - empty config (will show configuration warning)
        console.warn('No Firebase configuration found');
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
        try {
            this.showLoading(true);
            const provider = new firebase.auth.GoogleAuthProvider();
            // Add additional scopes if needed
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await this.auth.signInWithPopup(provider);
            console.log('Google sign-in successful:', result.user.email);
            this.showSuccess('Welcome! Signed in successfully.');
            return result.user;
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showError(this.getErrorMessage(error));
            return null;
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Sign out the current user
     */
    async signOut() {
        try {
            await this.auth.signOut();
            console.log('User signed out');
            this.showSuccess('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
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
    onAuthStateChanged(callback) {
        this.onAuthStateChangedCallbacks.push(callback);
    }

    /**
     * Handle auth state changes
     */
    onAuthStateChanged(user) {
        this.onAuthStateChangedCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Auth state change callback error:', error);
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
        const buttons = document.querySelectorAll('.auth-btn');
        const spinner = document.getElementById('auth-spinner');
        
        buttons.forEach(btn => {
            btn.disabled = loading;
        });
        
        if (spinner) {
            spinner.style.display = loading ? 'block' : 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
        console.error('Auth Error:', message);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        const successEl = document.getElementById('auth-success');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
            setTimeout(() => {
                successEl.style.display = 'none';
            }, 3000);
        }
        console.log('Auth Success:', message);
    }

    /**
     * Show configuration warning
     */
    showConfigurationWarning() {
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.innerHTML = `
                <div class="auth-card">
                    <h2>⚠️ Authentication Configuration Required</h2>
                    <p>Firebase authentication is not configured.</p>
                    <p>Please update your Firebase configuration in the deployment settings.</p>
                    <button class="auth-btn" onclick="location.reload()">Retry</button>
                </div>
            `;
            authContainer.style.display = 'flex';
        }
    }

    /**
     * Get user-friendly error message
     */
    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                return 'Sign-in was cancelled.';
            case 'auth/popup-blocked':
                return 'Pop-up blocked. Please allow pop-ups for this site.';
            default:
                return error.message || 'An authentication error occurred.';
        }
    }
}

// Initialize Firebase Auth Service
const firebaseAuth = new FirebaseAuthService();

// Expose to global scope for use in HTML onclick handlers
window.firebaseAuth = firebaseAuth;
