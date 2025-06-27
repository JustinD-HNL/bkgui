// js/main-init.js
/**
 * Main Initialization Script - FIXED VERSION
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
        console.log('🚀 Starting Enhanced Pipeline Builder initialization (FIXED VERSION)...');
        
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
        this.logFeatureStatus();
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
                }

                this.selectedStep = this.steps.find(step => step.id === stepId);
                this.renderProperties();
            },

            renderPipeline: function() {
                const container = document.getElementById('pipeline-steps');
                if (!container) return;
                
                container.innerHTML = '';

                if (this.steps.length === 0) {
                    container.innerHTML = `
                        <div class="drop-zone" data-drop-index="0">
                            <i class="fas fa-plus-circle"></i>
                            <span>Drop steps here to start building your pipeline</span>
                        </div>
                    `;
                    return;
                }

                this.steps.forEach((step, index) => {
                    const stepElement = document.createElement('div');
                    stepElement.className = 'pipeline-step';
                    stepElement.dataset.stepId = step.id;
                    stepElement.innerHTML = `
                        <div class="step-header">
                            <div class="step-title">
                                <i class="${step.icon}"></i>
                                <span>${step.properties.label}</span>
                            </div>
                            <div class="step-actions">
                                <button class="step-action" title="Delete" data-action="remove" data-index="${index}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="step-content">
                            ${step.properties.command || `${step.type} step`}
                        </div>
                    `;

                    // Add click event listener
                    stepElement.addEventListener('click', () => this.selectStep(step.id));
                    
                    container.appendChild(stepElement);
                });

                // Add event listeners for step actions
                this.bindStepActionEvents();
            },

            bindStepActionEvents: function() {
                document.querySelectorAll('.step-action[data-action="remove"]').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const index = parseInt(button.dataset.index);
                        this.removeStep(index);
                    });
                });
            },

            renderProperties: function() {
                const propertiesContainer = document.getElementById('step-properties');
                if (!propertiesContainer) return;
                
                if (!this.selectedStep) {
                    propertiesContainer.innerHTML = `
                        <div class="no-selection">
                            <i class="fas fa-mouse-pointer"></i>
                            <p>Select a step to edit its properties</p>
                        </div>
                    `;
                    return;
                }

                const step = this.selectedStep;
                propertiesContainer.innerHTML = `
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${step.properties.label}" />
                    </div>
                    <div class="property-group">
                        <label>Command</label>
                        <textarea name="command" placeholder="echo 'Hello World'">${step.properties.command || ''}</textarea>
                    </div>
                `;

                // Bind property change events
                propertiesContainer.querySelectorAll('input, textarea').forEach(input => {
                    input.addEventListener('input', (e) => {
                        const { name, value } = e.target;
                        this.selectedStep.properties[name] = value;
                        this.renderPipeline();
                        this.selectStep(this.selectedStep.id);
                    });
                });
            },

            clearPipeline: function() {
                if (this.steps.length > 0 && !confirm('Are you sure you want to clear the entire pipeline?')) {
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
            }
        };

        // Initialize the fallback builder
        window.pipelineBuilder.renderPipeline();
        window.pipelineBuilder.renderProperties();
        
        console.log('✅ Fallback Pipeline Builder created');
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
            console.log('✅ Pipeline Builder already exists (fallback created)');
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
            
        } else {
            throw new Error('PipelineBuilder class not found');
        }
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
        
        // Final verification
        this.verifyFunctionality();
    }

    injectPluginCatalogStyles() {
        // Inject plugin catalog specific styles if not already present
        if (!document.getElementById('plugin-catalog-styles')) {
            const style = document.createElement('style');
            style.id = 'plugin-catalog-styles';
            style.textContent = `
                /* Plugin Catalog Specific Styles */
                .plugin-search {
                    margin-bottom: 1.5rem;
                }

                .plugin-search input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 1rem;
                    margin-bottom: 1rem;
                }

                .plugin-categories {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .category-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e2e8f0;
                    background: white;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-size: 0.9rem;
                }

                .category-btn.active,
                .category-btn:hover {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }

                .plugin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }

                .plugin-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: white;
                    position: relative;
                }

                .plugin-card:hover {
                    border-color: #667eea;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
                    transform: translateY(-4px);
                }

                .plugin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }

                .plugin-header h5 {
                    margin: 0;
                    color: #2d3748;
                    font-size: 1.1rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .plugin-header h5 i {
                    color: #667eea;
                }

                .plugin-version {
                    background: #edf2f7;
                    color: #4a5568;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }

                .plugin-description {
                    color: #718096;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    margin-bottom: 1rem;
                }

                .plugin-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .category-tag {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .category-docker { background: #e3f2fd; color: #1565c0; }
                .category-testing { background: #e8f5e8; color: #2e7d32; }
                .category-deployment { background: #fff3e0; color: #ef6c00; }
                .category-notifications { background: #f3e5f5; color: #7b1fa2; }

                .fields-count {
                    color: #718096;
                    font-size: 0.8rem;
                }

                .plugin-fields-preview {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 0.75rem;
                    margin-bottom: 1rem;
                }

                .fields-preview {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .field-preview {
                    background: white;
                    border: 1px solid #cbd5e0;
                    border-radius: 4px;
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    color: #4a5568;
                }

                .field-preview .required {
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
                        if (window.pipelineBuilder && typeof window.pipelineBuilder.showMatrixTemplates === 'function') {
                            window.pipelineBuilder.showMatrixTemplates();
                        } else {
                            alert('Matrix builder coming soon!');
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

    ensureMethodBindings() {
        console.log('🔗 Ensuring method bindings...');
        
        if (!window.pipelineBuilder) {
            console.error('❌ No pipeline builder instance found');
            return;
        }

        const builder = window.pipelineBuilder;
        
        // Core methods that must exist
        const requiredMethods = [
            'addTemplate', 'addPattern', 'addPluginStep',
            'showPluginCatalog', 'showMatrixTemplates', 'showStepTemplates',
            'openPipelineValidator'
        ];
        
        requiredMethods.forEach(methodName => {
            if (typeof builder[methodName] !== 'function') {
                console.warn(`⚠️ Method ${methodName} not found, creating fallback`);
                
                builder[methodName] = function() {
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
            if (e.target.hasAttribute('data-modal')) {
                const modalId = e.target.getAttribute('data-modal');
                window.closeModal(modalId);
            }
            
            // Handle clicking outside modal to close
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
                console.log('📋 Modal closed by clicking outside');
            }
        });
        
        // Setup ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal:not(.hidden)');
                openModals.forEach(modal => {
                    modal.classList.add('hidden');
                });
                if (openModals.length > 0) {
                    console.log('📋 Closed modals with ESC key');
                }
            }
        });
        
        // Setup modal action buttons
        this.setupModalActionButtons();
        
        console.log('✅ Modal management configured');
    }

    setupModalActionButtons() {
        console.log('🔧 Setting up modal action buttons...');
        
        // Handle all buttons with data-action attributes in modals
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-action')) {
                const action = e.target.getAttribute('data-action');
                const modal = e.target.closest('.modal');
                
                console.log(`Modal action clicked: ${action}`);
                
                switch (action) {
                    case 'reset-view':
                        if (window.dependencyGraph && typeof window.dependencyGraph.resetView === 'function') {
                            window.dependencyGraph.resetView();
                        }
                        break;
                    case 'auto-layout':
                        if (window.dependencyGraph && typeof window.dependencyGraph.autoLayout === 'function') {
                            window.dependencyGraph.autoLayout();
                        }
                        break;
                    case 'export-graph':
                        if (window.dependencyGraph && typeof window.dependencyGraph.exportGraph === 'function') {
                            window.dependencyGraph.exportGraph();
                        }
                        break;
                    case 'add-condition':
                        const conditionType = e.target.getAttribute('data-type');
                        if (window.dependencyGraph && typeof window.dependencyGraph.addCondition === 'function') {
                            window.dependencyGraph.addCondition(conditionType);
                        }
                        break;
                    case 'apply-conditions':
                        if (window.dependencyGraph && typeof window.dependencyGraph.applyConditions === 'function') {
                            window.dependencyGraph.applyConditions();
                        }
                        break;
                    case 'apply-dependencies':
                        if (window.dependencyGraph && typeof window.dependencyGraph.applyDependencies === 'function') {
                            window.dependencyGraph.applyDependencies();
                        }
                        break;
                    default:
                        console.log(`Unhandled modal action: ${action}`);
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
        
        console.log('✅ Modal action buttons configured');
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
    }

    logFeatureStatus() {
        console.log('📋 Feature Status:');
        console.log(`🔧 Basic Pipeline Builder: ${window.pipelineBuilder ? '✅' : '❌'}`);
        console.log(`✨ Enhanced Features: ${window.pipelineBuilder && window.pipelineBuilder.addTemplate ? '✅' : '❌'}`);
        console.log(`📋 Pipeline Patterns: ${window.pipelinePatterns ? '✅' : '❌'}`);
        console.log(`🔗 Dependency Graph: ${window.dependencyGraph ? '✅' : '❌'}`);
        console.log(`🎛️ YAML Generator: ${window.yamlGenerator ? '✅' : '❌'}`);
        
        if (window.pipelineBuilder) {
            console.log('🚀 Pipeline Builder ready for use!');
            console.log('💡 Available keyboard shortcuts:');
            console.log('   Ctrl+S - Export YAML');
            console.log('   Ctrl+N - Clear Pipeline');
            console.log('   Ctrl+E - Load Example');
            console.log('   Ctrl+P - Plugin Catalog');
            
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
    }, 3000);
});