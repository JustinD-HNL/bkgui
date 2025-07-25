// js/ai-assistant.js
/**
 * AI Assistant Integration
 * Supports Claude (via Anthropic API) and ChatGPT (via OpenAI API)
 * Allows natural language pipeline creation
 */

class AIAssistant {
    constructor() {
        this.providers = {
            claude: {
                name: 'Claude',
                icon: 'fa-robot',
                requiresAuth: true,
                authType: 'api-key',
                baseUrl: 'https://api.anthropic.com/v1',
                models: [], // Will be fetched dynamically
                // Fallback models - only used if dynamic fetch fails
                fallbackModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
            },
            chatgpt: {
                name: 'ChatGPT',
                icon: 'fa-brain',
                requiresAuth: true,
                authType: 'api-key',
                baseUrl: 'https://api.openai.com/v1',
                models: [], // Will be fetched dynamically
                // Fallback models - only used if dynamic fetch fails
                fallbackModels: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
            }
        };

        this.currentProvider = null;
        this.apiKey = null;
        this.selectedModel = null;
        this.conversationHistory = [];
        // Don't store mcpClient reference during construction - access it dynamically
        this.useMCP = false;
        
        this.systemPrompt = `You are a Buildkite pipeline expert assistant. Your role is to help users create, modify, and optimize Buildkite pipelines.

When users ask you to create pipeline steps or build a pipeline, respond with a JSON object that will directly add steps to their pipeline builder in the middle window. The format should be:

{
    "action": "create_pipeline",
    "steps": [
        {
            "type": "command",
            "properties": {
                "label": "Step label",
                "command": "command to run",
                "key": "unique-key",
                "agents": { "queue": "default" }
            }
        }
    ]
}

Available step types: command, wait, block, input, trigger, group

For command steps, you can include properties like:
- label, command, key, depends_on, env, agents, artifact_paths, timeout_in_minutes, retry, soft_fail, parallelism, matrix, plugins

IMPORTANT: When you create pipeline steps, they will be immediately added to the user's pipeline in the middle window. The user can then click on each step to configure its properties in the right panel.

For other requests that don't involve creating a pipeline, respond normally with helpful information about Buildkite.`;
        
        this.mcpSystemPrompt = `You are a Buildkite pipeline expert assistant with access to live Buildkite data through MCP tools.

You have access to the following Buildkite tools:
{tools}

When users ask about their Buildkite organization, pipelines, builds, or tests, use these tools to get real-time information.

For tool usage, respond with:
{
    "action": "mcp_tool",
    "tool": "tool_name",
    "parameters": {
        // tool parameters
    }
}

When creating pipeline steps, use this format to add them directly to the pipeline builder:
{
    "action": "create_pipeline",
    "steps": [
        {
            "type": "command",
            "properties": {
                "label": "Step label",
                "command": "command to run",
                "key": "unique-key"
            }
        }
    ]
}

IMPORTANT: Pipeline steps you create will be immediately added to the user's pipeline in the middle window. The user can then click on each step to configure its properties.

You can also create and update pipelines using the available tools. Always provide helpful context with the data you retrieve.`;

        this.init();
    }

    init() {
        this.loadSettings();
        
        // Ensure DOM is ready before creating UI
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.createUI();
                this.updateMCPStatus();
            });
        } else {
            this.createUI();
            this.updateMCPStatus();
        }
    }

    loadSettings() {
        const settings = localStorage.getItem('ai-assistant-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.currentProvider = parsed.provider;
            this.selectedModel = parsed.model;
        }
        
        // Load API keys from sessionStorage (cleared when browser closes)
        const apiKeys = sessionStorage.getItem('ai-assistant-keys');
        if (apiKeys) {
            const parsed = JSON.parse(apiKeys);
            if (this.currentProvider && parsed[this.currentProvider]) {
                this.apiKey = parsed[this.currentProvider];
            }
        }
    }

    saveSettings() {
        localStorage.setItem('ai-assistant-settings', JSON.stringify({
            provider: this.currentProvider,
            model: this.selectedModel
        }));
        
        // Save API keys to sessionStorage
        if (this.apiKey && this.currentProvider) {
            const apiKeys = JSON.parse(sessionStorage.getItem('ai-assistant-keys') || '{}');
            apiKeys[this.currentProvider] = this.apiKey;
            sessionStorage.setItem('ai-assistant-keys', JSON.stringify(apiKeys));
        }
    }

    createUI() {
        // Create AI Assistant button
        const actionsContainer = document.querySelector('.header-actions');
        if (actionsContainer && !document.getElementById('ai-assistant-button')) {
            const aiBtn = document.createElement('button');
            aiBtn.id = 'ai-assistant-button';
            aiBtn.className = 'action-btn';
            aiBtn.innerHTML = '<i class="fas fa-magic"></i> AI Assistant';
            aiBtn.addEventListener('click', () => this.showAssistant());
            
            actionsContainer.appendChild(aiBtn);
        } else if (!actionsContainer) {
            // If header-actions doesn't exist yet, retry after a short delay
            setTimeout(() => this.createUI(), 100);
            return;
        }

        // Create AI Assistant modal
        const modal = document.createElement('div');
        modal.id = 'ai-assistant-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2><i class="fas fa-magic"></i> AI Pipeline Assistant</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="ai-assistant-container">
                        <div class="ai-settings">
                            <div class="ai-provider-selection">
                                <label>AI Provider:</label>
                                <div class="provider-buttons">
                                    <button class="provider-btn" data-provider="claude">
                                        <i class="fas fa-robot"></i> Claude
                                    </button>
                                    <button class="provider-btn" data-provider="chatgpt">
                                        <i class="fas fa-brain"></i> ChatGPT
                                    </button>
                                </div>
                            </div>
                            
                            <div id="ai-auth-section" class="ai-auth-section hidden">
                                <label>API Key:</label>
                                <input type="password" id="ai-api-key" placeholder="Enter your API key" />
                                <small>Your API key is not stored and must be entered each session</small>
                                ${window.location.protocol !== 'file:' && !window.location.hostname.includes('localhost') ? 
                                '<small style="color: var(--warning); display: block; margin-top: 0.5rem;"><i class="fas fa-exclamation-triangle"></i> Note: This domain has security restrictions. The AI assistant may not work unless deployed with proper CORS/CSP headers.</small>' : ''}
                                
                                <label>Model:</label>
                                <select id="ai-model" class="form-control">
                                    <option value="">Select a model</option>
                                </select>
                                
                                <div id="mcp-status" class="mcp-status">
                                    <label>MCP Server Status:</label>
                                    <div class="mcp-status-indicator">
                                        <span class="status-dot"></span>
                                        <span class="status-text">Not configured</span>
                                        <button id="mcp-configure-btn" class="btn btn-sm btn-link">
                                            <i class="fas fa-cog"></i> Configure
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="ai-chat-section" class="ai-chat-section hidden">
                            <div class="ai-examples">
                                <h4>Try these examples:</h4>
                                <div class="example-chips">
                                    <button class="example-chip" data-prompt="Create a CI/CD pipeline for a Node.js application with testing and deployment">
                                        Node.js CI/CD Pipeline
                                    </button>
                                    <button class="example-chip" data-prompt="Create a pipeline that runs tests in parallel across 5 machines">
                                        Parallel Testing
                                    </button>
                                    <button class="example-chip" data-prompt="Create a deployment pipeline with manual approval gates">
                                        Deployment with Approval
                                    </button>
                                    <button class="example-chip" data-prompt="Create a monorepo pipeline that only builds changed services">
                                        Monorepo Pipeline
                                    </button>
                                    <button class="example-chip" data-prompt="Create a Docker build pipeline with security scanning">
                                        Docker with Security
                                    </button>
                                </div>
                            </div>
                            
                            <div class="ai-conversation">
                                <div id="ai-messages" class="ai-messages">
                                    <div class="ai-message ai-message-assistant">
                                        <i class="fas fa-magic"></i>
                                        <div class="message-content">
                                            Hello! I'm your AI Pipeline Assistant. I can help you create Buildkite pipelines using natural language. Just describe what you want to build, and I'll generate the pipeline for you!
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="ai-input-container">
                                    <textarea id="ai-input" 
                                              class="ai-input" 
                                              placeholder="Describe the pipeline you want to create..."
                                              rows="3"></textarea>
                                    <button id="ai-send" class="btn btn-primary" disabled>
                                        <i class="fas fa-paper-plane"></i> Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                #ai-assistant-modal {
                    z-index: 9999 !important;
                }
                
                #ai-assistant-modal .modal-content {
                    height: 85vh;
                    max-height: 600px;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
                
                #ai-assistant-modal .modal-header {
                    flex-shrink: 0;
                }
                
                #ai-assistant-modal .modal-body {
                    flex: 1;
                    overflow-y: scroll !important;
                    overflow-x: hidden;
                    padding: 0;
                    position: relative;
                    -webkit-overflow-scrolling: touch;
                }
                
                /* Custom scrollbar */
                #ai-assistant-modal .modal-body::-webkit-scrollbar {
                    width: 10px;
                }
                
                #ai-assistant-modal .modal-body::-webkit-scrollbar-track {
                    background: var(--bg-secondary);
                    border-radius: 5px;
                }
                
                #ai-assistant-modal .modal-body::-webkit-scrollbar-thumb {
                    background: var(--primary);
                    border-radius: 5px;
                }
                
                #ai-assistant-modal .modal-body::-webkit-scrollbar-thumb:hover {
                    background: var(--primary-hover);
                }
                
                .ai-assistant-container {
                    min-height: 100%;
                    padding-bottom: 2rem;
                }

                .ai-settings {
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                    flex-shrink: 0;
                }

                .ai-provider-selection {
                    margin-bottom: 1rem;
                }

                .provider-buttons {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }

                .provider-btn {
                    flex: 1;
                    padding: 0.75rem;
                    background: var(--bg-primary);
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                }

                .provider-btn:hover {
                    border-color: var(--primary);
                }

                .provider-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .provider-btn i {
                    font-size: 1.5rem;
                }

                .ai-auth-section {
                    margin-top: 1rem;
                }

                .ai-auth-section label {
                    display: block;
                    margin-top: 1rem;
                    margin-bottom: 0.25rem;
                    font-weight: 500;
                }

                .ai-auth-section input,
                .ai-auth-section select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .ai-auth-section small {
                    display: block;
                    margin-top: 0.25rem;
                    color: var(--text-tertiary);
                    font-size: 0.75rem;
                }

                .ai-chat-section {
                    display: block;
                    padding: 1rem;
                    margin-top: 1rem;
                }

                .ai-examples {
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
                }

                .ai-examples h4 {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .example-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .example-chip {
                    padding: 0.5rem 1rem;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                }

                .example-chip:hover {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .ai-conversation {
                    margin-top: 1rem;
                }

                .ai-messages {
                    min-height: 300px;
                    max-height: 400px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 1rem;
                    background: var(--bg-tertiary);
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }

                .ai-message {
                    display: flex;
                    gap: 0.75rem;
                    align-items: start;
                    animation: messageSlide 0.3s ease;
                }

                @keyframes messageSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .ai-message i {
                    font-size: 1.25rem;
                    margin-top: 0.25rem;
                    color: var(--primary);
                }

                .ai-message-user {
                    flex-direction: row-reverse;
                }

                .ai-message-user i {
                    color: var(--text-secondary);
                }

                .message-content {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    background: var(--bg-secondary);
                    border-radius: 8px;
                    line-height: 1.5;
                }
                
                .message-content p {
                    margin: 0 0 0.5rem 0;
                }
                
                .message-content p:last-child {
                    margin-bottom: 0;
                }
                
                .message-content pre {
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    padding: 0.75rem;
                    margin: 0.5rem 0;
                    overflow-x: auto;
                }
                
                .message-content code {
                    background: var(--bg-primary);
                    padding: 0.1rem 0.3rem;
                    border-radius: 3px;
                    font-family: 'Monaco', 'Menlo', monospace;
                    font-size: 0.9em;
                }
                
                .message-content pre code {
                    background: none;
                    padding: 0;
                    font-size: 0.875rem;
                }
                
                .message-content ul,
                .message-content ol {
                    margin: 0.5rem 0;
                    padding-left: 1.5rem;
                }
                
                .message-content li {
                    margin: 0.25rem 0;
                }
                
                .message-content strong {
                    font-weight: 600;
                    color: var(--text-primary);
                }
                
                .message-content em {
                    font-style: italic;
                }

                .ai-message-user .message-content {
                    background: var(--primary);
                    color: white;
                }

                .message-pipeline {
                    margin-top: 0.5rem;
                    padding: 0.75rem;
                    background: var(--bg-tertiary);
                    border-radius: 6px;
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                }

                .message-actions {
                    margin-top: 0.5rem;
                    display: flex;
                    gap: 0.5rem;
                }

                .message-actions button {
                    padding: 0.25rem 0.75rem;
                    font-size: 0.875rem;
                }
                
                .message-pipeline {
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1rem;
                    margin: 1rem 0;
                }
                
                .pipeline-summary h4 {
                    margin: 0 0 0.75rem 0;
                    color: var(--primary);
                    font-size: 1rem;
                }
                
                .pipeline-steps-list {
                    margin: 0;
                    padding-left: 1.5rem;
                }
                
                .pipeline-steps-list li {
                    margin: 0.5rem 0;
                    color: var(--text-primary);
                }
                
                .step-icon {
                    margin-right: 0.5rem;
                    font-size: 1.1em;
                }
                
                .step-type {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    margin-left: 0.5rem;
                }
                
                .json-details {
                    margin: 1rem 0;
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    padding: 0.5rem;
                }
                
                .json-details summary {
                    cursor: pointer;
                    padding: 0.5rem;
                    color: var(--primary);
                    font-weight: 500;
                }
                
                .json-details pre {
                    margin: 0.5rem 0 0 0;
                    max-height: 300px;
                    overflow: auto;
                }
                
                .additional-info {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                }

                .ai-input-container {
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    gap: 0.5rem;
                }

                .ai-input {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    resize: none;
                    font-family: inherit;
                }

                .ai-input:focus {
                    outline: none;
                    border-color: var(--primary);
                }

                .ai-thinking {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--text-secondary);
                    font-style: italic;
                }

                .ai-thinking i {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .mcp-status {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                }
                
                .mcp-status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }
                
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--text-tertiary);
                }
                
                .status-dot.connected {
                    background: var(--success);
                }
                
                .status-text {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }
                
                .btn-link {
                    background: none;
                    border: none;
                    color: var(--primary);
                    text-decoration: underline;
                    cursor: pointer;
                    font-size: 0.875rem;
                    padding: 0;
                    margin-left: 0.5rem;
                }

                .ai-error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid #ef4444;
                    color: #dc2626;
                    padding: 0.75rem;
                    border-radius: 6px;
                    margin-top: 0.5rem;
                }
            </style>
        `;

        document.body.appendChild(modal);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle modal backdrop clicks
        const modal = document.getElementById('ai-assistant-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                // Only close if clicking directly on the modal backdrop, not its contents
                if (e.target === modal) {
                    this.hideAssistant();
                }
            });
        }
        
        // Use event delegation for the MCP Configure button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'mcp-configure-btn' || e.target.closest('#mcp-configure-btn')) {
                e.preventDefault();
                e.stopPropagation();
                if (window.mcpConfigUI) {
                    window.mcpConfigUI.show();
                } else {
                    console.error('MCP Config UI not available');
                }
            }
        });
        
        // Provider selection and other delegated events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.provider-btn')) {
                const btn = e.target.closest('.provider-btn');
                const provider = btn.dataset.provider;
                this.selectProvider(provider);
            }

            // Example chips
            if (e.target.classList.contains('example-chip')) {
                const prompt = e.target.dataset.prompt;
                document.getElementById('ai-input').value = prompt;
                this.enableSendButton();
            }

            // Close modal
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal && modal.id === 'ai-assistant-modal') {
                    this.hideAssistant();
                }
            }
            
            // Handle message action buttons (clear pipeline, undo)
            if (e.target.closest('[data-action="clear-pipeline"]')) {
                e.preventDefault();
                if (window.pipelineBuilder) {
                    window.pipelineBuilder.clearPipeline();
                    this.showNotification('Pipeline cleared', 'info');
                }
            }
            
            if (e.target.closest('[data-action="undo-steps"]')) {
                e.preventDefault();
                const btn = e.target.closest('[data-action="undo-steps"]');
                const stepsCount = parseInt(btn.dataset.stepsCount || '1');
                
                if (window.pipelineBuilder && window.pipelineBuilder.steps.length >= stepsCount) {
                    // Remove the last N steps that were just added
                    for (let i = 0; i < stepsCount; i++) {
                        const lastStep = window.pipelineBuilder.steps[window.pipelineBuilder.steps.length - 1];
                        if (lastStep) {
                            window.pipelineBuilder.deleteStep(lastStep.id);
                        }
                    }
                    this.showNotification('Removed last added steps', 'info');
                }
            }
        });

        // API key input
        const apiKeyInput = document.getElementById('ai-api-key');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', async () => {
                this.apiKey = apiKeyInput.value;
                if (this.apiKey && this.apiKey.length > 10) {
                    await this.fetchAvailableModels();
                }
                this.checkReadyToChat();
            });
        }

        // Model selection
        const modelSelect = document.getElementById('ai-model');
        if (modelSelect) {
            modelSelect.addEventListener('change', () => {
                this.selectedModel = modelSelect.value;
                this.checkReadyToChat();
            });
        }

        // Input and send
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');

        if (input) {
            input.addEventListener('input', () => {
                this.enableSendButton();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!sendBtn.disabled) {
                        this.sendMessage();
                    }
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Handle ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('ai-assistant-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    this.hideAssistant();
                }
            }
        });
    }

    selectProvider(provider) {
        this.currentProvider = provider;
        
        // Update UI
        document.querySelectorAll('.provider-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-provider="${provider}"]`).classList.add('active');
        
        // Show auth section
        const authSection = document.getElementById('ai-auth-section');
        authSection.classList.remove('hidden');
        
        // Clear models until API key is entered
        const modelSelect = document.getElementById('ai-model');
        const providerData = this.providers[provider];
        modelSelect.innerHTML = '<option value="">Enter API key to see available models</option>';
        modelSelect.disabled = true;
        
        // Clear API key for security
        const apiKeyInput = document.getElementById('ai-api-key');
        apiKeyInput.value = '';
        apiKeyInput.placeholder = `Enter your ${providerData.name} API key`;
        this.apiKey = null;
        
        this.saveSettings();
        this.checkReadyToChat();
    }

    async fetchAvailableModels() {
        const modelSelect = document.getElementById('ai-model');
        if (!modelSelect) return;
        
        // Clear models if no provider or API key
        if (!this.currentProvider || !this.apiKey) {
            modelSelect.innerHTML = '<option value="">Enter API key to see available models</option>';
            modelSelect.disabled = true;
            return;
        }
        
        const provider = this.providers[this.currentProvider];
        
        // Show loading state
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        modelSelect.disabled = true;
        
        // Add visual feedback that we're validating the API key
        const apiKeyInput = document.getElementById('ai-api-key');
        const originalPlaceholder = apiKeyInput.placeholder;
        apiKeyInput.placeholder = 'Validating API key...';
        apiKeyInput.style.borderColor = 'var(--primary)';
        
        try {
            let models = [];
            
            if (this.currentProvider === 'chatgpt') {
                // Fetch models from OpenAI
                const response = await fetch(`${provider.baseUrl}/models`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Filter for GPT models and other chat models, excluding embeddings and other non-chat models
                    models = data.data
                        .filter(model => {
                            const id = model.id.toLowerCase();
                            return (id.includes('gpt') || id.includes('o1') || id.includes('chatgpt')) &&
                                   !id.includes('embedding') &&
                                   !id.includes('whisper') &&
                                   !id.includes('tts') &&
                                   !id.includes('dall-e') &&
                                   !id.includes('davinci') &&
                                   !id.includes('babbage') &&
                                   !id.includes('ada') &&
                                   !id.includes('curie');
                        })
                        .map(model => model.id)
                        .sort((a, b) => {
                            // Sort with newest/best models first
                            const order = ['o1', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5'];
                            const aIndex = order.findIndex(prefix => a.startsWith(prefix));
                            const bIndex = order.findIndex(prefix => b.startsWith(prefix));
                            if (aIndex !== -1 && bIndex !== -1) {
                                return aIndex - bIndex;
                            }
                            return a.localeCompare(b);
                        });
                    
                    // Store fetched models
                    provider.models = models;
                    console.log(`Fetched ${models.length} OpenAI models:`, models);
                } else if (response.status === 401) {
                    throw new Error('Invalid OpenAI API key. Please check your API key.');
                } else if (response.status === 403) {
                    throw new Error('Access forbidden. Your API key may not have the required permissions.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                } else {
                    throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
                }
            } else if (this.currentProvider === 'claude') {
                // Anthropic doesn't have a models endpoint, use defaults
                // But we can validate the API key with a test request
                try {
                    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    const apiUrl = isLocalhost ? `${provider.baseUrl}/messages` : '/api/proxy/anthropic';
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'x-api-key': this.apiKey,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: 'claude-3-haiku-20240307',
                            messages: [{role: 'user', content: 'test'}],
                            max_tokens: 1
                        })
                    });
                    
                    // If we get a 401, the API key is invalid
                    if (response.status === 401) {
                        throw new Error('Invalid Claude API key. Please check your API key.');
                    } else if (response.status === 403) {
                        throw new Error('Access forbidden. Your API key may not have the required permissions.');
                    } else if (response.status === 429) {
                        throw new Error('Rate limit exceeded. Please try again later.');
                    }
                    
                    // API key is valid, fetch available Claude models
                    models = await this.fetchClaudeModels();
                    provider.models = models;
                    console.log(`Fetched ${models.length} Claude models:`, models);
                } catch (error) {
                    // Re-throw authentication errors only if we got a response
                    if (error.message && (error.message.includes('Invalid') || error.message.includes('forbidden') || error.message.includes('Rate limit'))) {
                        throw error;
                    }
                    // For network/CORS/CSP errors, we can't validate but we'll allow usage
                    console.warn('Could not validate API key due to network restrictions:', error);
                    // Try to fetch models anyway
                    models = await this.fetchClaudeModels();
                    provider.models = models;
                    
                    // Show a warning but allow model selection
                    this.showNotification('API key validation skipped due to security restrictions. The key will be used when sending messages.', 'warning');
                }
            }
            
            // Populate model dropdown
            modelSelect.innerHTML = '<option value="">Select a model</option>' + 
                models.map(model => `<option value="${model}">${model}</option>`).join('');
            modelSelect.disabled = false;
            
            // If a model was previously selected and is still available, select it
            if (this.selectedModel && models.includes(this.selectedModel)) {
                modelSelect.value = this.selectedModel;
            } else if (models.length > 0) {
                // Auto-select the first model if none was previously selected
                modelSelect.value = models[0];
                this.selectedModel = models[0];
            }
            
            // Save settings after model selection
            this.saveSettings();
            
            // Check if we're ready to chat after setting the model
            this.checkReadyToChat();
            
            // Show success notification
            this.showNotification('API key validated successfully', 'success');
            
            // Restore API key input state
            apiKeyInput.placeholder = originalPlaceholder;
            apiKeyInput.style.borderColor = 'var(--success)';
            setTimeout(() => {
                apiKeyInput.style.borderColor = '';
            }, 2000);
            
        } catch (error) {
            console.error('Error fetching models:', error);
            
            // Check if it's a CSP/network error that we should handle gracefully
            const isNetworkError = error.name === 'TypeError' && error.message.includes('Failed to fetch');
            const isCSPError = error.message && error.message.includes('Content Security Policy');
            
            if (isNetworkError || isCSPError) {
                // For network/CSP errors, use fallback models
                models = provider.fallbackModels;
                provider.models = models;
                
                modelSelect.innerHTML = '<option value="">Select a model</option>' + 
                    models.map(model => `<option value="${model}">${model}</option>`).join('');
                modelSelect.disabled = false;
                
                // If a model was previously selected and is still available, select it
                if (this.selectedModel && models.includes(this.selectedModel)) {
                    modelSelect.value = this.selectedModel;
                } else if (models.length > 0) {
                    // Auto-select the first model if none was previously selected
                    modelSelect.value = models[0];
                    this.selectedModel = models[0];
                }
                
                // Save settings after model selection
                this.saveSettings();
                
                // Check if we're ready to chat after setting the model
                this.checkReadyToChat();
                
                // Don't show error for CSP issues, just a warning
                console.warn('Using default models due to network restrictions');
                
                // Restore API key input state
                apiKeyInput.placeholder = originalPlaceholder;
                apiKeyInput.style.borderColor = 'var(--warning)';
                setTimeout(() => {
                    apiKeyInput.style.borderColor = '';
                }, 2000);
            } else {
                // For actual API errors, show error message
                modelSelect.innerHTML = '<option value="">No models available</option>';
                modelSelect.disabled = true;
                provider.models = [];
                
                // Show specific error message
                this.showNotification(error.message || 'Failed to validate API key', 'error');
                
                // Clear selected model
                this.selectedModel = null;
                
                // Restore API key input state with error indication
                apiKeyInput.placeholder = originalPlaceholder;
                apiKeyInput.style.borderColor = 'var(--error)';
                setTimeout(() => {
                    apiKeyInput.style.borderColor = '';
                }, 3000);
            }
        }
    }

    async fetchClaudeModels() {
        // Current production Claude models as of 2025
        // We'll use a comprehensive list but also attempt to query for any newer models
        const knownModels = [
            // Claude Opus 4
            'claude-opus-4-20250514',
            'claude-opus-4-0',
            // Claude Sonnet 4
            'claude-sonnet-4-20250514',
            'claude-sonnet-4-0',
            // Claude Sonnet 3.7
            'claude-3-7-sonnet-20250219',
            'claude-3-7-sonnet-latest',
            // Claude Sonnet 3.5
            'claude-3-5-sonnet-20241022',
            'claude-3-5-sonnet-latest',
            // Claude Haiku 3.5
            'claude-3-5-haiku-20241022',
            'claude-3-5-haiku-latest',
            // Legacy models (may still be available)
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
        
        try {
            // Anthropic doesn't have a models endpoint, but we can try to detect available models
            // by making a test request with a known model and checking the response
            const testModel = 'claude-3-5-sonnet-20241022';
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isLocalhost ? 'https://api.anthropic.com/v1/messages' : '/api/proxy/anthropic';
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: testModel,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 1
                })
            });
            
            // If we get a successful response or a rate limit, the API is working
            if (response.ok || response.status === 429) {
                // Return all known models sorted with newest first
                return knownModels.filter((model, index, self) => 
                    self.indexOf(model) === index // Remove duplicates
                );
            } else if (response.status === 400) {
                // Bad request might indicate model not available
                // Fall back to basic models
                return this.providers.claude.fallbackModels;
            }
        } catch (error) {
            console.warn('Could not verify Claude models:', error);
        }
        
        // Return comprehensive list by default
        return knownModels;
    }

    checkReadyToChat() {
        const chatSection = document.getElementById('ai-chat-section');
        const sendBtn = document.getElementById('ai-send');
        
        if (this.currentProvider && this.apiKey && this.selectedModel) {
            if (chatSection) {
                chatSection.classList.remove('hidden');
                // Force a style recalculation in case there's a rendering issue
                chatSection.style.display = 'block';
                setTimeout(() => {
                    chatSection.style.display = '';
                    // Scroll the chat section into view
                    const container = document.querySelector('.ai-assistant-container');
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                    // Or try scrolling to the chat section directly
                    chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
            this.enableSendButton();
        } else {
            if (chatSection) {
                chatSection.classList.add('hidden');
            }
            if (sendBtn) {
                sendBtn.disabled = true;
            }
        }
    }

    enableSendButton() {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        sendBtn.disabled = !input.value.trim();
    }

    showAssistant() {
        const modal = document.getElementById('ai-assistant-modal');
        if (!modal) {
            console.error('AI Assistant modal not found');
            return;
        }
        
        // Ensure modal is visible
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        
        // Ensure modal is on top by setting a high z-index
        modal.style.zIndex = '10000';
        
        // Force focus on the modal to ensure it's on top
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
        // Update MCP status when showing the assistant
        this.updateMCPStatus();
        
        // Restore previous selection if any
        if (this.currentProvider) {
            this.selectProvider(this.currentProvider);
            if (this.selectedModel) {
                document.getElementById('ai-model').value = this.selectedModel;
            }
            
            // Restore API key from session storage
            const apiKeys = JSON.parse(sessionStorage.getItem('ai-assistant-keys') || '{}');
            if (apiKeys[this.currentProvider]) {
                const apiKeyInput = document.getElementById('ai-api-key');
                if (apiKeyInput) {
                    apiKeyInput.value = apiKeys[this.currentProvider];
                    this.apiKey = apiKeys[this.currentProvider];
                    // Trigger model loading
                    this.fetchAvailableModels();
                }
            }
        }
    }

    hideAssistant() {
        const modal = document.getElementById('ai-assistant-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
            // Reset z-index
            modal.style.zIndex = '';
        }
    }

    async sendMessage() {
        const input = document.getElementById('ai-input');
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';
        this.enableSendButton();

        // Show thinking indicator
        const thinkingId = this.addThinkingIndicator();

        try {
            const response = await this.callAI(message);
            this.removeThinkingIndicator(thinkingId);
            
            // Process response
            this.processAIResponse(response);
        } catch (error) {
            this.removeThinkingIndicator(thinkingId);
            
            // Check if it's a CSP error
            if (error.message && (error.message.includes('Content Security Policy') || error.message.includes('Refused to connect'))) {
                this.addMessage('assistant', `I'm unable to connect to the AI service due to security restrictions on this domain. 

To use the AI assistant, you have a few options:
1. Run this application locally on your computer
2. Deploy it to a server with appropriate CORS/CSP headers
3. Use a proxy server to handle the API requests

The application is currently restricted to only connect to 'self' and 'api.buildkite.com'.`, true);
            } else {
                this.addMessage('assistant', 'Sorry, I encountered an error: ' + error.message, true);
            }
        }
    }

    async callAI(message) {
        const provider = this.providers[this.currentProvider];
        
        if (this.currentProvider === 'claude') {
            return this.callClaude(message);
        } else if (this.currentProvider === 'chatgpt') {
            return this.callChatGPT(message);
        }
    }

    async callClaude(message) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.selectedModel,
                messages: [
                    { role: 'user', content: this.systemPrompt + '\n\nUser: ' + message }
                ],
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            let errorMessage = 'Claude API error';
            try {
                const error = await response.json();
                if (response.status === 401) {
                    errorMessage = 'Invalid API key. Please check your Claude API key.';
                } else if (response.status === 403) {
                    errorMessage = 'Access forbidden. Your API key may not have the required permissions.';
                } else if (response.status === 429) {
                    errorMessage = 'Rate limit exceeded. Please try again later.';
                } else if (error.error?.message) {
                    errorMessage = error.error.message;
                }
            } catch (e) {
                errorMessage = `API error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async callChatGPT(message) {
        const messages = [
            { role: 'system', content: this.systemPrompt },
            ...this.conversationHistory.slice(-10), // Last 10 messages for context
            { role: 'user', content: message }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.selectedModel,
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            let errorMessage = 'OpenAI API error';
            try {
                const error = await response.json();
                if (response.status === 401) {
                    errorMessage = 'Invalid API key. Please check your OpenAI API key.';
                } else if (response.status === 403) {
                    errorMessage = 'Access forbidden. Your API key may not have the required permissions.';
                } else if (response.status === 429) {
                    errorMessage = 'Rate limit exceeded. Please try again later.';
                } else if (error.error?.message) {
                    errorMessage = error.error.message;
                }
            } catch (e) {
                errorMessage = `API error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    processAIResponse(response) {
        console.log('🤖 Processing AI response:', response);
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);
            console.log('✅ Successfully parsed JSON:', parsed);
            
            if (parsed.action === 'create_pipeline' && parsed.steps) {
                console.log('🏗️ Detected create_pipeline action with steps:', parsed.steps);
                this.handlePipelineCreation(parsed.steps, 'Here\'s the pipeline I created for you:');
            } else if (parsed.action === 'mcp_tool' && parsed.tool) {
                this.handleMCPToolCall(parsed.tool, parsed.parameters || {});
            } else {
                // Regular response
                this.addMessage('assistant', response);
            }
        } catch (e) {
            console.log('⚠️ Failed to parse as JSON, checking for JSON blocks in text');
            // Not JSON, treat as regular text
            // Check for JSON blocks with or without language identifier
            const jsonMatches = [
                response.match(/```json\n?([\s\S]+?)\n?```/),
                response.match(/```\n?([\s\S]+?)\n?```/),
                response.match(/\{\s*"action"\s*:\s*"create_pipeline"[\s\S]+?\}(?=\s*\n|$)/),
                response.match(/\{\s*"action"\s*:\s*"mcp_tool"[\s\S]+?\}(?=\s*\n|$)/),
                // Add more flexible pattern to catch multi-line JSON blocks
                response.match(/(\{\s*"action"\s*:\s*"create_pipeline"[\s\S]+?\n\})/),
                // Pattern to catch JSON that might have trailing text
                response.match(/(\{\s*"action"\s*:\s*"create_pipeline"[\s\S]+?\]\s*\})/m),
                // Pattern for compact single-line JSON
                response.match(/(\{ "action": "create_pipeline", "steps": \[[\s\S]+?\] \})/),
                // More flexible pattern for any JSON object starting with { and ending with }
                response.match(/(\{[^{}]*"action"[^{}]*:[^{}]*"create_pipeline"[^{}]*"steps"[^{}]*:\s*\[[^\]]+\][^{}]*\})/s)
            ];
            
            let jsonFound = false;
            
            // First, try to find a clean JSON object in the response
            const jsonStart = response.indexOf('{ "action": "create_pipeline"');
            if (jsonStart !== -1) {
                console.log('🔍 Found JSON start at position:', jsonStart);
                // Find the matching closing brace
                let braceCount = 0;
                let jsonEnd = -1;
                for (let i = jsonStart; i < response.length; i++) {
                    if (response[i] === '{') braceCount++;
                    if (response[i] === '}') braceCount--;
                    if (braceCount === 0) {
                        jsonEnd = i + 1;
                        break;
                    }
                }
                
                if (jsonEnd !== -1) {
                    const jsonStr = response.substring(jsonStart, jsonEnd);
                    console.log('🔍 Extracted JSON:', jsonStr);
                    try {
                        const parsed = JSON.parse(jsonStr);
                        if (parsed.action === 'create_pipeline' && parsed.steps) {
                            console.log('🎯 Successfully parsed pipeline JSON:', parsed);
                            
                            const textBefore = response.substring(0, jsonStart).trim();
                            const textAfter = response.substring(jsonEnd).trim();
                            
                            if (textBefore) {
                                this.addMessage('assistant', textBefore);
                            }
                            
                            this.handlePipelineCreation(parsed.steps, 'Here\'s the pipeline configuration:');
                            
                            if (textAfter) {
                                this.addMessage('assistant', textAfter);
                            }
                            
                            jsonFound = true;
                        }
                    } catch (e) {
                        console.error('❌ Failed to parse extracted JSON:', e);
                    }
                }
            }
            
            // If no JSON found with the new method, try the regex patterns
            if (!jsonFound) {
                for (const match of jsonMatches) {
                    if (match) {
                        console.log('🔍 Found potential JSON match with regex:', match);
                        try {
                            const jsonStr = match[1] || match[0];
                            console.log('🔍 Attempting to parse JSON string:', jsonStr);
                            const parsed = JSON.parse(jsonStr);
                        
                            if (parsed.action === 'create_pipeline' && parsed.steps) {
                                console.log('🎯 Found create_pipeline JSON in text:', parsed);
                                const jsonStartIndex = response.indexOf(match[0]);
                                const textBefore = response.substring(0, jsonStartIndex);
                                const textAfter = response.substring(jsonStartIndex + match[0].length);
                                
                                // Process the text before JSON
                                if (textBefore.trim()) {
                                    this.addMessage('assistant', textBefore.trim());
                                }
                                
                                // Handle the pipeline creation
                                this.handlePipelineCreation(parsed.steps, 'Here\'s the pipeline configuration:');
                                
                                // Process the text after JSON
                                if (textAfter.trim()) {
                                    this.addMessage('assistant', textAfter.trim());
                                }
                                
                                jsonFound = true;
                                break;
                            } else if (parsed.action === 'mcp_tool' && parsed.tool) {
                                this.handleMCPToolCall(parsed.tool, parsed.parameters || {});
                                jsonFound = true;
                                break;
                            }
                        } catch (e2) {
                            console.debug('Failed to parse potential JSON:', e2);
                        }
                    }
                }
            }
            
            // If no JSON action found, treat as regular message
            if (!jsonFound) {
                this.addMessage('assistant', response);
            }
        }
    }

    handlePipelineCreation(steps, message, additionalText = '') {
        console.log('📋 handlePipelineCreation called with:', { steps, message });
        // Directly apply the pipeline steps to the middle window
        this.applyPipeline(steps, false); // Don't clear existing by default
        
        // Add a simple confirmation message
        const messageEl = this.addMessage('assistant', message || `I've added ${steps.length} steps to your pipeline.`);
        const content = messageEl.querySelector('.message-content');
        
        // Add a brief summary of what was added
        const summary = document.createElement('div');
        summary.className = 'pipeline-summary';
        summary.innerHTML = `
            <p>Added steps:</p>
            <ul class="steps-added">
                ${steps.map((step, index) => {
                    const label = step.properties?.label || `Step ${index + 1}`;
                    const type = step.type || 'command';
                    return `<li>${this.getStepIcon(type)} ${label}</li>`;
                }).join('')}
            </ul>
        `;
        content.appendChild(summary);
        
        // Add action buttons for additional control
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        
        actions.innerHTML = `
            <button class="btn btn-secondary btn-sm" data-action="clear-pipeline">
                <i class="fas fa-trash"></i> Clear Pipeline
            </button>
            <button class="btn btn-secondary btn-sm" data-action="undo-steps" data-steps-count="${steps.length}">
                <i class="fas fa-undo"></i> Undo Last
            </button>
        `;
        
        // Event listeners are handled by event delegation in setupEventListeners()
        
        content.appendChild(actions);
        
        if (additionalText) {
            const additional = document.createElement('div');
            additional.className = 'additional-info';
            additional.innerHTML = this.formatMessage(additionalText);
            content.appendChild(additional);
        }
    }
    
    getStepIcon(type) {
        const icons = {
            'command': '⚡',
            'wait': '⏸️',
            'block': '🔲',
            'input': '✏️',
            'trigger': '🔗',
            'group': '📁'
        };
        return icons[type] || '📄';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    applyPipeline(steps, clearExisting = true) {
        console.log('🔧 applyPipeline called with:', { steps, clearExisting });
        console.log('🔍 window.pipelineBuilder:', window.pipelineBuilder);
        
        if (!window.pipelineBuilder) {
            console.error('❌ Pipeline builder not available!');
            this.showNotification('Pipeline builder not available', 'error');
            return;
        }

        // Clear existing pipeline if requested
        if (clearExisting) {
            window.pipelineBuilder.clearPipeline();
        }
        
        // Add new steps directly to the pipeline
        steps.forEach((step, index) => {
            console.log(`➕ Adding step ${index + 1}:`, step);
            const stepType = step.type || 'command';
            const newStep = window.pipelineBuilder.addStep(stepType);
            console.log(`✅ Created step:`, newStep);
            
            if (newStep && step.properties) {
                console.log('📝 Merging properties:', step.properties);
                // Merge properties into the new step
                Object.assign(newStep.properties, step.properties);
                console.log('📝 Step after merge:', newStep);
            }
        });
        
        // Update UI
        window.pipelineBuilder.renderPipeline();
        if (window.pipelineBuilder.steps.length > 0) {
            window.pipelineBuilder.selectStep(window.pipelineBuilder.steps[0]);
        }
        
        // Save to localStorage
        window.pipelineBuilder.saveToLocalStorage();
        
        this.showNotification(`${steps.length} steps added to pipeline!`, 'success');
    }

    appendPipeline(steps) {
        if (!window.pipelineBuilder) {
            this.showNotification('Pipeline builder not available', 'error');
            return;
        }

        // Add new steps to existing pipeline
        steps.forEach(step => {
            const newStep = window.pipelineBuilder.addStep(step.type);
            if (newStep && step.properties) {
                Object.assign(newStep.properties, step.properties);
            }
        });
        
        // Update UI
        window.pipelineBuilder.renderPipeline();
        
        this.showNotification('Steps added to pipeline!', 'success');
    }

    addMessage(type, content, isError = false) {
        const messagesContainer = document.getElementById('ai-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `ai-message ai-message-${type}`;
        
        const icon = type === 'user' ? 'fa-user' : 'fa-magic';
        
        // Format content if it's from assistant
        const formattedContent = type === 'assistant' && !isError ? this.formatMessage(content) : content;
        
        messageEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="message-content">
                ${isError ? `<div class="ai-error">${content}</div>` : formattedContent}
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add to history
        this.conversationHistory.push({ role: type, content });
        
        return messageEl;
    }
    
    formatMessage(content) {
        // Escape HTML first
        let formatted = content.replace(/&/g, '&amp;')
                             .replace(/</g, '&lt;')
                             .replace(/>/g, '&gt;');
        
        // Format code blocks with syntax highlighting
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
        });
        
        // Format inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Format bold text
        formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Format italic text
        formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Format numbered lists
        formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ol>$&</ol>');
        
        // Format bullet lists
        formatted = formatted.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
            // Only wrap in <ul> if not already in <ol>
            if (!match.includes('<ol>')) {
                return '<ul>' + match + '</ul>';
            }
            return match;
        });
        
        // Format paragraphs
        formatted = formatted.replace(/\n\n/g, '</p><p>');
        formatted = '<p>' + formatted + '</p>';
        
        // Clean up empty paragraphs
        formatted = formatted.replace(/<p>\s*<\/p>/g, '');
        formatted = formatted.replace(/<p>(<pre>|<ul>|<ol>)/g, '$1');
        formatted = formatted.replace(/(<\/pre>|<\/ul>|<\/ol>)<\/p>/g, '$1');
        
        return formatted;
    }

    addThinkingIndicator() {
        const messagesContainer = document.getElementById('ai-messages');
        const thinkingEl = document.createElement('div');
        const id = 'thinking-' + Date.now();
        thinkingEl.id = id;
        thinkingEl.className = 'ai-message ai-message-assistant';
        
        thinkingEl.innerHTML = `
            <i class="fas fa-magic"></i>
            <div class="message-content ai-thinking">
                <i class="fas fa-spinner"></i>
                Thinking...
            </div>
        `;
        
        messagesContainer.appendChild(thinkingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return id;
    }

    removeThinkingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    showNotification(message, type = 'info') {
        if (window.mainInitializer?.showToast) {
            window.mainInitializer.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    updateMCPStatus() {
        // Get fresh reference to mcpClient
        const mcpClient = window.mcpClient;
        
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (statusDot && statusText) {
            if (mcpClient && mcpClient.isConnected) {
                statusDot.classList.add('connected');
                statusText.textContent = 'Connected';
                this.useMCP = true;
                
                // Update system prompt with available tools
                if (mcpClient.availableTools) {
                    const toolsList = mcpClient.getToolsForAI()
                        .map(tool => `- ${tool.name}: ${tool.description}`)
                        .join('\n');
                    
                    this.currentSystemPrompt = this.mcpSystemPrompt.replace('{tools}', toolsList);
                }
            } else {
                statusDot.classList.remove('connected');
                statusText.textContent = 'Not connected';
                this.useMCP = false;
                this.currentSystemPrompt = this.systemPrompt;
            }
        }
    }
    
    async handleMCPToolCall(toolName, parameters) {
        // Get fresh reference to mcpClient
        const mcpClient = window.mcpClient;
        if (!mcpClient || !mcpClient.isConnected) {
            throw new Error('MCP client is not connected');
        }
        
        // Show thinking indicator
        const thinkingId = this.addThinkingIndicator();
        
        try {
            const result = await mcpClient.callTool(toolName, parameters);
            this.removeThinkingIndicator(thinkingId);
            
            if (result.success) {
                // Format the result nicely
                const formattedResult = this.formatMCPResult(toolName, result.data);
                this.addMessage('assistant', formattedResult);
            } else {
                this.addMessage('assistant', `Error calling ${toolName}: ${result.error}`, true);
            }
        } catch (error) {
            this.removeThinkingIndicator(thinkingId);
            this.addMessage('assistant', `Error: ${error.message}`, true);
        }
    }
    
    formatMCPResult(toolName, data) {
        // Format the MCP tool result based on the tool type
        switch (toolName) {
            case 'list_pipelines':
                return this.formatPipelinesList(data);
            case 'get_pipeline':
                return this.formatPipelineDetails(data);
            case 'list_builds':
                return this.formatBuildsList(data);
            case 'get_build':
                return this.formatBuildDetails(data);
            default:
                return `Result from ${toolName}:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        }
    }
    
    formatPipelinesList(data) {
        if (!data.pipelines || data.pipelines.length === 0) {
            return 'No pipelines found.';
        }
        
        let message = `Found ${data.pipelines.length} pipeline${data.pipelines.length > 1 ? 's' : ''}:\n\n`;
        
        data.pipelines.forEach(pipeline => {
            message += `**${pipeline.name}**\n`;
            message += `- Slug: \`${pipeline.slug}\`\n`;
            message += `- Repository: ${pipeline.repository}\n`;
            if (pipeline.description) {
                message += `- Description: ${pipeline.description}\n`;
            }
            message += '\n';
        });
        
        return message;
    }
    
    formatPipelineDetails(data) {
        const pipeline = data.pipeline;
        if (!pipeline) return 'Pipeline not found.';
        
        let message = `**${pipeline.name}**\n\n`;
        message += `- Slug: \`${pipeline.slug}\`\n`;
        message += `- Repository: ${pipeline.repository}\n`;
        message += `- Default Branch: ${pipeline.default_branch || 'main'}\n`;
        
        if (pipeline.description) {
            message += `- Description: ${pipeline.description}\n`;
        }
        
        if (pipeline.configuration) {
            message += `\n**Configuration:**\n\`\`\`yaml\n${pipeline.configuration}\n\`\`\``;
        }
        
        return message;
    }
    
    formatBuildsList(data) {
        if (!data.builds || data.builds.length === 0) {
            return 'No builds found.';
        }
        
        let message = `Found ${data.builds.length} build${data.builds.length > 1 ? 's' : ''}:\n\n`;
        
        data.builds.forEach(build => {
            const status = build.state.toUpperCase();
            const statusIcon = build.state === 'passed' ? '✅' : 
                             build.state === 'failed' ? '❌' : 
                             build.state === 'running' ? '🔄' : '⏸️';
            
            message += `${statusIcon} **Build #${build.number}** - ${status}\n`;
            message += `- Branch: \`${build.branch}\`\n`;
            message += `- Commit: \`${build.commit.substring(0, 7)}\`\n`;
            message += `- Message: ${build.message}\n`;
            message += `- Created: ${new Date(build.created_at).toLocaleString()}\n`;
            message += '\n';
        });
        
        return message;
    }
    
    formatBuildDetails(data) {
        const build = data.build;
        if (!build) return 'Build not found.';
        
        const statusIcon = build.state === 'passed' ? '✅' : 
                         build.state === 'failed' ? '❌' : 
                         build.state === 'running' ? '🔄' : '⏸️';
        
        let message = `${statusIcon} **Build #${build.number}** - ${build.state.toUpperCase()}\n\n`;
        message += `- Branch: \`${build.branch}\`\n`;
        message += `- Commit: \`${build.commit}\`\n`;
        message += `- Message: ${build.message}\n`;
        message += `- Author: ${build.creator.name}\n`;
        message += `- Created: ${new Date(build.created_at).toLocaleString()}\n`;
        
        if (build.started_at) {
            message += `- Started: ${new Date(build.started_at).toLocaleString()}\n`;
        }
        
        if (build.finished_at) {
            message += `- Finished: ${new Date(build.finished_at).toLocaleString()}\n`;
            const duration = (new Date(build.finished_at) - new Date(build.started_at)) / 1000;
            message += `- Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s\n`;
        }
        
        if (build.jobs && build.jobs.length > 0) {
            message += `\n**Jobs:**\n`;
            build.jobs.forEach(job => {
                const jobIcon = job.state === 'passed' ? '✅' : 
                               job.state === 'failed' ? '❌' : 
                               job.state === 'running' ? '🔄' : '⏸️';
                message += `${jobIcon} ${job.name || job.id}\n`;
            });
        }
        
        return message;
    }
    
    // Override the callAI method to use appropriate system prompt
    async callAI(message) {
        const provider = this.providers[this.currentProvider];
        const systemPrompt = this.useMCP && this.currentSystemPrompt ? 
                           this.currentSystemPrompt : this.systemPrompt;
        
        if (this.currentProvider === 'claude') {
            return this.callClaudeWithPrompt(message, systemPrompt);
        } else if (this.currentProvider === 'chatgpt') {
            return this.callChatGPTWithPrompt(message, systemPrompt);
        }
    }
    
    async callClaudeWithPrompt(message, systemPrompt) {
        // Use proxy if not on localhost
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = isLocalhost ? 'https://api.anthropic.com/v1/messages' : '/api/proxy/anthropic';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.selectedModel,
                messages: [
                    { role: 'user', content: systemPrompt + '\n\nUser: ' + message }
                ],
                max_tokens: 4096
            })
        });

        if (!response.ok) {
            let errorMessage = 'Claude API error';
            try {
                const error = await response.json();
                if (response.status === 401) {
                    errorMessage = 'Invalid API key. Please check your Claude API key.';
                } else if (response.status === 403) {
                    errorMessage = 'Access forbidden. Your API key may not have the required permissions.';
                } else if (response.status === 429) {
                    errorMessage = 'Rate limit exceeded. Please try again later.';
                } else if (error.error?.message) {
                    errorMessage = error.error.message;
                }
            } catch (e) {
                errorMessage = `API error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.content[0].text;
    }
    
    async callChatGPTWithPrompt(message, systemPrompt) {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory.slice(-10), // Last 10 messages for context
            { role: 'user', content: message }
        ];

        // Use proxy if not on localhost
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = isLocalhost ? 'https://api.openai.com/v1/chat/completions' : '/api/proxy/openai/chat/completions';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.selectedModel,
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            let errorMessage = 'OpenAI API error';
            try {
                const error = await response.json();
                if (response.status === 401) {
                    errorMessage = 'Invalid API key. Please check your OpenAI API key.';
                } else if (response.status === 403) {
                    errorMessage = 'Access forbidden. Your API key may not have the required permissions.';
                } else if (response.status === 429) {
                    errorMessage = 'Rate limit exceeded. Please try again later.';
                } else if (error.error?.message) {
                    errorMessage = error.error.message;
                }
            } catch (e) {
                errorMessage = `API error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}

// Initialize
if (typeof window !== 'undefined') {
    window.AIAssistant = AIAssistant;
    window.aiAssistant = new AIAssistant();
}