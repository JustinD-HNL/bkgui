// server.js - Buildkite Pipeline Builder Express Server (No Authentication)
const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('🚀 Starting Buildkite Pipeline Builder Server...');
console.log(`📦 Node.js version: ${process.version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Security middleware with simplified CSP (no Firebase)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com"
            ],
            connectSrc: [
                "'self'"
            ],
            imgSrc: [
                "'self'", 
                "data:",
                "https:"
            ],
            fontSrc: [
                "'self'", 
                "https://cdnjs.cloudflare.com",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com"
            ],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'self'", "blob:"],
            manifestSrc: ["'self'"]
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Basic CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
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

// Health check endpoint
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.3',
        environment: process.env.NODE_ENV || 'development',
        authentication: 'disabled',
        cloudRun: {
            service: process.env.K_SERVICE || 'Not on Cloud Run',
            revision: process.env.K_REVISION || 'Not on Cloud Run'
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
        requestId: Math.random().toString(36).substring(7),
        authentication: 'disabled'
    });
});

// Static file serving
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
        
        // Add security headers
        if (filePath.includes('index.html')) {
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    }
}));

// Enhanced error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    const errorResponse = {
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? 
            err.message : 'Something went wrong',
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
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔓 Authentication: Disabled`);
    console.log(`☁️  Cloud Run service: ${process.env.K_SERVICE || 'Not on Cloud Run'}`);
    console.log(`🛡️  Security: Basic CSP (no Firebase dependencies)`);
    console.log('✅ Server started successfully without authentication');
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