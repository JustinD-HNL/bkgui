#!/usr/bin/env node

/**
 * Simple MCP Server for Buildkite
 * This is a minimal implementation that proxies requests to the Buildkite API
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3001;
const BUILDKITE_API_TOKEN = process.env.BUILDKITE_API_TOKEN;

// MCP protocol handlers
const handlers = {
    '/health': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
    },
    
    '/tools': (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            tools: [
                'list_pipelines', 'get_pipeline', 'create_pipeline', 'update_pipeline',
                'list_builds', 'get_build', 'create_build',
                'list_jobs', 'get_job_log',
                'list_clusters', 'get_cluster', 'list_cluster_queues',
                'list_test_runs', 'get_test_run'
            ]
        }));
    },
    
    '/invoke': async (req, res) => {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const result = await invokeTool(data.tool, data.parameters || {});
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
};

// Tool implementations
async function invokeTool(toolName, parameters) {
    const token = BUILDKITE_API_TOKEN || parameters.api_token;
    if (!token) {
        throw new Error('Buildkite API token not provided');
    }
    
    // Map tool names to Buildkite API endpoints
    const toolMappings = {
        'list_pipelines': { path: '/organizations/{org}/pipelines', method: 'GET' },
        'get_pipeline': { path: '/organizations/{org}/pipelines/{pipeline_slug}', method: 'GET' },
        'create_pipeline': { path: '/organizations/{org}/pipelines', method: 'POST' },
        'update_pipeline': { path: '/organizations/{org}/pipelines/{pipeline_slug}', method: 'PATCH' },
        'list_builds': { path: '/organizations/{org}/pipelines/{pipeline_slug}/builds', method: 'GET' },
        'get_build': { path: '/organizations/{org}/pipelines/{pipeline_slug}/builds/{build_number}', method: 'GET' },
        'create_build': { path: '/organizations/{org}/pipelines/{pipeline_slug}/builds', method: 'POST' },
        'list_jobs': { path: '/organizations/{org}/pipelines/{pipeline_slug}/builds/{build_number}/jobs', method: 'GET' },
        'get_job_log': { path: '/organizations/{org}/pipelines/{pipeline_slug}/builds/{build_number}/jobs/{job_id}/log', method: 'GET' }
    };
    
    const mapping = toolMappings[toolName];
    if (!mapping) {
        throw new Error(`Unknown tool: ${toolName}`);
    }
    
    // Build the API path
    let apiPath = mapping.path;
    for (const [key, value] of Object.entries(parameters)) {
        apiPath = apiPath.replace(`{${key}}`, value);
    }
    
    // Make the API request
    return await makeApiRequest(apiPath, mapping.method, token, parameters);
}

async function makeApiRequest(path, method, token, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.buildkite.com',
            path: `/v2${path}`,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({ success: true, data: result });
                    } else {
                        resolve({ success: false, error: result.message || 'API request failed' });
                    }
                } catch (e) {
                    resolve({ success: false, error: 'Invalid response from API' });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (method !== 'GET' && body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

// Create the server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const handler = handlers[parsedUrl.pathname];
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (handler) {
        handler(req, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
    if (!BUILDKITE_API_TOKEN) {
        console.log('Warning: BUILDKITE_API_TOKEN not set. Token must be provided with each request.');
    }
});