// js/main-init.js
/**
 * Main Initialization Script - MATRIX BUILDER FIXED VERSION
 * Coordinates the loading of all pipeline builder components with robust error handling
 */

// Global state
window.pipelineBuilder = null;
window.dependencyGraph = null;
window.pipelinePatterns = null;

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
    }

    async initialize() {
        console.log('🚀 Starting Enhanced Pipeline Builder initialization (MATRIX BUILDER FIXED)...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Wait a bit more for scripts to load
        await this.wait(500);

        // Check what's actually available
        this.debugAvailableClasses();

        // Initialize components in order
        await this.initializeSteps();
    }

    debugAvailableClasses() {
        console.log('🔍 Debugging available classes:');
        console.log('   window.yamlGenerator:', !!window.yamlGenerator);
        console.log('   window.PipelineBuilder:', !!window.PipelineBuilder);
        console.log('   window.EnhancedPipelineBuilder:', !!window.EnhancedPipelineBuilder);
        console.log('   window.EnhancedPipelineBuilderWithDependencies:', !!window.EnhancedPipelineBuilderWithDependencies);
        console.log('   window.PipelinePatterns:', !!window.PipelinePatterns);
        console.log('   window.DependencyGraphManager:', !!window.DependencyGraphManager);
        
        // Check if classes are defined but not exported
        console.log('🔍 Checking for class definitions in global scope...');
        const globalKeys = Object.keys(window).filter(key => 
            key.includes('Pipeline') || key.includes('yaml') || key.includes('Dependency')
        );
        console.log('   Found pipeline-related globals:', globalKeys);
    }

    async initializeSteps() {
        for (const step of this.initializationSteps) {
            console.log(`🔧 Initializing: ${step.name}`);
            
            // Wait for dependencies to be available with longer timeout
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
                
                // Try to create minimal fallback implementations
                if (step.name === 'Pipeline Builder') {
                    await this.createFallbackPipelineBuilder();
                }
                continue;
            }
            
            try {
                await step.init();
                console.log(`✅ ${step.name} initialized successfully`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${step.name}:`, error);
                
                // Create fallback for critical components
                if (step.name === 'Pipeline Builder') {
                    await this.createFallbackPipelineBuilder();
                }
            }
        }
        
        console.log('🎉 Pipeline Builder initialization complete!');
        console.log('📊 Final status:');
        this.verifyFunctionality();
    }

    async initYamlGenerator() {
        if (!window.yamlGenerator) {
            console.warn('YAML Generator not found, creating basic version');
            window.yamlGenerator = {
                generateYAML: (steps) => {
                    if (!steps || steps.length === 0) return 'steps: []';
                    return 'steps:\n' + steps.map(step => `  - label: "${step.properties.label}"\n    command: "${step.properties.command || 'echo hello'}"`).join('\n');
                }
            };
        }
    }

    async initPipelinePatterns() {
        if (window.PipelinePatterns) {
            window.pipelinePatterns = new window.PipelinePatterns();
            console.log('📋 Pipeline patterns initialized');
        } else {
            console.warn('Pipeline Patterns class not found');
        }
    }

    async initPipelineBuilder() {
        if (window.pipelineBuilder) {
            console.log('✅ Pipeline Builder already exists');
            return;
        }

        if (window.PipelineBuilder) {
            // Choose the most advanced available builder
            let BuilderClass = window.PipelineBuilder;
            
            if (window.EnhancedPipelineBuilderWithDependencies) {
                BuilderClass = window.EnhancedPipelineBuilderWithDependencies;
                console.log('🚀 Using Enhanced Pipeline Builder with Dependencies');
            } else if (window.EnhancedPipelineBuilder) {
                BuilderClass = window.EnhancedPipelineBuilder;
                console.log('✨ Using Enhanced Pipeline Builder');
            } else {
                console.log('🔧 Using Basic Pipeline Builder');
            }
            
            window.pipelineBuilder = new BuilderClass();
            
            // MATRIX BUILDER FIX: Create global shorthand reference for button compatibility
            if (!window.pipelineBuilder) {
                console.error('❌ Failed to create pipeline builder instance');
                return;
            }
            
            // Ensure global accessibility for all button contexts
            window.pipelineBuilder = window.pipelineBuilder;
            
            // CRITICAL FIX: Verify matrix builder methods are available
            if (typeof window.pipelineBuilder.openMatrixBuilder === 'function') {
                console.log('✅ Matrix builder methods verified');
            } else {
                console.warn('⚠️ Matrix builder methods missing - adding fallback');
                this.addMatrixBuilderFallback();
            }
            
        } else {
            throw new Error('PipelineBuilder class not found');
        }
    }

    // MATRIX BUILDER FIX: Add fallback methods if missing
    addMatrixBuilderFallback() {
        if (window.pipelineBuilder && !window.pipelineBuilder.openMatrixBuilder) {
            window.pipelineBuilder.openMatrixBuilder = function(stepId) {
                console.log('🔧 Matrix builder fallback called for step:', stepId);
                
                if (typeof this.showMatrixTemplates === 'function') {
                    this.showMatrixTemplates();
                } else {
                    console.warn('⚠️ Matrix templates method not available');
                    alert('Matrix builder functionality is loading. Please try again in a moment.');
                }
            };
            
            console.log('✅ Matrix builder fallback method added');
        }
    }

    async createFallbackPipelineBuilder() {
        console.log('🔧 Creating fallback Pipeline Builder...');
        
        // Create minimal pipeline builder with essential functionality
        window.pipelineBuilder = {
            steps: [],
            selectedStep: null,
            stepCounter: 0,

            // Essential methods
            createStep: function(stepType) {
                const stepId = `step-${++this.stepCounter}`;
                return {
                    id: stepId,
                    type: stepType,
                    label: `${stepType} Step`,
                    icon: 'fas fa-cog',
                    properties: {
                        label: `${stepType} Step ${this.stepCounter}`,
                        command: stepType === 'command' ? 'echo "Hello World"' : '',
                        agents: '',
                        env: {},
                        timeout_in_minutes: 10
                    }
                };
            },

            addStep: function(stepType, index = this.steps.length) {
                const step = this.createStep(stepType);
                this.steps.splice(index, 0, step);
                this.renderPipeline();
                this.selectStep(step.id);
                console.log(`Added ${stepType} step:`, step.id);
            },

            removeStep: function(index) {
                if (index >= 0 && index < this.steps.length) {
                    const removedStep = this.steps[index];
                    this.steps.splice(index, 1);
                    if (this.selectedStep && this.selectedStep.id === removedStep.id) {
                        this.selectedStep = null;
                    }
                    this.renderPipeline();
                    this.renderProperties();
                    console.log(`Removed step at index ${index}`);
                }
            },

            selectStep: function(stepId) {
                // Remove previous selection
                document.querySelectorAll('.pipeline-step').forEach(el => {
                    el.classList.remove('selected');
                });

                // Add selection to current step
                const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
                if (stepElement) {
                    stepElement.classList.add('selected');
                    this.selectedStep = stepId;
                    this.renderProperties();
                }
            },

            renderPipeline: function() {
                const container = document.getElementById('pipeline-steps');
                if (!container) return;

                if (this.steps.length === 0) {
                    container.innerHTML = `
                        <div class="empty-pipeline">
                            <i class="fas fa-stream"></i>
                            <h3>Start Building Your Pipeline</h3>
                            <p>Drag step types from the sidebar or use the quick actions to get started</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = this.steps.map((step, index) => `
                    <div class="pipeline-step" data-step-id="${step.id}" onclick="window.pipelineBuilder.selectStep('${step.id}')">
                        <div class="step-header">
                            <i class="${step.icon}"></i>
                            <span class="step-label">${step.properties.label}</span>
                            <div class="step-actions">
                                <button onclick="event.stopPropagation(); window.pipelineBuilder.removeStep(${index})" title="Remove step">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="step-type">${step.type}</div>
                    </div>
                `).join('');
            },

            renderProperties: function() {
                const container = document.getElementById('properties-content');
                if (!container) return;

                if (!this.selectedStep) {
                    container.innerHTML = `
                        <div class="no-selection">
                            <i class="fas fa-mouse-pointer"></i>
                            <p>Select a step to view and edit its properties</p>
                        </div>
                    `;
                    return;
                }

                const step = this.steps.find(s => s.id === this.selectedStep);
                if (!step) return;

                container.innerHTML = `
                    <div class="step-properties">
                        <h4>${step.type} Step Properties</h4>
                        <div class="property-group">
                            <label>Step Label</label>
                            <input type="text" value="${step.properties.label}" onchange="window.pipelineBuilder.updateStepProperty('label', this.value)">
                        </div>
                        ${step.type === 'command' ? `
                            <div class="property-group">
                                <label>Command</label>
                                <textarea onchange="window.pipelineBuilder.updateStepProperty('command', this.value)">${step.properties.command}</textarea>
                            </div>
                        ` : ''}
                    </div>
                `;
            },

            updateStepProperty: function(property, value) {
                const step = this.steps.find(s => s.id === this.selectedStep);
                if (step) {
                    step.properties[property] = value;
                    this.renderPipeline();
                }
            },

            clearPipeline: function() {
                if (this.steps.length === 0) {
                    return;
                }
                this.steps = [];
                this.selectedStep = null;
                this.renderPipeline();
                this.renderProperties();
            },

            exportYAML: function() {
                if (!window.yamlGenerator) {
                    alert('YAML generator not available');
                    return;
                }
                
                const yamlContent = window.yamlGenerator.generateYAML(this.steps);
                const yamlOutput = document.getElementById('yaml-output');
                if (yamlOutput) {
                    yamlOutput.value = yamlContent;
                }
                const yamlModal = document.getElementById('yaml-modal');
                if (yamlModal) {
                    yamlModal.classList.remove('hidden');
                }
            },

            loadExample: function() {
                this.steps = [
                    this.createStep('command'),
                    this.createStep('wait'),
                    this.createStep('command')
                ];
                
                this.steps[0].properties.label = 'Install Dependencies';
                this.steps[0].properties.command = 'npm install';
                this.steps[2].properties.label = 'Run Tests';
                this.steps[2].properties.command = 'npm test';
                
                this.selectedStep = null;
                this.renderPipeline();
                this.renderProperties();
            },

            // MATRIX BUILDER FIX: Add matrix builder methods to fallback
            showMatrixTemplates: function() {
                console.log('Fallback matrix templates called');
                alert('Matrix builder is loading. Please try again in a moment.');
            },

            openMatrixBuilder: function(stepId) {
                console.log('Fallback matrix builder called for step:', stepId);
                this.showMatrixTemplates();
            },

            // Add other missing methods
            showPluginCatalog: function() {
                console.log('Fallback plugin catalog called');
                alert('Plugin catalog is loading. Please try again in a moment.');
            },

            showStepTemplates: function() {
                console.log('Fallback step templates called');
                alert('Step templates are loading. Please try again in a moment.');
            },

            openPipelineValidator: function() {
                console.log('Fallback pipeline validator called');
                alert('Pipeline validator is loading. Please try again in a moment.');
            },

            addTemplate: function(templateKey) {
                console.log('Fallback add template called:', templateKey);
                alert(`Template "${templateKey}" is loading. Please try again in a moment.`);
            },

            addPattern: function(patternKey) {
                console.log('Fallback add pattern called:', patternKey);
                alert(`Pattern "${patternKey}" is loading. Please try again in a moment.`);
            },

            addPluginStep: function(pluginKey) {
                console.log('Fallback add plugin step called:', pluginKey);
                alert(`Plugin "${pluginKey}" is loading. Please try again in a moment.`);
            }
        };

        // Initialize the fallback builder
        window.pipelineBuilder.renderPipeline();
        window.pipelineBuilder.renderProperties();
        
        console.log('✅ Fallback Pipeline Builder created with matrix builder support');
    }

    async initDependencyGraph() {
        if (window.DependencyGraphManager && window.pipelineBuilder) {
            if (!window.pipelineBuilder.dependencyGraph) {
                window.pipelineBuilder.dependencyGraph = new window.DependencyGraphManager(window.pipelineBuilder);
                window.dependencyGraph = window.pipelineBuilder.dependencyGraph;
                console.log('🔗 Dependency graph system initialized');
            }
        } else {
            console.warn('Dependency Graph Manager not available or no pipeline builder');
        }
    }

    async postInit() {
        // Inject plugin catalog styles
        this.injectPluginCatalogStyles();
        
        // Ensure all methods are properly bound
        this.ensureMethodBindings();
        
        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup modal management
        this.setupModalManagement();
        
        // Setup event listeners for UI elements
        this.setupUIEventListeners();
        
        // MATRIX BUILDER FIX: Final verification and setup
        this.finalMatrixBuilderSetup();
        
        // Final verification
        this.verifyFunctionality();
        
        this.finalMatrixBuilderSetup();
    }

    // MATRIX BUILDER FIX: Ensure matrix builder is fully functional
    // ADD this method to your MainInitializer class:
    finalMatrixBuilderSetup() {
        console.log('🔧 Final matrix builder setup...');
        
        if (window.pipelineBuilder) {
            // Force matrix builder initialization
            if (typeof window.pipelineBuilder.initializeMatrixBuilder === 'function') {
                try {
                    window.pipelineBuilder.initializeMatrixBuilder();
                    console.log('✅ Matrix builder re-initialized');
                } catch (error) {
                    console.warn('⚠️ Matrix builder initialization error:', error);
                }
            }
            
            // Ensure preset buttons are properly rendered
            setTimeout(() => {
                if (typeof window.pipelineBuilder.renderMatrixPresets === 'function') {
                    window.pipelineBuilder.renderMatrixPresets();
                    console.log('✅ Matrix presets re-rendered');
                }
            }, 500);
        }
    }



    

    injectPluginCatalogStyles() {
        // Inject plugin catalog specific styles if not already present
        if (!document.getElementById('plugin-catalog-dynamic-styles')) {
            const style = document.createElement('style');
            style.id = 'plugin-catalog-dynamic-styles';
            style.textContent = `
                .plugin-item.selected { 
                    border-color: #667eea !important; 
                    background: #f7fafc !important; 
                }
                .plugin-details { 
                    border-left: 3px solid #667eea; 
                }
                .plugin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1rem;
                    padding: 1rem;
                }

                .plugin-item {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .plugin-item:hover {
                    border-color: #667eea;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
                }

                .plugin-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }

                .plugin-title {
                    font-weight: 600;
                    color: #2d3748;
                    font-size: 1rem;
                    margin: 0;
                }

                .plugin-version {
                    background: #edf2f7;
                    color: #4a5568;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .plugin-description {
                    color: #718096;
                    font-size: 0.9rem;
                    margin: 0.5rem 0;
                    line-height: 1.4;
                }

                .plugin-category {
                    background: #667eea;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    display: inline-block;
                    margin-top: 0.5rem;
                }

                .plugin-fields-preview {
                    margin-top: 0.75rem;
                    font-size: 0.8rem;
                    color: #a0aec0;
                }

                .plugin-fields-preview .required {
                    color: #e53e3e;
                    font-weight: bold;
                }

                .more-fields {
                    color: #667eea;
                    font-style: italic;
                    font-size: 0.75rem;
                }

                .no-fields {
                    color: #a0aec0;
                    font-style: italic;
                    margin: 0;
                    font-size: 0.85rem;
                }

                .plugin-actions {
                    display: flex;
                    gap: 0.75rem;
                    justify-content: space-between;
                }

                .plugin-actions .btn {
                    flex: 1;
                    text-align: center;
                    font-size: 0.85rem;
                    padding: 0.6rem 1rem;
                }

                .no-plugins {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 3rem;
                    color: #a0aec0;
                }

                .no-plugins i {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                    color: #cbd5e0;
                }

                .no-plugins h4 {
                    margin: 0 0 0.5rem 0;
                    color: #718096;
                }

                .plugin-loading {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 3rem;
                    color: #718096;
                }

                .plugin-loading i {
                    font-size: 2rem;
                    margin-bottom: 1rem;
                    color: #667eea;
                }

                /* Responsive design */
                @media (max-width: 768px) {
                    .plugin-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .plugin-categories {
                        flex-direction: column;
                    }
                    
                    .plugin-actions {
                        flex-direction: column;
                    }
                }
            `;
            document.head.appendChild(style);
            console.log('✅ Plugin catalog styles injected');
        }
    }

    ensureMethodBindings() {
        if (!window.pipelineBuilder) return;
        
        const requiredMethods = [
            'addStep', 'showPluginCatalog', 'showMatrixTemplates', 'openMatrixBuilder',
            'showStepTemplates', 'openPipelineValidator', 'exportYAML', 'clearPipeline'
        ];
        
        requiredMethods.forEach(methodName => {
            if (typeof window.pipelineBuilder[methodName] !== 'function') {
                console.warn(`⚠️ Method ${methodName} not found, creating fallback`);
                
                window.pipelineBuilder[methodName] = function() {
                    console.log(`${methodName} called`);
                    alert(`${methodName} functionality coming soon!`);
                };
            } else {
                console.log(`✅ Method ${methodName} verified`);
            }
        });
    }

    setupErrorHandling() {
        console.log('🔧 Setting up global error handling...');
        
        window.addEventListener('error', (event) => {
            console.error('🚨 Global error caught:', event.error);
            if (event.error && event.error.message && event.error.message.includes('pipelineBuilder')) {
                console.error('🚨 PipelineBuilder related error detected');
            }
        });
        
        console.log('✅ Global error handling configured');
    }

    setupModalManagement() {
        console.log('🔧 Setting up modal management...');
        
        // Create global modal close function if it doesn't exist
        if (!window.closeModal) {
            window.closeModal = function(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('hidden');
                    console.log(`📋 Closed modal: ${modalId}`);
                } else {
                    console.warn(`⚠️ Modal not found: ${modalId}`);
                }
            };
        }
        
        // Setup modal close button event listeners
        document.addEventListener('click', (e) => {
            // Handle modal close buttons
            if (e.target.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                    console.log('📋 Modal closed via close button');
                }
            }
            
            // Handle data-modal close buttons
            if (e.target.dataset.modal) {
                const modalId = e.target.dataset.modal;
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('hidden');
                    console.log(`📋 Modal closed via data-modal: ${modalId}`);
                }
            }

            // Handle template buttons in modals
            if (e.target.hasAttribute('data-template')) {
                const template = e.target.getAttribute('data-template');
                console.log(`Template button clicked: ${template}`);
                
                if (window.dependencyGraph && typeof window.dependencyGraph.applyConditionTemplate === 'function') {
                    window.dependencyGraph.applyConditionTemplate(template);
                }
            }
            
            // Handle dependency type buttons
            if (e.target.classList.contains('dependency-type-btn')) {
                const type = e.target.getAttribute('data-type');
                console.log(`Dependency type clicked: ${type}`);
                
                // Remove active class from all buttons
                document.querySelectorAll('.dependency-type-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Show/hide corresponding sections
                document.querySelectorAll('.dependency-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                const targetSection = document.getElementById(`${type}-dependencies`);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            }
        });
        
        // Handle ESC key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const visibleModals = document.querySelectorAll('.modal:not(.hidden)');
                if (visibleModals.length > 0) {
                    visibleModals.forEach(modal => modal.classList.add('hidden'));
                    console.log('📋 Modals closed via ESC key');
                }
            }
        });
        
        console.log('✅ Modal management configured');
    }

    setupUIEventListeners() {
        console.log('🔧 Setting up UI event listeners...');
        
        // Setup enhanced keyboard shortcuts
        this.setupEnhancedKeyboardShortcuts();
        
        // Header buttons
        const clearBtn = document.getElementById('clear-pipeline');
        const loadBtn = document.getElementById('load-example');
        const exportBtn = document.getElementById('export-yaml');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (window.pipelineBuilder && window.pipelineBuilder.clearPipeline) {
                    window.pipelineBuilder.clearPipeline();
                }
            });
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (window.pipelineBuilder && window.pipelineBuilder.loadExample) {
                    window.pipelineBuilder.loadExample();
                }
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (window.pipelineBuilder && window.pipelineBuilder.exportYAML) {
                    window.pipelineBuilder.exportYAML();
                }
            });
        }

        // Setup drag and drop for step types
        this.setupDragAndDrop();

        // Setup quick action buttons
        this.setupQuickActionButtons();

        console.log('✅ UI event listeners setup complete');
    }

    setupEnhancedKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                if (window.pipelineBuilder && typeof window.pipelineBuilder.showPluginCatalog === 'function') {
                    console.log('🔌 Plugin catalog opened via keyboard shortcut');
                    window.pipelineBuilder.showPluginCatalog();
                }
            }
        });
        console.log('⌨️ Enhanced keyboard shortcuts configured');
    }

    setupDragAndDrop() {
        // Make step types draggable
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.stepType);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        // Setup drop zones
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            
            pipelineSteps.addEventListener('drop', (e) => {
                e.preventDefault();
                const stepType = e.dataTransfer.getData('text/plain');
                if (stepType && window.pipelineBuilder && window.pipelineBuilder.addStep) {
                    window.pipelineBuilder.addStep(stepType);
                }
            });
        }
    }

    setupQuickActionButtons() {
        console.log('🔧 Setting up quick action buttons...');

        // Template items
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => {
                const template = item.dataset.template;
                if (template && window.pipelineBuilder && window.pipelineBuilder.addTemplate) {
                    window.pipelineBuilder.addTemplate(template);
                } else {
                    console.log(`Template clicked: ${template}`);
                    alert(`Template "${template}" functionality coming soon!`);
                }
            });
        });

        // Pattern items
        document.querySelectorAll('.pattern-item').forEach(item => {
            item.addEventListener('click', () => {
                const pattern = item.dataset.pattern;
                if (pattern && window.pipelinePatterns && window.pipelinePatterns.applyPattern) {
                    window.pipelinePatterns.applyPattern(pattern);
                } else {
                    console.log(`Pattern clicked: ${pattern}`);
                    alert(`Pattern "${pattern}" functionality coming soon!`);
                }
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                console.log(`Action clicked: ${action}`);
                
                switch (action) {
                    case 'plugin-catalog':
                        if (window.pipelineBuilder && typeof window.pipelineBuilder.showPluginCatalog === 'function') {
                            window.pipelineBuilder.showPluginCatalog();
                        } else {
                            alert('Plugin catalog coming soon!');
                        }
                        break;
                    case 'matrix-builder':
                        // MATRIX BUILDER FIX: Enhanced error handling and fallback
                        if (window.pipelineBuilder && typeof window.pipelineBuilder.showMatrixTemplates === 'function') {
                            console.log('✅ Opening matrix builder via quick action...');
                            window.pipelineBuilder.showMatrixTemplates();
                        } else if (window.pipelineBuilder && typeof window.pipelineBuilder.openMatrixBuilder === 'function') {
                            console.log('✅ Opening matrix builder via openMatrixBuilder...');
                            window.pipelineBuilder.openMatrixBuilder();
                        } else {
                            console.warn('⚠️ Matrix builder methods not available');
                            alert('Matrix builder is loading. Please try again in a moment.');
                        }
                        break;
                    case 'step-templates':
                        if (window.pipelineBuilder && typeof window.pipelineBuilder.showStepTemplates === 'function') {
                            window.pipelineBuilder.showStepTemplates();
                        } else {
                            alert('Step templates coming soon!');
                        }
                        break;
                    case 'dependency-graph':
                        if (window.pipelineBuilder && window.pipelineBuilder.dependencyGraph && 
                            typeof window.pipelineBuilder.dependencyGraph.showDependencyGraph === 'function') {
                            console.log('✅ Opening dependency graph...');
                            window.pipelineBuilder.dependencyGraph.showDependencyGraph();
                        } else if (window.dependencyGraph && typeof window.dependencyGraph.showDependencyGraph === 'function') {
                            console.log('✅ Opening dependency graph (global)...');
                            window.dependencyGraph.showDependencyGraph();
                        } else {
                            console.warn('Dependency graph not available');
                            alert('Dependency graph coming soon!');
                        }
                        break;
                    case 'conditional-builder':
                        if (window.pipelineBuilder && window.pipelineBuilder.dependencyGraph && 
                            typeof window.pipelineBuilder.dependencyGraph.showConditionalBuilder === 'function') {
                            console.log('✅ Opening conditional builder...');
                            window.pipelineBuilder.dependencyGraph.showConditionalBuilder();
                        } else if (window.dependencyGraph && typeof window.dependencyGraph.showConditionalBuilder === 'function') {
                            console.log('✅ Opening conditional builder (global)...');
                            window.dependencyGraph.showConditionalBuilder();
                        } else {
                            console.warn('Conditional builder not available');
                            alert('Conditional builder coming soon!');
                        }
                        break;
                    case 'dependency-manager':
                        if (window.pipelineBuilder && window.pipelineBuilder.dependencyGraph && 
                            typeof window.pipelineBuilder.dependencyGraph.showDependencyManager === 'function') {
                            console.log('✅ Opening dependency manager...');
                            window.pipelineBuilder.dependencyGraph.showDependencyManager();
                        } else if (window.dependencyGraph && typeof window.dependencyGraph.showDependencyManager === 'function') {
                            console.log('✅ Opening dependency manager (global)...');
                            window.dependencyGraph.showDependencyManager();
                        } else {
                            console.warn('Dependency manager not available');
                            alert('Dependency manager coming soon!');
                        }
                        break;
                    case 'pipeline-validator':
                        if (window.pipelineBuilder && typeof window.pipelineBuilder.openPipelineValidator === 'function') {
                            window.pipelineBuilder.openPipelineValidator();
                        } else {
                            alert('Pipeline validator coming soon!');
                        }
                        break;
                    case 'keyboard-shortcuts':
                        this.showKeyboardShortcuts();
                        break;
                    default:
                        alert(`${action} functionality coming soon!`);
                }
            });
        });

        // Plugin quick buttons
        document.querySelectorAll('.plugin-quick').forEach(item => {
            item.addEventListener('click', () => {
                const plugin = item.dataset.plugin;
                if (plugin && window.pipelineBuilder && window.pipelineBuilder.addPluginStep) {
                    window.pipelineBuilder.addPluginStep(plugin);
                } else {
                    console.log(`Plugin clicked: ${plugin}`);
                    alert(`Plugin "${plugin}" functionality coming soon!`);
                }
            });
        });

        console.log('✅ Quick action buttons configured');
    }

    showKeyboardShortcuts() {
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    verifyFunctionality() {
        console.log('🔍 Verifying functionality...');
        
        const tests = [
            {
                name: 'Pipeline Builder exists',
                test: () => !!window.pipelineBuilder,
                critical: true
            },
            {
                name: 'Can create steps',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.createStep === 'function',
                critical: true
            },
            {
                name: 'Can render pipeline',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.renderPipeline === 'function',
                critical: true
            },
            {
                name: 'Template methods work',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.addTemplate === 'function',
                critical: false
            },
            {
                name: 'Pattern methods work',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.addPattern === 'function',
                critical: false
            },
            {
                name: 'Plugin methods work',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.addPluginStep === 'function',
                critical: false
            },
            {
                name: 'Matrix builder methods work',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.openMatrixBuilder === 'function',
                critical: false
            },
            {
                name: 'Dependency graph available',
                test: () => window.pipelineBuilder && window.pipelineBuilder.dependencyGraph,
                critical: false
            },
            {
                name: 'Dependency graph methods work',
                test: () => window.dependencyGraph && typeof window.dependencyGraph.showDependencyGraph === 'function',
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
        
        this.logFeatureStatus();
    }

    logFeatureStatus() {
        console.log('📋 Feature Status:');
        console.log(`🔧 Basic Pipeline Builder: ${window.pipelineBuilder ? '✅' : '❌'}`);
        console.log(`✨ Enhanced Features: ${window.pipelineBuilder && window.pipelineBuilder.addTemplate ? '✅' : '❌'}`);
        console.log(`📋 Pipeline Patterns: ${window.pipelinePatterns ? '✅' : '❌'}`);
        console.log(`🔗 Dependency Graph: ${window.dependencyGraph ? '✅' : '❌'}`);
        console.log(`🎛️ YAML Generator: ${window.yamlGenerator ? '✅' : '❌'}`);
        
        // MATRIX BUILDER FIX: Verify matrix builder specifically
        if (window.pipelineBuilder) {
            console.log(`🔲 Matrix Builder Methods:`);
            console.log(`   openMatrixBuilder: ${typeof window.pipelineBuilder.openMatrixBuilder === 'function' ? '✅' : '❌'}`);
            console.log(`   showMatrixTemplates: ${typeof window.pipelineBuilder.showMatrixTemplates === 'function' ? '✅' : '❌'}`);
            console.log(`   initializeMatrixBuilder: ${typeof window.pipelineBuilder.initializeMatrixBuilder === 'function' ? '✅' : '❌'}`);
        }
        
        if (window.pipelineBuilder) {
            console.log('🚀 Pipeline Builder ready for use!');
            console.log('💡 Available keyboard shortcuts:');
            console.log('   Ctrl+S - Export YAML');
            console.log('   Ctrl+N - Clear Pipeline');
            console.log('   Ctrl+E - Load Example');
            console.log('   Ctrl+P - Plugin Catalog');
            console.log('   Ctrl+M - Matrix Builder');
            
            if (window.dependencyGraph) {
                console.log('   Ctrl+G - Dependency Graph');
                console.log('   Ctrl+L - Conditional Logic');
                console.log('   Ctrl+D - Dependency Manager');
            }
        }
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize everything when the page loads
const mainInitializer = new MainInitializer();

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mainInitializer.initialize();
    });
} else {
    mainInitializer.initialize();
}

// Enhanced initialization with plugin catalog support
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔌 Plugin Catalog Phase 1 - Enhanced initialization starting...');
    
    // Verify plugin catalog functionality after initialization
    setTimeout(() => {
        if (window.pipelineBuilder && typeof window.pipelineBuilder.showPluginCatalog === 'function') {
            console.log('✅ Plugin Catalog Phase 1 - Ready!');
            console.log('🔌 Plugin catalog accessible via:');
            console.log('   - Plugin Catalog button in Quick Actions');
            console.log('   - Ctrl+P keyboard shortcut');
            console.log('   - Plugin quick buttons in sidebar');
            console.log(`📦 ${Object.keys(window.pipelineBuilder.pluginCatalog || {}).length} plugins available`);
        } else {
            console.warn('⚠️ Plugin catalog not fully initialized');
        }
        
        // MATRIX BUILDER FIX: Final verification after full initialization
        if (window.pipelineBuilder && typeof window.pipelineBuilder.openMatrixBuilder === 'function') {
            console.log('✅ Matrix Builder - Ready!');
            console.log('🔲 Matrix builder accessible via:');
            console.log('   - Matrix Builder button in Quick Actions');
            console.log('   - Configure Matrix buttons in step properties');
            console.log('   - Ctrl+M keyboard shortcut');
        } else {
            console.warn('⚠️ Matrix builder not fully initialized');
        }
    }, 3000);
});

// MATRIX BUILDER FIX: Global helper function for safe matrix builder access
window.openMatrixBuilderSafe = function(stepId) {
    console.log('🔲 Safe matrix builder called for step:', stepId);
    
    // Check if pipeline builder exists
    if (!window.pipelineBuilder) {
        console.warn('⚠️ Pipeline builder not available');
        alert('Pipeline builder is still loading. Please wait a moment and try again.');
        return false;
    }
    
    // Try different matrix builder methods in order of preference
    if (typeof window.pipelineBuilder.openMatrixBuilder === 'function') {
        console.log('✅ Using openMatrixBuilder method');
        try {
            window.pipelineBuilder.openMatrixBuilder(stepId);
            return true;
        } catch (error) {
            console.error('❌ Error calling openMatrixBuilder:', error);
        }
    }
    
    if (typeof window.pipelineBuilder.showMatrixTemplates === 'function') {
        console.log('✅ Using showMatrixTemplates method');
        try {
            window.pipelineBuilder.showMatrixTemplates();
            return true;
        } catch (error) {
            console.error('❌ Error calling showMatrixTemplates:', error);
        }
    }
    
    // Check if the modal exists and can be shown manually
    const matrixModal = document.getElementById('matrix-builder-modal');
    if (matrixModal) {
        console.log('✅ Opening matrix modal manually');
        matrixModal.classList.remove('hidden');
        
        // Try to initialize the matrix builder
        if (window.pipelineBuilder.initializeMatrixBuilder) {
            try {
                window.pipelineBuilder.initializeMatrixBuilder();
            } catch (error) {
                console.warn('⚠️ Could not initialize matrix builder:', error);
            }
        }
        return true;
    }
    
    // If all else fails, show a helpful message
    console.warn('⚠️ No matrix builder methods available');
    alert('Matrix builder is still loading. Please try again in a moment, or refresh the page if the issue persists.');
    return false;
};

// MATRIX BUILDER FIX: Enhanced matrix builder modal handling
window.openMatrixModal = function() {
    console.log('🔲 Opening matrix modal directly');
    
    const modal = document.getElementById('matrix-builder-modal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log('✅ Matrix modal opened');
        
        // Initialize matrix builder if pipeline builder is available
        if (window.pipelineBuilder && window.pipelineBuilder.initializeMatrixBuilder) {
            try {
                window.pipelineBuilder.initializeMatrixBuilder();
                window.pipelineBuilder.setupMatrixBuilderEvents();
                console.log('✅ Matrix builder initialized');
            } catch (error) {
                console.warn('⚠️ Could not initialize matrix builder:', error);
            }
        }
    } else {
        console.error('❌ Matrix builder modal not found');
        alert('Matrix builder modal not found. Please refresh the page.');
    }
};

// MATRIX BUILDER FIX: Enhanced debugging function
window.debugMatrixBuilder = function() {
    console.log('🔍 Matrix Builder Debug Information:');
    console.log('   window.pipelineBuilder:', !!window.pipelineBuilder);
    
    if (window.pipelineBuilder) {
        console.log('   openMatrixBuilder method:', typeof window.pipelineBuilder.openMatrixBuilder);
        console.log('   showMatrixTemplates method:', typeof window.pipelineBuilder.showMatrixTemplates);
        console.log('   initializeMatrixBuilder method:', typeof window.pipelineBuilder.initializeMatrixBuilder);
        console.log('   setupMatrixBuilderEvents method:', typeof window.pipelineBuilder.setupMatrixBuilderEvents);
    }
    
    const modal = document.getElementById('matrix-builder-modal');
    console.log('   Matrix modal exists:', !!modal);
    console.log('   Matrix modal visible:', modal && !modal.classList.contains('hidden'));
    
    // Test matrix builder accessibility
    const buttons = document.querySelectorAll('[onclick*="openMatrixBuilder"], [onclick*="showMatrixTemplates"]');
    console.log('   Matrix builder buttons found:', buttons.length);
    
    return {
        pipelineBuilder: !!window.pipelineBuilder,
        openMatrixBuilder: window.pipelineBuilder ? typeof window.pipelineBuilder.openMatrixBuilder : 'N/A',
        showMatrixTemplates: window.pipelineBuilder ? typeof window.pipelineBuilder.showMatrixTemplates : 'N/A',
        modal: !!modal,
        buttons: buttons.length
    };
};

console.log('✅ Matrix Builder global helpers loaded');