// js/pipeline-builder.js - Fixed version with proper step selection and event handling
/**
 * Pipeline Builder - Core functionality
 * FIXES: Proper click handling, step selection after drag/drop, event delegation
 */

class PipelineBuilder {
    constructor() {
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.draggedElement = null;
        this.draggedType = null;
        this.draggedPlugin = null;
        this.dropZones = [];
        
        // Plugin catalog
        this.pluginCatalog = {
            'docker-compose': {
                name: 'Docker Compose',
                version: 'v3.7.0',
                category: 'containers',
                description: 'Build, run and push services via Docker Compose',
                config: {
                    build: { type: 'string', label: 'Service to Build', default: '' }

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.pipelineBuilder) {
            window.pipelineBuilder = new PipelineBuilder();
        }
    });
} else {
    if (!window.pipelineBuilder) {
        window.pipelineBuilder = new PipelineBuilder();
    }
},
                    run: { type: 'string', label: 'Service to Run', default: '' },
                    push: { type: 'array', label: 'Services to Push', default: [] }
                }
            },
            'artifacts': {
                name: 'Artifacts',
                version: 'v1.5.0', 
                category: 'utilities',
                description: 'Upload and download artifacts',
                config: {
                    upload: { type: 'string', label: 'Upload Pattern', default: '' },
                    download: { type: 'string', label: 'Download Pattern', default: '' }
                }
            },
            'ecr': {
                name: 'AWS ECR',
                version: 'v2.1.0',
                category: 'deployment',
                description: 'Push Docker images to Amazon ECR',
                config: {
                    'account-id': { type: 'string', label: 'AWS Account ID', default: '' },
                    region: { type: 'string', label: 'AWS Region', default: 'us-east-1' },
                    image: { type: 'string', label: 'Image Name', default: '' }
                }
            },
            'docker': {
                name: 'Docker',
                version: 'v5.0.0',
                category: 'containers',
                description: 'Build and push Docker images',
                config: {
                    image: { type: 'string', label: 'Image Name', default: '' },
                    dockerfile: { type: 'string', label: 'Dockerfile Path', default: 'Dockerfile' }
                }
            }
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Pipeline Builder with fixed event handling...');
        this.setupEventListeners();
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        console.log('✅ Pipeline Builder initialized successfully');
    }

    setupEventListeners() {
        // FIXED: Use event delegation for pipeline steps to handle dynamic content
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            // Click handler for step selection
            pipelineSteps.addEventListener('click', (e) => {
                const stepElement = e.target.closest('.pipeline-step');
                if (stepElement && !e.target.closest('.step-action')) {
                    const stepId = stepElement.dataset.stepId;
                    if (stepId) {
                        this.selectStep(stepId);
                    }
                }
            });
        }

        // Drag and drop for step types
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
            stepType.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Drag and drop for plugin types
        const pluginQuicks = document.querySelectorAll('.plugin-quick');
        pluginQuicks.forEach(plugin => {
            plugin.addEventListener('dragstart', this.handleDragStart.bind(this));
            plugin.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Pipeline drop zone
        if (pipelineSteps) {
            pipelineSteps.addEventListener('dragover', this.handleDragOver.bind(this));
            pipelineSteps.addEventListener('drop', this.handleDrop.bind(this));
            pipelineSteps.addEventListener('dragenter', this.handleDragEnter.bind(this));
            pipelineSteps.addEventListener('dragleave', this.handleDragLeave.bind(this));
        }

        // Export button
        const exportBtn = document.getElementById('export-yaml');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportYAML());
        }

        // Clear button
        const clearBtn = document.getElementById('clear-pipeline');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearPipeline());
        }

        // Load example button
        const loadExampleBtn = document.getElementById('load-example');
        if (loadExampleBtn) {
            loadExampleBtn.addEventListener('click', () => this.loadExample());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));

        console.log('✅ Event listeners configured with proper delegation');
    }

    // Drag and Drop Handlers
    handleDragStart(e) {
        this.draggedElement = e.target;
        this.draggedType = e.target.dataset.stepType;
        this.draggedPlugin = e.target.dataset.plugin;
        
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        
        // Create drop zones
        this.createDropZones();
        
        console.log('🎯 Started dragging:', this.draggedType || this.draggedPlugin);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.removeDropZones();
        this.draggedElement = null;
        this.draggedType = null;
        this.draggedPlugin = null;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDragEnter(e) {
        if (e.target.classList.contains('pipeline-steps')) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('pipeline-steps') && !e.currentTarget.contains(e.relatedTarget)) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('drag-over');
        }
    }

    createDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) return;

        // Clear existing content if empty
        const emptyMessage = pipelineSteps.querySelector('.empty-pipeline');
        if (emptyMessage) {
            emptyMessage.remove();
        }

        // Create drop zones between steps and at the end
        const existingSteps = pipelineSteps.querySelectorAll('.pipeline-step');
        
        // First drop zone
        const firstZone = this.createDropZone(0);
        pipelineSteps.insertBefore(firstZone, pipelineSteps.firstChild);
        
        // Drop zones between steps
        existingSteps.forEach((step, index) => {
            const zone = this.createDropZone(index + 1);
            step.insertAdjacentElement('afterend', zone);
        });

        // Activate all drop zones
        this.dropZones.forEach(zone => zone.classList.add('active'));
    }

    createDropZone(index) {
        const zone = document.createElement('div');
        zone.className = 'drop-zone';
        zone.dataset.dropIndex = index;
        
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            zone.classList.remove('drag-over');
            
            if (this.draggedType) {
                this.addStepAtIndex(this.draggedType, index);
            } else if (this.draggedPlugin) {
                this.addPluginStepAtIndex(this.draggedPlugin, index);
            }
        });
        
        this.dropZones.push(zone);
        return zone;
    }

    removeDropZones() {
        this.dropZones.forEach(zone => zone.remove());
        this.dropZones = [];
    }

    // Step Management - FIXED
    addStep(type) {
        this.addStepAtIndex(type, this.steps.length);
    }

    addStepAtIndex(type, index) {
        const step = this.createStep(type);
        
        if (index >= 0 && index <= this.steps.length) {
            this.steps.splice(index, 0, step);
        } else {
            this.steps.push(step);
        }
        
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        this.updateLastSaved();
        
        console.log(`✅ Added ${type} step at index ${index}`);
    }

    addPluginStepAtIndex(pluginKey, index) {
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) {
            console.error('Plugin not found:', pluginKey);
            return;
        }
        
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
        
        if (index >= 0 && index <= this.steps.length) {
            this.steps.splice(index, 0, step);
        } else {
            this.steps.push(step);
        }
        
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        
        console.log(`🔌 Added plugin step: ${pluginKey}`);
    }

    createStep(type) {
        const stepId = `step-${++this.stepCounter}`;
        const baseProperties = {
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Step`,
            key: stepId,
            depends_on: [],
            allow_dependency_failure: false
        };

        const stepTypeConfigs = {
            command: {
                command: 'echo "Configure your command"',
                agents: {},
                env: {},
                timeout_in_minutes: 60,
                retry: { automatic: false },
                plugins: {},
                artifact_paths: '',
                branches: '',
                if: '',
                unless: '',
                soft_fail: false,
                priority: 0
            },
            wait: {
                continue_on_failure: false,
                if: '',
                unless: ''
            },
            block: {
                prompt: 'Please confirm',
                blocked_state: 'passed',
                fields: [],
                branches: '',
                if: '',
                unless: ''
            },
            input: {
                prompt: 'Please provide input',
                fields: [],
                branches: '',
                if: '',
                unless: ''
            },
            trigger: {
                trigger: '',
                build: {
                    message: '',
                    commit: 'HEAD',
                    branch: 'main',
                    env: {},
                    meta_data: {}
                },
                async: true,
                branches: '',
                if: '',
                unless: ''
            },
            group: {
                group: 'Group Name',
                steps: [],
                notify: []
            },
            annotation: {
                context: 'default',
                style: 'info',
                body: 'Annotation text',
                append: false
            },
            plugin: {
                selected_plugin: '',
                plugins: {},
                agents: {},
                env: {},
                timeout_in_minutes: 60,
                retry: { automatic: false },
                artifact_paths: '',
                branches: '',
                if: '',
                unless: '',
                soft_fail: false,
                priority: 0
            },
            notify: {
                email: '',
                basecamp_campfire: '',
                slack: '',
                webhook: '',
                pagerduty: '',
                if: '',
                unless: ''
            },
            'pipeline-upload': {
                pipeline: '.buildkite/pipeline.yml',
                replace: false,
                if: '',
                unless: ''
            }
        };

        return {
            id: stepId,
            type: type,
            properties: { ...baseProperties, ...(stepTypeConfigs[type] || {}) }
        };
    }

    // FIXED: Proper step selection
    selectStep(stepId) {
        this.selectedStep = stepId;
        
        // Update visual selection
        document.querySelectorAll('.pipeline-step').forEach(step => {
            if (step.dataset.stepId === stepId) {
                step.classList.add('selected');
            } else {
                step.classList.remove('selected');
            }
        });
        
        this.renderProperties();
        console.log('👆 Selected step:', stepId);
    }

    removeStep(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index !== -1) {
            this.steps.splice(index, 1);
            if (this.selectedStep === stepId) {
                this.selectedStep = null;
            }
            this.renderPipeline();
            this.renderProperties();
            this.updateStepCount();
            console.log('🗑️ Removed step:', stepId);
        }
    }

    duplicateStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            const newStep = {
                id: `step-${++this.stepCounter}`,
                type: step.type,
                properties: JSON.parse(JSON.stringify(step.properties))
            };
            newStep.properties.label = `${newStep.properties.label} (Copy)`;
            newStep.properties.key = newStep.id;
            
            const index = this.steps.findIndex(s => s.id === stepId);
            this.steps.splice(index + 1, 0, newStep);
            this.renderPipeline();
            this.selectStep(newStep.id);
            this.updateStepCount();
            
            console.log('📄 Duplicated step:', stepId, '→', newStep.id);
        }
    }

    moveStepUp(index) {
        if (index > 0) {
            [this.steps[index], this.steps[index - 1]] = [this.steps[index - 1], this.steps[index]];
            this.renderPipeline();
            // Re-select the moved step
            if (this.selectedStep) {
                this.selectStep(this.selectedStep);
            }
        }
    }

    moveStepDown(index) {
        if (index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.renderPipeline();
            // Re-select the moved step
            if (this.selectedStep) {
                this.selectStep(this.selectedStep);
            }
        }
    }

    // Rendering - FIXED
    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;

        if (this.steps.length === 0) {
            container.innerHTML = `
                <div class="empty-pipeline">
                    <i class="fas fa-stream"></i>
                    <h3>Start Building Your Pipeline</h3>
                    <p>Drag step types from the sidebar to build your pipeline</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.steps.map((step, index) => {
            const stepHtml = this.createStepElement(step, index);
            return stepHtml;
        }).join('');

        // Ensure selected step remains selected after render
        if (this.selectedStep) {
            const selectedElement = container.querySelector(`[data-step-id="${this.selectedStep}"]`);
            if (selectedElement) {
                selectedElement.classList.add('selected');
            }
        }
    }

    createStepElement(step, index) {
        const indicators = this.getStepIndicators(step);
        const stepDescription = this.getStepDescription(step);
        const icon = this.getStepIcon(step.type);
        
        return `
            <div class="pipeline-step ${step.id === this.selectedStep ? 'selected' : ''}" 
                 data-step-id="${step.id}">
                <div class="step-content-wrapper">
                    <div class="step-header">
                        <div class="step-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="step-title">
                            <div class="step-label">${step.properties.label || 'Unnamed Step'}</div>
                            <div class="step-type-label">${step.type}</div>
                        </div>
                    </div>
                    <div class="step-content">
                        ${stepDescription}
                    </div>
                    ${indicators.length > 0 ? `
                        <div class="step-indicators">
                            ${indicators.join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="step-actions">
                    <button class="step-action" onclick="event.stopPropagation(); pipelineBuilder.moveStepUp(${index})" 
                            title="Move Up" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="step-action" onclick="event.stopPropagation(); pipelineBuilder.moveStepDown(${index})" 
                            title="Move Down" ${index === this.steps.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="step-action" onclick="event.stopPropagation(); pipelineBuilder.duplicateStep('${step.id}')" 
                            title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="step-action delete" onclick="event.stopPropagation(); pipelineBuilder.removeStep('${step.id}')" 
                            title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getStepIcon(type) {
        const icons = {
            command: 'fa-terminal',
            wait: 'fa-hourglass-half',
            block: 'fa-hand-paper',
            input: 'fa-keyboard',
            trigger: 'fa-play',
            group: 'fa-layer-group',
            annotation: 'fa-sticky-note',
            plugin: 'fa-plug',
            notify: 'fa-bell',
            'pipeline-upload': 'fa-upload'
        };
        return icons[type] || 'fa-circle';
    }

    getStepDescription(step) {
        switch (step.type) {
            case 'command':
                return step.properties.command || 'No command specified';
            case 'wait':
                return 'Wait for all previous steps to complete';
            case 'block':
                return step.properties.prompt || 'Manual approval required';
            case 'input':
                return step.properties.prompt || 'User input required';
            case 'trigger':
                return step.properties.trigger || 'No pipeline specified';
            case 'group':
                return `Group with ${step.properties.steps?.length || 0} step(s)`;
            case 'annotation':
                return step.properties.body || 'No annotation text';
            case 'plugin':
                const plugins = Object.keys(step.properties.plugins || {});
                return plugins.length > 0 ? `Using: ${plugins.join(', ')}` : 'No plugin selected';
            case 'notify':
                const channels = [];
                if (step.properties.email) channels.push('Email');
                if (step.properties.slack) channels.push('Slack');
                if (step.properties.webhook) channels.push('Webhook');
                return channels.length > 0 ? `Notify: ${channels.join(', ')}` : 'No notification channels';
            case 'pipeline-upload':
                return step.properties.pipeline || 'No pipeline file specified';
            default:
                return 'Configure this step';
        }
    }

    getStepIndicators(step) {
        const indicators = [];
        
        if (step.properties.depends_on && step.properties.depends_on.length > 0) {
            indicators.push(`
                <span class="step-indicator indicator-depends">
                    <i class="fas fa-link"></i>
                    ${step.properties.depends_on.length} dep${step.properties.depends_on.length > 1 ? 's' : ''}
                </span>
            `);
        }
        
        if (step.properties.if || step.properties.unless) {
            indicators.push(`
                <span class="step-indicator indicator-condition">
                    <i class="fas fa-code-branch"></i>
                    conditional
                </span>
            `);
        }
        
        if (step.type === 'plugin' && Object.keys(step.properties.plugins || {}).length > 0) {
            indicators.push(`
                <span class="step-indicator indicator-plugin">
                    <i class="fas fa-plug"></i>
                    ${Object.keys(step.properties.plugins).length} plugin${Object.keys(step.properties.plugins).length > 1 ? 's' : ''}
                </span>
            `);
        }
        
        if (step.properties.retry?.automatic) {
            indicators.push(`
                <span class="step-indicator indicator-retry">
                    <i class="fas fa-redo"></i>
                    retry
                </span>
            `);
        }
        
        return indicators;
    }

    // Properties Panel
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

        const stepIndex = this.steps.findIndex(s => s.id === this.selectedStep);

        container.innerHTML = `
            <div class="properties-content">
                <div class="properties-header">
                    <h4>
                        <i class="fas ${this.getStepIcon(step.type)}"></i>
                        ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} Step
                    </h4>
                    <div class="step-actions">
                        <button class="btn btn-icon" onclick="pipelineBuilder.moveStepUp(${stepIndex})" 
                                title="Move Up" ${stepIndex === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn btn-icon" onclick="pipelineBuilder.moveStepDown(${stepIndex})" 
                                title="Move Down" ${stepIndex === this.steps.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button class="btn btn-icon" onclick="pipelineBuilder.duplicateStep('${step.id}')" 
                                title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-icon btn-danger" onclick="pipelineBuilder.removeStep('${step.id}')" 
                                title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <form id="properties-form" onsubmit="return false;">
                    ${this.generatePropertyForm(step)}
                </form>
            </div>
        `;

        // Add event listeners for property updates
        this.setupPropertyEventListeners();
    }

    generatePropertyForm(step) {
        let formHtml = '';
        
        // Basic properties
        formHtml += this.generateBasicPropertyForm(step);
        
        // Type-specific properties
        if (step.type !== 'wait' && step.type !== 'annotation') {
            formHtml += this.generateAdvancedPropertyForm(step);
        }
        
        // Dependencies
        formHtml += this.generateDependencyForm(step);
        
        return formHtml;
    }

    generateBasicPropertyForm(step) {
        let basicFields = '';
        
        switch (step.type) {
            case 'command':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Run Tests" />
                    </div>
                    <div class="property-group">
                        <label for="command">Command</label>
                        <textarea name="command" rows="4" placeholder="echo 'Hello, World!'">${step.properties.command || ''}</textarea>
                        <small>Shell command(s) to execute</small>
                    </div>
                    <div class="property-group">
                        <label for="key">Step Key</label>
                        <input type="text" name="key" value="${step.properties.key || ''}" placeholder="unique-step-key" />
                        <small>Unique identifier for dependencies</small>
                    </div>
                `;
                break;
            case 'wait':
                basicFields = `
                    <div class="property-checkbox">
                        <input type="checkbox" id="continue_on_failure" name="continue_on_failure" 
                               ${step.properties.continue_on_failure ? 'checked' : ''} />
                        <label for="continue_on_failure">Continue on failure</label>
                    </div>
                `;
                break;
            case 'block':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Block Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Deploy to Production?" />
                    </div>
                    <div class="property-group">
                        <label for="prompt">Prompt Message</label>
                        <input type="text" name="prompt" value="${step.properties.prompt || ''}" placeholder="Please confirm deployment" />
                    </div>
                    <div class="property-group">
                        <label for="blocked_state">Blocked State</label>
                        <select name="blocked_state">
                            <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                            <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                            <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                        </select>
                    </div>
                `;
                break;
            case 'input':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Input Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Deployment Parameters" />
                    </div>
                    <div class="property-group">
                        <label for="prompt">Prompt Message</label>
                        <input type="text" name="prompt" value="${step.properties.prompt || ''}" placeholder="Please provide input" />
                    </div>
                `;
                break;
            case 'trigger':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Trigger Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Deploy Pipeline" />
                    </div>
                    <div class="property-group">
                        <label for="trigger">Pipeline to Trigger</label>
                        <input type="text" name="trigger" value="${step.properties.trigger || ''}" placeholder="deploy-pipeline" />
                        <small>Pipeline slug to trigger</small>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="async" name="async" ${step.properties.async ? 'checked' : ''} />
                        <label for="async">Run asynchronously</label>
                    </div>
                `;
                break;
            case 'annotation':
                basicFields = `
                    <div class="property-group">
                        <label for="body">Annotation Text</label>
                        <textarea name="body" rows="4" placeholder="Markdown supported...">${step.properties.body || ''}</textarea>
                        <small>Supports Markdown formatting</small>
                    </div>
                    <div class="property-group">
                        <label for="context">Context</label>
                        <input type="text" name="context" value="${step.properties.context || 'default'}" placeholder="default" />
                    </div>
                    <div class="property-group">
                        <label for="style">Style</label>
                        <select name="style">
                            <option value="info" ${step.properties.style === 'info' ? 'selected' : ''}>Info</option>
                            <option value="success" ${step.properties.style === 'success' ? 'selected' : ''}>Success</option>
                            <option value="warning" ${step.properties.style === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="error" ${step.properties.style === 'error' ? 'selected' : ''}>Error</option>
                        </select>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="append" name="append" ${step.properties.append ? 'checked' : ''} />
                        <label for="append">Append to existing annotations</label>
                    </div>
                `;
                break;
            case 'plugin':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Build Docker Image" />
                    </div>
                    ${this.generatePluginSelector(step)}
                `;
                break;
            case 'group':
                basicFields = `
                    <div class="property-group">
                        <label for="group">Group Name</label>
                        <input type="text" name="group" value="${step.properties.group || ''}" placeholder="e.g., Test Suite" />
                    </div>
                    <p class="property-help">Configure group steps in the visual editor</p>
                `;
                break;
            case 'notify':
                basicFields = `
                    <div class="property-group">
                        <label for="email">Email</label>
                        <input type="text" name="email" value="${step.properties.email || ''}" placeholder="team@example.com" />
                    </div>
                    <div class="property-group">
                        <label for="slack">Slack Channel/User</label>
                        <input type="text" name="slack" value="${step.properties.slack || ''}" placeholder="#channel or @user" />
                    </div>
                    <div class="property-group">
                        <label for="webhook">Webhook URL</label>
                        <input type="text" name="webhook" value="${step.properties.webhook || ''}" placeholder="https://..." />
                    </div>
                `;
                break;
            case 'pipeline-upload':
                basicFields = `
                    <div class="property-group">
                        <label for="pipeline">Pipeline File</label>
                        <input type="text" name="pipeline" value="${step.properties.pipeline || ''}" placeholder=".buildkite/pipeline.yml" />
                        <small>Path to pipeline YAML file</small>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="replace" name="replace" ${step.properties.replace ? 'checked' : ''} />
                        <label for="replace">Replace Pipeline (vs append)</label>
                        <small>Replace the current pipeline instead of appending steps</small>
                    </div>
                `;
                break;
            default:
                basicFields = `
                    <div class="property-group">
                        <label for="label">Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="Step name" />
                    </div>
                `;
        }

        return `
            <div class="property-section">
                <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                ${basicFields}
            </div>
        `;
    }

    generateAdvancedPropertyForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-server"></i> Execution Environment</h4>
                
                <div class="property-group">
                    <label for="agents">Agent Targeting (JSON)</label>
                    <textarea name="agents" placeholder='{"queue": "default", "os": "linux"}' rows="3">${JSON.stringify(step.properties.agents || {}, null, 2)}</textarea>
                    <small>JSON object specifying agent requirements</small>
                </div>
                
                <div class="property-group">
                    <label for="env">Environment Variables (JSON)</label>
                    <textarea name="env" placeholder='{"NODE_ENV": "test", "DEBUG": "true"}' rows="4">${JSON.stringify(step.properties.env || {}, null, 2)}</textarea>
                    <small>JSON object of environment variables</small>
                </div>
                
                <div class="property-group">
                    <label for="timeout_in_minutes">Timeout (minutes)</label>
                    <input type="number" name="timeout_in_minutes" value="${step.properties.timeout_in_minutes || 60}" 
                           placeholder="60" min="1" max="1440" />
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="branches">Branch Pattern</label>
                    <input type="text" name="branches" value="${step.properties.branches || ''}" 
                           placeholder="main develop feature/*" />
                    <small>Space-separated branch patterns</small>
                </div>
                
                <div class="property-group">
                    <label for="if">If Condition</label>
                    <input type="text" name="if" value="${step.properties.if || ''}" 
                           placeholder='build.branch == "main" && build.pull_request.id == null' />
                    <small>Conditional expression (evaluates to true to run)</small>
                </div>
                
                <div class="property-group">
                    <label for="unless">Unless Condition</label>
                    <input type="text" name="unless" value="${step.properties.unless || ''}" 
                           placeholder='build.pull_request.draft == true' />
                    <small>Conditional expression (evaluates to true to skip)</small>
                </div>
            </div>
        `;
    }

    generateDependencyForm(step) {
        const availableSteps = this.steps
            .filter(s => s.id !== step.id && s.properties.key)
            .map(s => ({ id: s.properties.key, label: s.properties.label }));

        return `
            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label>Depends On</label>
                    <div class="dependency-list">
                        ${availableSteps.length > 0 ? availableSteps.map(s => `
                            <div class="property-checkbox">
                                <input type="checkbox" id="dep-${s.id}" value="${s.id}" 
                                       ${step.properties.depends_on?.includes(s.id) ? 'checked' : ''} 
                                       onchange="pipelineBuilder.updateDependencies('${step.id}')" />
                                <label for="dep-${s.id}">${s.label} (${s.id})</label>
                            </div>
                        `).join('') : '<p class="text-muted">No other steps with keys available</p>'}
                    </div>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="allow_dependency_failure" name="allow_dependency_failure" 
                           ${step.properties.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow dependency failure</label>
                    <small>Continue even if dependencies fail</small>
                </div>
            </div>
        `;
    }

    generatePluginForm(step) {
        const props = step.properties;
        const hasPlugins = props.plugins && Object.keys(props.plugins).length > 0;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-plug"></i> Plugin Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label || ''}" placeholder="e.g., Docker Build" />
                </div>
                
                ${this.generatePluginSelector(step)}
                
                <div class="plugin-actions">
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.showPluginCatalog()">
                        <i class="fas fa-store"></i> Browse Plugin Catalog
                    </button>
                </div>
            </div>
        `;
    }

    generateGenericForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-cog"></i> Step Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label</label>
                    <input type="text" name="label" value="${step.properties.label || ''}" placeholder="Step name" />
                </div>
                
                <div class="property-group">
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${step.properties.key || ''}" placeholder="unique-step-key" />
                </div>
                
                <p class="property-help">
                    This is a ${step.type} step. Additional configuration options may be available.
                </p>
            </div>
        `;
    }

    generatePluginSelector(step) {
        const selectedPlugin = step.properties.selected_plugin;
        const plugin = this.pluginCatalog[selectedPlugin];
        
        let html = `
            <div class="property-group">
                <label for="selected_plugin">Plugin</label>
                <select name="selected_plugin" onchange="pipelineBuilder.updatePluginConfig('${step.id}', this.value)">
                    <option value="">Select a plugin...</option>
                    ${Object.entries(this.pluginCatalog).map(([key, p]) => `
                        <option value="${key}" ${selectedPlugin === key ? 'selected' : ''}>${p.name}</option>
                    `).join('')}
                </select>
            </div>
        `;
        
        if (selectedPlugin && plugin) {
            html += `
                <div class="plugin-config">
                    <h5>${plugin.name} Configuration</h5>
                    ${Object.entries(plugin.config).map(([key, config]) => {
                        const value = step.properties.plugins[selectedPlugin]?.[key] || config.default || '';
                        return `
                            <div class="property-group">
                                <label for="plugin-${key}">${config.label}</label>
                                ${config.type === 'array' ? `
                                    <input type="text" id="plugin-${key}" 
                                           value="${Array.isArray(value) ? value.join(', ') : ''}" 
                                           placeholder="Comma-separated values" 
                                           onchange="pipelineBuilder.updatePluginField('${step.id}', '${selectedPlugin}', '${key}', this.value, 'array')" />
                                ` : `
                                    <input type="text" id="plugin-${key}" 
                                           value="${value}" 
                                           onchange="pipelineBuilder.updatePluginField('${step.id}', '${selectedPlugin}', '${key}', this.value)" />
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        return html;
    }

    // Property Update Handlers
    setupPropertyEventListeners() {
        const form = document.getElementById('properties-form');
        if (!form) return;

        // Handle all input changes
        form.addEventListener('input', (e) => {
            if (e.target.name) {
                this.updateStepProperty(e.target.name, e.target.value, e.target.type);
            }
        });

        form.addEventListener('change', (e) => {
            if (e.target.name) {
                this.updateStepProperty(e.target.name, e.target.value, e.target.type);
            }
        });
    }

    updateStepProperty(name, value, type) {
        if (!this.selectedStep) return;
        
        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step) return;

        // Handle different input types
        if (type === 'checkbox') {
            value = document.querySelector(`[name="${name}"]`).checked;
        } else if (name === 'agents' || name === 'env') {
            // Parse JSON fields
            try {
                value = JSON.parse(value || '{}');
            } catch (e) {
                console.warn('Invalid JSON for', name);
                return;
            }
        } else if (name === 'timeout_in_minutes' || name === 'priority') {
            value = parseInt(value) || 0;
        }

        // Update the property
        step.properties[name] = value;
        
        // Re-render pipeline to update display
        this.renderPipeline();
        this.updateLastSaved();
    }

    updateDependencies(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        const checkedDeps = Array.from(document.querySelectorAll('.dependency-list input:checked'))
            .map(input => input.value);
        
        step.properties.depends_on = checkedDeps;
        this.renderPipeline();
        this.updateLastSaved();
    }

    updatePluginConfig(stepId, pluginKey) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        step.properties.selected_plugin = pluginKey;
        
        if (pluginKey) {
            const plugin = this.pluginCatalog[pluginKey];
            if (plugin) {
                const defaultConfig = {};
                Object.entries(plugin.config).forEach(([key, config]) => {
                    if (config.default !== undefined) {
                        defaultConfig[key] = config.default;
                    }
                });
                step.properties.plugins = { [pluginKey]: defaultConfig };
            }
        } else {
            step.properties.plugins = {};
        }
        
        this.renderProperties();
        this.renderPipeline();
    }

    updatePluginField(stepId, pluginKey, fieldKey, value, fieldType) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        if (!step.properties.plugins[pluginKey]) {
            step.properties.plugins[pluginKey] = {};
        }

        if (fieldType === 'array') {
            step.properties.plugins[pluginKey][fieldKey] = value.split(',').map(v => v.trim()).filter(v => v);
        } else {
            step.properties.plugins[pluginKey][fieldKey] = value;
        }

        this.renderPipeline();
        this.updateLastSaved();
    }

    // Additional form generators for all step types
    generateInputForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-keyboard"></i> Input Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label || ''}" placeholder="e.g., Release Version" />
                </div>
                
                <div class="property-group">
                    <label for="prompt">Prompt Message</label>
                    <textarea name="prompt" placeholder="Please enter the release version" rows="3">${props.prompt || ''}</textarea>
                    <small>Message shown when requesting input</small>
                </div>
                
                <div class="property-group">
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., version-input" />
                </div>
                
                ${this.generateFieldBuilder(step)}
            </div>
        `;
    }

    generateTriggerForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-play"></i> Trigger Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label || ''}" placeholder="e.g., Deploy to Production" />
                </div>
                
                <div class="property-group">
                    <label for="trigger">Pipeline to Trigger *</label>
                    <input type="text" name="trigger" value="${props.trigger || ''}" placeholder="my-org/my-pipeline" />
                    <small>Format: organization/pipeline-slug</small>
                </div>
                
                <div class="property-group">
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., trigger-deploy" />
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="async" ${props.async ? 'checked' : ''} />
                    <label for="async">Asynchronous (don't wait for completion)</label>
                </div>
                
                <div class="property-group">
                    <label for="build">Build Parameters (JSON)</label>
                    <textarea name="build" placeholder='{"branch": "main", "env": {"NODE_ENV": "production"}}' rows="4">${JSON.stringify(props.build || {}, null, 2)}</textarea>
                    <small>JSON object with build parameters</small>
                </div>
            </div>
        `;
    }

    generateGroupForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-layer-group"></i> Group Configuration</h4>
                
                <div class="property-group">
                    <label for="group">Group Name *</label>
                    <input type="text" name="group" value="${props.group || ''}" placeholder="e.g., Tests" />
                </div>
                
                <div class="property-group">
                    <label for="label">Group Label</label>
                    <input type="text" name="label" value="${props.label || ''}" placeholder="Optional display label" />
                </div>
                
                <div class="property-group">
                    <label for="key">Group Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="tests-group" />
                    <small>Unique identifier for this group</small>
                </div>
                
                <div class="property-group">
                    <label>Group Steps</label>
                    <div class="group-steps-info">
                        <p>This group contains ${props.steps?.length || 0} step(s)</p>
                        <small>Group steps can be managed after creation</small>
                    </div>
                </div>
            </div>
        `;
    }

    generateAnnotationForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-sticky-note"></i> Annotation Configuration</h4>
                
                <div class="property-group">
                    <label for="body">Annotation Body *</label>
                    <textarea name="body" placeholder="Build completed successfully! :tada:" rows="6">${props.body || ''}</textarea>
                    <small>Supports Markdown and emoji</small>
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
                
                <div class="property-group">
                    <label for="context">Context</label>
                    <input type="text" name="context" value="${props.context || 'default'}" placeholder="default" />
                    <small>Groups related annotations together</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="append" ${props.append ? 'checked' : ''} />
                    <label for="append">Append to existing annotations</label>
                </div>
            </div>
        `;
    }

    generateNotifyForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-bell"></i> Notification Configuration</h4>
                
                <div class="property-group">
                    <label for="email">Email Addresses</label>
                    <input type="text" name="email" value="${props.email || ''}" placeholder="team@example.com, manager@example.com" />
                    <small>Comma-separated email addresses</small>
                </div>
                
                <div class="property-group">
                    <label for="slack">Slack Channel/User</label>
                    <input type="text" name="slack" value="${props.slack || ''}" placeholder="#channel or @user" />
                </div>
                
                <div class="property-group">
                    <label for="webhook">Webhook URL</label>
                    <input type="text" name="webhook" value="${props.webhook || ''}" placeholder="https://example.com/webhook" />
                </div>
                
                <div class="property-group">
                    <label for="pagerduty">PagerDuty Service Key</label>
                    <input type="text" name="pagerduty" value="${props.pagerduty || ''}" placeholder="Service key" />
                </div>
                
                <div class="property-group">
                    <label for="basecamp_campfire">Basecamp Campfire URL</label>
                    <input type="text" name="basecamp_campfire" value="${props.basecamp_campfire || ''}" placeholder="https://basecamp.com/..." />
                </div>
            </div>
        `;
    }

    generatePipelineUploadForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-upload"></i> Pipeline Upload Configuration</h4>
                
                <div class="property-group">
                    <label for="pipeline">Pipeline File *</label>
                    <input type="text" name="pipeline" value="${props.pipeline || ''}" placeholder=".buildkite/pipeline.yml" />
                    <small>Path to pipeline YAML file</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="replace" ${props.replace ? 'checked' : ''} />
                    <label for="replace">Replace current pipeline</label>
                    <small>Replace the entire pipeline instead of appending steps</small>
                </div>
            </div>
        `;
    }

    generateFieldBuilder(step) {
        const fields = step.properties.fields || [];
        
        return `
            <div class="property-subsection">
                <h5>Input Fields</h5>
                
                <div class="fields-list">
                    ${fields.map((field, index) => `
                        <div class="field-item">
                            <input type="text" 
                                   value="${field.text || ''}" 
                                   placeholder="Field label"
                                   onchange="pipelineBuilder.updateField('${step.id}', ${index}, 'text', this.value)" />
                            <input type="text" 
                                   value="${field.key || ''}" 
                                   placeholder="Field key"
                                   onchange="pipelineBuilder.updateField('${step.id}', ${index}, 'key', this.value)" />
                            <select onchange="pipelineBuilder.updateField('${step.id}', ${index}, 'type', this.value)">
                                <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                            </select>
                            <button class="btn btn-small btn-danger" 
                                    onclick="pipelineBuilder.removeField('${step.id}', ${index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="field-actions">
                    <button type="button" class="btn btn-small btn-secondary" 
                            onclick="pipelineBuilder.addField('${step.id}', 'text')">
                        <i class="fas fa-plus"></i> Add Text Field
                    </button>
                    <button type="button" class="btn btn-small btn-secondary" 
                            onclick="pipelineBuilder.addField('${step.id}', 'select')">
                        <i class="fas fa-plus"></i> Add Select Field
                    </button>
                </div>
            </div>
        `;
    }

    // Field management methods
    addField(stepId, fieldType = 'text') {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || (step.type !== 'block' && step.type !== 'input')) return;
        
        if (!step.properties.fields) {
            step.properties.fields = [];
        }
        
        const field = {
            key: `field_${Date.now()}`,
            text: 'New Field',
            required: false,
            default: '',
            type: fieldType
        };
        
        if (fieldType === 'select') {
            field.options = ['Option 1', 'Option 2'];
        }
        
        step.properties.fields.push(field);
        this.renderProperties();
    }

    removeField(stepId, fieldIndex) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        step.properties.fields.splice(fieldIndex, 1);
        this.renderProperties();
    }

    updateField(stepId, fieldIndex, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields || !step.properties.fields[fieldIndex]) return;
        
        step.properties.fields[fieldIndex][property] = value;
        this.updateLastSaved();
    }

    // Plugin catalog functionality
    showPluginCatalog() {
        if (window.mainInit) {
            window.mainInit.showPluginCatalog();
        } else {
            console.warn('Plugin catalog not available through main initializer');
            alert('Plugin Catalog\n\nAvailable plugins:\n' + 
                  Object.entries(this.pluginCatalog).map(([key, p]) => `• ${p.name}: ${p.description}`).join('\n'));
        }
    }

    // Validation methods
    validateStepDependencies() {
        const issues = [];
        const availableKeys = this.getAvailableStepKeys();
        
        this.steps.forEach(step => {
            if (step.properties.depends_on && step.properties.depends_on.length > 0) {
                step.properties.depends_on.forEach(dep => {
                    if (!availableKeys.includes(dep)) {
                        issues.push(`Step "${step.properties.label || step.id}" depends on non-existent step "${dep}"`);
                    }
                });
            }
        });
        
        return issues;
    }

    validatePipeline() {
        const errors = [];
        const warnings = [];
        
        // Check for empty pipeline
        if (this.steps.length === 0) {
            errors.push('Pipeline has no steps');
        }
        
        // Validate each step
        this.steps.forEach((step, index) => {
            const stepName = step.properties.label || `Step ${index + 1} (${step.type})`;
            
            // Check for missing labels
            if (!step.properties.label) {
                warnings.push(`${stepName} has no label`);
            }
            
            // Type-specific validation
            switch (step.type) {
                case 'command':
                    if (!step.properties.command) {
                        errors.push(`Command step "${stepName}" has no command`);
                    }
                    break;
                case 'trigger':
                    if (!step.properties.trigger) {
                        errors.push(`Trigger step "${stepName}" has no pipeline specified`);
                    }
                    break;
                case 'block':
                case 'input':
                    if (!step.properties.prompt) {
                        warnings.push(`${step.type} step "${stepName}" has no prompt`);
                    }
                    break;
            }
            
            // Check dependencies
            const depIssues = this.validateStepDependencies();
            errors.push(...depIssues);
            
            // Check for duplicate keys
            const keys = this.steps.map(s => s.properties.key).filter(k => k);
            const duplicateKeys = keys.filter((key, idx) => keys.indexOf(key) !== idx);
            duplicateKeys.forEach(key => {
                errors.push(`Duplicate step key: "${key}"`);
            });
        });
        
        // Show results
        let message = 'Pipeline Validation Results:\n\n';
        
        if (errors.length === 0 && warnings.length === 0) {
            message += '✅ Pipeline is valid!';
        } else {
            if (errors.length > 0) {
                message += '❌ Errors:\n';
                errors.forEach(error => {
                    message += `  • ${error}\n`;
                });
            }
            
            if (warnings.length > 0) {
                if (errors.length > 0) message += '\n';
                message += '⚠️ Warnings:\n';
                warnings.forEach(warning => {
                    message += `  • ${warning}\n`;
                });
            }
        }
        
        alert(message);
        console.log('🔍 Validation complete:', { errors, warnings });
    }

    // Additional helper methods
    getAvailableStepKeys() {
        return this.steps
            .filter(step => step.properties.key)
            .map(step => step.properties.key);
    }

    findStepByKey(key) {
        return this.steps.find(step => step.properties.key === key);
    }

    // Keyboard shortcuts handler
    handleKeyboard(e) {
        // Delete selected step
        if (e.key === 'Delete' && this.selectedStep && !this.isInputFocused()) {
            e.preventDefault();
            this.removeStep(this.selectedStep);
        }
        
        // Escape to deselect
        if (e.key === 'Escape') {
            this.selectStep(null);
        }
        
        // Arrow keys for navigation
        if (e.key === 'ArrowUp' && this.selectedStep && !this.isInputFocused()) {
            e.preventDefault();
            this.selectPreviousStep();
        }
        
        if (e.key === 'ArrowDown' && this.selectedStep && !this.isInputFocused()) {
            e.preventDefault();
            this.selectNextStep();
        }
        
        // Enter to edit selected step
        if (e.key === 'Enter' && this.selectedStep && !this.isInputFocused()) {
            e.preventDefault();
            document.getElementById('properties-content')?.scrollIntoView({ behavior: 'smooth' });
        }
        
        // 'A' to add new step
        if (e.key === 'a' && !this.isInputFocused()) {
            e.preventDefault();
            this.addStep('command');
        }
        
        // 'D' to duplicate selected step
        if (e.key === 'd' && this.selectedStep && !this.isInputFocused()) {
            e.preventDefault();
            this.duplicateStep(this.selectedStep);
        }
        
        // 'Ctrl+S' to save/export
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.exportYAML();
        }
        
        // 'Ctrl+E' to load example
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.loadExample();
        }
    }

    selectPreviousStep() {
        const currentIndex = this.steps.findIndex(s => s.id === this.selectedStep);
        if (currentIndex > 0) {
            this.selectStep(this.steps[currentIndex - 1].id);
        }
    }

    selectNextStep() {
        const currentIndex = this.steps.findIndex(s => s.id === this.selectedStep);
        if (currentIndex < this.steps.length - 1 && currentIndex !== -1) {
            this.selectStep(this.steps[currentIndex + 1].id);
        }
    }

    // Additional plugin methods
    updatePluginSelection(pluginKey) {
        if (!this.selectedStep) return;
        
        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step || step.type !== 'plugin') return;
        
        this.updatePluginConfig(step.id, pluginKey);
    }

    // Utility Methods
    updateStepCount() {
        const countElement = document.getElementById('step-count');
        if (countElement) {
            countElement.textContent = this.steps.length;
        }
    }

    updateLastSaved() {
        const lastSavedElement = document.getElementById('last-saved');
        if (lastSavedElement) {
            const now = new Date();
            lastSavedElement.textContent = now.toLocaleTimeString();
        }
    }

    clearPipeline() {
        if (this.steps.length === 0) return;
        
        if (confirm('Are you sure you want to clear the entire pipeline?')) {
            this.steps = [];
            this.selectedStep = null;
            this.stepCounter = 0;
            this.renderPipeline();
            this.renderProperties();
            this.updateStepCount();
            console.log('🧹 Pipeline cleared');
        }
    }

    loadExample() {
        if (this.steps.length > 0) {
            if (!confirm('This will replace your current pipeline. Continue?')) {
                return;
            }
        }

        // Example pipeline
        const exampleSteps = [
            {
                id: 'step-1',
                type: 'command',
                properties: {
                    label: '📦 Install Dependencies',
                    command: 'npm ci',
                    key: 'install',
                    agents: { queue: 'default' },
                    env: {},
                    timeout_in_minutes: 10,
                    retry: { automatic: { limit: 2 } },
                    plugins: {},
                    artifact_paths: '',
                    branches: '',
                    if: '',
                    unless: '',
                    depends_on: [],
                    allow_dependency_failure: false,
                    soft_fail: false,
                    priority: 0
                }
            },
            {
                id: 'step-2',
                type: 'command',
                properties: {
                    label: '🧪 Run Tests',
                    command: 'npm test',
                    key: 'test',
                    agents: { queue: 'default' },
                    env: { NODE_ENV: 'test' },
                    timeout_in_minutes: 15,
                    retry: { automatic: false },
                    plugins: {},
                    artifact_paths: 'coverage/**/*',
                    branches: '',
                    if: '',
                    unless: '',
                    depends_on: ['install'],
                    allow_dependency_failure: false,
                    soft_fail: false,
                    priority: 0
                }
            },
            {
                id: 'step-3',
                type: 'command',
                properties: {
                    label: '🔨 Build Application',
                    command: 'npm run build',
                    key: 'build',
                    agents: { queue: 'default' },
                    env: { NODE_ENV: 'production' },
                    timeout_in_minutes: 20,
                    retry: { automatic: false },
                    plugins: {},
                    artifact_paths: 'dist/**/*',
                    branches: '',
                    if: '',
                    unless: '',
                    depends_on: ['test'],
                    allow_dependency_failure: false,
                    soft_fail: false,
                    priority: 0
                }
            },
            {
                id: 'step-4',
                type: 'block',
                properties: {
                    label: '🚀 Deploy to Production?',
                    prompt: 'Deploy this build to production?',
                    key: 'deploy-gate',
                    blocked_state: 'passed',
                    fields: [],
                    branches: 'main',
                    if: '',
                    unless: '',
                    depends_on: [],
                    allow_dependency_failure: false
                }
            },
            {
                id: 'step-5',
                type: 'command',
                properties: {
                    label: 'Deploy Application',
                    command: 'npm run deploy',
                    key: 'deploy',
                    agents: { queue: 'deploy' },
                    env: { NODE_ENV: 'production' },
                    timeout_in_minutes: 20,
                    retry: { automatic: { limit: 1 } },
                    plugins: {},
                    artifact_paths: '',
                    branches: 'main',
                    if: '',
                    unless: '',
                    depends_on: ['deploy-gate'],
                    allow_dependency_failure: false,
                    soft_fail: false,
                    priority: 0
                }
            }
        ];

        this.steps = exampleSteps;
        this.stepCounter = exampleSteps.length;
        this.selectedStep = null;
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        this.updateLastSaved();
        
        console.log('📋 Loaded example pipeline with complete configuration');
    }

    exportYAML() {
        if (!window.yamlGenerator) {
            console.error('❌ YAML generator not available');
            alert('YAML generator not available');
            return;
        }
        
        const yaml = window.yamlGenerator.generateYAML(this.steps);
        
        // Show in modal
        const modal = document.getElementById('yaml-modal');
        const content = document.getElementById('yaml-output');
        
        if (modal && content) {
            content.value = yaml;
            modal.classList.remove('hidden');
            console.log('📄 YAML export modal opened');
        } else {
            // Fallback: copy to clipboard and alert
            if (navigator.clipboard) {
                navigator.clipboard.writeText(yaml).then(() => {
                    alert('YAML copied to clipboard!');
                });
            } else {
                console.error('❌ Unable to export YAML');
            }
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.pipelineBuilder) {
            window.pipelineBuilder = new PipelineBuilder();
        }
    });
} else {
    if (!window.pipelineBuilder) {
        window.pipelineBuilder = new PipelineBuilder();
    }
}