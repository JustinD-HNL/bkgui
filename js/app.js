// js/app.js
// Main Application Controller for Buildkite Pipeline Builder - Enhanced v3.0
/**
 * Coordinates all components and handles top-level application logic
 * Now with matrix builds, conditional logic, enhanced YAML validation, and sharing
 * FIXED: File drag-and-drop no longer conflicts with step drag-and-drop
 * FIXED: Prevents duplicate initialization and ensures component checks
 */

class BuildkiteApp {
    constructor() {
        // Singleton pattern to prevent duplicate instances
        if (window.buildkiteApp) {
            console.warn('⚠️ BuildkiteApp already exists, returning existing instance');
            return window.buildkiteApp;
        }
        
        this.pipelineBuilder = null;
        this.yamlGenerator = null;
        this.matrixBuilder = null;
        this.conditionalLogicBuilder = null;
        this.pipelineSharing = null;
        this.yamlVisible = false;
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        this.isInitialized = false;
        
        // Track attached event listeners
        this.attachedListeners = new Set();
        
        // Store as singleton
        window.buildkiteApp = this;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Enhanced Buildkite Pipeline Builder App v3.0...');
        
        // Check if already initialized
        if (this.isInitialized) {
            console.log('✅ BuildkiteApp already initialized');
            return;
        }
        
        // Initialize components
        if (window.YAMLGenerator) {
            this.yamlGenerator = window.yamlGenerator || new YAMLGenerator();
        } else {
            console.warn('⚠️ YAMLGenerator not available');
        }
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady(), { once: true });
        } else {
            this.onDOMReady();
        }
    }

    onDOMReady() {
        console.log('📄 DOM Ready, setting up application...');
        
        // Prevent multiple initialization
        if (this.isInitialized) {
            console.log('✅ BuildkiteApp already initialized in onDOMReady');
            return;
        }
        
        // Get references to components
        this.pipelineBuilder = window.pipelineBuilder;
        this.matrixBuilder = window.matrixBuilder;
        this.conditionalLogicBuilder = window.conditionalLogicBuilder;
        this.pipelineSharing = window.pipelineSharing;
        
        if (!this.pipelineBuilder) {
            console.error('❌ Pipeline Builder not initialized!');
            // Wait for pipeline builder to be available
            this.waitForPipelineBuilder();
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup modals
        this.setupModals();
        
        // Initialize features
        this.initializeFeatures();
        
        // Load saved pipeline if exists
        this.loadSavedPipeline();
        
        // Start auto-save
        this.startAutoSave();
        
        this.isInitialized = true;
        console.log('✅ Enhanced Buildkite Pipeline Builder App initialized successfully!');
    }

    waitForPipelineBuilder() {
        console.log('⏳ Waiting for Pipeline Builder...');
        let attempts = 0;
        const maxAttempts = 20;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.pipelineBuilder) {
                console.log('✅ Pipeline Builder found after', attempts, 'attempts');
                clearInterval(checkInterval);
                this.pipelineBuilder = window.pipelineBuilder;
                this.onDOMReady(); // Try initialization again
            } else if (attempts >= maxAttempts) {
                console.error('❌ Pipeline Builder not found after', maxAttempts, 'attempts');
                clearInterval(checkInterval);
                this.showNotification('Failed to initialize pipeline builder', 'error');
            }
        }, 200);
    }

    // Helper to prevent duplicate event listeners
    addEventListenerOnce(element, event, handler, identifier) {
        if (!element) {
            console.warn(`⚠️ Element not found for event listener: ${identifier}`);
            return;
        }
        
        const key = `${element.id || element.tagName}-${event}-${identifier}`;
        
        if (this.attachedListeners.has(key)) {
            console.log(`⚠️ Event listener already attached: ${key}`);
            return;
        }
        
        element.addEventListener(event, handler);
        this.attachedListeners.add(key);
        console.log(`✅ Event listener attached: ${key}`);
    }

    setupEventListeners() {
        // Header actions
        const loadExampleBtn = document.getElementById('load-example');
        if (loadExampleBtn) {
            this.addEventListenerOnce(loadExampleBtn, 'click', () => {
                if (this.pipelineBuilder && this.pipelineBuilder.loadExample) {
                    this.pipelineBuilder.loadExample();
                    this.updateYAML();
                    this.showNotification('Example pipeline loaded', 'success');
                }
            }, 'load-example');
        }
        
        const clearPipelineBtn = document.getElementById('clear-pipeline');
        if (clearPipelineBtn) {
            this.addEventListenerOnce(clearPipelineBtn, 'click', () => {
                if (confirm('Are you sure you want to clear the entire pipeline?')) {
                    if (this.pipelineBuilder && this.pipelineBuilder.clearPipeline) {
                        this.pipelineBuilder.clearPipeline();
                        this.updateYAML();
                        this.showNotification('Pipeline cleared', 'success');
                    }
                }
            }, 'clear-pipeline');
        }
        
        // NEW: Share pipeline button
        const sharePipelineBtn = document.getElementById('share-pipeline');
        if (sharePipelineBtn) {
            this.addEventListenerOnce(sharePipelineBtn, 'click', () => {
                if (this.pipelineSharing) {
                    this.pipelineSharing.openShareModal();
                }
            }, 'share-pipeline');
        }
        
        const exportYamlBtn = document.getElementById('export-yaml');
        if (exportYamlBtn) {
            this.addEventListenerOnce(exportYamlBtn, 'click', () => {
                this.exportYAML();
            }, 'export-yaml');
        }
        
        // Canvas controls
        const toggleYamlBtn = document.getElementById('toggle-yaml');
        if (toggleYamlBtn) {
            this.addEventListenerOnce(toggleYamlBtn, 'click', () => {
                this.toggleYAML();
            }, 'toggle-yaml');
        }
        
        const copyYamlBtn = document.getElementById('copy-yaml');
        if (copyYamlBtn) {
            this.addEventListenerOnce(copyYamlBtn, 'click', () => {
                this.copyYAML();
            }, 'copy-yaml');
        }
        
        // NEW: Validate pipeline button
        const validatePipelineBtn = document.getElementById('validate-pipeline');
        if (validatePipelineBtn) {
            this.addEventListenerOnce(validatePipelineBtn, 'click', () => {
                this.validatePipeline();
            }, 'validate-pipeline');
        }
        
        // Sidebar actions - Use event delegation to avoid duplicates
        this.addEventListenerOnce(document, 'click', (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                this.handleAction(action);
            }
        }, 'sidebar-actions');
        
        // Plugin quick add buttons - Use event delegation
        this.addEventListenerOnce(document, 'click', (e) => {
            const pluginBtn = e.target.closest('.plugin-quick-add');
            if (pluginBtn) {
                const plugin = pluginBtn.dataset.plugin;
                if (this.pipelineBuilder && this.pipelineBuilder.addPluginStep) {
                    this.pipelineBuilder.addPluginStep(plugin);
                    this.showNotification(`${plugin} plugin added`, 'success');
                }
            }
        }, 'plugin-quick-add');
        
        // Listen for pipeline changes
        this.addEventListenerOnce(document, 'pipelineChanged', () => {
            this.updateYAML();
            this.savePipeline();
        }, 'pipeline-changed');
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // YAML Export Modal buttons
        this.setupYAMLExportButtons();
        
        // Import button
        const importBtn = document.getElementById('import-pipeline');
        if (importBtn) {
            this.addEventListenerOnce(importBtn, 'click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.yml,.yaml,.json';
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.importPipelineFile(file);
                    }
                });
                fileInput.click();
            }, 'import-pipeline');
        }
    }

    setupModals() {
        // Plugin Catalog Modal
        this.setupPluginCatalog();
        
        // Matrix Builder Modal - NEW
        this.setupMatrixBuilder();
        
        // Step Templates Modal
        this.setupStepTemplates();
        
        // Variable Manager Modal
        this.setupVariableManager();
        
        // Pattern Library Modal
        this.setupPatternLibrary();
        
        // Close modal on backdrop click - Use event delegation
        this.addEventListenerOnce(document, 'click', (e) => {
            if (e.target.classList.contains('modal') && e.target === e.currentTarget) {
                e.target.style.display = 'none';
            }
        }, 'modal-backdrop-close');
        
        // Close modal buttons - Use event delegation
        this.addEventListenerOnce(document, 'click', (e) => {
            const closeBtn = e.target.closest('.close-modal');
            if (closeBtn) {
                const modal = closeBtn.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }
        }, 'modal-close-buttons');
    }

    initializeFeatures() {
        // Set up auto-save indicator
        this.setupAutoSaveIndicator();
        
        // Set up file drag-drop (FIXED: Now uses overlay instead of conflicting with pipeline-steps)
        this.setupFileDragDrop();
        
        // Set up command palette
        this.setupCommandPalette();
    }

    setupAutoSaveIndicator() {
        // Add auto-save indicator to header
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.querySelector('.auto-save-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> Auto-saved';
            indicator.style.display = 'none';
            headerActions.appendChild(indicator);
        }
    }

    setupFileDragDrop() {
        // Check if already setup
        if (document.getElementById('file-drop-overlay')) {
            return;
        }
        
        // FIXED: Create a dedicated file drop overlay that doesn't interfere with step dragging
        const overlay = document.createElement('div');
        overlay.id = 'file-drop-overlay';
        overlay.className = 'file-drop-overlay';
        overlay.innerHTML = `
            <div class="file-drop-content">
                <i class="fas fa-file-upload"></i>
                <h3>Drop pipeline file here</h3>
                <p>Supports .yml, .yaml, and .json files</p>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Global document drag handlers to detect file drags
        let dragCounter = 0;
        
        this.addEventListenerOnce(document, 'dragenter', (e) => {
            // Only show overlay for file drags, not for step drags
            if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
                dragCounter++;
                if (dragCounter === 1) {
                    overlay.classList.add('active');
                }
                e.preventDefault();
            }
        }, 'file-dragenter');
        
        this.addEventListenerOnce(document, 'dragleave', (e) => {
            if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
                dragCounter--;
                if (dragCounter === 0) {
                    overlay.classList.remove('active');
                }
            }
        }, 'file-dragleave');
        
        this.addEventListenerOnce(document, 'dragover', (e) => {
            if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }
        }, 'file-dragover');
        
        this.addEventListenerOnce(document, 'drop', (e) => {
            if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                dragCounter = 0;
                overlay.classList.remove('active');
                
                const files = Array.from(e.dataTransfer.files);
                const pipelineFile = files.find(file => 
                    file.name.endsWith('.yml') || 
                    file.name.endsWith('.yaml') || 
                    file.name.endsWith('.json')
                );
                
                if (pipelineFile) {
                    this.importPipelineFile(pipelineFile);
                } else if (files.length > 0) {
                    this.showNotification('Please drop a valid pipeline file (.yml, .yaml, or .json)', 'warning');
                }
            }
        }, 'file-drop');
        
        // Style for the overlay
        if (!document.getElementById('file-drop-styles')) {
            const style = document.createElement('style');
            style.id = 'file-drop-styles';
            style.textContent = `
                .file-drop-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(102, 126, 234, 0.95);
                    z-index: 10000;
                    display: none;
                    align-items: center;
                    justify-content: center;
                    pointer-events: none;
                }
                
                .file-drop-overlay.active {
                    display: flex;
                    pointer-events: all;
                }
                
                .file-drop-content {
                    text-align: center;
                    color: white;
                    transform: scale(0.9);
                    animation: dropZoomIn 0.3s ease forwards;
                }
                
                .file-drop-content i {
                    font-size: 5rem;
                    margin-bottom: 1rem;
                    opacity: 0.9;
                }
                
                .file-drop-content h3 {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }
                
                .file-drop-content p {
                    font-size: 1.2rem;
                    opacity: 0.8;
                }
                
                @keyframes dropZoomIn {
                    to {
                        transform: scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (!palette) return;
        
        const input = document.getElementById('command-input');
        const results = document.getElementById('command-results');
        
        // Commands
        const commands = [
            { name: 'Add Command Step', action: () => this.pipelineBuilder?.addStep('command'), icon: 'fa-terminal' },
            { name: 'Add Wait Step', action: () => this.pipelineBuilder?.addStep('wait'), icon: 'fa-hourglass-half' },
            { name: 'Add Block Step', action: () => this.pipelineBuilder?.addStep('block'), icon: 'fa-hand-paper' },
            { name: 'Clear Pipeline', action: () => this.pipelineBuilder?.clearPipeline(), icon: 'fa-trash' },
            { name: 'Export YAML', action: () => this.exportYAML(), icon: 'fa-download' },
            { name: 'Load Example', action: () => this.pipelineBuilder?.loadExample(), icon: 'fa-file' },
            { name: 'Toggle YAML View', action: () => this.toggleYAML(), icon: 'fa-code' },
            { name: 'Validate Pipeline', action: () => this.validatePipeline(), icon: 'fa-check' },
            { name: 'Import Pipeline', action: () => document.getElementById('import-pipeline')?.click(), icon: 'fa-upload' }
        ];
        
        // Filter function
        const filterCommands = (query) => {
            return commands.filter(cmd => 
                cmd.name.toLowerCase().includes(query.toLowerCase())
            );
        };
        
        // Render results
        const renderResults = (filtered) => {
            if (!results) return;
            results.innerHTML = filtered.map((cmd, index) => `
                <div class="command-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
                    <i class="fas ${cmd.icon}"></i>
                    <span>${cmd.name}</span>
                </div>
            `).join('');
        };
        
        // Input handler
        if (input) {
            this.addEventListenerOnce(input, 'input', (e) => {
                const filtered = filterCommands(e.target.value);
                renderResults(filtered);
            }, 'command-input');
            
            // Keyboard navigation
            this.addEventListenerOnce(input, 'keydown', (e) => {
                if (!results) return;
                const items = results.querySelectorAll('.command-item');
                const selected = results.querySelector('.command-item.selected');
                const selectedIndex = selected ? parseInt(selected.dataset.index) : 0;
                
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        if (selectedIndex < items.length - 1) {
                            items[selectedIndex]?.classList.remove('selected');
                            items[selectedIndex + 1]?.classList.add('selected');
                        }
                        break;
                        
                    case 'ArrowUp':
                        e.preventDefault();
                        if (selectedIndex > 0) {
                            items[selectedIndex]?.classList.remove('selected');
                            items[selectedIndex - 1]?.classList.add('selected');
                        }
                        break;
                        
                    case 'Enter':
                        e.preventDefault();
                        const filtered = filterCommands(input.value);
                        if (filtered[selectedIndex]) {
                            filtered[selectedIndex].action();
                            palette.style.display = 'none';
                            input.value = '';
                        }
                        break;
                        
                    case 'Escape':
                        palette.style.display = 'none';
                        input.value = '';
                        break;
                }
            }, 'command-keydown');
        }
        
        // Click handler
        if (results) {
            this.addEventListenerOnce(results, 'click', (e) => {
                const item = e.target.closest('.command-item');
                if (item && input) {
                    const index = parseInt(item.dataset.index);
                    const filtered = filterCommands(input.value);
                    if (filtered[index]) {
                        filtered[index].action();
                        palette.style.display = 'none';
                        input.value = '';
                    }
                }
            }, 'command-results-click');
        }
        
        // Initial render
        renderResults(commands);
    }

    setupKeyboardShortcuts() {
        this.addEventListenerOnce(document, 'keydown', (e) => {
            // Command/Ctrl+K - Open command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openCommandPalette();
            }
            
            // Command/Ctrl+S - Save pipeline
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.savePipeline();
                this.showNotification('Pipeline saved', 'success');
            }
            
            // Command/Ctrl+E - Export YAML
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportYAML();
            }
            
            // Command/Ctrl+O - Load example
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                if (this.pipelineBuilder && this.pipelineBuilder.loadExample) {
                    this.pipelineBuilder.loadExample();
                    this.updateYAML();
                }
            }
            
            // Command/Ctrl+Y - Toggle YAML view
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.toggleYAML();
            }
            
            // Delete: Delete selected step
            if (e.key === 'Delete' && this.pipelineBuilder?.selectedStep) {
                e.preventDefault();
                if (this.pipelineBuilder.deleteStep) {
                    this.pipelineBuilder.deleteStep(this.pipelineBuilder.selectedStep);
                }
            }
            
            // Ctrl/Cmd + D: Duplicate selected step
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && this.pipelineBuilder?.selectedStep) {
                e.preventDefault();
                if (this.pipelineBuilder.duplicateStep) {
                    this.pipelineBuilder.duplicateStep(this.pipelineBuilder.selectedStep);
                }
            }
            
            // Escape - Close modals
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
                const commandPalette = document.getElementById('command-palette');
                if (commandPalette) {
                    commandPalette.style.display = 'none';
                }
            }
        }, 'keyboard-shortcuts');
    }

    setupPluginCatalog() {
        const modal = document.getElementById('plugin-catalog-modal');
        const searchInput = document.getElementById('plugin-search');
        const pluginList = document.getElementById('plugin-list');
        
        if (!modal || !pluginList) return;
        
        // Render plugins
        const renderPlugins = (filter = '') => {
            if (!this.pipelineBuilder?.pluginCatalog) {
                pluginList.innerHTML = '<p>No plugins available</p>';
                return;
            }
            
            const plugins = Object.entries(this.pipelineBuilder.pluginCatalog)
                .filter(([key, plugin]) => 
                    key.toLowerCase().includes(filter.toLowerCase()) ||
                    plugin.name.toLowerCase().includes(filter.toLowerCase()) ||
                    plugin.description.toLowerCase().includes(filter.toLowerCase())
                );
            
            pluginList.innerHTML = plugins.map(([key, plugin]) => `
                <div class="plugin-card" data-plugin="${key}">
                    <h4>${plugin.name}</h4>
                    <p>${plugin.description}</p>
                    <div class="plugin-config">
                        ${Object.entries(plugin.config || {}).map(([configKey, config]) => `
                            <small><strong>${configKey}:</strong> ${config.description || configKey}</small>
                        `).join('<br>')}
                    </div>
                </div>
            `).join('');
            
            // Add click handlers
            pluginList.querySelectorAll('.plugin-card').forEach(card => {
                card.addEventListener('click', () => {
                    const pluginKey = card.dataset.plugin;
                    if (this.pipelineBuilder && this.pipelineBuilder.addPluginStep) {
                        this.pipelineBuilder.addPluginStep(pluginKey);
                        modal.style.display = 'none';
                        this.showNotification(`${pluginKey} plugin added`, 'success');
                    }
                });
            });
        };
        
        // Search functionality
        if (searchInput) {
            this.addEventListenerOnce(searchInput, 'input', (e) => {
                renderPlugins(e.target.value);
            }, 'plugin-search');
        }
        
        // Initial render when modal opens
        this.addEventListenerOnce(modal, 'show', () => renderPlugins(), 'plugin-catalog-show');
        
        console.log('✅ Plugin catalog setup complete');
    }

    setupMatrixBuilder() {
        const modal = document.getElementById('matrix-builder-modal');
        if (!modal) {
            console.warn('Matrix builder modal not found');
            return;
        }
        
        console.log('✅ Matrix Builder modal setup complete');
    }

    setupStepTemplates() {
        const modal = document.getElementById('step-templates-modal');
        const templateList = document.getElementById('template-list');
        const categoryButtons = modal?.querySelectorAll('.template-cat');
        
        if (!modal || !templateList) return;
        
        const templates = {
            testing: [
                {
                    id: 'node-test',
                    name: 'Node.js Test Suite',
                    description: 'Run tests with coverage',
                    icon: 'fa-node-js'
                },
                {
                    id: 'python-test',
                    name: 'Python Test Suite',
                    description: 'Run pytest with coverage',
                    icon: 'fa-python'
                }
            ],
            deployment: [
                {
                    id: 'docker-deploy',
                    name: 'Docker Deployment',
                    description: 'Build and push Docker image',
                    icon: 'fa-docker'
                },
                {
                    id: 'k8s-deploy',
                    name: 'Kubernetes Deployment',
                    description: 'Deploy to Kubernetes cluster',
                    icon: 'fa-dharmachakra'
                }
            ],
            docker: [
                {
                    id: 'docker-build',
                    name: 'Docker Build & Push',
                    description: 'Build and push to registry',
                    icon: 'fa-docker'
                }
            ],
            notifications: [
                {
                    id: 'slack-notify',
                    name: 'Slack Notification',
                    description: 'Send build status to Slack',
                    icon: 'fa-slack'
                }
            ]
        };
        
        const renderTemplates = (category = 'all') => {
            const templatesToShow = category === 'all' ? 
                Object.values(templates).flat() : 
                templates[category] || [];
            
            templateList.innerHTML = templatesToShow.map(template => `
                <div class="template-card" data-template="${template.id}">
                    <h4><i class="fas ${template.icon}"></i> ${template.name}</h4>
                    <p>${template.description}</p>
                </div>
            `).join('');
            
            // Add click handlers
            templateList.querySelectorAll('.template-card').forEach(card => {
                card.addEventListener('click', () => {
                    const templateId = card.dataset.template;
                    this.applyTemplate(templateId);
                    modal.style.display = 'none';
                });
            });
        };
        
        // Category buttons
        categoryButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderTemplates(btn.dataset.category);
            });
        });
        
        // Initial render
        renderTemplates('all');
    }

    setupVariableManager() {
        const modal = document.getElementById('variable-manager-modal');
        const variableList = document.getElementById('pipeline-variables');
        const addBtn = document.getElementById('add-pipeline-variable');
        
        if (!modal || !variableList) return;
        
        const renderVariables = () => {
            if (!this.pipelineBuilder?.steps) {
                variableList.innerHTML = '<p class="no-data">No pipeline loaded</p>';
                return;
            }
            
            // Get all environment variables from pipeline
            const allVars = {};
            this.pipelineBuilder.steps.forEach(step => {
                if (step.properties?.env) {
                    Object.assign(allVars, step.properties.env);
                }
            });
            
            variableList.innerHTML = Object.entries(allVars).length > 0 ?
                Object.entries(allVars).map(([key, value]) => `
                    <div class="env-var">
                        <span class="var-key">${key}</span>
                        <span class="var-value">${value}</span>
                    </div>
                `).join('') :
                '<p class="no-data">No pipeline variables defined</p>';
        };
        
        if (addBtn) {
            this.addEventListenerOnce(addBtn, 'click', () => {
                const key = prompt('Variable name:');
                if (!key) return;
                
                const value = prompt('Variable value:');
                if (value === null) return;
                
                // Add to all command steps
                if (this.pipelineBuilder?.steps) {
                    this.pipelineBuilder.steps.forEach(step => {
                        if (step.type === 'command') {
                            if (!step.properties.env) {
                                step.properties.env = {};
                            }
                            step.properties.env[key] = value;
                        }
                    });
                    
                    if (this.pipelineBuilder.renderPipeline) {
                        this.pipelineBuilder.renderPipeline();
                    }
                    renderVariables();
                    this.showNotification('Variable added to all command steps', 'success');
                }
            }, 'add-pipeline-variable');
        }
        
        // Initial render when modal opens
        this.addEventListenerOnce(modal, 'show', renderVariables, 'variable-manager-show');
    }

    setupPatternLibrary() {
        const modal = document.getElementById('pattern-library-modal');
        const patternList = document.getElementById('pattern-list');
        const categoryButtons = modal?.querySelectorAll('.pattern-cat');
        
        if (!modal || !patternList) return;
        
        const patterns = {
            monorepo: [
                {
                    name: 'Monorepo Changed Paths',
                    description: 'Only run steps when specific paths change',
                    icon: 'fa-code-branch'
                }
            ],
            microservices: [
                {
                    name: 'Service Dependencies',
                    description: 'Deploy services in dependency order',
                    icon: 'fa-project-diagram'
                }
            ],
            mobile: [
                {
                    name: 'iOS/Android Build',
                    description: 'Parallel mobile app builds',
                    icon: 'fa-mobile-alt'
                }
            ],
            ml: [
                {
                    name: 'ML Training Pipeline',
                    description: 'Train, evaluate, and deploy models',
                    icon: 'fa-brain'
                }
            ]
        };
        
        const renderPatterns = (category = 'all') => {
            const patternsToShow = category === 'all' ?
                Object.values(patterns).flat() : 
                patterns[category] || [];
            
            patternList.innerHTML = patternsToShow.map(pattern => `
                <div class="pattern-card">
                    <h4><i class="fas ${pattern.icon}"></i> ${pattern.name}</h4>
                    <p>${pattern.description}</p>
                    <div class="pattern-preview">
                        <code>Pipeline pattern preview...</code>
                    </div>
                </div>
            `).join('');
        };
        
        // Category buttons
        categoryButtons?.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderPatterns(btn.dataset.category);
            });
        });
        
        // Initial render
        renderPatterns('all');
    }

    openCommandPalette() {
        const palette = document.getElementById('command-palette');
        const input = document.getElementById('command-input');
        
        if (palette && input) {
            palette.classList.remove('hidden');
            palette.style.display = 'block';
            input.value = '';
            input.focus();
            
            // Show all commands initially
            const event = new Event('input');
            input.dispatchEvent(event);
        }
    }

    closeCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.add('hidden');
            palette.style.display = 'none';
        }
    }

    handleAction(action) {
        switch (action) {
            case 'plugin-catalog':
                const pluginModal = document.getElementById('plugin-catalog-modal');
                if (pluginModal) pluginModal.style.display = 'block';
                break;
            case 'matrix-builder':
                this.showNotification('Select a command step and click "Configure Matrix" in properties', 'info');
                break;
            case 'conditional-logic':
                this.showNotification('Select a step and click "Configure Conditions" in properties', 'info');
                break;
            case 'step-templates':
                const templateModal = document.getElementById('step-templates-modal');
                if (templateModal) templateModal.style.display = 'block';
                break;
            case 'variable-manager':
                const varModal = document.getElementById('variable-manager-modal');
                if (varModal) varModal.style.display = 'block';
                break;
            case 'pattern-library':
                const patternModal = document.getElementById('pattern-library-modal');
                if (patternModal) patternModal.style.display = 'block';
                break;
            case 'dependency-manager':
                this.showNotification('Click on a step and configure dependencies in the properties panel', 'info');
                break;
            case 'pipeline-validator':
                this.validatePipeline();
                break;
            case 'pipeline-preview':
                this.showNotification('Pipeline preview coming soon!', 'info');
                break;
            case 'open-plugin-catalog':
                const modal = document.getElementById('plugin-catalog-modal');
                if (modal) modal.style.display = 'block';
                break;
            case 'open-matrix-builder':
                if (this.matrixBuilder) {
                    this.matrixBuilder.open();
                }
                break;
            case 'open-conditional-logic':
                if (this.conditionalLogicBuilder) {
                    this.conditionalLogicBuilder.open();
                }
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }

    updateYAML() {
        if (!this.yamlGenerator || !this.pipelineBuilder) return;
        
        const yaml = this.yamlGenerator.generateYAML(this.pipelineBuilder.steps);
        const output = document.getElementById('yaml-output');
        if (output) {
            output.innerHTML = this.yamlGenerator.prettify ? this.yamlGenerator.prettify(yaml) : yaml;
        }
        
        // Update validation
        const validation = this.yamlGenerator.validate ? this.yamlGenerator.validate(yaml) : { valid: true };
        const validationEl = document.getElementById('yaml-validation');
        if (validationEl) {
            if (validation.valid) {
                validationEl.innerHTML = '<i class="fas fa-check-circle"></i> Valid';
                validationEl.className = 'validation-status valid';
            } else {
                validationEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid';
                validationEl.className = 'validation-status invalid';
            }
        }
    }

    toggleYAML() {
        const panel = document.getElementById('yaml-panel');
        if (!panel) return;
        
        this.yamlVisible = !this.yamlVisible;
        panel.classList.toggle('hidden', !this.yamlVisible);
        
        const toggleBtn = document.getElementById('toggle-yaml');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.yamlVisible ? 
                '<i class="fas fa-eye-slash"></i> Hide YAML' : 
                '<i class="fas fa-eye"></i> Show YAML';
        }
        
        if (this.yamlVisible) {
            this.updateYAML();
        }
    }
    
    setupYAMLExportButtons() {
        // Download YAML button
        const downloadBtn = document.getElementById('download-yaml-file');
        if (downloadBtn) {
            this.addEventListenerOnce(downloadBtn, 'click', () => {
                if (this.pipelineBuilder && this.yamlGenerator) {
                    const config = this.pipelineBuilder.getPipelineConfig ? 
                        this.pipelineBuilder.getPipelineConfig() : 
                        { steps: this.pipelineBuilder.steps };
                    const yaml = this.yamlGenerator.generate ? 
                        this.yamlGenerator.generate(config) : 
                        this.yamlGenerator.generateYAML(this.pipelineBuilder.steps);
                    
                    if (this.yamlGenerator.downloadYAML) {
                        this.yamlGenerator.downloadYAML(yaml, 'pipeline.yml');
                    }
                    this.showNotification('Pipeline downloaded as pipeline.yml', 'success');
                }
            }, 'download-yaml-file');
        }
        
        // Copy YAML button
        const copyBtn = document.getElementById('copy-yaml-clipboard');
        if (copyBtn) {
            this.addEventListenerOnce(copyBtn, 'click', () => {
                const yamlOutput = document.getElementById('export-yaml-output');
                if (yamlOutput) {
                    const yaml = yamlOutput.textContent;
                    navigator.clipboard.writeText(yaml).then(() => {
                        this.showNotification('YAML copied to clipboard!', 'success');
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                        this.showNotification('Failed to copy YAML', 'error');
                    });
                }
            }, 'copy-yaml-clipboard');
        }
        
        // Validate YAML button
        const validateBtn = document.getElementById('validate-yaml-export');
        if (validateBtn) {
            this.addEventListenerOnce(validateBtn, 'click', () => {
                const yamlOutput = document.getElementById('export-yaml-output');
                if (yamlOutput && this.yamlGenerator) {
                    const yaml = yamlOutput.textContent;
                    const validation = this.yamlGenerator.validate ? 
                        this.yamlGenerator.validate(yaml) : 
                        { valid: true, issues: [] };
                    
                    const statusDiv = document.getElementById('export-validation-status');
                    if (statusDiv) {
                        if (validation.valid) {
                            statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> YAML validation passed!';
                            statusDiv.className = 'validation-success';
                            this.showNotification('YAML validation passed!', 'success');
                        } else {
                            statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Validation issues: ' + validation.issues.join(', ');
                            statusDiv.className = 'validation-error';
                            this.showNotification('YAML validation failed', 'error');
                        }
                    }
                }
            }, 'validate-yaml-export');
        }
    }

    copyYAML() {
        if (!this.yamlGenerator || !this.pipelineBuilder) return;
        
        const yaml = this.yamlGenerator.generateYAML ? 
            this.yamlGenerator.generateYAML(this.pipelineBuilder.steps) : '';
        
        navigator.clipboard.writeText(yaml).then(() => {
            this.showNotification('YAML copied to clipboard!', 'success');
            
            const copyBtn = document.getElementById('copy-yaml');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('success');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('success');
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showNotification('Failed to copy YAML', 'error');
        });
    }

    validatePipeline() {
        if (!this.yamlGenerator || !this.pipelineBuilder) return;
        
        const yaml = this.yamlGenerator.generateYAML ? 
            this.yamlGenerator.generateYAML(this.pipelineBuilder.steps) : '';
        const validation = this.yamlGenerator.validate ? 
            this.yamlGenerator.validate(yaml) : 
            { valid: true, issues: [] };
        
        // Show validation results
        const validationDiv = document.getElementById('validation-results');
        if (validationDiv) {
            validationDiv.classList.remove('hidden');
            
            const validationContent = validationDiv.querySelector('.validation-content');
            if (validationContent) {
                if (validation.valid) {
                    validationDiv.classList.remove('error');
                    validationDiv.classList.add('success');
                    validationContent.innerHTML = '<p><i class="fas fa-check-circle"></i> Pipeline is valid!</p>';
                    this.showNotification('Pipeline validation passed!', 'success');
                } else {
                    validationDiv.classList.add('error');
                    validationContent.innerHTML = `
                        <p style="color: #f56565;"><i class="fas fa-exclamation-circle"></i> Validation issues found:</p>
                        <ul>${validation.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
                    `;
                    this.showNotification('Pipeline validation failed', 'error');
                }
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                validationDiv.classList.add('hidden');
            }, 5000);
        }
    }

    exportYAML() {
        if (this.pipelineBuilder && this.pipelineBuilder.exportYAML) {
            this.pipelineBuilder.exportYAML();
        }
    }

    savePipeline() {
        if (!this.autoSaveEnabled || !this.pipelineBuilder) return;
        
        try {
            const config = this.pipelineBuilder.getPipelineConfig ? 
                this.pipelineBuilder.getPipelineConfig() : 
                { steps: this.pipelineBuilder.steps };
            localStorage.setItem('buildkite-pipeline', JSON.stringify(config));
            
            // Show auto-save indicator
            const indicator = document.querySelector('.auto-save-indicator');
            if (indicator) {
                indicator.style.display = 'flex';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to save pipeline:', err);
        }
    }

    loadSavedPipeline() {
        const saved = localStorage.getItem('buildkite-pipeline');
        if (!saved) return;
        
        try {
            const config = JSON.parse(saved);
            if (this.pipelineSharing && this.pipelineSharing.loadPipelineConfig) {
                this.pipelineSharing.loadPipelineConfig(config);
            }
            console.log('Loaded saved pipeline from localStorage');
        } catch (err) {
            console.error('Failed to load saved pipeline:', err);
        }
    }

    startAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.savePipeline();
        }, 30000);
    }

    importPipelineFile(file) {
        if (this.pipelineSharing && this.pipelineSharing.importFromFile) {
            this.pipelineSharing.importFromFile(file);
        }
    }

    applyTemplate(templateId) {
        // Template implementations
        const templates = {
            'node-test': () => {
                if (this.pipelineBuilder && this.pipelineBuilder.addStep) {
                    const step = this.pipelineBuilder.addStep('command');
                    if (step) {
                        step.properties = {
                            label: 'Node.js Tests',
                            command: 'npm ci\nnpm test',
                            plugins: {
                                'test-collector': {
                                    files: 'test-results/**/*.xml',
                                    format: 'junit'
                                }
                            }
                        };
                    }
                }
            },
            'docker-build': () => {
                if (this.pipelineBuilder && this.pipelineBuilder.addStep) {
                    const step = this.pipelineBuilder.addStep('command');
                    if (step) {
                        step.properties = {
                            label: 'Build Docker Image',
                            command: 'docker build -t myapp:$BUILDKITE_BUILD_NUMBER .',
                            plugins: {
                                'docker': {
                                    image: 'myapp:$BUILDKITE_BUILD_NUMBER',
                                    dockerfile: 'Dockerfile'
                                }
                            }
                        };
                    }
                }
            },
            'slack-notify': () => {
                if (this.pipelineBuilder && this.pipelineBuilder.addStep) {
                    const step = this.pipelineBuilder.addStep('notify');
                    if (step) {
                        step.properties = {
                            label: 'Notify Slack',
                            slack: '#builds',
                            if: 'build.state == "failed"'
                        };
                    }
                }
            }
        };
        
        if (templates[templateId]) {
            templates[templateId]();
            if (this.pipelineBuilder && this.pipelineBuilder.renderPipeline) {
                this.pipelineBuilder.renderPipeline();
            }
            this.showNotification('Template applied', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'notificationSlideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }
}

// CSS for enhanced YAML syntax highlighting
if (!document.getElementById('yaml-syntax-styles')) {
    const yamlStyles = `
        .yaml-key { color: #e06c75; font-weight: 600; }
        .yaml-string { color: #98c379; }
        .yaml-number { color: #d19a66; }
        .yaml-boolean { color: #56b6c2; }
        .yaml-array { color: #c678dd; }
        .yaml-variable { color: #61afef; font-style: italic; }
    `;
    
    // Add styles to document
    const styleSheet = document.createElement('style');
    styleSheet.id = 'yaml-syntax-styles';
    styleSheet.textContent = yamlStyles;
    document.head.appendChild(styleSheet);
}

// Initialize app - singleton pattern prevents duplicates
if (!window.buildkiteApp) {
    window.buildkiteApp = new BuildkiteApp();
    
    // Export for debugging
    console.log('🎉 Enhanced Buildkite Pipeline Builder loaded successfully!');
    console.log('📚 Available in console: window.pipelineBuilder, window.buildkiteApp');
    console.log('✨ New features: Matrix Builds, Conditional Logic, Enhanced YAML Validation, Pipeline Sharing');
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildkiteApp;
}