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
                models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
            },
            chatgpt: {
                name: 'ChatGPT',
                icon: 'fa-brain',
                requiresAuth: true,
                authType: 'api-key',
                baseUrl: 'https://api.openai.com/v1',
                models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo']
            }
        };

        this.currentProvider = null;
        this.apiKey = null;
        this.selectedModel = null;
        this.conversationHistory = [];
        
        this.systemPrompt = `You are a Buildkite pipeline expert assistant. Your role is to help users create, modify, and optimize Buildkite pipelines.

When users ask you to create pipelines, respond with a JSON object that represents the pipeline steps. The format should be:

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

Available step types: command, wait, block, input, trigger, group

For command steps, you can include properties like:
- label, command, key, depends_on, env, agents, artifact_paths, timeout_in_minutes, retry, soft_fail, parallelism, matrix, plugins

For other requests that don't involve creating a pipeline, respond normally with helpful information about Buildkite.`;

        this.init();
    }

    init() {
        this.loadSettings();
        this.createUI();
    }

    loadSettings() {
        const settings = localStorage.getItem('ai-assistant-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.currentProvider = parsed.provider;
            this.selectedModel = parsed.model;
            // Don't load API key for security
        }
    }

    saveSettings() {
        localStorage.setItem('ai-assistant-settings', JSON.stringify({
            provider: this.currentProvider,
            model: this.selectedModel
        }));
    }

    createUI() {
        // Create AI Assistant button
        const actionsContainer = document.querySelector('.header-actions');
        if (actionsContainer && !document.getElementById('ai-assistant-button')) {
            const aiBtn = document.createElement('button');
            aiBtn.id = 'ai-assistant-button';
            aiBtn.className = 'action-btn';
            aiBtn.innerHTML = '<i class="fas fa-magic"></i> AI Assistant';
            aiBtn.onclick = () => this.showAssistant();
            
            actionsContainer.appendChild(aiBtn);
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
                                
                                <label>Model:</label>
                                <select id="ai-model" class="form-control">
                                    <option value="">Select a model</option>
                                </select>
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
                .ai-assistant-container {
                    display: flex;
                    flex-direction: column;
                    height: 600px;
                }

                .ai-settings {
                    padding: 1rem;
                    background: var(--bg-secondary);
                    border-bottom: 1px solid var(--border-color);
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
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
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
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .ai-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
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
        // Provider selection
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
                    modal.classList.add('hidden');
                }
            }
        });

        // API key input
        const apiKeyInput = document.getElementById('ai-api-key');
        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => {
                this.apiKey = apiKeyInput.value;
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
        
        // Populate models
        const modelSelect = document.getElementById('ai-model');
        const models = this.providers[provider].models;
        modelSelect.innerHTML = '<option value="">Select a model</option>' + 
            models.map(model => `<option value="${model}">${model}</option>`).join('');
        
        // Clear API key for security
        document.getElementById('ai-api-key').value = '';
        this.apiKey = null;
        
        this.saveSettings();
        this.checkReadyToChat();
    }

    checkReadyToChat() {
        const chatSection = document.getElementById('ai-chat-section');
        const sendBtn = document.getElementById('ai-send');
        
        if (this.currentProvider && this.apiKey && this.selectedModel) {
            chatSection.classList.remove('hidden');
            this.enableSendButton();
        } else {
            chatSection.classList.add('hidden');
            sendBtn.disabled = true;
        }
    }

    enableSendButton() {
        const input = document.getElementById('ai-input');
        const sendBtn = document.getElementById('ai-send');
        sendBtn.disabled = !input.value.trim();
    }

    showAssistant() {
        const modal = document.getElementById('ai-assistant-modal');
        modal.classList.remove('hidden');
        
        // Restore previous selection if any
        if (this.currentProvider) {
            this.selectProvider(this.currentProvider);
            if (this.selectedModel) {
                document.getElementById('ai-model').value = this.selectedModel;
            }
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
            this.addMessage('assistant', 'Sorry, I encountered an error: ' + error.message, true);
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
            const error = await response.json();
            throw new Error(error.error?.message || 'Claude API error');
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
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    processAIResponse(response) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);
            
            if (parsed.action === 'create_pipeline' && parsed.steps) {
                this.handlePipelineCreation(parsed.steps, response);
            } else {
                // Regular response
                this.addMessage('assistant', response);
            }
        } catch (e) {
            // Not JSON, treat as regular text
            // But check if it contains a JSON block
            const jsonMatch = response.match(/```json\n?([\s\S]+?)\n?```/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[1]);
                    if (parsed.action === 'create_pipeline' && parsed.steps) {
                        const textBefore = response.substring(0, jsonMatch.index);
                        const textAfter = response.substring(jsonMatch.index + jsonMatch[0].length);
                        
                        let fullMessage = '';
                        if (textBefore.trim()) fullMessage += textBefore.trim() + '\n\n';
                        fullMessage += 'Here\'s the pipeline I created for you:';
                        
                        this.handlePipelineCreation(parsed.steps, fullMessage, textAfter.trim());
                        return;
                    }
                } catch (e2) {
                    // Failed to parse embedded JSON
                }
            }
            
            // Regular message
            this.addMessage('assistant', response);
        }
    }

    handlePipelineCreation(steps, message, additionalText = '') {
        const messageEl = this.addMessage('assistant', message);
        
        // Add pipeline preview
        const preview = document.createElement('div');
        preview.className = 'message-pipeline';
        preview.textContent = JSON.stringify({ steps }, null, 2);
        messageEl.querySelector('.message-content').appendChild(preview);
        
        // Add action buttons
        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.innerHTML = `
            <button class="btn btn-primary btn-sm" onclick="window.aiAssistant.applyPipeline(${JSON.stringify(steps).replace(/"/g, '&quot;')})">
                <i class="fas fa-plus"></i> Apply Pipeline
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.aiAssistant.appendPipeline(${JSON.stringify(steps).replace(/"/g, '&quot;')})">
                <i class="fas fa-plus-circle"></i> Append to Current
            </button>
        `;
        messageEl.querySelector('.message-content').appendChild(actions);
        
        if (additionalText) {
            const additional = document.createElement('p');
            additional.style.marginTop = '1rem';
            additional.textContent = additionalText;
            messageEl.querySelector('.message-content').appendChild(additional);
        }
    }

    applyPipeline(steps) {
        if (!window.pipelineBuilder) {
            this.showNotification('Pipeline builder not available', 'error');
            return;
        }

        // Clear existing pipeline
        window.pipelineBuilder.clearPipeline();
        
        // Add new steps
        steps.forEach(step => {
            const newStep = window.pipelineBuilder.addStep(step.type);
            if (newStep && step.properties) {
                Object.assign(newStep.properties, step.properties);
            }
        });
        
        // Update UI
        window.pipelineBuilder.renderPipeline();
        if (window.pipelineBuilder.steps.length > 0) {
            window.pipelineBuilder.selectStep(window.pipelineBuilder.steps[0]);
        }
        
        this.showNotification('Pipeline applied successfully!', 'success');
        
        // Close modal
        document.getElementById('ai-assistant-modal').classList.add('hidden');
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
        
        messageEl.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="message-content">
                ${isError ? `<div class="ai-error">${content}</div>` : content}
            </div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Add to history
        this.conversationHistory.push({ role: type, content });
        
        return messageEl;
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
}

// Initialize
if (typeof window !== 'undefined') {
    window.AIAssistant = AIAssistant;
    window.aiAssistant = new AIAssistant();
}