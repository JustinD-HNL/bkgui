// server.js
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

// Critical: Get Firebase project ID for domain-specific CSP
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'buildkite-pipeline-builder';

// Enhanced security middleware with FIXED CSP for Firebase Auth 2024-2025
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://www.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://apis.google.com",
                "https://www.google.com",
                "https://accounts.google.com"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdnjs.cloudflare.com",
                "https://accounts.google.com",
                "https://fonts.googleapis.com"
            ],
            imgSrc: [
                "'self'", 
                "data:", 
                "https:",
                "blob:",
                "https://lh3.googleusercontent.com",
                "https://www.google.com",
                "https://ssl.gstatic.com",
                "https://www.gstatic.com"
            ],
            connectSrc: [
                "'self'", 
                // Firebase services - UPDATED for 2024-2025
                "https://identitytoolkit.googleapis.com", 
                "https://securetoken.googleapis.com",
                "https://firebase.googleapis.com",
                "https://www.googleapis.com",
                "https://firebaseinstallations.googleapis.com",
                `https://${FIREBASE_PROJECT_ID}.firebaseio.com`,
                `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
                "https://accounts.google.com",
                "https://oauth2.googleapis.com"
            ],
            frameSrc: [
                "'self'", 
                "https://accounts.google.com",
                "https://www.google.com",
                // CRITICAL FIX: Add Firebase project domains
                "https://*.firebaseapp.com",
                `https://${FIREBASE_PROJECT_ID}.firebaseapp.com`,
                `https://${FIREBASE_PROJECT_ID}.web.app`
            ],
            fontSrc: [
                "'self'", 
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            childSrc: [
                "'self'", 
                "https://accounts.google.com",
                "https://*.firebaseapp.com"
            ],
            formAction: [
                "'self'",
                "https://accounts.google.com"
            ],
            workerSrc: ["'self'", "blob:"],
            manifestSrc: ["'self'"]
        },
    },
    crossOriginEmbedderPolicy: false, // Disable COEP for Firebase compatibility
}));

// CRITICAL: Add COOP header for Firebase popup authentication
app.use((req, res, next) => {
    // Fix for Cross-Origin-Opener-Policy errors
    res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.header('Cross-Origin-Embedder-Policy', 'credentialless');
    
    // Enhanced CORS headers for Firebase
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Compression middleware
app.use(compression());

// Add request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - User-Agent: ${req.get('User-Agent')?.substring(0, 100)}`);
    next();
});

// Firebase configuration endpoint with enhanced debugging
app.get('/api/firebase-config', (req, res) => {
    console.log('🔧 Firebase config requested from:', req.ip);
    
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || ''
    };

    // Enhanced environment variable checking
    const envVarStatus = {
        FIREBASE_API_KEY: {
            set: !!process.env.FIREBASE_API_KEY,
            length: process.env.FIREBASE_API_KEY ? process.env.FIREBASE_API_KEY.length : 0,
            prefix: process.env.FIREBASE_API_KEY ? process.env.FIREBASE_API_KEY.substring(0, 6) + '...' : 'NOT_SET'
        },
        FIREBASE_AUTH_DOMAIN: {
            set: !!process.env.FIREBASE_AUTH_DOMAIN,
            value: process.env.FIREBASE_AUTH_DOMAIN || 'NOT_SET'
        },
        FIREBASE_PROJECT_ID: {
            set: !!process.env.FIREBASE_PROJECT_ID,
            value: process.env.FIREBASE_PROJECT_ID || 'NOT_SET'
        },
        FIREBASE_STORAGE_BUCKET: {
            set: !!process.env.FIREBASE_STORAGE_BUCKET,
            value: process.env.FIREBASE_STORAGE_BUCKET || 'NOT_SET'
        },
        FIREBASE_MESSAGING_SENDER_ID: {
            set: !!process.env.FIREBASE_MESSAGING_SENDER_ID,
            value: process.env.FIREBASE_MESSAGING_SENDER_ID || 'NOT_SET'
        },
        FIREBASE_APP_ID: {
            set: !!process.env.FIREBASE_APP_ID,
            length: process.env.FIREBASE_APP_ID ? process.env.FIREBASE_APP_ID.length : 0,
            prefix: process.env.FIREBASE_APP_ID ? process.env.FIREBASE_APP_ID.substring(0, 10) + '...' : 'NOT_SET'
        }
    };

    console.log('Environment variables status:', envVarStatus);

    // Only send config if API key is present and valid
    if (firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('AIza')) {
        console.log('✅ Firebase config available, sending to client');
        res.json(firebaseConfig);
    } else {
        console.log('❌ Firebase API key not found or invalid in environment variables');
        res.status(404).json({ 
            error: 'Firebase configuration not available',
            message: firebaseConfig.apiKey ? 
                'Firebase API key format appears invalid (should start with AIza)' : 
                'Firebase API key not found in environment variables',
            envVarStatus: envVarStatus,
            help: {
                deployment: 'Set FIREBASE_API_KEY and other Firebase environment variables in your Cloud Run deployment settings',
                local: 'Create a firebase-config.js file or set environment variables locally',
                validation: 'API key should start with "AIza" and be about 39 characters long'
            }
        });
    }
});

// Enhanced debug endpoint for Firebase configuration status
app.get('/api/debug/firebase-status', (req, res) => {
    const envVars = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN', 
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];

    const status = {};
    envVars.forEach(varName => {
        const value = process.env[varName];
        status[varName] = {
            set: !!value,
            length: value ? value.length : 0,
            preview: value ? 
                (varName.includes('API_KEY') || varName.includes('APP_ID') ? 
                    `${value.substring(0, 10)}...` : value) : 'NOT_SET',
            valid: varName === 'FIREBASE_API_KEY' ? 
                (value && value.startsWith('AIza')) : !!value
        };
    });

    const cloudRunMetadata = {
        service: process.env.K_SERVICE || 'unknown',
        revision: process.env.K_REVISION || 'unknown',
        configuration: process.env.K_CONFIGURATION || 'unknown'
    };

    res.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        cloudRun: cloudRunMetadata,
        firebaseConfigStatus: status,
        cspConfiguration: {
            frameSrc: [
                "'self'",
                "https://accounts.google.com",
                "https://www.google.com", 
                "https://*.firebaseapp.com",
                `https://${FIREBASE_PROJECT_ID}.firebaseapp.com`,
                `https://${FIREBASE_PROJECT_ID}.web.app`
            ],
            coopHeader: 'same-origin-allow-popups'
        },
        totalEnvVars: Object.keys(process.env).length,
        allConfigured: envVars.every(varName => {
            const value = process.env[varName];
            if (varName === 'FIREBASE_API_KEY') {
                return value && value.startsWith('AIza');
            }
            return !!value;
        }),
        requestInfo: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            headers: req.headers
        }
    });
});

// New endpoint to test CSP and COOP headers
app.get('/api/debug/security-headers', (req, res) => {
    res.json({
        message: 'Security headers test endpoint',
        timestamp: new Date().toISOString(),
        appliedHeaders: {
            'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
            'Cross-Origin-Embedder-Policy': 'credentialless',
            'Content-Security-Policy': 'Enhanced for Firebase Auth 2024-2025'
        },
        firebaseSupport: {
            popupAuth: 'enabled with COOP header',
            redirectAuth: 'enabled',
            frameSrc: 'includes *.firebaseapp.com wildcard',
            connectSrc: 'includes all Firebase services'
        },
        troubleshooting: [
            'Check browser console for CSP violations',
            'Verify Firebase project ID matches environment variable',
            'Ensure domains are added to Firebase authorized domains',
            'Test popup authentication with dev tools Network tab'
        ]
    });
});

// Cloud Run specific endpoints
app.get('/api/debug/cloud-run-info', (req, res) => {
    res.json({
        service: process.env.K_SERVICE || 'Not on Cloud Run',
        revision: process.env.K_REVISION || 'Not on Cloud Run',
        configuration: process.env.K_CONFIGURATION || 'Not on Cloud Run',
        region: process.env.FUNCTION_REGION || 'Unknown',
        memory: process.env.FUNCTION_MEMORY_MB || 'Unknown',
        timeout: process.env.FUNCTION_TIMEOUT_SEC || 'Unknown',
        allCloudRunVars: Object.keys(process.env).filter(key => 
            key.startsWith('K_') || key.startsWith('FUNCTION_') || key.startsWith('GOOGLE_')
        ).reduce((acc, key) => {
            acc[key] = process.env[key];
            return acc;
        }, {})
    });
});

// Static file serving with enhanced headers
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    setHeaders: (res, filePath) => {
        // Set proper MIME types
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        
        // Add cache control for debug files
        if (filePath.includes('debug-auth')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
        
        // Add security headers for auth-related files
        if (filePath.includes('firebase-auth') || filePath.includes('index.html')) {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    }
}));

// Enhanced health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.1',
        environment: process.env.NODE_ENV || 'development',
        cloudRun: {
            service: process.env.K_SERVICE || 'Not on Cloud Run',
            revision: process.env.K_REVISION || 'Not on Cloud Run'
        },
        firebase: {
            configured: !!process.env.FIREBASE_API_KEY,
            apiKeyValid: process.env.FIREBASE_API_KEY && process.env.FIREBASE_API_KEY.startsWith('AIza'),
            allEnvVarsSet: !![
                'FIREBASE_API_KEY',
                'FIREBASE_AUTH_DOMAIN', 
                'FIREBASE_PROJECT_ID'
            ].every(key => !!process.env[key])
        },
        authMethods: {
            popup: 'supported with COOP header',
            redirect: 'supported',
            recommended: 'popup preferred for 2024-2025'
        },
        security: {
            csp: 'Firebase-optimized with *.firebaseapp.com',
            coop: 'same-origin-allow-popups',
            coep: 'credentialless'
        },
        memory: process.memoryUsage(),
        uptime: process.uptime()
    };

    res.status(200).json(health);
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API test endpoint working',
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7)
    });
});

// CSP test endpoint to verify current policy
app.get('/api/debug/csp-test', (req, res) => {
    res.json({
        message: 'CSP test endpoint - Enhanced for Firebase Auth 2024-2025',
        timestamp: new Date().toISOString(),
        cspDirectives: [
            'script-src: self, unsafe-inline, unsafe-eval, Firebase domains, Google domains',
            'connect-src: Firebase and Google OAuth endpoints, project-specific Firebase domains',
            'frame-src: Google OAuth domains AND *.firebaseapp.com wildcard',
            'img-src: Google user avatars and Firebase assets',
            'style-src: Google Fonts and inline styles'
        ],
        criticalFixes: {
            frameSrc: `Added https://*.firebaseapp.com and https://${FIREBASE_PROJECT_ID}.firebaseapp.com`,
            coop: 'Added Cross-Origin-Opener-Policy: same-origin-allow-popups',
            coep: 'Set Cross-Origin-Embedder-Policy: credentialless'
        },
        authSupport: {
            popupAuth: 'enabled with COOP header',
            redirectAuth: 'enabled',
            thirdPartyCookies: 'popup-first mitigation implemented'
        },
        note: 'CSP and COOP optimized for Firebase Auth v10+ with 2024-2025 browser requirements'
    });
});

// Serve debug page with proper headers
app.get('/debug-auth.html', (req, res) => {
    res.set({
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Debug-Mode': 'enabled'
    });
    res.sendFile(path.join(__dirname, 'debug-auth.html'));
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    const errorResponse = {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7)
    };
    
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }
    
    res.status(500).json(errorResponse);
});

// Handle 404s
app.use((req, res) => {
    console.log(`404 - Not found: ${req.method} ${req.path}`);
    
    // For API routes, return JSON
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'Not found',
            path: req.path,
            timestamp: new Date().toISOString()
        });
    }
    
    // For all other routes, serve index.html (SPA support)
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Buildkite Pipeline Builder running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Debug tool: http://localhost:${PORT}/debug-auth.html`);
    console.log(`🔧 CSP test: http://localhost:${PORT}/api/debug/csp-test`);
    console.log(`🔒 Security headers: http://localhost:${PORT}/api/debug/security-headers`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Firebase configured: ${!!process.env.FIREBASE_API_KEY}`);
    console.log(`☁️  Cloud Run service: ${process.env.K_SERVICE || 'Not on Cloud Run'}`);
    console.log(`🛡️  Security: CSP with *.firebaseapp.com + COOP same-origin-allow-popups`);
    
    if (!process.env.FIREBASE_API_KEY) {
        console.log('⚠️  Firebase authentication not configured');
        console.log('   Set FIREBASE_API_KEY and other Firebase environment variables');
    } else if (!process.env.FIREBASE_API_KEY.startsWith('AIza')) {
        console.log('⚠️  Firebase API key format appears invalid (should start with AIza)');
    } else {
        console.log('✅ Firebase authentication properly configured');
        console.log(`✅ CSP configured for Firebase project: ${FIREBASE_PROJECT_ID}`);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📤 SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('📤 SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('💤 Process terminated');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});