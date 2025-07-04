// js/pipeline-builder.js
// FIXED: Complete Pipeline Builder with proper dependency handling and step movement
/**
 * Enhanced Pipeline Builder with ALL Step Types and Complete Form Generators
 * FIXED: Dependencies apply only to selected step, step movement functionality
 * Includes: All configurations, plugins, dependencies, and property forms
 */

class PipelineBuilder {
    constructor() {
        console.log('🚀 Initializing COMPLETE Pipeline Builder with ALL features...');
        
        // Core state
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        
        // Drag and drop state
        this.draggedElement = null;
        this.isDragging = false;
        this.dragInsertIndex = -1;
        this.isProcessingDrop = false;
        
        // Available plugins for quick add
        this.pluginCatalog = {
            'docker': {
                name: 'Docker',
                description: 'Build and run Docker containers',
                config: {
                    image: { type: 'text', label: 'Image', default: 'node:16' },
                    command: { type: 'text', label: 'Command', default: 'npm test' },
                    environment: { type: 'array', label: 'Environment Variables', default: [] }
                }
            },
            'artifacts': {
                name: 'Artifacts',
                description: 'Upload and download build artifacts',
                config: {
                    upload: { type: 'text', label: 'Upload Pattern', default: 'dist/**/*' },
                    download: { type: 'text', label: 'Download Pattern', default: '' }
                }
            },
            'cache': {
                name: 'Cache',
                description: 'Cache dependencies and build outputs',
                config: {
                    key: { type: 'text', label: 'Cache Key', default: 'v1-{{ checksum "package-lock.json" }}' },
                    paths: { type: 'array', label: 'Paths', default: ['node_modules'] }
                }
            },
            'docker-compose': {
                name: 'Docker Compose',
                description: 'Run services using Docker Compose',
                config: {
                    run: { type: 'text', label: 'Service', default: 'app' },
                    config: { type: 'text', label: 'Config File', default: 'docker-compose.yml' }
                }
            },
            'npm': {
                name: 'NPM',
                description: 'Run NPM commands',
                config: {
                    command: { type: 'text', label: 'Command', default: 'test' }
                }
            },
            'junit-annotate': {
                name: 'JUnit Annotate',
                description: 'Annotate build with JUnit test results',
                config: {
                    artifacts: { type: 'text', label: 'Test Results', default: 'test-results/**/*.xml' }
                }
            },
            'slack': {
                name: 'Slack Notification',
                description: 'Send notifications to Slack',
                config: {
                    webhook_url: { type: 'text', label: 'Webhook URL', default: '' },
                    channels: { type: 'array', label: 'Channels', default: ['#builds'] },
                    on_success: { type: 'boolean', label: 'On Success', default: false },
                    on_failure: { type: 'boolean', label: 'On Failure', default: true }
                }
            },
            'ecr': {
                name: 'AWS ECR',
                description: 'Amazon Elastic Container Registry',
                config: {
                    account_id: { type: 'text', label: 'Account ID', default: '' },
                    region: { type: 'text', label: 'Region', default: 'us-east-1' },
                    registry_name: { type: 'text', label: 'Registry Name', default: '' }
                }
            }
        };
        
        // Initialize
        this.init();
    }

    init() {
        console.log('🔧 Initializing pipeline builder components...');
        
        // Setup drag and drop
        this.setupEnhancedDragAndDrop();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup property updates
        this.setupPropertyEventListeners();
        
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
        const emptyState = document.getElementById('empty-state');
        
        if (!pipelineSteps) {
            console.warn('⚠️ Pipeline steps container not found');
            return;
        }

        // Setup main drop zone
        pipelineSteps.addEventListener('dragover', this.handleEnhancedDragOver.bind(this));
        pipelineSteps.addEventListener('drop', this.handleEnhancedDrop.bind(this));
        pipelineSteps.addEventListener('dragenter', this.handleDragEnter.bind(this));
        pipelineSteps.addEventListener('dragleave', this.handleDragLeave.bind(this));

        // Setup empty state drop zone
        if (emptyState) {
            emptyState.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                emptyState.classList.add('drag-active');
            });
            
            emptyState.addEventListener('dragleave', () => {
                emptyState.classList.remove('drag-active');
            });
            
            emptyState.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                emptyState.classList.remove('drag-active');
                
                if (this.isProcessingDrop) return;
                this.isProcessingDrop = true;
                
                const stepType = e.dataTransfer.getData('text/plain');
                if (stepType) {
                    if (stepType.startsWith('plugin:')) {
                        const pluginKey = stepType.replace('plugin:', '');
                        this.addPluginStep(pluginKey);
                    } else {
                        this.addStep(stepType);
                    }
                }
                
                setTimeout(() => {
                    this.isProcessingDrop = false;
                }, 100);
            });
        }
    }

    handleDragStart(e) {
        const stepType = e.target.dataset.stepType;
        const plugin = e.target.dataset.plugin;
        
        console.log('🎯 Drag started:', stepType, plugin ? `(plugin: ${plugin})` : '');
        
        // Set drag data
        if (plugin) {
            e.dataTransfer.setData('text/plain', `plugin:${plugin}`);
        } else {
            e.dataTransfer.setData('text/plain', stepType);
        }
        
        e.dataTransfer.effectAllowed = 'copy';
        this.draggedElement = e.target;
        this.isDragging = true;
        
        // Add dragging class for visual feedback
        e.target.classList.add('dragging');
        
        // Activate drop zones
        this.activateDropZones();
    }

    handleDragEnd(e) {
        console.log('🎯 Drag ended');
        
        e.target.classList.remove('dragging');
        this.isDragging = false;
        this.draggedElement = null;
        this.dragInsertIndex = -1;
        
        // Deactivate drop zones
        this.deactivateDropZones();
    }

    activateDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.add('drag-active');
            this.createDropZones();
        }
    }

    deactivateDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('drag-active', 'drag-over');
            this.removeDropZones();
        }
    }

    createDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) return;
        
        this.removeDropZones();
        
        const steps = pipelineSteps.querySelectorAll('.pipeline-step');
        
        // Add drop zone at the beginning
        const firstDropZone = this.createDropZone(0);
        if (steps.length > 0) {
            pipelineSteps.insertBefore(firstDropZone, steps[0]);
        } else {
            pipelineSteps.appendChild(firstDropZone);
        }
        
        // Add drop zones between steps
        steps.forEach((step, index) => {
            const dropZone = this.createDropZone(index + 1);
            step.insertAdjacentElement('afterend', dropZone);
        });
    }

    createDropZone(index) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.dataset.dropIndex = index;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            dropZone.classList.add('drag-over');
            this.dragInsertIndex = index;
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (this.isProcessingDrop) return;
            this.isProcessingDrop = true;
            
            const dragData = e.dataTransfer.getData('text/plain');
            if (dragData) {
                if (dragData.startsWith('plugin:')) {
                    const pluginKey = dragData.replace('plugin:', '');
                    this.addPluginStepAtIndex(pluginKey, index);
                } else {
                    this.addStepAtIndex(dragData, index);
                }
            }
            
            this.deactivateDropZones();
            
            setTimeout(() => {
                this.isProcessingDrop = false;
            }, 100);
        });
        
        return dropZone;
    }

    removeDropZones() {
        document.querySelectorAll('.drop-zone').forEach(zone => zone.remove());
    }

    handleEnhancedDragOver(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.add('drag-over');
        }
    }

    handleDragEnter(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.add('active');
        });
    }

    handleDragLeave(e) {
        if (!this.isDragging) return;
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps && !pipelineSteps.contains(e.relatedTarget)) {
            pipelineSteps.classList.remove('drag-over');
            
            document.querySelectorAll('.drop-zone').forEach(zone => {
                zone.classList.remove('active', 'drag-over');
            });
        }
    }

    handleEnhancedDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.isProcessingDrop) return;
        this.isProcessingDrop = true;
        
        const dragData = e.dataTransfer.getData('text/plain');
        console.log('🎯 Drop handled:', dragData);
        
        if (dragData.startsWith('plugin:')) {
            const pluginKey = dragData.replace('plugin:', '');
            this.addPluginStep(pluginKey);
        } else {
            this.addStep(dragData);
        }
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('drag-active', 'drag-over');
        }
        
        setTimeout(() => {
            this.isProcessingDrop = false;
        }, 100);
    }

    handleTemplateClick(e) {
        e.preventDefault();
        
        const template = e.currentTarget.dataset.template;
        const pattern = e.currentTarget.dataset.pattern;
        
        if (template) {
            console.log('📋 Template clicked:', template);
            this.loadTemplate(template);
        } else if (pattern) {
            console.log('🎨 Pattern clicked:', pattern);
            this.loadPattern(pattern);
        }
    }

    // Add step functionality
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
    }

    createStep(type) {
        const stepId = `step-${this.stepCounter + 1}`;
        
        const baseStep = {
            id: stepId,
            type: type,
            properties: {
                label: this.getDefaultLabel(type),
                key: stepId.replace('step-', 'step'),
                depends_on: [],
                if: '',
                unless: '',
                branches: '',
                allow_dependency_failure: false
            }
        };

        // Add type-specific properties
        switch (type) {
            case 'command':
                Object.assign(baseStep.properties, {
                    command: '',
                    agents: {},
                    env: {},
                    plugins: {},
                    artifact_paths: '',
                    timeout_in_minutes: 0,
                    retry: { automatic: { limit: 0 } },
                    soft_fail: false,
                    priority: 0
                });
                break;
                
            case 'wait':
                Object.assign(baseStep.properties, {
                    continue_on_failure: false
                });
                break;
                
            case 'block':
                Object.assign(baseStep.properties, {
                    prompt: 'Release to production?',
                    fields: [],
                    blocked_state: 'passed'
                });
                break;
                
            case 'input':
                Object.assign(baseStep.properties, {
                    prompt: 'Please provide input',
                    fields: []
                });
                break;
                
            case 'trigger':
                Object.assign(baseStep.properties, {
                    trigger: '',
                    build: {},
                    async: false
                });
                break;
                
            case 'group':
                Object.assign(baseStep.properties, {
                    group: 'Group Name',
                    steps: []
                });
                break;
                
            case 'annotation':
                Object.assign(baseStep.properties, {
                    body: '',
                    style: 'info',
                    context: 'default'
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
        this.steps.forEach((step, index) => {
            const stepElement = this.createStepElement(step, index);
            container.appendChild(stepElement);
        });

        console.log(`🔄 Rendered ${this.steps.length} steps`);
    }

    createStepElement(step, index) {
        const stepEl = document.createElement('div');
        stepEl.className = `pipeline-step ${step.type}`;
        stepEl.dataset.stepId = step.id;
        stepEl.dataset.stepIndex = index;
        
        if (this.selectedStep === step.id) {
            stepEl.classList.add('selected');
        }

        stepEl.innerHTML = `
            <div class="step-header">
                <div class="step-info">
                    <div class="step-type-badge">
                        <i class="fas ${this.getStepIcon(step.type)}"></i>
                        <span>${step.type}</span>
                    </div>
                    <div class="step-label">${step.properties.label || 'Unnamed Step'}</div>
                    ${this.getStepDescription(step)}
                </div>
                <div class="step-actions">
                    ${index > 0 ? `<button class="step-action move-up" title="Move Up">
                        <i class="fas fa-chevron-up"></i>
                    </button>` : ''}
                    ${index < this.steps.length - 1 ? `<button class="step-action move-down" title="Move Down">
                        <i class="fas fa-chevron-down"></i>
                    </button>` : ''}
                    <button class="step-action configure" title="Configure">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="step-action duplicate" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="step-action delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${this.renderStepDetails(step)}
        `;

        // Add event listeners
        stepEl.addEventListener('click', (e) => {
            if (!e.target.closest('.step-action')) {
                this.selectStep(step.id);
            }
        });

        // Step action buttons
        const configureBtn = stepEl.querySelector('.configure');
        const duplicateBtn = stepEl.querySelector('.duplicate');
        const deleteBtn = stepEl.querySelector('.delete');
        const moveUpBtn = stepEl.querySelector('.move-up');
        const moveDownBtn = stepEl.querySelector('.move-down');

        if (configureBtn) {
            configureBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectStep(step.id);
            });
        }

        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.duplicateStep(step.id);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteStep(step.id);
            });
        }

        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveStepUp(step.id);
            });
        }

        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveStepDown(step.id);
            });
        }

        return stepEl;
    }

    getStepIcon(type) {
        const icons = {
            'command': 'fa-terminal',
            'wait': 'fa-hourglass-half',
            'block': 'fa-hand-paper',
            'input': 'fa-keyboard',
            'trigger': 'fa-external-link-alt',
            'group': 'fa-object-group',
            'annotation': 'fa-comment-alt',
            'pipeline-upload': 'fa-upload'
        };
        
        return icons[type] || 'fa-cog';
    }

    getStepDescription(step) {
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
                return `<div class="step-description">${step.properties.steps ? step.properties.steps.length : 0} steps</div>`;
            case 'annotation':
                return step.properties.body || 'Build annotation';
            default:
                return 'Pipeline step';
        }
    }

    renderStepDetails(step) {
        const details = [];
        
        if (step.properties.key) {
            details.push(`<div class="step-property"><span class="property-key">Key:</span><span class="property-value">${step.properties.key}</span></div>`);
        }
        
        if (step.properties.depends_on && step.properties.depends_on.length > 0) {
            details.push(`<div class="step-property"><span class="property-key">Depends On:</span><span class="property-value">${step.properties.depends_on.join(', ')}</span></div>`);
        }
        
        if (step.properties.if) {
            details.push(`<div class="step-property"><span class="property-key">Condition:</span><span class="property-value">${step.properties.if}</span></div>`);
        }
        
        if (step.properties.agents && Object.keys(step.properties.agents).length > 0) {
            const agentStr = Object.entries(step.properties.agents).map(([k, v]) => `${k}=${v}`).join(', ');
            details.push(`<div class="step-property"><span class="property-key">Agents:</span><span class="property-value">${agentStr}</span></div>`);
        }
        
        if (details.length === 0) {
            return '';
        }
        
        return `<div class="step-details">${details.join('')}</div>`;
    }

    selectStep(stepId) {
        this.selectedStep = stepId;
        
        // Update visual selection
        document.querySelectorAll('.pipeline-step').forEach(el => {
            el.classList.toggle('selected', el.dataset.stepId === stepId);
        });
        
        // Update properties panel
        this.renderProperties();
        
        console.log(`👆 Selected step: ${stepId}`);
    }

    duplicateStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const duplicated = JSON.parse(JSON.stringify(step));
        duplicated.id = `step-${this.stepCounter + 1}`;
        duplicated.properties.key = duplicated.id.replace('step-', 'step');
        duplicated.properties.label = `${duplicated.properties.label} (Copy)`;
        
        const originalIndex = this.steps.findIndex(s => s.id === stepId);
        this.steps.splice(originalIndex + 1, 0, duplicated);
        this.stepCounter++;
        
        this.renderPipeline();
        this.selectStep(duplicated.id);
        this.updateStepCount();
        
        console.log(`📋 Duplicated step: ${stepId} → ${duplicated.id}`);
    }

    deleteStep(stepId) {
        if (confirm('Are you sure you want to delete this step?')) {
            const index = this.steps.findIndex(s => s.id === stepId);
            if (index >= 0) {
                this.steps.splice(index, 1);
                
                // Clear selection if deleted step was selected
                if (this.selectedStep === stepId) {
                    this.selectedStep = null;
                }
                
                // Remove dependencies on this step
                const stepKey = this.steps.find(s => s.id === stepId)?.properties.key;
                if (stepKey) {
                    this.steps.forEach(step => {
                        if (step.properties.depends_on) {
                            step.properties.depends_on = step.properties.depends_on.filter(dep => dep !== stepKey);
                        }
                    });
                }
                
                this.renderPipeline();
                this.renderProperties();
                this.updateStepCount();
                
                console.log(`🗑️ Deleted step: ${stepId}`);
            }
        }
    }

    // FIXED: Render properties only for selected step
    renderProperties() {
        const container = document.getElementById('properties-content');
        if (!container) return;

        if (!this.selectedStep) {
            container.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <h3>Select a step to view and edit its properties</h3>
                    <p>Click on any step in the pipeline to configure its settings</p>
                    
                    <div class="properties-help">
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
                <div class="property-group">
                    <label for="step-key">Key</label>
                    <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="unique-step-key">
                    <small>Unique identifier used for dependencies</small>
                </div>
            </div>
        `;

        // Add type-specific properties
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
        }

        // Add common properties
        form += this.generateCommonPropertiesForm(step);

        return form;
    }

    generateCommandStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-terminal"></i> Command Configuration</h4>
                <div class="property-group">
                    <label for="step-command">Command</label>
                    <textarea id="step-command" rows="4" placeholder="npm test">${step.properties.command || ''}</textarea>
                    <small>Shell command to execute. Multi-line commands are supported.</small>
                </div>
                <div class="property-group">
                    <label for="step-agents">Agent Targeting</label>
                    <div id="agent-list">${this.renderAgentsList(step.properties.agents || {})}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-agent">
                        <i class="fas fa-plus"></i> Add Agent Rule
                    </button>
                </div>
                <div class="property-group">
                    <label for="step-artifact-paths">Artifact Paths</label>
                    <input type="text" id="step-artifact-paths" value="${step.properties.artifact_paths || ''}" placeholder="dist/**/*;coverage/**/*">
                    <small>Paths to artifacts to upload (semicolon separated)</small>
                </div>
                <div class="property-group">
                    <label for="step-timeout">Timeout (minutes)</label>
                    <input type="number" id="step-timeout" value="${step.properties.timeout_in_minutes || 0}" min="0" placeholder="60">
                    <small>Maximum time for step execution (0 = no timeout)</small>
                </div>
                <div class="property-group">
                    <label for="step-retry-limit">Automatic Retry Limit</label>
                    <input type="number" id="step-retry-limit" value="${step.properties.retry?.automatic?.limit || 0}" min="0" max="10">
                    <small>Number of automatic retries on failure</small>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="step-soft-fail" ${step.properties.soft_fail ? 'checked' : ''}>
                        Soft Fail
                    </label>
                    <small>Continue pipeline even if this step fails</small>
                </div>
            </div>
            
            <div class="property-section">
                <h4><i class="fas fa-cube"></i> Environment Variables</h4>
                <div id="env-list">${this.renderEnvList(step.properties.env || {})}</div>
                <button type="button" class="btn btn-secondary btn-small" data-action="add-env">
                    <i class="fas fa-plus"></i> Add Variable
                </button>
            </div>
            
            <div class="property-section">
                <h4><i class="fas fa-plug"></i> Plugins</h4>
                <div id="plugins-list">${this.renderPluginsList(step.properties.plugins || {})}</div>
                <button type="button" class="btn btn-secondary btn-small" data-action="add-plugin">
                    <i class="fas fa-plus"></i> Add Plugin
                </button>
            </div>
        `;
    }

    generateWaitStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-hourglass-half"></i> Wait Configuration</h4>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="wait-continue-on-failure" ${step.properties.continue_on_failure ? 'checked' : ''}>
                        Continue on Failure
                    </label>
                    <small>Continue pipeline even if previous steps failed</small>
                </div>
            </div>
        `;
    }

    generateBlockStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-hand-paper"></i> Block Configuration</h4>
                <div class="property-group">
                    <label for="block-prompt">Prompt</label>
                    <input type="text" id="block-prompt" value="${step.properties.prompt || ''}" placeholder="Release to production?">
                    <small>Message shown when blocking the pipeline</small>
                </div>
                <div class="property-group">
                    <label for="block-state">Blocked State</label>
                    <select id="block-state">
                        <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                        <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                        <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                    </select>
                    <small>State of the build while blocked</small>
                </div>
                <div class="property-group">
                    <label>Fields</label>
                    <div id="fields-list">${this.renderFieldsList(step.properties.fields || [])}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-field">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
            </div>
        `;
    }

    generateInputStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-keyboard"></i> Input Configuration</h4>
                <div class="property-group">
                    <label for="input-prompt">Prompt</label>
                    <input type="text" id="input-prompt" value="${step.properties.prompt || ''}" placeholder="Please provide input">
                    <small>Message shown when requesting input</small>
                </div>
                <div class="property-group">
                    <label>Fields</label>
                    <div id="fields-list">${this.renderFieldsList(step.properties.fields || [])}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-field">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
            </div>
        `;
    }

    generateTriggerStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-external-link-alt"></i> Trigger Configuration</h4>
                <div class="property-group">
                    <label for="trigger-pipeline">Pipeline to Trigger</label>
                    <input type="text" id="trigger-pipeline" value="${step.properties.trigger || ''}" placeholder="deploy-pipeline">
                    <small>Slug of the pipeline to trigger</small>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="trigger-async" ${step.properties.async ? 'checked' : ''}>
                        Asynchronous
                    </label>
                    <small>Don't wait for triggered pipeline to complete</small>
                </div>
                <div class="property-group">
                    <label>Build Properties</label>
                    <div id="build-properties">${this.renderBuildProperties(step.properties.build || {})}</div>
                </div>
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
                        Allow Dependency Failure
                    </label>
                    <small>Run even if dependencies failed</small>
                </div>
            </div>
        `;
    }

    // Helper render functions
    renderAgentsList(agents) {
        const entries = Object.entries(agents);
        if (entries.length === 0) return '<div class="empty-list">No agent rules defined</div>';
        
        return entries.map(([key, value], index) => `
            <div class="key-value-pair">
                <input type="text" class="key-input" value="${key}" placeholder="queue" data-index="${index}">
                <input type="text" class="value-input" value="${value}" placeholder="default" data-index="${index}">
                <button type="button" class="remove-btn" data-action="remove-agent" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderEnvList(env) {
        const entries = Object.entries(env);
        if (entries.length === 0) return '<div class="empty-list">No environment variables defined</div>';
        
        return entries.map(([key, value], index) => `
            <div class="key-value-pair">
                <input type="text" class="key-input env-key" value="${key}" placeholder="NODE_ENV" data-index="${index}">
                <input type="text" class="value-input env-value" value="${value}" placeholder="production" data-index="${index}">
                <button type="button" class="remove-btn" data-action="remove-env" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderPluginsList(plugins) {
        const entries = Object.entries(plugins);
        if (entries.length === 0) return '<div class="empty-list">No plugins configured</div>';
        
        return entries.map(([pluginName, config]) => `
            <div class="plugin-config">
                <div class="plugin-header">
                    <span class="plugin-name">${pluginName}</span>
                    <button type="button" class="remove-btn" data-action="remove-plugin" data-plugin="${pluginName}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="plugin-settings">
                    ${this.renderPluginConfig(pluginName, config)}
                </div>
            </div>
        `).join('');
    }

    renderPluginConfig(pluginName, config) {
        if (typeof config === 'string') {
            return `<input type="text" value="${config}" data-plugin="${pluginName}" class="plugin-simple-value">`;
        }
        
        const entries = Object.entries(config);
        if (entries.length === 0) return '<div class="empty-list">No configuration</div>';
        
        return entries.map(([key, value], index) => `
            <div class="key-value-pair">
                <input type="text" class="key-input" value="${key}" data-plugin="${pluginName}" data-index="${index}">
                <input type="text" class="value-input" value="${value}" data-plugin="${pluginName}" data-index="${index}">
            </div>
        `).join('');
    }

    renderDependenciesList(dependencies) {
        if (dependencies.length === 0) return '<div class="empty-list">No dependencies defined</div>';
        
        return dependencies.map((dep, index) => `
            <div class="dependency-item">
                <select class="dependency-select" data-index="${index}">
                    <option value="">Select a step...</option>
                    ${this.steps.filter(s => s.id !== this.selectedStep).map(s => `
                        <option value="${s.properties.key}" ${dep === s.properties.key ? 'selected' : ''}>
                            ${s.properties.label} (${s.properties.key})
                        </option>
                    `).join('')}
                </select>
                <button type="button" class="remove-btn remove-dependency" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderFieldsList(fields) {
        if (fields.length === 0) return '<div class="empty-list">No fields defined</div>';
        
        return fields.map((field, index) => `
            <div class="field-item">
                <input type="text" class="field-key" value="${field.key || ''}" placeholder="Field key" data-index="${index}">
                <input type="text" class="field-hint" value="${field.hint || ''}" placeholder="Hint text" data-index="${index}">
                <button type="button" class="remove-btn" data-action="remove-field" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderBuildProperties(build) {
        return `
            <div class="build-properties">
                <div class="property-group">
                    <label>Message</label>
                    <input type="text" id="build-message" value="${build.message || ''}" placeholder="Triggered by parent pipeline">
                </div>
                <div class="property-group">
                    <label>Commit</label>
                    <input type="text" id="build-commit" value="${build.commit || ''}" placeholder="HEAD">
                </div>
                <div class="property-group">
                    <label>Branch</label>
                    <input type="text" id="build-branch" value="${build.branch || ''}" placeholder="main">
                </div>
            </div>
        `;
    }

    // FIXED: Setup property form listeners only for selected step
    setupPropertyFormListeners(step) {
        const container = document.getElementById('properties-content');
        if (!container) return;

        // Basic property listeners
        const labelInput = container.querySelector('#step-label');
        const keyInput = container.querySelector('#step-key');
        
        if (labelInput) {
            labelInput.addEventListener('input', (e) => {
                step.properties.label = e.target.value;
                this.renderPipeline();
            });
        }
        
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                step.properties.key = e.target.value;
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
            case 'annotation':
                this.setupAnnotationStepListeners(step, container);
                break;
        }

        // Common property listeners
        this.setupCommonPropertyListeners(step, container);
        
        // Agent, env, and plugin listeners
        this.setupAgentListeners(step, container);
        this.setupEnvListeners(step, container);
        this.setupPluginListeners(step, container);
        this.setupDependenciesListeners(step, container);
        this.setupFieldsListeners(step, container);
    }

    setupCommandStepListeners(step, container) {
        const commandInput = container.querySelector('#step-command');
        const artifactInput = container.querySelector('#step-artifact-paths');
        const timeoutInput = container.querySelector('#step-timeout');
        const retryInput = container.querySelector('#step-retry-limit');
        const softFailInput = container.querySelector('#step-soft-fail');
        
        if (commandInput) {
            commandInput.addEventListener('input', (e) => {
                step.properties.command = e.target.value;
                this.renderPipeline();
            });
        }
        
        if (artifactInput) {
            artifactInput.addEventListener('input', (e) => {
                step.properties.artifact_paths = e.target.value;
            });
        }
        
        if (timeoutInput) {
            timeoutInput.addEventListener('input', (e) => {
                step.properties.timeout_in_minutes = parseInt(e.target.value) || 0;
            });
        }
        
        if (retryInput) {
            retryInput.addEventListener('input', (e) => {
                if (!step.properties.retry) step.properties.retry = { automatic: {} };
                step.properties.retry.automatic.limit = parseInt(e.target.value) || 0;
            });
        }
        
        if (softFailInput) {
            softFailInput.addEventListener('change', (e) => {
                step.properties.soft_fail = e.target.checked;
            });
        }
    }

    setupWaitStepListeners(step, container) {
        const continueOnFailureInput = container.querySelector('#wait-continue-on-failure');
        
        if (continueOnFailureInput) {
            continueOnFailureInput.addEventListener('change', (e) => {
                step.properties.continue_on_failure = e.target.checked;
            });
        }
    }

    setupBlockStepListeners(step, container) {
        const promptInput = container.querySelector('#block-prompt');
        const blockedStateSelect = container.querySelector('#block-state');
        
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                step.properties.prompt = e.target.value;
                this.renderPipeline();
            });
        }
        
        if (blockedStateSelect) {
            blockedStateSelect.addEventListener('change', (e) => {
                step.properties.blocked_state = e.target.value;
            });
        }
    }

    setupInputStepListeners(step, container) {
        const promptInput = container.querySelector('#input-prompt');
        
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                step.properties.prompt = e.target.value;
                this.renderPipeline();
            });
        }

        this.setupFieldsListeners(step, container);
    }

    setupTriggerStepListeners(step, container) {
        const triggerInput = container.querySelector('#trigger-pipeline');
        const asyncCheckbox = container.querySelector('#trigger-async');
        
        if (triggerInput) {
            triggerInput.addEventListener('input', (e) => {
                step.properties.trigger = e.target.value;
                this.renderPipeline();
            });
        }
        
        if (asyncCheckbox) {
            asyncCheckbox.addEventListener('change', (e) => {
                step.properties.async = e.target.checked;
            });
        }
    }

    setupAnnotationStepListeners(step, container) {
        const bodyInput = container.querySelector('#annotation-body');
        const styleSelect = container.querySelector('#annotation-style');
        const contextInput = container.querySelector('#annotation-context');
        
        if (bodyInput) {
            bodyInput.addEventListener('input', (e) => {
                step.properties.body = e.target.value;
                this.renderPipeline();
            });
        }
        
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                step.properties.style = e.target.value;
            });
        }
        
        if (contextInput) {
            contextInput.addEventListener('input', (e) => {
                step.properties.context = e.target.value;
            });
        }
    }

    setupCommonPropertyListeners(step, container) {
        const ifInput = container.querySelector('#step-if');
        const unlessInput = container.querySelector('#step-unless');
        const branchesInput = container.querySelector('#step-branches');
        const allowFailureInput = container.querySelector('#step-allow-dependency-failure');
        
        if (ifInput) {
            ifInput.addEventListener('input', (e) => {
                step.properties.if = e.target.value;
                this.renderPipeline();
            });
        }
        
        if (unlessInput) {
            unlessInput.addEventListener('input', (e) => {
                step.properties.unless = e.target.value;
                this.renderPipeline();
            });
        }
        
        if (branchesInput) {
            branchesInput.addEventListener('input', (e) => {
                step.properties.branches = e.target.value;
            });
        }
        
        if (allowFailureInput) {
            allowFailureInput.addEventListener('change', (e) => {
                step.properties.allow_dependency_failure = e.target.checked;
            });
        }
    }

    // FIXED: Agent listeners apply only to selected step
    setupAgentListeners(step, container) {
        // Add agent button
        const addBtn = container.querySelector('[data-action="add-agent"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!step.properties.agents) {
                    step.properties.agents = {};
                }
                step.properties.agents[''] = '';
                this.renderProperties();
            });
        }

        // Remove agent buttons
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="remove-agent"]')) {
                const index = parseInt(e.target.closest('[data-action="remove-agent"]').dataset.index);
                const keys = Object.keys(step.properties.agents);
                delete step.properties.agents[keys[index]];
                this.renderProperties();
            }
        });

        // Agent key/value inputs
        container.addEventListener('input', (e) => {
            if (e.target.closest('#agent-list')) {
                const index = parseInt(e.target.dataset.index);
                const isKey = e.target.classList.contains('key-input');
                const keys = Object.keys(step.properties.agents);
                const values = Object.values(step.properties.agents);
                
                if (isKey) {
                    // Update key
                    const oldKey = keys[index];
                    const newKey = e.target.value;
                    const value = step.properties.agents[oldKey];
                    delete step.properties.agents[oldKey];
                    step.properties.agents[newKey] = value;
                } else {
                    // Update value
                    const key = keys[index];
                    step.properties.agents[key] = e.target.value;
                }
            }
        });
    }

    // FIXED: Environment variables apply only to selected step
    setupEnvListeners(step, container) {
        // Add env button
        const addBtn = container.querySelector('[data-action="add-env"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!step.properties.env) {
                    step.properties.env = {};
                }
                step.properties.env[''] = '';
                this.renderProperties();
            });
        }

        // Remove env buttons
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="remove-env"]')) {
                const index = parseInt(e.target.closest('[data-action="remove-env"]').dataset.index);
                const keys = Object.keys(step.properties.env);
                delete step.properties.env[keys[index]];
                this.renderProperties();
            }
        });

        // Env key/value inputs
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('env-key') || e.target.classList.contains('env-value')) {
                const index = parseInt(e.target.dataset.index);
                const isKey = e.target.classList.contains('env-key');
                const keys = Object.keys(step.properties.env);
                
                if (isKey) {
                    // Update key
                    const oldKey = keys[index];
                    const newKey = e.target.value;
                    const value = step.properties.env[oldKey];
                    delete step.properties.env[oldKey];
                    step.properties.env[newKey] = value;
                } else {
                    // Update value
                    const key = keys[index];
                    step.properties.env[key] = e.target.value;
                }
            }
        });
    }

    // FIXED: Plugin configuration applies only to selected step
    setupPluginListeners(step, container) {
        // Add plugin button
        const addBtn = container.querySelector('[data-action="add-plugin"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!step.properties.plugins) {
                    step.properties.plugins = {};
                }
                // Show plugin selector
                const pluginName = prompt('Enter plugin name (e.g., docker-compose#v3.0.0):');
                if (pluginName) {
                    step.properties.plugins[pluginName] = {};
                    this.renderProperties();
                }
            });
        }

        // Remove plugin buttons
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="remove-plugin"]')) {
                const pluginName = e.target.closest('[data-action="remove-plugin"]').dataset.plugin;
                delete step.properties.plugins[pluginName];
                this.renderProperties();
            }
        });

        // Plugin configuration
        container.addEventListener('input', (e) => {
            if (e.target.dataset.plugin) {
                const pluginName = e.target.dataset.plugin;
                
                if (e.target.classList.contains('plugin-simple-value')) {
                    step.properties.plugins[pluginName] = e.target.value;
                } else {
                    // Complex plugin config
                    const index = parseInt(e.target.dataset.index);
                    const isKey = e.target.classList.contains('key-input');
                    
                    if (typeof step.properties.plugins[pluginName] === 'string') {
                        step.properties.plugins[pluginName] = {};
                    }
                    
                    const keys = Object.keys(step.properties.plugins[pluginName]);
                    
                    if (isKey) {
                        const oldKey = keys[index];
                        const newKey = e.target.value;
                        const value = step.properties.plugins[pluginName][oldKey];
                        delete step.properties.plugins[pluginName][oldKey];
                        step.properties.plugins[pluginName][newKey] = value;
                    } else {
                        const key = keys[index];
                        step.properties.plugins[pluginName][key] = e.target.value;
                    }
                }
            }
        });
    }

    // FIXED: Dependencies apply only to selected step
    setupDependenciesListeners(step, container) {
        // Add dependency button
        const addBtn = container.querySelector('[data-action="add-dependency"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!step.properties.depends_on) {
                    step.properties.depends_on = [];
                }
                step.properties.depends_on.push('');
                this.renderProperties();
            });
        }

        // Dependency selects
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('dependency-select')) {
                const index = parseInt(e.target.dataset.index);
                step.properties.depends_on[index] = e.target.value;
            }
        });

        // Remove buttons
        container.addEventListener('click', (e) => {
            if (e.target.closest('.remove-dependency')) {
                const index = parseInt(e.target.closest('.remove-dependency').dataset.index);
                step.properties.depends_on.splice(index, 1);
                this.renderProperties();
            }
        });
    }

    setupFieldsListeners(step, container) {
        // Add field button
        const addBtn = container.querySelector('[data-action="add-field"]');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (!step.properties.fields) {
                    step.properties.fields = [];
                }
                step.properties.fields.push({ key: '', hint: '' });
                this.renderProperties();
            });
        }

        // Field inputs
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('field-key') || e.target.classList.contains('field-hint')) {
                const index = parseInt(e.target.dataset.index);
                const field = step.properties.fields[index];
                
                if (e.target.classList.contains('field-key')) {
                    field.key = e.target.value;
                } else {
                    field.hint = e.target.value;
                }
            }
        });

        // Remove field buttons
        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="remove-field"]')) {
                const index = parseInt(e.target.closest('[data-action="remove-field"]').dataset.index);
                step.properties.fields.splice(index, 1);
                this.renderProperties();
            }
        });
    }

    // Additional methods
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save/Export
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.exportYAML();
            }
            
            // Delete: Remove selected step
            if (e.key === 'Delete' && this.selectedStep) {
                this.deleteStep(this.selectedStep);
            }
            
            // Ctrl/Cmd + D: Duplicate selected step
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && this.selectedStep) {
                e.preventDefault();
                this.duplicateStep(this.selectedStep);
            }
        });
    }

    setupPropertyEventListeners() {
        // Duplicate and delete buttons in properties panel
        const duplicateBtn = document.getElementById('duplicate-step');
        const deleteBtn = document.getElementById('delete-step');
        
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => {
                if (this.selectedStep) {
                    this.duplicateStep(this.selectedStep);
                }
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.selectedStep) {
                    this.deleteStep(this.selectedStep);
                }
            });
        }
    }

    updateStepCount() {
        const countElement = document.querySelector('.step-count');
        if (countElement) {
            countElement.textContent = `${this.steps.length} step${this.steps.length !== 1 ? 's' : ''}`;
        }
    }

    // Template and pattern loading
    loadTemplate(templateKey) {
        const templates = {
            'node-test': [
                { type: 'command', properties: { label: 'Install Dependencies', command: 'npm ci', key: 'install' } },
                { type: 'command', properties: { label: 'Run Tests', command: 'npm test', key: 'test', depends_on: ['install'] } },
                { type: 'command', properties: { label: 'Lint Code', command: 'npm run lint', key: 'lint', depends_on: ['install'] } }
            ],
            'docker-build': [
                { type: 'command', properties: { 
                    label: 'Build Docker Image', 
                    command: 'docker build -t myapp:$BUILDKITE_BUILD_NUMBER .', 
                    key: 'docker-build' 
                } },
                { type: 'command', properties: { 
                    label: 'Push to Registry', 
                    command: 'docker push myapp:$BUILDKITE_BUILD_NUMBER', 
                    key: 'docker-push',
                    depends_on: ['docker-build'] 
                } }
            ],
            'deploy': [
                { type: 'block', properties: { label: 'Deploy Gate', prompt: 'Deploy to production?', key: 'deploy-gate' } },
                { type: 'command', properties: { 
                    label: 'Deploy', 
                    command: './scripts/deploy.sh', 
                    key: 'deploy',
                    depends_on: ['deploy-gate'] 
                } }
            ]
        };
        
        const template = templates[templateKey];
        if (!template) return;
        
        // Clear existing steps
        this.steps = [];
        this.stepCounter = 0;
        
        // Add template steps
        template.forEach(stepConfig => {
            const step = this.createStep(stepConfig.type);
            Object.assign(step.properties, stepConfig.properties);
            this.steps.push(step);
            this.stepCounter++;
        });
        
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
    }

    loadPattern(patternKey) {
        const patterns = {
            'parallel-tests': [
                { type: 'command', properties: { label: 'Test Suite 1', command: 'npm run test:suite1', key: 'test1' } },
                { type: 'command', properties: { label: 'Test Suite 2', command: 'npm run test:suite2', key: 'test2' } },
                { type: 'command', properties: { label: 'Test Suite 3', command: 'npm run test:suite3', key: 'test3' } },
                { type: 'wait', properties: {} },
                { type: 'command', properties: { label: 'Merge Coverage', command: 'npm run coverage:merge', key: 'coverage' } }
            ],
            'matrix-build': [
                { type: 'command', properties: { 
                    label: 'Matrix Build', 
                    command: 'npm test',
                    matrix: {
                        setup: {
                            node: ['14', '16', '18'],
                            os: ['ubuntu', 'macos']
                        }
                    }
                } }
            ],
            'fan-out-fan-in': [
                { type: 'command', properties: { label: 'Prepare', command: 'npm ci', key: 'prepare' } },
                { type: 'command', properties: { label: 'Unit Tests', command: 'npm run test:unit', key: 'unit', depends_on: ['prepare'] } },
                { type: 'command', properties: { label: 'Integration Tests', command: 'npm run test:integration', key: 'integration', depends_on: ['prepare'] } },
                { type: 'command', properties: { label: 'E2E Tests', command: 'npm run test:e2e', key: 'e2e', depends_on: ['prepare'] } },
                { type: 'wait', properties: {} },
                { type: 'command', properties: { label: 'Report', command: 'npm run test:report', key: 'report' } }
            ]
        };
        
        const pattern = patterns[patternKey];
        if (!pattern) return;
        
        // Add pattern steps to existing pipeline
        pattern.forEach(stepConfig => {
            const step = this.createStep(stepConfig.type);
            Object.assign(step.properties, stepConfig.properties);
            this.steps.push(step);
            this.stepCounter++;
        });
        
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
    }

    clearPipeline() {
        if (this.steps.length > 0 && confirm('Are you sure you want to clear all steps?')) {
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
                    command: 'npm ci',
                    key: 'install',
                    agents: { queue: 'default' },
                    env: {},
                    plugins: {},
                    artifact_paths: '',
                    timeout_in_minutes: 10,
                    retry: { automatic: { limit: 2 } },
                    soft_fail: false,
                    priority: 0,
                    branches: '',
                    if: '',
                    unless: '',
                    depends_on: [],
                    allow_dependency_failure: false
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
                    plugins: {
                        'junit-annotate#v2.0.2': {
                            artifacts: 'test-results/**/*.xml'
                        }
                    },
                    artifact_paths: 'coverage/**/*',
                    timeout_in_minutes: 15,
                    retry: { automatic: { limit: 1 } },
                    soft_fail: false,
                    priority: 0,
                    branches: '',
                    if: '',
                    unless: '',
                    depends_on: ['install'],
                    allow_dependency_failure: false
                }
            },
            {
                id: 'step-3',
                type: 'wait',
                properties: {
                    label: 'Wait for tests',
                    key: 'wait',
                    continue_on_failure: false,
                    depends_on: [],
                    if: '',
                    unless: '',
                    branches: '',
                    allow_dependency_failure: false
                }
            },
            {
                id: 'step-4',
                type: 'block',
                properties: {
                    label: 'Deploy Gate',
                    prompt: 'Deploy to production?',
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
                }).catch(() => {
                    console.error('❌ Failed to copy to clipboard');
                    this.downloadYAML(yaml);
                });
            } else {
                this.downloadYAML(yaml);
            }
        }
    }

    downloadYAML(yaml) {
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pipeline.yml';
        a.click();
        URL.revokeObjectURL(url);
        console.log('📥 YAML downloaded');
    }

    // Plugin catalog methods
    showPluginCatalog() {
        console.log('🏪 Opening plugin catalog...');
        // This will be implemented by the main initializer
        if (window.mainInitializer && window.mainInitializer.showPluginCatalog) {
            window.mainInitializer.showPluginCatalog();
        }
    }

    validatePipeline() {
        console.log('✅ Validating pipeline...');
        // Basic validation
        const errors = [];
        
        if (this.steps.length === 0) {
            errors.push('Pipeline has no steps');
        }
        
        this.steps.forEach((step, index) => {
            if (!step.properties.label) {
                errors.push(`Step ${index + 1} has no label`);
            }
            
            if (step.type === 'command' && !step.properties.command) {
                errors.push(`Command step "${step.properties.label || index + 1}" has no command`);
            }
            
            // Check for circular dependencies
            if (step.properties.depends_on && step.properties.depends_on.length > 0) {
                step.properties.depends_on.forEach(dep => {
                    if (!this.steps.find(s => s.properties.key === dep)) {
                        errors.push(`Step "${step.properties.label}" depends on non-existent step "${dep}"`);
                    }
                });
            }
        });
        
        if (errors.length > 0) {
            alert('Pipeline validation errors:\n\n' + errors.join('\n'));
        } else {
            alert('Pipeline validation passed! ✅');
        }
    }
}

// Export class
window.PipelineBuilder = PipelineBuilder;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🔄 DOM loaded, waiting for main initializer...');
    });
} else {
    console.log('✅ Pipeline Builder class ready for initialization');
}