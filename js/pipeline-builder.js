// js/pipeline-builder.js
/**
 * Buildkite Pipeline Builder - Core functionality
 * Complete version with ALL features:
 * - Matrix builds support
 * - Conditional logic support
 * - Fixed drag-and-drop (no duplicates)
 * - All step types
 * - Complete plugin catalog
 * - Enhanced templates
 */

class PipelineBuilder {
    constructor() {
        console.log('🚀 Initializing Complete Pipeline Builder...');
        
        // Core state
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        
        // Drag and drop state
        this.draggedElement = null;
        this.dropZones = [];
        this.dropHandled = false; // FIXED: Prevent duplicate drops
        
        // Complete plugin catalog - MERGED FROM BOTH VERSIONS
        this.pluginCatalog = {
            'docker-compose': {
                name: 'Docker Compose',
                icon: 'fa-docker',
                description: 'Build, run and push Docker Compose',
                config: {
                    run: { type: 'string', default: 'app', required: true, description: 'Service to run' },
                    config: { type: 'string', default: 'docker-compose.yml', description: 'Config file path' },
                    shell: { type: 'boolean', default: true, description: 'Run with shell' }
                }
            },
            'docker': {
                name: 'Docker',
                icon: 'fa-docker',
                description: 'Build and push Docker images',
                config: {
                    image: { type: 'string', required: true, description: 'Image name' },
                    dockerfile: { type: 'string', default: 'Dockerfile', description: 'Dockerfile path' },
                    tag: { type: 'string', default: '$BUILDKITE_BUILD_NUMBER', description: 'Image tag' },
                    push: { type: 'boolean', default: true, description: 'Push to registry' }
                }
            },
            'artifacts': {
                name: 'Artifacts',
                icon: 'fa-file-archive',
                description: 'Upload and download artifacts',
                config: {
                    upload: { type: 'string', description: 'Paths to upload' },
                    download: { type: 'string', description: 'Paths to download' },
                    compress: { type: 'boolean', default: false, description: 'Compress artifacts' }
                }
            },
            'test-collector': {
                name: 'Test Collector',
                icon: 'fa-check-circle',
                description: 'Collect test results',
                config: {
                    files: { type: 'string', required: true, description: 'Test result files' },
                    format: { type: 'string', default: 'junit', description: 'Result format' }
                }
            },
            'kubernetes': {
                name: 'Kubernetes',
                icon: 'fa-dharmachakra',
                description: 'Deploy to Kubernetes',
                config: {
                    'deployment-file': { type: 'string', required: true, description: 'Deployment YAML' },
                    'namespace': { type: 'string', default: 'default', description: 'K8s namespace' }
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
        
        // Notifications config - COMPLETE FROM BOTH VERSIONS
        this.notificationTypes = {
            email: {
                name: 'Email',
                icon: 'fa-envelope',
                fields: ['to', 'subject', 'email']
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

    // FIXED: Add step movement functionality - PRESERVED FROM ORIGINAL
    moveStepUp(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index > 0) {
            [this.steps[index - 1], this.steps[index]] = [this.steps[index], this.steps[index - 1]];
            this.renderPipeline();
            this.renderProperties();
            console.log(`⬆️ Moved step ${stepId} up`);
        }
    }

    moveStepDown(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index >= 0 && index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.renderPipeline();
            this.renderProperties();
            console.log(`⬇️ Moved step ${stepId} down`);
        }
    }

    // Enhanced drag and drop functionality - FIXED VERSION
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
            item.draggable = true;
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
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
        const template = e.target.closest('.template-item');
        const pattern = e.target.closest('.pattern-item');
        
        if (stepType) {
            this.draggedElement = {
                type: 'step',
                stepType: stepType.dataset.stepType,
                element: stepType
            };
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('stepType', stepType.dataset.stepType);
        } else if (template) {
            this.draggedElement = {
                type: 'template',
                template: template.dataset.template,
                element: template
            };
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('template', template.dataset.template);
        } else if (pattern) {
            this.draggedElement = {
                type: 'pattern',
                pattern: pattern.dataset.pattern,
                element: pattern
            };
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('pattern', pattern.dataset.pattern);
        }
        
        this.dropHandled = false; // FIXED: Reset flag on new drag
        
        if (this.draggedElement) {
            this.draggedElement.element.classList.add('dragging');
            this.showDropZones();
        }
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.hideDropZones();
        this.draggedElement = null;
        this.dropHandled = false; // FIXED: Reset flag
        this.removeDropIndicator();
    }

    handleDragOver(e) {
        if (e.dataTransfer.types.includes('stepType') || 
            e.dataTransfer.types.includes('template') ||
            e.dataTransfer.types.includes('pattern')) {
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
        
        const stepType = e.dataTransfer.getData('stepType');
        const template = e.dataTransfer.getData('template');
        const pattern = e.dataTransfer.getData('pattern');
        
        if (stepType || template || pattern) {
            // Calculate insert position
            const afterElement = this.getDragAfterElement(pipelineSteps, e.clientY);
            let insertIndex = this.steps.length;
            
            if (afterElement && afterElement.dataset.stepId) {
                const afterStep = this.steps.find(s => s.id === afterElement.dataset.stepId);
                if (afterStep) {
                    insertIndex = this.steps.indexOf(afterStep);
                }
            }
            
            // Add the step/template/pattern at the calculated position - ONLY ONCE
            if (stepType) {
                console.log(`📍 Adding single step at index ${insertIndex}`);
                this.addStep(stepType, insertIndex);
            } else if (template) {
                this.loadTemplate(template, insertIndex);
            } else if (pattern) {
                this.loadPattern(pattern, insertIndex);
            }
        }
        
        this.removeDropIndicator();
        this.hideDropZones();
        
        // FIXED: Reset flag after a delay to handle any lingering events
        setTimeout(() => {
            this.dropHandled = false;
        }, 100);
    }

    handleDragLeave(e) {
        // Only remove styles if we're leaving the container
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (e.target === pipelineSteps && !pipelineSteps.contains(e.relatedTarget)) {
            pipelineSteps.classList.remove('drag-over');
            this.removeDropIndicator();
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

    // Step management - PRESERVED ALL FROM ORIGINAL
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

    // Plugin step methods - PRESERVED FROM ORIGINAL
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

    // Create step with all types - COMPLETE FROM BOTH VERSIONS
    createStep(type) {
        const baseStep = {
            id: `step-${this.stepCounter}`,
            type: type,
            properties: {
                label: this.getDefaultLabel(type)
            }
        };

        // Type-specific defaults - ALL PRESERVED FROM BOTH VERSIONS
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
                    matrix: null,  // Matrix support
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

    // Pipeline rendering with step actions - ENHANCED WITH MATRIX AND CONDITIONS
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
        
        // Emit pipeline changed event
        document.dispatchEvent(new CustomEvent('pipelineChanged'));
    }

    createStepElement(step) {
        const stepEl = document.createElement('div');
        stepEl.className = `pipeline-step ${step.type}-step ${this.selectedStep === step.id ? 'selected' : ''}`;
        stepEl.dataset.stepId = step.id;
        
        const style = this.getStepStyle(step.type);
        
        // Check for matrix configuration
        const hasMatrix = step.properties.matrix && Object.keys(step.properties.matrix).length > 0;
        const matrixInfo = hasMatrix ? this.getMatrixInfo(step.properties.matrix) : null;
        
        // Check for conditional logic
        const hasCondition = step.properties.if || step.properties.unless;
        const conditionInfo = hasCondition ? this.getConditionInfo(step.properties) : null;
        
        stepEl.innerHTML = `
            <div class="step-header" style="border-left-color: ${style.color}">
                <div class="step-icon">
                    <i class="fas ${style.icon}"></i>
                </div>
                <div class="step-info">
                    <div class="step-label">${step.properties.label || step.type}</div>
                    ${this.renderStepDescription(step)}
                    ${hasMatrix ? `
                        <div class="step-matrix-badge">
                            <i class="fas fa-th"></i> Matrix: ${matrixInfo}
                        </div>
                    ` : ''}
                    ${hasCondition ? `
                        <div class="step-condition-badge">
                            <i class="fas fa-code-branch"></i> ${conditionInfo}
                        </div>
                    ` : ''}
                </div>
                <div class="step-actions">
                    <button class="step-action move-up" title="Move Up" onclick="window.pipelineBuilder.moveStepUp('${step.id}')">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="step-action move-down" title="Move Down" onclick="window.pipelineBuilder.moveStepDown('${step.id}')">
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

        // Add click handler
        stepEl.addEventListener('click', (e) => {
            if (!e.target.closest('.step-action')) {
                this.selectStep(step.id);
            }
        });

        return stepEl;
    }

    getMatrixInfo(matrix) {
        const dimensions = Object.keys(matrix).length;
        let combinations = 1;
        Object.values(matrix).forEach(values => {
            combinations *= values.length;
        });
        return `${dimensions}D, ${combinations} jobs`;
    }

    getConditionInfo(properties) {
        if (properties.if) {
            return `if: ${properties.if}`;
        } else if (properties.unless) {
            return `unless: ${properties.unless}`;
        }
        return '';
    }

    getStepStyle(type) {
        const styles = {
            'command': { icon: 'fa-terminal', color: '#667eea' },
            'wait': { icon: 'fa-hourglass-half', color: '#48bb78' },
            'block': { icon: 'fa-hand-paper', color: '#ed8936' },
            'input': { icon: 'fa-keyboard', color: '#38b2ac' },
            'trigger': { icon: 'fa-bolt', color: '#e53e3e' },
            'group': { icon: 'fa-layer-group', color: '#805ad5' },
            'annotation': { icon: 'fa-comment-alt', color: '#d69e2e' },
            'notify': { icon: 'fa-bell', color: '#9f7aea' },
            'plugin': { icon: 'fa-puzzle-piece', color: '#319795' },
            'pipeline-upload': { icon: 'fa-cloud-upload-alt', color: '#2d3748' }
        };

        return styles[type] || { icon: 'fa-cog', color: '#718096' };
    }

    renderStepDescription(step) {
        switch (step.type) {
            case 'command':
                return step.properties.command ? 
                    `<div class="step-description"><code>${step.properties.command.substring(0, 50)}${step.properties.command.length > 50 ? '...' : ''}</code></div>` : '';
            case 'wait':
                return `<div class="step-description">Wait for all previous steps to complete</div>`;
            case 'block':
                return `<div class="step-description">${step.properties.prompt || 'Manual approval required'}</div>`;
            case 'input':
                return `<div class="step-description">${step.properties.prompt || 'Collect user input'}</div>`;
            case 'trigger':
                return `<div class="step-description">Trigger: ${step.properties.trigger || 'Not configured'}</div>`;
            case 'group':
                return `<div class="step-description">${step.properties.steps ? `${step.properties.steps.length} steps` : 'Empty group'}</div>`;
            case 'annotation':
                return `<div class="step-description">Style: ${step.properties.style || 'info'}</div>`;
            case 'notify':
                const channels = [];
                if (step.properties.email) channels.push('Email');
                if (step.properties.slack) channels.push('Slack');
                if (step.properties.webhook) channels.push('Webhook');
                if (step.properties.pagerduty) channels.push('PagerDuty');
                return `<div class="step-description">${channels.length > 0 ? channels.join(', ') : 'No channels configured'}</div>`;
            case 'plugin':
                const plugins = Object.keys(step.properties.plugins || {});
                return `<div class="step-description">${plugins.length > 0 ? plugins.join(', ') : 'No plugins configured'}</div>`;
            case 'pipeline-upload':
                return `<div class="step-description">Upload: ${step.properties.pipeline || '.buildkite/pipeline.yml'}</div>`;
            default:
                return '';
        }
    }

    renderStepDetails(step) {
        const details = [];
        
        if (step.properties.depends_on) {
            const deps = Array.isArray(step.properties.depends_on) ? 
                step.properties.depends_on : [step.properties.depends_on];
            details.push(`<i class="fas fa-link"></i> Depends on: ${deps.join(', ')}`);
        }
        
        if (step.properties.key) {
            details.push(`<i class="fas fa-key"></i> Key: ${step.properties.key}`);
        }
        
        if (step.properties.agents && Object.keys(step.properties.agents).length > 0) {
            details.push(`<i class="fas fa-server"></i> Agents: ${Object.keys(step.properties.agents).join(', ')}`);
        }
        
        if (step.properties.plugins && Object.keys(step.properties.plugins).length > 0) {
            details.push(`<i class="fas fa-puzzle-piece"></i> Plugins: ${Object.keys(step.properties.plugins).join(', ')}`);
        }
        
        if (details.length > 0) {
            return `<div class="step-details">${details.join(' • ')}</div>`;
        }
        
        return '';
    }

    selectStep(stepId) {
        this.selectedStep = stepId;
        this.renderPipeline();
        this.renderProperties();
        console.log(`📌 Selected step: ${stepId}`);
        
        // Scroll to selected step
        const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
        if (stepElement) {
            stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    deleteStep(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index !== -1) {
            this.steps.splice(index, 1);
            
            if (this.selectedStep === stepId) {
                this.selectedStep = null;
            }
            
            this.renderPipeline();
            this.renderProperties();
            this.updateStepCount();
            
            console.log(`🗑️ Deleted step: ${stepId}`);
        }
    }

    duplicateStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const newStep = JSON.parse(JSON.stringify(step));
        newStep.id = `step-${this.stepCounter}`;
        newStep.properties.label = `${step.properties.label} (Copy)`;
        if (newStep.properties.key) {
            newStep.properties.key = `${newStep.properties.key}-copy`;
        }
        
        const index = this.steps.indexOf(step);
        this.steps.splice(index + 1, 0, newStep);
        
        this.stepCounter++;
        this.renderPipeline();
        this.selectStep(newStep.id);
        this.updateStepCount();
        
        console.log(`📋 Duplicated step: ${stepId} -> ${newStep.id}`);
    }

    // Properties panel management - ENHANCED WITH NEW FEATURES
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
                            <li><strong>Matrix:</strong> Matrix build configuration</li>
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

    // Property form generation - ALL STEP TYPES PRESERVED
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

        // Type-specific fields - ALL PRESERVED FROM ORIGINAL
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
            case 'group':
                form += this.generateGroupStepForm(step);
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
        }

        form += `</div>`;

        // Common properties for all steps
        if (!['wait', 'annotation'].includes(step.type)) {
            form += this.generateCommonPropertiesForm(step);
        }

        // Advanced properties section
        if (['command', 'trigger', 'group'].includes(step.type)) {
            form += this.generateAdvancedPropertiesForm(step);
        }

        return form;
    }

    // ALL FORM GENERATORS PRESERVED FROM ORIGINAL WITH ENHANCEMENTS
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
                <div class="property-group">
                    <label>Matrix Configuration</label>
                    ${step.properties.matrix && Object.keys(step.properties.matrix).length > 0 ? 
                        `<div class="matrix-summary">
                            ${this.getMatrixInfo(step.properties.matrix)}
                        </div>` : 
                        '<div class="no-matrix">No matrix configured</div>'
                    }
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.matrixBuilder?.openForStep(window.pipelineBuilder.steps.find(s => s.id === '${step.id}'))">
                        <i class="fas fa-th"></i> Configure Matrix
                    </button>
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
                    Trigger asynchronously
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
                    <label for="annotation-body">Annotation Content</label>
                    <textarea id="annotation-body" rows="4" placeholder="Markdown content...">${step.properties.body || ''}</textarea>
                    <small>Supports Markdown formatting</small>
                </div>
                <div class="property-group">
                    <label for="annotation-style">Style</label>
                    <select id="annotation-style">
                        <option value="info" ${step.properties.style === 'info' ? 'selected' : ''}>Info</option>
                        <option value="success" ${step.properties.style === 'success' ? 'selected' : ''}>Success</option>
                        <option value="warning" ${step.properties.style === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="error" ${step.properties.style === 'error' ? 'selected' : ''}>Error</option>
                    </select>
                </div>
                <div class="property-group">
                    <label for="annotation-context">Context</label>
                    <input type="text" id="annotation-context" value="${step.properties.context || ''}" placeholder="default">
                    <small>Annotation context identifier</small>
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
                <label for="pipeline-replace">Replace current pipeline</label>
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
                    <label>Conditional Execution</label>
                    ${step.properties.if || step.properties.unless ? 
                        `<div class="condition-summary">
                            ${step.properties.if ? `if: ${step.properties.if}` : ''}
                            ${step.properties.unless ? `unless: ${step.properties.unless}` : ''}
                        </div>` : 
                        '<div class="no-condition">No conditions set</div>'
                    }
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.conditionalLogicBuilder?.openForStep(window.pipelineBuilder.steps.find(s => s.id === '${step.id}'))">
                        <i class="fas fa-code-branch"></i> Configure Conditions
                    </button>
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
                <div class="property-checkbox">
                    <input type="checkbox" id="step-skip" ${step.properties.skip ? 'checked' : ''}>
                    <label for="step-skip">Skip this step</label>
                </div>
            </div>
        `;
    }

    generateAdvancedPropertiesForm(step) {
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-shield-alt"></i> Retry & Error Handling</h4>
                ${step.type === 'command' ? `
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="step-soft-fail" ${step.properties.soft_fail ? 'checked' : ''}>
                            Soft fail
                        </label>
                        <small>Allow step to fail without failing the build</small>
                    </div>
                ` : ''}
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

    // Helper render methods - COMPLETE FROM BOTH VERSIONS
    renderAgentTags(agents) {
        return Object.entries(agents).map(([key, value]) => `
            <div class="agent-tag">
                <span class="tag-key">${key}</span>
                <span class="tag-value">${value}</span>
                <button class="remove-btn" data-action="remove-agent-tag" data-key="${key}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') || '<div class="empty-list">No agent requirements</div>';
    }

    renderEnvVars(env) {
        return Object.entries(env).map(([key, value]) => `
            <div class="env-var">
                <span class="var-key">${key}</span>
                <span class="var-value">${value}</span>
                <button class="remove-btn" data-action="remove-env-var" data-key="${key}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') || '<div class="empty-list">No environment variables</div>';
    }

    renderInputFields(fields) {
        return fields.map((field, index) => `
            <div class="input-field">
                <span class="field-key">${field.key}</span>
                <span class="field-type">${field.type || 'text'}</span>
                ${field.required ? '<span class="field-required">Required</span>' : ''}
                <button class="remove-btn" data-action="remove-input-field" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') || '<div class="empty-list">No input fields defined</div>';
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
        return Object.entries(plugins).map(([key, config]) => `
            <div class="selected-plugin">
                <div class="plugin-header">
                    <span class="plugin-name">${this.pluginCatalog[key]?.name || key}</span>
                    <button class="remove-btn" data-action="remove-plugin" data-plugin="${key}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="plugin-config">
                    ${this.renderPluginConfig(key, config)}
                </div>
            </div>
        `).join('') || '<div class="empty-list">No plugins configured</div>';
    }

    renderPluginConfig(pluginKey, config) {
        const pluginDef = this.pluginCatalog[pluginKey];
        if (!pluginDef || !pluginDef.config) return '';
        
        return Object.entries(pluginDef.config).map(([key, def]) => `
            <div class="config-field">
                <label>${key}${def.required ? ' *' : ''}</label>
                <input type="text" 
                       value="${config[key] || ''}" 
                       placeholder="${def.default || ''}"
                       data-plugin="${pluginKey}"
                       data-config-key="${key}"
                       class="plugin-config-input">
                ${def.description ? `<small>${def.description}</small>` : ''}
            </div>
        `).join('');
    }

    // Property form event listeners setup - ALL PRESERVED
    setupPropertyFormListeners(step) {
        const container = document.getElementById('properties-content');
        if (!container) return;

        // Label change
        const labelInput = container.querySelector('#step-label');
        if (labelInput) {
            labelInput.addEventListener('input', (e) => {
                step.properties.label = e.target.value;
                this.renderPipeline();
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
            case 'group':
                this.setupGroupStepListeners(step, container);
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
                this.setupPipelineUploadListeners(step, container);
                break;
        }

        // Common property listeners
        if (!['wait', 'annotation'].includes(step.type)) {
            this.setupCommonPropertyListeners(step, container);
        }
        
        // Action button listeners
        this.setupActionButtonListeners(step, container);
        
        // Section collapse/expand
        container.querySelectorAll('.property-section h4').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.target.closest('.property-section');
                section.classList.toggle('collapsed');
            });
        });
    }

    // All setup listener methods - PRESERVED FROM BOTH VERSIONS
    setupCommandStepListeners(step, container) {
        const commandInput = container.querySelector('#step-command');
        if (commandInput) {
            commandInput.addEventListener('input', (e) => {
                step.properties.command = e.target.value;
                this.renderPipeline();
            });
        }

        const keyInput = container.querySelector('#step-key');
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                step.properties.key = e.target.value;
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
        const continueCheckbox = container.querySelector('#step-continue-on-failure');
        if (continueCheckbox) {
            continueCheckbox.addEventListener('change', (e) => {
                step.properties.continue_on_failure = e.target.checked;
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

        const blockedStateSelect = container.querySelector('#step-blocked-state');
        if (blockedStateSelect) {
            blockedStateSelect.addEventListener('change', (e) => {
                step.properties.blocked_state = e.target.value;
            });
        }

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

        const keyInput = container.querySelector('#step-key');
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                step.properties.key = e.target.value;
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

    setupPipelineUploadListeners(step, container) {
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
        // Dependencies - NEW HANDLING
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

        const skipCheckbox = container.querySelector('#step-skip');
        if (skipCheckbox) {
            skipCheckbox.addEventListener('change', (e) => {
                step.properties.skip = e.target.checked;
                this.renderPipeline();
            });
        }

        const allowFailureCheckbox = container.querySelector('#step-allow-dependency-failure');
        if (allowFailureCheckbox) {
            allowFailureCheckbox.addEventListener('change', (e) => {
                step.properties.allow_dependency_failure = e.target.checked;
            });
        }

        // Soft fail for command steps
        const softFailCheckbox = container.querySelector('#step-soft-fail');
        if (softFailCheckbox) {
            softFailCheckbox.addEventListener('change', (e) => {
                step.properties.soft_fail = e.target.checked;
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

        // Matrix configuration
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="configure-matrix"]')) {
                this.showMatrixConfigDialog(step);
            }
        });
    }

    setupActionButtonListeners(step, container) {
        container.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;
            
            switch (action) {
                case 'add-agent-tag':
                    this.showAddAgentTagDialog(step);
                    break;
                case 'add-env-var':
                    this.showAddEnvVarDialog(step);
                    break;
                case 'add-plugin':
                    this.showPluginCatalog(step);
                    break;
                case 'remove-agent-tag':
                    const agentKey = e.target.closest('[data-action="remove-agent-tag"]').dataset.key;
                    if (step.properties.agents) {
                        delete step.properties.agents[agentKey];
                        this.renderProperties();
                    }
                    break;
                case 'remove-env-var':
                    const envKey = e.target.closest('[data-action="remove-env-var"]').dataset.key;
                    if (step.properties.env) {
                        delete step.properties.env[envKey];
                        this.renderProperties();
                    }
                    break;
                case 'remove-plugin':
                    const pluginKey = e.target.closest('[data-action="remove-plugin"]').dataset.plugin;
                    if (step.properties.plugins) {
                        delete step.properties.plugins[pluginKey];
                        this.renderProperties();
                        this.renderPipeline();
                    }
                    break;
            }
        });
    }

    // Dialog methods - ALL PRESERVED
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

    showPluginCatalog(step) {
        // Show plugin catalog modal
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.style.display = 'block';
            // Store current step for plugin addition
            window.currentStepForPlugin = step;
        } else {
            // Fallback to selector dialog
            this.showPluginSelector(step);
        }
    }

    // Pipeline operations
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
            console.log('🧹 Pipeline cleared');
        }
    }

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

    getPipelineConfig() {
        return {
            steps: this.steps.map(step => this.convertStepToYAML(step))
        };
    }

    buildStepConfig(step) {
        const config = {};
        
        // Copy all non-empty properties
        Object.entries(step.properties).forEach(([key, value]) => {
            if (value !== null && value !== '' && value !== undefined) {
                if (typeof value === 'object' && Object.keys(value).length === 0) {
                    // Skip empty objects
                    return;
                }
                config[key] = value;
            }
        });
        
        // Handle step-specific transformations
        switch (step.type) {
            case 'wait':
                return 'wait';
            case 'block':
                config.block = step.properties.prompt || 'Block';
                delete config.prompt;
                break;
            case 'input':
                config.input = step.properties.prompt || 'Input';
                delete config.prompt;
                break;
            case 'annotation':
                config.annotate = {
                    body: step.properties.body || '',
                    style: step.properties.style || 'info',
                    context: step.properties.context || 'default'
                };
                if (step.properties.append) config.annotate.append = true;
                break;
            case 'notify':
                config.notify = [];
                if (step.properties.email) {
                    config.notify.push({ email: step.properties.email });
                }
                if (step.properties.slack) {
                    config.notify.push({ slack: step.properties.slack });
                }
                if (step.properties.webhook) {
                    config.notify.push({ webhook: step.properties.webhook });
                }
                if (step.properties.pagerduty) {
                    config.notify.push({ pagerduty_change_event: step.properties.pagerduty });
                }
                break;
            case 'plugin':
                // Plugin steps only have plugins
                break;
            case 'pipeline-upload':
                config.command = `buildkite-agent pipeline upload ${step.properties.pipeline || '.buildkite/pipeline.yml'}`;
                if (step.properties.replace) config.command += ' --replace';
                break;
        }
        
        return config;
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
        
        if (step.properties.matrix && Object.keys(step.properties.matrix).length > 0) {
            yamlStep.matrix = step.properties.matrix;
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

    // Template loading - COMPLETE FROM BOTH VERSIONS
    loadTemplate(templateName, index = -1) {
        console.log(`📄 Loading template: ${templateName}`);
        
        const templates = {
            'ci-cd': [
                { type: 'command', properties: { label: 'Checkout', command: 'git checkout $BUILDKITE_COMMIT', key: 'checkout' } },
                { type: 'command', properties: { label: 'Install Dependencies', command: 'npm install', key: 'install' } },
                { type: 'command', properties: { label: 'Run Tests', command: 'npm test', key: 'test' } },
                { type: 'wait' },
                { type: 'command', properties: { label: 'Build', command: 'npm run build', key: 'build' } },
                { type: 'command', properties: { label: 'Deploy', command: 'npm run deploy', if: 'build.branch == "main"' } }
            ],
            'docker': [
                { type: 'command', properties: { 
                    label: 'Build Docker Image', 
                    command: 'docker build -t myapp:$BUILDKITE_BUILD_NUMBER .',
                    plugins: { 'docker': { image: 'myapp:$BUILDKITE_BUILD_NUMBER' } }
                }},
                { type: 'command', properties: { label: 'Push to Registry', command: 'docker push myapp:$BUILDKITE_BUILD_NUMBER' } }
            ],
            'node': [
                { type: 'command', properties: { label: 'Install', command: 'npm ci' } },
                { type: 'command', properties: { label: 'Lint', command: 'npm run lint' } },
                { type: 'command', properties: { label: 'Test', command: 'npm test' } },
                { type: 'command', properties: { label: 'Build', command: 'npm run build' } }
            ],
            'python': [
                { type: 'command', properties: { label: 'Install', command: 'pip install -r requirements.txt' } },
                { type: 'command', properties: { label: 'Lint', command: 'pylint src/' } },
                { type: 'command', properties: { label: 'Test', command: 'pytest' } }
            ],
            'matrix': [
                { type: 'command', properties: { 
                    label: 'Matrix Test', 
                    command: 'npm test',
                    matrix: {
                        'node': ['14', '16', '18'],
                        'os': ['linux', 'windows', 'macos']
                    }
                }}
            ],
            'basic-ci': [
                { type: 'command', properties: { label: 'Install Dependencies', command: 'npm install', key: 'install' } },
                { type: 'command', properties: { label: 'Run Tests', command: 'npm test', key: 'test' } },
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
        
        const template = templates[templateName];
        if (!template) {
            console.warn(`Template not found: ${templateName}`);
            return;
        }
        
        if (this.steps.length > 0 && index === -1) {
            if (!confirm('This will replace your current pipeline. Continue?')) {
                return;
            }
            this.steps = [];
            this.stepCounter = 0;
        }
        
        // Add template steps
        template.forEach(stepConfig => {
            const step = this.addStep(stepConfig.type, index);
            if (step && stepConfig.properties) {
                Object.assign(step.properties, stepConfig.properties);
            }
            if (index >= 0) index++;
        });
        
        this.renderPipeline();
        this.renderProperties();
        
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification(`Template "${templateName}" loaded`, 'success');
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
        } else {
            const modal = document.getElementById('yaml-export-modal');
            if (modal && window.yamlGenerator) {
                const config = this.getPipelineConfig();
                const yaml = window.yamlGenerator.generate(config);
                
                // Update modal content
                const output = document.getElementById('export-yaml-output');
                if (output) {
                    output.innerHTML = window.yamlGenerator.prettify(yaml);
                }
                
                // Update validation status
                const validation = window.yamlGenerator.validate(yaml);
                const statusDiv = document.getElementById('export-validation-status');
                if (statusDiv) {
                    if (validation.valid) {
                        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Valid Buildkite YAML';
                        statusDiv.className = 'validation-success';
                    } else {
                        statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Validation issues: ' + validation.issues.join(', ');
                        statusDiv.className = 'validation-error';
                    }
                }
                
                // Show modal
                modal.style.display = 'block';
                modal.classList.remove('hidden');
            }
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

    // Plugin catalog methods
    showPluginCatalogModal() {
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

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // Still loading, wait for DOMContentLoaded
} else {
    // DOM is already ready
    console.log('🚀 Initializing Pipeline Builder (DOM already loaded)...');
    window.pipelineBuilder = new PipelineBuilder();
}

// Export for debugging
console.log('🎉 Pipeline Builder loaded successfully!');
console.log('📚 Available in console: window.pipelineBuilder');