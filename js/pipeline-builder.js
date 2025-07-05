// js/pipeline-builder.js
/**
 * Pipeline Builder Class - Core functionality for building Buildkite pipelines
 * FIXED: Prevents duplicate step creation on drag and drop
 */

class PipelineBuilder {
    constructor() {
        // Pipeline state
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        
        // Drag and drop state
        this.draggedElement = null;
        this.dropHandled = false; // FIXED: Add flag to prevent duplicate drops
        
        // Plugin catalog
        this.pluginCatalog = {
            'docker-compose': {
                name: 'Docker Compose',
                icon: 'fa-docker',
                description: 'Run commands using Docker Compose',
                config: {
                    'run': { type: 'string', default: 'app', required: true, description: 'Service to run' },
                    'config': { type: 'string', default: 'docker-compose.yml', description: 'Config file path' },
                    'shell': { type: 'boolean', default: true, description: 'Run with shell' }
                }
            },
            'aws-s3': {
                name: 'AWS S3',
                icon: 'fa-aws',
                description: 'Upload and download artifacts from S3',
                config: {
                    'bucket': { type: 'string', required: true, description: 'S3 bucket name' },
                    'key': { type: 'string', required: true, description: 'S3 object key' },
                    'region': { type: 'string', default: 'us-east-1', description: 'AWS region' }
                }
            },
            'artifacts': {
                name: 'Artifacts',
                icon: 'fa-file-archive',
                description: 'Upload and download build artifacts',
                config: {
                    'upload': { type: 'string', description: 'Paths to upload' },
                    'download': { type: 'string', description: 'Paths to download' },
                    'compress': { type: 'boolean', default: false, description: 'Compress artifacts' }
                }
            },
            'ecr': {
                name: 'ECR',
                icon: 'fa-aws',
                description: 'Login to AWS ECR',
                config: {
                    'login': { type: 'boolean', default: true, description: 'Perform ECR login' },
                    'account_ids': { type: 'array', description: 'AWS account IDs' },
                    'region': { type: 'string', default: 'us-east-1', description: 'AWS region' }
                }
            },
            'github-commit-status': {
                name: 'GitHub Status',
                icon: 'fa-github',
                description: 'Update GitHub commit status',
                config: {
                    'context': { type: 'string', default: 'continuous-integration/buildkite', description: 'Status context' }
                }
            },
            'slack': {
                name: 'Slack',
                icon: 'fa-slack',
                description: 'Send notifications to Slack',
                config: {
                    'channels': { type: 'array', required: true, description: 'Slack channels' },
                    'message': { type: 'string', description: 'Custom message' },
                    'webhook_url': { type: 'string', description: 'Webhook URL' }
                }
            },
            'docker': {
                name: 'Docker',
                icon: 'fa-docker',
                description: 'Build and push Docker images',
                config: {
                    'image': { type: 'string', required: true, description: 'Image name' },
                    'tag': { type: 'string', default: '$BUILDKITE_BUILD_NUMBER', description: 'Image tag' },
                    'push': { type: 'boolean', default: true, description: 'Push to registry' }
                }
            },
            'junit': {
                name: 'JUnit',
                icon: 'fa-check-circle',
                description: 'Upload JUnit test results',
                config: {
                    'artifacts': { type: 'string', required: true, description: 'Path to test results' },
                    'format': { type: 'string', default: 'junit', description: 'Result format' }
                }
            }
        };
        
        // Notification handlers
        this.notificationHandlers = {
            email: {
                name: 'Email',
                icon: 'fa-envelope',
                fields: ['email']
            },
            slack: {
                name: 'Slack',
                icon: 'fa-slack',
                fields: ['channels', 'message']
            },
            webhook: {
                name: 'Webhook',
                icon: 'fa-globe',
                fields: ['url', 'headers']
            },
            pagerduty: {
                name: 'PagerDuty',
                icon: 'fa-exclamation-triangle',
                fields: ['service_key', 'severity']
            }
        };
        
        // Initialize
        this.init();
    }

    init() {
        console.log('📋 Starting Pipeline Builder initialization...');
        
        // Setup drag and drop
        this.setupEnhancedDragAndDrop();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial render
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        
        console.log('✅ Complete Pipeline Builder initialized successfully');
    }

    // FIXED: Add step movement functionality
    moveStepUp(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index > 0) {
            // Swap with previous step
            [this.steps[index - 1], this.steps[index]] = [this.steps[index], this.steps[index - 1]];
            this.renderPipeline();
            this.renderProperties();
            console.log(`⬆️ Moved step ${stepId} up`);
        }
    }

    moveStepDown(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index >= 0 && index < this.steps.length - 1) {
            // Swap with next step
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.renderPipeline();
            this.renderProperties();
            console.log(`⬇️ Moved step ${stepId} down`);
        }
    }

    // Enhanced drag and drop functionality
    setupEnhancedDragAndDrop() {
        console.log('🎯 Setting up enhanced drag and drop...');
        
        // Make step types draggable
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
            stepType.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Make template and pattern items draggable
        const templateItems = document.querySelectorAll('.template-item, .pattern-item');
        templateItems.forEach(item => {
            item.addEventListener('click', this.handleTemplateClick.bind(this));
        });

        // Setup drop zones for pipeline container
        this.setupPipelineDropZones();
        
        console.log('✅ Enhanced drag and drop configured');
    }

    setupPipelineDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) return;

        // Clear existing listeners
        pipelineSteps.removeEventListener('dragover', this.handleDragOver);
        pipelineSteps.removeEventListener('drop', this.handleDrop);
        pipelineSteps.removeEventListener('dragleave', this.handleDragLeave);

        // Add new listeners
        pipelineSteps.addEventListener('dragover', this.handleDragOver.bind(this));
        pipelineSteps.addEventListener('drop', this.handleDrop.bind(this));
        pipelineSteps.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }

    handleDragStart(e) {
        const stepType = e.target.closest('.step-type');
        if (!stepType) return;

        this.draggedElement = {
            type: 'step',
            stepType: stepType.dataset.stepType,
            element: stepType
        };
        
        this.dropHandled = false; // FIXED: Reset flag on new drag

        stepType.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', stepType.dataset.stepType);

        // Show drop zones
        this.showDropZones();
    }

    handleDragEnd(e) {
        const stepType = e.target.closest('.step-type');
        if (stepType) {
            stepType.classList.remove('dragging');
        }
        
        this.hideDropZones();
        this.draggedElement = null;
        this.dropHandled = false; // FIXED: Reset flag
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.add('drag-over');
        }

        // Calculate drop position
        const afterElement = this.getDragAfterElement(pipelineSteps, e.clientY);
        const indicator = this.getOrCreateDropIndicator();
        
        if (afterElement == null) {
            pipelineSteps.appendChild(indicator);
        } else {
            pipelineSteps.insertBefore(indicator, afterElement);
        }
    }

    handleDragLeave(e) {
        // Only remove styles if we're leaving the container
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (e.target === pipelineSteps && !pipelineSteps.contains(e.relatedTarget)) {
            pipelineSteps.classList.remove('drag-over');
            this.removeDropIndicator();
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation(); // FIXED: Stop event propagation
        
        // FIXED: Check if drop was already handled
        if (this.dropHandled) {
            console.log('⚠️ Drop already handled, skipping');
            return;
        }
        
        this.dropHandled = true; // FIXED: Mark as handled
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        pipelineSteps.classList.remove('drag-over');
        
        const stepType = e.dataTransfer.getData('text/plain');
        
        if (stepType && this.draggedElement) {
            // Calculate insert position
            const afterElement = this.getDragAfterElement(pipelineSteps, e.clientY);
            let insertIndex = this.steps.length;
            
            if (afterElement && afterElement.dataset.stepId) {
                const afterStep = this.steps.find(s => s.id === afterElement.dataset.stepId);
                if (afterStep) {
                    insertIndex = this.steps.indexOf(afterStep);
                }
            }
            
            // Add the step at the calculated position - ONLY ONCE
            console.log(`📍 Adding single step at index ${insertIndex}`);
            this.addStep(stepType, insertIndex);
        }
        
        this.removeDropIndicator();
        this.hideDropZones();
        
        // FIXED: Reset flag after a delay to handle any lingering events
        setTimeout(() => {
            this.dropHandled = false;
        }, 100);
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

    getOrCreateDropIndicator() {
        let indicator = document.querySelector('.drag-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'drag-indicator';
            indicator.innerHTML = '<div class="drag-line"></div>';
        }
        return indicator;
    }

    removeDropIndicator() {
        const indicator = document.querySelector('.drag-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.add('show-drop-zones');
        }
    }

    hideDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('show-drop-zones');
        }
    }

    handleTemplateClick(e) {
        const template = e.currentTarget;
        const templateType = template.dataset.template;
        
        if (templateType) {
            console.log(`📋 Loading template: ${templateType}`);
            this.loadTemplate(templateType);
        }
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Global window reference for inline handlers
        window.pipelineBuilder = this;
        
        // Add step button handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-step"]')) {
                const stepType = e.target.closest('[data-action="add-step"]').dataset.stepType;
                this.addStep(stepType);
            }
        });
        
        console.log('✅ Event listeners configured');
    }

    // Step management
    addStep(stepType, index = -1) {
        if (!stepType) {
            console.warn('⚠️ No step type provided');
            return;
        }
        
        console.log(`➕ Adding step: ${stepType} at index: ${index}`);
        
        const step = this.createStep(stepType);
        
        if (index >= 0 && index <= this.steps.length) {
            this.steps.splice(index, 0, step);
        } else {
            this.steps.push(step);
        }
        
        this.stepCounter++;
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        
        console.log(`✅ Added ${stepType} step with ID: ${step.id}`);
        return step;
    }

    addStepAtIndex(stepType, index) {
        this.addStep(stepType, index);
    }

    addPluginStep(pluginKey) {
        console.log(`🔌 Adding plugin step: ${pluginKey}`);
        
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) {
            console.warn(`⚠️ Plugin not found: ${pluginKey}`);
            return;
        }
        
        const step = this.createStep('command');
        step.properties.label = `${plugin.name} Step`;
        step.properties.plugins = { [pluginKey]: {} };
        
        if (plugin.config) {
            step.properties.plugins[pluginKey] = {};
            Object.entries(plugin.config).forEach(([key, config]) => {
                step.properties.plugins[pluginKey][key] = config.default || '';
            });
        }
        
        this.steps.push(step);
        this.stepCounter++;
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        
        console.log(`✅ Added plugin step: ${pluginKey}`);
    }

    addPluginStepAtIndex(pluginKey, index) {
        console.log(`🔌 Adding plugin step: ${pluginKey} at index: ${index}`);
        
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) {
            console.warn(`⚠️ Plugin not found: ${pluginKey}`);
            return;
        }
        
        const step = this.createStep('command');
        step.properties.label = `${plugin.name} Step`;
        step.properties.plugins = { [pluginKey]: {} };
        
        if (plugin.config) {
            step.properties.plugins[pluginKey] = {};
            Object.entries(plugin.config).forEach(([key, config]) => {
                step.properties.plugins[pluginKey][key] = config.default || '';
            });
        }
        
        if (index >= 0 && index <= this.steps.length) {
            this.steps.splice(index, 0, step);
        } else {
            this.steps.push(step);
        }
        
        this.stepCounter++;
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        
        console.log(`✅ Added plugin step: ${pluginKey} at index ${index}`);
    }

    createStep(type) {
        const baseStep = {
            id: `step-${this.stepCounter}`,
            type: type,
            properties: {
                label: this.getDefaultLabel(type)
            }
        };

        // Type-specific defaults
        switch (type) {
            case 'command':
                Object.assign(baseStep.properties, {
                    command: '',
                    key: `${type}-${this.stepCounter}`,
                    agents: {},
                    env: {},
                    plugins: {},
                    timeout_in_minutes: null,
                    retry: null,
                    parallelism: null,
                    soft_fail: false,
                    skip: false
                });
                break;
                
            case 'wait':
                Object.assign(baseStep.properties, {
                    continue_on_failure: false,
                    if: null
                });
                break;
                
            case 'block':
                Object.assign(baseStep.properties, {
                    prompt: 'Continue deployment?',
                    fields: [],
                    blocked_state: 'passed',
                    key: `block-${this.stepCounter}`
                });
                break;
                
            case 'input':
                Object.assign(baseStep.properties, {
                    prompt: 'Please provide input',
                    fields: [],
                    key: `input-${this.stepCounter}`
                });
                break;
                
            case 'trigger':
                Object.assign(baseStep.properties, {
                    trigger: '',
                    build: {},
                    async: false,
                    branches: null,
                    skip: false
                });
                break;
                
            case 'group':
                Object.assign(baseStep.properties, {
                    group: 'Group Name',
                    key: `group-${this.stepCounter}`,
                    steps: [],
                    depends_on: null,
                    allow_dependency_failure: false
                });
                break;
                
            case 'annotation':
                Object.assign(baseStep.properties, {
                    body: '',
                    style: 'info',
                    context: 'default',
                    append: false
                });
                break;
                
            case 'notify':
                Object.assign(baseStep.properties, {
                    email: '',
                    slack: '',
                    webhook: '',
                    pagerduty: '',
                    if: null
                });
                break;
                
            case 'plugin':
                Object.assign(baseStep.properties, {
                    plugins: {},
                    if: null,
                    key: `plugin-${this.stepCounter}`
                });
                break;
                
            case 'pipeline-upload':
                Object.assign(baseStep.properties, {
                    pipeline: '.buildkite/pipeline.yml',
                    replace: false,
                    if: null
                });
                break;
        }

        return baseStep;
    }

    getDefaultLabel(type) {
        const labels = {
            'command': 'Run Commands',
            'wait': 'Wait for all previous steps',
            'block': 'Manual Approval',
            'input': 'User Input',
            'trigger': 'Trigger Pipeline',
            'group': 'Step Group',
            'annotation': 'Build Annotation',
            'notify': 'Send Notification',
            'plugin': 'Plugin Step',
            'pipeline-upload': 'Upload Pipeline'
        };
        
        return labels[type] || 'Pipeline Step';
    }

    // Proper pipeline rendering with step actions
    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
        if (!container) {
            console.warn('⚠️ Pipeline steps container not found');
            return;
        }

        container.innerHTML = '';

        if (this.steps.length === 0) {
            container.innerHTML = `
                <div id="empty-state" class="empty-pipeline">
                    <i class="fas fa-stream"></i>
                    <h3>Start Building Your Pipeline</h3>
                    <p>Drag step types from the sidebar to build your pipeline</p>
                </div>
            `;
            return;
        }

        // Render steps with move buttons
        this.steps.forEach(step => {
            const stepEl = this.createStepElement(step);
            container.appendChild(stepEl);
        });

        // Re-setup drag and drop for pipeline steps
        this.setupPipelineDropZones();
        
        // Notify YAML generator if available
        if (window.yamlGenerator) {
            window.yamlGenerator.updateYAML(this.steps);
        }
    }

    createStepElement(step) {
        const stepEl = document.createElement('div');
        stepEl.className = 'pipeline-step';
        stepEl.dataset.stepId = step.id;
        
        if (this.selectedStep === step.id) {
            stepEl.classList.add('selected');
        }

        // Get step icon and color
        const { icon, color } = this.getStepStyle(step.type);
        
        stepEl.innerHTML = `
            <div class="step-header">
                <div class="step-info">
                    <div class="step-type-badge" style="background: ${color}">
                        <i class="fas ${icon}"></i>
                        <span>${step.type}</span>
                    </div>
                    <div class="step-label">${step.properties.label || 'Untitled Step'}</div>
                    ${this.renderStepDescription(step)}
                </div>
                <div class="step-actions">
                    <button class="step-action move-up" title="Move up" onclick="window.pipelineBuilder.moveStepUp('${step.id}')">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="step-action move-down" title="Move down" onclick="window.pipelineBuilder.moveStepDown('${step.id}')">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="step-action duplicate" title="Duplicate" onclick="window.pipelineBuilder.duplicateStep('${step.id}')">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="step-action delete" title="Delete" onclick="window.pipelineBuilder.deleteStep('${step.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${this.renderStepDetails(step)}
        `;

        // Add click handler for selection
        stepEl.addEventListener('click', (e) => {
            if (!e.target.closest('.step-actions')) {
                this.selectStep(step.id);
            }
        });

        return stepEl;
    }

    getStepStyle(type) {
        const styles = {
            'command': { icon: 'fa-terminal', color: '#4299e1' },
            'wait': { icon: 'fa-hourglass-half', color: '#ed8936' },
            'block': { icon: 'fa-hand-paper', color: '#e53e3e' },
            'input': { icon: 'fa-keyboard', color: '#9f7aea' },
            'trigger': { icon: 'fa-bolt', color: '#f6ad55' },
            'group': { icon: 'fa-layer-group', color: '#38b2ac' },
            'annotation': { icon: 'fa-comment-alt', color: '#718096' },
            'notify': { icon: 'fa-bell', color: '#d69e2e' },
            'plugin': { icon: 'fa-puzzle-piece', color: '#667eea' },
            'pipeline-upload': { icon: 'fa-cloud-upload-alt', color: '#48bb78' }
        };
        
        return styles[type] || { icon: 'fa-cog', color: '#718096' };
    }

    renderStepDescription(step) {
        switch (step.type) {
            case 'command':
                if (step.properties.command) {
                    const lines = step.properties.command.split('\n');
                    return `<div class="step-description">${lines[0]}${lines.length > 1 ? '...' : ''}</div>`;
                }
                return '';
            case 'wait':
                return `<div class="step-description">${step.properties.continue_on_failure ? 'Continue on failure' : 'Wait for all steps'}</div>`;
            case 'block':
                return `<div class="step-description">${step.properties.prompt || 'Manual approval'}</div>`;
            case 'input':
                return `<div class="step-description">${step.properties.prompt || 'User input'}</div>`;
            case 'trigger':
                return `<div class="step-description">${step.properties.trigger || 'Pipeline trigger'}</div>`;
            case 'group':
                return `<div class="step-description">${step.properties.steps?.length ? `${step.properties.steps.length} steps` : 'Empty group'}</div>`;
            case 'annotation':
                return `<div class="step-description">Style: ${step.properties.style || 'info'}</div>`;
            case 'notify':
                const notifyTypes = [];
                if (step.properties.email) notifyTypes.push('Email');
                if (step.properties.slack) notifyTypes.push('Slack');
                if (step.properties.webhook) notifyTypes.push('Webhook');
                if (step.properties.pagerduty) notifyTypes.push('PagerDuty');
                return `<div class="step-description">${notifyTypes.length ? notifyTypes.join(', ') : 'Not configured'}</div>`;
            case 'plugin':
                const plugins = Object.keys(step.properties.plugins || {});
                return `<div class="step-description">${plugins.length ? plugins.join(', ') : 'No plugins configured'}</div>`;
            case 'pipeline-upload':
                return `<div class="step-description">Upload: ${step.properties.pipeline || 'Not configured'}</div>`;
            default:
                return '';
        }
    }

    renderStepDetails(step) {
        let details = '';
        
        // Add dependency information
        if (step.properties.depends_on) {
            const deps = Array.isArray(step.properties.depends_on) ? 
                step.properties.depends_on : [step.properties.depends_on];
            if (deps.length > 0) {
                details += `<div class="step-detail"><i class="fas fa-link"></i> Depends on: ${deps.join(', ')}</div>`;
            }
        }
        
        // Add condition information
        if (step.properties.if) {
            details += `<div class="step-detail"><i class="fas fa-code-branch"></i> If: ${step.properties.if}</div>`;
        }
        
        // Add agent information for command steps
        if (step.type === 'command' && step.properties.agents && Object.keys(step.properties.agents).length > 0) {
            const agentTags = Object.entries(step.properties.agents)
                .map(([k, v]) => `${k}=${v}`)
                .join(', ');
            details += `<div class="step-detail"><i class="fas fa-server"></i> Agents: ${agentTags}</div>`;
        }
        
        // Add plugin information
        if (step.properties.plugins && Object.keys(step.properties.plugins).length > 0) {
            const pluginNames = Object.keys(step.properties.plugins).join(', ');
            details += `<div class="step-detail"><i class="fas fa-puzzle-piece"></i> Plugins: ${pluginNames}</div>`;
        }
        
        // Add notification details
        if (step.type === 'notify') {
            const notifyChannels = [];
            if (step.properties.email) notifyChannels.push(`Email: ${step.properties.email}`);
            if (step.properties.slack) notifyChannels.push(`Slack: ${step.properties.slack}`);
            if (step.properties.webhook) notifyChannels.push('Webhook configured');
            if (step.properties.pagerduty) notifyChannels.push('PagerDuty configured');
            
            if (notifyChannels.length > 0) {
                details += `<div class="step-detail"><i class="fas fa-bell"></i> ${notifyChannels.join(', ')}</div>`;
            }
        }
        
        return details ? `<div class="step-details">${details}</div>` : '';
    }

    // Step selection and properties
    selectStep(stepId) {
        console.log(`🎯 Selecting step: ${stepId}`);
        
        this.selectedStep = stepId;
        this.renderPipeline();
        this.renderProperties();
        
        // Scroll to selected step
        const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
        if (stepElement) {
            stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    deleteStep(stepId) {
        console.log(`🗑️ Deleting step: ${stepId}`);
        
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index !== -1) {
            this.steps.splice(index, 1);
            
            if (this.selectedStep === stepId) {
                this.selectedStep = null;
            }
            
            this.renderPipeline();
            this.renderProperties();
            this.updateStepCount();
            
            console.log(`✅ Deleted step: ${stepId}`);
        }
    }

    duplicateStep(stepId) {
        console.log(`📋 Duplicating step: ${stepId}`);
        
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const newStep = JSON.parse(JSON.stringify(step));
        newStep.id = `step-${this.stepCounter++}`;
        newStep.properties.label = `${step.properties.label} (Copy)`;
        if (newStep.properties.key) {
            newStep.properties.key = `${newStep.properties.key}-copy`;
        }
        
        const index = this.steps.indexOf(step);
        this.steps.splice(index + 1, 0, newStep);
        
        this.renderPipeline();
        this.selectStep(newStep.id);
        this.updateStepCount();
        
        console.log(`✅ Duplicated step: ${step.id} -> ${newStep.id}`);
    }

    // Properties panel management
    renderProperties() {
        const container = document.getElementById('properties-content');
        if (!container) {
            console.warn('⚠️ Properties container not found');
            return;
        }

        if (!this.selectedStep) {
            container.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-info-circle"></i>
                    <p>Select a step to view its properties</p>
                    <div class="help-content">
                        <h4>Available Properties</h4>
                        <ul>
                            <li><strong>Label:</strong> Display name for the step</li>
                            <li><strong>Command:</strong> Shell command to execute</li>
                            <li><strong>Key:</strong> Unique identifier for dependencies</li>
                            <li><strong>Agents:</strong> Agent targeting requirements</li>
                            <li><strong>Environment:</strong> Environment variables</li>
                            <li><strong>Plugins:</strong> Buildkite plugins to use</li>
                            <li><strong>Dependencies:</strong> Step dependencies</li>
                            <li><strong>Conditions:</strong> Conditional execution rules</li>
                        </ul>
                    </div>
                </div>
            `;
            return;
        }

        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step) return;

        container.innerHTML = this.generatePropertyForm(step);
        this.setupPropertyFormListeners(step);
    }

    generatePropertyForm(step) {
        let form = `
            <div class="property-section">
                <h4><i class="fas fa-info-circle"></i> Basic Properties</h4>
                <div class="property-group">
                    <label for="step-label">Label</label>
                    <input type="text" id="step-label" value="${step.properties.label || ''}" placeholder="Step display name">
                    <small>The name that will appear in the Buildkite interface</small>
                </div>
        `;

        // Type-specific fields
        switch (step.type) {
            case 'command':
                form += this.generateCommandStepForm(step);
                break;
            case 'wait':
                form += this.generateWaitStepForm(step);
                break;
            case 'block':
                form += this.generateBlockStepForm(step);
                break;
            case 'input':
                form += this.generateInputStepForm(step);
                break;
            case 'trigger':
                form += this.generateTriggerStepForm(step);
                break;
            case 'annotation':
                form += this.generateAnnotationStepForm(step);
                break;
            case 'notify':
                form += this.generateNotifyStepForm(step);
                break;
            case 'plugin':
                form += this.generatePluginStepForm(step);
                break;
            case 'pipeline-upload':
                form += this.generatePipelineUploadStepForm(step);
                break;
            case 'group':
                form += this.generateGroupStepForm(step);
                break;
        }

        form += `</div>`;

        // Common properties for all steps except certain types
        if (!['wait', 'annotation'].includes(step.type)) {
            form += this.generateCommonPropertiesForm(step);
        }

        // Advanced properties section
        if (['command', 'trigger', 'group'].includes(step.type)) {
            form += this.generateAdvancedPropertiesForm(step);
        }

        return form;
    }

    generateCommandStepForm(step) {
        return `
            <div class="property-group">
                <label for="step-command">Command</label>
                <textarea id="step-command" rows="4" placeholder="echo 'Hello, World!'">${step.properties.command || ''}</textarea>
                <small>Shell command(s) to execute</small>
            </div>
            <div class="property-group">
                <label for="step-key">Step Key</label>
                <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="unique-step-key">
                <small>Unique identifier for dependencies</small>
            </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-server"></i> Execution Environment</h4>
                <div class="property-group">
                    <label>Agent Requirements</label>
                    <div id="agent-tags">${this.renderAgentTags(step.properties.agents || {})}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-agent-tag">
                        <i class="fas fa-plus"></i> Add Tag
                    </button>
                </div>
                <div class="property-group">
                    <label>Environment Variables</label>
                    <div id="env-vars">${this.renderEnvVars(step.properties.env || {})}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-env-var">
                        <i class="fas fa-plus"></i> Add Variable
                    </button>
                </div>
                <div class="property-group">
                    <label for="step-timeout">Timeout (minutes)</label>
                    <input type="number" id="step-timeout" value="${step.properties.timeout_in_minutes || ''}" min="1" placeholder="No timeout">
                    <small>Maximum execution time before step is terminated</small>
                </div>
                <div class="property-group">
                    <label for="step-parallelism">Parallelism</label>
                    <input type="number" id="step-parallelism" value="${step.properties.parallelism || ''}" min="1" placeholder="1">
                    <small>Number of parallel jobs to run</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-puzzle-piece"></i> Plugins</h4>
                <div class="property-group">
                    <label>Installed Plugins</label>
                    <div id="step-plugins">${this.renderSelectedPlugins(step.properties.plugins || {})}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-plugin">
                        <i class="fas fa-plus"></i> Add Plugin
                    </button>
                </div>
        `;
    }

    generateWaitStepForm(step) {
        return `
            <div class="property-group">
                <label>
                    <input type="checkbox" id="step-continue-on-failure" ${step.properties.continue_on_failure ? 'checked' : ''}>
                    Continue on failure
                </label>
                <small>Continue pipeline even if previous steps failed</small>
            </div>
        `;
    }

    generateBlockStepForm(step) {
        return `
            <div class="property-group">
                <label for="step-prompt">Prompt</label>
                <input type="text" id="step-prompt" value="${step.properties.prompt || ''}" placeholder="Continue deployment?">
                <small>Message shown when blocking</small>
            </div>
            <div class="property-group">
                <label for="step-key">Step Key</label>
                <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="unique-step-key">
                <small>Unique identifier for dependencies</small>
            </div>
            <div class="property-group">
                <label for="step-blocked-state">Blocked State</label>
                <select id="step-blocked-state">
                    <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                    <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                    <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                </select>
                <small>Build state while waiting for unblock</small>
            </div>
            <div class="property-group">
                <label>Block Fields</label>
                <div id="block-fields">${this.renderBlockFields(step.properties.fields || [])}</div>
                <button type="button" class="btn btn-secondary btn-small" data-action="add-block-field">
                    <i class="fas fa-plus"></i> Add Field
                </button>
            </div>
        `;
    }

    generateInputStepForm(step) {
        return `
            <div class="property-group">
                <label for="step-input-prompt">Prompt</label>
                <input type="text" id="step-input-prompt" value="${step.properties.prompt || ''}" placeholder="Please provide input">
                <small>Message shown when collecting input</small>
            </div>
            <div class="property-group">
                <label for="step-key">Step Key</label>
                <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="unique-step-key">
                <small>Unique identifier for dependencies</small>
            </div>
            <div class="property-group">
                <label>Input Fields</label>
                <div id="input-fields">${this.renderInputFields(step.properties.fields || [])}</div>
                <button type="button" class="btn btn-secondary btn-small" data-action="add-input-field">
                    <i class="fas fa-plus"></i> Add Field
                </button>
            </div>
        `;
    }

    generateTriggerStepForm(step) {
        return `
            <div class="property-group">
                <label for="step-trigger">Pipeline to Trigger</label>
                <input type="text" id="step-trigger" value="${step.properties.trigger || ''}" placeholder="my-other-pipeline">
                <small>Pipeline slug to trigger</small>
            </div>
            <div class="property-group">
                <label>
                    <input type="checkbox" id="step-async" ${step.properties.async ? 'checked' : ''}>
                    Asynchronous
                </label>
                <small>Don't wait for triggered pipeline to complete</small>
            </div>
            <div class="property-group">
                <label>Build Properties</label>
                <div id="build-properties">${this.renderBuildProperties(step.properties.build || {})}</div>
                <button type="button" class="btn btn-secondary btn-small" data-action="configure-build">
                    <i class="fas fa-cog"></i> Configure Build
                </button>
            </div>
        `;
    }

    generateGroupStepForm(step) {
        return `
            <div class="property-group">
                <label for="step-group">Group Name</label>
                <input type="text" id="step-group" value="${step.properties.group || ''}" placeholder="Group Name">
                <small>Display name for the group</small>
            </div>
            <div class="property-group">
                <label for="step-key">Group Key</label>
                <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="unique-group-key">
                <small>Unique identifier for dependencies</small>
            </div>
            <div class="property-group">
                <p><i class="fas fa-info-circle"></i> Steps can be added to groups after creation</p>
            </div>
        `;
    }

    generateAnnotationStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-comment-alt"></i> Annotation Configuration</h4>
                <div class="property-group">
                    <label for="annotation-body">Annotation Body (Markdown)</label>
                    <textarea id="annotation-body" rows="6" placeholder="Build completed successfully! 🎉">${step.properties.body || ''}</textarea>
                    <small>Markdown content for the annotation</small>
                </div>
                <div class="property-group">
                    <label for="annotation-style">Style</label>
                    <select id="annotation-style">
                        <option value="info" ${step.properties.style === 'info' ? 'selected' : ''}>Info</option>
                        <option value="warning" ${step.properties.style === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="error" ${step.properties.style === 'error' ? 'selected' : ''}>Error</option>
                        <option value="success" ${step.properties.style === 'success' ? 'selected' : ''}>Success</option>
                    </select>
                    <small>Visual style of the annotation</small>
                </div>
                <div class="property-group">
                    <label for="annotation-context">Context</label>
                    <input type="text" id="annotation-context" value="${step.properties.context || ''}" placeholder="default">
                    <small>Unique identifier for the annotation</small>
                </div>
                <div class="property-checkbox">
                    <input type="checkbox" id="annotation-append" ${step.properties.append ? 'checked' : ''}>
                    <label for="annotation-append">Append to existing annotations</label>
                </div>
            </div>
        `;
    }

    generateNotifyStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-bell"></i> Notification Configuration</h4>
                <div class="property-group">
                    <label for="notify-email">Email</label>
                    <input type="text" id="notify-email" value="${step.properties.email || ''}" placeholder="team@example.com">
                    <small>Email address to notify</small>
                </div>
                <div class="property-group">
                    <label for="notify-slack">Slack Channel/User</label>
                    <input type="text" id="notify-slack" value="${step.properties.slack || ''}" placeholder="#channel or @user">
                    <small>Slack channel or user to notify</small>
                </div>
                <div class="property-group">
                    <label for="notify-webhook">Webhook URL</label>
                    <input type="text" id="notify-webhook" value="${step.properties.webhook || ''}" placeholder="https://...">
                    <small>Webhook URL for notifications</small>
                </div>
                <div class="property-group">
                    <label for="notify-pagerduty">PagerDuty Service Key</label>
                    <input type="text" id="notify-pagerduty" value="${step.properties.pagerduty || ''}" placeholder="Service key">
                    <small>PagerDuty integration key</small>
                </div>
            </div>
        `;
    }

    generatePluginStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-puzzle-piece"></i> Plugin Configuration</h4>
                <div class="property-group">
                    <label for="step-key">Step Key</label>
                    <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="unique-step-key">
                    <small>Unique identifier for dependencies</small>
                </div>
                <div class="property-group">
                    <label>Selected Plugins</label>
                    <div id="selected-plugins">${this.renderSelectedPlugins(step.properties.plugins || {})}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-plugin">
                        <i class="fas fa-plus"></i> Add Plugin
                    </button>
                </div>
            </div>
        `;
    }

    generatePipelineUploadStepForm(step) {
        return `
            <div class="property-group">
                <label for="pipeline-file">Pipeline File</label>
                <input type="text" id="pipeline-file" value="${step.properties.pipeline || ''}" placeholder=".buildkite/pipeline.yml">
                <small>Path to pipeline YAML file</small>
            </div>
            <div class="property-checkbox">
                <input type="checkbox" id="pipeline-replace" ${step.properties.replace ? 'checked' : ''}>
                <label for="pipeline-replace">Replace existing pipeline</label>
            </div>
        `;
    }

    generateCommonPropertiesForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-sitemap"></i> Dependencies & Conditions</h4>
                <div class="property-group">
                    <label>Dependencies</label>
                    <div id="dependencies-list">${this.renderDependenciesList(step.properties.depends_on || [])}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-dependency">
                        <i class="fas fa-plus"></i> Add Dependency
                    </button>
                    <small>Steps that must complete before this step runs</small>
                </div>
                <div class="property-group">
                    <label for="step-if">If Condition</label>
                    <input type="text" id="step-if" value="${step.properties.if || ''}" placeholder="build.branch == 'main'">
                    <small>Only run this step if condition is true</small>
                </div>
                <div class="property-group">
                    <label for="step-unless">Unless Condition</label>
                    <input type="text" id="step-unless" value="${step.properties.unless || ''}" placeholder="build.pull_request.id != null">
                    <small>Skip this step if condition is true</small>
                </div>
                <div class="property-group">
                    <label for="step-branches">Branch Filter</label>
                    <input type="text" id="step-branches" value="${step.properties.branches || ''}" placeholder="main develop feature/*">
                    <small>Only run on matching branches (space separated patterns)</small>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="step-allow-dependency-failure" ${step.properties.allow_dependency_failure ? 'checked' : ''}>
                        Allow dependency failure
                    </label>
                    <small>Run even if dependencies fail</small>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-shield-alt"></i> Retry Configuration</h4>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="step-retry-automatic" ${step.properties.retry && step.properties.retry.automatic ? 'checked' : ''}>
                        Automatic retry
                    </label>
                    <small>Automatically retry on failure</small>
                </div>
                ${step.properties.retry && step.properties.retry.automatic ? `
                    <div class="retry-config">
                        <div class="property-group">
                            <label for="retry-limit">Retry limit</label>
                            <input type="number" id="retry-limit" value="${step.properties.retry.automatic.limit || 3}" min="1" max="10">
                        </div>
                        <div class="property-group">
                            <label for="retry-exit-status">Exit status</label>
                            <input type="text" id="retry-exit-status" value="${step.properties.retry.automatic.exit_status || '*'}" placeholder="* or specific code">
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateAdvancedPropertiesForm(step) {
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-cogs"></i> Advanced Options</h4>
                ${step.type === 'command' ? `
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="step-soft-fail" ${step.properties.soft_fail ? 'checked' : ''}>
                            Soft fail
                        </label>
                        <small>Allow step to fail without failing the build</small>
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="step-skip" ${step.properties.skip ? 'checked' : ''}>
                            Skip step
                        </label>
                        <small>Skip this step entirely</small>
                    </div>
                ` : ''}
                <div class="property-group">
                    <label for="step-label">Matrix Configuration</label>
                    <button type="button" class="btn btn-secondary btn-small" data-action="configure-matrix">
                        <i class="fas fa-th"></i> Configure Matrix
                    </button>
                    <small>Run this step with multiple configurations</small>
                </div>
            </div>
        `;
    }

    renderAgentTags(agents) {
        if (!agents || Object.keys(agents).length === 0) {
            return '<div class="empty-list">No agent requirements specified</div>';
        }

        return Object.entries(agents).map(([key, value]) => `
            <div class="tag-item">
                <span class="tag-key">${key}</span>
                <span class="tag-value">${value}</span>
                <button class="remove-btn" data-action="remove-agent-tag" data-key="${key}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderEnvVars(env) {
        if (!env || Object.keys(env).length === 0) {
            return '<div class="empty-list">No environment variables</div>';
        }

        return Object.entries(env).map(([key, value]) => `
            <div class="env-var-item">
                <span class="env-key">${key}</span>
                <span class="env-value">${value}</span>
                <button class="remove-btn" data-action="remove-env-var" data-key="${key}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderInputFields(fields) {
        if (!fields || fields.length === 0) {
            return '<div class="empty-list">No input fields defined</div>';
        }

        return fields.map((field, index) => `
            <div class="input-field-item">
                <span class="field-key">${field.key}</span>
                <span class="field-type">${field.type || 'text'}</span>
                ${field.required ? '<span class="field-required">Required</span>' : ''}
                <button class="remove-btn" data-action="remove-input-field" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderBlockFields(fields) {
        if (!fields || fields.length === 0) {
            return '<div class="empty-list">No fields defined</div>';
        }

        return fields.map((field, index) => `
            <div class="block-field-item">
                <span class="field-key">${field.key}</span>
                <span class="field-type">${field.type || 'text'}</span>
                ${field.required ? '<span class="field-required">Required</span>' : ''}
                <button class="remove-btn" data-action="remove-block-field" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderBuildProperties(build) {
        const properties = [];
        if (build.branch) properties.push(`Branch: ${build.branch}`);
        if (build.commit) properties.push(`Commit: ${build.commit}`);
        if (build.env) properties.push(`Environment variables set`);
        if (build.meta_data) properties.push(`Metadata configured`);
        
        return properties.length > 0 ?
            `<div class="build-properties">${properties.join('<br>')}</div>` :
            '<div class="empty-list">No build properties configured</div>';
    }

    renderDependenciesList(dependencies) {
        const deps = Array.isArray(dependencies) ? dependencies : 
            (dependencies ? [dependencies] : []);
        
        if (deps.length === 0) {
            return '<div class="empty-list">No dependencies</div>';
        }

        return deps.map(dep => `
            <div class="dependency-item">
                <span>${dep}</span>
                <button class="remove-btn" data-action="remove-dependency" data-dep="${dep}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderSelectedPlugins(plugins) {
        if (!plugins || Object.keys(plugins).length === 0) {
            return '<div class="empty-list">No plugins selected</div>';
        }

        return Object.entries(plugins).map(([pluginKey, config]) => {
            const plugin = this.pluginCatalog[pluginKey];
            return `
                <div class="plugin-item">
                    <div class="plugin-header">
                        <span class="plugin-name">${plugin ? plugin.name : pluginKey}</span>
                        <button class="remove-btn" data-action="remove-plugin" data-plugin="${pluginKey}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    ${this.renderPluginConfig(pluginKey, config)}
                </div>
            `;
        }).join('');
    }

    renderPluginConfig(pluginKey, config) {
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin || !plugin.config) return '';

        return Object.entries(plugin.config).map(([key, schema]) => {
            const value = config[key] || '';
            return `
                <div class="plugin-config-item">
                    <label>${key}${schema.required ? ' *' : ''}</label>
                    <input type="text" 
                           data-plugin="${pluginKey}" 
                           data-config-key="${key}" 
                           value="${value}" 
                           placeholder="${schema.default || ''}"
                           class="plugin-config-input">
                    ${schema.description ? `<small>${schema.description}</small>` : ''}
                </div>
            `;
        }).join('');
    }

    setupPropertyFormListeners(step) {
        const container = document.getElementById('properties-content');
        if (!container) return;

        // Basic property listeners
        const labelInput = container.querySelector('#step-label');
        if (labelInput) {
            labelInput.addEventListener('input', (e) => {
                step.properties.label = e.target.value;
                this.renderPipeline();
            });
        }

        // Key input (for steps that have it)
        const keyInput = container.querySelector('#step-key');
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                step.properties.key = e.target.value;
            });
        }

        // Type-specific listeners
        switch (step.type) {
            case 'command':
                this.setupCommandStepListeners(step, container);
                break;
            case 'wait':
                this.setupWaitStepListeners(step, container);
                break;
            case 'block':
                this.setupBlockStepListeners(step, container);
                break;
            case 'input':
                this.setupInputStepListeners(step, container);
                break;
            case 'trigger':
                this.setupTriggerStepListeners(step, container);
                break;
            case 'annotation':
                this.setupAnnotationStepListeners(step, container);
                break;
            case 'notify':
                this.setupNotifyStepListeners(step, container);
                break;
            case 'plugin':
                this.setupPluginStepListeners(step, container);
                break;
            case 'pipeline-upload':
                this.setupPipelineUploadStepListeners(step, container);
                break;
            case 'group':
                this.setupGroupStepListeners(step, container);
                break;
        }

        // Common property listeners
        if (!['wait', 'annotation'].includes(step.type)) {
            this.setupCommonPropertyListeners(step, container);
        }

        // Advanced property listeners
        if (['command', 'trigger', 'group'].includes(step.type)) {
            this.setupAdvancedPropertyListeners(step, container);
        }

        // Section collapse/expand
        container.querySelectorAll('.property-section h4').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.target.closest('.property-section');
                section.classList.toggle('collapsed');
            });
        });
    }

    setupCommandStepListeners(step, container) {
        const commandInput = container.querySelector('#step-command');
        if (commandInput) {
            commandInput.addEventListener('input', (e) => {
                step.properties.command = e.target.value;
                this.renderPipeline();
            });
        }

        const timeoutInput = container.querySelector('#step-timeout');
        if (timeoutInput) {
            timeoutInput.addEventListener('input', (e) => {
                step.properties.timeout_in_minutes = e.target.value ? parseInt(e.target.value) : null;
            });
        }

        const parallelismInput = container.querySelector('#step-parallelism');
        if (parallelismInput) {
            parallelismInput.addEventListener('input', (e) => {
                step.properties.parallelism = e.target.value ? parseInt(e.target.value) : null;
            });
        }

        // Agent tags
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-agent-tag"]')) {
                this.showAddAgentTagDialog(step);
            } else if (e.target.closest('[data-action="remove-agent-tag"]')) {
                const key = e.target.closest('[data-action="remove-agent-tag"]').dataset.key;
                delete step.properties.agents[key];
                this.renderProperties();
            }
        });

        // Environment variables
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-env-var"]')) {
                this.showAddEnvVarDialog(step);
            } else if (e.target.closest('[data-action="remove-env-var"]')) {
                const key = e.target.closest('[data-action="remove-env-var"]').dataset.key;
                delete step.properties.env[key];
                this.renderProperties();
            }
        });

        // Plugins
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-plugin"]')) {
                this.showPluginSelector(step);
            } else if (e.target.closest('[data-action="remove-plugin"]')) {
                const pluginKey = e.target.closest('[data-action="remove-plugin"]').dataset.plugin;
                delete step.properties.plugins[pluginKey];
                this.renderProperties();
                this.renderPipeline();
            }
        });

        // Plugin configuration inputs
        container.querySelectorAll('.plugin-config-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const pluginKey = e.target.dataset.plugin;
                const configKey = e.target.dataset.configKey;
                if (!step.properties.plugins[pluginKey]) {
                    step.properties.plugins[pluginKey] = {};
                }
                step.properties.plugins[pluginKey][configKey] = e.target.value;
            });
        });
    }

    setupWaitStepListeners(step, container) {
        const continueOnFailure = container.querySelector('#step-continue-on-failure');
        if (continueOnFailure) {
            continueOnFailure.addEventListener('change', (e) => {
                step.properties.continue_on_failure = e.target.checked;
                this.renderPipeline();
            });
        }
    }

    setupBlockStepListeners(step, container) {
        const promptInput = container.querySelector('#step-prompt');
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                step.properties.prompt = e.target.value;
                this.renderPipeline();
            });
        }

        const blockedState = container.querySelector('#step-blocked-state');
        if (blockedState) {
            blockedState.addEventListener('change', (e) => {
                step.properties.blocked_state = e.target.value;
            });
        }

        // Block fields
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-block-field"]')) {
                this.showAddBlockFieldDialog(step);
            } else if (e.target.closest('[data-action="remove-block-field"]')) {
                const index = parseInt(e.target.closest('[data-action="remove-block-field"]').dataset.index);
                step.properties.fields.splice(index, 1);
                this.renderProperties();
            }
        });
    }

    setupInputStepListeners(step, container) {
        const promptInput = container.querySelector('#step-input-prompt');
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                step.properties.prompt = e.target.value;
                this.renderPipeline();
            });
        }

        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-input-field"]')) {
                this.showAddInputFieldDialog(step);
            } else if (e.target.closest('[data-action="remove-input-field"]')) {
                const index = parseInt(e.target.closest('[data-action="remove-input-field"]').dataset.index);
                step.properties.fields.splice(index, 1);
                this.renderProperties();
            }
        });
    }

    setupTriggerStepListeners(step, container) {
        const triggerInput = container.querySelector('#step-trigger');
        if (triggerInput) {
            triggerInput.addEventListener('input', (e) => {
                step.properties.trigger = e.target.value;
                this.renderPipeline();
            });
        }

        const asyncCheckbox = container.querySelector('#step-async');
        if (asyncCheckbox) {
            asyncCheckbox.addEventListener('change', (e) => {
                step.properties.async = e.target.checked;
            });
        }

        // Build configuration
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="configure-build"]')) {
                this.showBuildConfigDialog(step);
            }
        });
    }

    setupGroupStepListeners(step, container) {
        const groupInput = container.querySelector('#step-group');
        if (groupInput) {
            groupInput.addEventListener('input', (e) => {
                step.properties.group = e.target.value;
                this.renderPipeline();
            });
        }
    }

    setupAnnotationStepListeners(step, container) {
        const bodyInput = container.querySelector('#annotation-body');
        if (bodyInput) {
            bodyInput.addEventListener('input', (e) => {
                step.properties.body = e.target.value;
            });
        }

        const styleSelect = container.querySelector('#annotation-style');
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                step.properties.style = e.target.value;
                this.renderPipeline();
            });
        }

        const contextInput = container.querySelector('#annotation-context');
        if (contextInput) {
            contextInput.addEventListener('input', (e) => {
                step.properties.context = e.target.value;
            });
        }

        const appendCheckbox = container.querySelector('#annotation-append');
        if (appendCheckbox) {
            appendCheckbox.addEventListener('change', (e) => {
                step.properties.append = e.target.checked;
            });
        }
    }

    setupNotifyStepListeners(step, container) {
        const emailInput = container.querySelector('#notify-email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                step.properties.email = e.target.value;
                this.renderPipeline();
            });
        }

        const slackInput = container.querySelector('#notify-slack');
        if (slackInput) {
            slackInput.addEventListener('input', (e) => {
                step.properties.slack = e.target.value;
                this.renderPipeline();
            });
        }

        const webhookInput = container.querySelector('#notify-webhook');
        if (webhookInput) {
            webhookInput.addEventListener('input', (e) => {
                step.properties.webhook = e.target.value;
                this.renderPipeline();
            });
        }

        const pagerdutyInput = container.querySelector('#notify-pagerduty');
        if (pagerdutyInput) {
            pagerdutyInput.addEventListener('input', (e) => {
                step.properties.pagerduty = e.target.value;
                this.renderPipeline();
            });
        }
    }

    setupPluginStepListeners(step, container) {
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-plugin"]')) {
                this.showPluginSelector(step);
            } else if (e.target.closest('[data-action="remove-plugin"]')) {
                const pluginKey = e.target.closest('[data-action="remove-plugin"]').dataset.plugin;
                delete step.properties.plugins[pluginKey];
                this.renderProperties();
                this.renderPipeline();
            }
        });

        // Plugin configuration inputs
        container.querySelectorAll('.plugin-config-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const pluginKey = e.target.dataset.plugin;
                const configKey = e.target.dataset.configKey;
                if (!step.properties.plugins[pluginKey]) {
                    step.properties.plugins[pluginKey] = {};
                }
                step.properties.plugins[pluginKey][configKey] = e.target.value;
            });
        });
    }

    setupPipelineUploadStepListeners(step, container) {
        const pipelineInput = container.querySelector('#pipeline-file');
        if (pipelineInput) {
            pipelineInput.addEventListener('input', (e) => {
                step.properties.pipeline = e.target.value;
                this.renderPipeline();
            });
        }

        const replaceCheckbox = container.querySelector('#pipeline-replace');
        if (replaceCheckbox) {
            replaceCheckbox.addEventListener('change', (e) => {
                step.properties.replace = e.target.checked;
            });
        }
    }

    setupCommonPropertyListeners(step, container) {
        // Dependencies
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="add-dependency"]')) {
                this.showAddDependencyDialog(step);
            } else if (e.target.closest('[data-action="remove-dependency"]')) {
                const dep = e.target.closest('[data-action="remove-dependency"]').dataset.dep;
                const deps = Array.isArray(step.properties.depends_on) ? step.properties.depends_on : 
                    (step.properties.depends_on ? [step.properties.depends_on] : []);
                const index = deps.indexOf(dep);
                if (index > -1) {
                    deps.splice(index, 1);
                    step.properties.depends_on = deps.length > 0 ? (deps.length === 1 ? deps[0] : deps) : null;
                    this.renderProperties();
                    this.renderPipeline();
                }
            }
        });

        // Conditions
        const ifInput = container.querySelector('#step-if');
        if (ifInput) {
            ifInput.addEventListener('input', (e) => {
                step.properties.if = e.target.value || null;
                this.renderPipeline();
            });
        }

        const unlessInput = container.querySelector('#step-unless');
        if (unlessInput) {
            unlessInput.addEventListener('input', (e) => {
                step.properties.unless = e.target.value || null;
            });
        }

        const branchesInput = container.querySelector('#step-branches');
        if (branchesInput) {
            branchesInput.addEventListener('input', (e) => {
                step.properties.branches = e.target.value || null;
            });
        }

        const allowFailureCheckbox = container.querySelector('#step-allow-dependency-failure');
        if (allowFailureCheckbox) {
            allowFailureCheckbox.addEventListener('change', (e) => {
                step.properties.allow_dependency_failure = e.target.checked;
            });
        }

        // Retry configuration
        const retryCheckbox = container.querySelector('#step-retry-automatic');
        if (retryCheckbox) {
            retryCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    step.properties.retry = {
                        automatic: {
                            exit_status: '*',
                            limit: 3
                        }
                    };
                } else {
                    step.properties.retry = null;
                }
                this.renderProperties();
            });
        }

        const retryLimit = container.querySelector('#retry-limit');
        if (retryLimit && step.properties.retry && step.properties.retry.automatic) {
            retryLimit.addEventListener('input', (e) => {
                step.properties.retry.automatic.limit = parseInt(e.target.value) || 3;
            });
        }

        const retryExitStatus = container.querySelector('#retry-exit-status');
        if (retryExitStatus && step.properties.retry && step.properties.retry.automatic) {
            retryExitStatus.addEventListener('input', (e) => {
                step.properties.retry.automatic.exit_status = e.target.value || '*';
            });
        }
    }

    setupAdvancedPropertyListeners(step, container) {
        // Soft fail
        const softFailCheckbox = container.querySelector('#step-soft-fail');
        if (softFailCheckbox) {
            softFailCheckbox.addEventListener('change', (e) => {
                step.properties.soft_fail = e.target.checked;
            });
        }

        // Skip
        const skipCheckbox = container.querySelector('#step-skip');
        if (skipCheckbox) {
            skipCheckbox.addEventListener('change', (e) => {
                step.properties.skip = e.target.checked;
                this.renderPipeline();
            });
        }

        // Matrix configuration
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="configure-matrix"]')) {
                this.showMatrixConfigDialog(step);
            }
        });
    }

    // Dialog helpers
    showAddAgentTagDialog(step) {
        const key = prompt('Agent tag key (e.g., queue, docker, os):');
        if (!key) return;
        
        const value = prompt(`Agent tag value for '${key}':`);
        if (!value) return;
        
        if (!step.properties.agents) {
            step.properties.agents = {};
        }
        step.properties.agents[key] = value;
        this.renderProperties();
    }

    showAddEnvVarDialog(step) {
        const key = prompt('Environment variable name:');
        if (!key) return;
        
        const value = prompt(`Environment variable value for '${key}':`);
        if (value === null) return;
        
        if (!step.properties.env) {
            step.properties.env = {};
        }
        step.properties.env[key] = value;
        this.renderProperties();
    }

    showAddInputFieldDialog(step) {
        const key = prompt('Field key:');
        if (!key) return;
        
        const type = prompt('Field type (text, select, boolean):', 'text');
        const required = confirm('Is this field required?');
        
        if (!step.properties.fields) {
            step.properties.fields = [];
        }
        
        const field = { key, type };
        if (required) field.required = true;
        
        if (type === 'select') {
            const options = prompt('Enter options (comma separated):');
            if (options) {
                field.options = options.split(',').map(o => o.trim());
            }
        }
        
        step.properties.fields.push(field);
        this.renderProperties();
    }

    showAddBlockFieldDialog(step) {
        const key = prompt('Field key:');
        if (!key) return;
        
        const hint = prompt('Field hint (optional):');
        const required = confirm('Is this field required?');
        const defaultValue = prompt('Default value (optional):');
        
        if (!step.properties.fields) {
            step.properties.fields = [];
        }
        
        const field = { key };
        if (hint) field.hint = hint;
        if (required) field.required = true;
        if (defaultValue) field.default = defaultValue;
        
        step.properties.fields.push(field);
        this.renderProperties();
    }

    showAddDependencyDialog(step) {
        const availableSteps = this.steps
            .filter(s => s.id !== step.id && s.properties.key)
            .map(s => ({ key: s.properties.key, label: s.properties.label }));
        
        if (availableSteps.length === 0) {
            alert('No other steps with keys available for dependencies. Add a key to other steps first.');
            return;
        }
        
        const stepList = availableSteps.map(s => `${s.key} (${s.label})`).join('\n');
        const dep = prompt(`Available steps:\n${stepList}\n\nEnter step key:`);
        
        if (!dep) return;
        
        const validStep = availableSteps.find(s => s.key === dep);
        if (!validStep) {
            alert('Invalid step key. Please enter a valid key from the list.');
            return;
        }
        
        if (!step.properties.depends_on) {
            step.properties.depends_on = dep;
        } else if (Array.isArray(step.properties.depends_on)) {
            if (!step.properties.depends_on.includes(dep)) {
                step.properties.depends_on.push(dep);
            }
        } else {
            step.properties.depends_on = [step.properties.depends_on, dep];
        }
        
        this.renderProperties();
        this.renderPipeline();
    }

    showPluginSelector(step) {
        const pluginList = Object.entries(this.pluginCatalog)
            .filter(([key]) => !step.properties.plugins || !step.properties.plugins[key])
            .map(([key, plugin]) => `${key} - ${plugin.name}`)
            .join('\n');
        
        if (!pluginList) {
            alert('All available plugins are already added to this step.');
            return;
        }
        
        const pluginKey = prompt(`Available plugins:\n${pluginList}\n\nEnter plugin key:`);
        if (!pluginKey) return;
        
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) {
            alert('Invalid plugin key. Please enter a valid key from the list.');
            return;
        }
        
        if (!step.properties.plugins) {
            step.properties.plugins = {};
        }
        
        step.properties.plugins[pluginKey] = {};
        
        if (plugin.config) {
            Object.entries(plugin.config).forEach(([key, config]) => {
                step.properties.plugins[pluginKey][key] = config.default || '';
            });
        }
        
        this.renderProperties();
        this.renderPipeline();
    }

    showBuildConfigDialog(step) {
        const branch = prompt('Build branch (optional):', step.properties.build?.branch || '');
        const commit = prompt('Build commit (optional):', step.properties.build?.commit || '');
        const message = prompt('Build message (optional):', step.properties.build?.message || '');
        
        if (!step.properties.build) {
            step.properties.build = {};
        }
        
        if (branch) step.properties.build.branch = branch;
        else delete step.properties.build.branch;
        
        if (commit) step.properties.build.commit = commit;
        else delete step.properties.build.commit;
        
        if (message) step.properties.build.message = message;
        else delete step.properties.build.message;
        
        this.renderProperties();
    }

    showMatrixConfigDialog(step) {
        alert('Matrix configuration is available in the Matrix Builder. Click the "Matrix Builder" button in the sidebar.');
    }

    // Utility methods
    updateStepCount() {
        const countElement = document.querySelector('.step-count');
        if (countElement) {
            countElement.textContent = `${this.steps.length} step${this.steps.length !== 1 ? 's' : ''}`;
        }
        
        const countEl = document.getElementById('step-count');
        if (countEl) {
            countEl.textContent = this.steps.length;
        }
    }

    clearPipeline() {
        if (this.steps.length === 0) {
            alert('Pipeline is already empty.');
            return;
        }
        
        if (confirm('Are you sure you want to clear the entire pipeline? This action cannot be undone.')) {
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
        if (this.steps.length > 0) {
            if (!confirm('This will replace your current pipeline. Continue?')) {
                return;
            }
        }
        
        this.steps = [];
        this.stepCounter = 0;
        
        // Add example steps
        const exampleSteps = [
            { 
                type: 'command', 
                properties: { 
                    label: '📦 Install Dependencies', 
                    command: 'npm install\nnpm run lint',
                    key: 'install'
                } 
            },
            { 
                type: 'command', 
                properties: { 
                    label: '🧪 Run Tests', 
                    command: 'npm test',
                    key: 'test',
                    depends_on: 'install',
                    retry: { automatic: { limit: 3, exit_status: '*' } }
                } 
            },
            { 
                type: 'wait',
                properties: {}
            },
            { 
                type: 'command', 
                properties: { 
                    label: '🔨 Build Application', 
                    command: 'npm run build',
                    key: 'build',
                    agents: { queue: 'build' }
                } 
            },
            { 
                type: 'block', 
                properties: { 
                    prompt: 'Deploy to production?',
                    key: 'approval'
                } 
            },
            { 
                type: 'command', 
                properties: { 
                    label: '🚀 Deploy', 
                    command: 'npm run deploy',
                    key: 'deploy',
                    depends_on: ['build', 'approval']
                } 
            }
        ];
        
        exampleSteps.forEach(stepConfig => {
            const step = this.createStep(stepConfig.type);
            Object.assign(step.properties, stepConfig.properties);
            this.steps.push(step);
            this.stepCounter++;
        });
        
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        
        console.log('📋 Loaded example pipeline');
    }

    exportYAML() {
        if (window.yamlGenerator) {
            const yaml = window.yamlGenerator.generateYAML(this.steps);
            console.log('📋 Generated YAML:', yaml);
            window.yamlGenerator.downloadYAML(yaml);
        }
    }

    // Template loading
    loadTemplate(templateType) {
        console.log(`📋 Loading template: ${templateType}`);
        
        const templates = {
            'basic-ci': [
                { type: 'command', properties: { label: 'Install Dependencies', command: 'npm install' } },
                { type: 'command', properties: { label: 'Run Tests', command: 'npm test' } },
                { type: 'wait', properties: {} },
                { type: 'command', properties: { label: 'Build', command: 'npm run build' } }
            ],
            'docker-build': [
                { type: 'command', properties: { 
                    label: 'Build Docker Image', 
                    command: 'docker build -t myapp:$BUILDKITE_BUILD_NUMBER .',
                    plugins: { 'docker': { image: 'myapp', tag: '$BUILDKITE_BUILD_NUMBER' } }
                }},
                { type: 'command', properties: { 
                    label: 'Push to Registry', 
                    command: 'docker push myapp:$BUILDKITE_BUILD_NUMBER',
                    plugins: { 'ecr': { login: true } }
                }}
            ],
            'deploy-pipeline': [
                { type: 'command', properties: { label: 'Run Tests', command: 'make test' } },
                { type: 'block', properties: { prompt: 'Deploy to staging?' } },
                { type: 'command', properties: { label: 'Deploy Staging', command: 'deploy staging' } },
                { type: 'block', properties: { prompt: 'Deploy to production?' } },
                { type: 'command', properties: { label: 'Deploy Production', command: 'deploy production' } }
            ],
            'test-suite': [
                { type: 'command', properties: { label: 'Unit Tests', command: 'npm run test:unit', key: 'unit-tests' } },
                { type: 'command', properties: { label: 'Integration Tests', command: 'npm run test:integration', key: 'integration-tests' } },
                { type: 'command', properties: { label: 'E2E Tests', command: 'npm run test:e2e', key: 'e2e-tests' } },
                { type: 'wait', properties: {} },
                { type: 'command', properties: { 
                    label: 'Test Report', 
                    command: 'npm run test:report',
                    depends_on: ['unit-tests', 'integration-tests', 'e2e-tests']
                }}
            ],
            'quality-gates': [
                { type: 'command', properties: { label: 'Linting', command: 'npm run lint', key: 'lint' } },
                { type: 'command', properties: { label: 'Type Check', command: 'npm run type-check', key: 'type-check' } },
                { type: 'command', properties: { label: 'Security Scan', command: 'npm audit', key: 'security' } },
                { type: 'wait', properties: {} },
                { type: 'command', properties: { 
                    label: 'Quality Report', 
                    command: 'npm run quality:report',
                    depends_on: ['lint', 'type-check', 'security']
                }}
            ]
        };
        
        const template = templates[templateType];
        if (template) {
            if (this.steps.length > 0) {
                if (!confirm('This will replace your current pipeline. Continue?')) {
                    return;
                }
            }
            
            this.steps = [];
            this.stepCounter = 0;
            
            template.forEach(stepConfig => {
                const step = this.createStep(stepConfig.type);
                Object.assign(step.properties, stepConfig.properties);
                this.steps.push(step);
                this.stepCounter++;
            });
            
            this.renderPipeline();
            this.renderProperties();
            this.updateStepCount();
            
            console.log(`✅ Loaded template: ${templateType}`);
        }
    }

    // Public API for enhanced features
    updateStepProperty(stepId, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        // Handle nested properties
        if (property.includes('_')) {
            const parts = property.split('_');
            if (parts[0] === 'build' && step.properties.build) {
                step.properties.build[parts[1]] = value;
            } else if (parts[0] === 'retry' && parts[1] === 'limit') {
                if (!step.properties.retry) step.properties.retry = { automatic: {} };
                step.properties.retry.automatic.limit = parseInt(value) || 3;
            } else if (parts[0] === 'notify') {
                step.properties[property] = value;
            } else {
                step.properties[property] = value;
            }
        } else {
            step.properties[property] = value;
        }
        
        this.renderPipeline();
        
        // Notify YAML generator if available
        if (window.yamlGenerator) {
            window.yamlGenerator.updateYAML(this.steps);
        }
    }

    // Pipeline configuration getter for YAML generation
    getPipelineConfig() {
        return {
            steps: this.steps.map(step => this.convertStepToYAML(step))
        };
    }

    convertStepToYAML(step) {
        const yamlStep = {};
        
        // Handle different step types
        switch (step.type) {
            case 'wait':
                yamlStep.wait = null;
                if (step.properties.continue_on_failure) {
                    yamlStep.wait = { continue_on_failure: true };
                }
                if (step.properties.if) {
                    yamlStep.if = step.properties.if;
                }
                break;
                
            case 'block':
                yamlStep.block = step.properties.prompt || 'Manual block';
                if (step.properties.fields && step.properties.fields.length > 0) {
                    yamlStep.fields = step.properties.fields;
                }
                if (step.properties.blocked_state !== 'passed') {
                    yamlStep.blocked_state = step.properties.blocked_state;
                }
                if (step.properties.key) {
                    yamlStep.key = step.properties.key;
                }
                break;
                
            case 'input':
                yamlStep.input = step.properties.prompt || 'Please provide input';
                if (step.properties.fields && step.properties.fields.length > 0) {
                    yamlStep.fields = step.properties.fields;
                }
                if (step.properties.key) {
                    yamlStep.key = step.properties.key;
                }
                break;
                
            case 'trigger':
                yamlStep.trigger = step.properties.trigger;
                if (step.properties.async) {
                    yamlStep.async = true;
                }
                if (step.properties.build && Object.keys(step.properties.build).length > 0) {
                    yamlStep.build = step.properties.build;
                }
                if (step.properties.branches) {
                    yamlStep.branches = step.properties.branches;
                }
                break;
                
            case 'group':
                yamlStep.group = step.properties.group || 'Group';
                if (step.properties.key) {
                    yamlStep.key = step.properties.key;
                }
                // Group steps would be added separately
                yamlStep.steps = step.properties.steps || [];
                break;
                
            default:
                // Command step or others
                if (step.properties.label) {
                    yamlStep.label = step.properties.label;
                }
                if (step.properties.command) {
                    yamlStep.command = step.properties.command;
                }
                if (step.properties.key) {
                    yamlStep.key = step.properties.key;
                }
                break;
        }
        
        // Add common properties
        if (step.properties.depends_on) {
            yamlStep.depends_on = step.properties.depends_on;
        }
        
        if (step.properties.if && step.type !== 'wait') {
            yamlStep.if = step.properties.if;
        }
        
        if (step.properties.unless) {
            yamlStep.unless = step.properties.unless;
        }
        
        if (step.properties.branches && step.type !== 'trigger') {
            yamlStep.branches = step.properties.branches;
        }
        
        if (step.properties.agents && Object.keys(step.properties.agents).length > 0) {
            yamlStep.agents = step.properties.agents;
        }
        
        if (step.properties.env && Object.keys(step.properties.env).length > 0) {
            yamlStep.env = step.properties.env;
        }
        
        if (step.properties.plugins && Object.keys(step.properties.plugins).length > 0) {
            yamlStep.plugins = [];
            Object.entries(step.properties.plugins).forEach(([key, config]) => {
                const pluginEntry = {};
                pluginEntry[key] = config;
                yamlStep.plugins.push(pluginEntry);
            });
        }
        
        if (step.properties.timeout_in_minutes) {
            yamlStep.timeout_in_minutes = step.properties.timeout_in_minutes;
        }
        
        if (step.properties.retry) {
            yamlStep.retry = step.properties.retry;
        }
        
        if (step.properties.parallelism && step.properties.parallelism > 1) {
            yamlStep.parallelism = step.properties.parallelism;
        }
        
        if (step.properties.allow_dependency_failure) {
            yamlStep.allow_dependency_failure = true;
        }
        
        if (step.properties.soft_fail) {
            yamlStep.soft_fail = step.properties.soft_fail === true ? true : step.properties.soft_fail;
        }
        
        if (step.properties.skip) {
            yamlStep.skip = step.properties.skip === true ? true : step.properties.skip;
        }
        
        // Type-specific properties
        if (step.type === 'annotation') {
            yamlStep.annotate = step.properties.body || '';
            yamlStep.context = step.properties.context || 'default';
            yamlStep.style = step.properties.style || 'info';
            if (step.properties.append) {
                yamlStep.append = true;
            }
        }
        
        if (step.type === 'notify') {
            const notify = [];
            if (step.properties.email) {
                notify.push({ email: step.properties.email });
            }
            if (step.properties.slack) {
                notify.push({ slack: step.properties.slack });
            }
            if (step.properties.webhook) {
                notify.push({ webhook: step.properties.webhook });
            }
            if (step.properties.pagerduty) {
                notify.push({ pagerduty_change_event: step.properties.pagerduty });
            }
            if (notify.length > 0) {
                yamlStep.notify = notify;
            }
        }
        
        return yamlStep;
    }

    // Plugin catalog methods
    showPluginCatalog() {
        console.log('🏪 Opening plugin catalog...');
        // This would trigger the modal in the main app
        const event = new CustomEvent('openPluginCatalog');
        document.dispatchEvent(event);
    }

    validatePipeline() {
        console.log('✅ Validating pipeline...');
        
        const issues = [];
        
        // Check for steps without commands
        this.steps.forEach(step => {
            if (step.type === 'command' && !step.properties.command) {
                issues.push(`Step "${step.properties.label}" has no command`);
            }
            
            // Check for invalid dependencies
            if (step.properties.depends_on) {
                const deps = Array.isArray(step.properties.depends_on) ? 
                    step.properties.depends_on : [step.properties.depends_on];
                    
                deps.forEach(dep => {
                    const depStep = this.steps.find(s => s.properties.key === dep);
                    if (!depStep) {
                        issues.push(`Step "${step.properties.label}" depends on non-existent step "${dep}"`);
                    }
                });
            }
        });
        
        if (issues.length > 0) {
            alert(`Pipeline validation issues:\n\n${issues.join('\n')}`);
        } else {
            alert('Pipeline validation passed! ✅');
        }
        
        return issues.length === 0;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Pipeline Builder...');
    window.pipelineBuilder = new PipelineBuilder();
});