// server.js
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com"],
            frameSrc: ["'self'", "https://accounts.google.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            childSrc: ["'self'", "https://accounts.google.com"]
        },
    },
}));

// Compression middleware
app.use(compression());

// Add request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Firebase configuration endpoint
app.get('/api/firebase-config', (req, res) => {
    console.log('🔧 Firebase config requested');
    
    const firebaseConfig = {
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.FIREBASE_APP_ID || ''
    };

    // Check which environment variables are set
    const envVarStatus = {
        FIREBASE_API_KEY: !!process.env.FIREBASE_API_KEY,
        FIREBASE_AUTH_DOMAIN: !!process.env.FIREBASE_AUTH_DOMAIN,
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_STORAGE_BUCKET: !!process.env.FIREBASE_STORAGE_BUCKET,
        FIREBASE_MESSAGING_SENDER_ID: !!process.env.FIREBASE_MESSAGING_SENDER_ID,
        FIREBASE_APP_ID: !!process.env.FIREBASE_APP_ID
    };

    console.log('Environment variables status:', envVarStatus);

    // Only send config if API key is present
    if (firebaseConfig.apiKey) {
        console.log('✅ Firebase config available, sending to client');
        res.json(firebaseConfig);
    } else {
        console.log('❌ Firebase API key not found in environment variables');
        res.status(404).json({ 
            error: 'Firebase configuration not available',
            message: 'Firebase API key not found in environment variables',
            envVarStatus: envVarStatus,
            help: {
                deployment: 'Set FIREBASE_API_KEY and other Firebase environment variables in your deployment settings',
                local: 'Create a firebase-config.js file or set environment variables locally'
            }
        });
    }
});

// Debug endpoint for Firebase configuration status
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
            preview: value ? `${value.substring(0, 10)}...` : 'NOT_SET'
        };
    });

    res.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        firebaseConfigStatus: status,
        totalEnvVars: Object.keys(process.env).length,
        allConfigured: envVars.every(varName => !!process.env[varName])
    });
});

// Static file serving
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0', // Cache in production only
    etag: true,
    setHeaders: (res, filePath) => {
        // Set proper MIME types for JavaScript files
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        firebase: {
            configured: !!process.env.FIREBASE_API_KEY
        }
    };

    res.status(200).json(health);
});

// API endpoint for pipeline validation (future enhancement)
app.get('/api/validate', (req, res) => {
    res.json({
        message: 'Pipeline validation endpoint',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Development endpoints
if (process.env.NODE_ENV !== 'production') {
    // Show environment variables (excluding sensitive ones)
    app.get('/api/debug/env', (req, res) => {
        const safeEnvVars = {};
        Object.keys(process.env).forEach(key => {
            if (key.startsWith('FIREBASE_')) {
                safeEnvVars[key] = process.env[key] ? `${process.env[key].substring(0, 10)}...` : 'NOT_SET';
            } else if (!key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('TOKEN')) {
                safeEnvVars[key] = process.env[key];
            }
        });

        res.json({
            environment: process.env.NODE_ENV || 'development',
            variables: safeEnvVars,
            count: Object.keys(safeEnvVars).length
        });
    });
}

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
    console.log(`🚀 Buildkite Pipeline Builder running on port ${PORT}`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 Firebase configured: ${!!process.env.FIREBASE_API_KEY}`);
    
    if (!process.env.FIREBASE_API_KEY) {
        console.log('⚠️  Firebase authentication not configured');
        console.log('   Set FIREBASE_API_KEY and other Firebase environment variables');
    }
});

// Handle graceful shutdown
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