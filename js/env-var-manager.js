// js/env-var-manager.js
// Environment Variable Manager for Buildkite Pipeline Builder

class EnvVarManager {
    constructor() {
        // Singleton pattern to prevent duplicate instances
        if (window.envVarManager) {
            console.warn('⚠️ EnvVarManager already exists, returning existing instance');
            return window.envVarManager;
        }
        this.globalVars = {};
        this.secrets = {};
        this.currentStepId = null;
        this.pipelineBuilder = null;
        
        // Store as singleton
        window.envVarManager = this;
        
        this.init();
    }

    init() {
        console.log('🔑 Initializing Environment Variable Manager...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
        
        // Load saved variables
        this.loadFromLocalStorage();
        
        console.log('✅ Environment Variable Manager initialized');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.env-vars-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add variable buttons
        const addGlobalBtn = document.getElementById('add-global-env-var');
        if (addGlobalBtn) {
            addGlobalBtn.addEventListener('click', () => this.addGlobalVariable());
        }

        const addStepBtn = document.getElementById('add-step-env-var');
        if (addStepBtn) {
            addStepBtn.addEventListener('click', () => this.addStepVariable());
        }

        const addSecretBtn = document.getElementById('add-secret');
        if (addSecretBtn) {
            addSecretBtn.addEventListener('click', () => this.addSecret());
        }

        // Step selector
        const stepSelector = document.getElementById('env-step-selector');
        if (stepSelector) {
            stepSelector.addEventListener('change', (e) => {
                this.currentStepId = e.target.value;
                document.getElementById('add-step-env-var').disabled = !e.target.value;
                this.renderStepVariables();
            });
        }

        // Apply button
        const applyBtn = document.getElementById('apply-env-vars');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyChanges());
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.env-vars-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.env-vars-content .tab-content').forEach(content => {
            content.style.display = 'none';
        });

        const activeTab = document.getElementById(`${tabName}-vars-tab`) || document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.style.display = 'block';
        }

        // Refresh content based on tab
        if (tabName === 'global') {
            this.renderGlobalVariables();
        } else if (tabName === 'step') {
            this.populateStepSelector();
            this.renderStepVariables();
        } else if (tabName === 'secrets') {
            this.renderSecrets();
        }
    }

    populateStepSelector() {
        const selector = document.getElementById('env-step-selector');
        if (!selector || !window.pipelineBuilder) return;

        const currentValue = selector.value;
        selector.innerHTML = '<option value="">-- Select a step --</option>';

        window.pipelineBuilder.steps.forEach(step => {
            const label = step.properties.label || step.type;
            const option = document.createElement('option');
            option.value = step.id;
            option.textContent = `${label} (${step.id})`;
            selector.appendChild(option);
        });

        selector.value = currentValue;
    }

    renderGlobalVariables() {
        const container = document.getElementById('global-env-vars-list');
        if (!container) return;

        container.innerHTML = '';

        Object.entries(this.globalVars).forEach(([key, value]) => {
            container.appendChild(this.createVariableRow(key, value, 'global'));
        });

        if (Object.keys(this.globalVars).length === 0) {
            container.innerHTML = '<div class="empty-state">No global variables defined</div>';
        }
    }

    renderStepVariables() {
        const container = document.getElementById('step-env-vars-list');
        if (!container || !this.currentStepId || !window.pipelineBuilder) return;

        container.innerHTML = '';

        const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
        if (!step) {
            container.innerHTML = '<div class="empty-state">Step not found</div>';
            return;
        }

        const stepVars = step.properties.env || {};
        Object.entries(stepVars).forEach(([key, value]) => {
            container.appendChild(this.createVariableRow(key, value, 'step'));
        });

        if (Object.keys(stepVars).length === 0) {
            container.innerHTML = '<div class="empty-state">No variables defined for this step</div>';
        }
    }

    renderSecrets() {
        const container = document.getElementById('secrets-list');
        if (!container) return;

        container.innerHTML = '';

        Object.entries(this.secrets).forEach(([key, value]) => {
            container.appendChild(this.createVariableRow(key, '••••••••', 'secret'));
        });

        if (Object.keys(this.secrets).length === 0) {
            container.innerHTML = '<div class="empty-state">No secrets defined</div>';
        }
    }

    createVariableRow(key, value, type) {
        const row = document.createElement('div');
        row.className = 'env-var-row';
        row.innerHTML = `
            <div class="env-var-key">
                <input type="text" value="${key}" placeholder="VARIABLE_NAME" 
                       data-original-key="${key}" data-type="${type}">
            </div>
            <div class="env-var-value">
                <input type="${type === 'secret' ? 'password' : 'text'}" 
                       value="${value}" placeholder="Value" 
                       data-key="${key}" data-type="${type}">
            </div>
            <div class="env-var-actions">
                <button class="btn-icon" onclick="envVarManager.duplicateVariable('${key}', '${type}')">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-icon" onclick="envVarManager.removeVariable('${key}', '${type}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add change listeners
        const keyInput = row.querySelector('.env-var-key input');
        const valueInput = row.querySelector('.env-var-value input');

        keyInput.addEventListener('change', (e) => {
            this.updateVariableKey(e.target.dataset.originalKey, e.target.value, type);
        });

        valueInput.addEventListener('change', (e) => {
            this.updateVariableValue(e.target.dataset.key, e.target.value, type);
        });

        return row;
    }

    addGlobalVariable() {
        const key = prompt('Enter variable name:');
        if (!key) return;

        const value = prompt('Enter variable value:');
        if (value === null) return;

        this.globalVars[key] = value;
        this.renderGlobalVariables();
        this.saveToLocalStorage();
    }

    addStepVariable() {
        if (!this.currentStepId || !window.pipelineBuilder) return;

        const key = prompt('Enter variable name:');
        if (!key) return;

        const value = prompt('Enter variable value:');
        if (value === null) return;

        const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
        if (!step) return;

        if (!step.properties.env) {
            step.properties.env = {};
        }

        step.properties.env[key] = value;
        this.renderStepVariables();
        window.pipelineBuilder.saveToLocalStorage();
    }

    addSecret() {
        const key = prompt('Enter secret name:');
        if (!key) return;

        const value = prompt('Enter secret value (will be hidden):');
        if (value === null) return;

        this.secrets[key] = value;
        this.renderSecrets();
        this.saveToLocalStorage();
    }

    updateVariableKey(oldKey, newKey, type) {
        if (oldKey === newKey) return;

        if (type === 'global') {
            this.globalVars[newKey] = this.globalVars[oldKey];
            delete this.globalVars[oldKey];
            this.renderGlobalVariables();
        } else if (type === 'secret') {
            this.secrets[newKey] = this.secrets[oldKey];
            delete this.secrets[oldKey];
            this.renderSecrets();
        } else if (type === 'step' && this.currentStepId && window.pipelineBuilder) {
            const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
            if (step && step.properties.env) {
                step.properties.env[newKey] = step.properties.env[oldKey];
                delete step.properties.env[oldKey];
                this.renderStepVariables();
            }
        }

        this.saveToLocalStorage();
    }

    updateVariableValue(key, value, type) {
        if (type === 'global') {
            this.globalVars[key] = value;
        } else if (type === 'secret') {
            this.secrets[key] = value;
        } else if (type === 'step' && this.currentStepId && window.pipelineBuilder) {
            const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
            if (step && step.properties.env) {
                step.properties.env[key] = value;
            }
        }

        this.saveToLocalStorage();
    }

    duplicateVariable(key, type) {
        const newKey = prompt('Enter new variable name:', `${key}_copy`);
        if (!newKey) return;

        if (type === 'global') {
            this.globalVars[newKey] = this.globalVars[key];
            this.renderGlobalVariables();
        } else if (type === 'secret') {
            this.secrets[newKey] = this.secrets[key];
            this.renderSecrets();
        } else if (type === 'step' && this.currentStepId && window.pipelineBuilder) {
            const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
            if (step && step.properties.env) {
                step.properties.env[newKey] = step.properties.env[key];
                this.renderStepVariables();
            }
        }

        this.saveToLocalStorage();
    }

    removeVariable(key, type) {
        if (!confirm(`Delete variable "${key}"?`)) return;

        if (type === 'global') {
            delete this.globalVars[key];
            this.renderGlobalVariables();
        } else if (type === 'secret') {
            delete this.secrets[key];
            this.renderSecrets();
        } else if (type === 'step' && this.currentStepId && window.pipelineBuilder) {
            const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
            if (step && step.properties.env) {
                delete step.properties.env[key];
                this.renderStepVariables();
            }
        }

        this.saveToLocalStorage();
    }

    applyChanges() {
        // Global variables are already saved on change
        // Step variables are already saved on change
        // Just close the modal
        const modal = document.getElementById('env-vars-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Refresh pipeline
        if (window.pipelineBuilder) {
            window.pipelineBuilder.renderPipeline();
        }

        // Show success notification
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification('Environment variables updated', 'success');
        }
    }

    openForStep(stepId) {
        this.currentStepId = stepId;
        this.switchTab('step');
        
        const selector = document.getElementById('env-step-selector');
        if (selector) {
            selector.value = stepId;
            selector.dispatchEvent(new Event('change'));
        }
    }

    getGlobalVariables() {
        return this.globalVars;
    }

    getSecrets() {
        return this.secrets;
    }

    saveToLocalStorage() {
        localStorage.setItem('buildkite-env-vars', JSON.stringify({
            global: this.globalVars,
            secrets: this.secrets
        }));

        if (window.pipelineBuilder) {
            window.pipelineBuilder.saveToLocalStorage();
        }
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('buildkite-env-vars');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.globalVars = data.global || {};
                this.secrets = data.secrets || {};
            } catch (e) {
                console.error('Failed to load environment variables:', e);
            }
        }
    }
}

// Initialize when DOM is ready
if (!window.envVarManager) {
    window.envVarManager = new EnvVarManager();
}