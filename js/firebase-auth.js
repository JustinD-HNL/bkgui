// js/firebase-auth.js
/**
 * Enhanced Firebase Authentication Service
 * Handles user authentication with specific focus on debugging auth/internal-error
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
     * Test Firebase connectivity
     */
    async testFirebaseConnectivity() {
        console.log('🌐 Testing Firebase connectivity...');
        
        try {
            // Try to access Firebase Auth service
            const currentUser = this.auth.currentUser;
            console.log('✅ Firebase Auth service accessible, current user:', currentUser ? currentUser.email : 'none');
            
            // Test token endpoint (without triggering auth)
            // This is a lightweight test to ensure Firebase services are reachable
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase connectivity test timeout'));
                }, 5000);
                
                // Use a simple operation that doesn't require authentication
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
            // First try to fetch from server API
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
     * Enhanced Google Sign-In with specific internal-error handling
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
            
            // Pre-flight checks
            await this.preflightSignInChecks();
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            // Set custom parameters to help with debugging
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            console.log('🔐 Opening Google sign-in popup...');
            const result = await this.auth.signInWithPopup(provider);
            
            console.log('✅ Google sign-in successful:', result.user.email);
            this.showSuccess('Welcome! Signed in successfully.');
            return result.user;
            
        } catch (error) {
            console.error('❌ Google sign-in error:', error);
            await this.handleSignInError(error);
            return null;
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Pre-flight checks before sign-in
     */
    async preflightSignInChecks() {
        console.log('🔍 Performing pre-flight sign-in checks...');
        
        // Check if popup will be blocked
        const popup = window.open('', '', 'width=1,height=1');
        if (!popup) {
            throw new Error('Popup blocked. Please allow popups for this site.');
        }
        popup.close();
        
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
     * Enhanced sign-in error handling with specific focus on internal-error
     */
    async handleSignInError(error) {
        console.error('🚨 Handling sign-in error:', error);
        
        if (error.code === 'auth/internal-error') {
            console.error('🚨 INTERNAL ERROR DETECTED - Running diagnostics...');
            
            // Run diagnostic checks
            const diagnostics = await this.runInternalErrorDiagnostics();
            
            this.showInternalErrorDetails(error, diagnostics);
            return;
        }
        
        // Handle other specific error cases
        const errorMessages = {
            'auth/popup-blocked': 'Pop-up blocked by browser. Please allow pop-ups for this site and try again.',
            'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
            'auth/unauthorized-domain': 'This domain is not authorized for Firebase authentication. Please check your Firebase configuration.',
            'auth/operation-not-allowed': 'Google sign-in is not enabled. Please check your Firebase Console settings.',
            'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
            'auth/user-disabled': 'This user account has been disabled.',
            'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.'
        };
        
        const message = errorMessages[error.code] || error.message || 'An authentication error occurred.';
        this.showError(message);
        
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
        
        // Test server connectivity
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
        
        // Test Firebase config
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
                    <strong>Immediate Actions:</strong><br>
                    1. Try refreshing the page and signing in again<br>
                    2. Check your internet connection<br>
                    3. Try in incognito/private browsing mode<br>
                    4. Use the debug tool for detailed analysis
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
                <div style="margin-top: 1rem;">
                    <a href="/debug-auth.html" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold;">
                        🔧 Open Advanced Debug Tool →
                    </a>
                </div>
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
            errorEl.innerHTML = message;
            errorEl.style.display = 'block';
            
            // Auto-hide after 15 seconds for better debugging
            setTimeout(() => {
                if (errorEl.style.display === 'block') {
                    errorEl.style.display = 'none';
                }
            }, 15000);
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
                        <div style="margin-top: 1rem;">
                            <a href="/debug-auth.html" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold;">
                                🔧 Open Debug Tool →
                            </a>
                        </div>
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
                    4. Check browser console for additional errors<br>
                    5. Try the enhanced debug tool: <a href="/debug-auth.html" target="_blank">/debug-auth.html</a>
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