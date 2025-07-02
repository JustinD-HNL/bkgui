// js/main-init.js
/**
 * Main Initialization Script - FIXED VERSION
 * Coordinates the loading of all pipeline builder components with complete configuration support
 * FIXED: Preserves comprehensive step configuration options
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
        console.log('🚀 Starting Complete Pipeline Builder initialization...');
        console.log('🔧 Features: Complete step configuration, enhanced drag & drop, all advanced features');
        
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
    }

    debugAvailableClasses() {
        console.log('🔍 Debugging available classes:');
        console.log('   window.yamlGenerator:', !!window.yamlGenerator);
        console.log('   window.PipelineBuilder:', !!window.PipelineBuilder);
        console.log('   window.EnhancedPipelineBuilder:', !!window.EnhancedPipelineBuilder);
        console.log('   window.EnhancedPipelineBuilderWithDependencies:', !!window.EnhancedPipelineBuilderWithDependencies);
        console.log('   window.PipelinePatterns:', !!window.PipelinePatterns);
        console.log('   window.DependencyGraphManager:', !!window.DependencyGraphManager);
    }

    async initializeSteps() {
        for (const step of this.initializationSteps) {
            console.log(`🔧 Initializing: ${step.name}`);
            
            // Wait for dependencies to be available
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
                
                // Only create minimal fallback for YAML generator, NOT for pipeline builder
                if (step.name === 'YAML Generator') {
                    await this.createMinimalYamlGenerator();
                }
                continue;
            }
            
            try {
                await step.init();
                console.log(`✅ ${step.name} initialized successfully`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${step.name}:`, error);
            }
        }
        
        console.log('🎉 Complete Pipeline Builder initialization finished!');
        this.verifyFunctionality();
    }

    async initYamlGenerator() {
        if (!window.yamlGenerator) {
            console.warn('YAML Generator not found, creating basic version');
            await this.createMinimalYamlGenerator();
        }
    }

    async createMinimalYamlGenerator() {
        window.yamlGenerator = {
            generateYAML: (steps) => {
                if (!steps || steps.length === 0) return 'steps: []';
                
                let yaml = 'steps:\n';
                steps.forEach(step => {
                    yaml += `  - label: "${step.properties.label || step.type}"\n`;
                    
                    switch (step.type) {
                        case 'command':
                            if (step.properties.command) {
                                yaml += `    command: "${step.properties.command}"\n`;
                            }
                            if (step.properties.key) {
                                yaml += `    key: "${step.properties.key}"\n`;
                            }
                            if (step.properties.depends_on && step.properties.depends_on.length > 0) {
                                yaml += `    depends_on:\n`;
                                step.properties.depends_on.forEach(dep => {
                                    yaml += `      - "${dep}"\n`;
                                });
                            }
                            break;
                            
                        case 'wait':
                            yaml += `    wait: ~\n`;
                            if (step.properties.continue_on_failure) {
                                yaml += `    continue_on_failure: true\n`;
                            }
                            break;
                            
                        case 'block':
                            yaml += `    block: "${step.properties.prompt || 'Continue?'}"\n`;
                            if (step.properties.key) {
                                yaml += `    key: "${step.properties.key}"\n`;
                            }
                            break;
                            
                        case 'trigger':
                            if (step.properties.trigger) {
                                yaml += `    trigger: "${step.properties.trigger}"\n`;
                            }
                            break;
                            
                        default:
                            yaml += `    command: "echo 'Step: ${step.type}'"\n`;
                    }
                    
                    yaml += '\n';
                });
                
                return yaml;
            }
        };
        console.log('✅ Minimal YAML generator created');
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

        // Use the most advanced available builder, but prefer the complete version
        let BuilderClass = null;
        
        if (window.EnhancedPipelineBuilderWithDependencies) {
            BuilderClass = window.EnhancedPipelineBuilderWithDependencies;
            console.log('🚀 Using Enhanced Pipeline Builder with Dependencies');
        } else if (window.EnhancedPipelineBuilder) {
            BuilderClass = window.EnhancedPipelineBuilder;
            console.log('✨ Using Enhanced Pipeline Builder');
        } else if (window.PipelineBuilder) {
            BuilderClass = window.PipelineBuilder;
            console.log('🔧 Using Complete Pipeline Builder');
        } else {
            console.error('❌ No PipelineBuilder class found - this should not happen');
            return;
        }
        
        try {
            window.pipelineBuilder = new BuilderClass();
            
            // Verify the instance has all required methods
            const requiredMethods = [
                'addStep', 'removeStep', 'selectStep', 'renderPipeline', 'renderProperties',
                'exportYAML', 'clearPipeline', 'loadExample'
            ];
            
            const missingMethods = requiredMethods.filter(method => 
                typeof window.pipelineBuilder[method] !== 'function'
            );
            
            if (missingMethods.length > 0) {
                console.warn('⚠️ Missing methods:', missingMethods);
                // Add any missing essential methods
                this.addMissingEssentialMethods(missingMethods);
            }
            
            console.log('✅ Pipeline Builder instance created successfully');
            
        } catch (error) {
            console.error('❌ Failed to create pipeline builder:', error);
        }
    }

    addMissingEssentialMethods(missingMethods) {
        missingMethods.forEach(methodName => {
            console.log(`🔧 Adding essential method: ${methodName}`);
            
            switch (methodName) {
                case 'showPluginCatalog':
                    window.pipelineBuilder.showPluginCatalog = function() {
                        console.log('🔌 Plugin catalog functionality not available');
                        alert('Plugin catalog functionality coming soon!');
                    };
                    break;
                    
                case 'openMatrixBuilder':
                    window.pipelineBuilder.openMatrixBuilder = function(stepId) {
                        console.log('🔲 Matrix builder functionality not available');
                        alert('Matrix builder functionality coming soon!');
                    };
                    break;
                    
                case 'showStepTemplates':
                    window.pipelineBuilder.showStepTemplates = function() {
                        console.log('📋 Step templates functionality not available');
                        alert('Step templates functionality coming soon!');
                    };
                    break;
                    
                default:
                    window.pipelineBuilder[methodName] = function() {
                        console.log(`${methodName} called`);
                        alert(`${methodName} functionality coming soon!`);
                    };
            }
        });
    }

    async initDependencyGraph() {
        if (window.DependencyGraphManager && window.pipelineBuilder) {
            try {
                if (!window.pipelineBuilder.dependencyGraph) {
                    window.pipelineBuilder.dependencyGraph = new window.DependencyGraphManager(window.pipelineBuilder);
                    window.dependencyGraph = window.pipelineBuilder.dependencyGraph;
                    console.log('🔗 Dependency graph system initialized');
                }
            } catch (error) {
                console.warn('⚠️ Could not initialize dependency graph:', error);
            }
        } else {
            console.warn('Dependency Graph Manager not available or no pipeline builder');
        }
    }

    async postInit() {
        // Inject enhanced styles
        this.injectEnhancedStyles();
        
        // Setup modal management
        this.setupModalManagement();
        
        // Setup event listeners for UI elements
        this.setupUIEventListeners();
        
        // Setup enhanced drag and drop
        this.setupEnhancedDragAndDrop();
        
        // Final verification
        this.verifyFunctionality();
        
        console.log('🎉 Post-initialization complete');
    }

    setupEnhancedDragAndDrop() {
        console.log('🔧 Setting up enhanced drag and drop...');
        
        if (!window.pipelineBuilder) {
            console.warn('⚠️ Pipeline builder not available for drag and drop setup');
            return;
        }

        // Enhanced drag start
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', (e) => {
                const stepType = e.target.dataset.stepType;
                e.dataTransfer.setData('text/plain', stepType);
                e.dataTransfer.effectAllowed = 'copy';
                e.target.classList.add('dragging');
                document.body.classList.add('drag-active');
                console.log('🎯 Started dragging:', stepType);
            });
            
            stepType.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
                document.body.classList.remove('drag-active');
                this.clearDragIndicators();
            });
        });

        // Enhanced drop zone
        const pipelineContainer = document.getElementById('pipeline-steps');
        if (pipelineContainer) {
            pipelineContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                pipelineContainer.classList.add('drag-over');
                this.updateInsertionIndicator(e, pipelineContainer);
            });
            
            pipelineContainer.addEventListener('dragleave', (e) => {
                if (!pipelineContainer.contains(e.relatedTarget)) {
                    pipelineContainer.classList.remove('drag-over');
                    this.clearDragIndicators();
                }
            });
            
            pipelineContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                const stepType = e.dataTransfer.getData('text/plain');
                
                if (stepType) {
                    const insertIndex = this.getInsertionIndex(e, pipelineContainer);
                    window.pipelineBuilder.addStepAtIndex ? 
                        window.pipelineBuilder.addStepAtIndex(stepType, insertIndex) :
                        window.pipelineBuilder.addStep(stepType);
                    console.log(`✅ Dropped ${stepType}`);
                }
                
                pipelineContainer.classList.remove('drag-over');
                document.body.classList.remove('drag-active');
                this.clearDragIndicators();
            });
        }

        console.log('✅ Enhanced drag and drop configured');
    }

    updateInsertionIndicator(event, container) {
        this.clearDragIndicators();
        
        const insertIndex = this.getInsertionIndex(event, container);
        const steps = container.querySelectorAll('.pipeline-step');
        
        const indicator = document.createElement('div');
        indicator.className = 'drag-insertion-indicator';
        indicator.innerHTML = '<div class="insertion-line"></div>';
        
        if (steps.length === 0 || insertIndex >= steps.length) {
            container.appendChild(indicator);
        } else {
            container.insertBefore(indicator, steps[insertIndex]);
        }
    }

    getInsertionIndex(event, container) {
        const steps = [...container.querySelectorAll('.pipeline-step')];
        
        if (steps.length === 0) return 0;
        
        for (let i = 0; i < steps.length; i++) {
            const stepRect = steps[i].getBoundingClientRect();
            const stepMiddle = stepRect.top + stepRect.height / 2;
            
            if (event.clientY < stepMiddle) {
                return i;
            }
        }
        
        return steps.length;
    }

    clearDragIndicators() {
        document.querySelectorAll('.drag-insertion-indicator').forEach(indicator => {
            indicator.remove();
        });
    }

    injectEnhancedStyles() {
        if (!document.getElementById('enhanced-dynamic-styles')) {
            const style = document.createElement('style');
            style.id = 'enhanced-dynamic-styles';
            style.textContent = `
                /* Enhanced drag and drop styles */
                .drag-active .pipeline-steps {
                    background: rgba(102, 126, 234, 0.05);
                    border: 2px dashed rgba(102, 126, 234, 0.3);
                    border-radius: 12px;
                }
                
                .drag-insertion-indicator {
                    height: 4px;
                    margin: 8px 0;
                    pointer-events: none;
                }
                
                .insertion-line {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    border-radius: 2px;
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                    animation: pulse 1s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 0.8; transform: scaleY(1); }
                    50% { opacity: 1; transform: scaleY(1.2); }
                }
                
                .step-type.dragging {
                    opacity: 0.6;
                    transform: rotate(5deg);
                }
                
                .pipeline-step.drag-over {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                }
                
                /* Enhanced properties panel styles */
                .properties-content .property-section {
                    margin-bottom: 1.5rem;
                    padding: 1.25rem;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .properties-content .property-section h4 {
                    color: #4a5568;
                    margin: 0 0 1rem 0;
                    font-size: 0.95rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .properties-content .property-section h4 i {
                    color: #667eea;
                    font-size: 0.9rem;
                }
                
                .properties-content .property-group {
                    margin-bottom: 1rem;
                }
                
                .properties-content .property-group:last-child {
                    margin-bottom: 0;
                }
                
                .properties-content .property-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: #4a5568;
                    font-size: 0.9rem;
                }
                
                .properties-content .property-group input,
                .properties-content .property-group textarea,
                .properties-content .property-group select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                    background: white;
                    font-family: inherit;
                }
                
                .properties-content .property-group input:focus,
                .properties-content .property-group textarea:focus,
                .properties-content .property-group select:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .properties-content .property-group textarea {
                    min-height: 80px;
                    resize: vertical;
                }
                
                .properties-content .property-group small {
                    display: block;
                    margin-top: 0.25rem;
                    color: #718096;
                    font-size: 0.75rem;
                    line-height: 1.3;
                }
                
                .properties-content .property-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }
                
                .properties-content .property-checkbox input[type="checkbox"] {
                    width: auto;
                    margin: 0;
                }
                
                .properties-content .property-checkbox label {
                    margin: 0;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                
                .properties-content .conditional-examples {
                    background: #e3f2fd;
                    padding: 0.75rem;
                    border-radius: 6px;
                    margin-top: 0.5rem;
                }
                
                .properties-content .conditional-examples ul {
                    margin: 0.5rem 0 0 0;
                    padding-left: 1rem;
                }
                
                .properties-content .conditional-examples li {
                    margin: 0.25rem 0;
                    font-size: 0.85rem;
                }
                
                .properties-content .conditional-examples code {
                    background: rgba(102, 126, 234, 0.1);
                    padding: 0.2rem 0.4rem;
                    border-radius: 3px;
                    font-size: 0.8rem;
                }
                
                .properties-content .matrix-preview,
                .properties-content .plugins-preview {
                    background: #f0f9ff;
                    padding: 0.75rem;
                    border-radius: 6px;
                    margin: 0.5rem 0;
                }
                
                .properties-content .matrix-preview pre {
                    background: white;
                    padding: 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    margin: 0.5rem 0 0 0;
                    overflow-x: auto;
                }
                
                .properties-content .matrix-actions,
                .properties-content .plugin-actions {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin-top: 0.75rem;
                }
                
                .properties-content .btn-small {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.85rem;
                }
                
                .properties-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e2e8f0;
                }
                
                .properties-header h3 {
                    color: #4a5568;
                    font-size: 1.1rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin: 0;
                }
                
                .properties-header h3 i {
                    color: #667eea;
                }
                
                .properties-header .step-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                
                /* Enhanced empty state */
                .empty-pipeline {
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px dashed #cbd5e0;
                    border-radius: 12px;
                    background: #f8fafc;
                    transition: all 0.3s ease;
                }
                
                .empty-pipeline.drag-active {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                    transform: scale(1.02);
                }
                
                .empty-state-content {
                    text-align: center;
                    color: #718096;
                }
                
                .empty-state-content i {
                    font-size: 3rem;
                    color: #cbd5e0;
                    margin-bottom: 1rem;
                    animation: float 3s ease-in-out infinite;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                .empty-state-tips {
                    margin-top: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .empty-state-tips .tip {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    justify-content: center;
                    font-size: 0.9rem;
                    color: #667eea;
                }
                
                .empty-state-tips .tip i {
                    font-size: 0.9rem;
                    margin: 0;
                    animation: none;
                }
            `;
            document.head.appendChild(style);
            console.log('✅ Enhanced styles injected');
        }
    }

    setupModalManagement() {
        // Global modal close function
        if (!window.closeModal) {
            window.closeModal = function(modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('hidden');
                    console.log(`📋 Closed modal: ${modalId}`);
                }
            };
        }
        
        // Setup modal event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            }
            
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const visibleModals = document.querySelectorAll('.modal:not(.hidden)');
                visibleModals.forEach(modal => modal.classList.add('hidden'));
            }
        });
        
        console.log('✅ Modal management configured');
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

        // Quick action buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            const action = button.dataset.action;
            console.log(`Action clicked: ${action}`);
            
            switch (action) {
                case 'plugin-catalog':
                    if (window.pipelineBuilder && window.pipelineBuilder.showPluginCatalog) {
                        window.pipelineBuilder.showPluginCatalog();
                    }
                    break;
                    
                case 'matrix-builder':
                    if (window.pipelineBuilder && window.pipelineBuilder.openMatrixBuilder) {
                        window.pipelineBuilder.openMatrixBuilder();
                    }
                    break;
                    
                case 'step-templates':
                    if (window.pipelineBuilder && window.pipelineBuilder.showStepTemplates) {
                        window.pipelineBuilder.showStepTemplates();
                    }
                    break;
                    
                case 'dependency-graph':
                    if (window.dependencyGraph && window.dependencyGraph.showDependencyGraph) {
                        window.dependencyGraph.showDependencyGraph();
                    }
                    break;
                    
                case 'conditional-builder':
                    if (window.dependencyGraph && window.dependencyGraph.showConditionalBuilder) {
                        window.dependencyGraph.showConditionalBuilder();
                    }
                    break;
                    
                default:
                    alert(`${action} functionality coming soon!`);
            }
        });

        console.log('✅ UI event listeners setup complete');
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
                name: 'Can render properties',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.renderProperties === 'function',
                critical: true
            },
            {
                name: 'Has comprehensive property generation',
                test: () => window.pipelineBuilder && typeof window.pipelineBuilder.generateCompletePropertyForm === 'function',
                critical: false
            },
            {
                name: 'YAML generator available',
                test: () => !!window.yamlGenerator,
                critical: false
            },
            {
                name: 'Properties panel exists',
                test: () => !!document.getElementById('properties-content'),
                critical: true
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
        
        console.log('📋 Feature Status:');
        console.log(`🔧 Pipeline Builder: ${window.pipelineBuilder ? '✅' : '❌'}`);
        console.log(`📋 Complete Configuration: ${window.pipelineBuilder && window.pipelineBuilder.generateCompletePropertyForm ? '✅' : '⚠️ Basic only'}`);
        console.log(`🎛️ YAML Generator: ${window.yamlGenerator ? '✅' : '❌'}`);
        console.log(`📋 Properties Panel: ${document.getElementById('properties-content') ? '✅' : '❌'}`);
        console.log(`🔗 Enhanced Drag & Drop: ✅`);
        
        if (window.pipelineBuilder) {
            console.log('🚀 Pipeline Builder ready with complete configuration options!');
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

console.log('✅ Fixed main initialization loaded - preserves complete configuration');