// js/pipeline-builder.js
// Enhanced Buildkite Pipeline Builder with Improved Drag & Drop and Complete Step Configuration

class PipelineBuilder {
    constructor() {
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.draggedElement = null;
        this.dragInsertIndex = -1;
        this.isDragging = false;
        
        // Initialize plugin catalog
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
        console.log('✅ Enhanced Pipeline Builder initialized');
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
        
        // Make step types draggable with enhanced feedback
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
            stepType.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Setup enhanced drop zones for pipeline container
        this.setupPipelineDropZones();
        
        console.log('✅ Enhanced drag and drop configured');
    }

    setupPipelineDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) {
            console.warn('⚠️ Pipeline steps container not found');
            return;
        }

        // Enhanced drag over with generous zones
        pipelineSteps.addEventListener('dragover', this.handleEnhancedDragOver.bind(this));
        pipelineSteps.addEventListener('drop', this.handleEnhancedDrop.bind(this));
        pipelineSteps.addEventListener('dragenter', this.handleDragEnter.bind(this));
        pipelineSteps.addEventListener('dragleave', this.handleDragLeave.bind(this));
        
        // Setup empty state drop zone
        this.setupEmptyStateDropZone();
    }

    setupEmptyStateDropZone() {
        const emptyState = document.getElementById('empty-state');
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
                emptyState.classList.remove('drag-active');
                const stepType = e.dataTransfer.getData('text/plain');
                if (stepType) {
                    this.addStep(stepType);
                }
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
            
            // Add drop zones between steps and at the end
            this.createDropZones();
        }
    }

    deactivateDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('drag-active', 'drag-over');
            
            // Remove all drop zones
            this.removeDropZones();
        }
    }

    createDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) return;
        
        // Remove existing drop zones
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
            step.parentNode.insertBefore(dropZone, step.nextSibling);
        });
    }

    createDropZone(index) {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.dataset.insertIndex = index;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';
            dropZone.classList.add('drag-over');
            this.dragInsertIndex = parseInt(dropZone.dataset.insertIndex);
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            // Only remove drag-over if we're actually leaving the drop zone
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
            
            const dragData = e.dataTransfer.getData('text/plain');
            const insertIndex = parseInt(dropZone.dataset.insertIndex);
            
            console.log('🎯 Dropping at index:', insertIndex, 'Data:', dragData);
            
            if (dragData.startsWith('plugin:')) {
                const pluginKey = dragData.replace('plugin:', '');
                this.addPluginStepAtIndex(pluginKey, insertIndex);
            } else {
                this.addStepAtIndex(dragData, insertIndex);
            }
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
        
        // Activate drop zones when entering pipeline area
        document.querySelectorAll('.drop-zone').forEach(zone => {
            zone.classList.add('active');
        });
    }

    handleDragLeave(e) {
        if (!this.isDragging) return;
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps && !pipelineSteps.contains(e.relatedTarget)) {
            pipelineSteps.classList.remove('drag-over');
            
            // Deactivate drop zones when leaving pipeline area
            document.querySelectorAll('.drop-zone').forEach(zone => {
                zone.classList.remove('active', 'drag-over');
            });
        }
    }

    handleEnhancedDrop(e) {
        e.preventDefault();
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('drag-over');
        }
        
        // Drop handling is done by individual drop zones
        console.log('✅ Drop completed');
    }

    setupPropertyEventListeners() {
        // Property updates will be handled when properties are rendered
        console.log('✅ Property event listeners ready');
    }

    handleKeyboard(e) {
        // Delete selected step
        if (e.key === 'Delete' && this.selectedStep) {
            this.removeStep(this.selectedStep);
        }
        
        // Escape to deselect
        if (e.key === 'Escape') {
            this.selectStep(null);
        }
        
        // Arrow keys for navigation
        if (e.key === 'ArrowUp' && this.selectedStep) {
            e.preventDefault();
            this.selectPreviousStep();
        }
        
        if (e.key === 'ArrowDown' && this.selectedStep) {
            e.preventDefault();
            this.selectNextStep();
        }
        
        // Enter to edit selected step
        if (e.key === 'Enter' && this.selectedStep) {
            e.preventDefault();
            this.openStepConfiguration(this.selectedStep);
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
    }

    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.contentEditable === 'true'
        );
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

    // Enhanced step creation and management
    addStep(type) {
        this.addStepAtIndex(type, this.steps.length);
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
        this.updateLastSaved();
        
        console.log(`✅ Added plugin step: ${step.id}`);
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
                unless: '',
                depends_on: [],
                allow_dependency_failure: false,
                soft_fail: false,
                priority: 0,
                key: ''
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
                <div class="empty-state" id="empty-state">
                    <div class="empty-state-content">
                        <i class="fas fa-mouse-pointer"></i>
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
            this.setupEmptyStateDropZone();
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
                        <button class="step-action" onclick="event.stopPropagation(); pipelineBuilder.openStepConfiguration('${step.id}')" 
                                title="Configure">
                            <i class="fas fa-cog"></i>
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
        
        // Dependencies indicator
        if (step.properties.depends_on && step.properties.depends_on.length > 0) {
            indicators.push(`
                <span class="step-indicator dependency">
                    <i class="fas fa-link"></i>
                    ${step.properties.depends_on.length} dep${step.properties.depends_on.length !== 1 ? 's' : ''}
                </span>
            `);
        }
        
        // Conditions indicator
        if (step.properties.if || step.properties.unless) {
            indicators.push(`
                <span class="step-indicator condition">
                    <i class="fas fa-code-branch"></i>
                    conditional
                </span>
            `);
        }
        
        // Matrix indicator
        if (step.properties.matrix && step.properties.matrix.setup) {
            const dimensions = Object.keys(step.properties.matrix.setup).length;
            indicators.push(`
                <span class="step-indicator matrix">
                    <i class="fas fa-th"></i>
                    matrix (${dimensions}D)
                </span>
            `);
        }
        
        // Plugin indicator
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
            this.updateLastSaved();
        }
    }

    moveStepDown(index) {
        if (index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.renderPipeline();
            this.updateLastSaved();
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
            this.updateLastSaved();
            
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
            this.updateLastSaved();
            
            console.log('🗑️ Removed step:', stepId);
        }
    }

    openStepConfiguration(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        this.selectStep(stepId);
        
        // For now, just ensure the properties panel is updated
        // In a future enhancement, this could open a dedicated modal
        console.log('⚙️ Opening configuration for step:', stepId);
    }

    // Properties Panel Management
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
                            <li>Command - Execute shell commands</li>
                            <li>Wait - Create dependencies between stages</li>
                            <li>Block - Add manual approval points</li>
                            <li>Input - Collect user input</li>
                            <li>Trigger - Launch other pipelines</li>
                            <li>Group - Organize related steps</li>
                            <li>Plugin - Use Buildkite plugins</li>
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

        container.innerHTML = this.generatePropertyForm(step);
        this.setupPropertyEvents(step);
        
        console.log('🔧 Rendered properties for step:', step.id);
    }

    generatePropertyForm(step) {
        const baseForm = this.generateBasePropertyForm(step);
        const advancedForm = this.generateAdvancedPropertyForm(step);
        
        return `
            <div class="properties-content">
                <div class="properties-header">
                    <h3><i class="${this.getStepIcon(step.type)}"></i> ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} Step</h3>
                </div>
                ${baseForm}
                ${advancedForm}
            </div>
        `;
    }

    generateBasePropertyForm(step) {
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
            case 'pipeline-upload':
                return this.generatePipelineUploadForm(step);
            default:
                return this.generateGenericForm(step);
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
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., test-step" />
                    <small>Unique identifier for dependencies and references</small>
                </div>
                
                <div class="property-group">
                    <label for="artifact_paths">Artifact Paths</label>
                    <input type="text" name="artifact_paths" value="${props.artifact_paths}" 
                           placeholder="e.g., test-results/*.xml" />
                    <small>Glob patterns for artifacts to upload</small>
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
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., deploy-gate" />
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
                
                <div class="property-group">
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., deployment-input" />
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
                
                <div class="property-group">
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., trigger-deploy" />
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
        `;
    }

    generatePluginForm(step) {
        const props = step.properties;
        const selectedPlugin = props.selected_plugin;
        const pluginOptions = Object.entries(this.pluginCatalog).map(([key, plugin]) => 
            `<option value="${key}" ${selectedPlugin === key ? 'selected' : ''}>${plugin.name}</option>`
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
                    <label for="key">Step Key</label>
                    <input type="text" name="key" value="${props.key || ''}" placeholder="e.g., docker-build" />
                </div>
                
                <div class="advanced-buttons">
                    <button type="button" class="btn btn-secondary btn-small" onclick="pipelineBuilder.showPluginCatalog()">
                        <i class="fas fa-store"></i> Plugin Catalog
                    </button>
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
        `;
    }

    generatePipelineUploadForm(step) {
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
                
                <div class="property-checkbox">
                    <input type="checkbox" name="replace" ${props.replace ? 'checked' : ''} />
                    <label for="replace">Replace Pipeline (vs append)</label>
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
            </div>
        `;
    }

    generateAdvancedPropertyForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">Conditional Expression (if)</label>
                    <input type="text" name="if" value="${step.properties.if || ''}" 
                           placeholder="build.branch == 'main'" />
                    <small>Step runs only if this condition is true</small>
                </div>
                
                <div class="property-group">
                    <label for="unless">Unless Expression</label>
                    <input type="text" name="unless" value="${step.properties.unless || ''}" 
                           placeholder="build.pull_request.draft == true" />
                    <small>Step runs unless this condition is true</small>
                </div>
                
                <div class="advanced-buttons">
                    <button type="button" class="btn btn-secondary btn-small" onclick="pipelineBuilder.openConditionalBuilder('${step.id}')">
                        <i class="fas fa-code-branch"></i> Condition Builder
                    </button>
                </div>
            </div>

            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label for="depends_on">Depends On</label>
                    <textarea name="depends_on" placeholder="step-key-1&#10;step-key-2" rows="3">${(step.properties.depends_on || []).join('\n')}</textarea>
                    <small>Step keys this step depends on (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" name="allow_dependency_failure" ${step.properties.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow Dependency Failure</label>
                </div>
                
                <div class="advanced-buttons">
                    <button type="button" class="btn btn-secondary btn-small" onclick="pipelineBuilder.openDependencyManager('${step.id}')">
                        <i class="fas fa-sitemap"></i> Dependency Manager
                    </button>
                </div>
            </div>

            ${step.type === 'command' || step.type === 'plugin' ? `
                <div class="property-section">
                    <h4><i class="fas fa-th"></i> Matrix Builds</h4>
                    
                    <div class="property-group">
                        <div class="advanced-buttons">
                            <button type="button" class="btn btn-secondary btn-small" onclick="pipelineBuilder.openMatrixBuilder('${step.id}')">
                                <i class="fas fa-th"></i> Configure Matrix
                            </button>
                            <button type="button" class="btn btn-secondary btn-small" onclick="pipelineBuilder.showMatrixTemplates()">
                                <i class="fas fa-magic"></i> Templates
                            </button>
                        </div>
                        ${this.renderMatrixPreview(step.properties.matrix)}
                    </div>
                </div>
            ` : ''}
        `;
    }

    renderMatrixPreview(matrix) {
        if (!matrix || !matrix.setup) {
            return '<small class="empty-state">No matrix configured</small>';
        }
        
        const dimensions = Object.entries(matrix.setup);
        const combinations = this.calculateMatrixCombinations(matrix.setup);
        
        return `
            <div class="matrix-preview">
                <strong>Matrix Dimensions:</strong>
                <ul>
                    ${dimensions.map(([key, values]) => 
                        `<li><strong>${key}:</strong> ${Array.isArray(values) ? values.join(', ') : values}</li>`
                    ).join('')}
                </ul>
                <small><strong>Total Combinations:</strong> ${combinations}</small>
            </div>
        `;
    }

    calculateMatrixCombinations(setup) {
        return Object.values(setup).reduce((total, values) => {
            return total * (Array.isArray(values) ? values.length : 1);
        }, 1);
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
            value = value === '' ? null : parseFloat(value);
        }

        // Handle array fields
        if (propertyName === 'depends_on') {
            value = value.split('\n').filter(line => line.trim()).map(line => line.trim());
        }
        
        // Update the property
        step.properties[propertyName] = value;

        // Update pipeline display
        this.renderPipeline();
        this.updateLastSaved();
        
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
        this.updateLastSaved();
    }

    // Advanced feature methods (stubs for now)
    openMatrixBuilder(stepId) {
        console.log('🔲 Opening matrix builder for step:', stepId);
        const modal = document.getElementById('matrix-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.initializeMatrixBuilder(stepId);
        } else {
            console.warn('⚠️ Matrix builder modal not found');
        }
    }

    initializeMatrixBuilder(stepId) {
        // This would be implemented with full matrix builder functionality
        console.log('🔧 Initializing matrix builder for:', stepId);
    }

    showMatrixTemplates() {
        console.log('📋 Showing matrix templates');
        // This would show matrix presets
    }

    openConditionalBuilder(stepId) {
        console.log('🔀 Opening conditional builder for step:', stepId);
        // This would open the conditional logic builder
    }

    openDependencyManager(stepId) {
        console.log('🔗 Opening dependency manager for step:', stepId);
        // This would open the dependency manager
    }

    showPluginCatalog() {
        console.log('🔌 Opening plugin catalog');
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.renderPluginCatalog();
        } else {
            console.warn('⚠️ Plugin catalog modal not found');
        }
    }

    renderPluginCatalog() {
        const container = document.getElementById('plugin-list');
        if (!container) return;

        const pluginHTML = Object.entries(this.pluginCatalog).map(([key, plugin]) => `
            <div class="plugin-card" data-plugin-key="${key}">
                <div class="plugin-card-header">
                    <div class="plugin-icon">
                        <i class="fas ${this.getPluginIcon(plugin.category)}"></i>
                    </div>
                    <div>
                        <h5>${plugin.name}</h5>
                        <span class="plugin-version">${plugin.version}</span>
                    </div>
                </div>
                <p>${plugin.description}</p>
                <div class="plugin-actions">
                    <button class="btn btn-primary btn-small" onclick="pipelineBuilder.addPluginStep('${key}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                    <button class="btn btn-outline btn-small" onclick="pipelineBuilder.showPluginDetails('${key}')">
                        Details
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = pluginHTML;
    }

    getPluginIcon(category) {
        const icons = {
            docker: 'fa-docker',
            testing: 'fa-vial',
            deployment: 'fa-rocket',
            notification: 'fa-bell',
            security: 'fa-shield-alt'
        };
        return icons[category] || 'fa-plug';
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
        this.updateLastSaved();

        // Close modal
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        console.log('🔌 Added plugin step:', pluginKey);
    }

    showPluginDetails(pluginKey) {
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) return;
        
        console.log('🔍 Showing details for plugin:', pluginKey, plugin);
        // This would show detailed plugin information
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
            this.updateLastSaved();
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
                    agents: {},
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
                    label: 'Run Tests',
                    command: 'npm test',
                    key: 'test',
                    agents: {},
                    env: { NODE_ENV: 'test' },
                    timeout_in_minutes: 30,
                    retry: { automatic: { limit: 1 } },
                    plugins: {},
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
        this.updateLastSaved();
        
        console.log('📋 Loaded example pipeline');
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

    savePipeline() {
        // Auto-save functionality (could integrate with localStorage or API)
        this.updateLastSaved();
        console.log('💾 Pipeline saved');
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

// Initialize the pipeline builder when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (!window.pipelineBuilder) {
        window.pipelineBuilder = new PipelineBuilder();
        console.log('✅ Enhanced Pipeline Builder with improved drag & drop initialized');
    }
});
        
        console.log(`✅ Added ${type} step: ${step.id}`);
    }

    addPluginStepAtIndex(pluginKey, index) {
        console.log(`🔌 Adding plugin step ${pluginKey} at index ${index}`);
        
        const plugin = this.pluginCatalog[pluginKey];
        if (!plugin) {
            console.error('❌ Plugin not found:', pluginKey);
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
        this.updateLastSaved();