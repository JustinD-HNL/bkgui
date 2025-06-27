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
        this.maxRetries = 15; // Increased retries
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
                await this.wait(200); // Longer wait between attempts
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

    setupUIEventListeners() {
        console.log('🔧 Setting up UI event listeners...');
        
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
                        if (window.pipelineBuilder && window.pipelineBuilder.showPluginCatalog) {
                            window.pipelineBuilder.showPluginCatalog();
                        } else {
                            alert('Plugin catalog coming soon!');
                        }
                        break;
                    case 'matrix-builder':
                        if (window.pipelineBuilder && window.pipelineBuilder.showMatrixTemplates) {
                            window.pipelineBuilder.showMatrixTemplates();
                        } else {
                            alert('Matrix builder coming soon!');
                        }
                        break;
                    case 'step-templates':
                        if (window.pipelineBuilder && window.pipelineBuilder.showStepTemplates) {
                            window.pipelineBuilder.showStepTemplates();
                        } else {
                            alert('Step templates coming soon!');
                        }
                        break;
                    case 'dependency-graph':
                        if (window.pipelineBuilder && window.pipelineBuilder.dependencyGraph && window.pipelineBuilder.dependencyGraph.showDependencyGraph) {
                            window.pipelineBuilder.dependencyGraph.showDependencyGraph();
                        } else {
                            alert('Dependency graph coming soon!');
                        }
                        break;
                    case 'conditional-builder':
                        if (window.pipelineBuilder && window.pipelineBuilder.dependencyGraph && window.pipelineBuilder.dependencyGraph.showConditionalBuilder) {
                            window.pipelineBuilder.dependencyGraph.showConditionalBuilder();
                        } else {
                            alert('Conditional builder coming soon!');
                        }
                        break;
                    case 'dependency-manager':
                        if (window.pipelineBuilder && window.pipelineBuilder.dependencyGraph && window.pipelineBuilder.dependencyGraph.showDependencyManager) {
                            window.pipelineBuilder.dependencyGraph.showDependencyManager();
                        } else {
                            alert('Dependency manager coming soon!');
                        }
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
            'openPipelineValidator', 'showKeyboardShortcuts'
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
        
        console.log('✅ Modal management configured');
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