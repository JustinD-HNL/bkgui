// js/pipeline-builder.js
// Pipeline Builder Core Functionality with Enhanced Features - FIXED VERSION
class PipelineBuilder {
    constructor() {
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.pluginCatalog = this.initializePluginCatalog();
        this.stepTemplates = this.initializeStepTemplates();
        this.matrixPresets = this.initializeMatrixPresets();
        this.currentPluginFilter = 'all';
        this.currentSearchTerm = '';
        this.selectedPluginKey = null;
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
            'ecr': {
                name: 'Amazon ECR',
                description: 'Login to Amazon Elastic Container Registry',
                version: 'v2.7.0',
                category: 'deployment',
                fields: {
                    login: { type: 'boolean', label: 'Login to ECR' },
                    account_ids: { type: 'array', label: 'Account IDs' },
                    region: { type: 'text', label: 'AWS Region' }
                }
            },
            'slack': {
                name: 'Slack',
                description: 'Send notifications to Slack',
                version: 'v1.4.2',
                category: 'notifications',
                fields: {
                    channels: { type: 'array', label: 'Channels', required: true },
                    message: { type: 'text', label: 'Message' },
                    emoji: { type: 'text', label: 'Emoji' }
                }
            },
            'cache': {
                name: 'Cache',
                description: 'Cache files and directories',
                version: 'v2.5.0',
                category: 'deployment',
                fields: {
                    cache_key: { type: 'text', label: 'Cache Key', required: true },
                    paths: { type: 'array', label: 'Paths to Cache' },
                    restore_keys: { type: 'array', label: 'Restore Keys' }
                }
            }
        };
    }

    initializeStepTemplates() {
        return {
            'simple-build': {
                name: 'Simple Build',
                description: 'Basic build pipeline',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Build Application',
                        command: 'npm install && npm run build'
                    }
                }
            },
            'docker-build': {
                name: 'Docker Build',
                description: 'Build and push Docker image',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Docker Build & Push',
                        command: 'docker build -t myapp:latest .',
                        plugins: {
                            'docker': {
                                image: 'docker:latest',
                                always_pull: true
                            }
                        }
                    }
                }
            },
            'test-suite': {
                name: 'Test Suite',
                description: 'Run comprehensive tests',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Run Tests',
                        command: 'npm test',
                        artifact_paths: ['test-results/**/*', 'coverage/**/*']
                    }
                }
            }
        };
    }

    initializeMatrixPresets() {
        return {
            'node-versions': {
                name: 'Node.js Versions',
                description: 'Test across multiple Node.js versions',
                matrix: {
                    node_version: ['16', '18', '20']
                }
            },
            'os-matrix': {
                name: 'Operating Systems',
                description: 'Test across different operating systems',
                matrix: {
                    os: ['ubuntu-latest', 'windows-latest', 'macos-latest']
                }
            },
            'browser-matrix': {
                name: 'Browser Testing',
                description: 'Test across different browsers',
                matrix: {
                    browser: ['chrome', 'firefox', 'safari'],
                    version: ['latest', 'latest-1']
                }
            }
        };
    }

    setupDragAndDrop() {
        // Make step types draggable
        document.querySelectorAll('.step-type').forEach(stepType => {
            stepType.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.stepType);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        // Setup drop zone
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });

            pipelineSteps.addEventListener('drop', (e) => {
                e.preventDefault();
                const stepType = e.dataTransfer.getData('text/plain');
                if (stepType) {
                    this.addStep(stepType);
                }
            });
        }
    }

    setupEventListeners() {
        // Property form updates
        document.addEventListener('change', (e) => {
            if (e.target.closest('#step-properties')) {
                this.updateStepProperty(e.target.name, e.target.value, e.target.type);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedStep) {
                const index = this.steps.findIndex(s => s.id === this.selectedStep.id);
                if (index !== -1) {
                    this.removeStep(index);
                }
            }
            if (e.key === 'Escape') {
                this.selectedStep = null;
                this.renderProperties();
            }
        });
    }

    setupEnhancedKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.exportYAML();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.clearPipeline();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.loadExample();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.showPluginCatalog();
                        break;
                }
            }
        });
    }

    addStep(stepType) {
        const step = this.createStep(stepType);
        this.steps.push(step);
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
                timeout_in_minutes: null,
                retry: { automatic: false },
                artifact_paths: [],
                plugins: {}
            },
            wait: {
                label: 'Wait Step',
                continue_on_failure: false
            },
            block: {
                label: 'Block Step',
                prompt: 'Please confirm to continue',
                blocked_state: 'running',
                fields: []
            },
            input: {
                label: 'Input Step',
                prompt: 'Please provide input',
                fields: []
            },
            trigger: {
                label: 'Trigger Step',
                trigger: '',
                build: {
                    message: '',
                    commit: 'HEAD',
                    branch: 'main',
                    env: {}
                }
            },
            group: {
                label: 'Group Step',
                steps: []
            },
            annotation: {
                label: 'Annotation Step',
                body: '',
                style: 'info',
                context: 'default'
            },
            plugin: {
                label: 'Plugin Step',
                command: '',
                plugins: {},
                selected_plugin: ''
            }
        };

        return { ...defaults[type] } || { label: `${type} Step` };
    }

    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;

        if (this.steps.length === 0) {
            container.innerHTML = `
                <div class="empty-pipeline">
                    <i class="fas fa-plus-circle"></i>
                    <h3>No steps yet</h3>
                    <p>Drag step types from the sidebar or click "Load Example" to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        this.steps.forEach((step, index) => {
            const stepElement = this.createStepElement(step, index);
            container.appendChild(stepElement);
        });
    }

    createStepElement(step, index) {
        const stepElement = document.createElement('div');
        stepElement.className = `pipeline-step ${step.type}-step ${this.selectedStep && this.selectedStep.id === step.id ? 'selected' : ''}`;
        stepElement.dataset.stepId = step.id;

        stepElement.innerHTML = `
            <div class="step-header">
                <div class="step-info">
                    <i class="fas ${this.getStepIcon(step.type)}"></i>
                    <span class="step-label">${step.properties.label || step.type}</span>
                    <span class="step-type">${step.type}</span>
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
                return pluginCount > 0 ? 
                    `Uses ${pluginCount} plugin(s)` : 'No plugins configured';
            default:
                return step.properties.command || `${step.type} step`;
        }
    }

    getStepIcon(type) {
        const icons = {
            command: 'fa-terminal',
            wait: 'fa-clock',
            block: 'fa-hand-paper',
            input: 'fa-keyboard',
            trigger: 'fa-play',
            group: 'fa-folder',
            annotation: 'fa-comment',
            plugin: 'fa-plug'
        };
        return icons[type] || 'fa-cog';
    }

    selectStep(stepId) {
        this.selectedStep = this.steps.find(s => s.id === stepId);
        this.renderPipeline();
        this.renderProperties();
    }

    renderProperties() {
        const propertiesContainer = document.getElementById('step-properties');
        if (!propertiesContainer) return;

        if (!this.selectedStep) {
            propertiesContainer.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <h4>No step selected</h4>
                    <p>Click on a step to edit its properties</p>
                </div>
            `;
            return;
        }

        propertiesContainer.innerHTML = this.generatePropertiesForm(this.selectedStep);
    }

    generatePropertiesForm(step) {
        let form = `<div class="properties-form">`;
        form += `<h3><i class="fas ${this.getStepIcon(step.type)}"></i> ${step.type} Step Properties</h3>`;

        // Common properties
        form += this.renderPropertyGroup('Basic', [
            { name: 'label', label: 'Label', type: 'text', value: step.properties.label || '' }
        ]);

        // Type-specific properties
        switch (step.type) {
            case 'command':
                form += this.renderCommandProperties(step);
                break;
            case 'wait':
                form += this.renderWaitProperties(step);
                break;
            case 'block':
                form += this.renderBlockProperties(step);
                break;
            case 'input':
                form += this.renderInputProperties(step);
                break;
            case 'trigger':
                form += this.renderTriggerProperties(step);
                break;
            case 'group':
                form += this.renderGroupProperties(step);
                break;
            case 'annotation':
                form += this.renderAnnotationProperties(step);
                break;
            case 'plugin':
                form += this.renderPluginProperties(step);
                break;
        }

        form += `</div>`;
        return form;
    }

    renderPropertyGroup(title, properties) {
        let html = `<div class="property-section">`;
        html += `<h4><i class="fas fa-cog"></i> ${title}</h4>`;
        
        properties.forEach(prop => {
            html += `<div class="property-group">`;
            html += `<label for="${prop.name}">${prop.label}</label>`;
            
            if (prop.type === 'textarea') {
                html += `<textarea name="${prop.name}" placeholder="${prop.placeholder || ''}">${prop.value}</textarea>`;
            } else if (prop.type === 'select') {
                html += `<select name="${prop.name}">`;
                prop.options.forEach(option => {
                    const selected = option.value === prop.value ? 'selected' : '';
                    html += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                });
                html += `</select>`;
            } else if (prop.type === 'checkbox') {
                const checked = prop.value ? 'checked' : '';
                html += `<div class="property-checkbox">`;
                html += `<input type="checkbox" name="${prop.name}" ${checked}>`;
                html += `<span>${prop.label}</span>`;
                html += `</div>`;
            } else {
                html += `<input type="${prop.type || 'text'}" name="${prop.name}" value="${prop.value}" placeholder="${prop.placeholder || ''}">`;
            }
            
            if (prop.help) {
                html += `<small>${prop.help}</small>`;
            }
            html += `</div>`;
        });
        
        html += `</div>`;
        return html;
    }

    renderCommandProperties(step) {
        return this.renderPropertyGroup('Command', [
            {
                name: 'command',
                label: 'Command',
                type: 'textarea',
                value: step.properties.command || '',
                placeholder: 'echo "Hello, World!"',
                help: 'The shell command(s) to run'
            },
            {
                name: 'timeout_in_minutes',
                label: 'Timeout (minutes)',
                type: 'number',
                value: step.properties.timeout_in_minutes || '',
                placeholder: '30'
            },
            {
                name: 'artifact_paths',
                label: 'Artifact Paths',
                type: 'textarea',
                value: Array.isArray(step.properties.artifact_paths) ? 
                    step.properties.artifact_paths.join('\n') : '',
                placeholder: 'build/**/*\ntest-results/**/*',
                help: 'One path per line'
            }
        ]);
    }

    renderWaitProperties(step) {
        return this.renderPropertyGroup('Wait Options', [
            {
                name: 'continue_on_failure',
                label: 'Continue on Failure',
                type: 'checkbox',
                value: step.properties.continue_on_failure || false,
                help: 'Continue pipeline even if previous steps failed'
            }
        ]);
    }

    renderBlockProperties(step) {
        return this.renderPropertyGroup('Block Options', [
            {
                name: 'prompt',
                label: 'Prompt',
                type: 'text',
                value: step.properties.prompt || '',
                placeholder: 'Deploy to production?'
            },
            {
                name: 'blocked_state',
                label: 'Blocked State',
                type: 'select',
                value: step.properties.blocked_state || 'running',
                options: [
                    { value: 'running', label: 'Running' },
                    { value: 'passed', label: 'Passed' },
                    { value: 'failed', label: 'Failed' }
                ]
            }
        ]);
    }

    renderInputProperties(step) {
        return this.renderPropertyGroup('Input Options', [
            {
                name: 'prompt',
                label: 'Prompt',
                type: 'text',
                value: step.properties.prompt || '',
                placeholder: 'Please provide input'
            }
        ]);
    }

    renderTriggerProperties(step) {
        return this.renderPropertyGroup('Trigger Options', [
            {
                name: 'trigger',
                label: 'Pipeline',
                type: 'text',
                value: step.properties.trigger || '',
                placeholder: 'my-org/my-pipeline'
            },
            {
                name: 'build_message',
                label: 'Build Message',
                type: 'text',
                value: step.properties.build?.message || '',
                placeholder: 'Triggered from parent pipeline'
            },
            {
                name: 'build_branch',
                label: 'Branch',
                type: 'text',
                value: step.properties.build?.branch || 'main',
                placeholder: 'main'
            }
        ]);
    }

    renderGroupProperties(step) {
        return this.renderPropertyGroup('Group Options', [
            {
                name: 'group_info',
                label: 'Info',
                type: 'text',
                value: `Contains ${step.properties.steps?.length || 0} steps`,
                help: 'Group step management coming soon'
            }
        ]);
    }

    renderAnnotationProperties(step) {
        return this.renderPropertyGroup('Annotation Options', [
            {
                name: 'body',
                label: 'Annotation Body',
                type: 'textarea',
                value: step.properties.body || '',
                placeholder: 'Build completed successfully!'
            },
            {
                name: 'style',
                label: 'Style',
                type: 'select',
                value: step.properties.style || 'info',
                options: [
                    { value: 'success', label: 'Success' },
                    { value: 'info', label: 'Info' },
                    { value: 'warning', label: 'Warning' },
                    { value: 'error', label: 'Error' }
                ]
            },
            {
                name: 'context',
                label: 'Context',
                type: 'text',
                value: step.properties.context || 'default',
                placeholder: 'default'
            }
        ]);
    }

    renderPluginProperties(step) {
        let html = this.renderPropertyGroup('Plugin Configuration', [
            {
                name: 'command',
                label: 'Command',
                type: 'textarea',
                value: step.properties.command || '',
                placeholder: 'echo "Plugin step"'
            }
        ]);

        // Plugin selection
        html += `<div class="property-section">`;
        html += `<h4><i class="fas fa-plug"></i> Plugins</h4>`;
        
        // Plugin selector
        html += `<div class="property-group">`;
        html += `<label>Add Plugin</label>`;
        html += `<select name="selected_plugin">`;
        html += `<option value="">Select a plugin...</option>`;
        Object.entries(this.pluginCatalog).forEach(([key, plugin]) => {
            const selected = step.properties.selected_plugin === key ? 'selected' : '';
            html += `<option value="${key}" ${selected}>${plugin.name}</option>`;
        });
        html += `</select>`;
        html += `</div>`;

        // Current plugins
        const currentPlugins = step.properties.plugins || {};
        if (Object.keys(currentPlugins).length > 0) {
            html += `<div class="plugins-preview">`;
            html += `<h5>Current Plugins:</h5>`;
            html += `<ul>`;
            Object.entries(currentPlugins).forEach(([key, config]) => {
                const plugin = this.pluginCatalog[key];
                html += `<li><strong>${plugin ? plugin.name : key}</strong></li>`;
            });
            html += `</ul>`;
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    updateStepProperty(name, value, type) {
        if (!this.selectedStep) return;

        // Handle special cases
        if (name === 'artifact_paths') {
            this.selectedStep.properties[name] = value.split('\n').filter(path => path.trim() !== '');
        } else if (name === 'timeout_in_minutes') {
            this.selectedStep.properties[name] = value ? parseInt(value) : null;
        } else if (type === 'checkbox') {
            this.selectedStep.properties[name] = value === 'on';
        } else if (name === 'selected_plugin' && value) {
            // Add plugin to the step
            if (!this.selectedStep.properties.plugins) {
                this.selectedStep.properties.plugins = {};
            }
            this.selectedStep.properties.plugins[value] = {};
            this.selectedStep.properties.selected_plugin = '';
        } else if (name.startsWith('build_')) {
            // Handle trigger step build properties
            if (!this.selectedStep.properties.build) {
                this.selectedStep.properties.build = {};
            }
            const buildProp = name.replace('build_', '');
            this.selectedStep.properties.build[buildProp] = value;
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
        
        examplePipeline[4].properties.label = 'Deploy to Production';
        examplePipeline[4].properties.command = 'npm run deploy';

        this.steps = examplePipeline;
        this.selectedStep = null;
        this.renderPipeline();
        this.renderProperties();
    }

    exportYAML() {
        if (!window.yamlGenerator) {
            alert('YAML Generator not available');
            return;
        }

        const yamlContent = window.yamlGenerator.generateYAML(this.steps);
        
        // Show in modal
        this.showYAMLModal(yamlContent);
    }

    showYAMLModal(yamlContent) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('yaml-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'yaml-modal';
            modal.className = 'modal hidden';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-file-code"></i> Pipeline YAML</h3>
                        <button class="modal-close" onclick="pipelineBuilder.closeModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <textarea id="yaml-output" readonly></textarea>
                        <div class="yaml-actions">
                            <button class="btn btn-primary" onclick="pipelineBuilder.copyYAML()">
                                <i class="fas fa-copy"></i> Copy to Clipboard
                            </button>
                            <button class="btn btn-secondary" onclick="pipelineBuilder.downloadYAML()">
                                <i class="fas fa-download"></i> Download File
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Set content and show
        const yamlOutput = document.getElementById('yaml-output');
        yamlOutput.value = yamlContent;
        modal.classList.remove('hidden');
    }

    async copyYAML() {
        const yamlOutput = document.getElementById('yaml-output');
        if (!yamlOutput) return;

        try {
            await navigator.clipboard.writeText(yamlOutput.value);
            
            // Show feedback
            const btn = event.target.closest('button');
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

    // Plugin Catalog Methods - FIXED
    showPluginCatalog() {
        console.log('🔧 Opening plugin catalog...');
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.initializePluginCatalogModal(); // ✅ FIXED: Call the correct method
            this.renderPluginGrid();
            this.setupPluginCatalogEvents();
        } else {
            console.error('❌ Plugin catalog modal not found');
        }
    }

    initializePluginCatalogModal() {
        // Reset filter state
        this.currentPluginFilter = 'all';
        this.currentSearchTerm = '';
        this.selectedPluginKey = null;
        
        // Clear search input
        const searchInput = document.getElementById('plugin-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === 'all') {
                btn.classList.add('active');
            }
        });
        
        // Hide plugin details preview
        this.hidePluginDetails();
    }

    renderPluginGrid() {
        const grid = document.getElementById('plugin-grid');
        const emptyState = document.getElementById('plugin-empty-state');
        
        if (!grid) return;
        
        const filteredPlugins = this.getFilteredPlugins();
        
        if (filteredPlugins.length === 0) {
            grid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';
        
        grid.innerHTML = filteredPlugins.map(([key, plugin]) => this.createPluginCard(key, plugin)).join('');
        
        // Add click event listeners to plugin cards
        grid.querySelectorAll('.plugin-card').forEach(card => {
            card.addEventListener('click', () => {
                const pluginKey = card.dataset.pluginKey;
                this.showPluginDetails(pluginKey);
            });
        });
    }

    createPluginCard(key, plugin) {
        const categoryIcons = {
            docker: 'fab fa-docker',
            testing: 'fas fa-vial',
            deployment: 'fas fa-rocket',
            notifications: 'fas fa-bell'
        };
        
        const icon = categoryIcons[plugin.category] || 'fas fa-plug';
        
        return `
            <div class="plugin-card" data-plugin-key="${key}">
                <div class="plugin-card-header">
                    <div class="plugin-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="plugin-info">
                        <h5>${plugin.name}</h5>
                        <span class="plugin-version">${plugin.version}</span>
                    </div>
                </div>
                <p class="plugin-description">${plugin.description}</p>
                <div class="plugin-card-footer">
                    <span class="plugin-category-badge">${plugin.category}</span>
                    <button class="btn btn-secondary btn-small" onclick="event.stopPropagation(); window.pipelineBuilder.addPluginStepDirect('${key}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredPlugins() {
        return Object.entries(this.pluginCatalog).filter(([key, plugin]) => {
            // Filter by category
            if (this.currentPluginFilter !== 'all' && plugin.category !== this.currentPluginFilter) {
                return false;
            }
            
            // Filter by search term
            if (this.currentSearchTerm) {
                const searchLower = this.currentSearchTerm.toLowerCase();
                return plugin.name.toLowerCase().includes(searchLower) || 
                       plugin.description.toLowerCase().includes(searchLower);
            }
            
            return true;
        });
    }

    setupPluginCatalogEvents() {
        // Search input
        const searchInput = document.getElementById('plugin-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearchTerm = e.target.value;
                this.renderPluginGrid();
            });
        }
        
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                this.currentPluginFilter = btn.dataset.category;
                this.renderPluginGrid();
            });
        });
    }

    showPluginDetails(pluginKey) {
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) return;
        
        this.selectedPluginKey = pluginKey;
        
        const preview = document.getElementById('plugin-details-preview');
        if (!preview) return;
        
        // Update plugin details
        const nameEl = document.getElementById('plugin-details-name');
        const descEl = document.getElementById('plugin-details-description');
        const versionEl = document.getElementById('plugin-details-version');
        const categoryEl = document.getElementById('plugin-details-category');
        const fieldsEl = document.getElementById('plugin-details-fields');
        
        if (nameEl) nameEl.textContent = plugin.name;
        if (descEl) descEl.textContent = plugin.description;
        if (versionEl) versionEl.textContent = plugin.version;
        if (categoryEl) categoryEl.textContent = plugin.category;
        
        if (fieldsEl) {
            const fieldsHTML = Object.entries(plugin.fields || {}).map(([key, field]) => `
                <div class="plugin-field">
                    <span class="field-name">${field.label}</span>
                    <span class="field-type">${field.type}${field.required ? ' (required)' : ''}</span>
                </div>
            `).join('');
            
            fieldsEl.innerHTML = fieldsHTML || '<p>No configuration options</p>';
        }
        
        preview.style.display = 'block';
    }

    hidePluginDetails() {
        const preview = document.getElementById('plugin-details-preview');
        if (preview) {
            preview.style.display = 'none';
        }
        this.selectedPluginKey = null;
    }

    addPluginFromCatalog() {
        if (!this.selectedPluginKey) return;
        
        const plugin = this.pluginCatalog[this.selectedPluginKey];
        if (!plugin) return;
        
        this.addPluginStepDirect(this.selectedPluginKey);
        
        // Close the modal
        if (window.closeModal) {
            window.closeModal('plugin-catalog-modal');
        }
    }

    addPluginStepDirect(pluginKey) {
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

    showMatrixTemplates() {
        console.log('Showing matrix templates');
        alert('Matrix templates modal coming soon!');
    }

    showStepTemplates() {
        console.log('Showing step templates');
        alert('Step templates modal coming soon!');
    }

    openPipelineValidator() {
        console.log('Opening pipeline validator');
        alert('Pipeline validator coming soon!');
    }

    showKeyboardShortcuts() {
        console.log('Showing keyboard shortcuts');
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    addPluginStep(pluginKey) {
        this.addPluginStepDirect(pluginKey);
    }
}

// Export to global scope for initialization
window.PipelineBuilder = PipelineBuilder;