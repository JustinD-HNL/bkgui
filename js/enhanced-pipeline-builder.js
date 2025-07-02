// js/enhanced-pipeline-builder.js
/**
 * Enhanced Pipeline Builder with Complete Step Configuration & Dependencies
 * Extends the base PipelineBuilder with advanced Buildkite features
 * FIXED: Complete implementation with proper initialization and all advanced features
 */

class EnhancedPipelineBuilderWithDependencies extends PipelineBuilder {
    constructor() {
        super();
        console.log('🚀 Initializing Enhanced Pipeline Builder with Dependencies...');
        
        // Enhanced properties
        this.dependencyGraph = null;
        this.matrixPresets = this.initializeMatrixPresets();
        this.conditionTemplates = this.initializeConditionTemplates();
        this.stepTemplates = this.initializeStepTemplates();
        
        // Initialize enhanced features
        this.initializeEnhancedFeatures();
        
        console.log('✅ Enhanced Pipeline Builder with Dependencies initialized');
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
    }

    initializeMatrixBuilder() {
        // Matrix builder specific initialization
        this.matrixCurrentStep = null;
        
        // Setup matrix modal events
        this.setupMatrixBuilderEvents();
        
        console.log('✅ Matrix builder initialized');
    }

    setupMatrixBuilderEvents() {
        // Add dimension button
        const addDimensionBtn = document.querySelector('[onclick*="addMatrixDimension"]');
        if (addDimensionBtn) {
            addDimensionBtn.onclick = () => this.addMatrixDimension();
        }
        
        // Apply matrix button  
        const applyMatrixBtn = document.querySelector('[onclick*="applyMatrixToStep"]');
        if (applyMatrixBtn) {
            applyMatrixBtn.onclick = () => this.applyMatrixToStep();
        }
        
        // Matrix preset buttons
        document.querySelectorAll('[onclick*="applyMatrixPreset"]').forEach(btn => {
            const preset = btn.textContent.toLowerCase().replace(/\s+/g, '-');
            btn.onclick = () => this.applyMatrixPreset(preset);
        });
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

    getDefaultProperties(type) {
        const defaults = {
            command: {
                label: 'Command Step',
                command: '',
                agents: {},
                env: {},
                timeout_in_minutes: 60,
                retry: { automatic: { limit: 2 } },
                plugins: {},
                matrix: null,
                artifact_paths: '',
                branches: '',
                if: '',
                depends_on: [],
                allow_dependency_failure: false,
                soft_fail: false,
                priority: 0,
                key: '',
                skip: false,
                concurrency: null,
                concurrency_group: '',
                parallelism: null
            },
            wait: {
                label: 'Wait Step',
                continue_on_failure: false,
                if: '',
                depends_on: [],
                allow_dependency_failure: false
            },
            block: {
                label: 'Block Step',
                prompt: 'Please confirm to continue',
                blocked_state: 'passed',
                fields: [],
                branches: '',
                if: '',
                depends_on: [],
                allow_dependency_failure: false,
                key: ''
            },
            input: {
                label: 'Input Step',
                prompt: 'Please provide input',
                fields: [],
                branches: '',
                if: '',
                depends_on: [],
                allow_dependency_failure: false,
                key: ''
            },
            trigger: {
                label: 'Trigger Step',
                trigger: '',
                async: false,
                build: {
                    message: '',
                    branch: 'main',
                    commit: 'HEAD',
                    env: {},
                    meta_data: {}
                },
                branches: '',
                if: '',
                depends_on: [],
                allow_dependency_failure: false
            },
            group: {
                label: 'Group',
                steps: [],
                key: '',
                if: '',
                depends_on: [],
                allow_dependency_failure: false
            },
            annotation: {
                label: 'Annotation',
                body: '',
                style: 'info',
                context: 'default',
                if: '',
                depends_on: [],
                allow_dependency_failure: false
            },
            plugin: {
                label: 'Plugin Step',
                plugins: {},
                selected_plugin: '',
                agents: {},
                env: {},
                timeout_in_minutes: 60,
                retry: { automatic: { limit: 0 } },
                artifact_paths: '',
                branches: '',
                if: '',
                depends_on: [],
                allow_dependency_failure: false,
                key: ''
            },
            notify: {
                label: 'Notify Step',
                command: 'echo "Sending notification"',
                notify: {
                    email: '',
                    slack: '',
                    webhook: ''
                },
                if: '',
                depends_on: [],
                allow_dependency_failure: false
            },
            upload: {
                label: 'Pipeline Upload',
                pipeline_file: '.buildkite/pipeline.yml',
                dynamic_script: '',
                replace: false,
                if: '',
                depends_on: [],
                allow_dependency_failure: false
            }
        };
        
        return { ...defaults[type] };
    }

    // ENHANCED DRAG & DROP WITH BETTER INSERTION ZONES
    setupEventListeners() {
        super.setupEventListeners();
        
        // Enhanced drag and drop
        this.setupEnhancedDragAndDrop();
    }

    setupEnhancedDragAndDrop() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;

        // Remove old listeners and add enhanced ones
        container.removeEventListener('dragover', this.handleDragOver);
        container.removeEventListener('drop', this.handleDrop);

        // Enhanced drag over with better insertion detection
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            
            // Add visual feedback
            container.classList.add('drag-over');
            
            // Find and show insertion point
            this.updateInsertionIndicator(e);
        });

        // Enhanced drop handling
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            this.clearInsertionIndicators();
            
            const stepType = e.dataTransfer.getData('text/plain');
            if (stepType) {
                const insertIndex = this.getInsertionIndex(e);
                this.addStepAtIndex(stepType, insertIndex);
            }
        });

        // Clear indicators on drag leave
        container.addEventListener('dragleave', (e) => {
            if (!container.contains(e.relatedTarget)) {
                container.classList.remove('drag-over');
                this.clearInsertionIndicators();
            }
        });
    }

    updateInsertionIndicator(e) {
        this.clearInsertionIndicators();
        
        const container = document.getElementById('pipeline-steps');
        const insertIndex = this.getInsertionIndex(e);
        
        // Create insertion indicator
        const indicator = document.createElement('div');
        indicator.className = 'insertion-indicator';
        indicator.innerHTML = '<div class="insertion-line"></div>';
        
        const steps = container.querySelectorAll('.pipeline-step');
        if (steps.length === 0 || insertIndex >= steps.length) {
            container.appendChild(indicator);
        } else {
            container.insertBefore(indicator, steps[insertIndex]);
        }
    }

    clearInsertionIndicators() {
        document.querySelectorAll('.insertion-indicator').forEach(el => el.remove());
    }

    getInsertionIndex(e) {
        const container = document.getElementById('pipeline-steps');
        const steps = Array.from(container.querySelectorAll('.pipeline-step'));
        
        if (steps.length === 0) return 0;
        
        const y = e.clientY;
        
        for (let i = 0; i < steps.length; i++) {
            const rect = steps[i].getBoundingClientRect();
            const stepCenter = rect.top + rect.height / 2;
            
            if (y < stepCenter) {
                return i;
            }
        }
        
        return steps.length;
    }

    // ENHANCED PROPERTIES RENDERING
    renderProperties() {
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

        container.innerHTML = this.generateEnhancedPropertyForm(step);
        this.setupPropertyEvents(step);
    }

    generateEnhancedPropertyForm(step) {
        const baseForm = this.generatePropertyForm(step);
        const enhancedFeatures = this.generateEnhancedFeatures(step);
        
        return `
            <div class="step-properties-header">
                <h4><i class="${step.icon}"></i> ${step.properties.label || step.type}</h4>
                <div class="step-actions">
                    <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.duplicateStep('${step.id}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.removeStep('${step.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${baseForm}
            ${enhancedFeatures}
        `;
    }

    generatePropertyForm(step) {
        switch (step.type) {
            case 'command':
                return this.generateCommandForm(step);
            case 'wait':
                return this.generateWaitForm(step);
            case 'block':
                return this.generateBlockForm(step);
            case 'input':
                return this.generateInputForm(step);
            case 'trigger':
                return this.generateTriggerForm(step);
            case 'group':
                return this.generateGroupForm(step);
            case 'annotation':
                return this.generateAnnotationForm(step);
            case 'plugin':
                return this.generatePluginForm(step);
            case 'notify':
                return this.generateNotifyForm(step);
            case 'upload':
                return this.generateUploadForm(step);
            default:
                return '<p>No configuration available for this step type.</p>';
        }
    }

    generateCommandForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-terminal"></i> Command Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Run Tests" />
                </div>
                
                <div class="property-group">
                    <label for="command">Command *</label>
                    <textarea name="command" placeholder="e.g., npm test" rows="3">${props.command}</textarea>
                </div>
                
                <div class="property-group">
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="unique-step-key" />
                    <small>Unique identifier for dependencies</small>
                </div>
            </div>

            <div class="property-section">
                <h5><i class="fas fa-server"></i> Execution Environment</h5>
                
                <div class="property-group">
                    <label for="agents">Agent Targeting</label>
                    <textarea name="agents" placeholder='{"queue": "default", "os": "linux"}' rows="3">${JSON.stringify(props.agents, null, 2)}</textarea>
                    <small>JSON object for agent requirements</small>
                </div>
                
                <div class="property-group">
                    <label for="env">Environment Variables</label>
                    <textarea name="env" placeholder='{"NODE_ENV": "test", "DEBUG": "true"}' rows="4">${JSON.stringify(props.env, null, 2)}</textarea>
                    <small>JSON object of environment variables</small>
                </div>
                
                <div class="property-group">
                    <label for="timeout_in_minutes">Timeout (minutes)</label>
                    <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes}" min="1" />
                </div>
            </div>

            <div class="property-section">
                <h5><i class="fas fa-link"></i> Dependencies & Conditions</h5>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>
        `;
    }

    generateWaitForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-hourglass-half"></i> Wait Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label</label>
                    <input type="text" name="label" value="${props.label}" placeholder="Wait for previous steps" />
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="continue_on_failure" ${props.continue_on_failure ? 'checked' : ''} />
                    <label for="continue_on_failure">Continue on Failure</label>
                </div>
            </div>
        `;
    }

    generateBlockForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-hand-paper"></i> Block Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Deploy to Production" />
                </div>
                
                <div class="property-group">
                    <label for="prompt">Prompt Message</label>
                    <textarea name="prompt" placeholder="Please confirm deployment to production" rows="3">${props.prompt}</textarea>
                </div>
                
                <div class="property-group">
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="deploy-approval" />
                </div>
            </div>
        `;
    }

    generateInputForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-keyboard"></i> Input Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Deployment Settings" />
                </div>
                
                <div class="property-group">
                    <label for="prompt">Prompt Message</label>
                    <textarea name="prompt" placeholder="Please provide deployment settings" rows="3">${props.prompt}</textarea>
                </div>
                
                <div class="property-group">
                    <label for="fields">Input Fields (JSON)</label>
                    <textarea name="fields" placeholder='[{"key": "environment", "text": "Environment", "required": true}]' rows="6">${JSON.stringify(props.fields, null, 2)}</textarea>
                </div>
            </div>
        `;
    }

    generateTriggerForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-play"></i> Trigger Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Deploy to Production" />
                </div>
                
                <div class="property-group">
                    <label for="trigger">Pipeline to Trigger *</label>
                    <input type="text" name="trigger" value="${props.trigger}" placeholder="my-org/my-pipeline" />
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="async" ${props.async ? 'checked' : ''} />
                    <label for="async">Asynchronous (don't wait for completion)</label>
                </div>
            </div>
        `;
    }

    generateGroupForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-layer-group"></i> Group Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Group Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Tests" />
                </div>
                
                <div class="property-group">
                    <label for="key">Group Key</label>
                    <input type="text" name="key" value="${props.key}" placeholder="tests-group" />
                </div>
            </div>
        `;
    }

    generateAnnotationForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-sticky-note"></i> Annotation Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label</label>
                    <input type="text" name="label" value="${props.label}" placeholder="Build Annotation" />
                </div>
                
                <div class="property-group">
                    <label for="body">Annotation Body *</label>
                    <textarea name="body" placeholder="Build completed successfully! :tada:" rows="4">${props.body}</textarea>
                </div>
                
                <div class="property-group">
                    <label for="style">Annotation Style</label>
                    <select name="style">
                        <option value="info" ${props.style === 'info' ? 'selected' : ''}>Info</option>
                        <option value="success" ${props.style === 'success' ? 'selected' : ''}>Success</option>
                        <option value="warning" ${props.style === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="error" ${props.style === 'error' ? 'selected' : ''}>Error</option>
                    </select>
                </div>
            </div>
        `;
    }

    generatePluginForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-plug"></i> Plugin Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Docker Build" />
                </div>
                
                <div class="property-group">
                    <label for="selected_plugin">Select Plugin</label>
                    <select name="selected_plugin">
                        <option value="">Choose a plugin...</option>
                        ${Object.entries(this.pluginCatalog).map(([key, plugin]) => 
                            `<option value="${key}" ${props.selected_plugin === key ? 'selected' : ''}>${plugin.name}</option>`
                        ).join('')}
                    </select>
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.showPluginCatalog()">
                        Browse Catalog
                    </button>
                </div>
                
                <div class="property-group">
                    <label for="plugins">Plugin Configuration (JSON)</label>
                    <textarea name="plugins" placeholder='{"docker": {"image": "node:16"}}' rows="6">${JSON.stringify(props.plugins, null, 2)}</textarea>
                </div>
            </div>
        `;
    }

    generateNotifyForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-bell"></i> Notification Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Notify Team" />
                </div>
                
                <div class="property-group">
                    <label for="command">Command</label>
                    <textarea name="command" placeholder="echo 'Sending notification...'" rows="3">${props.command}</textarea>
                </div>
            </div>
        `;
    }

    generateUploadForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h5><i class="fas fa-upload"></i> Pipeline Upload Configuration</h5>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Dynamic Pipeline" />
                </div>
                
                <div class="property-group">
                    <label for="pipeline_file">Pipeline File</label>
                    <input type="text" name="pipeline_file" value="${props.pipeline_file}" placeholder=".buildkite/pipeline.yml" />
                </div>
            </div>
        `;
    }

    generateEnhancedFeatures(step) {
        return `
            <div class="enhanced-features">
                <h5><i class="fas fa-magic"></i> Enhanced Features</h5>
                
                <div class="feature-buttons">
                    <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.openMatrixBuilder('${step.id}')">
                        <i class="fas fa-th"></i> Configure Matrix
                    </button>
                    
                    ${step.type === 'command' || step.type === 'plugin' ? `
                        <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.showPluginCatalog()">
                            <i class="fas fa-puzzle-piece"></i> Add Plugins
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-secondary btn-small" onclick="window.dependencyGraph && window.dependencyGraph.showConditionalBuilder()">
                        <i class="fas fa-code-branch"></i> Conditions
                    </button>
                </div>
            </div>
        `;
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
            alert('Please select a step first');
            return;
        }

        const modal = document.getElementById('matrix-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.renderMatrixPresets();
        }
    }

    renderMatrixPresets() {
        const container = document.getElementById('matrix-preset-buttons');
        if (!container) return;

        container.innerHTML = Object.entries(this.matrixPresets).map(([key, preset]) => `
            <button class="btn btn-outline" onclick="window.pipelineBuilder.applyMatrixPreset('${key}')">
                ${preset.name}
            </button>
        `).join('');
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
        // Already defined in parent class
        console.log('✅ Plugin catalog ready');
    }

    showPluginCatalog() {
        console.log('🔌 Opening plugin catalog...');
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            this.renderPluginCatalog();
            modal.classList.remove('hidden');
        }
    }

    renderPluginCatalog() {
        const container = document.getElementById('plugin-catalog-content');
        if (!container) return;

        const pluginHTML = Object.entries(this.pluginCatalog).map(([key, plugin]) => `
            <div class="plugin-card" data-plugin-key="${key}">
                <div class="plugin-header">
                    <h4>${plugin.name}</h4>
                    <button class="btn btn-primary btn-small" onclick="window.pipelineBuilder.addPluginStep('${key}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <p class="plugin-description">${plugin.description}</p>
                <div class="plugin-config-preview">
                    ${Object.entries(plugin.config || {}).map(([configKey, config]) => `
                        <div class="config-item">
                            <strong>${config.label}:</strong>
                            <span class="config-type">${config.type}</span>
                            ${config.required ? '<span class="required">*</span>' : ''}
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

    // STEP TEMPLATES METHODS
    initializeStepTemplates() {
        return {
            'test-suite': [
                {
                    type: 'command',
                    properties: {
                        label: 'Lint Code',
                        command: 'npm run lint',
                        key: 'lint'
                    }
                },
                {
                    type: 'command', 
                    properties: {
                        label: 'Unit Tests',
                        command: 'npm test',
                        key: 'test',
                        depends_on: ['lint']
                    }
                },
                {
                    type: 'command',
                    properties: {
                        label: 'Integration Tests',
                        command: 'npm run test:integration', 
                        key: 'integration',
                        depends_on: ['test']
                    }
                }
            ]
        };
    }

    showStepTemplates() {
        console.log('📋 Opening step templates...');
        const modal = document.getElementById('templates-modal');
        if (modal) {
            this.renderStepTemplates();
            modal.classList.remove('hidden');
        }
    }

    renderStepTemplates() {
        const container = document.getElementById('templates-content');
        if (!container) return;

        const templatesHTML = Object.entries(this.stepTemplates).map(([key, template]) => `
            <div class="template-card">
                <div class="template-header">
                    <h4>${key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
                    <button class="btn btn-primary btn-small" onclick="window.pipelineBuilder.addTemplate('${key}')">
                        <i class="fas fa-plus"></i> Apply
                    </button>
                </div>
                <div class="template-steps">
                    <strong>Steps:</strong> ${template.length}
                    <ul>
                        ${template.map(step => `<li>${step.properties.label}</li>`).join('')}
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

        template.forEach(stepTemplate => {
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

        console.log('✅ Template applied:', templateKey);
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
                        this.showMatrixTemplates();
                        break;
                    case 'g':
                        e.preventDefault();
                        if (this.dependencyGraph) {
                            this.dependencyGraph.showDependencyGraph();
                        }
                        break;
                }