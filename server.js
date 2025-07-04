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

// Security middleware with updated CSP (removed script-src-attr restriction)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com"
            ],
            // Removed script-src-attr to allow event handlers
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
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).send('Something went wrong!');
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ✅ Server running successfully!
    📍 Local: http://localhost:${PORT}
    🌍 Network: http://0.0.0.0:${PORT}
    🔥 Environment: ${process.env.NODE_ENV || 'development'}
    
    Ready to build Buildkite pipelines! 🚀
    `);
});