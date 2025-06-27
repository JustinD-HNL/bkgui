// js/main-init.js
/**
 * Main Initialization Script
 * Coordinates the loading of all pipeline builder components
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
        this.maxRetries = 10;
        this.retryCount = 0;
    }

    async initialize() {
        console.log('🚀 Starting Enhanced Pipeline Builder initialization...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Initialize components in order
        await this.initializeSteps();
    }

    async initializeSteps() {
        for (const step of this.initializationSteps) {
            console.log(`🔧 Initializing: ${step.name}`);
            
            // Wait for dependencies to be available
            let attempts = 0;
            while (!step.check() && attempts < this.maxRetries) {
                await this.wait(100);
                attempts++;
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
        
        console.log('🎉 Pipeline Builder initialization complete!');
        this.logFeatureStatus();
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
            
            // Attach pattern functionality if available
            if (window.pipelinePatterns) {
                window.pipelineBuilder.addPattern = function(patternKey) {
                    console.log('Applying pattern:', patternKey);
                    window.pipelinePatterns.applyPattern(patternKey);
                };
            }
            
        } else {
            throw new Error('PipelineBuilder class not found');
        }
    }

    async initDependencyGraph() {
        if (window.DependencyGraphManager && window.pipelineBuilder) {
            if (!window.pipelineBuilder.dependencyGraph) {
                window.pipelineBuilder.dependencyGraph = new window.DependencyGraphManager(window.pipelineBuilder);
                window.dependencyGraph = window.pipelineBuilder.dependencyGraph;
                
                // Add enhanced keyboard shortcuts if not already present
                this.setupEnhancedShortcuts();
                
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
        
        // Final verification
        this.verifyFunctionality();
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
                
                switch (methodName) {
                    case 'addTemplate':
                        builder[methodName] = function(templateKey) {
                            console.log(`Adding template: ${templateKey}`);
                            alert(`Template "${templateKey}" functionality coming soon!`);
                        };
                        break;
                    
                    case 'addPattern':
                        builder[methodName] = function(patternKey) {
                            console.log(`Adding pattern: ${patternKey}`);
                            if (window.pipelinePatterns && window.pipelinePatterns.applyPattern) {
                                window.pipelinePatterns.applyPattern(patternKey);
                            } else {
                                alert(`Pattern "${patternKey}" functionality coming soon!`);
                            }
                        };
                        break;
                    
                    case 'addPluginStep':
                        builder[methodName] = function(pluginKey) {
                            console.log(`Adding plugin step: ${pluginKey}`);
                            const step = builder.createStep('command');
                            step.properties.label = `${pluginKey} Plugin Step`;
                            step.properties.plugins = { [pluginKey]: {} };
                            builder.steps.push(step);
                            builder.renderPipeline();
                            builder.selectStep(step.id);
                        };
                        break;
                    
                    default:
                        builder[methodName] = function() {
                            console.log(`${methodName} called`);
                            alert(`${methodName} functionality coming soon!`);
                        };
                }
            } else {
                console.log(`✅ Method ${methodName} verified`);
            }
        });

        // Enhanced features methods
        if (builder.dependencyGraph) {
            const dependencyMethods = [
                'showDependencyGraph', 'showConditionalBuilder', 'showDependencyManager'
            ];
            
            dependencyMethods.forEach(methodName => {
                if (!builder[methodName]) {
                    const dgMethodName = methodName;
                    builder[methodName] = function() {
                        if (builder.dependencyGraph && typeof builder.dependencyGraph[dgMethodName] === 'function') {
                            builder.dependencyGraph[dgMethodName]();
                        } else {
                            console.warn(`Dependency graph method ${dgMethodName} not available`);
                            alert(`${methodName} functionality not available`);
                        }
                    };
                }
            });
        }
    }

    setupEnhancedShortcuts() {
        if (window.pipelineBuilder && window.pipelineBuilder.dependencyGraph) {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    switch (e.key) {
                        case 'g':
                            e.preventDefault();
                            if (window.pipelineBuilder.dependencyGraph.showDependencyGraph) {
                                window.pipelineBuilder.dependencyGraph.showDependencyGraph();
                            }
                            break;
                        case 'l':
                            e.preventDefault();
                            if (window.pipelineBuilder.dependencyGraph.showConditionalBuilder) {
                                window.pipelineBuilder.dependencyGraph.showConditionalBuilder();
                            }
                            break;
                        case 'd':
                            e.preventDefault();
                            if (window.pipelineBuilder.dependencyGraph.showDependencyManager) {
                                window.pipelineBuilder.dependencyGraph.showDependencyManager();
                            }
                            break;
                    }
                }
            });
        }
    }

    setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Pipeline Builder Error:', e.error);
            
            // Don't show alerts for every error, just log them
            if (e.error.message.includes('pipelineBuilder')) {
                console.error('Pipeline Builder specific error detected');
            }
        });
    }

    setupModalManagement() {
        // Global modal close function
        window.closeModal = function(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
            }
        };
        
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
            }
        });
        
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal:not(.hidden)');
                openModals.forEach(modal => modal.classList.add('hidden'));
            }
        });
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
            console.log('   Ctrl+P - Plugin Catalog');
            console.log('   Ctrl+M - Matrix Builder');
            console.log('   Ctrl+T - Step Templates');
            
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