// js/firebase-auth.js
/**
 * Enhanced Firebase Authentication Service for SDK v10.14.0
 * Handles 2024-2025 browser security requirements with third-party cookie mitigation
 * 
 * *** CURRENTLY DISABLED - FOR LATER USE ***
 * Uncomment the initialization code to re-enable authentication
 */

// AUTH BYPASS FLAG - SET TO false TO RE-ENABLE AUTHENTICATION
const AUTH_DISABLED = true;

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
        
        if (AUTH_DISABLED) {
            console.log('🚫 Firebase Auth Service: DISABLED - bypassing authentication');
            this.initialized = true; // Mark as initialized but disabled
            return;
        }
        
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
        if (AUTH_DISABLED) return;
        
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
     * *** CURRENTLY DISABLED ***
     */
    async init() {
        if (AUTH_DISABLED) {
            console.log('🚫 Firebase Auth initialization bypassed');
            return;
        }
        
        // COMMENTED OUT - UNCOMMENT TO RE-ENABLE AUTH
        /*
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
        */
    }

    /**
     * Enhanced pre-initialization checks for v10.14.0
     * *** CURRENTLY DISABLED ***
     */
    async performPreInitChecks() {
        if (AUTH_DISABLED) return;
        
        // COMMENTED OUT - IMPLEMENTATION KEPT FOR LATER
        /*
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
        */
    }

    /**
     * Enhanced Google Sign-In with v10.14.0 and third-party cookie mitigation
     * *** CURRENTLY DISABLED ***
     */
    async signInWithGoogle(method = this.preferredSignInMethod) {
        if (AUTH_DISABLED) {
            console.log('🚫 Sign-in bypassed - authentication disabled');
            this.showError('Authentication is currently disabled');
            return null;
        }
        
        // COMMENTED OUT - FULL IMPLEMENTATION KEPT FOR LATER
        /*
        if (!this.initialized) {
            this.showError('Authent