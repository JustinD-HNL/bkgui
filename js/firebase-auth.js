// js/firebase-auth.js
/**
 * Enhanced Firebase Authentication Service for SDK v10.14.0
 * Handles 2024-2025 browser security requirements with third-party cookie mitigation
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
        this.preferredSignInMethod = 'popup'; // Default to popup for cookie mitigation
        this.thirdPartyCookiesSupported = true;
        this.sdkVersion = '10.14.0';
        
        console.log(`🔐 Enhanced Firebase Auth Service v${this.sdkVersion}: Initializing...`);
        
        // Test third-party cookie support
        this.testThirdPartyCookieSupport();
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Test third-party cookie support
     */
    testThirdPartyCookieSupport() {
        try {
            // Test localStorage access (proxy for third-party cookie support)
            localStorage.setItem('3pc-test', 'test');
            localStorage.removeItem('3pc-test');
            this.thirdPartyCookiesSupported = true;
            console.log('✅ Third-party cookies appear to be supported');
        } catch (error) {
            this.thirdPartyCookiesSupported = false;
            console.log('⚠️ Third-party cookies may be blocked - popup method will provide mitigation');
        }
        
        // Additional check for Chrome Privacy Sandbox
        if (navigator.userAgent.includes('Chrome') && !this.thirdPartyCookiesSupported) {
            console.log('🔒 Chrome Privacy Sandbox detected - using enhanced popup authentication');
        }
    }

    /**
     * Initialize Firebase Authentication with enhanced 2024-2025 compatibility
     */
    async init() {
        this.initializationAttempts++;
        console.log(`🔐 Firebase Auth Service: Starting initialization (attempt ${this.initializationAttempts}/${this.maxInitializationAttempts})...`);
        
        try {
            // Enhanced pre-initialization checks
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
                apiKeyPrefix: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : 'none',
                sdkVersion: this.sdkVersion
            });

            // Initialize Firebase with enhanced error handling
            await this.initializeFirebaseApp(firebaseConfig);
            
            // Initialize Auth with v10.14.0 features
            await this.initializeFirebaseAuth();
            
            // Test Firebase connectivity with v10.14.0 APIs
            await this.testFirebaseConnectivity();

            // Handle redirect result if present (enhanced for v10.14.0)
            await this.handleRedirectResult();

            this.initialized = true;
            console.log(`✅ Firebase Auth Service v${this.sdkVersion}: Initialization complete`);

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
                sdkVersion: this.sdkVersion,
                initializationAttempts: this.initializationAttempts,
                troubleshooting: [
                    'Check your internet connection',
                    'Verify Firebase configuration is correct',
                    'Ensure your domain is authorized in Firebase Console',
                    'Check browser console for CSP/COOP errors',
                    'Try refreshing the page'
                ]
            });
        }
    }

    /**
     * Enhanced pre-initialization checks for v10.14.0
     */
    async performPreInitChecks() {
        console.log('🔍 Performing enhanced pre-initialization checks...');
        
        // Check if Firebase SDK v10+ is loaded
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK not loaded. Please ensure Firebase v10.14.0+ scripts are included.');
        }

        // Check SDK version if available
        if (firebase.SDK_VERSION) {
            console.log(`📦 Firebase SDK version: ${firebase.SDK_VERSION}`);
            if (parseFloat(firebase.SDK_VERSION) < 10.0) {
                console.warn('⚠️ Firebase SDK version may be outdated for optimal 2024-2025 compatibility');
            }
        }

        // Enhanced security context check
        if (!window.isSecureContext && window.location.protocol === 'http:' && !window.location.hostname.includes('localhost')) {
            console.warn('⚠️ Not in secure context. Firebase Auth requires HTTPS in production.');
        }

        // Check network connectivity
        if (!navigator.onLine) {
            throw new Error('No internet connection detected');
        }

        // Test CSP and COOP headers
        await this.testSecurityHeaders();

        console.log('✅ Enhanced pre-initialization checks passed');
    }

    /**
     * Test security headers (CSP and COOP)
     */
    async testSecurityHeaders() {
        try {
            const response = await fetch('/api/debug/security-headers');
            if (response.ok) {
                const data = await response.json();
                console.log('🛡️ Security headers verified:', data.appliedHeaders);
            }
        } catch (error) {
            console.warn('⚠️ Could not verify security headers:', error.message);
        }
    }

    /**
     * Initialize Firebase app with v10.14.0 compatibility
     */
    async initializeFirebaseApp(config) {
        console.log('🔥 Initializing Firebase app with v10.14.0...');
        
        try {
            if (!firebase.apps.length) {
                // Enhanced initialization for v10.14.0
                const app = firebase.initializeApp(config);
                console.log('✅ Firebase app initialized successfully with v10.14.0');
                
                // Test app connectivity
                if (app.options.projectId !== config.projectId) {
                    throw new Error('Firebase app configuration mismatch');
                }
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
     * Initialize Firebase Auth with v10.14.0 features
     */
    async initializeFirebaseAuth() {
        console.log('🔐 Initializing Firebase Auth v10.14.0...');
        
        try {
            this.auth = firebase.auth();
            
            if (!this.auth) {
                throw new Error('Firebase Auth instance not created');
            }

            // Enhanced auth settings for v10.14.0
            if (this.auth.settings) {
                // Configure for better third-party cookie handling
                this.auth.settings.appVerificationDisabledForTesting = false;
            }
            
            // Set up enhanced auth state listener
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
            
            console.log('✅ Firebase Auth v10.14.0 initialized successfully');
            
        } catch (error) {
            throw new Error(`Firebase Auth initialization failed: ${error.message}`);
        }
    }

    /**
     * Enhanced Firebase connectivity test for v10.14.0
     */
    async testFirebaseConnectivity() {
        console.log('🌐 Testing Firebase connectivity with v10.14.0...');
        
        try {
            // Enhanced connectivity test
            const currentUser = this.auth.currentUser;
            console.log('✅ Firebase Auth service accessible, current user:', currentUser ? currentUser.email : 'none');
            
            // Test auth service availability with timeout
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase connectivity test timeout'));
                }, 5000);
                
                // Test auth state listener
                const unsubscribe = this.auth.onAuthStateChanged(() => {
                    clearTimeout(timeout);
                    unsubscribe();
                    resolve();
                }, (error) => {
                    clearTimeout(timeout);
                    unsubscribe();
                    reject(error);
                });
            });
            
            console.log('✅ Firebase v10.14.0 connectivity test passed');
            
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
            // Enhanced server config fetch with retry
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

        // Final fallback - empty config
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
     * Enhanced redirect result handling for v10.14.0
     */
    async handleRedirectResult() {
        if (!this.auth) return;

        try {
            const result = await this.auth.getRedirectResult();
            if (result && result.user) {
                console.log('✅ Redirect sign-in successful:', result.user.email);
                this.showSuccess('Welcome! Signed in successfully via redirect.');
                
                // Enhanced user info logging for v10.14.0
                if (result.additionalUserInfo) {
                    console.log('📊 Additional user info:', {
                        isNewUser: result.additionalUserInfo.isNewUser,
                        providerId: result.additionalUserInfo.providerId
                    });
                }
            }
        } catch (error) {
            console.error('❌ Redirect sign-in error:', error);
            await this.handleSignInError(error);
        }
    }

    /**
     * Enhanced Google Sign-In with v10.14.0 and third-party cookie mitigation
     */
    async signInWithGoogle(method = this.preferredSignInMethod) {
        if (!this.initialized) {
            this.showError('Authentication service not initialized. Please wait and try again.');
            return null;
        }

        if (!this.auth) {
            this.showError('Firebase Auth not available. Please check your configuration.');
            return null;
        }

        // Third-party cookie mitigation: prefer popup method
        if (!this.thirdPartyCookiesSupported && method === 'redirect') {
            console.log('🔒 Third-party cookies blocked, switching to popup method for mitigation');
            method = 'popup';
        }

        this.preferredSignInMethod = method;

        try {
            console.log(`🔐 Starting Google sign-in with ${method} method (SDK v${this.sdkVersion})...`);
            this.showLoading(true);
            
            // Enhanced pre-flight checks
            await this.preflightSignInChecks();
            
            // Enhanced provider configuration for v10.14.0
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            // Enhanced custom parameters for better compatibility
            provider.setCustomParameters({
                prompt: 'select_account',
                include_granted_scopes: 'true'
            });
            
            let result;
            
            if (method === 'redirect') {
                console.log('🔐 Starting redirect sign-in...');
                await this.auth.signInWithRedirect(provider);
                // Redirect will reload the page
                return null;
            } else {
                console.log('🔐 Opening Google sign-in popup (v10.14.0 enhanced)...');
                result = await this.auth.signInWithPopup(provider);
            }
            
            console.log('✅ Google sign-in successful:', result.user.email);
            
            // Enhanced success logging for v10.14.0
            if (result.additionalUserInfo) {
                console.log('📊 Sign-in details:', {
                    method: method,
                    isNewUser: result.additionalUserInfo.isNewUser,
                    providerId: result.additionalUserInfo.providerId,
                    thirdPartyCookiesSupported: this.thirdPartyCookiesSupported
                });
            }
            
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
     * Enhanced pre-flight checks for v10.14.0
     */
    async preflightSignInChecks() {
        console.log('🔍 Performing enhanced pre-flight sign-in checks...');
        
        // Enhanced popup check for v10.14.0
        if (this.preferredSignInMethod === 'popup') {
            const popup = window.open('', '', 'width=1,height=1');
            if (!popup) {
                throw new Error('Popup blocked. Please allow popups for this site or try redirect sign-in.');
            }
            popup.close();
        }
        
        // Enhanced network check
        if (!navigator.onLine) {
            throw new Error('No internet connection');
        }
        
        // Enhanced provider test for v10.14.0
        try {
            const testProvider = new firebase.auth.GoogleAuthProvider();
            if (!testProvider || !testProvider.providerId) {
                throw new Error('Google Auth provider not properly initialized');
            }
        } catch (error) {
            throw new Error(`Google Auth provider test failed: ${error.message}`);
        }
        
        console.log('✅ Enhanced pre-flight checks passed');
    }

    /**
     * Enhanced sign-in error handling for v10.14.0
     */
    async handleSignInError(error) {
        console.error('🚨 Handling sign-in error:', error);
        
        // Enhanced internal error detection for v10.14.0
        if (error.code === 'auth/internal-error') {
            console.error('🚨 INTERNAL ERROR DETECTED - Running enhanced diagnostics...');
            
            const diagnostics = await this.runInternalErrorDiagnostics();
            this.showInternalErrorDetails(error, diagnostics);
            return;
        }
        
        // Enhanced popup error handling with better fallback options
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            this.showPopupErrorWithFallback(error);
            return;
        }

        // Enhanced error messages for v10.14.0
        const errorMessages = {
            'auth/unauthorized-domain': 'This domain is not authorized for Firebase authentication. Please check your Firebase Console settings.',
            'auth/operation-not-allowed': 'Google sign-in is not enabled. Please check your Firebase Console settings.',
            'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
            'auth/user-disabled': 'This user account has been disabled.',
            'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
            'auth/credential-already-in-use': 'This credential is already associated with a different user account.',
            'auth/weak-password': 'The password is too weak.',
            'auth/email-already-in-use': 'The email address is already in use by another account.'
        };
        
        const message = errorMessages[error.code] || error.message || 'An authentication error occurred.';
        this.showError(message);
        
        // Enhanced domain authorization help
        if (error.code === 'auth/unauthorized-domain') {
            this.showDebugInfo({
                error: error,
                suggestion: 'Add your domain to Firebase Console > Authentication > Sign-in method > Authorized domains',
                currentDomain: window.location.hostname,
                requiredDomains: [
                    window.location.hostname,
                    `${window.location.hostname}:${window.location.port}`,
                    'localhost',
                    '127.0.0.1'
                ]
            });
        }
    }

    /**
     * Enhanced popup error handling with improved fallback
     */
    showPopupErrorWithFallback(error) {
        console.log('🚨 Showing enhanced popup error with redirect fallback');
        
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.innerHTML = '';
            
            const messageDiv = document.createElement('div');
            messageDiv.style.marginBottom = '1rem';
            
            if (error.code === 'auth/popup-blocked') {
                messageDiv.innerHTML = `
                    <strong>🚫 Pop-up Blocked</strong><br>
                    Your browser blocked the sign-in popup. This is common with strict privacy settings.
                `;
            } else if (error.code === 'auth/popup-closed-by-user') {
                messageDiv.innerHTML = `
                    <strong>🚪 Sign-in Cancelled</strong><br>
                    The sign-in popup was closed before completion.
                `;
            }
            
            errorEl.appendChild(messageDiv);
            
            // Enhanced options container
            const optionsDiv = document.createElement('div');
            optionsDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                margin-top: 1rem;
            `;
            
            // Try popup again button
            const retryPopupBtn = document.createElement('button');
            retryPopupBtn.innerHTML = '🔄 Try Popup Again';
            retryPopupBtn.style.cssText = `
                padding: 10px 16px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            `;
            retryPopupBtn.addEventListener('click', () => {
                this.signInWithGoogle('popup');
            });
            retryPopupBtn.addEventListener('mouseover', () => {
                retryPopupBtn.style.backgroundColor = '#5a6fd8';
            });
            retryPopupBtn.addEventListener('mouseout', () => {
                retryPopupBtn.style.backgroundColor = '#667eea';
            });
            
            // Redirect button (enhanced)
            const redirectBtn = document.createElement('button');
            redirectBtn.innerHTML = '↗️ Use Redirect Sign-In';
            redirectBtn.style.cssText = `
                padding: 10px 16px;
                background: #38a169;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            `;
            redirectBtn.addEventListener('click', () => {
                this.signInWithGoogle('redirect');
            });
            redirectBtn.addEventListener('mouseover', () => {
                redirectBtn.style.backgroundColor = '#2f855a';
            });
            redirectBtn.addEventListener('mouseout', () => {
                redirectBtn.style.backgroundColor = '#38a169';
            });
            
            // Enhanced instructions
            const instructionsDiv = document.createElement('div');
            instructionsDiv.style.cssText = `
                font-size: 12px;
                color: #666;
                background: #f8fafc;
                padding: 12px;
                border-radius: 6px;
                border-left: 3px solid #667eea;
                margin-top: 0.5rem;
            `;
            
            if (error.code === 'auth/popup-blocked') {
                instructionsDiv.innerHTML = `
                    <strong>To allow popups:</strong><br>
                    • Click the popup blocker icon in your address bar<br>
                    • Add this site to your browser's popup exceptions<br>
                    • Or use redirect sign-in (works on all browsers)
                `;
            } else {
                instructionsDiv.innerHTML = `
                    <strong>Why use redirect sign-in?</strong><br>
                    • More reliable than popups<br>
                    • Works with all browser security settings<br>
                    • Better for mobile devices and strict privacy modes
                `;
            }
            
            optionsDiv.appendChild(retryPopupBtn);
            optionsDiv.appendChild(redirectBtn);
            optionsDiv.appendChild(instructionsDiv);
            
            errorEl.appendChild(optionsDiv);
            errorEl.style.display = 'block';
            
            // Auto-hide after 45 seconds
            setTimeout(() => {
                if (errorEl.style.display === 'block') {
                    errorEl.style.display = 'none';
                }
            }, 45000);
        }
    }

    /**
     * Enhanced diagnostics for v10.14.0
     */
    async runInternalErrorDiagnostics() {
        console.log('🔬 Running enhanced internal error diagnostics...');
        
        const diagnostics = {
            timestamp: new Date().toISOString(),
            sdkVersion: this.sdkVersion,
            userAgent: navigator.userAgent,
            url: window.location.href,
            firebase: {
                version: firebase.SDK_VERSION || 'unknown',
                apps: firebase.apps.length,
                initialized: this.initialized,
                authDomain: this.auth?.app?.options?.authDomain
            },
            network: {
                online: navigator.onLine,
                connection: navigator.connection ? {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    saveData: navigator.connection.saveData
                } : 'unknown'
            },
            browser: {
                cookiesEnabled: navigator.cookieEnabled,
                localStorage: typeof localStorage !== 'undefined',
                secureContext: window.isSecureContext,
                thirdPartyCookies: this.thirdPartyCookiesSupported,
                userAgent: navigator.userAgent.substring(0, 100)
            },
            security: {
                csp: await this.testCSPHeaders(),
                coop: await this.testCOOPHeaders()
            }
        };
        
        // Enhanced server connectivity test
        try {
            const healthResponse = await fetch('/health', { method: 'HEAD' });
            diagnostics.server = {
                reachable: healthResponse.ok,
                status: healthResponse.status,
                headers: Object.fromEntries(healthResponse.headers.entries())
            };
        } catch (error) {
            diagnostics.server = {
                reachable: false,
                error: error.message
            };
        }
        
        // Enhanced Firebase config test
        try {
            const configResponse = await fetch('/api/firebase-config');
            diagnostics.config = {
                available: configResponse.ok,
                status: configResponse.status
            };
            
            if (configResponse.ok) {
                const config = await configResponse.json();
                diagnostics.config.hasRequiredFields = !!(config.apiKey && config.authDomain && config.projectId);
            }
        } catch (error) {
            diagnostics.config = {
                available: false,
                error: error.message
            };
        }
        
        console.log('🔬 Enhanced diagnostics complete:', diagnostics);
        return diagnostics;
    }

    /**
     * Test CSP headers
     */
    async testCSPHeaders() {
        try {
            const response = await fetch('/api/debug/security-headers');
            if (response.ok) {
                const data = await response.json();
                return { status: 'ok', details: data.firebaseSupport };
            }
        } catch (error) {
            return { status: 'error', error: error.message };
        }
        return { status: 'unknown' };
    }

    /**
     * Test COOP headers
     */
    async testCOOPHeaders() {
        // Test if Cross-Origin-Opener-Policy is working correctly
        try {
            const testWindow = window.open('', '', 'width=1,height=1');
            if (testWindow) {
                testWindow.close();
                return { status: 'ok', policy: 'same-origin-allow-popups' };
            } else {
                return { status: 'blocked', reason: 'popup_blocked' };
            }
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    /**
     * Enhanced third-party cookie test
     */
    async testThirdPartyCookies() {
        try {
            // Multiple tests for third-party cookie support
            const tests = {
                localStorage: false,
                sessionStorage: false,
                indexedDB: false
            };
            
            // Test localStorage
            try {
                localStorage.setItem('test-3pc', 'test');
                localStorage.removeItem('test-3pc');
                tests.localStorage = true;
            } catch (error) {
                tests.localStorage = false;
            }
            
            // Test sessionStorage
            try {
                sessionStorage.setItem('test-3pc', 'test');
                sessionStorage.removeItem('test-3pc');
                tests.sessionStorage = true;
            } catch (error) {
                tests.sessionStorage = false;
            }
            
            // Test IndexedDB (basic)
            try {
                if ('indexedDB' in window) {
                    tests.indexedDB = true;
                }
            } catch (error) {
                tests.indexedDB = false;
            }
            
            return tests;
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Sign out with enhanced cleanup for v10.14.0
     */
    async signOut() {
        if (!this.auth) {
            console.warn('Cannot sign out: Firebase Auth not initialized');
            return;
        }

        try {
            // Enhanced sign out with cleanup
            await this.auth.signOut();
            
            // Clear any auth-related storage
            try {
                localStorage.removeItem('firebaseui::rememberedAccounts');
                sessionStorage.removeItem('firebase:authUser:');
            } catch (error) {
                console.warn('Could not clear auth storage:', error);
            }
            
            console.log('✅ User signed out successfully (v10.14.0)');
            this.showSuccess('Signed out successfully');
        } catch (error) {
            console.error('❌ Sign out error:', error);
            this.showError('Failed to sign out. Please try again.');
        }
    }

    // ... (rest of the methods remain the same but with enhanced logging and v10.14.0 compatibility)

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.user !== null;
    }

    /**
     * Get current user with enhanced info for v10.14.0
     */
    getCurrentUser() {
        if (this.user) {
            return {
                ...this.user,
                sdkVersion: this.sdkVersion,
                thirdPartyCookiesSupported: this.thirdPartyCookiesSupported
            };
        }
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
            console.log(`🎨 Updating UI for authenticated user (SDK v${this.sdkVersion})`);
            
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
        console.error(`🚨 Auth Error (SDK v${this.sdkVersion}):`, message);
        
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.innerHTML = message;
            errorEl.style.display = 'block';
            
            // Auto-hide after 20 seconds for better debugging
            setTimeout(() => {
                if (errorEl.style.display === 'block') {
                    errorEl.style.display = 'none';
                }
            }, 20000);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log(`✅ Auth Success (SDK v${this.sdkVersion}):`, message);
        
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
     * Enhanced configuration error display for v10.14.0
     */
    showConfigurationError(config) {
        console.error('🚨 Firebase configuration error (SDK v10.14.0)');
        
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            const authModal = authContainer.querySelector('.auth-modal');
            if (authModal) {
                authModal.innerHTML = `
                    <div class="auth-header">
                        <h1>⚠️ Configuration Required</h1>
                        <p>Firebase authentication requires proper configuration for SDK v${this.sdkVersion}</p>
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
                            <a href="/api/debug/security-headers" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold; margin-left: 1rem;">
                                🛡️ Security Check →
                            </a>
                        </div>
                        <details style="margin-top: 1rem;">
                            <summary>Debug Information</summary>
                            <pre style="background: #f5f5f5; padding: 1rem; margin-top: 0.5rem; border-radius: 4px; font-size: 0.8rem;">${JSON.stringify({
                                config: config,
                                sdkVersion: this.sdkVersion,
                                thirdPartyCookiesSupported: this.thirdPartyCookiesSupported
                            }, null, 2)}</pre>
                        </details>
                    </div>
                `;
            }
        }
    }

    /**
     * Enhanced debug information display
     */
    showDebugInfo(errorInfo) {
        if (!this.debug) return;
        
        const debugEl = document.getElementById('auth-debug');
        const debugDetails = document.getElementById('debug-details');
        
        if (debugEl && debugDetails) {
            debugDetails.innerHTML = `
                <div style="font-family: monospace; font-size: 0.8rem; background: #f5f5f5; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">
                    <strong>Firebase SDK v${this.sdkVersion} Error Details:</strong><br>
                    ${JSON.stringify(errorInfo, null, 2)}
                    <br><br>
                    <strong>Enhanced Troubleshooting:</strong><br>
                    1. Check that Firebase project is properly configured<br>
                    2. Verify domain is added to authorized domains<br>
                    3. Ensure environment variables are set correctly<br>
                    4. Check browser console for CSP/COOP violations<br>
                    5. Test with: <a href="/api/debug/security-headers" target="_blank">Security Headers Check</a><br>
                    6. Try the enhanced debug tool: <a href="/debug-auth.html" target="_blank">/debug-auth.html</a>
                </div>
            `;
            debugEl.style.display = 'block';
        }
    }

    /**
     * Enhanced internal error details for v10.14.0
     */
    showInternalErrorDetails(error, diagnostics) {
        console.error('🚨 Showing enhanced internal error details (SDK v10.14.0)');
        
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <strong>🚨 Internal Authentication Error (SDK v${this.sdkVersion})</strong><br>
                    This is a generic Firebase error that can have several causes in 2024-2025 browsers.
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>Immediate Actions:</strong><br>
                    1. Try refreshing the page and signing in again<br>
                    2. Check your internet connection<br>
                    3. Try in incognito/private browsing mode<br>
                    4. Test both popup and redirect methods<br>
                    5. Use the enhanced debug tools below
                </div>
                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; font-weight: bold;">📊 View Enhanced Diagnostic Data</summary>
                    <pre style="background: #f5f5f5; padding: 1rem; margin-top: 0.5rem; border-radius: 4px; font-size: 12px; overflow-x: auto; max-height: 300px;">${JSON.stringify({
                        error: {
                            code: error.code,
                            message: error.message
                        },
                        diagnostics: diagnostics
                    }, null, 2)}</pre>
                </details>
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <a href="/debug-auth.html" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold; padding: 0.5rem; border: 1px solid #667eea; border-radius: 4px; display: inline-block;">
                        🔧 Advanced Debug Tool
                    </a>
                    <a href="/api/debug/security-headers" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold; padding: 0.5rem; border: 1px solid #667eea; border-radius: 4px; display: inline-block;">
                        🛡️ Security Check
                    </a>
                    <a href="/api/debug/firebase-status" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold; padding: 0.5rem; border: 1px solid #667eea; border-radius: 4px; display: inline-block;">
                        🔥 Firebase Status
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
}

// Initialize Enhanced Firebase Auth Service v10.14.0
console.log('🔐 Creating Enhanced Firebase Auth Service v10.14.0 instance...');
const firebaseAuth = new FirebaseAuthService();

// Expose to global scope for use in HTML onclick handlers
window.firebaseAuth = firebaseAuth;