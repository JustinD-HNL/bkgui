// js/mcp-config-ui.js
/**
 * MCP Configuration UI
 * Provides interface for configuring Buildkite MCP server connection
 */

class MCPConfigUI {
    constructor() {
        this.mcpClient = window.mcpClient;
        this.isVisible = false;
        this.modal = null;
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Add MCP Config button to header
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.getElementById('mcp-config-btn')) {
            // Find the API Config button to insert after it
            const apiConfigBtn = document.getElementById('api-config');
            
            const mcpBtn = document.createElement('button');
            mcpBtn.id = 'mcp-config-btn';
            mcpBtn.className = 'btn btn-secondary';
            mcpBtn.innerHTML = '<i class="fas fa-server"></i> MCP Server';
            mcpBtn.title = 'Configure MCP Server';
            
            if (apiConfigBtn && apiConfigBtn.nextSibling) {
                headerActions.insertBefore(mcpBtn, apiConfigBtn.nextSibling);
            } else {
                headerActions.appendChild(mcpBtn);
            }
        }
        
        // Create MCP configuration modal
        this.modal = document.createElement('div');
        this.modal.id = 'mcp-config-modal';
        this.modal.className = 'modal hidden';
        this.modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-server"></i> MCP Server Configuration</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="mcp-config-container">
                        <div class="mcp-info">
                            <p>Configure your Buildkite MCP (Model Context Protocol) server to enable AI assistant integration with Buildkite APIs.</p>
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle"></i>
                                The MCP server allows the AI assistant to interact with your Buildkite organization without CORS restrictions.
                            </div>
                        </div>
                        
                        <div class="mcp-server-options">
                            <h3>Server Setup</h3>
                            <div class="option-group">
                                <label>
                                    <input type="radio" name="mcp-setup" value="docker" checked>
                                    <strong>Docker (Recommended)</strong>
                                    <small>Run the MCP server using Docker</small>
                                </label>
                                <label>
                                    <input type="radio" name="mcp-setup" value="binary">
                                    <strong>Pre-built Binary</strong>
                                    <small>Download and run the MCP server binary</small>
                                </label>
                                <label>
                                    <input type="radio" name="mcp-setup" value="custom">
                                    <strong>Custom Server</strong>
                                    <small>Connect to an existing MCP server</small>
                                </label>
                            </div>
                        </div>
                        
                        <div id="mcp-setup-instructions" class="setup-instructions">
                            <!-- Dynamic content based on selection -->
                        </div>
                        
                        <div class="mcp-connection-form">
                            <h3>Connection Settings</h3>
                            
                            <div class="form-group">
                                <label for="mcp-server-url">MCP Server URL</label>
                                <input type="text" 
                                       id="mcp-server-url" 
                                       placeholder="http://localhost:8080 or ws://localhost:8080"
                                       class="form-control" />
                                <small>The URL where your MCP server is running</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="mcp-api-token">Buildkite API Token</label>
                                <input type="password" 
                                       id="mcp-api-token" 
                                       placeholder="bkua_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                       class="form-control" />
                                <small>Your Buildkite API token with appropriate permissions</small>
                                <a href="https://buildkite.com/user/api-access-tokens" target="_blank" class="text-link">
                                    <i class="fas fa-external-link-alt"></i> Create API Token
                                </a>
                            </div>
                            
                            <div class="form-group">
                                <label>Required API Token Scopes</label>
                                <div class="scopes-list">
                                    <div class="scope-item">
                                        <i class="fas fa-check-circle text-success"></i>
                                        <code>read_builds</code> - Read build data
                                    </div>
                                    <div class="scope-item">
                                        <i class="fas fa-check-circle text-success"></i>
                                        <code>write_builds</code> - Create new builds
                                    </div>
                                    <div class="scope-item">
                                        <i class="fas fa-check-circle text-success"></i>
                                        <code>read_pipelines</code> - Read pipeline data
                                    </div>
                                    <div class="scope-item">
                                        <i class="fas fa-check-circle text-success"></i>
                                        <code>write_pipelines</code> - Create/update pipelines
                                    </div>
                                    <div class="scope-item">
                                        <i class="fas fa-check-circle text-success"></i>
                                        <code>read_organizations</code> - Read organization data
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button id="test-mcp-connection" class="btn btn-secondary">
                                    <i class="fas fa-plug"></i> Test Connection
                                </button>
                                <button id="save-mcp-config" class="btn btn-primary" disabled>
                                    <i class="fas fa-save"></i> Save Configuration
                                </button>
                            </div>
                            
                            <div id="mcp-connection-status" class="connection-status hidden">
                                <!-- Dynamic status messages -->
                            </div>
                        </div>
                        
                        <div id="mcp-server-status" class="server-status hidden">
                            <h3>Server Status</h3>
                            <div class="status-content">
                                <!-- Dynamic server status -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .mcp-config-container {
                    max-width: 600px;
                    margin: 0 auto;
                }
                
                .mcp-info {
                    margin-bottom: 2rem;
                }
                
                .alert {
                    padding: 1rem;
                    background: var(--bg-info);
                    border: 1px solid var(--border-info);
                    border-radius: 6px;
                    margin-top: 1rem;
                }
                
                .alert-info {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.3);
                    color: var(--text-primary);
                }
                
                .mcp-server-options {
                    margin-bottom: 2rem;
                }
                
                .option-group {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                
                .option-group label {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.5rem;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border: 2px solid var(--border-color);
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .option-group label:hover {
                    border-color: var(--primary);
                }
                
                .option-group input[type="radio"] {
                    margin-top: 0.25rem;
                }
                
                .option-group input[type="radio"]:checked + strong {
                    color: var(--primary);
                }
                
                .option-group small {
                    display: block;
                    color: var(--text-secondary);
                    margin-top: 0.25rem;
                }
                
                .setup-instructions {
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: var(--bg-tertiary);
                    border-radius: 6px;
                }
                
                .setup-instructions pre {
                    background: var(--bg-primary);
                    padding: 1rem;
                    border-radius: 4px;
                    overflow-x: auto;
                    margin: 1rem 0;
                }
                
                .mcp-connection-form {
                    margin-bottom: 2rem;
                }
                
                .form-group {
                    margin-bottom: 1.5rem;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }
                
                .form-control {
                    width: 100%;
                    padding: 0.75rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    color: var(--text-primary);
                    font-family: inherit;
                }
                
                .form-control:focus {
                    outline: none;
                    border-color: var(--primary);
                }
                
                .form-group small {
                    display: block;
                    margin-top: 0.25rem;
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }
                
                .text-link {
                    color: var(--primary);
                    text-decoration: none;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    display: inline-block;
                }
                
                .text-link:hover {
                    text-decoration: underline;
                }
                
                .scopes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                
                .scope-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                }
                
                .scope-item code {
                    background: var(--bg-secondary);
                    padding: 0.125rem 0.5rem;
                    border-radius: 4px;
                }
                
                .form-actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 2rem;
                }
                
                .connection-status {
                    margin-top: 1rem;
                    padding: 1rem;
                    border-radius: 6px;
                    font-size: 0.875rem;
                }
                
                .connection-status.success {
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    color: var(--text-success);
                }
                
                .connection-status.error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: var(--text-error);
                }
                
                .server-status {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-radius: 6px;
                }
                
                .status-content {
                    margin-top: 1rem;
                }
                
                .status-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid var(--border-color);
                }
                
                .status-item:last-child {
                    border-bottom: none;
                }
            </style>
        `;
        
        document.body.appendChild(this.modal);
        
        // Set initial instructions
        this.updateSetupInstructions('docker');
    }
    
    setupEventListeners() {
        // MCP Config button
        const mcpBtn = document.getElementById('mcp-config-btn');
        if (mcpBtn) {
            mcpBtn.addEventListener('click', () => this.show());
        }
        
        // Close modal
        this.modal.querySelector('.close-modal').addEventListener('click', () => this.hide());
        
        // Setup option changes
        this.modal.querySelectorAll('input[name="mcp-setup"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateSetupInstructions(e.target.value);
            });
        });
        
        // Test connection
        document.getElementById('test-mcp-connection').addEventListener('click', () => {
            this.testConnection();
        });
        
        // Save configuration
        document.getElementById('save-mcp-config').addEventListener('click', () => {
            this.saveConfiguration();
        });
        
        // Enable save button when fields are filled
        const urlInput = document.getElementById('mcp-server-url');
        const tokenInput = document.getElementById('mcp-api-token');
        
        const checkFields = () => {
            const saveBtn = document.getElementById('save-mcp-config');
            saveBtn.disabled = !urlInput.value || !tokenInput.value;
        };
        
        urlInput.addEventListener('input', checkFields);
        tokenInput.addEventListener('input', checkFields);
    }
    
    updateSetupInstructions(setupType) {
        const container = document.getElementById('mcp-setup-instructions');
        
        switch (setupType) {
            case 'docker':
                container.innerHTML = `
                    <h4>Docker Setup Instructions</h4>
                    <ol>
                        <li>Make sure Docker is installed and running</li>
                        <li>Run the following command to start the MCP server:</li>
                    </ol>
                    <pre>docker run -d \\
  --name buildkite-mcp \\
  -p 8080:8080 \\
  -e BUILDKITE_API_TOKEN=your_token_here \\
  ghcr.io/buildkite/buildkite-mcp-server:latest</pre>
                    <p>The server will be available at <code>http://localhost:8080</code></p>
                `;
                break;
                
            case 'binary':
                container.innerHTML = `
                    <h4>Binary Setup Instructions</h4>
                    <ol>
                        <li>Download the latest binary from the <a href="https://github.com/buildkite/buildkite-mcp-server/releases" target="_blank">releases page</a></li>
                        <li>Make it executable: <code>chmod +x buildkite-mcp-server</code></li>
                        <li>Run the server:</li>
                    </ol>
                    <pre>BUILDKITE_API_TOKEN=your_token_here \\
./buildkite-mcp-server --port 8080</pre>
                    <p>The server will be available at <code>http://localhost:8080</code></p>
                `;
                break;
                
            case 'custom':
                container.innerHTML = `
                    <h4>Custom Server Setup</h4>
                    <p>If you have an existing MCP server running, enter its URL below.</p>
                    <p>Make sure the server is configured with your Buildkite API token and is accessible from this application.</p>
                `;
                break;
        }
    }
    
    async testConnection() {
        const urlInput = document.getElementById('mcp-server-url');
        const tokenInput = document.getElementById('mcp-api-token');
        const statusDiv = document.getElementById('mcp-connection-status');
        
        const url = urlInput.value.trim();
        const token = tokenInput.value.trim();
        
        if (!url || !token) {
            this.showStatus('Please enter both server URL and API token', 'error');
            return;
        }
        
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing connection...';
        statusDiv.className = 'connection-status';
        statusDiv.classList.remove('hidden');
        
        try {
            const result = await this.mcpClient.connect(url, token);
            
            if (result.success) {
                this.showStatus('<i class="fas fa-check-circle"></i> Connection successful!', 'success');
                document.getElementById('save-mcp-config').disabled = false;
                
                // Show server status
                this.showServerStatus();
            } else {
                this.showStatus(`<i class="fas fa-times-circle"></i> Connection failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`<i class="fas fa-times-circle"></i> Connection error: ${error.message}`, 'error');
        }
    }
    
    showStatus(message, type) {
        const statusDiv = document.getElementById('mcp-connection-status');
        statusDiv.innerHTML = message;
        statusDiv.className = `connection-status ${type}`;
        statusDiv.classList.remove('hidden');
    }
    
    async showServerStatus() {
        const statusContainer = document.getElementById('mcp-server-status');
        const statusContent = statusContainer.querySelector('.status-content');
        
        // Get some basic info from the server
        try {
            const pipelines = await this.mcpClient.listPipelines({ per_page: 1 });
            
            statusContent.innerHTML = `
                <div class="status-item">
                    <span>Connection Status</span>
                    <span class="text-success"><i class="fas fa-circle"></i> Connected</span>
                </div>
                <div class="status-item">
                    <span>Server URL</span>
                    <span>${this.mcpClient.serverUrl}</span>
                </div>
                <div class="status-item">
                    <span>Available Tools</span>
                    <span>${Object.keys(this.mcpClient.availableTools).length} tools</span>
                </div>
            `;
            
            statusContainer.classList.remove('hidden');
        } catch (error) {
            console.error('Error fetching server status:', error);
        }
    }
    
    saveConfiguration() {
        this.mcpClient.saveConfig();
        this.showStatus('<i class="fas fa-check-circle"></i> Configuration saved!', 'success');
        
        // Update AI Assistant if it exists
        if (window.aiAssistant) {
            window.aiAssistant.updateMCPStatus();
        }
        
        setTimeout(() => {
            this.hide();
        }, 1500);
    }
    
    show() {
        this.modal.classList.remove('hidden');
        
        // Load existing config if any
        if (this.mcpClient.serverUrl) {
            document.getElementById('mcp-server-url').value = this.mcpClient.serverUrl;
        }
        if (this.mcpClient.apiToken) {
            document.getElementById('mcp-api-token').value = this.mcpClient.apiToken;
        }
    }
    
    hide() {
        this.modal.classList.add('hidden');
    }
}

// Initialize MCP Config UI
if (typeof window !== 'undefined') {
    window.mcpConfigUI = new MCPConfigUI();
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPConfigUI;
}