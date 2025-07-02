// js/pipeline-builder.js
// Enhanced Buildkite Pipeline Builder with Complete Step Configuration

class PipelineBuilder {
    constructor() {
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.draggedElement = null;
        this.dragInsertIndex = -1;
        
        // Initialize plugin catalog
        this.pluginCatalog = {
            'docker': {
                name: 'Docker',
                description: 'Build and run Docker containers',
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
                config: {
                    artifacts: { type: 'text', label: 'Test Artifacts Path', required: true, default: 'test-results/*.xml' },
                    context: { type: 'text', label: 'Context', required: false, default: 'junit' }
                }
            },
            'ecr': {
                name: 'AWS ECR',
                description: 'Push Docker images to Amazon ECR',
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
                config: {
                    upload: { type: 'text', label: 'Upload Path', required: true, default: 'build/**/*' },
                    download: { type: 'text', label: 'Download Path', required: false }
                }
            }
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderPipeline();
        this.renderProperties();
    }

    setupEventListeners() {
        // Setup drag and drop for step types
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
        });

        // Setup pipeline container as drop zone
        const pipelineContainer = document.getElementById('pipeline-steps');
        if (pipelineContainer) {
            pipelineContainer.addEventListener('dragover', this.handleDragOver.bind(this));
            pipelineContainer.addEventListener('drop', this.handleDrop.bind(this));
            pipelineContainer.addEventListener('dragleave', this.handleDragLeave.bind(this));
        }

        // Setup keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.stepType);
        e.dataTransfer.effectAllowed = 'copy';
        this.draggedElement = e.target;
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const container = document.getElementById('pipeline-steps');
        if (!container) return;
        
        container.classList.add('drag-over');
        
        // Find insertion point
        const afterElement = this.getDragAfterElement(container, e.clientY);
        const dragIndicator = this.createDragIndicator();
        
        // Remove existing indicators
        container.querySelectorAll('.drag-indicator').forEach(indicator => indicator.remove());
        
        if (afterElement == null) {
            container.appendChild(dragIndicator);
            this.dragInsertIndex = this.steps.length;
        } else {
            container.insertBefore(dragIndicator, afterElement);
            const stepId = afterElement.dataset.stepId;
            this.dragInsertIndex = this.steps.findIndex(step => step.id === stepId);
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const container = document.getElementById('pipeline-steps');
        if (container) {
            container.classList.remove('drag-over');
            container.querySelectorAll('.drag-indicator').forEach(indicator => indicator.remove());
        }
        
        const stepType = e.dataTransfer.getData('text/plain');
        if (stepType) {
            this.addStepAtIndex(stepType, this.dragInsertIndex);
        }
        
        this.dragInsertIndex = -1;
    }

    handleDragLeave(e) {
        const container = document.getElementById('pipeline-steps');
        if (container && !container.contains(e.relatedTarget)) {
            container.classList.remove('drag-over');
            container.querySelectorAll('.drag-indicator').forEach(indicator => indicator.remove());
        }
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.pipeline-step:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    createDragIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'drag-indicator';
        indicator.innerHTML = '<div class="drag-line"></div>';
        return indicator;
    }

    handleKeyboard(e) {
        if (e.key === 'Delete' && this.selectedStep) {
            this.removeStep(this.selectedStep);
        } else if (e.key === 'Escape') {
            this.selectStep(null);
        }
    }

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
                depends_on: [],
                allow_dependency_failure: false,
                soft_fail: false,
                priority: 0
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
                allow_dependency_failure: false
            },
            input: {
                label: 'Input Step',
                prompt: 'Please provide input',
                fields: [],
                branches: '',
                if: '',
                depends_on: [],
                allow_dependency_failure: false
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
                allow_dependency_failure: false
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
            return this.renderStep(step, index);
        }).join('');
    }

    renderStep(step, index) {
        const isSelected = step.id === this.selectedStep;
        const stepIcon = this.getStepIcon(step.type);
        const stepDescription = this.getStepDescription(step);
        
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
            upload: 'fa-upload'
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
                return `Group with ${step.properties.steps.length} step(s)`;
            case 'annotation':
                return step.properties.body || 'No annotation text';
            case 'plugin':
                const plugins = Object.keys(step.properties.plugins || {});
                return plugins.length > 0 ? `Using: ${plugins.join(', ')}` : 'No plugins configured';
            case 'notify':
                return 'Send notifications';
            case 'upload':
                return step.properties.pipeline_file || 'Dynamic pipeline upload';
            default:
                return 'Pipeline step';
        }
    }

    selectStep(stepId) {
        this.selectedStep = stepId;
        this.renderPipeline();
        this.renderProperties();
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
        }
    }

    removeStep(stepId) {
        this.steps = this.steps.filter(step => step.id !== stepId);
        if (this.selectedStep === stepId) {
            this.selectedStep = null;
        }
        this.renderPipeline();
        this.renderProperties();
    }

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

        container.innerHTML = this.generatePropertyForm(step);
        this.setupPropertyEvents(step);
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
                <h4><i class="fas fa-terminal"></i> Command Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Run Tests" />
                </div>
                
                <div class="property-group">
                    <label for="command">Command *</label>
                    <textarea name="command" placeholder="e.g., npm test" rows="4">${props.command}</textarea>
                </div>
                
                <div class="property-group">
                    <label for="artifact_paths">Artifact Paths</label>
                    <input type="text" name="artifact_paths" value="${props.artifact_paths}" 
                           placeholder="e.g., test-results/*.xml" />
                    <small>Glob patterns for artifacts to upload</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-server"></i> Agent Configuration</h4>
                
                <div class="property-group">
                    <label for="agents">Agent Targeting</label>
                    <textarea name="agents" placeholder='{"queue": "default", "os": "linux"}' rows="3">${JSON.stringify(props.agents, null, 2)}</textarea>
                    <small>JSON object for agent requirements</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-cog"></i> Execution Settings</h4>
                
                <div class="property-group">
                    <label for="timeout_in_minutes">Timeout (minutes)</label>
                    <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes}" min="1" />
                </div>
                
                <div class="property-group">
                    <label for="parallelism">Parallelism</label>
                    <input type="number" name="parallelism" value="${props.parallelism || ''}" min="1" placeholder="1" />
                    <small>Number of parallel jobs to run</small>
                </div>
                
                <div class="property-group">
                    <label for="concurrency">Concurrency Limit</label>
                    <input type="number" name="concurrency" value="${props.concurrency || ''}" min="1" placeholder="Unlimited" />
                </div>
                
                <div class="property-group">
                    <label for="concurrency_group">Concurrency Group</label>
                    <input type="text" name="concurrency_group" value="${props.concurrency_group}" 
                           placeholder="e.g., deployment" />
                </div>
                
                <div class="property-group">
                    <label for="priority">Priority</label>
                    <input type="number" name="priority" value="${props.priority}" min="-10" max="10" />
                    <small>Higher numbers = higher priority (-10 to 10)</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-shield-alt"></i> Failure Handling</h4>
                
                <div class="property-group">
                    <label for="retry_automatic_limit">Automatic Retry Limit</label>
                    <input type="number" name="retry_automatic_limit" value="${props.retry?.automatic?.limit || 0}" min="0" />
                </div>
                
                <div class="property-group">
                    <label for="retry_exit_status">Retry Exit Status</label>
                    <input type="text" name="retry_exit_status" value="${props.retry?.automatic?.exit_status || '*'}" 
                           placeholder="* (all) or specific codes like 2,3" />
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="retry_manual_allowed" ${props.retry?.manual?.allowed ? 'checked' : ''} />
                    <label for="retry_manual_allowed">Allow Manual Retry</label>
                </div>
                
                <div class="property-group">
                    <label for="retry_manual_reason">Manual Retry Reason</label>
                    <input type="text" name="retry_manual_reason" value="${props.retry?.manual?.reason || ''}" 
                           placeholder="e.g., Failed tests can be retried" />
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="soft_fail" ${props.soft_fail ? 'checked' : ''} />
                    <label for="soft_fail">Soft Fail (continue on failure)</label>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="branches">Branch Filter</label>
                    <input type="text" name="branches" value="${props.branches}" 
                           placeholder="main !release/* feature/*" />
                    <small>Branch patterns (space-separated, use ! for exclusion)</small>
                </div>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="skip" ${props.skip ? 'checked' : ''} />
                    <label for="skip">Skip this step</label>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-env"></i> Environment Variables</h4>
                
                <div class="property-group">
                    <label for="env">Environment Variables</label>
                    <textarea name="env" placeholder='{"API_KEY": "secret", "DEBUG": "true"}' rows="4">${JSON.stringify(props.env, null, 2)}</textarea>
                    <small>JSON object of environment variables</small>
                </div>
            </div>
        `;
    }

    generateWaitForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-hourglass-half"></i> Wait Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label</label>
                    <input type="text" name="label" value="${props.label}" placeholder="Wait for previous steps" />
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="continue_on_failure" ${props.continue_on_failure ? 'checked' : ''} />
                    <label for="continue_on_failure">Continue on Failure</label>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>
        `;
    }

    generateBlockForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-hand-paper"></i> Block Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Deploy to Production" />
                </div>
                
                <div class="property-group">
                    <label for="prompt">Prompt Message</label>
                    <textarea name="prompt" placeholder="Please confirm deployment to production" rows="3">${props.prompt}</textarea>
                </div>
                
                <div class="property-group">
                    <label for="blocked_state">Blocked State</label>
                    <select name="blocked_state">
                        <option value="passed" ${props.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                        <option value="failed" ${props.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                        <option value="running" ${props.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                    </select>
                    <small>State to show while blocked</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-wpforms"></i> Input Fields</h4>
                
                <div class="property-group">
                    <label for="fields">Fields Configuration</label>
                    <textarea name="fields" placeholder='[{"key": "environment", "text": "Environment", "required": true}]' rows="8">${JSON.stringify(props.fields, null, 2)}</textarea>
                    <small>JSON array of input field definitions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="branches">Branch Filter</label>
                    <input type="text" name="branches" value="${props.branches}" 
                           placeholder="main !release/* feature/*" />
                    <small>Branch patterns (space-separated, use ! for exclusion)</small>
                </div>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>
        `;
    }

    generateInputForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-keyboard"></i> Input Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Deployment Settings" />
                </div>
                
                <div class="property-group">
                    <label for="prompt">Prompt Message</label>
                    <textarea name="prompt" placeholder="Please provide deployment settings" rows="3">${props.prompt}</textarea>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-wpforms"></i> Input Fields</h4>
                
                <div class="property-group">
                    <label for="fields">Fields Configuration</label>
                    <textarea name="fields" placeholder='[{"key": "environment", "text": "Environment", "select": "production|staging|development", "required": true}]' rows="10">${JSON.stringify(props.fields, null, 2)}</textarea>
                    <small>JSON array of input field definitions</small>
                </div>
                
                <div class="field-examples">
                    <h5>Field Examples:</h5>
                    <div class="example">
                        <strong>Text Field:</strong>
                        <code>{"key": "version", "text": "Version", "required": true}</code>
                    </div>
                    <div class="example">
                        <strong>Select Field:</strong>
                        <code>{"key": "env", "select": "prod|staging|dev", "default": "staging"}</code>
                    </div>
                    <div class="example">
                        <strong>Textarea:</strong>
                        <code>{"key": "notes", "textarea": true, "hint": "Optional notes"}</code>
                    </div>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="branches">Branch Filter</label>
                    <input type="text" name="branches" value="${props.branches}" 
                           placeholder="main !release/* feature/*" />
                    <small>Branch patterns (space-separated, use ! for exclusion)</small>
                </div>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
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
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Deploy to Production" />
                </div>
                
                <div class="property-group">
                    <label for="trigger">Pipeline to Trigger *</label>
                    <input type="text" name="trigger" value="${props.trigger}" placeholder="my-org/my-pipeline" />
                    <small>Format: organization/pipeline-slug</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="async" ${props.async ? 'checked' : ''} />
                    <label for="async">Asynchronous (don't wait for completion)</label>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-cogs"></i> Build Configuration</h4>
                
                <div class="property-group">
                    <label for="build_message">Build Message</label>
                    <input type="text" name="build_message" value="${props.build?.message || ''}" 
                           placeholder="Custom build message" />
                </div>
                
                <div class="property-group">
                    <label for="build_branch">Branch</label>
                    <input type="text" name="build_branch" value="${props.build?.branch || 'main'}" 
                           placeholder="main" />
                </div>
                
                <div class="property-group">
                    <label for="build_commit">Commit</label>
                    <input type="text" name="build_commit" value="${props.build?.commit || 'HEAD'}" 
                           placeholder="HEAD" />
                    <small>Commit SHA or reference</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-env"></i> Build Environment</h4>
                
                <div class="property-group">
                    <label for="build_env">Environment Variables</label>
                    <textarea name="build_env" placeholder='{"DEPLOY_ENV": "production"}' rows="4">${JSON.stringify(props.build?.env || {}, null, 2)}</textarea>
                    <small>JSON object of environment variables to pass</small>
                </div>
                
                <div class="property-group">
                    <label for="build_meta_data">Meta Data</label>
                    <textarea name="build_meta_data" placeholder='{"deployment": "production"}' rows="4">${JSON.stringify(props.build?.meta_data || {}, null, 2)}</textarea>
                    <small>JSON object of metadata to pass</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="branches">Branch Filter</label>
                    <input type="text" name="branches" value="${props.branches}" 
                           placeholder="main !release/* feature/*" />
                    <small>Branch patterns (space-separated, use ! for exclusion)</small>
                </div>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
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
                    <label for="label">Group Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Tests" />
                </div>
                
                <div class="property-group">
                    <label for="key">Group Key</label>
                    <input type="text" name="key" value="${props.key}" placeholder="tests-group" />
                    <small>Unique identifier for this group</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-list"></i> Group Steps</h4>
                
                <div class="property-group">
                    <label for="steps">Steps in Group</label>
                    <textarea name="steps" placeholder='[{"label": "Unit Tests", "command": "npm test"}]' rows="10">${JSON.stringify(props.steps, null, 2)}</textarea>
                    <small>JSON array of steps to include in this group</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
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
                    <label for="label">Step Label</label>
                    <input type="text" name="label" value="${props.label}" placeholder="Build Annotation" />
                </div>
                
                <div class="property-group">
                    <label for="body">Annotation Body *</label>
                    <textarea name="body" placeholder="Build completed successfully! :tada:" rows="6">${props.body}</textarea>
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
                    <input type="text" name="context" value="${props.context}" placeholder="default" />
                    <small>Groups related annotations</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>
        `;
    }

    generatePluginForm(step) {
        const props = step.properties;
        const pluginOptions = Object.entries(this.pluginCatalog).map(([key, plugin]) => 
            `<option value="${key}" ${props.selected_plugin === key ? 'selected' : ''}>${plugin.name}</option>`
        ).join('');
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-plug"></i> Plugin Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Docker Build" />
                </div>
                
                <div class="property-group">
                    <label for="selected_plugin">Select Plugin</label>
                    <select name="selected_plugin" onchange="pipelineBuilder.updatePluginSelection(this.value)">
                        <option value="">Choose a plugin...</option>
                        ${pluginOptions}
                    </select>
                </div>
                
                <div class="property-group">
                    <label for="plugins">Plugin Configuration</label>
                    <textarea name="plugins" placeholder='{"docker": {"image": "node:16"}}' rows="8">${JSON.stringify(props.plugins, null, 2)}</textarea>
                    <small>JSON object of plugin configurations</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-server"></i> Agent Configuration</h4>
                
                <div class="property-group">
                    <label for="agents">Agent Targeting</label>
                    <textarea name="agents" placeholder='{"queue": "default", "os": "linux"}' rows="3">${JSON.stringify(props.agents, null, 2)}</textarea>
                    <small>JSON object for agent requirements</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-cog"></i> Execution Settings</h4>
                
                <div class="property-group">
                    <label for="timeout_in_minutes">Timeout (minutes)</label>
                    <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes}" min="1" />
                </div>
                
                <div class="property-group">
                    <label for="artifact_paths">Artifact Paths</label>
                    <input type="text" name="artifact_paths" value="${props.artifact_paths}" 
                           placeholder="e.g., build/*.tar.gz" />
                    <small>Glob patterns for artifacts to upload</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-shield-alt"></i> Failure Handling</h4>
                
                <div class="property-group">
                    <label for="retry_automatic_limit">Automatic Retry Limit</label>
                    <input type="number" name="retry_automatic_limit" value="${props.retry?.automatic?.limit || 0}" min="0" />
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="branches">Branch Filter</label>
                    <input type="text" name="branches" value="${props.branches}" 
                           placeholder="main !release/* feature/*" />
                    <small>Branch patterns (space-separated, use ! for exclusion)</small>
                </div>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-env"></i> Environment Variables</h4>
                
                <div class="property-group">
                    <label for="env">Environment Variables</label>
                    <textarea name="env" placeholder='{"API_KEY": "secret", "DEBUG": "true"}' rows="4">${JSON.stringify(props.env, null, 2)}</textarea>
                    <small>JSON object of environment variables</small>
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
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Notify Team" />
                </div>
                
                <div class="property-group">
                    <label for="command">Command</label>
                    <textarea name="command" placeholder="echo 'Sending notification...'" rows="3">${props.command}</textarea>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-paper-plane"></i> Notification Settings</h4>
                
                <div class="property-group">
                    <label for="notify_email">Email Notification</label>
                    <input type="email" name="notify_email" value="${props.notify?.email || ''}" 
                           placeholder="team@company.com" />
                </div>
                
                <div class="property-group">
                    <label for="notify_slack">Slack Channel</label>
                    <input type="text" name="notify_slack" value="${props.notify?.slack || ''}" 
                           placeholder="#deployments" />
                </div>
                
                <div class="property-group">
                    <label for="notify_webhook">Webhook URL</label>
                    <input type="url" name="notify_webhook" value="${props.notify?.webhook || ''}" 
                           placeholder="https://hooks.slack.com/services/..." />
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>
        `;
    }

    generateUploadForm(step) {
        const props = step.properties;
        return `
            <div class="property-section">
                <h4><i class="fas fa-upload"></i> Pipeline Upload Configuration</h4>
                
                <div class="property-group">
                    <label for="label">Step Label *</label>
                    <input type="text" name="label" value="${props.label}" placeholder="e.g., Dynamic Pipeline" />
                </div>
                
                <div class="property-group">
                    <label for="pipeline_file">Pipeline File</label>
                    <input type="text" name="pipeline_file" value="${props.pipeline_file}" 
                           placeholder=".buildkite/pipeline.yml" />
                    <small>Path to pipeline file or script</small>
                </div>
                
                <div class="property-group">
                    <label for="dynamic_script">Dynamic Script</label>
                    <textarea name="dynamic_script" placeholder="buildkite-agent pipeline upload" rows="4">${props.dynamic_script}</textarea>
                    <small>Script to generate pipeline dynamically</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="replace" ${props.replace ? 'checked' : ''} />
                    <label for="replace">Replace Pipeline (vs append)</label>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">Conditional Expression</label>
                    <input type="text" name="if" value="${props.if}" 
                           placeholder="build.branch == 'main'" />
                    <small>Build condition using Buildkite expressions</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${props.depends_on?.join('\n') || ''}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
            </div>
        `;
    }

    setupPropertyEvents(step) {
        const container = document.getElementById('properties-content');
        if (!container) return;

        // Add event listeners for all form elements
        container.querySelectorAll('input, textarea, select').forEach(element => {
            element.addEventListener('input', (e) => {
                this.updateStepProperty(step, e.target.name, e.target.value, e.target.type);
            });
            
            element.addEventListener('change', (e) => {
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

        // Handle nested properties
        if (propertyName.includes('_')) {
            const parts = propertyName.split('_');
            
            if (parts[0] === 'retry') {
                if (!step.properties.retry) step.properties.retry = { automatic: {}, manual: {} };
                if (parts[1] === 'automatic') {
                    step.properties.retry.automatic[parts[2]] = value;
                } else if (parts[1] === 'manual') {
                    step.properties.retry.manual[parts[2]] = value;
                }
            } else if (parts[0] === 'build') {
                if (!step.properties.build) step.properties.build = {};
                step.properties.build[parts[1]] = value;
            } else if (parts[0] === 'notify') {
                if (!step.properties.notify) step.properties.notify = {};
                step.properties.notify[parts[1]] = value;
            }
        } else {
            // Handle JSON fields
            if (['agents', 'env', 'plugins', 'fields', 'build_env', 'build_meta_data'].includes(propertyName)) {
                try {
                    value = JSON.parse(value || '{}');
                } catch (e) {
                    console.warn('Invalid JSON for', propertyName, ':', value);
                    return;
                }
            }
            
            // Handle array fields
            if (propertyName === 'depends_on') {
                value = value.split('\n').filter(line => line.trim()).map(line => line.trim());
            }
            
            step.properties[propertyName] = value;
        }

        // Update pipeline display
        this.renderPipeline();
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

    // Utility methods
    clearPipeline() {
        if (confirm('Are you sure you want to clear the entire pipeline?')) {
            this.steps = [];
            this.selectedStep = null;
            this.renderPipeline();
            this.renderProperties();
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
                    agents: { queue: 'default' },
                    env: {},
                    timeout_in_minutes: 10,
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
                    skip: false,
                    concurrency: null,
                    concurrency_group: '',
                    parallelism: null
                }
            },
            {
                id: 'step-2',
                type: 'command',
                properties: {
                    label: 'Run Tests',
                    command: 'npm test',
                    agents: { queue: 'default' },
                    env: { NODE_ENV: 'test' },
                    timeout_in_minutes: 30,
                    retry: { automatic: { limit: 1 } },
                    plugins: {},
                    matrix: null,
                    artifact_paths: 'test-results/*.xml',
                    branches: '',
                    if: '',
                    depends_on: ['step-1'],
                    allow_dependency_failure: false,
                    soft_fail: false,
                    priority: 0,
                    skip: false,
                    concurrency: null,
                    concurrency_group: '',
                    parallelism: null
                }
            },
            {
                id: 'step-3',
                type: 'wait',
                properties: {
                    label: 'Wait for Tests',
                    continue_on_failure: false,
                    if: '',
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
                    blocked_state: 'passed',
                    fields: [],
                    branches: 'main',
                    if: '',
                    depends_on: [],
                    allow_dependency_failure: false
                }
            }
        ];

        this.steps = exampleSteps;
        this.stepCounter = exampleSteps.length;
        this.renderPipeline();
        this.selectStep(null);
    }

    exportYAML() {
        if (window.yamlGenerator) {
            const yaml = window.yamlGenerator.generateYAML(this.steps);
            
            // Show in modal
            const modal = document.getElementById('yaml-modal');
            const content = document.getElementById('yaml-content');
            
            if (modal && content) {
                content.textContent = yaml;
                modal.classList.remove('hidden');
            } else {
                // Fallback: copy to clipboard and alert
                navigator.clipboard.writeText(yaml).then(() => {
                    alert('YAML copied to clipboard!');
                }).catch(() => {
                    console.log('YAML Output:', yaml);
                    alert('YAML generated - check console');
                });
            }
        }
    }

    // Plugin catalog methods
    showPluginCatalog() {
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
                    <button class="btn btn-primary btn-small" onclick="pipelineBuilder.addPluginStep('${key}')">
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
    }

    // Matrix builder methods
    showMatrixBuilder() {
        const modal = document.getElementById('matrix-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.initializeMatrixBuilder();
        }
    }

    initializeMatrixBuilder() {
        const container = document.getElementById('matrix-dimensions');
        if (!container) return;

        container.innerHTML = `
            <div class="matrix-dimension">
                <label>Dimension Name:</label>
                <input type="text" class="dimension-name" placeholder="e.g., node_version" />
                <label>Values (comma-separated):</label>
                <input type="text" class="dimension-values" placeholder="e.g., 14, 16, 18" />
                <button type="button" class="btn btn-secondary btn-small" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
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

    applyMatrixToStep() {
        if (!this.selectedStep) {
            alert('Please select a step first');
            return;
        }

        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step || step.type !== 'command') {
            alert('Matrix can only be applied to command steps');
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

        // Close modal and refresh properties
        const modal = document.getElementById('matrix-builder-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        this.renderProperties();
        this.renderPipeline();
    }

    // Keyboard shortcuts
    showKeyboardShortcuts() {
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Step templates
    showStepTemplates() {
        const modal = document.getElementById('templates-modal');
        if (modal) {
            this.renderStepTemplates();
            modal.classList.remove('hidden');
        }
    }

    renderStepTemplates() {
        const container = document.getElementById('templates-content');
        if (!container) return;

        const templates = {
            'test-suite': {
                name: 'Test Suite',
                description: 'Complete testing pipeline with linting, unit tests, and coverage',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Lint Code',
                            command: 'npm run lint',
                            agents: { queue: 'default' },
                            env: {},
                            timeout_in_minutes: 10,
                            retry: { automatic: { limit: 1 } }
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Unit Tests',
                            command: 'npm test',
                            agents: { queue: 'default' },
                            env: { NODE_ENV: 'test' },
                            timeout_in_minutes: 30,
                            artifact_paths: 'coverage/**/*',
                            retry: { automatic: { limit: 2 } }
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Integration Tests',
                            command: 'npm run test:integration',
                            agents: { queue: 'default' },
                            env: { NODE_ENV: 'test' },
                            timeout_in_minutes: 45,
                            depends_on: ['unit-tests']
                        }
                    }
                ]
            },
            'docker-build': {
                name: 'Docker Build & Push',
                description: 'Build Docker image and push to registry',
                steps: [
                    {
                        type: 'plugin',
                        properties: {
                            label: 'Docker Build & Push',
                            plugins: {
                                'docker': {
                                    image: 'my-app:${BUILDKITE_BUILD_NUMBER}',
                                    dockerfile: 'Dockerfile',
                                    push: true
                                }
                            },
                            agents: { queue: 'docker' },
                            timeout_in_minutes: 20
                        }
                    }
                ]
            },
            'deployment-pipeline': {
                name: 'Deployment Pipeline',
                description: 'Staged deployment with approvals',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy to Staging',
                            command: 'deploy.sh staging',
                            agents: { queue: 'deployment' }
                        }
                    },
                    {
                        type: 'block',
                        properties: {
                            label: 'Production Deployment Approval',
                            prompt: 'Staging tests passed. Deploy to production?',
                            fields: [
                                {
                                    key: 'reason',
                                    text: 'Deployment reason',
                                    required: true
                                }
                            ]
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy to Production',
                            command: 'deploy.sh production',
                            agents: { queue: 'deployment' },
                            branches: 'main'
                        }
                    }
                ]
            }
        };

        const templatesHTML = Object.entries(templates).map(([key, template]) => `
            <div class="template-card">
                <div class="template-header">
                    <h4>${template.name}</h4>
                    <button class="btn btn-primary btn-small" onclick="pipelineBuilder.applyTemplate('${key}')">
                        <i class="fas fa-plus"></i> Apply
                    </button>
                </div>
                <p class="template-description">${template.description}</p>
                <div class="template-steps">
                    <strong>Steps:</strong> ${template.steps.length}
                    <ul>
                        ${template.steps.map(step => `<li>${step.properties.label}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');

        container.innerHTML = templatesHTML;
    }

    applyTemplate(templateKey) {
        const templates = {
            'test-suite': [
                {
                    type: 'command',
                    properties: {
                        label: 'Lint Code',
                        command: 'npm run lint',
                        agents: { queue: 'default' },
                        env: {},
                        timeout_in_minutes: 10,
                        retry: { automatic: { limit: 1 } },
                        plugins: {},
                        artifact_paths: '',
                        branches: '',
                        if: '',
                        depends_on: [],
                        allow_dependency_failure: false,
                        soft_fail: false,
                        priority: 0,
                        skip: false,
                        concurrency: null,
                        concurrency_group: '',
                        parallelism: null,
                        matrix: null
                    }
                },
                {
                    type: 'command',
                    properties: {
                        label: 'Unit Tests',
                        command: 'npm test',
                        agents: { queue: 'default' },
                        env: { NODE_ENV: 'test' },
                        timeout_in_minutes: 30,
                        artifact_paths: 'coverage/**/*',
                        retry: { automatic: { limit: 2 } },
                        plugins: {},
                        branches: '',
                        if: '',
                        depends_on: [],
                        allow_dependency_failure: false,
                        soft_fail: false,
                        priority: 0,
                        skip: false,
                        concurrency: null,
                        concurrency_group: '',
                        parallelism: null,
                        matrix: null
                    }
                },
                {
                    type: 'command',
                    properties: {
                        label: 'Integration Tests',
                        command: 'npm run test:integration',
                        agents: { queue: 'default' },
                        env: { NODE_ENV: 'test' },
                        timeout_in_minutes: 45,
                        depends_on: ['unit-tests'],
                        retry: { automatic: { limit: 1 } },
                        plugins: {},
                        artifact_paths: '',
                        branches: '',
                        if: '',
                        allow_dependency_failure: false,
                        soft_fail: false,
                        priority: 0,
                        skip: false,
                        concurrency: null,
                        concurrency_group: '',
                        parallelism: null,
                        matrix: null
                    }
                }
            ]
        };

        const templateSteps = templates[templateKey];
        if (!templateSteps) return;

        // Add template steps to pipeline
        templateSteps.forEach(stepTemplate => {
            const step = {
                id: `step-${++this.stepCounter}`,
                type: stepTemplate.type,
                properties: { ...stepTemplate.properties }
            };
            this.steps.push(step);
        });

        // Close modal and refresh
        const modal = document.getElementById('templates-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        this.renderPipeline();
    }
}

// Initialize the pipeline builder when the page loads
document.addEventListener('DOMContentLoaded', function() {
    window.pipelineBuilder = new PipelineBuilder();
    console.log('✅ Enhanced Pipeline Builder initialized');
});