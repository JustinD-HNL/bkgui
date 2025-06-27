// js/firebase-auth.js
/**
 * Enhanced Firebase Authentication Service with Popup and Redirect Support
 */
class FirebaseAuthService {
    constructor() {
        this.user = null;
        this.initialized = false;
        this.onAuthStateChangedCallbacks = [];
        this.auth = null;
        this.debug = true;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
        this.preferredAuthMethod = 'popup'; // Can be 'popup' or 'redirect'
        
        console.log('🔐 Enhanced Firebase Auth Service: Initializing...');
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize Firebase Authentication with enhanced error handling
     */
    async init() {
        this.initializationAttempts++;
        console.log(`🔐 Firebase Auth Service: Starting initialization (attempt ${this.initializationAttempts}/${this.maxInitializationAttempts})...`);
        
        try {
            // Pre-initialization checks
            await this.performPreInitChecks();
            
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
                hasApiKey: !!firebaseConfig.apiKey,
                apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'none'
            });

            // Initialize Firebase with enhanced error handling
            await this.initializeFirebaseApp(firebaseConfig);
            
            // Initialize Auth with connection test
            await this.initializeFirebaseAuth();
            
            // Check for redirect result on page load
            await this.checkRedirectResult();
            
            // Test Firebase connectivity
            await this.testFirebaseConnectivity();

            this.initialized = true;
            console.log('✅ Firebase Auth Service: Initialization complete');

        } catch (error) {
            console.error('❌ Firebase Auth Service: Initialization failed:', error);
            
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                console.log(`🔄 Retrying initialization in 2 seconds... (${this.initializationAttempts}/${this.maxInitializationAttempts})`);
                setTimeout(() => this.init(), 2000);
                return;
            }
            
            this.showError(`Failed to initialize authentication after ${this.maxInitializationAttempts} attempts: ${error.message}`);
            this.showDebugInfo({
                error: error,
                initializationAttempts: this.initializationAttempts,
                troubleshooting: [
                    'Check your internet connection',
                    'Verify Firebase configuration is correct',
                    'Ensure your domain is authorized in Firebase Console',
                    'Try refreshing the page',
                    'Check browser console for additional errors'
                ]
            });
        }
    }

    /**
     * Perform pre-initialization checks
     */
    async performPreInitChecks() {
        console.log('🔍 Performing pre-initialization checks...');
        
        // Check if Firebase SDK is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded. Please ensure Firebase scripts are included.');
        }

        // Check if we're in a secure context for production
        if (!window.isSecureContext && window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
            console.warn('⚠️ Not in secure context. Firebase Auth requires HTTPS in production.');
        }

        // Check network connectivity
        if (!navigator.onLine) {
            throw new Error('No internet connection detected');
        }

        console.log('✅ Pre-initialization checks passed');
    }

    /**
     * Initialize Firebase app with error handling
     */
    async initializeFirebaseApp(config) {
        console.log('🔥 Initializing Firebase app...');
        
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
                console.log('✅ Firebase app initialized successfully');
            } else {
                console.log('✅ Firebase app already initialized');
            }
        } catch (error) {
            if (error.code === 'app/duplicate-app') {
                console.log('✅ Firebase app already exists');
            } else {
                throw new Error(`Firebase app initialization failed: ${error.message}`);
            }
        }
    }

    /**
     * Initialize Firebase Auth with connection testing
     */
    async initializeFirebaseAuth() {
        console.log('🔐 Initializing Firebase Auth...');
        
        try {
            this.auth = firebase.auth();
            
            if (!this.auth) {
                throw new Error('Firebase Auth instance not created');
            }
            
            // Set up auth state listener with enhanced error handling
            this.auth.onAuthStateChanged(
                (user) => {
                    console.log('🔐 Auth state changed:', user ? `User: ${user.email}` : 'No user');
                    this.user = user;
                    this.handleAuthStateChange(user);
                    this.updateUI();
                },
                (error) => {
                    console.error('❌ Auth state change error:', error);
                    this.handleAuthStateError(error);
                }
            );
            
            console.log('✅ Firebase Auth initialized successfully');
            
        } catch (error) {
            throw new Error(`Firebase Auth initialization failed: ${error.message}`);
        }
    }

    /**
     * Check for redirect authentication result
     */
    async checkRedirectResult() {
        console.log('🔍 Checking for redirect authentication result...');
        
        try {
            if (!this.auth) return;
            
            const result = await this.auth.getRedirectResult();
            
            if (result.user) {
                console.log('✅ Redirect authentication successful:', result.user.email);
                this.showSuccess(`Welcome back! Signed in via redirect as ${result.user.email}`);
                return result.user;
            } else {
                console.log('ℹ️ No redirect result (normal page load)');
            }
            
        } catch (error) {
            console.error('❌ Redirect result error:', error);
            if (error.code === 'auth/internal-error') {
                this.handleSignInError(error);
            }
        }
        
        return null;
    }

    /**
     * Test Firebase connectivity
     */
    async testFirebaseConnectivity() {
        console.log('🌐 Testing Firebase connectivity...');
        
        try {
            const currentUser = this.auth.currentUser;
            console.log('✅ Firebase Auth service accessible, current user:', currentUser ? currentUser.email : 'none');
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase connectivity test timeout'));
                }, 5000);
                
                this.auth.onAuthStateChanged(() => {
                    clearTimeout(timeout);
                    resolve();
                }, reject);
            });
            
            console.log('✅ Firebase connectivity test passed');
            
        } catch (error) {
            throw new Error(`Firebase connectivity test failed: ${error.message}`);
        }
    }

    /**
     * Enhanced Firebase configuration loading
     */
    async getFirebaseConfig() {
        console.log('🔧 Loading Firebase configuration...');
        
        try {
            console.log('🔧 Attempting to load config from server...');
            const response = await fetch('/api/firebase-config', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
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

        if (window.FIREBASE_CONFIG) {
            console.log('✅ Firebase config loaded from window object');
            return window.FIREBASE_CONFIG;
        }

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
     * Enhanced Google Sign-In with popup and redirect options
     */
    async signInWithGoogle(method = null) {
        if (!this.initialized) {
            this.showError('Authentication service not initialized. Please wait and try again.');
            return null;
        }

        if (!this.auth) {
            this.showError('Firebase Auth not available. Please check your configuration.');
            return null;
        }

        const authMethod = method || this.preferredAuthMethod;
        console.log(`🔐 Starting Google sign-in using ${authMethod} method...`);

        try {
            this.showLoading(true);
            
            // Pre-flight checks
            await this.preflightSignInChecks();
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            let result;
            
            if (authMethod === 'redirect') {
                console.log('🔄 Starting redirect-based authentication...');
                await this.auth.signInWithRedirect(provider);
                // Redirect happens here, function doesn't return
                return null;
            } else {
                console.log('🔐 Opening Google sign-in popup...');
                result = await this.auth.signInWithPopup(provider);
            }
            
            console.log('✅ Google sign-in successful:', result.user.email);
            this.showSuccess('Welcome! Signed in successfully.');
            return result.user;
            
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            await this.handleSignInError(error, authMethod);
            return null;
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Try popup first, fallback to redirect on failure
     */
    async signInWithGoogleFallback() {
        console.log('🔄 Trying popup authentication with redirect fallback...');
        
        try {
            // First try popup
            const result = await this.signInWithGoogle('popup');
            return result;
        } catch (popupError) {
            console.log('⚠️ Popup authentication failed, trying redirect...');
            
            if (popupError.code === 'auth/popup-blocked' || 
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.code === 'auth/internal-error') {
                
                this.showError('Popup blocked or failed. Redirecting to Google Sign-In...');
                
                setTimeout(() => {
                    this.signInWithGoogle('redirect');
                }, 2000);
                
                return null;
            }
            
            throw popupError;
        }
    }

    /**
     * Pre-flight checks before sign-in
     */
    async preflightSignInChecks() {
        console.log('🔍 Performing pre-flight sign-in checks...');
        
        // Check network connectivity
        if (!navigator.onLine) {
            throw new Error('No internet connection');
        }
        
        // Test Firebase Auth availability
        try {
            const test = new firebase.auth.GoogleAuthProvider();
            if (!test) {
                throw new Error('Google Auth provider not available');
            }
        } catch (error) {
            throw new Error(`Google Auth provider test failed: ${error.message}`);
        }
        
        console.log('✅ Pre-flight checks passed');
    }

    /**
     * Enhanced sign-in error handling
     */
    async handleSignInError(error, authMethod = 'popup') {
        console.error('🚨 Handling sign-in error:', error);
        
        if (error.code === 'auth/internal-error') {
            console.error('🚨 INTERNAL ERROR DETECTED - Running diagnostics...');
            const diagnostics = await this.runInternalErrorDiagnostics();
            this.showInternalErrorDetails(error, diagnostics);
            return;
        }
        
        // Handle specific error cases with method-specific advice
        const errorMessages = {
            'auth/popup-blocked': 'Pop-up blocked by browser. Please allow pop-ups for this site or try the redirect option.',
            'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again or use the redirect option.',
            'auth/unauthorized-domain': 'This domain is not authorized for Firebase authentication. Please check your Firebase configuration.',
            'auth/operation-not-allowed': 'Google sign-in is not enabled. Please check your Firebase Console settings.',
            'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
            'auth/user-disabled': 'This user account has been disabled.',
            'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.'
        };
        
        const message = errorMessages[error.code] || error.message || 'An authentication error occurred.';
        
        // Show fallback option for popup issues
        if ((error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') && authMethod === 'popup') {
            this.showError(message + ' <br><button onclick="firebaseAuth.signInWithGoogle(\'redirect\')" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Try Redirect Sign-In Instead</button>');
        } else {
            this.showError(message);
        }
        
        if (error.code === 'auth/unauthorized-domain') {
            this.showDebugInfo({
                error: error,
                suggestion: 'Add your domain to Firebase Console > Authentication > Sign-in method > Authorized domains',
                currentDomain: window.location.hostname
            });
        }
    }

    /**
     * Run diagnostics for internal-error
     */
    async runInternalErrorDiagnostics() {
        console.log('🔬 Running internal error diagnostics...');
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            firebase: {
                version: firebase.SDK_VERSION || 'unknown',
                apps: firebase.apps.length,
                initialized: this.initialized
            },
            network: {
                online: navigator.onLine,
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink
                } : 'unknown'
            },
            browser: {
                cookiesEnabled: navigator.cookieEnabled,
                localStorage: typeof localStorage !== 'undefined',
                secureContext: window.isSecureContext,
                thirdPartyCookies: await this.testThirdPartyCookies()
            }
        };
        
        try {
            const healthResponse = await fetch('/health', { method: 'HEAD' });
            diagnostics.server = {
                reachable: healthResponse.ok,
                status: healthResponse.status
            };
        } catch (error) {
            diagnostics.server = {
                reachable: false,
                error: error.message
            };
        }
        
        try {
            const configResponse = await fetch('/api/firebase-config');
            diagnostics.config = {
                available: configResponse.ok,
                status: configResponse.status
            };
        } catch (error) {
            diagnostics.config = {
                available: false,
                error: error.message
            };
        }
        
        console.log('🔬 Diagnostics complete:', diagnostics);
        return diagnostics;
    }

    /**
     * Test third-party cookies availability
     */
    async testThirdPartyCookies() {
        try {
            localStorage.setItem('test-cookie', 'test');
            localStorage.removeItem('test-cookie');
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Show detailed internal error information
     */
    showInternalErrorDetails(error, diagnostics) {
        console.error('🚨 Showing internal error details');
        
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <strong>🚨 Internal Authentication Error</strong><br>
                    This is a generic Firebase error that can have several causes.
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Try Different Methods:</strong><br>
                    <button onclick="firebaseAuth.signInWithGoogle('redirect')" style="margin: 5px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Try Redirect Sign-In
                    </button>
                    <button onclick="firebaseAuth.signInWithGoogleFallback()" style="margin: 5px; padding: 8px 16px; background: #38a169; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Auto Fallback Method
                    </button>
                </div>
                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; font-weight: bold;">📊 View Diagnostic Data</summary>
                    <pre style="background: #f5f5f5; padding: 1rem; margin-top: 0.5rem; border-radius: 4px; font-size: 12px; overflow-x: auto;">${JSON.stringify({
                        error: {
                            code: error.code,
                            message: error.message
                        },
                        diagnostics: diagnostics
                    }, null, 2)}</pre>
                </details>
            `;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Handle auth state errors
     */
    handleAuthStateError(error) {
        console.error('🚨 Auth state error:', error);
        
        if (error.code === 'auth/internal-error') {
            this.handleSignInError(error);
        } else {
            this.showError(`Authentication state error: ${error.message}`);
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
            
            if (authContainer) authContainer.style.display = 'none';
            if (mainApp) mainApp.style.display = 'block';

            if (userEmail) userEmail.textContent = this.user.email;
            if (userAvatar && this.user.photoURL) {
                userAvatar.src = this.user.photoURL;
                userAvatar.style.display = 'block';
            }
            if (userInfo) userInfo.style.display = 'flex';

        } else {
            console.log('🎨 Updating UI for unauthenticated state');
            
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
            errorEl.innerHTML = message;
            errorEl.style.display = 'block';
            
            setTimeout(() => {
                if (errorEl.style.display === 'block') {
                    errorEl.style.display = 'none';
                }
            }, 20000); // Longer timeout for better UX
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
                    <strong>Authentication Options:</strong><br>
                    • <button onclick="firebaseAuth.signInWithGoogle('popup')" style="background: #667eea; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer;">Try Popup</button><br>
                    • <button onclick="firebaseAuth.signInWithGoogle('redirect')" style="background: #38a169; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-top: 4px;">Try Redirect</button><br>
                    • <button onclick="firebaseAuth.signInWithGoogleFallback()" style="background: #f6ad55; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; margin-top: 4px;">Auto Fallback</button>
                </div>
            `;
            debugEl.style.display = 'block';
        }
    }
}

// Initialize Firebase Auth Service
console.log('🔐 Creating Enhanced Firebase Auth Service instance...');
const firebaseAuth = new FirebaseAuthService();

// Expose to global scope for use in HTML onclick handlers
window.firebaseAuth = firebaseAuth;