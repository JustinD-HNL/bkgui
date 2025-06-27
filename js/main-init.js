// js/main-init.js
/**
 * Main Initialization Script - Diagnostic Version
 * Finds and fixes why classes aren't loading instead of masking the problem
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
        
        this.maxRetries = 20;
        this.debugMode = true;
    }

    async initialize() {
        console.log('🚀 Starting Pipeline Builder initialization with diagnostics...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        // Run comprehensive diagnostics first
        await this.runDiagnostics();

        // Initialize components in order
        await this.initializeSteps();
    }

    async runDiagnostics() {
        console.log('🔍 Running comprehensive diagnostics...');
        
        // Check if scripts are loaded
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        console.log('📁 Loaded scripts:');
        scripts.forEach(script => {
            console.log(`   ${script.src.split('/').pop()}: ${script.readyState || 'unknown'}`);
        });

        // Check for JavaScript errors
        console.log('🔍 Checking for global JavaScript errors...');
        
        // Check what's in global scope
        console.log('🌐 Pipeline-related globals:');
        const globals = Object.keys(window).filter(key => 
            key.toLowerCase().includes('pipeline') || 
            key.toLowerCase().includes('yaml') || 
            key.toLowerCase().includes('dependency') ||
            key.toLowerCase().includes('builder')
        );
        globals.forEach(key => {
            console.log(`   window.${key}:`, typeof window[key], window[key]);
        });

        // Try to manually check if the classes exist but aren't exported
        console.log('🔍 Checking for class definitions...');
        
        // Check if the scripts actually executed
        console.log('📊 Script execution status:');
        console.log(`   yamlGenerator: ${!!window.yamlGenerator}`);
        console.log(`   PipelineBuilder: ${!!window.PipelineBuilder}`);
        console.log(`   EnhancedPipelineBuilder: ${!!window.EnhancedPipelineBuilder}`);
        console.log(`   PipelinePatterns: ${!!window.PipelinePatterns}`);
        console.log(`   DependencyGraphManager: ${!!window.DependencyGraphManager}`);

        // Wait a bit more for async loading
        await this.wait(1000);
        
        // Check again after waiting
        console.log('🔍 Checking again after 1 second delay...');
        console.log(`   yamlGenerator: ${!!window.yamlGenerator}`);
        console.log(`   PipelineBuilder: ${!!window.PipelineBuilder}`);
        console.log(`   EnhancedPipelineBuilder: ${!!window.EnhancedPipelineBuilder}`);
        console.log(`   PipelinePatterns: ${!!window.PipelinePatterns}`);
        console.log(`   DependencyGraphManager: ${!!window.DependencyGraphManager}`);

        // If still no classes, there's a fundamental loading issue
        if (!window.PipelineBuilder && !window.yamlGenerator) {
            console.error('❌ CRITICAL: No classes are loading at all!');
            console.error('💡 This suggests a JavaScript syntax error is preventing script execution');
            console.error('🔧 Check browser console for "Uncaught SyntaxError" messages');
            
            // Try to identify which script has the syntax error
            await this.testScriptLoading();
        }
    }

    async testScriptLoading() {
        console.log('🧪 Testing individual script loading...');
        
        const testScripts = [
            'js/yaml-generator.js',
            'js/pipeline-builder.js', 
            'js/enhanced-pipeline-builder.js',
            'js/pipeline-patterns.js',
            'js/dependency-graph.js'
        ];

        for (const scriptPath of testScripts) {
            try {
                console.log(`Testing ${scriptPath}...`);
                
                // Try to fetch the script content to see if there are obvious syntax issues
                const response = await fetch(scriptPath);
                const scriptContent = await response.text();
                
                // Basic syntax checks
                const issues = [];
                
                // Check for common syntax issues
                if (scriptContent.includes('class ') && !scriptContent.includes('window.')) {
                    issues.push('Class defined but may not be exported to global scope');
                }
                
                const braceCount = (scriptContent.match(/\{/g) || []).length - (scriptContent.match(/\}/g) || []).length;
                if (braceCount !== 0) {
                    issues.push(`Unmatched braces: ${braceCount > 0 ? 'missing closing' : 'extra closing'} braces`);
                }
                
                const parenCount = (scriptContent.match(/\(/g) || []).length - (scriptContent.match(/\)/g) || []).length;
                if (parenCount !== 0) {
                    issues.push(`Unmatched parentheses: ${parenCount > 0 ? 'missing closing' : 'extra closing'} parentheses`);
                }

                if (issues.length > 0) {
                    console.error(`❌ ${scriptPath} issues:`, issues);
                } else {
                    console.log(`✅ ${scriptPath} basic syntax looks okay`);
                }
                
            } catch (error) {
                console.error(`❌ Failed to test ${scriptPath}:`, error);
            }
        }
    }

    async initializeSteps() {
        for (const step of this.initializationSteps) {
            console.log(`🔧 Initializing: ${step.name}`);
            
            // Wait for dependencies to be available
            let attempts = 0;
            while (!step.check() && attempts < this.maxRetries) {
                await this.wait(100);
                attempts++;
                
                if (attempts % 5 === 0) {
                    console.log(`   ⏳ Still waiting for ${step.name}... (${attempts}/${this.maxRetries})`);
                }
            }
            
            if (!step.check() && step.name !== 'Post-initialization') {
                console.error(`❌ FAILED: ${step.name} not available after ${this.maxRetries} attempts`);
                console.error(`💡 This indicates a fundamental loading problem that needs to be fixed`);
                
                // Don't continue with broken initialization
                if (step.name === 'Pipeline Builder') {
                    throw new Error(`Critical component ${step.name} failed to load. Check for JavaScript syntax errors.`);
                }
                continue;
            }
            
            try {
                await step.init();
                console.log(`✅ ${step.name} initialized successfully`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${step.name}:`, error);
                throw error; // Don't mask the error
            }
        }
        
        console.log('🎉 Pipeline Builder initialization complete!');
        this.logFeatureStatus();
    }

    async initYamlGenerator() {
        if (!window.yamlGenerator) {
            throw new Error('YAML Generator class not found - check js/yaml-generator.js for syntax errors');
        }
    }

    async initPipelinePatterns() {
        if (window.PipelinePatterns) {
            window.pipelinePatterns = new window.PipelinePatterns();
            console.log('📋 Pipeline patterns initialized');
        } else {
            console.warn('Pipeline Patterns class not found - this is optional');
        }
    }

    async initPipelineBuilder() {
        if (!window.PipelineBuilder) {
            throw new Error('PipelineBuilder class not found - check js/pipeline-builder.js for syntax errors and proper export');
        }

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
        
        // Verify the instance was created properly
        if (!window.pipelineBuilder.renderPipeline) {
            throw new Error('Pipeline Builder instance is missing core methods - check class implementation');
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
            console.warn('Dependency Graph Manager not available - this is optional');
        }
    }

    async postInit() {
        // Setup event listeners for UI elements
        this.setupUIEventListeners();
        
        // Setup modal management
        this.setupModalManagement();
        
        // Final verification
        this.verifyFunctionality();
    }

    setupUIEventListeners() {
        console.log('🔧 Setting up UI event listeners...');
        
        // Header buttons - replace inline onclick handlers with proper event listeners
        const clearBtn = document.getElementById('clear-pipeline');
        const loadBtn = document.getElementById('load-example');
        const exportBtn = document.getElementById('export-yaml');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (window.pipelineBuilder && window.pipelineBuilder.clearPipeline) {
                    window.pipelineBuilder.clearPipeline();
                } else {
                    console.error('clearPipeline method not available');
                }
            });
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (window.pipelineBuilder && window.pipelineBuilder.loadExample) {
                    window.pipelineBuilder.loadExample();
                } else {
                    console.error('loadExample method not available');
                }
            });
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (window.pipelineBuilder && window.pipelineBuilder.exportYAML) {
                    window.pipelineBuilder.exportYAML();
                } else {
                    console.error('exportYAML method not available');
                }
            });
        }

        // Setup drag and drop for step types
        this.setupDragAndDrop();

        // Setup sidebar interaction buttons
        this.setupSidebarButtons();

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
                if (stepType && window.pipelineBuilder) {
                    if (window.pipelineBuilder.addStep) {
                        window.pipelineBuilder.addStep(stepType);
                    } else {
                        console.error('addStep method not available on pipelineBuilder');
                    }
                }
            });
        }
    }

    setupSidebarButtons() {
        // Template items
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => {
                const template = item.dataset.template;
                console.log(`Template clicked: ${template}`);
                
                if (window.pipelineBuilder && window.pipelineBuilder.addTemplate) {
                    window.pipelineBuilder.addTemplate(template);
                } else {
                    console.warn('addTemplate method not available');
                    alert(`Template "${template}" - method not available yet`);
                }
            });
        });

        // Pattern items
        document.querySelectorAll('.pattern-item').forEach(item => {
            item.addEventListener('click', () => {
                const pattern = item.dataset.pattern;
                console.log(`Pattern clicked: ${pattern}`);
                
                if (window.pipelinePatterns && window.pipelinePatterns.applyPattern) {
                    window.pipelinePatterns.applyPattern(pattern);
                } else {
                    console.warn('applyPattern method not available');
                    alert(`Pattern "${pattern}" - method not available yet`);
                }
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;
                console.log(`Action clicked: ${action}`);
                alert(`${action} functionality coming soon!`);
            });
        });

        // Plugin quick buttons
        document.querySelectorAll('.plugin-quick').forEach(item => {
            item.addEventListener('click', () => {
                const plugin = item.dataset.plugin;
                console.log(`Plugin clicked: ${plugin}`);
                
                if (window.pipelineBuilder && window.pipelineBuilder.addPluginStep) {
                    window.pipelineBuilder.addPluginStep(plugin);
                } else {
                    console.warn('addPluginStep method not available');
                    alert(`Plugin "${plugin}" - method not available yet`);
                }
            });
        });
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
                name: 'YAML Generator available',
                test: () => !!window.yamlGenerator,
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
            throw new Error(`${criticalFailures} critical functionality failures detected - pipeline builder cannot function properly`);
        } else {
            console.log('✅ All critical functionality verified');
        }
    }

    logFeatureStatus() {
        console.log('📋 Feature Status:');
        console.log(`🔧 Basic Pipeline Builder: ${window.pipelineBuilder ? '✅' : '❌'}`);
        console.log(`📋 Pipeline Patterns: ${window.pipelinePatterns ? '✅' : '❌'}`);
        console.log(`🔗 Dependency Graph: ${window.dependencyGraph ? '✅' : '❌'}`);
        console.log(`🎛️ YAML Generator: ${window.yamlGenerator ? '✅' : '❌'}`);
        
        if (window.pipelineBuilder) {
            console.log('🚀 Pipeline Builder ready for use!');
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
        mainInitializer.initialize().catch(error => {
            console.error('🚨 CRITICAL INITIALIZATION FAILURE:', error);
            alert('Pipeline Builder failed to initialize. Check console for details.');
        });
    });
} else {
    mainInitializer.initialize().catch(error => {
        console.error('🚨 CRITICAL INITIALIZATION FAILURE:', error);
        alert('Pipeline Builder failed to initialize. Check console for details.');
    });
}