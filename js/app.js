// js/app.js
// Main Application Controller for Buildkite Pipeline Builder - Enhanced v3.0
// COMPLETE CONSOLIDATED VERSION - Includes all initialization from main-init.js
/**
 * Coordinates all components and handles top-level application logic
 * Now includes ALL initialization, modal management, event listeners, and UI setup
 * Previously split between app.js and main-init.js
 */

class BuildkiteApp {
    constructor() {
        // Singleton pattern to prevent duplicate instances
        if (window.buildkiteApp) {
            console.warn('⚠️ BuildkiteApp already exists, returning existing instance');
            return window.buildkiteApp;
        }
        
        // Core components
        this.pipelineBuilder = null;
        this.yamlGenerator = null;
        this.matrixBuilder = null;
        this.conditionalLogicBuilder = null;
        this.pipelineSharing = null;
        this.commandPalette = null;
        this.pipelinePatterns = null;
        this.dependencyGraph = null;
        this.apiClient = null;
        
        // App state
        this.yamlVisible = false;
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        this.isInitialized = false;
        this.currentCommandIndex = 0;
        this.debugMode = true;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // Track attached event listeners to prevent duplicates
        this.attachedListeners = new Set();
        
        // Store as singleton
        window.buildkiteApp = this;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Enhanced Buildkite Pipeline Builder App v3.0...');
        console.log('📦 COMPLETE CONSOLIDATED VERSION - All features included');
        
        // Check if already initialized
        if (this.isInitialized) {
            console.log('✅ BuildkiteApp already initialized');
            return;
        }
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady(), { once: true });
        } else {
            this.onDOMReady();
        }
    }

    async onDOMReady() {
        console.log('📄 DOM Ready, starting complete initialization...');
        
        // Prevent multiple initialization
        if (this.isInitialized) {
            console.log('✅ BuildkiteApp already initialized in onDOMReady');
            return;
        }

        try {
            // Initialize in correct order
            await this.initializeComponents();
            this.injectEnhancedStyles();
            this.initializeTheme();
            this.setupModalManagement();
            this.setupAllEventListeners();
            this.setupKeyboardShortcuts();
            this.initializeFeatures();
            this.startAutoSave();
            
            // Setup file drop zone
            this.setupFileDropZone();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Final setup
            this.finalizeInitialization();
            
            console.log('✅ Application initialization completed successfully!');
            console.log('📚 Available in console: window.pipelineBuilder, window.buildkiteApp');
            console.log('✨ All features active: Matrix Builds, Conditional Logic, Templates, Plugins');
            console.log('❓ Type buildkiteApp.showHelp() for keyboard shortcuts and tips');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.showErrorMessage('Initialization failed. Please refresh the page.');
        }
    }

    async initializeComponents() {
        console.log('🔧 Initializing core components...');
        
        // Initialize YAML Generator
        if (window.YAMLGenerator) {
            this.yamlGenerator = window.yamlGenerator || new YAMLGenerator();
            window.yamlGenerator = this.yamlGenerator;
            console.log('✅ YAML Generator initialized');
        } else {
            console.warn('⚠️ YAMLGenerator not available, creating minimal version');
            this.createMinimalYamlGenerator();
        }
        
        // Initialize Pipeline Builder
        if (!window.pipelineBuilder) {
            if (window.PipelineBuilder) {
                window.pipelineBuilder = new PipelineBuilder();
                this.pipelineBuilder = window.pipelineBuilder;
                console.log('✅ Pipeline Builder initialized');
            } else {
                console.error('❌ PipelineBuilder class not found!');
                this.createMinimalPipelineBuilder();
            }
        } else {
            this.pipelineBuilder = window.pipelineBuilder;
            console.log('✅ Pipeline Builder already exists');
        }
        
        // Initialize other components
        if (window.MatrixBuilder) {
            this.matrixBuilder = new MatrixBuilder();
            window.matrixBuilder = this.matrixBuilder;
            console.log('✅ Matrix Builder initialized');
        }
        
        if (window.ConditionalLogicBuilder) {
            this.conditionalLogicBuilder = new ConditionalLogicBuilder();
            window.conditionalLogicBuilder = this.conditionalLogicBuilder;
            console.log('✅ Conditional Logic Builder initialized');
        }
        
        if (window.PipelineSharing) {
            this.pipelineSharing = new PipelineSharing();
            window.pipelineSharing = this.pipelineSharing;
            console.log('✅ Pipeline Sharing initialized');
        }
        
        if (window.CommandPalette) {
            this.commandPalette = new CommandPalette();
            window.commandPalette = this.commandPalette;
            console.log('✅ Command Palette initialized');
        }
        
        if (window.PipelinePatterns) {
            this.pipelinePatterns = new PipelinePatterns();
            window.pipelinePatterns = this.pipelinePatterns;
            console.log('✅ Pipeline Patterns initialized');
        }
        
        if (window.DependencyGraphManager) {
            this.dependencyGraph = new DependencyGraphManager();
            window.dependencyGraph = this.dependencyGraph;
            console.log('✅ Dependency Graph initialized');
        }
        
        // Initialize API Client
        if (window.buildkiteAPI) {
            this.apiClient = window.buildkiteAPI;
            await this.apiClient.initialize();
            console.log('✅ Buildkite API Client initialized');
            
            // Check if API is configured
            if (this.apiClient.initialized) {
                this.showAPIStatus(true);
            } else {
                this.showAPIStatus(false);
            }
        }
        
        // Check for missing methods and add them
        this.ensurePipelineBuilderMethods();
    }

    ensurePipelineBuilderMethods() {
        if (!this.pipelineBuilder) return;
        
        const requiredMethods = [
            'addStep', 'deleteStep', 'duplicateStep', 'clearPipeline',
            'loadExample', 'renderPipeline', 'renderProperties', 'selectStep',
            'exportConfig', 'saveToLocalStorage', 'loadFromLocalStorage'
        ];
        
        const missingMethods = requiredMethods.filter(method => 
            typeof this.pipelineBuilder[method] !== 'function'
        );
        
        if (missingMethods.length > 0) {
            console.warn('⚠️ Missing pipeline builder methods:', missingMethods);
            this.addMissingEssentialMethods(missingMethods);
        }
    }

    addMissingEssentialMethods(missingMethods) {
        console.log('🔧 Adding missing essential methods...');
        
        missingMethods.forEach(methodName => {
            if (!this.pipelineBuilder[methodName]) {
                this.pipelineBuilder[methodName] = function(...args) {
                    console.log(`⚠️ Called missing method: ${methodName}`, args);
                    return null;
                };
            }
        });
        
        console.log('✅ Missing methods added');
    }

    createMinimalYamlGenerator() {
        window.yamlGenerator = {
            generate: (config) => {
                if (!config || !config.steps) return 'steps: []';
                return 'steps:\n' + config.steps.map(step => {
                    if (step === 'wait') return '  - wait';
                    return `  - label: "${step.properties?.label || 'Step'}"\n    command: "${step.properties?.command || 'echo "No command"'}"`;
                }).join('\n');
            },
            validateYAML: (yamlString) => {
                try {
                    const errors = [];
                    if (!yamlString || yamlString.trim() === '') {
                        errors.push('YAML content is empty');
                    }
                    if (!yamlString.includes('steps:')) {
                        errors.push('Missing required "steps:" field');
                    }
                    return { valid: errors.length === 0, errors: errors };
                } catch (error) {
                    return { valid: false, errors: [error.message] };
                }
            },
            formatYAML: (yamlString) => {
                return yamlString.split('\n').map(line => line.trimEnd()).join('\n').replace(/\n\n\n+/g, '\n\n');
            },
            downloadYAML: (content, filename) => {
                const blob = new Blob([content], { type: 'text/yaml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        };
        this.yamlGenerator = window.yamlGenerator;
        console.log('✅ Minimal YAML Generator created');
    }

    createMinimalPipelineBuilder() {
        window.pipelineBuilder = {
            steps: [],
            selectedStep: null,
            stepCounter: 0,
            pluginCatalog: {},
            
            addStep: function(type) {
                console.log(`Adding step of type: ${type}`);
                const step = {
                    id: `step-${++this.stepCounter}-${Date.now()}`,
                    type: type,
                    properties: { label: `New ${type} step` }
                };
                this.steps.push(step);
                return step;
            },
            
            deleteStep: function(stepId) {
                const index = this.steps.findIndex(s => s.id === stepId);
                if (index > -1) {
                    this.steps.splice(index, 1);
                    if (this.selectedStep?.id === stepId) {
                        this.selectedStep = null;
                    }
                }
            },
            
            duplicateStep: function(stepId) {
                const step = this.steps.find(s => s.id === stepId);
                if (!step) return;
                
                const newStep = {
                    id: `step-${++this.stepCounter}-${Date.now()}`,
                    type: step.type,
                    properties: JSON.parse(JSON.stringify(step.properties))
                };
                
                const index = this.steps.findIndex(s => s.id === stepId);
                this.steps.splice(index + 1, 0, newStep);
                return newStep;
            },
            
            clearPipeline: function() {
                this.steps = [];
                this.selectedStep = null;
                console.log('Pipeline cleared');
            },
            
            loadExample: function() {
                this.clearPipeline();
                this.addStep('command');
                console.log('Example loaded');
            },
            
            selectStep: function(step) {
                this.selectedStep = step;
                this.renderProperties();
            },
            
            exportConfig: function() {
                return { steps: this.steps };
            },
            
            renderPipeline: function() {
                console.log('Pipeline render requested');
            },
            
            renderProperties: function() {
                console.log('Properties render requested');
            },
            
            saveToLocalStorage: function() {
                const config = this.exportConfig();
                localStorage.setItem('buildkite-pipeline', JSON.stringify(config));
            },
            
            loadFromLocalStorage: function() {
                const saved = localStorage.getItem('buildkite-pipeline');
                if (saved) {
                    try {
                        const config = JSON.parse(saved);
                        this.steps = config.steps || [];
                        console.log('Pipeline loaded from localStorage');
                    } catch (e) {
                        console.error('Failed to load from localStorage:', e);
                    }
                }
            }
        };
        this.pipelineBuilder = window.pipelineBuilder;
        console.log('✅ Minimal pipeline builder created');
    }

    injectEnhancedStyles() {
        console.log('🎨 Injecting enhanced styles...');
        
        if (!document.getElementById('enhanced-styles')) {
            const enhancedStyles = document.createElement('style');
            enhancedStyles.id = 'enhanced-styles';
            enhancedStyles.textContent = `
                /* Enhanced styles for complete functionality */
                /* Drag and drop visual feedback */
                .dragging { opacity: 0.5; cursor: grabbing !important; }
                .drag-over { background-color: #e3f2fd !important; border: 2px dashed #2196f3 !important; }
                .drop-zone { min-height: 60px; transition: all 0.3s ease; }
                .drop-zone.active { background-color: #e8f5e9; border: 2px dashed #4caf50; }
                
                /* Modal improvements */
                .modal { backdrop-filter: blur(4px); }
                .modal-content { animation: modalSlideIn 0.3s ease; }
                @keyframes modalSlideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                /* Command palette enhancements */
                .command-palette { animation: paletteSlideDown 0.2s ease; }
                @keyframes paletteSlideDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                /* Properties panel improvements */
                .property-group { transition: all 0.2s ease; }
                .property-group:hover { background-color: #f8f9fa; }
                
                /* Button enhancements */
                .btn { transition: all 0.2s ease; position: relative; overflow: hidden; }
                .btn:active { transform: scale(0.98); }
                
                /* Step card improvements */
                .step-card { transition: all 0.3s ease; }
                .step-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .step-card.selected { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
                
                /* Toast notifications */
                .toast { animation: toastSlideIn 0.3s ease; }
                @keyframes toastSlideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                
                /* Loading states */
                .loading { position: relative; color: transparent !important; }
                .loading::after {
                    content: '';
                    position: absolute;
                    width: 16px;
                    height: 16px;
                    top: 50%;
                    left: 50%;
                    margin-left: -8px;
                    margin-top: -8px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Dependency dropdown styles */
                .dependency-dropdown {
                    position: relative;
                    display: inline-block;
                    width: 100%;
                }
                
                .dependency-dropdown select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    background-color: white;
                    cursor: pointer;
                }
                
                /* Enhanced tooltips */
                [data-tooltip] {
                    position: relative;
                    cursor: help;
                }
                
                [data-tooltip]:hover::after {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 0.5rem;
                    background: #1a202c;
                    color: white;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    white-space: nowrap;
                    z-index: 1000;
                    margin-bottom: 0.5rem;
                }
                
                /* Matrix builder grid */
                .matrix-grid {
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                
                /* Plugin catalog grid */
                .plugin-grid {
                    display: grid;
                    gap: 1rem;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                }
                
                .plugin-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .plugin-card:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                /* Template cards */
                .template-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    transition: all 0.2s ease;
                }
                
                .template-card:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                /* YAML syntax highlighting */
                .yaml-key { color: #e06c75; font-weight: 600; }
                .yaml-string { color: #98c379; }
                .yaml-number { color: #d19a66; }
                .yaml-boolean { color: #56b6c2; }
                .yaml-variable { color: #61afef; font-style: italic; }
                .yaml-comment { color: #5c6370; font-style: italic; }
                
                /* File drop zone */
                .file-drop-zone {
                    border: 2px dashed #cbd5e0;
                    border-radius: 8px;
                    padding: 2rem;
                    text-align: center;
                    transition: all 0.3s ease;
                }
                
                .file-drop-zone.drag-over {
                    border-color: #3b82f6;
                    background-color: #ebf8ff;
                }
                
                /* Fade out animation */
                .fade-out {
                    animation: fadeOut 0.3s ease forwards;
                }
                
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateY(-10px); }
                }
            `;
            document.head.appendChild(enhancedStyles);
            console.log('✅ Enhanced styles injected');
        }
    }

    // Helper to prevent duplicate event listeners
    addEventListenerOnce(element, event, handler, identifier) {
        const key = `${element.tagName || 'document'}-${event}-${identifier}`;
        
        if (this.attachedListeners.has(key)) {
            console.log(`⚠️ Event listener already attached: ${key}`);
            return;
        }
        
        element.addEventListener(event, handler);
        this.attachedListeners.add(key);
        console.log(`✅ Event listener attached: ${key}`);
    }

    setupModalManagement() {
        console.log('🔧 Setting up modal management...');
        
        // Global modal functions
        window.closeModal = (modalId) => {
            const modal = modalId ? document.getElementById(modalId) : 
                          document.querySelector('.modal:not(.hidden)');
            if (modal) {
                modal.style.display = 'none';
                modal.classList.add('hidden');
            }
        };
        
        window.showModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
                modal.classList.remove('hidden');
            }
        };
        
        // Close modal on click outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                window.closeModal();
            }
        });
        
        // Close modal buttons (X buttons)
        document.querySelectorAll('.close-modal').forEach((btn, index) => {
            this.addEventListenerOnce(btn, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = btn.closest('.modal');
                if (modal) {
                    console.log(`Closing modal: ${modal.id}`);
                    window.closeModal(modal.id);
                }
            }, `close-modal-btn-${index}`);
        });
        
        // ESC key to close modals
        this.addEventListenerOnce(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal:not(.hidden)');
                if (openModal) {
                    e.preventDefault();
                    window.closeModal(openModal.id);
                }
            }
        }, 'modal-escape-handler');
        
        console.log('✅ Modal management configured');
    }

    setupAllEventListeners() {
        console.log('🔧 Setting up all event listeners...');
        
        // Header buttons
        this.setupHeaderButtons();
        
        // Quick action buttons
        this.setupQuickActionButtons();
        
        // Plugin catalog
        this.setupPluginCatalog();
        
        // Matrix builder
        this.setupMatrixBuilder();
        
        // Step templates
        this.setupStepTemplates();
        
        // Command palette
        this.setupCommandPalette();
        
        // YAML output handlers
        this.setupYamlOutputHandlers();
        
        // Import/Export handlers
        this.setupImportExportHandlers();
        
        // Pipeline sharing
        this.setupPipelineSharing();
        
        // Validation handlers
        this.setupValidationHandlers();
        
        // Step count updater
        this.setupStepCountUpdater();
        
        // Properties panel updates
        this.setupPropertiesUpdates();
        
        // API Integration handlers
        this.setupAPIHandlers();
        
        // Theme toggle handler
        this.setupThemeToggle();
        
        console.log('✅ All event listeners configured');
    }

    setupHeaderButtons() {
        console.log('🔧 Setting up header buttons...');
        
        // Load Example
        this.addEventListenerOnce(document.getElementById('load-example'), 'click', () => {
            if (this.pipelineBuilder?.loadExample) {
                this.pipelineBuilder.loadExample();
                this.updateYAML();
                this.updateStepCount();
                this.showNotification('Example pipeline loaded', 'success');
            }
        }, 'load-example');
        
        // Clear Pipeline
        this.addEventListenerOnce(document.getElementById('clear-pipeline'), 'click', () => {
            if (this.pipelineBuilder?.steps?.length === 0) {
                this.showNotification('Pipeline is already empty', 'info');
                return;
            }
            
            if (confirm('Are you sure you want to clear the entire pipeline? This action cannot be undone.')) {
                this.pipelineBuilder?.clearPipeline();
                this.updateYAML();
                this.updateStepCount();
                this.showNotification('Pipeline cleared', 'info');
            }
        }, 'clear-pipeline');
        
        // Export YAML
        this.addEventListenerOnce(document.getElementById('export-yaml'), 'click', () => {
            this.exportYAML();
        }, 'export-yaml');
        
        // Share Pipeline
        this.addEventListenerOnce(document.getElementById('share-pipeline'), 'click', () => {
            if (this.pipelineSharing) {
                this.pipelineSharing.sharePipeline();
            } else {
                this.showNotification('Sharing feature not available', 'warning');
            }
        }, 'share-pipeline');
        
        // Load Saved
        this.addEventListenerOnce(document.getElementById('load-saved-pipeline'), 'click', () => {
            const saved = localStorage.getItem('buildkite-pipeline');
            if (saved) {
                try {
                    const config = JSON.parse(saved);
                    this.pipelineBuilder.steps = config.steps || [];
                    this.pipelineBuilder.renderPipeline();
                    this.updateYAML();
                    this.updateStepCount();
                    this.showNotification('Saved pipeline loaded', 'success');
                } catch (e) {
                    this.showNotification('Failed to load saved pipeline', 'error');
                }
            } else {
                this.showNotification('No saved pipeline found', 'info');
            }
        }, 'load-saved');
        
        console.log('✅ Header buttons configured');
    }

    setupQuickActionButtons() {
        console.log('🔧 Setting up quick action buttons...');
        
        // Handle data-action buttons to avoid conflicts with main-init.js
        const actionButtons = document.querySelectorAll('[data-action]');
        actionButtons.forEach(button => {
            const action = button.dataset.action;
            
            // Skip if this button already has a handler
            if (this.attachedListeners.has(`data-action-${action}`)) {
                console.log(`Skipping ${action} - already has handler`);
                return;
            }
            
            this.addEventListenerOnce(button, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🎯 Quick action clicked: ${action}`);
                
                switch (action) {
                    case 'plugin-catalog':
                        window.showModal('plugin-catalog-modal');
                        this.populatePluginCatalog();
                        break;
                    case 'matrix-builder':
                        if (this.pipelineBuilder?.selectedStep?.type === 'command') {
                            window.showModal('matrix-builder-modal');
                            if (this.matrixBuilder) {
                                this.matrixBuilder.open(this.pipelineBuilder.selectedStep);
                            }
                        } else {
                            this.showNotification('Please select a command step first', 'info');
                        }
                        break;
                    case 'step-templates':
                        window.showModal('step-templates-modal');
                        this.populateTemplates();
                        break;
                    case 'pipeline-validator':
                        this.validatePipeline();
                        break;
                    case 'conditional-logic':
                        if (this.pipelineBuilder?.selectedStep) {
                            window.showModal('conditional-logic-modal');
                            if (window.conditionalLogicBuilder) {
                                window.conditionalLogicBuilder.openForStep(this.pipelineBuilder.selectedStep);
                            }
                        } else {
                            this.showNotification('Please select a step first', 'info');
                        }
                        break;
                    case 'variable-manager':
                        window.showModal('env-vars-modal');
                        if (window.envVarManager) {
                            // If a step is selected, switch to step tab
                            if (this.pipelineBuilder?.selectedStep) {
                                window.envVarManager.openForStep(this.pipelineBuilder.selectedStep.id);
                            } else {
                                // Otherwise show global variables
                                window.envVarManager.switchTab('global');
                            }
                        }
                        break;
                    case 'pattern-library':
                        window.showModal('patterns-modal');
                        break;
                    case 'dependency-manager':
                        window.showModal('dependency-manager-modal');
                        break;
                    case 'artifact-manager':
                        window.showModal('artifact-manager-modal');
                        if (window.artifactManager) {
                            // If a step is selected, open for that step
                            if (this.pipelineBuilder?.selectedStep && this.pipelineBuilder.selectedStep.type === 'command') {
                                window.artifactManager.openForStep(this.pipelineBuilder.selectedStep.id);
                            } else {
                                // Otherwise show the paths tab
                                window.artifactManager.switchTab('paths');
                            }
                        }
                        break;
                    case 'pipeline-preview':
                        // Show pipeline preview modal
                        window.showModal('pipeline-preview-modal');
                        // Let the visualizer handle the rendering
                        if (window.pipelineVisualizer) {
                            window.pipelineVisualizer.showPreview();
                        }
                        break;
                    case 'sdk-tools':
                        window.showModal('sdk-tools-modal');
                        this.setupSDKTools();
                        break;
                    default:
                        console.warn(`Unknown action: ${action}`);
                }
            }, `data-action-${action}`);
        });
        
        // Toggle YAML View
        this.addEventListenerOnce(document.getElementById('toggle-yaml'), 'click', () => {
            this.toggleYAMLView();
        }, 'toggle-yaml');
        
        // Validate Pipeline (header button)
        this.addEventListenerOnce(document.getElementById('validate-pipeline'), 'click', () => {
            this.validatePipeline();
        }, 'validate-pipeline');
        
        console.log('✅ Quick action buttons configured with', actionButtons.length, 'buttons');
    }

    setupPluginCatalog() {
        const modal = document.getElementById('plugin-catalog-modal');
        if (!modal) return;
        
        const searchInput = document.getElementById('plugin-search');
        const filterBtns = modal.querySelectorAll('.filter-btn');
        
        // Search functionality
        if (searchInput) {
            this.addEventListenerOnce(searchInput, 'input', (e) => {
                this.filterPlugins(e.target.value);
            }, 'plugin-search');
        }
        
        // Filter buttons
        filterBtns.forEach(btn => {
            this.addEventListenerOnce(btn, 'click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterPlugins(searchInput?.value || '', btn.dataset.filter);
            }, `plugin-filter-${btn.dataset.filter}`);
        });
        
        console.log('✅ Plugin catalog setup complete');
    }

    populatePluginCatalog() {
        const pluginList = document.getElementById('plugin-list');
        if (!pluginList || !this.pipelineBuilder?.pluginCatalog) return;
        
        const plugins = Object.entries(this.pipelineBuilder.pluginCatalog);
        
        pluginList.innerHTML = `
            <div class="plugin-grid">
                ${plugins.map(([key, plugin]) => `
                    <div class="plugin-card" data-plugin="${key}" data-category="${plugin.category || 'other'}">
                        <h4><i class="fas ${plugin.icon || 'fa-plug'}"></i> ${plugin.name}</h4>
                        <p>${plugin.description}</p>
                        <div class="plugin-meta">
                            <span class="plugin-category">${plugin.category || 'Other'}</span>
                            ${plugin.official ? '<span class="plugin-official">Official</span>' : ''}
                        </div>
                        <button class="btn btn-primary btn-small add-plugin-btn" data-plugin-key="${key}">
                            <i class="fas fa-plus"></i> Add to Pipeline
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers for plugin cards
        pluginList.querySelectorAll('.add-plugin-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const pluginKey = btn.dataset.pluginKey;
                this.addPluginToPipeline(pluginKey);
            });
        });
    }

    addPluginToPipeline(pluginKey) {
        if (!this.pipelineBuilder) return;
        
        const step = this.pipelineBuilder.addStep('command');
        if (step) {
            step.properties.label = `${this.pipelineBuilder.pluginCatalog[pluginKey].name} Step`;
            step.properties.plugins = {
                [pluginKey]: this.getDefaultPluginConfig(pluginKey)
            };
            this.pipelineBuilder.renderPipeline();
            this.updateYAML();
            this.updateStepCount();
            window.closeModal('plugin-catalog-modal');
            this.showNotification(`Added ${pluginKey} plugin to pipeline`, 'success');
        }
    }

    getDefaultPluginConfig(pluginKey) {
        const plugin = this.pipelineBuilder?.pluginCatalog[pluginKey];
        if (!plugin?.config) return {};
        
        const config = {};
        Object.entries(plugin.config).forEach(([key, def]) => {
            config[key] = def.default || '';
        });
        return config;
    }

    filterPlugins(searchTerm = '', category = 'all') {
        const pluginCards = document.querySelectorAll('.plugin-card');
        
        pluginCards.forEach(card => {
            const matchesSearch = !searchTerm || 
                card.textContent.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = category === 'all' || 
                card.dataset.category === category;
            
            card.style.display = matchesSearch && matchesCategory ? 'block' : 'none';
        });
    }

    setupMatrixBuilder() {
        const modal = document.getElementById('matrix-builder-modal');
        if (!modal) return;
        
        // Add dimension button
        this.addEventListenerOnce(document.getElementById('add-matrix-dimension'), 'click', () => {
            this.addMatrixDimension();
        }, 'add-matrix-dimension');
        
        // Apply matrix button
        this.addEventListenerOnce(document.getElementById('apply-matrix'), 'click', () => {
            this.applyMatrixConfiguration();
        }, 'apply-matrix');
        
        console.log('✅ Matrix Builder setup complete');
    }

    addMatrixDimension() {
        const dimensionsList = document.getElementById('matrix-dimensions-list');
        if (!dimensionsList) return;
        
        const dimensionId = `dimension-${Date.now()}`;
        const dimensionHtml = `
            <div class="matrix-dimension" id="${dimensionId}">
                <input type="text" class="dimension-name" placeholder="Variable name (e.g., os)">
                <input type="text" class="dimension-values" placeholder="Values (comma-separated, e.g., ubuntu, macos, windows)">
                <button class="btn btn-danger btn-small remove-dimension">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        dimensionsList.insertAdjacentHTML('beforeend', dimensionHtml);
        
        // Add remove handler
        const dimension = document.getElementById(dimensionId);
        dimension.querySelector('.remove-dimension').addEventListener('click', () => {
            dimension.remove();
            this.updateMatrixPreview();
        });
        
        // Update preview on input
        dimension.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => this.updateMatrixPreview());
        });
    }

    updateMatrixPreview() {
        const dimensions = document.querySelectorAll('.matrix-dimension');
        const previewContent = document.getElementById('matrix-preview-content');
        
        if (!previewContent) return;
        
        const matrix = {};
        dimensions.forEach(dim => {
            const name = dim.querySelector('.dimension-name').value.trim();
            const values = dim.querySelector('.dimension-values').value
                .split(',')
                .map(v => v.trim())
                .filter(v => v);
            
            if (name && values.length > 0) {
                matrix[name] = values;
            }
        });
        
        if (Object.keys(matrix).length === 0) {
            previewContent.innerHTML = '<p class="empty-state">Add dimensions to see matrix preview</p>';
            return;
        }
        
        // Calculate combinations
        const combinations = this.calculateMatrixCombinations(matrix);
        
        previewContent.innerHTML = `
            <div class="matrix-stats">
                <strong>Total combinations: ${combinations.length}</strong>
                ${combinations.length > this.pipelineBuilder?.limits?.maxMatrixJobs ? 
                    `<span class="warning"> (exceeds limit of ${this.pipelineBuilder.limits.maxMatrixJobs})</span>` : ''}
            </div>
            <div class="matrix-combinations">
                ${combinations.slice(0, 10).map(combo => `
                    <div class="combination-item">
                        ${Object.entries(combo).map(([k, v]) => `<span class="combo-var">${k}=${v}</span>`).join('')}
                    </div>
                `).join('')}
                ${combinations.length > 10 ? `<p>... and ${combinations.length - 10} more</p>` : ''}
            </div>
        `;
    }

    calculateMatrixCombinations(matrix) {
        const keys = Object.keys(matrix);
        if (keys.length === 0) return [];
        
        const combinations = [];
        const generate = (index, current) => {
            if (index === keys.length) {
                combinations.push({...current});
                return;
            }
            
            const key = keys[index];
            matrix[key].forEach(value => {
                current[key] = value;
                generate(index + 1, current);
            });
        };
        
        generate(0, {});
        return combinations;
    }

    applyMatrixConfiguration() {
        if (!this.pipelineBuilder?.selectedStep) {
            this.showNotification('Please select a step first', 'warning');
            return;
        }
        
        const dimensions = document.querySelectorAll('.matrix-dimension');
        const matrix = [];
        
        dimensions.forEach(dim => {
            const name = dim.querySelector('.dimension-name').value.trim();
            const values = dim.querySelector('.dimension-values').value
                .split(',')
                .map(v => v.trim())
                .filter(v => v);
            
            if (name && values.length > 0) {
                const matrixItem = {};
                matrixItem[name] = values;
                matrix.push(matrixItem);
            }
        });
        
        if (matrix.length > 0) {
            this.pipelineBuilder.selectedStep.properties.matrix = matrix;
            this.pipelineBuilder.renderProperties();
            this.updateYAML();
            window.closeModal('matrix-builder-modal');
            this.showNotification('Matrix configuration applied', 'success');
        } else {
            this.showNotification('Please add at least one dimension', 'warning');
        }
    }

    setupStepTemplates() {
        console.log('✅ Step templates setup complete');
    }

    populateTemplates() {
        const templateList = document.getElementById('template-list');
        if (!templateList || !window.pipelineTemplates) return;
        
        // Don't overwrite the existing HTML templates
        // Instead, add click handlers to existing template items
        const templateItems = templateList.querySelectorAll('.template-item');
        
        templateItems.forEach(item => {
            // Remove any existing click handlers
            const oldItem = item.cloneNode(true);
            item.parentNode.replaceChild(oldItem, item);
            
            // Add new click handler
            oldItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const templateName = oldItem.dataset.template;
                console.log(`🎯 Template clicked: ${templateName}`);
                
                // Map template names from HTML to pipeline-templates.js keys
                const templateMapping = {
                    // Testing templates
                    'unit-tests': 'node-app',
                    'integration-tests': 'node-app',
                    'parallel-tests': 'parallel-testing',
                    'security-scan': 'security-scan',
                    
                    // Build templates
                    'node-build': 'node-app',
                    'python-build': 'python-ml',
                    'go-build': 'monorepo',
                    'multi-arch-build': 'docker-microservice',
                    
                    // Docker templates
                    'docker-basic': 'docker-microservice',
                    'docker-compose': 'docker-microservice',
                    'docker-registry': 'docker-microservice',
                    'docker-multi-stage': 'docker-microservice',
                    
                    // Deployment templates
                    'kubernetes-deploy': 'approval-workflow',
                    'aws-deploy': 'terraform-infra',
                    'manual-approval': 'approval-workflow',
                    'blue-green': 'approval-workflow',
                    
                    // Security templates
                    'sast-scan': 'security-scan',
                    'dependency-check': 'security-scan',
                    'container-scan': 'security-scan',
                    'compliance-check': 'security-scan',
                    
                    // Notification templates
                    'slack-notify': 'node-app',
                    'email-notify': 'node-app',
                    'webhook-notify': 'node-app',
                    'status-update': 'node-app'
                };
                
                const mappedTemplate = templateMapping[templateName] || templateName;
                
                if (window.pipelineTemplates && window.pipelineTemplates.templates[mappedTemplate]) {
                    window.pipelineTemplates.loadTemplate(mappedTemplate);
                    window.closeModal('step-templates-modal');
                    this.updateYAML();
                    this.updateStepCount();
                    this.showNotification(`Applied ${templateName} template`, 'success');
                } else {
                    // Try the main-init.js handler
                    if (window.buildkiteApp && window.buildkiteApp.handleTemplateClick) {
                        window.buildkiteApp.handleTemplateClick(templateName);
                        window.closeModal('step-templates-modal');
                    } else {
                        this.showNotification(`Template "${templateName}" not found`, 'warning');
                    }
                }
            });
            
            // Add hover effect
            oldItem.style.cursor = 'pointer';
        });
        
        // Setup category filters
        const categoryButtons = document.querySelectorAll('.template-cat');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.dataset.category;
                
                // Update active state
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show/hide categories
                const categories = templateList.querySelectorAll('.template-category');
                categories.forEach(cat => {
                    if (category === 'all' || cat.dataset.category === category) {
                        cat.style.display = 'block';
                    } else {
                        cat.style.display = 'none';
                    }
                });
            });
        });
    }

    setupCommandPalette() {
        const input = document.getElementById('command-search');
        if (!input) return;
        
        this.addEventListenerOnce(input, 'input', (e) => {
            this.filterCommands(e.target.value);
        }, 'command-search');
        
        // Handle command selection
        this.addEventListenerOnce(input, 'keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const selected = document.querySelector('.command-item.selected');
                if (selected) {
                    const action = selected.dataset.action;
                    this.executeCommand(action);
                    this.closeCommandPalette();
                }
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateCommands(e.key === 'ArrowDown' ? 1 : -1);
            }
        }, 'command-navigation');
        
        // Click handlers for command items
        document.querySelectorAll('.command-item').forEach(item => {
            this.addEventListenerOnce(item, 'click', () => {
                this.executeCommand(item.dataset.action);
                this.closeCommandPalette();
            }, `command-${item.dataset.action}`);
        });
        
        console.log('✅ Command palette setup complete');
    }

    filterCommands(searchTerm) {
        const commandItems = document.querySelectorAll('.command-item');
        let visibleIndex = 0;
        
        commandItems.forEach((item, index) => {
            const matches = !searchTerm || 
                item.textContent.toLowerCase().includes(searchTerm.toLowerCase());
            
            item.style.display = matches ? 'flex' : 'none';
            item.classList.remove('selected');
            
            if (matches && visibleIndex === 0) {
                item.classList.add('selected');
                this.currentCommandIndex = index;
            }
            
            if (matches) visibleIndex++;
        });
    }

    navigateCommands(direction) {
        const visibleCommands = Array.from(document.querySelectorAll('.command-item')).filter(
            item => item.style.display !== 'none'
        );
        
        if (visibleCommands.length === 0) return;
        
        const currentSelected = visibleCommands.findIndex(item => item.classList.contains('selected'));
        let newIndex = currentSelected + direction;
        
        if (newIndex < 0) newIndex = visibleCommands.length - 1;
        if (newIndex >= visibleCommands.length) newIndex = 0;
        
        visibleCommands.forEach((item, index) => {
            item.classList.toggle('selected', index === newIndex);
        });
        
        this.currentCommandIndex = newIndex;
    }

    executeCommand(action) {
        const actions = {
            'add-command-step': () => this.pipelineBuilder?.addStep('command'),
            'add-wait-step': () => this.pipelineBuilder?.addStep('wait'),
            'add-block-step': () => this.pipelineBuilder?.addStep('block'),
            'add-input-step': () => this.pipelineBuilder?.addStep('input'),
            'add-trigger-step': () => this.pipelineBuilder?.addStep('trigger'),
            'add-group-step': () => this.pipelineBuilder?.addStep('group'),
            'export-yaml': () => this.exportYAML(),
            'import-yaml': () => document.getElementById('import-file')?.click(),
            'clear-pipeline': () => {
                if (confirm('Are you sure you want to clear the pipeline?')) {
                    this.pipelineBuilder?.clearPipeline();
                }
            },
            'load-example': () => this.pipelineBuilder?.loadExample(),
            'toggle-yaml': () => this.toggleYAMLView(),
            'save-pipeline': () => this.savePipeline(),
            'plugin-catalog': () => {
                window.showModal('plugin-catalog-modal');
                this.populatePluginCatalog();
            },
            'matrix-builder': () => {
                if (this.pipelineBuilder?.selectedStep?.type === 'command') {
                    window.showModal('matrix-builder-modal');
                } else {
                    this.showNotification('Select a command step first', 'info');
                }
            },
            'step-templates': () => {
                window.showModal('step-templates-modal');
                this.populateTemplates();
            },
            'validate-pipeline': () => this.validatePipeline(),
            'share-pipeline': () => this.pipelineSharing?.sharePipeline(),
            'keyboard-shortcuts': () => this.showKeyboardShortcuts(),
        };
        
        const action_fn = actions[action];
        if (action_fn) {
            action_fn();
            this.updateYAML();
            this.updateStepCount();
        }
    }

    setupYamlOutputHandlers() {
        const copyBtn = document.getElementById('copy-yaml');
        const downloadBtn = document.getElementById('download-yaml');
        const validateBtn = document.getElementById('validate-yaml');
        const copyInlineBtn = document.getElementById('copy-yaml-inline');
        const validateInlineBtn = document.getElementById('validate-yaml-inline');
        
        if (copyBtn) {
            this.addEventListenerOnce(copyBtn, 'click', () => {
                const yamlContent = document.getElementById('yaml-content')?.textContent;
                if (yamlContent) {
                    navigator.clipboard.writeText(yamlContent).then(() => {
                        this.showNotification('YAML copied to clipboard', 'success');
                    }).catch(() => {
                        this.showNotification('Failed to copy YAML', 'error');
                    });
                }
            }, 'copy-yaml');
        }
        
        // Copy YAML Preview button
        const copyPreviewBtn = document.getElementById('copy-yaml-preview');
        if (copyPreviewBtn) {
            this.addEventListenerOnce(copyPreviewBtn, 'click', () => {
                const yamlContent = document.getElementById('yaml-output')?.textContent;
                if (yamlContent) {
                    navigator.clipboard.writeText(yamlContent).then(() => {
                        this.showNotification('YAML copied to clipboard', 'success');
                    }).catch(() => {
                        this.showNotification('Failed to copy YAML', 'error');
                    });
                }
            }, 'copy-yaml-preview');
        }
        
        if (copyInlineBtn) {
            this.addEventListenerOnce(copyInlineBtn, 'click', () => {
                const yamlContent = document.getElementById('yaml-output')?.textContent;
                if (yamlContent) {
                    navigator.clipboard.writeText(yamlContent).then(() => {
                        this.showNotification('YAML copied to clipboard', 'success');
                    }).catch(() => {
                        this.showNotification('Failed to copy YAML', 'error');
                    });
                }
            }, 'copy-yaml-inline');
        }
        
        if (downloadBtn) {
            this.addEventListenerOnce(downloadBtn, 'click', () => {
                const yamlContent = document.getElementById('yaml-content')?.textContent;
                if (yamlContent && this.yamlGenerator) {
                    this.yamlGenerator.downloadYAML(yamlContent, 'pipeline.yml');
                    this.showNotification('YAML downloaded', 'success');
                }
            }, 'download-yaml');
        }
        
        if (validateBtn) {
            this.addEventListenerOnce(validateBtn, 'click', () => {
                this.validateYAML();
            }, 'validate-yaml');
        }
        
        if (validateInlineBtn) {
            this.addEventListenerOnce(validateInlineBtn, 'click', () => {
                this.validateYAML();
            }, 'validate-yaml-inline');
        }
        
        console.log('✅ YAML output handlers configured');
    }

    setupImportExportHandlers() {
        const importFile = document.getElementById('import-file');
        if (importFile) {
            this.addEventListenerOnce(importFile, 'change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importYAMLFile(file);
                }
            }, 'import-file');
        }
        
        console.log('✅ Import/Export handlers configured');
    }

    setupPipelineSharing() {
        // Check URL for shared pipeline on load
        if (this.pipelineSharing) {
            this.pipelineSharing.checkForSharedPipeline();
        }
        
        console.log('✅ Pipeline sharing configured');
    }

    setupValidationHandlers() {
        console.log('✅ Validation handlers configured');
    }

    setupStepCountUpdater() {
        // Update step count whenever pipeline changes
        if (this.pipelineBuilder) {
            // Override renderPipeline to update count
            const originalRender = this.pipelineBuilder.renderPipeline;
            this.pipelineBuilder.renderPipeline = function() {
                originalRender.call(this);
                if (window.buildkiteApp) {
                    window.buildkiteApp.updateStepCount();
                }
            };
        }
        
        console.log('✅ Step count updater configured');
    }

    setupPropertiesUpdates() {
        // Ensure properties update triggers YAML update
        if (this.pipelineBuilder) {
            const originalRenderProps = this.pipelineBuilder.renderProperties;
            this.pipelineBuilder.renderProperties = function() {
                originalRenderProps.call(this);
                if (window.buildkiteApp) {
                    window.buildkiteApp.updateYAML();
                }
            };
        }
        
        console.log('✅ Properties update handlers configured');
    }

    setupFileDropZone() {
        const dropZone = document.getElementById('pipeline-steps');
        if (!dropZone) return;
        
        // Prevent default file drop on the whole page
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.addEventListener(eventName, (e) => {
                if (e.dataTransfer?.files?.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, false);
        });
        
        console.log('✅ File drop zone configured');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggleCommandPalette();
            }
            
            // Save pipeline
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.savePipeline();
            }
            
            // Export YAML
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportYAML();
            }
            
            // Load example
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.pipelineBuilder?.loadExample();
                this.updateYAML();
                this.updateStepCount();
            }
            
            // Toggle YAML view
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.toggleYAMLView();
            }
            
            // Delete selected step
            if (e.key === 'Delete' && this.pipelineBuilder?.selectedStep) {
                e.preventDefault();
                const stepId = this.pipelineBuilder.selectedStep.id;
                if (confirm('Delete this step?')) {
                    this.pipelineBuilder.deleteStep(stepId);
                    this.updateYAML();
                    this.updateStepCount();
                }
            }
            
            // Duplicate selected step
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && this.pipelineBuilder?.selectedStep) {
                e.preventDefault();
                const stepId = this.pipelineBuilder.selectedStep.id;
                this.pipelineBuilder.duplicateStep(stepId);
                this.updateYAML();
                this.updateStepCount();
            }
        });
        
        console.log('✅ Keyboard shortcuts configured');
    }

    initializeFeatures() {
        // Load from localStorage if available
        this.loadFromLocalStorage();
        
        // Update YAML on first load
        this.updateYAML();
        
        // Update step count
        this.updateStepCount();
        
        // Check for shared pipeline
        if (this.pipelineSharing) {
            this.pipelineSharing.checkForSharedPipeline();
        }
        
        // Initialize syntax highlighting styles
        this.initializeYAMLSyntaxStyles();
        
        console.log('✅ Features initialized');
    }

    initializeYAMLSyntaxStyles() {
        if (!document.getElementById('yaml-syntax-styles')) {
            const yamlStyles = `
                .yaml-key { color: #e06c75; font-weight: 600; }
                .yaml-string { color: #98c379; }
                .yaml-number { color: #d19a66; }
                .yaml-boolean { color: #56b6c2; }
                .yaml-array { color: #c678dd; }
                .yaml-variable { color: #61afef; font-style: italic; }
            `;
            
            const styleSheet = document.createElement('style');
            styleSheet.id = 'yaml-syntax-styles';
            styleSheet.textContent = yamlStyles;
            document.head.appendChild(styleSheet);
        }
    }

    startAutoSave() {
        if (this.autoSaveEnabled) {
            this.autoSaveInterval = setInterval(() => {
                this.saveToLocalStorage();
            }, 30000); // Auto-save every 30 seconds
        }
        
        console.log('✅ Auto-save started');
    }

    finalizeInitialization() {
        // Remove loading overlay if exists
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        // Show welcome message
        if (!localStorage.getItem('buildkite-welcome-shown')) {
            this.showNotification('Welcome to Buildkite Pipeline Builder! Press Ctrl+K to open command palette.', 'info', 5000);
            localStorage.setItem('buildkite-welcome-shown', 'true');
        }
        
        // Debug final state
        if (this.debugMode) {
            this.debugFinalState();
        }
        
        console.log('✅ Finalization complete');
    }

    debugFinalState() {
        console.log('🔍 Final state debug:');
        console.log(`🏗️ Pipeline Builder: ${this.pipelineBuilder ? '✅' : '❌'}`);
        console.log(`📋 YAML Generator: ${this.yamlGenerator ? '✅' : '❌'}`);
        console.log(`🔢 Matrix Builder: ${this.matrixBuilder ? '✅' : '❌'}`);
        console.log(`🔀 Conditional Logic: ${this.conditionalLogicBuilder ? '✅' : '❌'}`);
        console.log(`🔗 Pipeline Sharing: ${this.pipelineSharing ? '✅' : '❌'}`);
        console.log(`⌨️ Command Palette: ${this.commandPalette ? '✅' : '❌'}`);
        console.log(`📊 Steps in pipeline: ${this.pipelineBuilder?.steps?.length || 0}`);
        console.log(`💾 Auto-save: ${this.autoSaveEnabled ? '✅' : '❌'}`);
        console.log('🚀 COMPLETE Pipeline Builder ready!');
    }

    // Helper Methods
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
        
        if (this.debugMode) {
            console.log(`✅ Event listener attached: ${key}`);
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container') || 
                         document.getElementById('toast-container');
        
        if (!container) {
            console.warn('No notification container found');
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    showToast(message, type = 'info') {
        this.showNotification(message, type);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    showErrorMessage(message) {
        this.showNotification(message, 'error', 5000);
    }

    // Command Palette Methods
    toggleCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (!palette) return;
        
        const isHidden = palette.classList.contains('hidden');
        
        if (isHidden) {
            palette.classList.remove('hidden');
            palette.style.display = 'block';
            const input = document.getElementById('command-search');
            if (input) {
                input.value = '';
                input.focus();
                this.filterCommands(''); // Show all commands
            }
        } else {
            this.closeCommandPalette();
        }
    }

    closeCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.add('hidden');
            palette.style.display = 'none';
        }
    }

    // Pipeline Operations
    updateYAML() {
        if (!this.yamlGenerator || !this.pipelineBuilder) {
            console.warn('YAML generator or pipeline builder not available');
            return;
        }
        
        const config = this.pipelineBuilder.exportConfig();
        const yaml = this.yamlGenerator.generate(config);
        
        // Update all YAML display areas
        const yamlContent = document.getElementById('yaml-content');
        if (yamlContent) {
            yamlContent.textContent = yaml;
        }
        
        const yamlOutput = document.getElementById('yaml-output');
        if (yamlOutput) {
            yamlOutput.textContent = yaml;
        }
        
        const modalYamlContent = document.getElementById('modal-yaml-content');
        if (modalYamlContent) {
            modalYamlContent.textContent = yaml;
        }
        
        // Save to localStorage
        this.saveToLocalStorage();
    }

    updateStepCount() {
        const stepCount = document.getElementById('step-count');
        if (stepCount && this.pipelineBuilder) {
            const count = this.pipelineBuilder.steps.length;
            stepCount.textContent = `${count} step${count !== 1 ? 's' : ''}`;
        }
    }

    exportYAML() {
        const yamlContent = document.getElementById('yaml-content')?.textContent || 
                           document.getElementById('yaml-output')?.textContent ||
                           (this.yamlGenerator && this.pipelineBuilder ? 
                            this.yamlGenerator.generate(this.pipelineBuilder.exportConfig()) : '');
        
        if (!yamlContent) {
            this.showNotification('No YAML content to export', 'warning');
            return;
        }
        
        // Show export modal
        window.showModal('yaml-output-modal');
        
        // Update modal content
        const modalYamlContent = document.getElementById('yaml-content');
        if (modalYamlContent) {
            modalYamlContent.textContent = yamlContent;
        }
    }

    importYAMLFile(file) {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                // const yamlContent = e.target.result;
                // Here you would parse YAML to pipeline config
                // For now, just show a message
                this.showNotification('YAML import functionality coming soon', 'info');
            } catch (error) {
                this.showNotification('Failed to import YAML file', 'error');
            }
        };
        reader.readAsText(file);
    }

    toggleYAMLView() {
        const yamlSection = document.getElementById('yaml-preview');
        const toggleBtn = document.getElementById('toggle-yaml');
        
        if (!yamlSection) {
            console.warn('YAML preview section not found');
            return;
        }
        
        this.yamlVisible = !this.yamlVisible;
        yamlSection.style.display = this.yamlVisible ? 'block' : 'none';
        
        // Update button text
        if (toggleBtn) {
            toggleBtn.innerHTML = this.yamlVisible ? 
                '<i class="fas fa-code"></i> Hide YAML' : 
                '<i class="fas fa-code"></i> Show YAML';
        }
        
        if (this.yamlVisible) {
            this.updateYAML();
        }
        
        this.showNotification(`YAML view ${this.yamlVisible ? 'shown' : 'hidden'}`, 'info');
    }

    setupSDKTools() {
        console.log('🔧 Setting up SDK tools...');
        
        if (!window.buildkiteSDK) {
            console.error('Buildkite SDK integration not loaded');
            this.showNotification('SDK tools not available', 'error');
            return;
        }
        
        // Export SDK Code button
        const exportBtn = document.getElementById('export-sdk-code');
        if (exportBtn) {
            exportBtn.onclick = () => {
                const language = document.querySelector('input[name="sdk-language"]:checked')?.value || 'javascript';
                const sdkCode = window.buildkiteSDK.generateSDKCode(this.pipelineBuilder.steps, language);
                
                // Display the code
                const codeDisplay = document.getElementById('sdk-code-display');
                const codeContent = document.getElementById('sdk-code-content');
                if (codeDisplay && codeContent) {
                    codeContent.textContent = sdkCode;
                    codeDisplay.style.display = 'block';
                    
                    // Highlight syntax if possible
                    if (window.Prism) {
                        Prism.highlightElement(codeContent);
                    }
                }
                
                this.showNotification(`Generated ${language} SDK code`, 'success');
            };
        }
        
        // Import SDK Code button
        const importBtn = document.getElementById('import-sdk-code');
        if (importBtn) {
            importBtn.onclick = () => {
                const codeInput = document.getElementById('sdk-import-code');
                if (!codeInput?.value) {
                    this.showNotification('Please paste SDK code to import', 'warning');
                    return;
                }
                
                try {
                    const steps = window.buildkiteSDK.parseSDKCode(codeInput.value);
                    if (steps.length > 0) {
                        this.pipelineBuilder.steps = steps;
                        this.pipelineBuilder.renderPipeline();
                        this.updateYAML();
                        this.updateStepCount();
                        window.closeModal('sdk-tools-modal');
                        this.showNotification('SDK code imported successfully', 'success');
                    } else {
                        this.showNotification('No valid steps found in SDK code', 'warning');
                    }
                } catch (error) {
                    console.error('Failed to parse SDK code:', error);
                    this.showNotification('Failed to parse SDK code', 'error');
                }
            };
        }
        
        // Validate SDK button
        const validateBtn = document.getElementById('validate-sdk');
        if (validateBtn) {
            validateBtn.onclick = () => {
                const validation = window.buildkiteSDK.validatePipeline(this.pipelineBuilder.steps);
                const resultsDiv = document.getElementById('sdk-validation-results');
                
                if (resultsDiv) {
                    let html = '';
                    if (validation.valid) {
                        resultsDiv.className = 'validation-results success';
                        html = '<h5><i class="fas fa-check-circle"></i> Pipeline is valid!</h5>';
                        if (validation.warnings.length > 0) {
                            html += '<h5><i class="fas fa-exclamation-triangle"></i> Warnings:</h5><ul>';
                            validation.warnings.forEach(warning => {
                                html += `<li>${warning}</li>`;
                            });
                            html += '</ul>';
                        }
                    } else {
                        resultsDiv.className = 'validation-results error';
                        html = '<h5><i class="fas fa-times-circle"></i> Validation Errors:</h5><ul>';
                        validation.errors.forEach(error => {
                            html += `<li>${error}</li>`;
                        });
                        html += '</ul>';
                        
                        if (validation.warnings.length > 0) {
                            html += '<h5><i class="fas fa-exclamation-triangle"></i> Warnings:</h5><ul>';
                            validation.warnings.forEach(warning => {
                                html += `<li>${warning}</li>`;
                            });
                            html += '</ul>';
                        }
                    }
                    
                    resultsDiv.innerHTML = html;
                    resultsDiv.style.display = 'block';
                }
            };
        }
        
        // Copy SDK Code button
        const copyBtn = document.getElementById('copy-sdk-code');
        if (copyBtn) {
            copyBtn.onclick = () => {
                const codeContent = document.getElementById('sdk-code-content');
                if (codeContent) {
                    navigator.clipboard.writeText(codeContent.textContent)
                        .then(() => this.showNotification('Code copied to clipboard', 'success'))
                        .catch(() => this.showNotification('Failed to copy code', 'error'));
                }
            };
        }
        
        // Download SDK Code button
        const downloadBtn = document.getElementById('download-sdk-code');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                const codeContent = document.getElementById('sdk-code-content');
                const language = document.querySelector('input[name="sdk-language"]:checked')?.value || 'javascript';
                const extension = language === 'typescript' ? 'ts' : 'js';
                
                if (codeContent) {
                    const blob = new Blob([codeContent.textContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pipeline.${extension}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    this.showNotification('SDK code downloaded', 'success');
                }
            };
        }
        
        console.log('✅ SDK tools configured');
    }
    
    validatePipeline() {
        if (!this.pipelineBuilder?.steps || this.pipelineBuilder.steps.length === 0) {
            this.showNotification('Pipeline is empty', 'warning');
            return;
        }
        
        const errors = [];
        const warnings = [];
        
        // Check for duplicate step labels
        const labels = this.pipelineBuilder.steps
            .filter(s => s.properties?.label)
            .map(s => s.properties.label);
        const duplicates = labels.filter((label, index) => labels.indexOf(label) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate step labels: ${[...new Set(duplicates)].join(', ')}`);
        }
        
        // Check for duplicate keys
        const keys = this.pipelineBuilder.steps
            .filter(s => s.properties?.key)
            .map(s => s.properties.key);
        const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
        if (duplicateKeys.length > 0) {
            errors.push(`Duplicate step keys: ${[...new Set(duplicateKeys)].join(', ')}`);
        }
        
        // Check dependencies
        this.pipelineBuilder.steps.forEach(step => {
            if (step.properties?.depends_on) {
                const deps = Array.isArray(step.properties.depends_on) ? 
                    step.properties.depends_on : [step.properties.depends_on];
                
                deps.forEach(dep => {
                    if (dep !== 'wait' && !keys.includes(dep)) {
                        warnings.push(`Step "${step.properties.label || step.id}" depends on unknown step "${dep}"`);
                    }
                });
            }
        });
        
        // Check matrix limits
        this.pipelineBuilder.steps.forEach(step => {
            if (step.properties?.matrix) {
                const combinations = this.calculateMatrixCombinations(
                    step.properties.matrix.reduce((acc, m) => ({...acc, ...m}), {})
                );
                if (combinations.length > this.pipelineBuilder.limits.maxMatrixJobs) {
                    errors.push(`Step "${step.properties.label}" matrix exceeds limit (${combinations.length} > ${this.pipelineBuilder.limits.maxMatrixJobs})`);
                }
            }
        });
        
        // Run SDK validation if available
        if (window.buildkiteSDK) {
            const sdkValidation = window.buildkiteSDK.validatePipeline(this.pipelineBuilder.steps);
            errors.push(...sdkValidation.errors);
            warnings.push(...sdkValidation.warnings);
        }
        
        // Show results
        if (errors.length === 0 && warnings.length === 0) {
            this.showNotification('Pipeline validation passed!', 'success');
        } else {
            const modal = document.getElementById('validation-modal');
            const content = document.getElementById('validation-content');
            
            if (modal && content) {
                content.innerHTML = `
                    ${errors.length > 0 ? `
                        <h4 class="error">Errors (${errors.length})</h4>
                        <ul class="error-list">
                            ${errors.map(e => `<li>${e}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${warnings.length > 0 ? `
                        <h4 class="warning">Warnings (${warnings.length})</h4>
                        <ul class="warning-list">
                            ${warnings.map(w => `<li>${w}</li>`).join('')}
                        </ul>
                    ` : ''}
                `;
                window.showModal('validation-modal');
            } else {
                this.showNotification(
                    `Validation found ${errors.length} error(s) and ${warnings.length} warning(s)`, 
                    errors.length > 0 ? 'error' : 'warning',
                    5000
                );
            }
        }
    }

    validateYAML() {
        const yamlContent = document.getElementById('yaml-content')?.textContent ||
                           document.getElementById('yaml-output')?.textContent;
        
        if (!yamlContent || !this.yamlGenerator) return;
        
        const result = this.yamlGenerator.validateYAML(yamlContent);
        const validationContent = document.getElementById('validation-content') ||
                                 document.getElementById('validation-result');
        
        if (validationContent) {
            if (result.valid) {
                validationContent.innerHTML = '<p style="color: green;"><i class="fas fa-check"></i> YAML is valid!</p>';
                this.showNotification('YAML validation passed', 'success');
            } else {
                validationContent.innerHTML = `
                    <p style="color: red;"><i class="fas fa-times"></i> YAML validation failed:</p>
                    <ul>${result.errors.map(e => `<li>${e}</li>`).join('')}</ul>
                `;
                this.showNotification('YAML validation failed', 'error');
            }
        }
    }

    savePipeline() {
        this.saveToLocalStorage();
        this.showNotification('Pipeline saved locally', 'success');
    }

    saveToLocalStorage() {
        if (!this.pipelineBuilder) return;
        
        const config = this.pipelineBuilder.exportConfig();
        localStorage.setItem('buildkite-pipeline', JSON.stringify(config));
        localStorage.setItem('buildkite-pipeline-updated', new Date().toISOString());
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('buildkite-pipeline');
        if (saved && this.pipelineBuilder) {
            try {
                const config = JSON.parse(saved);
                this.pipelineBuilder.steps = config.steps || [];
                this.pipelineBuilder.renderPipeline();
                this.updateYAML();
                this.updateStepCount();
                console.log('✅ Pipeline loaded from localStorage');
            } catch (e) {
                console.error('Failed to load from localStorage:', e);
            }
        }
    }

    showKeyboardShortcuts() {
        const shortcuts = [
            { keys: 'Ctrl/Cmd + K', description: 'Open command palette' },
            { keys: 'Ctrl/Cmd + S', description: 'Save pipeline' },
            { keys: 'Ctrl/Cmd + E', description: 'Export YAML' },
            { keys: 'Ctrl/Cmd + O', description: 'Load example' },
            { keys: 'Ctrl/Cmd + Y', description: 'Toggle YAML view' },
            { keys: 'Delete', description: 'Delete selected step' },
            { keys: 'Ctrl/Cmd + D', description: 'Duplicate selected step' },
            { keys: 'Escape', description: 'Close modals' }
        ];
        
        const content = shortcuts.map(s => `${s.keys}: ${s.description}`).join('\n');
        alert('Keyboard Shortcuts:\n\n' + content);
    }

    // Debug Methods
    debugState() {
        console.group('🔍 Application State Debug');
        console.log('Pipeline Steps:', this.pipelineBuilder?.steps || []);
        console.log('Selected Step:', this.pipelineBuilder?.selectedStep);
        console.log('Auto-save enabled:', this.autoSaveEnabled);
        console.log('YAML visible:', this.yamlVisible);
        console.log('Attached listeners:', this.attachedListeners.size);
        console.log('Components:', {
            pipelineBuilder: !!this.pipelineBuilder,
            yamlGenerator: !!this.yamlGenerator,
            matrixBuilder: !!this.matrixBuilder,
            conditionalLogicBuilder: !!this.conditionalLogicBuilder,
            pipelineSharing: !!this.pipelineSharing,
            commandPalette: !!this.commandPalette
        });
        console.groupEnd();
    }

    exportConfig() {
        return this.pipelineBuilder?.exportConfig() || { steps: [] };
    }

    importConfig(config) {
        if (!this.pipelineBuilder || !config) return;
        
        this.pipelineBuilder.steps = config.steps || [];
        this.pipelineBuilder.renderPipeline();
        this.updateYAML();
        this.updateStepCount();
        this.showNotification('Configuration imported', 'success');
    }

    toggleAutoSave() {
        this.autoSaveEnabled = !this.autoSaveEnabled;
        
        if (this.autoSaveEnabled) {
            this.startAutoSave();
            this.showNotification('Auto-save enabled', 'success');
        } else {
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                this.autoSaveInterval = null;
            }
            this.showNotification('Auto-save disabled', 'info');
        }
    }

    refreshPipeline() {
        if (this.pipelineBuilder) {
            this.pipelineBuilder.renderPipeline();
            this.updateYAML();
            this.updateStepCount();
            this.showNotification('Pipeline refreshed', 'info');
        }
    }

    forceSave() {
        this.saveToLocalStorage();
        this.showNotification('Pipeline force saved', 'success');
    }

    clearLocalStorage() {
        if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
            localStorage.removeItem('buildkite-pipeline');
            localStorage.removeItem('buildkite-pipeline-updated');
            localStorage.removeItem('buildkite-welcome-shown');
            this.showNotification('Local storage cleared', 'info');
        }
    }

    resetApplication() {
        if (confirm('Are you sure you want to reset the application? This will clear the pipeline and reload the page.')) {
            this.clearLocalStorage();
            this.pipelineBuilder?.clearPipeline();
            window.location.reload();
        }
    }

    getVersion() {
        return 'Enhanced Buildkite Pipeline Builder v3.0 - Complete Consolidated Version';
    }

    showHelp() {
        const helpText = `
🎯 Keyboard Shortcuts:
- Ctrl/Cmd + K: Open command palette
- Ctrl/Cmd + S: Save pipeline
- Ctrl/Cmd + E: Export YAML
- Ctrl/Cmd + O: Load example
- Ctrl/Cmd + Y: Toggle YAML view
- Delete: Delete selected step
- Ctrl/Cmd + D: Duplicate selected step
- Escape: Close modals

📚 Available in console:
- window.buildkiteApp: Main application
- window.pipelineBuilder: Pipeline builder
- buildkiteApp.debugState(): Show debug info
- buildkiteApp.exportConfig(): Export pipeline config
- buildkiteApp.importConfig(config): Import pipeline config
- buildkiteApp.toggleAutoSave(): Toggle auto-save
- buildkiteApp.refreshPipeline(): Refresh pipeline view
- buildkiteApp.forceSave(): Force save pipeline
- buildkiteApp.clearLocalStorage(): Clear saved data
- buildkiteApp.resetApplication(): Reset application
        `;
        console.log(helpText);
        this.showNotification('Help information logged to console', 'info');
    }

    // Additional utility methods that might have been in the original
    verifyFunctionality() {
        console.log('🔍 Verifying COMPLETE functionality...');
        
        const tests = [
            {
                name: 'Pipeline Builder exists',
                test: () => !!this.pipelineBuilder,
                critical: true
            },
            {
                name: 'YAML Generator available',
                test: () => !!this.yamlGenerator,
                critical: true
            },
            {
                name: 'Pipeline steps container exists',
                test: () => !!document.getElementById('pipeline-steps'),
                critical: true
            },
            {
                name: 'Properties panel exists',
                test: () => !!document.getElementById('properties-content'),
                critical: true
            },
            {
                name: 'Header buttons exist',
                test: () => !!document.getElementById('export-yaml') && 
                           !!document.getElementById('clear-pipeline') && 
                           !!document.getElementById('load-example'),
                critical: true
            },
            {
                name: 'Modal management working',
                test: () => typeof window.closeModal === 'function' && 
                           typeof window.showModal === 'function',
                critical: false
            },
            {
                name: 'Enhanced styles injected',
                test: () => !!document.getElementById('enhanced-styles'),
                critical: false
            },
            {
                name: 'Command palette available',
                test: () => !!document.getElementById('command-palette'),
                critical: false
            },
            {
                name: 'Plugin catalog populated',
                test: () => Object.keys(this.pipelineBuilder?.pluginCatalog || {}).length > 0,
                critical: false
            },
            {
                name: 'Templates available',
                test: () => !!window.pipelineTemplates,
                critical: false
            }
        ];
        
        let passedTests = 0;
        let criticalFailures = 0;
        
        tests.forEach(test => {
            const passed = test.test();
            if (passed) {
                console.log(`✅ ${test.name}`);
                passedTests++;
            } else {
                console.log(`❌ ${test.name}`);
                if (test.critical) {
                    criticalFailures++;
                }
            }
        });
        
        console.log(`📊 Functionality verification: ${passedTests}/${tests.length} tests passed`);
        
        if (criticalFailures > 0) {
            console.error(`❌ ${criticalFailures} critical functionality failures detected`);
        } else {
            console.log('✅ All critical functionality verified');
        }
        
        return { passedTests, totalTests: tests.length, criticalFailures };
    }

    // API Integration Methods
    showAPIStatus(connected) {
        const statusElement = document.getElementById('api-status');
        if (statusElement) {
            if (connected) {
                statusElement.classList.add('connected');
                statusElement.classList.remove('disconnected');
                statusElement.innerHTML = '<i class="fas fa-circle"></i><span>API Connected</span>';
            } else {
                statusElement.classList.remove('connected');
                statusElement.classList.add('disconnected');
                statusElement.innerHTML = '<i class="fas fa-circle"></i><span>API Disconnected</span>';
            }
        }
    }

    setupAPIHandlers() {
        // API Config button
        this.addEventListenerOnce(document.getElementById('api-config'), 'click', () => {
            this.showAPIConfigModal();
        }, 'api-config-button');

        // API Config Modal handlers
        const modal = document.getElementById('api-config-modal');
        if (modal) {
            // Close button
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                this.addEventListenerOnce(closeBtn, 'click', () => {
                    this.hideAPIConfigModal();
                }, 'api-config-close');
            }

            // Test connection button
            this.addEventListenerOnce(document.getElementById('test-api-connection'), 'click', async () => {
                await this.testAPIConnection();
            }, 'test-api-connection');

            // Save configuration button
            this.addEventListenerOnce(document.getElementById('save-api-config'), 'click', async () => {
                await this.saveAPIConfiguration();
            }, 'save-api-config');

            // Clear configuration button
            this.addEventListenerOnce(document.getElementById('clear-api-config'), 'click', () => {
                this.clearAPIConfiguration();
            }, 'clear-api-config');
        }
    }

    showAPIConfigModal() {
        const modal = document.getElementById('api-config-modal');
        if (modal) {
            modal.style.display = 'block';
            
            // Load existing configuration if available
            if (this.apiClient) {
                const savedConfig = localStorage.getItem('buildkite_api_config');
                if (savedConfig) {
                    try {
                        const config = JSON.parse(savedConfig);
                        document.getElementById('api-organization').value = config.organization || '';
                        // Don't show the token for security reasons, just indicate it's configured
                        const tokenInput = document.getElementById('api-token');
                        if (config.apiToken) {
                            tokenInput.placeholder = 'Token configured (enter new token to change)';
                        }
                    } catch (e) {
                        console.error('Failed to load saved config:', e);
                    }
                }
            }
        }
    }

    hideAPIConfigModal() {
        const modal = document.getElementById('api-config-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async testAPIConnection() {
        const statusDiv = document.getElementById('api-test-status');
        const token = document.getElementById('api-token').value;
        const organization = document.getElementById('api-organization').value;

        if (!token || !organization) {
            statusDiv.className = 'api-test-status error';
            statusDiv.textContent = 'Please provide both API token and organization slug';
            return;
        }

        statusDiv.className = 'api-test-status testing';
        statusDiv.textContent = 'Testing connection...';

        try {
            // Temporarily set configuration
            await this.apiClient.setConfiguration(token, organization);
            
            // Test the connection
            const success = await this.apiClient.testConnection();
            
            if (success) {
                statusDiv.className = 'api-test-status success';
                statusDiv.textContent = 'Connection successful! You can now save the configuration.';
            } else {
                statusDiv.className = 'api-test-status error';
                statusDiv.textContent = 'Connection failed. Please check your API token and organization slug.';
            }
        } catch (error) {
            statusDiv.className = 'api-test-status error';
            statusDiv.textContent = `Connection error: ${error.message}`;
        }
    }

    async saveAPIConfiguration() {
        let token = document.getElementById('api-token').value;
        const organization = document.getElementById('api-organization').value;
        const statusDiv = document.getElementById('api-test-status');

        // If no new token entered, check if we have an existing one
        if (!token && this.apiClient.apiToken) {
            token = this.apiClient.apiToken;
        }

        if (!token || !organization) {
            statusDiv.className = 'api-test-status error';
            statusDiv.textContent = 'Please provide both API token and organization slug';
            return;
        }

        try {
            // Save configuration
            await this.apiClient.setConfiguration(token, organization);
            await this.apiClient.initialize();
            
            // Update UI
            this.showAPIStatus(true);
            this.hideAPIConfigModal();
            
            // Clear sensitive data from form
            document.getElementById('api-token').value = '';
            document.getElementById('api-token').placeholder = 'Token configured (enter new token to change)';
            
            // Show success notification
            this.showNotification('API configuration saved successfully', 'success');
            
            // Enable API features in the UI
            this.enableAPIFeatures();
        } catch (error) {
            statusDiv.className = 'api-test-status error';
            statusDiv.textContent = `Failed to save configuration: ${error.message}`;
        }
    }

    enableAPIFeatures() {
        // This method can be extended to enable API-specific features in the UI
        console.log('✅ API features enabled');
        
        // Add API-specific UI elements if needed
        // For example: pipeline sync buttons, import from Buildkite, etc.
    }

    clearAPIConfiguration() {
        if (confirm('Are you sure you want to clear the API configuration?')) {
            // Clear configuration
            this.apiClient.clearConfiguration();
            
            // Update UI
            this.showAPIStatus(false);
            
            // Clear form fields
            document.getElementById('api-token').value = '';
            document.getElementById('api-token').placeholder = 'Enter your Buildkite API token';
            document.getElementById('api-organization').value = '';
            document.getElementById('api-test-status').className = 'api-test-status';
            document.getElementById('api-test-status').textContent = '';
            
            // Show notification
            this.showNotification('API configuration cleared', 'info');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Theme Management
    initializeTheme() {
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.updateThemeIcon();
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            this.addEventListenerOnce(themeToggle, 'click', () => {
                this.toggleTheme();
            }, 'theme-toggle');
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.updateThemeIcon();
        
        // Show notification
        this.showNotification(`Switched to ${this.currentTheme} mode`, 'success');
    }

    updateThemeIcon() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = this.currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }
            themeToggle.title = this.currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
        }
    }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔄 DOMContentLoaded - Starting consolidated initialization...');
    
    // Skip if flag is set
    if (window.skipMainInit) {
        console.log('⏭️ Skipping initialization (skipMainInit flag set)');
        return;
    }
    
    // Create main app instance - singleton pattern prevents duplicates
    if (!window.buildkiteApp) {
        window.buildkiteApp = new BuildkiteApp();
        
        // Run verification after initialization
        setTimeout(() => {
            if (window.buildkiteApp.debugMode) {
                window.buildkiteApp.verifyFunctionality();
            }
        }, 1000);
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuildkiteApp;
}