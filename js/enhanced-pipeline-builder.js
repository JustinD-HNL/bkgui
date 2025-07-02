// js/enhanced-pipeline-builder.js
/**
 * Enhanced Pipeline Builder with Complete Step Configuration & Dependencies
 * Extends the base PipelineBuilder with advanced Buildkite features
 * FIXED: Complete implementation with all working functionality - NO "coming soon" messages
 */

class EnhancedPipelineBuilderWithDependencies extends PipelineBuilder {
    constructor() {
        super();
        console.log('🚀 Initializing Enhanced Pipeline Builder with ALL Dependencies...');
        
        // Enhanced properties
        this.dependencyGraph = null;
        this.matrixPresets = this.initializeMatrixPresets();
        this.conditionTemplates = this.initializeConditionTemplates();
        this.stepTemplates = this.initializeStepTemplates();
        
        // Initialize enhanced features
        this.initializeEnhancedFeatures();
        
        console.log('✅ Enhanced Pipeline Builder with ALL Dependencies initialized');
    }

    initializeEnhancedFeatures() {
        // Initialize dependency graph
        if (window.DependencyGraphManager) {
            this.dependencyGraph = new window.DependencyGraphManager(this);
            window.dependencyGraph = this.dependencyGraph;
        }
        
        // Initialize matrix builder
        this.initializeMatrixBuilder();
        
        // Setup enhanced event listeners
        this.setupEnhancedEventListeners();
        
        // Initialize plugin catalog
        this.initializePluginCatalog();
        
        // Initialize step templates
        this.initializeStepTemplateSystem();
    }

    initializeMatrixBuilder() {
        // Matrix builder specific initialization
        this.matrixCurrentStep = null;
        
        // Setup matrix modal events
        this.setupMatrixBuilderEvents();
        
        console.log('✅ Matrix builder initialized');
    }

    setupMatrixBuilderEvents() {
        // Matrix builder event handlers are set up in the modal itself
        console.log('✅ Matrix builder events configured');
    }

    initializeStepTemplateSystem() {
        // Ensure step templates are properly initialized
        if (!this.stepTemplates) {
            this.stepTemplates = this.initializeStepTemplates();
        }
        console.log('✅ Step template system initialized with', Object.keys(this.stepTemplates).length, 'templates');
    }

    // ENHANCED STEP CREATION
    createStep(type) {
        const step = {
            id: `step-${++this.stepCounter}`,
            type: type,
            label: this.getStepLabel(type),
            icon: this.getStepIcon(type),
            properties: this.getDefaultProperties(type)
        };
        
        console.log(`Created ${type} step:`, step.id);
        return step;
    }

    getStepLabel(type) {
        const labels = {
            command: 'Command Step',
            wait: 'Wait Step', 
            block: 'Block Step',
            input: 'Input Step',
            trigger: 'Trigger Step',
            group: 'Group Step',
            annotation: 'Annotation Step',
            plugin: 'Plugin Step',
            notify: 'Notify Step',
            upload: 'Pipeline Upload'
        };
        return labels[type] || 'Unknown Step';
    }

    getStepIcon(type) {
        const icons = {
            command: 'fas fa-terminal',
            wait: 'fas fa-hourglass-half',
            block: 'fas fa-hand-paper', 
            input: 'fas fa-keyboard',
            trigger: 'fas fa-play',
            group: 'fas fa-layer-group',
            annotation: 'fas fa-sticky-note',
            plugin: 'fas fa-plug',
            notify: 'fas fa-bell',
            upload: 'fas fa-upload'
        };
        return icons[type] || 'fas fa-circle';
    }

    // MATRIX BUILDER METHODS
    initializeMatrixPresets() {
        return {
            'node-versions': {
                name: 'Node.js Versions',
                dimensions: {
                    node_version: ['14', '16', '18', '20'],
                    os: ['ubuntu', 'windows']
                }
            },
            'os-matrix': {
                name: 'Operating Systems',
                dimensions: {
                    os: ['ubuntu-latest', 'windows-latest', 'macos-latest']
                }
            },
            'browser-matrix': {
                name: 'Browser Testing',
                dimensions: {
                    browser: ['chrome', 'firefox', 'safari'],
                    browser_version: ['latest', 'latest-1']
                }
            }
        };
    }

    showMatrixTemplates() {
        console.log('🔲 Opening matrix builder...');
        this.openMatrixBuilder();
    }

    openMatrixBuilder(stepId) {
        console.log('🔲 Opening matrix builder for step:', stepId);
        
        if (stepId) {
            this.matrixCurrentStep = stepId;
        } else if (this.selectedStep) {
            this.matrixCurrentStep = this.selectedStep;
        } else {
            // Create a default command step for matrix if none selected
            const step = this.createStep('command');
            step.properties.label = 'Matrix Step';
            this.steps.push(step);
            this.matrixCurrentStep = step.id;
            this.renderPipeline();
            this.selectStep(step.id);
        }

        const modal = document.getElementById('matrix-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.renderMatrixBuilder();
        } else {
            console.warn('Matrix builder modal not found');
        }
    }

    renderMatrixBuilder() {
        // Render matrix presets
        const presetContainer = document.getElementById('matrix-preset-buttons');
        if (presetContainer) {
            presetContainer.innerHTML = Object.entries(this.matrixPresets).map(([key, preset]) => `
                <button class="btn btn-outline" onclick="window.pipelineBuilder.applyMatrixPreset('${key}')">
                    ${preset.name}
                </button>
            `).join('');
        }

        // Ensure we have at least one dimension input
        const dimensionsContainer = document.getElementById('matrix-dimensions');
        if (dimensionsContainer && dimensionsContainer.children.length === 0) {
            this.addMatrixDimension();
        }
    }

    addMatrixDimension() {
        const container = document.getElementById('matrix-dimensions');
        if (!container) return;

        const dimensionHTML = `
            <div class="matrix-dimension">
                <label>Dimension Name:</label>
                <input type="text" class="dimension-name" placeholder="e.g., os" />
                <label>Values (comma-separated):</label>
                <input type="text" class="dimension-values" placeholder="e.g., linux, windows, macos" />
                <button type="button" class="btn btn-secondary btn-small" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', dimensionHTML);
    }

    applyMatrixPreset(presetKey) {
        console.log('📋 Applying matrix preset:', presetKey);
        
        const preset = this.matrixPresets[presetKey];
        if (!preset) return;

        const container = document.getElementById('matrix-dimensions');
        if (!container) return;

        // Clear existing dimensions
        container.innerHTML = '';

        // Add preset dimensions
        Object.entries(preset.dimensions).forEach(([name, values]) => {
            const dimensionHTML = `
                <div class="matrix-dimension">
                    <label>Dimension Name:</label>
                    <input type="text" class="dimension-name" value="${name}" />
                    <label>Values (comma-separated):</label>
                    <input type="text" class="dimension-values" value="${values.join(', ')}" />
                    <button type="button" class="btn btn-secondary btn-small" onclick="this.parentElement.remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', dimensionHTML);
        });
    }

    applyMatrixToStep() {
        console.log('✅ Applying matrix to step:', this.matrixCurrentStep);
        
        if (!this.matrixCurrentStep) {
            alert('No step selected for matrix configuration');
            return;
        }

        const step = this.steps.find(s => s.id === this.matrixCurrentStep);
        if (!step) {
            alert('Selected step not found');
            return;
        }

        if (step.type !== 'command' && step.type !== 'plugin') {
            alert('Matrix can only be applied to command or plugin steps');
            return;
        }

        const dimensions = {};
        const dimensionElements = document.querySelectorAll('.matrix-dimension');
        
        dimensionElements.forEach(element => {
            const name = element.querySelector('.dimension-name').value.trim();
            const values = element.querySelector('.dimension-values').value.trim();
            
            if (name && values) {
                dimensions[name] = values.split(',').map(v => v.trim()).filter(v => v);
            }
        });

        if (Object.keys(dimensions).length === 0) {
            alert('Please add at least one matrix dimension');
            return;
        }

        step.properties.matrix = {
            setup: dimensions
        };

        // Close modal and refresh
        const modal = document.getElementById('matrix-builder-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        this.renderPipeline();
        this.renderProperties();

        console.log('✅ Matrix applied to step:', step.id, dimensions);
    }

    // PLUGIN CATALOG METHODS
    initializePluginCatalog() {
        // Plugin catalog is already defined in the parent class
        console.log('✅ Plugin catalog ready with', Object.keys(this.pluginCatalog).length, 'plugins');
    }

    showPluginCatalog() {
        console.log('🔌 Opening plugin catalog...');
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            this.renderPluginCatalog();
            modal.classList.remove('hidden');
        } else {
            console.warn('Plugin catalog modal not found');
        }
    }

    renderPluginCatalog() {
        const container = document.getElementById('plugin-catalog-content');
        if (!container) return;

        const pluginHTML = Object.entries(this.pluginCatalog).map(([key, plugin]) => `
            <div class="plugin-card" data-plugin-key="${key}">
                <div class="plugin-header">
                    <div class="plugin-info">
                        <h4>${plugin.name}</h4>
                        <span class="plugin-version">${plugin.version}</span>
                        <span class="plugin-category">${plugin.category}</span>
                    </div>
                    <button class="btn btn-primary btn-small" onclick="window.pipelineBuilder.addPluginStep('${key}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <p class="plugin-description">${plugin.description}</p>
                <div class="plugin-config-preview">
                    <strong>Configuration:</strong>
                    ${Object.entries(plugin.config || {}).map(([configKey, config]) => `
                        <div class="config-item">
                            <code>${configKey}</code>: ${config.type}${config.required ? ' *' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        container.innerHTML = pluginHTML;
    }

    addPluginStep(pluginKey) {
        console.log('➕ Adding plugin step:', pluginKey);
        
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) return;

        const step = this.createStep('plugin');
        step.properties.label = `${plugin.name} Step`;
        step.properties.selected_plugin = pluginKey;
        
        // Set default plugin configuration
        const defaultConfig = {};
        Object.entries(plugin.config || {}).forEach(([key, config]) => {
            if (config.default !== undefined) {
                defaultConfig[key] = config.default;
            }
        });
        
        step.properties.plugins = {
            [pluginKey]: defaultConfig
        };

        this.steps.push(step);
        this.renderPipeline();
        this.selectStep(step.id);

        // Close modal
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        console.log('✅ Plugin step added:', step.id);
    }

    // STEP TEMPLATES METHODS - COMPLETE IMPLEMENTATION
    initializeStepTemplates() {
        return {
            'test-suite': {
                name: 'Complete Test Suite',
                description: 'Comprehensive testing pipeline with linting, unit tests, and integration tests',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Install Dependencies',
                            command: 'npm ci',
                            key: 'install',
                            timeout_in_minutes: 10
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Lint Code',
                            command: 'npm run lint',
                            key: 'lint',
                            depends_on: ['install'],
                            timeout_in_minutes: 5
                        }
                    },
                    {
                        type: 'command', 
                        properties: {
                            label: 'Unit Tests',
                            command: 'npm test',
                            key: 'test',
                            depends_on: ['lint'],
                            timeout_in_minutes: 15,
                            artifact_paths: 'test-results/*.xml'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Integration Tests',
                            command: 'npm run test:integration', 
                            key: 'integration',
                            depends_on: ['test'],
                            timeout_in_minutes: 20
                        }
                    }
                ]
            },
            'docker-build': {
                name: 'Docker Build & Push',
                description: 'Build Docker image, run tests in container, and push to registry',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Docker Image',
                            command: 'docker build -t my-app:${BUILDKITE_COMMIT} .',
                            key: 'docker-build',
                            timeout_in_minutes: 10
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Test in Container',
                            command: 'docker run --rm my-app:${BUILDKITE_COMMIT} npm test',
                            key: 'docker-test',
                            depends_on: ['docker-build'],
                            timeout_in_minutes: 15
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Security Scan',
                            command: 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy my-app:${BUILDKITE_COMMIT}',
                            key: 'security-scan',
                            depends_on: ['docker-build'],
                            timeout_in_minutes: 10
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Push to Registry',
                            command: 'docker push my-app:${BUILDKITE_COMMIT}',
                            key: 'docker-push',
                            if: 'build.branch == "main"',
                            timeout_in_minutes: 5
                        }
                    }
                ]
            },
            'deployment-pipeline': {
                name: 'Staged Deployment',
                description: 'Deploy through staging to production with manual approvals',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Application',
                            command: 'npm run build',
                            key: 'build',
                            timeout_in_minutes: 10,
                            artifact_paths: 'dist/**/*'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy to Staging',
                            command: 'npm run deploy:staging',
                            key: 'deploy-staging',
                            depends_on: ['build'],
                            timeout_in_minutes: 5
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Run Smoke Tests',
                            command: 'npm run test:smoke',
                            key: 'smoke-test',
                            depends_on: ['deploy-staging'],
                            timeout_in_minutes: 10
                        }
                    },
                    {
                        type: 'block',
                        properties: {
                            label: 'Production Deployment Approval',
                            prompt: 'Staging tests passed. Deploy to production?',
                            key: 'prod-approval'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy to Production',
                            command: 'npm run deploy:production',
                            key: 'deploy-production',
                            depends_on: ['prod-approval'],
                            timeout_in_minutes: 10
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Post-Deploy Verification',
                            command: 'npm run verify:production',
                            key: 'verify-production',
                            depends_on: ['deploy-production'],
                            timeout_in_minutes: 5
                        }
                    }
                ]
            },
            'quality-gates': {
                name: 'Quality Gates',
                description: 'Comprehensive quality checks with coverage and security',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Code Quality Check',
                            command: 'npm run quality',
                            key: 'quality',
                            timeout_in_minutes: 10
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Security Audit',
                            command: 'npm audit --audit-level high',
                            key: 'security',
                            timeout_in_minutes: 5
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Test Coverage',
                            command: 'npm run coverage',
                            key: 'coverage',
                            timeout_in_minutes: 15,
                            artifact_paths: 'coverage/**/*'
                        }
                    },
                    {
                        type: 'annotation',
                        properties: {
                            label: 'Quality Report',
                            body: 'Quality gates completed. Check artifacts for detailed reports.',
                            style: 'success',
                            context: 'quality'
                        }
                    }
                ]
            }
        };
    }

    showStepTemplates() {
        console.log('📋 Opening step templates...');
        const modal = document.getElementById('templates-modal');
        if (modal) {
            this.renderStepTemplates();
            modal.classList.remove('hidden');
        } else {
            console.warn('Step templates modal not found');
        }
    }

    renderStepTemplates() {
        const container = document.getElementById('templates-content');
        if (!container) return;

        const templatesHTML = Object.entries(this.stepTemplates).map(([key, template]) => `
            <div class="template-card" data-template-key="${key}">
                <div class="template-header">
                    <div class="template-info">
                        <h4>${template.name}</h4>
                        <p class="template-description">${template.description}</p>
                    </div>
                    <button class="btn btn-primary btn-small" onclick="window.pipelineBuilder.addTemplate('${key}')">
                        <i class="fas fa-plus"></i> Apply Template
                    </button>
                </div>
                <div class="template-steps-preview">
                    <strong>Steps (${template.steps.length}):</strong>
                    <ul>
                        ${template.steps.map(step => `<li><i class="${this.getStepIcon(step.type)}"></i> ${step.properties.label}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');

        container.innerHTML = templatesHTML;
    }

    addTemplate(templateKey) {
        console.log('📋 Adding template:', templateKey);
        
        const template = this.stepTemplates[templateKey];
        if (!template) return;

        // Clear existing pipeline if user confirms
        if (this.steps.length > 0) {
            if (!confirm(`This will replace your current pipeline with the "${template.name}" template. Continue?`)) {
                return;
            }
            this.steps = [];
            this.stepCounter = 0;
        }

        // Add all template steps
        template.steps.forEach(stepTemplate => {
            const step = this.createStep(stepTemplate.type);
            Object.assign(step.properties, stepTemplate.properties);
            this.steps.push(step);
        });

        this.renderPipeline();
        
        // Close modal
        const modal = document.getElementById('templates-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        console.log('✅ Template applied:', templateKey, `(${template.steps.length} steps)`);
    }

    // CONDITIONAL LOGIC METHODS
    initializeConditionTemplates() {
        return {
            'main-branch': 'build.branch == "main"',
            'pull-request': 'build.pull_request != null',
            'file-changes': 'build.env("CHANGED_FILES") =~ /\\.(js|ts)$/',
            'production-env': 'build.env("ENVIRONMENT") == "production"'
        };
    }

    openConditionalBuilder(stepId) {
        console.log('🔀 Opening conditional builder for step:', stepId);
        
        if (window.dependencyGraph && window.dependencyGraph.showConditionalBuilder) {
            window.dependencyGraph.showConditionalBuilder();
        } else {
            // Fallback implementation
            const step = this.steps.find(s => s.id === stepId);
            if (step) {
                const condition = prompt('Enter condition expression:', step.properties.if || '');
                if (condition !== null) {
                    step.properties.if = condition;
                    this.renderPipeline();
                    this.renderProperties();
                }
            }
        }
    }

    openDependencyManager(stepId) {
        console.log('🔗 Opening dependency manager for step:', stepId);
        
        if (window.dependencyGraph && window.dependencyGraph.showDependencyManager) {
            window.dependencyGraph.showDependencyManager();
        } else {
            // Fallback implementation
            const step = this.steps.find(s => s.id === stepId);
            if (step) {
                const deps = prompt('Enter step dependencies (comma-separated):', (step.properties.depends_on || []).join(', '));
                if (deps !== null) {
                    step.properties.depends_on = deps.split(',').map(d => d.trim()).filter(d => d);
                    this.renderPipeline();
                    this.renderProperties();
                }
            }
        }
    }

    // ENHANCED EVENT LISTENERS
    setupEnhancedEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'p':
                        e.preventDefault();
                        this.showPluginCatalog();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.openMatrixBuilder();
                        break;
                    case 't':
                        e.preventDefault();
                        this.showStepTemplates();
                        break;
                    case 'g':
                        e.preventDefault();
                        if (this.dependencyGraph) {
                            this.dependencyGraph.showDependencyGraph();
                        }
                        break;
                }
            }
        });

        // Template item click handlers
        document.addEventListener('click', (e) => {
            const templateItem = e.target.closest('.template-item');
            if (templateItem) {
                const template = templateItem.dataset.template;
                if (template) {
                    this.addTemplate(template);
                }
            }

            const patternItem = e.target.closest('.pattern-item');
            if (patternItem) {
                const pattern = patternItem.dataset.pattern;
                if (pattern && window.pipelinePatterns) {
                    window.pipelinePatterns.applyPattern(pattern);
                }
            }

            const pluginQuick = e.target.closest('.plugin-quick');
            if (pluginQuick) {
                const plugin = pluginQuick.dataset.plugin;
                if (plugin) {
                    this.addPluginStep(plugin);
                }
            }
        });

        console.log('✅ Enhanced event listeners configured');
    }

    // Override parent methods to ensure compatibility
    addStep(type, index = this.steps.length) {
        const step = this.createStep(type);
        this.steps.splice(index, 0, step);
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        this.updateLastSaved();
        console.log(`Added ${type} step:`, step.id);
    }

    updateStepCount() {
        const stepCountElement = document.getElementById('step-count');
        if (stepCountElement) {
            stepCountElement.textContent = this.steps.length;
        }
    }

    updateLastSaved() {
        const lastSavedElement = document.getElementById('last-saved');
        if (lastSavedElement) {
            const now = new Date();
            lastSavedElement.textContent = now.toLocaleTimeString();
        }
    }
}

// Export to global scope and ensure it's available
window.EnhancedPipelineBuilderWithDependencies = EnhancedPipelineBuilderWithDependencies;

console.log('✅ Enhanced Pipeline Builder with ALL working functionality loaded');