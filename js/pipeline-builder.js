// js/pipeline-builder.js
// Pipeline Builder Core Functionality with Enhanced Features
class PipelineBuilder {
    constructor() {
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.pluginCatalog = this.initializePluginCatalog();
        this.stepTemplates = this.initializeStepTemplates();
        this.matrixPresets = this.initializeMatrixPresets();
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
        this.setupEnhancedKeyboardShortcuts();
    }

    initializePluginCatalog() {
        return {
            'docker': {
                name: 'Docker',
                description: 'Run commands in Docker containers',
                version: 'v5.12.0',
                category: 'docker',
                fields: {
                    image: { type: 'text', label: 'Docker Image', required: true },
                    command: { type: 'text', label: 'Command Override' },
                    workdir: { type: 'text', label: 'Working Directory' },
                    environment: { type: 'keyvalue', label: 'Environment Variables' },
                    volumes: { type: 'array', label: 'Volume Mounts' },
                    user: { type: 'text', label: 'User ID' },
                    always_pull: { type: 'boolean', label: 'Always Pull Image' }
                }
            },
            'artifacts': {
                name: 'Artifacts',
                description: 'Upload and download build artifacts',
                version: 'v1.9.4',
                category: 'deployment',
                fields: {
                    upload: { type: 'array', label: 'Upload Patterns' },
                    download: { type: 'array', label: 'Download Patterns' },
                    compressed: { type: 'text', label: 'Compressed Archive Name' }
                }
            },
            'junit-annotate': {
                name: 'JUnit Annotate',
                description: 'Create annotations from JUnit test results',
                version: 'v2.6.0',
                category: 'testing',
                fields: {
                    artifacts: { type: 'text', label: 'JUnit XML Pattern', required: true },
                    context: { type: 'text', label: 'Annotation Context' },
                    fail_on_error: { type: 'boolean', label: 'Fail on Test Errors' }
                }
            },
            'docker-compose': {
                name: 'Docker Compose',
                description: 'Run commands with Docker Compose',
                version: 'v4.16.0',
                category: 'docker',
                fields: {
                    run: { type: 'text', label: 'Service to Run', required: true },
                    config: { type: 'text', label: 'Compose File Path' },
                    env: { type: 'keyvalue', label: 'Environment Variables' }
                }
            },
            'ecr': {
                name: 'Amazon ECR',
                description: 'Login to Amazon Elastic Container Registry',
                version: 'v2.7.0',
                category: 'deployment',
                fields: {
                    login: { type: 'boolean', label: 'Auto-login', default: true },
                    region: { type: 'text', label: 'AWS Region' },
                    registry_ids: { type: 'array', label: 'Registry IDs' }
                }
            },
            'slack': {
                name: 'Slack Notify',
                description: 'Send notifications to Slack',
                version: 'v1.4.2',
                category: 'notifications',
                fields: {
                    webhook_url: { type: 'text', label: 'Webhook URL', required: true },
                    channel: { type: 'text', label: 'Channel' },
                    message: { type: 'text', label: 'Message' }
                }
            }
        };
    }

    initializeStepTemplates() {
        return {
            'node-test': {
                name: 'Node.js Test Suite',
                description: 'Standard Node.js testing with coverage',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Node.js Tests',
                        command: 'npm ci\nnpm test',
                        artifact_paths: ['coverage/**/*', 'test-results.xml'],
                        plugins: {
                            'junit-annotate': {
                                artifacts: 'test-results.xml'
                            }
                        }
                    }
                }
            },
            'docker-build': {
                name: 'Docker Build & Push',
                description: 'Build Docker image and push to registry',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Docker Build',
                        command: 'docker build -t $IMAGE_TAG .\ndocker push $IMAGE_TAG',
                        plugins: {
                            'ecr': { login: true },
                            'docker': {
                                image: 'docker:latest',
                                always_pull: true
                            }
                        }
                    }
                }
            },
            'parallel-tests': {
                name: 'Parallel Test Matrix',
                description: 'Run tests in parallel across multiple environments',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Tests ({{matrix.env}})',
                        command: 'npm test',
                        matrix: {
                            setup: {
                                env: ['development', 'staging', 'production'],
                                node: ['16', '18', '20']
                            }
                        }
                    }
                }
            },
            'node-lint': {
                name: 'Linting & Code Quality',
                description: 'ESLint, Prettier, and TypeScript checking',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Code Quality',
                        command: 'npm run lint\nnpm run prettier:check\nnpm run type-check'
                    }
                }
            },
            'k8s-deploy': {
                name: 'Kubernetes Deployment',
                description: 'Deploy to Kubernetes with health checks',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Deploy to Kubernetes',
                        command: 'kubectl apply -f k8s/\nkubectl rollout status deployment/myapp',
                        timeout_in_minutes: 15
                    }
                }
            }
        };
    }

    initializeMatrixPresets() {
        return {
            'node_versions': {
                name: 'Node.js Versions',
                matrix: { node: ['16', '18', '20', '21'] }
            },
            'os_matrix': {
                name: 'Operating Systems',
                matrix: { os: ['ubuntu', 'windows', 'macos'] }
            },
            'browser_matrix': {
                name: 'Browser Testing',
                matrix: { browser: ['chrome', 'firefox', 'safari', 'edge'] }
            },
            'environments': {
                name: 'Deployment Environments',
                matrix: { env: ['development', 'staging', 'production'] }
            }
        };
    }

    setupDragAndDrop() {
        // Make step types draggable
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
        });

        // Setup drop zones
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.addEventListener('dragover', this.handleDragOver.bind(this));
            pipelineSteps.addEventListener('drop', this.handleDrop.bind(this));
            pipelineSteps.addEventListener('dragleave', this.handleDragLeave.bind(this));
        }
    }

    setupEventListeners() {
        // Header actions
        const clearBtn = document.getElementById('clear-pipeline');
        const loadBtn = document.getElementById('load-example');
        const exportBtn = document.getElementById('export-yaml');
        
        if (clearBtn) clearBtn.addEventListener('click', this.clearPipeline.bind(this));
        if (loadBtn) loadBtn.addEventListener('click', this.loadExample.bind(this));
        if (exportBtn) exportBtn.addEventListener('click', this.exportYAML.bind(this));

        // Modal events for YAML export
        const yamlModalClose = document.querySelector('#yaml-modal .modal-close');
        if (yamlModalClose) {
            yamlModalClose.addEventListener('click', this.closeModal.bind(this));
        }
        
        const copyYamlBtn = document.getElementById('copy-yaml');
        if (copyYamlBtn) {
            copyYamlBtn.addEventListener('click', this.copyYAML.bind(this));
        }
        
        const downloadYamlBtn = document.getElementById('download-yaml');
        if (downloadYamlBtn) {
            downloadYamlBtn.addEventListener('click', this.downloadYAML.bind(this));
        }

        // Click outside modal to close
        const yamlModal = document.getElementById('yaml-modal');
        if (yamlModal) {
            yamlModal.addEventListener('click', (e) => {
                if (e.target.id === 'yaml-modal') {
                    this.closeModal();
                }
            });
        }
    }

    setupEnhancedKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Existing shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.exportYAML();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.clearPipeline();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.loadExample();
            }
            
            // New enhanced shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.showPluginCatalog();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.showMatrixTemplates();
            }
            
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.showStepTemplates();
            }
            
            if (e.key === 'Delete' && this.selectedStep) {
                const stepIndex = this.steps.findIndex(
                    step => step.id === this.selectedStep.id
                );
                if (stepIndex !== -1) {
                    this.removeStep(stepIndex);
                }
            }
            
            if (e.key === 'Escape') {
                this.selectedStep = null;
                this.renderProperties();
                document.querySelectorAll('.pipeline-step').forEach(el => {
                    el.classList.remove('selected');
                });
            }
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.stepType);
        e.dataTransfer.effectAllowed = 'copy';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const dropZone = e.target.closest('.drop-zone');
        if (dropZone) {
            dropZone.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const dropZone = e.target.closest('.drop-zone');
        if (dropZone && !dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        const dropZone = e.target.closest('.drop-zone');
        if (!dropZone) return;

        dropZone.classList.remove('drag-over');
        
        const stepType = e.dataTransfer.getData('text/plain');
        const dropIndex = parseInt(dropZone.dataset.dropIndex);
        
        this.addStep(stepType, dropIndex);
    }

    addStep(stepType, index) {
        const step = this.createStep(stepType);
        this.steps.splice(index, 0, step);
        this.renderPipeline();
        this.selectStep(step.id);
    }

    createStep(stepType) {
        const stepId = `step-${++this.stepCounter}`;
        const stepConfigs = {
            command: {
                type: 'command',
                label: 'Command Step',
                icon: 'fas fa-terminal',
                properties: {
                    label: `Command Step ${this.stepCounter}`,
                    command: '',
                    agents: '',
                    env: {},
                    timeout_in_minutes: 10,
                    retry: false,
                    soft_fail: false,
                    artifact_paths: [],
                    plugins: {}
                }
            },
            wait: {
                type: 'wait',
                label: 'Wait Step',
                icon: 'fas fa-hourglass-half',
                properties: {
                    label: `Wait Step ${this.stepCounter}`,
                    continue_on_failure: false
                }
            },
            block: {
                type: 'block',
                label: 'Block Step',
                icon: 'fas fa-hand-paper',
                properties: {
                    label: `Block Step ${this.stepCounter}`,
                    prompt: '',
                    blocked_state: 'running'
                }
            },
            input: {
                type: 'input',
                label: 'Input Step',
                icon: 'fas fa-keyboard',
                properties: {
                    label: `Input Step ${this.stepCounter}`,
                    prompt: '',
                    fields: []
                }
            },
            trigger: {
                type: 'trigger',
                label: 'Trigger Step',
                icon: 'fas fa-play',
                properties: {
                    label: `Trigger Step ${this.stepCounter}`,
                    trigger: '',
                    build: {},
                    async: false
                }
            },
            group: {
                type: 'group',
                label: 'Group Step',
                icon: 'fas fa-layer-group',
                properties: {
                    label: `Group Step ${this.stepCounter}`,
                    steps: []
                }
            },
            // Enhanced step types
            annotation: {
                type: 'annotation',
                label: 'Annotation Step',
                icon: 'fas fa-comment',
                properties: {
                    label: `Annotation Step ${this.stepCounter}`,
                    context: 'default',
                    style: 'info',
                    body: 'Your **markdown** content here',
                    priority: 0
                }
            },
            plugin: {
                type: 'plugin',
                label: 'Plugin Step',
                icon: 'fas fa-plug',
                properties: {
                    label: `Plugin Step ${this.stepCounter}`,
                    command: '',
                    plugins: {},
                    selected_plugin: ''
                }
            },
            notify: {
                type: 'notify',
                label: 'Notify Step',
                icon: 'fas fa-bell',
                properties: {
                    label: `Notify Step ${this.stepCounter}`,
                    command: '',
                    notify: {
                        slack: {
                            webhook_url: '',
                            channel: '#builds',
                            message: 'Build completed!'
                        }
                    }
                }
            },
            'pipeline-upload': {
                type: 'pipeline-upload',
                label: 'Pipeline Upload',
                icon: 'fas fa-upload',
                properties: {
                    label: `Pipeline Upload ${this.stepCounter}`,
                    command: 'buildkite-agent pipeline upload',
                    pipeline_file: '.buildkite/pipeline.yml',
                    dynamic_script: ''
                }
            }
        };

        return {
            id: stepId,
            ...stepConfigs[stepType]
        };
    }

    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;
        
        container.innerHTML = '';

        // Add initial drop zone
        container.appendChild(this.createDropZone(0));

        this.steps.forEach((step, index) => {
            container.appendChild(this.createStepElement(step, index));
            container.appendChild(this.createDropZone(index + 1));
        });

        // If no steps, show empty state
        if (this.steps.length === 0) {
            const emptyState = container.querySelector('.drop-zone');
            if (emptyState) {
                emptyState.innerHTML = `
                    <i class="fas fa-plus-circle"></i>
                    <span>Drop steps here to start building your pipeline</span>
                `;
            }
        }
    }

    createDropZone(index) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.dataset.dropIndex = index;
        
        if (this.steps.length > 0) {
            dropZone.innerHTML = `<i class="fas fa-plus"></i>`;
            dropZone.style.minHeight = '40px';
        }
        
        return dropZone;
    }

    createStepElement(step, index) {
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
                    <button class="step-action" onclick="pipelineBuilder.moveStepUp(${index})" title="Move Up" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="step-action" onclick="pipelineBuilder.moveStepDown(${index})" title="Move Down" ${index === this.steps.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="step-action" onclick="pipelineBuilder.duplicateStep(${index})" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="step-action" onclick="pipelineBuilder.removeStep(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="step-content">
                ${this.getStepDescription(step)}
            </div>
        `;

        stepElement.addEventListener('click', () => this.selectStep(step.id));
        
        return stepElement;
    }

    getStepDescription(step) {
        switch (step.type) {
            case 'command':
                return step.properties.command || 'No command specified';
            case 'wait':
                return 'Waits for all previous steps to complete';
            case 'block':
                return step.properties.prompt || 'Manual intervention required';
            case 'input':
                return step.properties.prompt || 'Collects user input';
            case 'trigger':
                return step.properties.trigger || 'No pipeline specified';
            case 'group':
                return `Contains ${step.properties.steps.length} step(s)`;
            case 'annotation':
                return step.properties.body || 'Build annotation';
            case 'plugin':
                const pluginCount = Object.keys(step.properties.plugins).length;
                return pluginCount > 0 ? `Uses ${pluginCount} plugin(s)` : 'No plugins configured';
            case 'notify':
                return 'Sends notifications';
            case 'pipeline-upload':
                return 'Uploads dynamic pipeline';
            default:
                return 'Step configuration';
        }
    }

    selectStep(stepId) {
        // Remove previous selection
        document.querySelectorAll('.pipeline-step').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current step
        const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
        if (stepElement) {
            stepElement.classList.add('selected');
        }

        // Update properties panel
        this.selectedStep = this.steps.find(step => step.id === stepId);
        this.renderProperties();
    }

    renderProperties() {
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

        propertiesContainer.innerHTML = this.generatePropertiesForm(this.selectedStep);
        this.bindPropertyEvents();
    }

    generatePropertiesForm(step) {
        const forms = {
            command: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Command</label>
                    <textarea name="command" placeholder="echo 'Hello World'">${step.properties.command}</textarea>
                </div>
                <div class="property-group">
                    <label>Agent Query</label>
                    <input type="text" name="agents" value="${step.properties.agents}" placeholder="queue=default" />
                </div>
                <div class="property-group">
                    <label>Timeout (minutes)</label>
                    <input type="number" name="timeout_in_minutes" value="${step.properties.timeout_in_minutes}" min="1" />
                </div>
                <div class="property-group">
                    <label>Artifact Paths (one per line)</label>
                    <textarea name="artifact_paths" placeholder="logs/**/*&#10;coverage/**/*">${(step.properties.artifact_paths || []).join('\n')}</textarea>
                    <small>File patterns to upload as artifacts</small>
                </div>
                <div class="property-group">
                    <div class="property-checkbox">
                        <input type="checkbox" name="retry" ${step.properties.retry ? 'checked' : ''} />
                        <label>Retry on failure</label>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" name="soft_fail" ${step.properties.soft_fail ? 'checked' : ''} />
                        <label>Soft fail</label>
                    </div>
                </div>
                <div class="property-group">
                    <label>Environment Variables (JSON)</label>
                    <textarea name="env" placeholder='{"NODE_ENV": "test"}'>${JSON.stringify(step.properties.env || {}, null, 2)}</textarea>
                </div>
                <div class="property-group">
                    <label>Plugins (JSON)</label>
                    <textarea name="plugins" placeholder='{"docker": {"image": "node:18"}}'>${JSON.stringify(step.properties.plugins || {}, null, 2)}</textarea>
                </div>
            `,
            wait: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <div class="property-checkbox">
                        <input type="checkbox" name="continue_on_failure" ${step.properties.continue_on_failure ? 'checked' : ''} />
                        <label>Continue on failure</label>
                    </div>
                </div>
            `,
            block: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Prompt</label>
                    <input type="text" name="prompt" value="${step.properties.prompt}" placeholder="Please review and approve" />
                </div>
                <div class="property-group">
                    <label>Blocked State</label>
                    <select name="blocked_state">
                        <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                        <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                        <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </div>
            `,
            input: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Prompt</label>
                    <input type="text" name="prompt" value="${step.properties.prompt}" placeholder="Please provide input" />
                </div>
                <div class="property-group">
                    <label>Fields (JSON)</label>
                    <textarea name="fields" placeholder='[{"key": "deployment_env", "text": "Environment", "required": true}]'>${JSON.stringify(step.properties.fields, null, 2)}</textarea>
                </div>
            `,
            trigger: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Pipeline</label>
                    <input type="text" name="trigger" value="${step.properties.trigger}" placeholder="my-org/my-pipeline" />
                </div>
                <div class="property-group">
                    <label>Build Config (JSON)</label>
                    <textarea name="build" placeholder='{"branch": "main", "env": {}}'>${JSON.stringify(step.properties.build, null, 2)}</textarea>
                </div>
                <div class="property-group">
                    <div class="property-checkbox">
                        <input type="checkbox" name="async" ${step.properties.async ? 'checked' : ''} />
                        <label>Async trigger</label>
                    </div>
                </div>
            `,
            group: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Steps (JSON)</label>
                    <textarea name="steps" placeholder='[{"command": "echo \'step 1\'"}, {"command": "echo \'step 2\'"}]'>${JSON.stringify(step.properties.steps, null, 2)}</textarea>
                </div>
            `,
            annotation: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Context</label>
                    <input type="text" name="context" value="${step.properties.context}" placeholder="default" />
                </div>
                <div class="property-group">
                    <label>Style</label>
                    <select name="style">
                        <option value="info" ${step.properties.style === 'info' ? 'selected' : ''}>Info</option>
                        <option value="success" ${step.properties.style === 'success' ? 'selected' : ''}>Success</option>
                        <option value="warning" ${step.properties.style === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="error" ${step.properties.style === 'error' ? 'selected' : ''}>Error</option>
                    </select>
                </div>
                <div class="property-group">
                    <label>Content (Markdown)</label>
                    <textarea name="body" rows="6">${step.properties.body}</textarea>
                </div>
            `,
            plugin: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Command</label>
                    <textarea name="command">${step.properties.command}</textarea>
                </div>
                <div class="property-group">
                    <label>Plugins (JSON)</label>
                    <textarea name="plugins" placeholder='{"docker": {"image": "node:18"}}'>${JSON.stringify(step.properties.plugins, null, 2)}</textarea>
                </div>
            `,
            notify: `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Notification Config (JSON)</label>
                    <textarea name="notify" placeholder='{"slack": {"webhook_url": "", "channel": "#builds"}}'>${JSON.stringify(step.properties.notify, null, 2)}</textarea>
                </div>
            `,
            'pipeline-upload': `
                <div class="property-group">
                    <label>Step Label</label>
                    <input type="text" name="label" value="${step.properties.label}" />
                </div>
                <div class="property-group">
                    <label>Pipeline File</label>
                    <input type="text" name="pipeline_file" value="${step.properties.pipeline_file}" placeholder=".buildkite/pipeline.yml" />
                </div>
                <div class="property-group">
                    <label>Dynamic Script</label>
                    <input type="text" name="dynamic_script" value="${step.properties.dynamic_script}" placeholder="./scripts/generate-pipeline.sh" />
                </div>
            `
        };

        return forms[step.type] || '<p>No properties available for this step type.</p>';
    }

    bindPropertyEvents() {
        const inputs = document.querySelectorAll('#step-properties input, #step-properties textarea, #step-properties select');
        inputs.forEach(input => {
            input.addEventListener('input', this.updateStepProperty.bind(this));
            input.addEventListener('change', this.updateStepProperty.bind(this));
        });
    }

    updateStepProperty(e) {
        if (!this.selectedStep) return;

        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            this.selectedStep.properties[name] = checked;
        } else if (['fields', 'build', 'steps', 'env', 'plugins', 'notify'].includes(name)) {
            try {
                this.selectedStep.properties[name] = JSON.parse(value || (name === 'env' || name === 'plugins' || name === 'notify' ? '{}' : '[]'));
            } catch (error) {
                console.warn('Invalid JSON:', error);
            }
        } else if (name === 'artifact_paths') {
            this.selectedStep.properties[name] = value.split('\n').filter(path => path.trim() !== '');
        } else if (type === 'number') {
            this.selectedStep.properties[name] = parseInt(value) || 0;
        } else {
            this.selectedStep.properties[name] = value;
        }

        // Re-render pipeline to reflect changes
        this.renderPipeline();
        this.selectStep(this.selectedStep.id);
    }

    moveStepUp(index) {
        if (index > 0) {
            [this.steps[index - 1], this.steps[index]] = [this.steps[index], this.steps[index - 1]];
            this.renderPipeline();
            this.selectStep(this.selectedStep?.id);
        }
    }

    moveStepDown(index) {
        if (index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.renderPipeline();
            this.selectStep(this.selectedStep?.id);
        }
    }

    duplicateStep(index) {
        const step = this.steps[index];
        const duplicatedStep = JSON.parse(JSON.stringify(step));
        duplicatedStep.id = `step-${++this.stepCounter}`;
        duplicatedStep.properties.label = `${duplicatedStep.properties.label} (Copy)`;
        
        this.steps.splice(index + 1, 0, duplicatedStep);
        this.renderPipeline();
        this.selectStep(duplicatedStep.id);
    }

    removeStep(index) {
        const removedStep = this.steps[index];
        this.steps.splice(index, 1);
        
        if (this.selectedStep && this.selectedStep.id === removedStep.id) {
            this.selectedStep = null;
        }
        
        this.renderPipeline();
        this.renderProperties();
    }

    clearPipeline() {
        if (this.steps.length > 0 && !confirm('Are you sure you want to clear the entire pipeline?')) {
            return;
        }
        
        this.steps = [];
        this.selectedStep = null;
        this.renderPipeline();
        this.renderProperties();
    }

    loadExample() {
        const examplePipeline = [
            this.createStep('command'),
            this.createStep('wait'),
            this.createStep('command'),
            this.createStep('block'),
            this.createStep('command')
        ];

        // Configure example steps
        examplePipeline[0].properties.label = 'Install Dependencies';
        examplePipeline[0].properties.command = 'npm install';
        
        examplePipeline[2].properties.label = 'Run Tests';
        examplePipeline[2].properties.command = 'npm test';
        
        examplePipeline[3].properties.label = 'Deploy Approval';
        examplePipeline[3].properties.prompt = 'Ready to deploy to production?';
        
        examplePipeline[4].properties.label = 'Deploy';
        examplePipeline[4].properties.command = 'npm run deploy';

        this.steps = examplePipeline;
        this.selectedStep = null;
        this.renderPipeline();
        this.renderProperties();
    }

    exportYAML() {
        const yamlContent = window.yamlGenerator.generateYAML(this.steps);
        const yamlOutput = document.getElementById('yaml-output');
        if (yamlOutput) {
            yamlOutput.value = yamlContent;
        }
        const yamlModal = document.getElementById('yaml-modal');
        if (yamlModal) {
            yamlModal.classList.remove('hidden');
        }
    }

    copyYAML() {
        const yamlOutput = document.getElementById('yaml-output');
        if (!yamlOutput) return;
        
        yamlOutput.select();
        yamlOutput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            const btn = document.getElementById('copy-yaml');
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    downloadYAML() {
        const yamlOutput = document.getElementById('yaml-output');
        if (!yamlOutput) return;
        
        const yamlContent = yamlOutput.value;
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'buildkite-pipeline.yml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    closeModal() {
        const yamlModal = document.getElementById('yaml-modal');
        if (yamlModal) {
            yamlModal.classList.add('hidden');
        }
    }

    // Enhanced methods for new features
    addTemplate(templateKey) {
        console.log('Adding template:', templateKey);
        const template = this.stepTemplates[templateKey];
        if (!template) {
            console.warn('Template not found:', templateKey);
            return;
        }

        const step = {
            id: `step-${++this.stepCounter}`,
            ...template.template
        };

        this.steps.push(step);
        this.renderPipeline();
        this.selectStep(step.id);
        
        console.log('Applied template:', template.name);
    }

    addPattern(patternKey) {
        console.log('Adding pattern:', patternKey);
        // This integrates with pipeline patterns if they're available
        if (window.pipelinePatterns) {
            window.pipelinePatterns.applyPattern(patternKey);
        } else {
            console.warn('Pipeline patterns not available');
        }
    }

    showPluginCatalog() {
        console.log('Showing plugin catalog');
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            alert('Plugin catalog coming soon!');
        }
    }

    showMatrixTemplates() {
        console.log('Showing matrix templates');
        const modal = document.getElementById('matrix-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            alert('Matrix builder coming soon!');
        }
    }

    showStepTemplates() {
        console.log('Showing step templates');
        const modal = document.getElementById('step-templates-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            alert('Step templates modal coming soon!');
        }
    }

    openPipelineValidator() {
        console.log('Opening pipeline validator');
        const modal = document.getElementById('pipeline-validator-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            alert('Pipeline validator coming soon!');
        }
    }

    showKeyboardShortcuts() {
        console.log('Showing keyboard shortcuts');
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    addPluginStep(pluginKey) {
        console.log('Adding plugin step:', pluginKey);
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) {
            console.warn('Plugin not found:', pluginKey);
            return;
        }

        const step = this.createStep('command');
        step.properties.label = `${plugin.name} Step`;
        step.properties.plugins = {
            [pluginKey]: {}
        };

        this.steps.push(step);
        this.renderPipeline();
        this.selectStep(step.id);
        
        console.log('Added plugin step:', plugin.name);
    }
}

// DO NOT initialize here - wait for main initialization script