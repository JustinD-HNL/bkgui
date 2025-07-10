// js/mcp-client.js
/**
 * MCP (Model Context Protocol) Client for Buildkite
 * Handles communication with the Buildkite MCP server
 */

class MCPClient {
    constructor() {
        this.serverUrl = null;
        this.apiToken = null;
        this.isConnected = false;
        this.capabilities = null;
        this.websocket = null;
        this.isInternal = false;
        
        // MCP protocol version
        this.protocolVersion = '1.0';
        
        // Check if running with internal MCP server
        this.checkInternalServer();
        
        // Available MCP tools based on Buildkite MCP server
        this.availableTools = {
            // Cluster operations
            'list_clusters': {
                description: 'List all Buildkite clusters',
                parameters: {}
            },
            'get_cluster': {
                description: 'Get details of a specific cluster',
                parameters: {
                    cluster_id: { type: 'string', required: true }
                }
            },
            'list_cluster_queues': {
                description: 'List queues in a cluster',
                parameters: {
                    cluster_id: { type: 'string', required: true }
                }
            },
            
            // Pipeline operations
            'list_pipelines': {
                description: 'List all pipelines in the organization',
                parameters: {
                    page: { type: 'number', required: false },
                    per_page: { type: 'number', required: false }
                }
            },
            'get_pipeline': {
                description: 'Get details of a specific pipeline',
                parameters: {
                    pipeline_slug: { type: 'string', required: true }
                }
            },
            'create_pipeline': {
                description: 'Create a new pipeline',
                parameters: {
                    name: { type: 'string', required: true },
                    repository: { type: 'string', required: true },
                    configuration: { type: 'string', required: true }
                }
            },
            'update_pipeline': {
                description: 'Update an existing pipeline',
                parameters: {
                    pipeline_slug: { type: 'string', required: true },
                    configuration: { type: 'string', required: true }
                }
            },
            
            // Build operations
            'list_builds': {
                description: 'List builds for a pipeline',
                parameters: {
                    pipeline_slug: { type: 'string', required: true },
                    branch: { type: 'string', required: false },
                    state: { type: 'string', required: false }
                }
            },
            'get_build': {
                description: 'Get details of a specific build',
                parameters: {
                    pipeline_slug: { type: 'string', required: true },
                    build_number: { type: 'number', required: true }
                }
            },
            'create_build': {
                description: 'Create a new build',
                parameters: {
                    pipeline_slug: { type: 'string', required: true },
                    commit: { type: 'string', required: true },
                    branch: { type: 'string', required: true },
                    message: { type: 'string', required: false }
                }
            },
            
            // Job operations
            'list_jobs': {
                description: 'List jobs in a build',
                parameters: {
                    pipeline_slug: { type: 'string', required: true },
                    build_number: { type: 'number', required: true }
                }
            },
            'get_job_log': {
                description: 'Get the log output of a job',
                parameters: {
                    pipeline_slug: { type: 'string', required: true },
                    build_number: { type: 'number', required: true },
                    job_id: { type: 'string', required: true }
                }
            },
            
            // Test operations
            'list_test_runs': {
                description: 'List test runs',
                parameters: {
                    suite_slug: { type: 'string', required: true }
                }
            },
            'get_test_run': {
                description: 'Get details of a test run',
                parameters: {
                    suite_slug: { type: 'string', required: true },
                    run_id: { type: 'string', required: true }
                }
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadConfig();
    }
    
    async checkInternalServer() {
        // Check if we're running with an internal MCP server
        try {
            const response = await fetch('/api/mcp/health');
            if (response.ok) {
                this.isInternal = true;
                console.log('🔒 Internal MCP server detected');
            }
        } catch (e) {
            // Internal server not available
        }
    }
    
    loadConfig() {
        const config = localStorage.getItem('mcp-config');
        if (config) {
            const parsed = JSON.parse(config);
            this.serverUrl = parsed.serverUrl;
            this.apiToken = parsed.apiToken;
        }
        
        // If internal server is available, use it by default
        if (this.isInternal && !this.serverUrl) {
            this.serverUrl = '/api/mcp';
        }
    }
    
    saveConfig() {
        localStorage.setItem('mcp-config', JSON.stringify({
            serverUrl: this.serverUrl,
            apiToken: this.apiToken
        }));
    }
    
    async connect(serverUrl, apiToken, orgSlug) {
        // If using internal server through proxy
        if (serverUrl === '/api/mcp' || this.isInternal) {
            this.serverUrl = '/api/mcp';
            this.apiToken = apiToken;
            this.orgSlug = orgSlug;
            this.isInternal = true;
        } else {
            this.serverUrl = serverUrl;
            this.apiToken = apiToken;
            this.orgSlug = orgSlug;
        }
        
        try {
            // For WebSocket connection (not supported for internal proxy)
            if (!this.isInternal && (serverUrl.startsWith('ws://') || serverUrl.startsWith('wss://'))) {
                await this.connectWebSocket();
            } else {
                // For HTTP-based connection
                await this.testConnection();
            }
            
            this.isConnected = true;
            this.saveConfig();
            
            // Notify AI Assistant of connection state change
            if (window.aiAssistant) {
                window.aiAssistant.updateMCPStatus();
            }
            
            return { success: true };
        } catch (error) {
            this.isConnected = false;
            
            // Notify AI Assistant of connection state change
            if (window.aiAssistant) {
                window.aiAssistant.updateMCPStatus();
            }
            
            return { success: false, error: error.message };
        }
    }
    
    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            this.websocket = new WebSocket(this.serverUrl);
            
            this.websocket.onopen = () => {
                // Send authentication
                this.websocket.send(JSON.stringify({
                    type: 'auth',
                    token: this.apiToken
                }));
                resolve();
            };
            
            this.websocket.onerror = (error) => {
                reject(new Error('WebSocket connection failed'));
            };
            
            this.websocket.onclose = () => {
                this.isConnected = false;
                
                // Notify AI Assistant of connection state change
                if (window.aiAssistant) {
                    window.aiAssistant.updateMCPStatus();
                }
            };
            
            this.websocket.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };
        });
    }
    
    async testConnection() {
        // Test connection by checking health endpoint
        try {
            const response = await fetch(`${this.serverUrl}/health`);
            if (!response.ok) {
                throw new Error('Health check failed');
            }
            const data = await response.json();
            if (data.status !== 'ok') {
                throw new Error('MCP server not healthy');
            }
        } catch (error) {
            throw new Error(`Connection test failed: ${error.message}`);
        }
    }
    
    handleMessage(message) {
        // Handle incoming messages from MCP server
        console.log('MCP message:', message);
    }
    
    async callTool(toolName, parameters = {}) {
        if (!this.isConnected && !(await this.reconnect())) {
            return { success: false, error: 'Not connected to MCP server' };
        }
        
        const tool = this.availableTools[toolName];
        if (!tool) {
            return { success: false, error: `Unknown tool: ${toolName}` };
        }
        
        // Validate required parameters
        for (const [param, config] of Object.entries(tool.parameters)) {
            if (config.required && !parameters[param]) {
                return { success: false, error: `Missing required parameter: ${param}` };
            }
        }
        
        try {
            // Add API token and org slug to parameters if not already present
            const requestBody = {
                tool: toolName,
                parameters: {
                    ...parameters,
                    api_token: this.apiToken,
                    org: this.orgSlug
                }
            };
            
            // Make HTTP request to MCP server
            const response = await fetch(`${this.serverUrl}/invoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`MCP server error: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('MCP tool call error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async reconnect() {
        if (this.serverUrl && this.apiToken) {
            const result = await this.connect(this.serverUrl, this.apiToken);
            return result.success;
        }
        return false;
    }
    
    disconnect() {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        this.isConnected = false;
        
        // Notify AI Assistant of connection state change
        if (window.aiAssistant) {
            window.aiAssistant.updateMCPStatus();
        }
    }
    
    // Helper methods for common operations
    async listPipelines(options = {}) {
        return this.callTool('list_pipelines', options);
    }
    
    async getPipeline(pipelineSlug) {
        return this.callTool('get_pipeline', { pipeline_slug: pipelineSlug });
    }
    
    async createPipeline(name, repository, configuration) {
        return this.callTool('create_pipeline', { name, repository, configuration });
    }
    
    async updatePipeline(pipelineSlug, configuration) {
        return this.callTool('update_pipeline', { 
            pipeline_slug: pipelineSlug, 
            configuration 
        });
    }
    
    async listBuilds(pipelineSlug, options = {}) {
        return this.callTool('list_builds', { 
            pipeline_slug: pipelineSlug,
            ...options 
        });
    }
    
    async getBuild(pipelineSlug, buildNumber) {
        return this.callTool('get_build', { 
            pipeline_slug: pipelineSlug,
            build_number: buildNumber 
        });
    }
    
    async createBuild(pipelineSlug, commit, branch, message = '') {
        return this.callTool('create_build', {
            pipeline_slug: pipelineSlug,
            commit,
            branch,
            message
        });
    }
    
    // Format tools for AI context
    getToolsForAI() {
        const tools = [];
        for (const [name, tool] of Object.entries(this.availableTools)) {
            tools.push({
                name,
                description: tool.description,
                parameters: tool.parameters
            });
        }
        return tools;
    }
}

// Initialize MCP client
if (typeof window !== 'undefined') {
    window.mcpClient = new MCPClient();
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPClient;
}