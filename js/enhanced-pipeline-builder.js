// js/pipeline-builder.js
// Enhanced Buildkite Pipeline Builder with Complete Step Configuration Options

class PipelineBuilder {
    constructor() {
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.draggedElement = null;
        this.dragInsertIndex = -1;
        this.isDragging = false;
        
        // Initialize plugin catalog with comprehensive options
        this.pluginCatalog = {
            'docker': {
                name: 'Docker',
                description: 'Build and run Docker containers',
                category: 'docker',
                version: 'v4.9.0',
                config: {
                    image: { type: 'text', label: 'Docker Image', required: true },
                    command: { type: 'text', label: 'Command', required: false },
                    workdir: { type: 'text', label: 'Working Directory', required: false },
                    volumes: { type: 'array', label: 'Volumes', required: false },
                    environment: { type: 'object', label: 'Environment Variables', required: false }
                }
            },
            'junit-annotate': {
                name: 'JUnit Annotate',
                description: 'Annotate builds with JUnit test results',
                category: 'testing',
                version: 'v2.4.1',
                config: {
                    artifacts: { type: 'text', label: 'Test Artifacts Path', required: true, default: 'test-results/*.xml' },
                    context: { type: 'text', label: 'Context', required: false, default: 'junit' }
                }
            },
            'ecr': {
                name: 'AWS ECR',
                description: 'Push Docker images to Amazon ECR',
                category: 'deployment',
                version: 'v2.7.0',
                config: {
                    account_id: { type: 'text', label: 'AWS Account ID', required: true },
                    region: { type: 'text', label: 'AWS Region', required: true, default: 'us-east-1' },
                    repository: { type: 'text', label: 'ECR Repository', required: true },
                    tags: { type: 'array', label: 'Image Tags', required: false }
                }
            },
            'artifacts': {
                name: 'Artifacts',
                description: 'Upload build artifacts',
                category: 'deployment',
                version: 'v1.9.0',
                config: {
                    upload: { type: 'text', label: 'Upload Path', required: true, default: 'build/**/*' },
                    download: { type: 'text', label: 'Download Path', required: false }
                }
            },
            'slack': {
                name: 'Slack Notify',
                description: 'Send notifications to Slack',
                category: 'notification',
                version: 'v2.7.0',
                config: {
                    channels: { type: 'array', label: 'Channels', required: true },
                    message: { type: 'text', label: 'Message', required: false },
                    emoji: { type: 'text', label: 'Emoji', required: false, default: ':buildkite:' }
                }
            },
            'security-scan': {
                name: 'Security Scanner',
                description: 'Scan for security vulnerabilities',
                category: 'security',
                version: 'v1.2.0',
                config: {
                    target: { type: 'text', label: 'Scan Target', required: true, default: '.' },
                    format: { type: 'select', label: 'Output Format', options: ['json', 'xml', 'html'], default: 'json' }
                }
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        console.log('✅ Enhanced Pipeline Builder initialized with complete configuration');
    }

    setupEventListeners() {
        // Setup enhanced drag and drop
        this.setupEnhancedDragAndDrop();
        
        // Setup keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Setup property updates
        this.setupPropertyEventListeners();
        
        console.log('✅ Event listeners configured');
    }

    setupEnhancedDragAndDrop() {
        console.log('🎯 Setting up enhanced drag and drop...');
        
        // Make step types draggable
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
            stepType.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Setup drop zones for pipeline container
        this.setupPipelineDropZones();
        
        console.log('✅ Enhanced drag and drop configured');
    }

    setupPipelineDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) {
            console.warn('⚠️ Pipeline steps container not found');
            return;
        }

        pipelineSteps.addEventListener('dragover', this.handleEnhancedDragOver.bind(this));
        pipelineSteps.addEventListener('drop', this.handleEnhancedDrop.bind(this));
        pipelineSteps.addEventListener('dragenter', this.handleDragEnter.bind(this));
        pipelineSteps.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }

    handleDragStart(e) {
        const stepType = e.target.dataset.stepType;
        const plugin = e.target.dataset.plugin;
        
        console.log('🎯 Drag started:', stepType, plugin ? `(plugin: ${plugin})` : '');
        
        if (plugin) {
            e.dataTransfer.setData('text/plain', `plugin:${plugin}`);
        } else {
            e.dataTransfer.setData('text/plain', stepType);
        }
        
        e.dataTransfer.effectAllowed = 'copy';
        this.draggedElement = e.target;
        this.isDragging = true;
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        console.log('🎯 Drag ended');
        e.target.classList.remove('dragging');
        this.isDragging = false;
        this.draggedElement = null;
        this.dragInsertIndex = -1;
    }

    handleEnhancedDragOver(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDragEnter(e) {
        if (!this.isDragging) return;
        e.preventDefault();
    }

    handleDragLeave(e) {
        if (!this.isDragging) return;
    }

    handleEnhancedDrop(e) {
        e.preventDefault();
        
        const dragData = e.dataTransfer.getData('text/plain');
        
        if (dragData.startsWith('plugin:')) {
            const pluginKey = dragData.replace('plugin:', '');
            this.addPluginStep(pluginKey);
        } else {
            this.addStep(dragData);
        }
        
        console.log('✅ Drop completed');
    }

    setupPropertyEventListeners() {
        console.log('✅ Property event listeners ready');
    }

    handleKeyboard(e) {
        if (e.key === 'Delete' && this.selectedStep) {
            this.removeStep(this.selectedStep);
        }
        if (e.key === 'Escape') {
            this.selectStep(null);
        }
        if (e.key === 'ArrowUp' && this.selectedStep) {
            e.preventDefault();
            this.selectPreviousStep();
        }
        if (e.key === 'ArrowDown' && this.selectedStep) {
            e.preventDefault();
            this.selectNextStep();
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
        if (currentIndex < this.steps.length - 1) {
            this.selectStep(this.steps[currentIndex + 1].id);
        }
    }

    addStep(type) {
        console.log(`➕ Adding ${type} step`);
        const step = this.createStep(type);
        this.steps.push(step);
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        console.log(`✅ Added ${type} step: ${step.id}`);
    }

    addStepAtIndex(type, index) {
        console.log(`➕ Adding ${type} step at index ${index}`);
        const step = this.createStep(type);
        
        if (index >= 0 && index <= this.steps.length) {
            this.steps.splice(index, 0, step);
        } else {
            this.steps.push(step);
        }
        
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        console.log(`✅ Added ${type} step: ${step.id}`);
    }

    createStep(type) {
        const step = {
            id: `step-${++this.stepCounter}`,
            type: type,
            properties: this.getDefaultProperties(type)
        };
        return step;
    }

    getDefaultProperties(type) {
        const defaults = {
            command: {
                label: 'Command Step',
                command: '',
                key: '',
                agents: {},
                env: {},
                timeout_in_minutes: 60,
                retry: { 
                    automatic: { 
                        limit: 2,
                        exit_status: '*'
                    },
                    manual: {
                        allowed: true,
                        reason: "Failed tests"
                    }
                },
                plugins: {},
                matrix: null,
                concurrency: null,
                concurrency_group: '',
                parallelism: null,
                artifact_paths: '',
                branches: '',
                skip: false,
                if: '',
                unless: '',
                depends_on: [],
                allow_dependency_failure: false,
                soft_fail: false,
                priority: 0
            },
            wait: {
                label: 'Wait Step',
                continue_on_failure: false,
                if: '',
                unless: '',
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
                unless: '',
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
                unless: '',
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
                unless: '',
                depends_on: [],
                allow_dependency_failure: false,
                key: ''
            },
            group: {
                label: 'Group',
                steps: [],
                key: '',
                if: '',
                unless: '',
                depends_on: [],
                allow_dependency_failure: false
            },
            annotation: {
                label: 'Annotation',
                body: '',
                style: 'info',
                context: 'default',
                if: '',
                unless: '',
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
                unless: '',
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
                unless: '',
                depends_on: [],
                allow_dependency_failure: false
            },
            'pipeline-upload': {
                label: 'Pipeline Upload',
                pipeline_file: '.buildkite/pipeline.yml',
                dynamic_script: '',
                replace: false,
                if: '',
                unless: '',
                depends_on: [],
                allow_dependency_failure: false
            }
        };
        
        return { ...defaults[type] };
    }

    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
        if (!container) {
            console.warn('⚠️ Pipeline steps container not found');
            return;
        }

        if (this.steps.length === 0) {
            container.innerHTML = `
                <div class="empty-pipeline">
                    <div class="empty-state-content">
                        <i class="fas fa-stream"></i>
                        <h3>Start Building Your Pipeline</h3>
                        <p>Drag step types from the sidebar to create your Buildkite pipeline</p>
                        <div class="empty-state-tips">
                            <div class="tip">
                                <i class="fas fa-lightbulb"></i>
                                <span>Tip: Use <kbd>Ctrl+K</kbd> to open the command palette</span>
                            </div>
                            <div class="tip">
                                <i class="fas fa-bolt"></i>
                                <span>Or try loading an example pipeline to get started</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.steps.map((step, index) => {
            return this.renderStep(step, index);
        }).join('');
        
        console.log(`✅ Rendered ${this.steps.length} steps`);
    }

    renderStep(step, index) {
        const isSelected = step.id === this.selectedStep;
        const stepIcon = this.getStepIcon(step.type);
        const stepDescription = this.getStepDescription(step);
        const indicators = this.getStepIndicators(step);
        
        return `
            <div class="pipeline-step ${isSelected ? 'selected' : ''}" 
                 data-step-id="${step.id}" 
                 onclick="pipelineBuilder.selectStep('${step.id}')">
                <div class="step-header">
                    <div class="step-info">
                        <i class="fas ${stepIcon}"></i>
                        <div class="step-details">
                            <span class="step-label">${step.properties.label || step.type}</span>
                            <span class="step-type">${step.type}</span>
                        </div>
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
                <div class="step-content">
                    ${stepDescription}
                </div>
                ${indicators.length > 0 ? `
                    <div class="step-indicators">
                        ${indicators.join('')}
                    </div>
                ` : ''}
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
                return plugins.length > 0 ? `Using: ${plugins.join(', ')}` : 'No plugins configured';
            case 'notify':
                return 'Send notifications';
            case 'pipeline-upload':
                return step.properties.pipeline_file || 'Dynamic pipeline upload';
            default:
                return 'Pipeline step';
        }
    }

    getStepIndicators(step) {
        const indicators = [];
        
        if (step.properties.depends_on && step.properties.depends_on.length > 0) {
            indicators.push(`
                <span class="step-indicator dependency">
                    <i class="fas fa-link"></i>
                    ${step.properties.depends_on.length} dep${step.properties.depends_on.length !== 1 ? 's' : ''}
                </span>
            `);
        }
        
        if (step.properties.if || step.properties.unless) {
            indicators.push(`
                <span class="step-indicator condition">
                    <i class="fas fa-code-branch"></i>
                    conditional
                </span>
            `);
        }
        
        if (step.properties.matrix && step.properties.matrix.setup) {
            const dimensions = Object.keys(step.properties.matrix.setup).length;
            indicators.push(`
                <span class="step-indicator matrix">
                    <i class="fas fa-th"></i>
                    matrix (${dimensions}D)
                </span>
            `);
        }
        
        if (step.properties.plugins && Object.keys(step.properties.plugins).length > 0) {
            const pluginCount = Object.keys(step.properties.plugins).length;
            indicators.push(`
                <span class="step-indicator plugin">
                    <i class="fas fa-plug"></i>
                    ${pluginCount} plugin${pluginCount !== 1 ? 's' : ''}
                </span>
            `);
        }
        
        return indicators;
    }

    selectStep(stepId) {
        this.selectedStep = stepId;
        this.renderPipeline();
        this.renderProperties();
        console.log('👆 Selected step:', stepId);
    }

    moveStepUp(index) {
        if (index > 0) {
            [this.steps[index], this.steps[index - 1]] = [this.steps[index - 1], this.steps[index]];
            this.renderPipeline();
        }
    }

    moveStepDown(index) {
        if (index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.renderPipeline();
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
            
            const index = this.steps.findIndex(s => s.id === stepId);
            this.steps.splice(index + 1, 0, newStep);
            this.renderPipeline();
            this.selectStep(newStep.id);
            this.updateStepCount();
            
            console.log('📄 Duplicated step:', stepId, '→', newStep.id);
        }
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

    // COMPLETE PROPERTIES PANEL WITH ALL CONFIGURATION OPTIONS
    renderProperties() {
        const container = document.getElementById('properties-content');
        if (!container) {
            console.warn('⚠️ Properties content container not found');
            return;
        }

        if (!this.selectedStep) {
            container.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <h3>Select a Step</h3>
                    <p>Click on any step in the pipeline to view and edit its properties</p>
                    <div class="properties-help">
                        <h4>Available Step Types:</h4>
                        <ul>
                            <li><strong>Command</strong> - Execute shell commands</li>
                            <li><strong>Wait</strong> - Create dependencies between stages</li>
                            <li><strong>Block</strong> - Add manual approval points</li>
                            <li><strong>Input</strong> - Collect user input</li>
                            <li><strong>Trigger</strong> - Launch other pipelines</li>
                            <li><strong>Group</strong> - Organize related steps</li>
                            <li><strong>Plugin</strong> - Use Buildkite plugins</li>
                            <li><strong>Annotation</strong> - Add build annotations</li>
                            <li><strong>Notify</strong> - Send notifications</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }

        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step) {
            console.warn('⚠️ Selected step not found:', this.selectedStep);
            return;
        }

        container.innerHTML = this.generateCompletePropertyForm(step);
        this.setupPropertyEvents(step);
        
        console.log('🔧 Rendered complete properties for step:', step.id);
    }

    generateCompletePropertyForm(step) {
        const stepTypeTitle = step.type.charAt(0).toUpperCase() + step.type.slice(1);
        const stepIcon = this.getStepIcon(step.type);
        
        return `
            <div class="properties-content">
                <div class="properties-header">
                    <h3><i class="fas ${stepIcon}"></i> ${stepTypeTitle} Step Configuration</h3>
                    <div class="step-actions">
                        <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.duplicateStep('${step.id}')" title="Duplicate Step">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.removeStep('${step.id}')" title="Delete Step">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                ${this.generateBasicPropertiesSection(step)}
                ${this.generateExecutionEnvironmentSection(step)}
                ${this.generateConditionalLogicSection(step)}
                ${this.generateDependenciesSection(step)}
                ${this.generateAdvancedOptionsSection(step)}
                ${this.generateMatrixSection(step)}
                ${this.generatePluginsSection(step)}
            </div>
        `;
    }

    generateBasicPropertiesSection(step) {
        const props = step.properties;
        
        let basicFields = `
            <div class="property-group">
                <label for="label">Step Label *</label>
                <input type="text" name="label" value="${props.label || ''}" placeholder="e.g., Run Tests" />
                <small>Display name for this step in the pipeline</small>
            </div>
            
            <div class="property-group">
                <label for="key">Step Key</label>
                <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., test-step" />
                <small>Unique identifier for dependencies and references</small>
            </div>
        `;

        // Add step-specific basic fields
        switch (step.type) {
            case 'command':
                basicFields += `
                    <div class="property-group">
                        <label for="command">Command *</label>
                        <textarea name="command" placeholder="e.g., npm test" rows="4">${props.command || ''}</textarea>
                        <small>Shell command(s) to execute</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="artifact_paths">Artifact Paths</label>
                        <input type="text" name="artifact_paths" value="${props.artifact_paths || ''}" 
                               placeholder="e.g., test-results/*.xml" />
                        <small>Glob patterns for artifacts to upload</small>
                    </div>
                `;
                break;
                
            case 'block':
                basicFields += `
                    <div class="property-group">
                        <label for="prompt">Prompt Message</label>
                        <textarea name="prompt" placeholder="Please confirm deployment to production" rows="3">${props.prompt || ''}</textarea>
                        <small>Message shown to users when approving</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="blocked_state">Blocked State</label>
                        <select name="blocked_state">
                            <option value="passed" ${props.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                            <option value="failed" ${props.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                            <option value="running" ${props.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                        </select>
                        <small>State to show while waiting for approval</small>
                    </div>
                `;
                break;
                
            case 'input':
                basicFields += `
                    <div class="property-group">
                        <label for="prompt">Prompt Message</label>
                        <textarea name="prompt" placeholder="Please provide input" rows="3">${props.prompt || ''}</textarea>
                        <small>Instructions for user input</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="fields">Input Fields (JSON)</label>
                        <textarea name="fields" placeholder='[{"key": "environment", "text": "Environment", "required": true}]' rows="6">${JSON.stringify(props.fields || [], null, 2)}</textarea>
                        <small>JSON array defining input fields</small>
                    </div>
                `;
                break;
                
            case 'trigger':
                basicFields += `
                    <div class="property-group">
                        <label for="trigger">Pipeline to Trigger *</label>
                        <input type="text" name="trigger" value="${props.trigger || ''}" placeholder="my-org/my-pipeline" />
                        <small>Format: organization/pipeline-slug</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="async" ${props.async ? 'checked' : ''} />
                        <label for="async">Asynchronous (don't wait for completion)</label>
                    </div>
                    
                    <div class="property-group">
                        <label for="build_message">Build Message</label>
                        <input type="text" name="build_message" value="${props.build?.message || ''}" placeholder="Deploy from main branch" />
                        <small>Message for the triggered build</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="build_branch">Branch</label>
                        <input type="text" name="build_branch" value="${props.build?.branch || 'main'}" placeholder="main" />
                        <small>Branch to build in triggered pipeline</small>
                    </div>
                `;
                break;
                
            case 'wait':
                basicFields += `
                    <div class="property-checkbox">
                        <input type="checkbox" name="continue_on_failure" ${props.continue_on_failure ? 'checked' : ''} />
                        <label for="continue_on_failure">Continue on Failure</label>
                        <small>Allow pipeline to continue even if dependencies fail</small>
                    </div>
                `;
                break;
                
            case 'annotation':
                basicFields += `
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
                        <input type="text" name="context" value="${props.context || ''}" placeholder="default" />
                        <small>Groups related annotations</small>
                    </div>
                `;
                break;
                
            case 'group':
                basicFields += `
                    <div class="property-group">
                        <label>Group Steps</label>
                        <div class="group-steps-info">
                            <p>This group contains ${props.steps?.length || 0} step(s)</p>
                            <small>Use the group editor to manage steps within this group</small>
                        </div>
                    </div>
                `;
                break;
                
            case 'pipeline-upload':
                basicFields += `
                    <div class="property-group">
                        <label for="pipeline_file">Pipeline File</label>
                        <input type="text" name="pipeline_file" value="${props.pipeline_file || ''}" 
                               placeholder=".buildkite/pipeline.yml" />
                        <small>Path to pipeline file or script</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="replace" ${props.replace ? 'checked' : ''} />
                        <label for="replace">Replace Pipeline (vs append)</label>
                    </div>
                `;
                break;
        }

        return `
            <div class="property-section">
                <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                ${basicFields}
            </div>
        `;
    }

    generateExecutionEnvironmentSection(step) {
        if (step.type === 'wait' || step.type === 'annotation') {
            return '';
        }

        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-server"></i> Execution Environment</h4>
                
                <div class="property-group">
                    <label for="agents">Agent Targeting (JSON)</label>
                    <textarea name="agents" placeholder='{"queue": "default", "os": "linux"}' rows="3">${JSON.stringify(props.agents || {}, null, 2)}</textarea>
                    <small>JSON object specifying agent requirements</small>
                </div>
                
                <div class="property-group">
                    <label for="env">Environment Variables (JSON)</label>
                    <textarea name="env" placeholder='{"NODE_ENV": "test", "DEBUG": "true"}' rows="4">${JSON.stringify(props.env || {}, null, 2)}</textarea>
                    <small>JSON object of environment variables</small>
                </div>
                
                ${step.type === 'command' || step.type === 'plugin' ? `
                    <div class="property-group">
                        <label for="timeout_in_minutes">Timeout (minutes)</label>
                        <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes || 60}" min="1" max="1440" />
                        <small>Maximum time to wait before canceling (1-1440 minutes)</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateConditionalLogicSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Logic</h4>
                
                <div class="property-group">
                    <label for="if">IF Condition</label>
                    <input type="text" name="if" value="${props.if || ''}" placeholder="build.branch == 'main'" />
                    <small>Step runs only if this condition is true</small>
                </div>
                
                <div class="property-group">
                    <label for="unless">UNLESS Condition</label>
                    <input type="text" name="unless" value="${props.unless || ''}" placeholder="build.pull_request.draft == true" />
                    <small>Step runs unless this condition is true</small>
                </div>
                
                <div class="property-group">
                    <label for="branches">Branch Filter</label>
                    <input type="text" name="branches" value="${props.branches || ''}" placeholder="main !release/* feature/*" />
                    <small>Branch patterns (space-separated, use ! for exclusion)</small>
                </div>
                
                <div class="conditional-examples">
                    <strong>Examples:</strong>
                    <ul>
                        <li><code>build.branch == "main"</code> - Only on main branch</li>
                        <li><code>build.pull_request.id == null</code> - Not on pull requests</li>
                        <li><code>build.env("DEPLOY") == "true"</code> - When env var is set</li>
                    </ul>
                </div>
            </div>
        `;
    }

    generateDependenciesSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${(props.depends_on || []).join('\n')}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                    <small>Continue even if dependencies fail</small>
                </div>
            </div>
        `;
    }

    generateAdvancedOptionsSection(step) {
        if (step.type === 'wait' || step.type === 'annotation') {
            return '';
        }

        const props = step.properties;
        
        let advancedOptions = '';
        
        if (step.type === 'command' || step.type === 'plugin') {
            advancedOptions = `
                <div class="property-group">
                    <label for="retry_automatic_limit">Automatic Retry Limit</label>
                    <input type="number" name="retry_automatic_limit" value="${props.retry?.automatic?.limit || 0}" min="0" max="10" />
                    <small>Number of times to automatically retry failed jobs</small>
                </div>
                
                <div class="property-group">
                    <label for="retry_automatic_exit_status">Retry Exit Status</label>
                    <input type="text" name="retry_automatic_exit_status" value="${props.retry?.automatic?.exit_status || '*'}" placeholder="*" />
                    <small>Exit statuses to retry on (* for all, or comma-separated list)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="retry_manual_allowed" ${props.retry?.manual?.allowed !== false ? 'checked' : ''} />
                    <label for="retry_manual_allowed">Allow Manual Retry</label>
                    <small>Allow users to manually retry this step</small>
                </div>
                
                <div class="property-group">
                    <label for="concurrency">Concurrency Limit</label>
                    <input type="number" name="concurrency" value="${props.concurrency || ''}" min="1" placeholder="Unlimited" />
                    <small>Maximum number of concurrent jobs for this step</small>
                </div>
                
                <div class="property-group">
                    <label for="concurrency_group">Concurrency Group</label>
                    <input type="text" name="concurrency_group" value="${props.concurrency_group || ''}" placeholder="deployment" />
                    <small>Group name for concurrency limiting</small>
                </div>
                
                <div class="property-group">
                    <label for="parallelism">Parallelism</label>
                    <input type="number" name="parallelism" value="${props.parallelism || ''}" min="1" max="50" placeholder="1" />
                    <small>Number of parallel jobs to create</small>
                </div>
                
                <div class="property-group">
                    <label for="priority">Priority</label>
                    <input type="number" name="priority" value="${props.priority || 0}" min="-10" max="10" />
                    <small>Job priority (-10 to 10, higher numbers run first)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="soft_fail" ${props.soft_fail ? 'checked' : ''} />
                    <label for="soft_fail">Soft Fail</label>
                    <small>Mark as passed even if command fails</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="skip" ${props.skip ? 'checked' : ''} />
                    <label for="skip">Skip Step</label>
                    <small>Skip this step entirely</small>
                </div>
            `;
        }

        if (!advancedOptions) {
            return '';
        }

        return `
            <div class="property-section">
                <h4><i class="fas fa-sliders-h"></i> Advanced Options</h4>
                ${advancedOptions}
            </div>
        `;
    }

    generateMatrixSection(step) {
        if (step.type !== 'command' && step.type !== 'plugin') {
            return '';
        }

        const props = step.properties;
        const hasMatrix = props.matrix && props.matrix.setup;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-th"></i> Matrix Builds</h4>
                
                ${hasMatrix ? `
                    <div class="matrix-preview">
                        <strong>Current Matrix:</strong>
                        <pre>${JSON.stringify(props.matrix.setup, null, 2)}</pre>
                    </div>
                ` : `
                    <div class="matrix-info">
                        <p>No matrix configuration set</p>
                        <small>Matrix builds allow running the same step with different parameters</small>
                    </div>
                `}
                
                <div class="matrix-actions">
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.openMatrixBuilder('${step.id}')">
                        <i class="fas fa-th"></i> Configure Matrix
                    </button>
                    ${hasMatrix ? `
                        <button type="button" class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.clearMatrix('${step.id}')">
                            <i class="fas fa-times"></i> Clear Matrix
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    generatePluginsSection(step) {
        if (step.type !== 'command' && step.type !== 'plugin') {
            return '';
        }

        const props = step.properties;
        const hasPlugins = props.plugins && Object.keys(props.plugins).length > 0;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-plug"></i> Plugins</h4>
                
                ${step.type === 'plugin' ? `
                    <div class="property-group">
                        <label for="selected_plugin">Primary Plugin</label>
                        <select name="selected_plugin" onchange="window.pipelineBuilder.updatePluginSelection(this.value)">
                            <option value="">Choose a plugin...</option>
                            ${Object.entries(this.pluginCatalog).map(([key, plugin]) => 
                                `<option value="${key}" ${props.selected_plugin === key ? 'selected' : ''}>${plugin.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                ` : ''}
                
                <div class="property-group">
                    <label for="plugins">Plugin Configuration (JSON)</label>
                    <textarea name="plugins" placeholder='{"docker": {"image": "node:16"}, "artifacts": {"upload": "dist/**/*"}}' rows="8">${JSON.stringify(props.plugins || {}, null, 2)}</textarea>
                    <small>JSON object defining plugin configurations</small>
                </div>
                
                <div class="plugin-actions">
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.showPluginCatalog()">
                        <i class="fas fa-store"></i> Browse Plugin Catalog
                    </button>
                    
                    ${hasPlugins ? `
                        <button type="button" class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.validatePlugins('${step.id}')">
                            <i class="fas fa-check"></i> Validate Configuration
                        </button>
                    ` : ''}
                </div>
                
                ${hasPlugins ? `
                    <div class="plugins-preview">
                        <strong>Configured Plugins:</strong>
                        <ul>
                            ${Object.keys(props.plugins).map(pluginName => 
                                `<li><strong>${pluginName}</strong> - ${this.pluginCatalog[pluginName]?.name || 'Unknown Plugin'}</li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupPropertyEvents(step) {
        const container = document.getElementById('properties-content');
        if (!container) return;

        // Add event listeners for all form elements
        container.querySelectorAll('input, textarea, select').forEach(element => {
            const eventType = element.type === 'checkbox' ? 'change' : 'input';
            
            element.addEventListener(eventType, (e) => {
                this.updateStepProperty(step, e.target.name, e.target.value, e.target.type);
            });
        });
    }

    updateStepProperty(step, propertyName, value, inputType) {
        if (!step || !propertyName) return;

        // Handle different input types
        if (inputType === 'checkbox') {
            value = document.querySelector(`input[name="${propertyName}"]`).checked;
        } else if (inputType === 'number') {
            value = value === '' ? null : parseInt(value);
        }

        // Handle special property paths
        if (propertyName === 'depends_on') {
            value = value.split('\n').filter(line => line.trim()).map(line => line.trim());
        } else if (propertyName === 'agents' || propertyName === 'env' || propertyName === 'plugins' || propertyName === 'fields') {
            try {
                value = value ? JSON.parse(value) : {};
            } catch (e) {
                console.warn('Invalid JSON for', propertyName, ':', e);
                return; // Don't update if JSON is invalid
            }
        } else if (propertyName.startsWith('retry_')) {
            // Handle retry properties
            if (!step.properties.retry) step.properties.retry = { automatic: {}, manual: {} };
            
            if (propertyName === 'retry_automatic_limit') {
                step.properties.retry.automatic.limit = value;
            } else if (propertyName === 'retry_automatic_exit_status') {
                step.properties.retry.automatic.exit_status = value;
            } else if (propertyName === 'retry_manual_allowed') {
                step.properties.retry.manual.allowed = value;
            }
            
            this.renderPipeline();
            return;
        } else if (propertyName.startsWith('build_')) {
            // Handle trigger build properties
            if (!step.properties.build) step.properties.build = {};
            
            if (propertyName === 'build_message') {
                step.properties.build.message = value;
            } else if (propertyName === 'build_branch') {
                step.properties.build.branch = value;
            }
            
            this.renderPipeline();
            return;
        }
        
        // Update the property
        step.properties[propertyName] = value;

        // Update pipeline display
        this.renderPipeline();
        
        console.log(`🔧 Updated ${propertyName} for ${step.id}:`, value);
    }

    updatePluginSelection(pluginKey) {
        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step) return;

        step.properties.selected_plugin = pluginKey;
        
        if (pluginKey && this.pluginCatalog[pluginKey]) {
            const plugin = this.pluginCatalog[pluginKey];
            const defaultConfig = {};
            
            // Set default values for plugin config
            Object.entries(plugin.config || {}).forEach(([key, config]) => {
                if (config.default !== undefined) {
                    defaultConfig[key] = config.default;
                }
            });
            
            step.properties.plugins = {
                [pluginKey]: defaultConfig
            };
        }
        
        this.renderProperties();
    }

    // Additional utility methods
    clearMatrix(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            delete step.properties.matrix;
            this.renderPipeline();
            this.renderProperties();
        }
    }

    validatePlugins(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const plugins = step.properties.plugins || {};
        const issues = [];
        
        Object.entries(plugins).forEach(([pluginName, config]) => {
            const pluginInfo = this.pluginCatalog[pluginName];
            if (!pluginInfo) {
                issues.push(`Unknown plugin: ${pluginName}`);
                return;
            }
            
            // Validate required fields
            Object.entries(pluginInfo.config || {}).forEach(([field, fieldConfig]) => {
                if (fieldConfig.required && !config[field]) {
                    issues.push(`${pluginName}: Missing required field '${field}'`);
                }
            });
        });
        
        if (issues.length > 0) {
            alert(`Plugin validation issues:\n\n${issues.join('\n')}`);
        } else {
            alert('All plugins are properly configured!');
        }
    }

    // Advanced feature methods (stubs for now)
    openMatrixBuilder(stepId) {
        console.log('🔲 Opening matrix builder for step:', stepId);
        alert('Matrix builder functionality coming soon!');
    }

    showPluginCatalog() {
        console.log('🔌 Opening plugin catalog...');
        alert('Plugin catalog functionality coming soon!');
    }

    // Utility methods
    clearPipeline() {
        if (this.steps.length === 0) {
            return;
        }
        
        if (confirm('Are you sure you want to clear the entire pipeline?')) {
            this.steps = [];
            this.selectedStep = null;
            this.stepCounter = 0;
            this.renderPipeline();
            this.renderProperties();
            this.updateStepCount();
            console.log('🗑️ Pipeline cleared');
        }
    }

    loadExample() {
        const exampleSteps = [
            {
                id: 'step-1',
                type: 'command',
                properties: {
                    label: 'Install Dependencies',
                    command: 'npm install',
                    key: 'install',
                    agents: { queue: 'default' },
                    env: {},
                    timeout_in_minutes: 10,
                    retry: { automatic: { limit: 2, exit_status: '*' }, manual: { allowed: true } },
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
                    label: 'Run Tests',
                    command: 'npm test',
                    key: 'test',
                    agents: { queue: 'default' },
                    env: { NODE_ENV: 'test' },
                    timeout_in_minutes: 30,
                    retry: { automatic: { limit: 1, exit_status: '*' }, manual: { allowed: true } },
                    plugins: {
                        'junit-annotate': {
                            artifacts: 'test-results/*.xml',
                            context: 'jest'
                        }
                    },
                    artifact_paths: 'test-results/*.xml',
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
                type: 'wait',
                properties: {
                    label: 'Wait for Tests',
                    continue_on_failure: false,
                    if: '',
                    unless: '',
                    depends_on: [],
                    allow_dependency_failure: false
                }
            },
            {
                id: 'step-4',
                type: 'block',
                properties: {
                    label: 'Deploy to Production',
                    prompt: 'Ready to deploy to production?',
                    key: 'deploy-gate',
                    blocked_state: 'passed',
                    fields: [],
                    branches: 'main',
                    if: '',
                    unless: '',
                    depends_on: [],
                    allow_dependency_failure: false
                }
            }
        ];

        this.steps = exampleSteps;
        this.stepCounter = exampleSteps.length;
        this.selectedStep = null;
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        
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
                    console.log('📋 YAML copied to clipboard');
                });
            } else {
                console.log('📄 YAML Output:', yaml);
                alert('YAML generated - check console');
            }
        }
    }

    updateStepCount() {
        const stepCountElement = document.getElementById('step-count');
        if (stepCountElement) {
            stepCountElement.textContent = this.steps.length;
        }
    }

    addPluginStep(pluginKey) {
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
        this.updateStepCount();
        
        console.log('🔌 Added plugin step:', pluginKey);
    }
}

// Initialize the pipeline builder when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (!window.pipelineBuilder) {
        window.pipelineBuilder = new PipelineBuilder();
        console.log('✅ Enhanced Pipeline Builder with complete configuration options initialized');
    }
});