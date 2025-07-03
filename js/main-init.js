// js/main-init.js - COMPLETE VERSION WITH ALL FUNCTIONALITY
/**
 * Main Initialization Script
 * FIXES: Removes duplicate handlers while preserving ALL features
 */

// Global state
window.pipelineBuilder = null;
window.dependencyGraph = null;
window.pipelinePatterns = null;
window.commandPaletteVisible = false;

class MainInitializer {
    constructor() {
        this.initializationSteps = [
            { name: 'YAML Generator', check: () => window.yamlGenerator, init: () => this.initYamlGenerator() },
            { name: 'Pipeline Patterns', check: () => window.PipelinePatterns, init: () => this.initPipelinePatterns() },
            { name: 'Pipeline Builder', check: () => window.PipelineBuilder, init: () => this.initPipelineBuilder() },
            { name: 'Dependency Graph', check: () => window.DependencyGraphManager, init: () => this.initDependencyGraph() },
            { name: 'Post-initialization', check: () => true, init: () => this.postInit() }
        ];
        
        this.currentStep = 0;
        this.maxRetries = 15;
        this.retryCount = 0;
        this.debugMode = true;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('✅ Main initializer already completed');
            return;
        }

        console.log('🚀 Starting COMPLETE Pipeline Builder initialization...');
        console.log('🔧 FIXES: Proper event handling, no duplicate handlers');
        console.log('🔧 INCLUDES: ALL original functionality preserved');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Wait for scripts to load
        await this.wait(300);

        // Check what's available
        this.debugAvailableClasses();

        // Initialize components in order
        await this.initializeSteps();
        
        this.isInitialized = true;
    }

    debugAvailableClasses() {
        console.log('🔍 Debugging available classes:');
        console.log('   window.yamlGenerator:', !!window.yamlGenerator);
        console.log('   window.PipelineBuilder:', !!window.PipelineBuilder);
        console.log('   window.EnhancedPipelineBuilder:', !!window.EnhancedPipelineBuilder);
        console.log('   window.PipelinePatterns:', !!window.PipelinePatterns);
        console.log('   window.DependencyGraphManager:', !!window.DependencyGraphManager);
    }

    async initializeSteps() {
        for (const step of this.initializationSteps) {
            console.log(`🔧 Initializing: ${step.name}`);
            
            // Wait for dependencies
            let attempts = 0;
            while (!step.check() && attempts < this.maxRetries) {
                await this.wait(200);
                attempts++;
                if (attempts % 5 === 0) {
                    console.log(`   ⏳ Still waiting for ${step.name}... (attempt ${attempts}/${this.maxRetries})`);
                }
            }
            
            if (!step.check() && step.name !== 'Post-initialization') {
                console.warn(`⚠️ ${step.name} not available after ${this.maxRetries} attempts`);
                continue;
            }
            
            try {
                await step.init();
                console.log(`✅ ${step.name} initialized successfully`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${step.name}:`, error);
            }
        }
        
        console.log('🎉 Pipeline Builder initialization finished!');
    }

    async initYamlGenerator() {
        if (!window.yamlGenerator) {
            console.log('Creating comprehensive YAML generator...');
            window.yamlGenerator = {
                generateYAML: function(steps) {
                    if (!steps || steps.length === 0) {
                        return '# Empty pipeline\nsteps: []';
                    }
                    
                    let yaml = 'steps:\n';
                    steps.forEach(step => {
                        yaml += this.generateStepYAML(step);
                    });
                    return yaml;
                },
                
                generateStepYAML: function(step) {
                    const indent = '  ';
                    let yaml = '';
                    
                    // Handle wait step specially
                    if (step.type === 'wait') {
                        yaml += `${indent}- wait`;
                        if (step.properties.continue_on_failure) {
                            yaml += `: {continue_on_failure: true}`;
                        }
                        yaml += '\n';
                        return yaml;
                    }
                    
                    // All other step types
                    yaml += `${indent}- ${step.type}:\n`;
                    const props = step.properties;
                    
                    // Basic properties
                    if (props.label) {
                        yaml += `${indent}    label: "${this.escapeYAML(props.label)}"\n`;
                    }
                    
                    // Type-specific properties
                    switch (step.type) {
                        case 'command':
                            if (props.command) {
                                yaml += `${indent}    command: |\n`;
                                const commands = props.command.split('\n');
                                commands.forEach(cmd => {
                                    yaml += `${indent}      ${cmd}\n`;
                                });
                            }
                            break;
                        case 'block':
                            if (props.prompt) {
                                yaml += `${indent}    prompt: "${this.escapeYAML(props.prompt)}"\n`;
                            }
                            if (props.blocked_state) {
                                yaml += `${indent}    blocked_state: "${props.blocked_state}"\n`;
                            }
                            if (props.fields && props.fields.length > 0) {
                                yaml += `${indent}    fields:\n`;
                                props.fields.forEach(field => {
                                    yaml += `${indent}      - text: "${this.escapeYAML(field.text)}"\n`;
                                    yaml += `${indent}        key: "${field.key}"\n`;
                                    if (field.required) {
                                        yaml += `${indent}        required: true\n`;
                                    }
                                    if (field.default) {
                                        yaml += `${indent}        default: "${this.escapeYAML(field.default)}"\n`;
                                    }
                                });
                            }
                            break;
                        case 'input':
                            if (props.prompt) {
                                yaml += `${indent}    prompt: "${this.escapeYAML(props.prompt)}"\n`;
                            }
                            if (props.fields && props.fields.length > 0) {
                                yaml += `${indent}    fields:\n`;
                                props.fields.forEach(field => {
                                    yaml += `${indent}      - text: "${this.escapeYAML(field.text)}"\n`;
                                    yaml += `${indent}        key: "${field.key}"\n`;
                                    if (field.required) {
                                        yaml += `${indent}        required: true\n`;
                                    }
                                });
                            }
                            break;
                        case 'trigger':
                            if (props.trigger) {
                                yaml += `${indent}    trigger: "${props.trigger}"\n`;
                            }
                            if (props.build) {
                                yaml += `${indent}    build:\n`;
                                if (props.build.message) {
                                    yaml += `${indent}      message: "${this.escapeYAML(props.build.message)}"\n`;
                                }
                                if (props.build.commit) {
                                    yaml += `${indent}      commit: "${props.build.commit}"\n`;
                                }
                                if (props.build.branch) {
                                    yaml += `${indent}      branch: "${props.build.branch}"\n`;
                                }
                            }
                            if (props.async === false) {
                                yaml += `${indent}    async: false\n`;
                            }
                            break;
                        case 'annotation':
                            if (props.body) {
                                yaml += `${indent}    body: "${this.escapeYAML(props.body)}"\n`;
                            }
                            if (props.context) {
                                yaml += `${indent}    context: "${props.context}"\n`;
                            }
                            if (props.style) {
                                yaml += `${indent}    style: "${props.style}"\n`;
                            }
                            break;
                        case 'group':
                            if (props.group) {
                                yaml += `${indent}    group: "${this.escapeYAML(props.group)}"\n`;
                            }
                            break;
                        case 'notify':
                            if (props.email) {
                                yaml += `${indent}    email: "${props.email}"\n`;
                            }
                            if (props.slack) {
                                yaml += `${indent}    slack: "${props.slack}"\n`;
                            }
                            if (props.webhook) {
                                yaml += `${indent}    webhook: "${props.webhook}"\n`;
                            }
                            break;
                        case 'pipeline-upload':
                            if (props.pipeline) {
                                yaml += `${indent}    pipeline: "${props.pipeline}"\n`;
                            }
                            if (props.replace) {
                                yaml += `${indent}    replace: true\n`;
                            }
                            break;
                    }
                    
                    // Common properties
                    if (props.key) {
                        yaml += `${indent}    key: "${props.key}"\n`;
                    }
                    
                    if (props.depends_on && props.depends_on.length > 0) {
                        yaml += `${indent}    depends_on:\n`;
                        props.depends_on.forEach(dep => {
                            yaml += `${indent}      - "${dep}"\n`;
                        });
                    }
                    
                    if (props.allow_dependency_failure) {
                        yaml += `${indent}    allow_dependency_failure: true\n`;
                    }
                    
                    // Agents
                    if (props.agents && Object.keys(props.agents).length > 0) {
                        yaml += `${indent}    agents:\n`;
                        Object.entries(props.agents).forEach(([key, value]) => {
                            yaml += `${indent}      ${key}: "${value}"\n`;
                        });
                    }
                    
                    // Environment variables
                    if (props.env && Object.keys(props.env).length > 0) {
                        yaml += `${indent}    env:\n`;
                        Object.entries(props.env).forEach(([key, value]) => {
                            yaml += `${indent}      ${key}: "${value}"\n`;
                        });
                    }
                    
                    // Plugins
                    if (props.plugins && Object.keys(props.plugins).length > 0) {
                        yaml += `${indent}    plugins:\n`;
                        Object.entries(props.plugins).forEach(([pluginName, config]) => {
                            yaml += `${indent}      - ${pluginName}:\n`;
                            Object.entries(config).forEach(([key, value]) => {
                                if (Array.isArray(value)) {
                                    yaml += `${indent}          ${key}:\n`;
                                    value.forEach(item => {
                                        yaml += `${indent}            - "${item}"\n`;
                                    });
                                } else {
                                    yaml += `${indent}          ${key}: "${value}"\n`;
                                }
                            });
                        });
                    }
                    
                    // Conditional properties
                    if (props.branches) {
                        yaml += `${indent}    branches: "${props.branches}"\n`;
                    }
                    
                    if (props.if) {
                        yaml += `${indent}    if: ${props.if}\n`;
                    }
                    
                    if (props.unless) {
                        yaml += `${indent}    unless: ${props.unless}\n`;
                    }
                    
                    // Advanced properties
                    if (props.timeout_in_minutes) {
                        yaml += `${indent}    timeout_in_minutes: ${props.timeout_in_minutes}\n`;
                    }
                    
                    if (props.retry) {
                        yaml += `${indent}    retry:\n`;
                        if (props.retry.automatic) {
                            yaml += `${indent}      automatic:\n`;
                            yaml += `${indent}        limit: ${props.retry.automatic.limit || 3}\n`;
                            if (props.retry.automatic.exit_status) {
                                yaml += `${indent}        exit_status: "${props.retry.automatic.exit_status}"\n`;
                            }
                        }
                        if (props.retry.manual !== undefined) {
                            yaml += `${indent}      manual:\n`;
                            yaml += `${indent}        allowed: ${props.retry.manual.allowed !== false}\n`;
                        }
                    }
                    
                    if (props.soft_fail) {
                        yaml += `${indent}    soft_fail: true\n`;
                    }
                    
                    if (props.priority !== undefined && props.priority !== 0) {
                        yaml += `${indent}    priority: ${props.priority}\n`;
                    }
                    
                    if (props.parallelism && props.parallelism > 1) {
                        yaml += `${indent}    parallelism: ${props.parallelism}\n`;
                    }
                    
                    if (props.concurrency) {
                        yaml += `${indent}    concurrency: ${props.concurrency}\n`;
                        yaml += `${indent}    concurrency_group: "${props.concurrency}"\n`;
                    }
                    
                    if (props.artifact_paths) {
                        yaml += `${indent}    artifact_paths:\n`;
                        const paths = props.artifact_paths.split('\n');
                        paths.forEach(path => {
                            if (path.trim()) {
                                yaml += `${indent}      - "${path.trim()}"\n`;
                            }
                        });
                    }
                    
                    // Matrix configuration
                    if (props.matrix && props.matrix.length > 0) {
                        yaml += `${indent}    matrix:\n`;
                        yaml += `${indent}      setup:\n`;
                        props.matrix.forEach(dimension => {
                            if (dimension.name && dimension.values && dimension.values.length > 0) {
                                yaml += `${indent}        ${dimension.name}:\n`;
                                dimension.values.forEach(value => {
                                    yaml += `${indent}          - "${value}"\n`;
                                });
                            }
                        });
                    }
                    
                    return yaml;
                },
                
                escapeYAML: function(str) {
                    if (typeof str !== 'string') return str;
                    return str
                        .replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"')
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r')
                        .replace(/\t/g, '\\t');
                }
            };
        }
        console.log('✅ Comprehensive YAML generator ready');
    }

    async initPipelinePatterns() {
        if (window.PipelinePatterns) {
            try {
                window.pipelinePatterns = new window.PipelinePatterns();
                console.log('📋 Pipeline patterns initialized');
            } catch (error) {
                console.warn('⚠️ Could not initialize pipeline patterns:', error);
            }
        } else {
            console.warn('Pipeline Patterns class not found - creating functionality');
            window.pipelinePatterns = {
                loadPattern: function(patternName) {
                    console.log(`📋 Loading pattern: ${patternName}`);
                    
                    if (window.mainInit) {
                        window.mainInit.loadPattern(patternName);
                    }
                }
            };
        }
    }

    async initPipelineBuilder() {
        if (window.pipelineBuilder) {
            console.log('✅ Pipeline Builder already exists');
            return;
        }

        let BuilderClass = null;
        
        if (window.EnhancedPipelineBuilder) {
            BuilderClass = window.EnhancedPipelineBuilder;
            console.log('🔧 Using Enhanced Pipeline Builder');
        } else if (window.PipelineBuilder) {
            BuilderClass = window.PipelineBuilder;
            console.log('🔧 Using base Pipeline Builder');
        } else {
            console.error('❌ No PipelineBuilder class found');
            return;
        }
        
        try {
            window.pipelineBuilder = new BuilderClass();
            console.log('✅ Pipeline Builder initialized successfully');
        } catch (error) {
            console.error('❌ Failed to create Pipeline Builder:', error);
        }
    }

    async initDependencyGraph() {
        if (window.DependencyGraphManager) {
            try {
                window.dependencyGraph = new window.DependencyGraphManager();
                console.log('🔗 Dependency graph manager initialized');
            } catch (error) {
                console.warn('⚠️ Could not initialize dependency graph:', error);
            }
        } else {
            console.log('Dependency Graph Manager not found - feature unavailable');
        }
    }

    async postInit() {
        console.log('🔧 Post-initialization: Setting up complete environment');
        
        // Inject enhanced styles
        this.injectEnhancedStyles();
        
        // Setup modal management
        this.setupModalManagement();
        
        // Setup all UI event listeners
        this.setupUIEventListeners();
        
        // Setup template and pattern handlers
        this.setupTemplateHandlers();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup command palette
        this.setupCommandPalette();
        
        // Final verification
        this.verifyFunctionality();
        
        console.log('🎉 Post-initialization complete - ALL features ready');
    }

    injectEnhancedStyles() {
        console.log('🎨 Injecting complete enhanced styles...');
        
        const existingStyle = document.getElementById('enhanced-styles');
        if (existingStyle) {
            console.log('✅ Enhanced styles already injected');
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'enhanced-styles';
        style.textContent = `
            /* Enhanced drag & drop styles */
            .dragging {
                opacity: 0.7;
                transform: scale(0.95);
                transition: all 0.2s ease;
                z-index: 1000;
            }
            
            .drag-active {
                border: 2px dashed #667eea !important;
                background: rgba(102, 126, 234, 0.05) !important;
            }
            
            .drop-zone {
                height: 4px;
                background: #667eea;
                opacity: 0;
                transition: all 0.2s ease;
                margin: 0.5rem 0;
                border-radius: 2px;
                position: relative;
                z-index: 5;
            }
            
            .drop-zone.active {
                opacity: 0.6;
                height: 6px;
            }
            
            .drop-zone.drag-over {
                opacity: 1;
                height: 8px;
                background: #4c51bf;
                box-shadow: 0 0 10px rgba(76, 81, 191, 0.5);
                transform: scaleY(2);
            }
            
            /* Command palette styles */
            .command-palette {
                position: fixed;
                top: 20%;
                left: 50%;
                transform: translateX(-50%);
                width: 90%;
                max-width: 600px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                z-index: 3000;
                overflow: hidden;
                animation: slideDown 0.2s ease;
            }
            
            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(-20px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            
            .command-palette-header {
                padding: 1rem;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .command-palette-search {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 1rem;
                outline: none;
            }
            
            .command-palette-search:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .command-palette-results {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .command-palette-item {
                padding: 0.75rem 1rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                cursor: pointer;
                transition: background 0.1s ease;
            }
            
            .command-palette-item:hover,
            .command-palette-item.active {
                background: #f7fafc;
            }
            
            .command-palette-item i {
                color: #667eea;
                width: 20px;
            }
            
            /* Matrix builder styles */
            .matrix-dimension {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }
            
            .dimension-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
            }
            
            .matrix-values {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin: 0.5rem 0;
            }
            
            .matrix-value {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.375rem 0.75rem;
                background: #e2e8f0;
                border-radius: 4px;
                font-size: 0.875rem;
            }
            
            .matrix-value button {
                background: transparent;
                border: none;
                color: #f56565;
                cursor: pointer;
                padding: 0;
                font-size: 0.875rem;
            }
            
            /* Field builder styles */
            .fields-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin: 0.75rem 0;
            }
            
            .field-item {
                display: flex;
                gap: 0.5rem;
                align-items: center;
                padding: 0.75rem;
                background: #f8fafc;
                border-radius: 6px;
                border: 1px solid #e2e8f0;
            }
            
            .field-item input,
            .field-item select {
                flex: 1;
                padding: 0.5rem;
                border: 1px solid #cbd5e0;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .field-item .btn-danger {
                flex-shrink: 0;
                background: #fee2e2;
                color: #dc2626;
                border: 1px solid #fecaca;
            }
            
            /* Action button styling */
            .plugin-actions,
            .matrix-buttons,
            .advanced-buttons {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                margin-top: 0.75rem;
            }
            
            .btn-small {
                padding: 0.5rem 0.75rem;
                font-size: 0.85rem;
                line-height: 1;
            }
            
            /* Notification badge */
            .notification-badge {
                position: absolute;
                top: -4px;
                right: -4px;
                background: #f56565;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                font-weight: bold;
            }
            
            /* Enhanced tooltip */
            .tooltip {
                position: relative;
                display: inline-block;
            }
            
            .tooltip .tooltiptext {
                visibility: hidden;
                background-color: #374151;
                color: white;
                text-align: center;
                padding: 0.5rem 0.75rem;
                border-radius: 6px;
                position: absolute;
                z-index: 1;
                bottom: 125%;
                left: 50%;
                margin-left: -60px;
                opacity: 0;
                transition: opacity 0.3s;
                font-size: 0.875rem;
                white-space: nowrap;
            }
            
            .tooltip:hover .tooltiptext {
                visibility: visible;
                opacity: 1;
            }
            
            /* Loading spinner */
            .spinner {
                border: 3px solid #f3f4f6;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                display: inline-block;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        console.log('✅ Complete enhanced styles injected');
    }

    setupModalManagement() {
        console.log('🔧 Setting up comprehensive modal management...');
        
        // Global modal functions
        window.closeModal = function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                console.log(`📋 Closed modal: ${modalId}`);
            }
        };
        
        window.showModal = function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                console.log(`📋 Opened modal: ${modalId}`);
                
                // Focus first input
                const firstInput = modal.querySelector('input, textarea, select');
                if (firstInput) {
                    setTimeout(() => firstInput.focus(), 100);
                }
            }
        };
        
        // Setup modal event listeners
        document.addEventListener('click', (e) => {
            // Close button handler
            if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            }
            
            // Background click handler
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });
        
        // Copy YAML button
        const copyBtn = document.getElementById('copy-yaml');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const yamlOutput = document.getElementById('yaml-output');
                if (yamlOutput) {
                    yamlOutput.select();
                    document.execCommand('copy');
                    
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                    }, 2000);
                }
            });
        }
        
        console.log('✅ Modal management configured');
    }

    setupUIEventListeners() {
        console.log('🔧 Setting up all UI event listeners...');
        
        // Header buttons
        this.setupHeaderButtons();
        
        // Quick action buttons
        this.setupQuickActionButtons();
        
        // Plugin quick add buttons
        this.setupPluginQuickAdd();
        
        // Step type info buttons
        this.setupStepTypeInfo();
        
        // Validate pipeline button
        const validateBtn = document.getElementById('validate-pipeline');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                if (window.pipelineBuilder && window.pipelineBuilder.validatePipeline) {
                    window.pipelineBuilder.validatePipeline();
                } else {
                    alert('Pipeline validation not available');
                }
            });
        }
        
        console.log('✅ UI event listeners setup complete');
    }

    setupHeaderButtons() {
        const clearBtn = document.getElementById('clear-pipeline');
        const loadBtn = document.getElementById('load-example');
        const exportBtn = document.getElementById('export-yaml');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (window.pipelineBuilder) {
                    window.pipelineBuilder.clearPipeline();
                }
            });
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (window.pipelineBuilder) {
                    window.pipelineBuilder.loadExample();
                }
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (window.pipelineBuilder) {
                    window.pipelineBuilder.exportYAML();
                }
            });
        }
    }

    setupQuickActionButtons() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            console.log(`🎯 Action clicked: ${action}`);
            
            switch (action) {
                case 'plugin-catalog':
                    this.showPluginCatalog();
                    break;
                case 'matrix-builder':
                    this.showMatrixBuilder();
                    break;
                default:
                    console.warn(`Unknown action: ${action}`);
            }
        });
    }

    setupPluginQuickAdd() {
        document.querySelectorAll('.plugin-quick').forEach(button => {
            button.addEventListener('click', () => {
                const plugin = button.dataset.plugin;
                if (window.pipelineBuilder && plugin) {
                    window.pipelineBuilder.addPluginStepAtIndex(plugin, window.pipelineBuilder.steps.length);
                }
            });
        });
    }

    setupStepTypeInfo() {
        document.querySelectorAll('.step-type-info').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const stepType = button.closest('.step-type').dataset.stepType;
                this.showStepTypeInfo(stepType);
            });
        });
    }

    setupTemplateHandlers() {
        console.log('🔧 Setting up template handlers...');
        
        // Template modal trigger
        const templateBtn = document.getElementById('step-templates-btn');
        if (templateBtn) {
            templateBtn.addEventListener('click', () => {
                this.showTemplatesModal();
            });
        }

        // Quick template buttons
        document.querySelectorAll('.template-quick').forEach(button => {
            button.addEventListener('click', () => {
                const template = button.dataset.template;
                this.loadTemplate(template);
            });
        });

        // Pattern buttons
        document.querySelectorAll('[data-pattern]').forEach(button => {
            button.addEventListener('click', () => {
                const pattern = button.dataset.pattern;
                this.loadPattern(pattern);
            });
        });

        console.log('✅ Template handlers configured');
    }

    setupKeyboardShortcuts() {
        console.log('🔧 Setting up keyboard shortcuts...');
        
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K - Command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleCommandPalette();
            }
            
            // Ctrl/Cmd + E - Export YAML
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (window.pipelineBuilder) {
                    window.pipelineBuilder.exportYAML();
                }
            }
            
            // Ctrl/Cmd + S - Save/Export
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (window.pipelineBuilder) {
                    window.pipelineBuilder.exportYAML();
                }
            }
            
            // Ctrl/Cmd + N - New command step
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (window.pipelineBuilder) {
                    window.pipelineBuilder.addStep('command');
                }
            }
            
            // ? - Show help
            if (e.key === '?' && !this.isInputFocused()) {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
            
            // Escape - Close modals/palettes
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                });
                this.hideCommandPalette();
            }
        });
        
        console.log('✅ Keyboard shortcuts configured');
    }

    setupCommandPalette() {
        console.log('🔧 Setting up command palette...');
        
        // Create command palette if it doesn't exist
        if (!document.getElementById('command-palette')) {
            const palette = document.createElement('div');
            palette.id = 'command-palette';
            palette.className = 'command-palette hidden';
            palette.innerHTML = `
                <div class="command-palette-header">
                    <input type="text" 
                           class="command-palette-search" 
                           placeholder="Type a command or search..." 
                           id="command-palette-search" />
                </div>
                <div class="command-palette-results" id="command-palette-results">
                    <!-- Results will be populated here -->
                </div>
            `;
            document.body.appendChild(palette);
            
            // Setup search
            const searchInput = document.getElementById('command-palette-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.filterCommandPalette(e.target.value);
                });
                
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        this.executeCommandPaletteSelection();
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        this.navigateCommandPalette(e.key === 'ArrowDown' ? 1 : -1);
                    }
                });
            }
        }
        
        console.log('✅ Command palette ready');
    }

    // Template functionality
    showTemplatesModal() {
        const modal = document.getElementById('templates-modal');
        if (!modal) {
            console.warn('Templates modal not found');
            return;
        }

        const content = document.getElementById('templates-content');
        if (content) {
            content.innerHTML = this.generateTemplatesHTML();
        }

        modal.classList.remove('hidden');
    }

    generateTemplatesHTML() {
        const templates = {
            'test-suite': {
                name: 'Test Suite',
                description: 'Complete testing pipeline with unit, integration, and E2E tests',
                icon: 'fa-vial',
                steps: ['Install', 'Lint', 'Unit Tests', 'Integration Tests', 'E2E Tests']
            },
            'docker-build': {
                name: 'Docker Build & Push',
                description: 'Build and push Docker images to registry',
                icon: 'fa-docker',
                steps: ['Build Image', 'Test Image', 'Push to Registry']
            },
            'deployment': {
                name: 'Deployment Pipeline',
                description: 'Staged deployment with approvals',
                icon: 'fa-rocket',
                steps: ['Build', 'Deploy to Staging', 'Approval', 'Deploy to Production']
            },
            'quality-gates': {
                name: 'Quality Gates',
                description: 'Comprehensive quality checks',
                icon: 'fa-shield-alt',
                steps: ['Code Analysis', 'Security Scan', 'Performance Test', 'Quality Report']
            },
            'monorepo': {
                name: 'Monorepo Pipeline',
                description: 'Parallel builds for monorepo packages',
                icon: 'fa-code-branch',
                steps: ['Detect Changes', 'Parallel Package Builds', 'Integration Tests']
            },
            'release': {
                name: 'Release Pipeline',
                description: 'Automated release with changelog generation',
                icon: 'fa-tag',
                steps: ['Version Bump', 'Generate Changelog', 'Create Release', 'Publish']
            }
        };

        return `
            <div class="template-grid">
                ${Object.entries(templates).map(([key, template]) => `
                    <div class="template-card" onclick="window.mainInit.loadTemplate('${key}')">
                        <div class="template-icon">
                            <i class="fas ${template.icon}"></i>
                        </div>
                        <div class="template-info">
                            <h4>${template.name}</h4>
                            <p class="template-description">${template.description}</p>
                            <div class="template-steps-preview">
                                <strong>Steps:</strong>
                                <ul>
                                    ${template.steps.map(step => `<li><i class="fas fa-check"></i> ${step}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadTemplate(templateName) {
        if (!window.pipelineBuilder) {
            console.error('Pipeline builder not available');
            return;
        }

        // Close modal if open
        const modal = document.getElementById('templates-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Complete template definitions
        const templates = {
            'test-suite': [
                { type: 'command', label: '📦 Install Dependencies', command: 'npm ci', key: 'install' },
                { type: 'command', label: '🔍 Lint Code', command: 'npm run lint', key: 'lint', depends_on: ['install'] },
                { type: 'command', label: '🧪 Unit Tests', command: 'npm run test:unit', key: 'unit-tests', depends_on: ['install'] },
                { type: 'command', label: '🔗 Integration Tests', command: 'npm run test:integration', key: 'integration-tests', depends_on: ['install'] },
                { type: 'wait' },
                { type: 'command', label: '🌐 E2E Tests', command: 'npm run test:e2e', key: 'e2e-tests' }
            ],
            'docker-build': [
                { type: 'command', label: '🏗️ Build Docker Image', command: 'docker build -t myapp:$BUILDKITE_BUILD_NUMBER .', key: 'docker-build' },
                { type: 'command', label: '🧪 Test Docker Image', command: 'docker run --rm myapp:$BUILDKITE_BUILD_NUMBER npm test', key: 'docker-test', depends_on: ['docker-build'] },
                { type: 'block', label: '🚀 Push to Registry?', prompt: 'Push image to registry?', key: 'push-gate', depends_on: ['docker-test'] },
                { type: 'command', label: '📤 Push to Registry', command: 'docker push myapp:$BUILDKITE_BUILD_NUMBER', key: 'docker-push', depends_on: ['push-gate'] }
            ],
            'deployment': [
                { type: 'command', label: '🔨 Build Application', command: 'npm run build', key: 'build' },
                { type: 'command', label: '🎭 Deploy to Staging', command: './deploy.sh staging', key: 'deploy-staging', depends_on: ['build'] },
                { type: 'wait' },
                { type: 'block', label: '✅ Production Deploy?', prompt: 'Deploy to production?', key: 'prod-gate', blocked_state: 'passed' },
                { type: 'command', label: '🚀 Deploy to Production', command: './deploy.sh production', key: 'deploy-prod', depends_on: ['prod-gate'] }
            ],
            'quality-gates': [
                { type: 'command', label: '📊 Code Analysis', command: 'npm run analyze', key: 'analyze' },
                { type: 'command', label: '🔒 Security Scan', command: 'npm audit', key: 'security' },
                { type: 'command', label: '⚡ Performance Test', command: 'npm run test:performance', key: 'performance' },
                { type: 'annotation', label: '📋 Quality Report', body: 'Quality checks completed successfully!', style: 'success' }
            ],
            'monorepo': [
                { type: 'command', label: '🔍 Detect Changes', command: './scripts/detect-changes.sh', key: 'detect-changes' },
                { type: 'group', label: '📦 Package Builds', key: 'package-builds', depends_on: ['detect-changes'] },
                { type: 'wait' },
                { type: 'command', label: '🔗 Integration Tests', command: './scripts/integration-tests.sh', key: 'integration' }
            ],
            'release': [
                { type: 'input', label: '📝 Release Version', prompt: 'Enter release version', key: 'version-input' },
                { type: 'command', label: '📈 Version Bump', command: 'npm version $VERSION', key: 'version-bump', depends_on: ['version-input'] },
                { type: 'command', label: '📋 Generate Changelog', command: 'npm run changelog', key: 'changelog', depends_on: ['version-bump'] },
                { type: 'command', label: '🏷️ Create Release', command: 'npm run release', key: 'release', depends_on: ['changelog'] },
                { type: 'command', label: '📦 Publish Package', command: 'npm publish', key: 'publish', depends_on: ['release'] }
            ]
        };

        const template = templates[templateName];
        if (!template) {
            console.error('Template not found:', templateName);
            return;
        }

        // Clear existing pipeline
        window.pipelineBuilder.steps = [];
        window.pipelineBuilder.stepCounter = 0;

        // Add template steps with proper configuration
        template.forEach(stepConfig => {
            const step = window.pipelineBuilder.createStep(stepConfig.type);
            
            // Apply all properties from template
            Object.assign(step.properties, stepConfig);
            
            window.pipelineBuilder.steps.push(step);
            window.pipelineBuilder.stepCounter++;
        });

        // Update UI
        window.pipelineBuilder.renderPipeline();
        window.pipelineBuilder.renderProperties();
        window.pipelineBuilder.updateStepCount();
        
        console.log(`✅ Loaded template: ${templateName}`);
    }

    loadPattern(patternName) {
        if (!window.pipelineBuilder) {
            console.error('Pipeline builder not available');
            return;
        }

        // Pattern definitions
        const patterns = {
            'ci-cd': [
                { type: 'command', label: 'CI - Install', command: 'make install', key: 'ci-install' },
                { type: 'command', label: 'CI - Lint', command: 'make lint', key: 'ci-lint', depends_on: ['ci-install'] },
                { type: 'command', label: 'CI - Test', command: 'make test', key: 'ci-test', depends_on: ['ci-install'] },
                { type: 'command', label: 'CI - Build', command: 'make build', key: 'ci-build', depends_on: ['ci-test'] },
                { type: 'wait' },
                { type: 'block', label: 'CD - Approve Deploy', prompt: 'Deploy to production?', key: 'cd-gate' },
                { type: 'command', label: 'CD - Deploy', command: 'make deploy', key: 'cd-deploy', depends_on: ['cd-gate'] }
            ],
            'microservices': [
                { type: 'group', label: 'Service A Pipeline', key: 'service-a' },
                { type: 'group', label: 'Service B Pipeline', key: 'service-b' },
                { type: 'group', label: 'Service C Pipeline', key: 'service-c' },
                { type: 'wait' },
                { type: 'command', label: 'Integration Tests', command: 'make test:integration', key: 'integration' },
                { type: 'block', label: 'Deploy All Services?', prompt: 'Deploy all microservices?', key: 'deploy-gate' }
            ],
            'matrix': [
                { 
                    type: 'command', 
                    label: 'Matrix Build', 
                    command: 'make test',
                    key: 'matrix-build',
                    matrix: [
                        { name: 'os', values: ['ubuntu', 'macos', 'windows'] },
                        { name: 'node', values: ['16', '18', '20'] }
                    ]
                }
            ]
        };

        const pattern = patterns[patternName];
        if (!pattern) {
            console.error('Pattern not found:', patternName);
            alert(`Pattern "${patternName}" coming soon!`);
            return;
        }

        // Add pattern steps
        pattern.forEach(stepConfig => {
            const step = window.pipelineBuilder.createStep(stepConfig.type);
            Object.assign(step.properties, stepConfig);
            window.pipelineBuilder.steps.push(step);
            window.pipelineBuilder.stepCounter++;
        });

        // Update UI
        window.pipelineBuilder.renderPipeline();
        window.pipelineBuilder.updateStepCount();
        
        console.log(`✅ Loaded pattern: ${patternName}`);
    }

    // Plugin catalog
    showPluginCatalog() {
        const modal = document.getElementById('plugin-catalog-modal');
        if (!modal) {
            console.warn('Plugin catalog modal not found');
            return;
        }

        const content = document.getElementById('plugin-catalog-content');
        if (content && window.pipelineBuilder) {
            content.innerHTML = this.generatePluginCatalogHTML();
        }

        modal.classList.remove('hidden');
    }

    generatePluginCatalogHTML() {
        const catalog = window.pipelineBuilder?.pluginCatalog || {};
        
        const categories = {};
        Object.entries(catalog).forEach(([key, plugin]) => {
            const category = plugin.category || 'other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push({ key, ...plugin });
        });
        
        return Object.entries(categories).map(([category, plugins]) => `
            <div class="plugin-category">
                <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                <div class="plugin-grid">
                    ${plugins.map(plugin => `
                        <div class="plugin-card">
                            <div class="plugin-header">
                                <div class="plugin-info">
                                    <h4>${plugin.name}</h4>
                                    <div class="plugin-meta">
                                        <span class="plugin-version">${plugin.version}</span>
                                        <span class="plugin-category">${plugin.category}</span>
                                    </div>
                                </div>
                            </div>
                            <p class="plugin-description">${plugin.description}</p>
                            <div class="plugin-config-preview">
                                <strong>Configuration:</strong>
                                ${Object.entries(plugin.config || {}).map(([key, config]) => `
                                    <div class="config-item">
                                        <code>${key}</code>: ${config.label}
                                    </div>
                                `).join('')}
                            </div>
                            <div class="plugin-actions">
                                <button class="btn btn-primary btn-small" onclick="window.mainInit.addPluginFromCatalog('${plugin.key}')">
                                    <i class="fas fa-plus"></i> Add to Pipeline
                                </button>
                                <button class="btn btn-secondary btn-small" onclick="window.mainInit.showPluginDocs('${plugin.key}')">
                                    <i class="fas fa-book"></i> Docs
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    addPluginFromCatalog(pluginKey) {
        if (window.pipelineBuilder) {
            window.pipelineBuilder.addPluginStepAtIndex(pluginKey, window.pipelineBuilder.steps.length);
            
            // Close modal
            const modal = document.getElementById('plugin-catalog-modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    }

    showPluginDocs(pluginKey) {
        const plugin = window.pipelineBuilder?.pluginCatalog?.[pluginKey];
        if (plugin) {
            alert(`${plugin.name} Documentation\n\n${plugin.description}\n\nFor more information, visit the Buildkite plugins directory.`);
        }
    }

    // Matrix builder
    showMatrixBuilder() {
        alert('Matrix Builder - Advanced Feature\n\nCreate matrix builds to run the same step with different configurations.\n\nExample: Test on multiple OS and Node versions simultaneously.\n\nThis feature is available in the step properties panel.');
    }

    // Command palette
    toggleCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            const isHidden = palette.classList.contains('hidden');
            if (isHidden) {
                this.showCommandPalette();
            } else {
                this.hideCommandPalette();
            }
        }
    }

    showCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (!palette) return;
        
        palette.classList.remove('hidden');
        window.commandPaletteVisible = true;
        
        const searchInput = document.getElementById('command-palette-search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
            this.filterCommandPalette('');
        }
    }

    hideCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.add('hidden');
            window.commandPaletteVisible = false;
        }
    }

    filterCommandPalette(query) {
        const resultsContainer = document.getElementById('command-palette-results');
        if (!resultsContainer) return;
        
        const commands = [
            { name: 'Add Command Step', icon: 'fa-terminal', action: () => window.pipelineBuilder?.addStep('command') },
            { name: 'Add Wait Step', icon: 'fa-hourglass-half', action: () => window.pipelineBuilder?.addStep('wait') },
            { name: 'Add Block Step', icon: 'fa-hand-paper', action: () => window.pipelineBuilder?.addStep('block') },
            { name: 'Add Input Step', icon: 'fa-keyboard', action: () => window.pipelineBuilder?.addStep('input') },
            { name: 'Add Trigger Step', icon: 'fa-play', action: () => window.pipelineBuilder?.addStep('trigger') },
            { name: 'Add Group Step', icon: 'fa-layer-group', action: () => window.pipelineBuilder?.addStep('group') },
            { name: 'Export YAML', icon: 'fa-download', action: () => window.pipelineBuilder?.exportYAML() },
            { name: 'Clear Pipeline', icon: 'fa-trash', action: () => window.pipelineBuilder?.clearPipeline() },
            { name: 'Load Example', icon: 'fa-file-import', action: () => window.pipelineBuilder?.loadExample() },
            { name: 'Show Templates', icon: 'fa-clipboard-list', action: () => this.showTemplatesModal() },
            { name: 'Plugin Catalog', icon: 'fa-plug', action: () => this.showPluginCatalog() },
            { name: 'Keyboard Shortcuts', icon: 'fa-keyboard', action: () => this.showKeyboardShortcuts() },
            { name: 'Validate Pipeline', icon: 'fa-check-circle', action: () => window.pipelineBuilder?.validatePipeline?.() },
            { name: 'Matrix Builder', icon: 'fa-th', action: () => this.showMatrixBuilder() }
        ];
        
        const filtered = commands.filter(cmd => 
            cmd.name.toLowerCase().includes(query.toLowerCase())
        );
        
        resultsContainer.innerHTML = filtered.map((cmd, index) => `
            <div class="command-palette-item ${index === 0 ? 'active' : ''}" data-action="${index}">
                <i class="fas ${cmd.icon}"></i>
                <span>${cmd.name}</span>
            </div>
        `).join('');
        
        // Add click handlers
        resultsContainer.querySelectorAll('.command-palette-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                filtered[index].action();
                this.hideCommandPalette();
            });
        });
    }

    navigateCommandPalette(direction) {
        const items = document.querySelectorAll('.command-palette-item');
        const activeItem = document.querySelector('.command-palette-item.active');
        
        if (!activeItem || items.length === 0) return;
        
        let currentIndex = Array.from(items).indexOf(activeItem);
        items[currentIndex].classList.remove('active');
        
        currentIndex = (currentIndex + direction + items.length) % items.length;
        items[currentIndex].classList.add('active');
        items[currentIndex].scrollIntoView({ block: 'nearest' });
    }

    executeCommandPaletteSelection() {
        const activeItem = document.querySelector('.command-palette-item.active');
        if (activeItem) {
            activeItem.click();
        }
    }

    showKeyboardShortcuts() {
        const shortcuts = `
Keyboard Shortcuts:

Global:
• Ctrl/Cmd + K - Open command palette
• Ctrl/Cmd + S - Export YAML
• Ctrl/Cmd + E - Export YAML
• Ctrl/Cmd + N - Add new command step
• ? - Show this help

Pipeline Builder:
• Delete - Remove selected step
• Enter - Edit selected step
• ↑/↓ - Navigate steps
• A - Add step
• D - Duplicate selected step
• Escape - Deselect step

Modal:
• Escape - Close modal
        `.trim();
        
        alert(shortcuts);
    }

    showStepTypeInfo(stepType) {
        const info = {
            command: 'Command steps execute shell commands on agents. They can run scripts, build code, run tests, and deploy applications.',
            wait: 'Wait steps pause the pipeline until all previous steps complete. Use them to create dependencies between pipeline stages.',
            block: 'Block steps require manual approval before continuing. Perfect for deployment gates and manual QA checks.',
            input: 'Input steps collect information from users during pipeline execution. Great for parameterized deployments.',
            trigger: 'Trigger steps start other pipelines. Use them to create complex workflows across multiple pipelines.',
            group: 'Group steps organize related steps together. They help structure large pipelines and improve readability.',
            annotation: 'Annotation steps add formatted text to build pages. Use them for build summaries and important notices.',
            notify: 'Notify steps send notifications via email, Slack, or webhooks when specific conditions are met.',
            'pipeline-upload': 'Pipeline Upload steps dynamically add steps to the running build. Enable dynamic pipeline generation.'
        };
        
        alert(`${stepType.charAt(0).toUpperCase() + stepType.slice(1)} Step\n\n${info[stepType] || 'No information available.'}`);
    }

    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.contentEditable === 'true'
        );
    }

    verifyFunctionality() {
        console.log('🔍 Verifying ALL functionality...');
        
        const features = [
            { name: 'Pipeline Builder', check: () => !!window.pipelineBuilder },
            { name: 'YAML Generator', check: () => !!window.yamlGenerator },
            { name: 'Modal Management', check: () => typeof window.closeModal === 'function' },
            { name: 'Command Palette', check: () => !!document.getElementById('command-palette') },
            { name: 'Templates', check: () => !!document.getElementById('templates-modal') },
            { name: 'Plugin Catalog', check: () => !!document.getElementById('plugin-catalog-modal') },
            { name: 'Enhanced Styles', check: () => !!document.getElementById('enhanced-styles') },
            { name: 'Keyboard Shortcuts', check: () => true },
            { name: 'Drag & Drop', check: () => !!window.pipelineBuilder?.handleDragStart },
            { name: 'Step Selection', check: () => !!window.pipelineBuilder?.selectStep }
        ];
        
        let passed = 0;
        features.forEach(feature => {
            const result = feature.check();
            console.log(`${result ? '✅' : '❌'} ${feature.name}`);
            if (result) passed++;
        });
        
        console.log(`📊 Functionality verification: ${passed}/${features.length} features working`);
        
        if (window.pipelineBuilder) {
            console.log('🚀 Pipeline Builder ready with ALL features!');
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and expose global instance
window.mainInit = new MainInitializer();

// Initialize when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mainInit.initialize();
    });
} else {
    window.mainInit.initialize();
}