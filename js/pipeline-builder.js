// js/pipeline-builder.js
/**
 * Buildkite Pipeline Builder - Complete Merged Version
 * This file combines all functionality from both versions:
 * 
 * From Version 1:
 * - Dependencies as dropdown instead of popup
 * - Plugin catalog properly populated
 * - Matrix builder functionality working
 * - All step types and properties included
 * - Complete drag-and-drop without duplicates
 * 
 * From Version 2:
 * - Matrix builds support
 * - Conditional logic support
 * - Enhanced templates
 * - Artifact paths support
 * - Cancel on build failing
 * - Enhanced soft fail options
 * - Manual retry configuration
 * - Step limits enforcement
 * - Auto-save and localStorage support
 * - Step templates catalog
 * - Event listener fixes for step selection
 * - Properties window updates after drag-and-drop
 * - Step movement functionality (up/down)
 * - Enhanced drag and drop functionality
 * - All form generators preserved
 * - All setup listener methods
 * - Pattern loading
 * - Validation methods
 */

class PipelineBuilder {
    constructor() {
        console.log('🚀 Initializing Complete Pipeline Builder with all features...');
        
        // Core state
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        
        // Buildkite limits
        this.limits = {
            maxSteps: 500,           // Pipeline upload limit
            maxMatrixJobs: 50,       // Matrix build limit
            maxMatrixDimensions: 6,  // Matrix dimensions limit
            maxElementsPerDimension: 20
        };
        
        // Drag and drop state
        this.draggedElement = null;
        this.dropZones = [];
        this.dropHandled = false;
        
        // Bind handlers
        this.boundHandlers = {
            dragOver: this.handleDragOver.bind(this),
            drop: this.handleDrop.bind(this),
            dragLeave: this.handleDragLeave.bind(this)
        };
        this.isDragging = false;
        
        // Complete plugin catalog with all categories
        this.pluginCatalog = {
            'docker-compose': {
                name: 'Docker Compose',
                icon: 'fa-docker',
                description: 'Build, run and push Docker Compose services',
                category: 'docker',
                official: true,
                config: {
                    run: { type: 'string', default: 'app', required: true, description: 'Service to run' },
                    config: { type: 'string', default: 'docker-compose.yml', description: 'Docker Compose config file' },
                    'build-parallel': { type: 'boolean', default: true, description: 'Build services in parallel' },
                    shell: { type: 'boolean', default: true, description: 'Run with shell' }
                }
            },
            'docker': {
                name: 'Docker',
                icon: 'fa-docker',
                description: 'Build and publish Docker images',
                category: 'docker',
                official: true,
                config: {
                    image: { type: 'string', required: true, description: 'Docker image name' },
                    tag: { type: 'string', default: 'latest', description: 'Image tag' },
                    dockerfile: { type: 'string', default: 'Dockerfile', description: 'Dockerfile path' },
                    push: { type: 'boolean', default: true, description: 'Push image after build' }
                }
            },
            'junit-annotate': {
                name: 'JUnit Annotate',
                icon: 'fa-clipboard-check',
                description: 'Annotate build with JUnit test results',
                category: 'testing',
                official: true,
                config: {
                    artifacts: { type: 'string', default: 'test/reports/*.xml', description: 'Path to JUnit XML files' },
                    'fail-build-on-error': { type: 'boolean', default: true, description: 'Fail build if tests fail' },
                    report_priority: { type: 'string', default: 'error', description: 'Report priority' }
                }
            },
            'artifacts': {
                name: 'Artifacts',
                icon: 'fa-archive',
                description: 'Upload and download build artifacts',
                category: 'deployment',
                official: true,
                config: {
                    upload: { type: 'string', description: 'Files to upload (e.g., dist/**/*)', required: false },
                    download: { type: 'string', description: 'Files to download', required: false },
                    compressed: { type: 'boolean', default: false, description: 'Compress artifacts' },
                    compress: { type: 'boolean', default: false, description: 'Compress artifacts' },
                    build: { type: 'string', description: 'Build ID to download from' },
                    step: { type: 'string', description: 'Step key to download from' }
                }
            },
            'slack': {
                name: 'Slack',
                icon: 'fa-slack',
                description: 'Send notifications to Slack',
                category: 'notifications',
                official: false,
                config: {
                    webhook_url: { type: 'string', required: true, description: 'Slack webhook URL', secret: true },
                    channel: { type: 'string', description: 'Slack channel (e.g., #builds)' },
                    channels: { type: 'array', required: true, description: 'Slack channels' },
                    message: { type: 'string', default: 'Build {{build.state}}', description: 'Message template' }
                }
            },
            'test-collector': {
                name: 'Test Collector',
                icon: 'fa-vial',
                description: 'Collect and analyze test results',
                category: 'testing',
                official: true,
                config: {
                    files: { type: 'string', default: '**/*.xml', description: 'Test result files pattern', required: true },
                    format: { type: 'string', default: 'junit', description: 'Test result format' }
                }
            },
            'test-splitter': {
                name: 'Test Splitter',
                icon: 'fa-cut',
                description: 'Split test suites across parallel jobs',
                category: 'testing',
                official: true,
                config: {
                    test_cmd: { type: 'string', required: true, description: 'Test command' },
                    split_by: { type: 'string', default: 'timing', description: 'Split strategy' }
                }
            },
            'ecr': {
                name: 'AWS ECR',
                icon: 'fa-aws',
                description: 'Build and push Docker images to ECR',
                category: 'docker',
                official: false,
                config: {
                    account_id: { type: 'string', required: true, description: 'AWS Account ID' },
                    account_ids: { type: 'array', description: 'AWS account IDs' },
                    region: { type: 'string', default: 'us-east-1', description: 'AWS Region' },
                    repository: { type: 'string', required: true, description: 'ECR Repository name' },
                    login: { type: 'boolean', default: true, description: 'Perform ECR login' }
                }
            },
            'cache': {
                name: 'Cache',
                icon: 'fa-database',
                description: 'Cache dependencies and build artifacts',
                category: 'deployment',
                official: true,
                config: {
                    paths: { type: 'array', default: ['node_modules'], description: 'Paths to cache', required: true },
                    key: { type: 'string', default: 'v1-{{ checksum "package-lock.json" }}', description: 'Cache key template', required: true },
                    restore_keys: { type: 'array', description: 'Keys to restore from' }
                }
            },
            'security-scan': {
                name: 'Security Scanner',
                icon: 'fa-shield-alt',
                description: 'Scan code for security vulnerabilities',
                category: 'security',
                official: false,
                config: {
                    scanner: { type: 'string', default: 'trivy', description: 'Security scanner to use' },
                    severity: { type: 'string', default: 'HIGH,CRITICAL', description: 'Severity levels to check' },
                    'fail-on-issues': { type: 'boolean', default: true, description: 'Fail build if issues found' }
                }
            },
            'terraform': {
                name: 'Terraform',
                icon: 'fa-cube',
                description: 'Run Terraform commands',
                category: 'deployment',
                official: false,
                config: {
                    command: { type: 'string', default: 'plan', description: 'Terraform command to run' },
                    workspace: { type: 'string', description: 'Terraform workspace' },
                    version: { type: 'string', default: 'latest', description: 'Terraform version' }
                }
            },
            'kubernetes': {
                name: 'Kubernetes',
                icon: 'fa-dharmachakra',
                description: 'Deploy to Kubernetes',
                category: 'deployment',
                official: true,
                config: {
                    'deployment-file': { type: 'string', required: true, description: 'Deployment YAML' },
                    'namespace': { type: 'string', default: 'default', description: 'K8s namespace' }
                }
            },
            'aws-s3': {
                name: 'AWS S3',
                icon: 'fa-aws',
                description: 'Upload and download artifacts from S3',
                category: 'cloud',
                official: true,
                config: {
                    'bucket': { type: 'string', required: true, description: 'S3 bucket name' },
                    'key': { type: 'string', required: true, description: 'S3 object key' },
                    'region': { type: 'string', default: 'us-east-1', description: 'AWS region' }
                }
            },
            'github-commit-status': {
                name: 'GitHub Status',
                icon: 'fa-github',
                description: 'Update GitHub commit status',
                category: 'notifications',
                official: true,
                config: {
                    'context': { type: 'string', default: 'continuous-integration/buildkite', description: 'Status context' }
                }
            },
            'junit': {
                name: 'JUnit',
                icon: 'fa-check-circle',
                description: 'Upload JUnit test results',
                category: 'testing',
                official: true,
                config: {
                    'artifacts': { type: 'string', required: true, description: 'Path to test results' },
                    'format': { type: 'string', default: 'junit', description: 'Result format' }
                }
            }
        };

        // Step templates
        this.stepTemplates = {
            'test': {
                name: 'Run Tests',
                icon: 'fa-vial',
                config: {
                    type: 'command',
                    properties: {
                        label: '🧪 Run Tests',
                        command: 'npm test',
                        artifact_paths: ['coverage/**/*', 'test-results/**/*'],
                        retry: {
                            automatic: {
                                exit_status: '*',
                                limit: 3
                            }
                        }
                    }
                }
            },
            'build': {
                name: 'Build Application',
                icon: 'fa-hammer',
                config: {
                    type: 'command',
                    properties: {
                        label: '🔨 Build',
                        command: 'npm run build',
                        artifact_paths: ['dist/**/*', 'build/**/*']
                    }
                }
            },
            'deploy': {
                name: 'Deploy',
                icon: 'fa-rocket',
                config: {
                    type: 'command',
                    properties: {
                        label: '🚀 Deploy',
                        command: 'npm run deploy',
                        branches: 'main master',
                        agents: {
                            queue: 'deploy'
                        }
                    }
                }
            },
            'docker-build': {
                name: 'Docker Build & Push',
                icon: 'fa-docker',
                config: {
                    type: 'command',
                    properties: {
                        label: '🐳 Docker Build',
                        plugins: {
                            'docker': {
                                image: 'myapp',
                                dockerfile: 'Dockerfile',
                                tag: '$BUILDKITE_BUILD_NUMBER',
                                push: true
                            }
                        }
                    }
                }
            },
            'manual-approval': {
                name: 'Manual Approval',
                icon: 'fa-hand-paper',
                config: {
                    type: 'block',
                    properties: {
                        prompt: 'Deploy to production?',
                        fields: [{
                            key: 'release_notes',
                            type: 'text',
                            hint: 'Enter release notes',
                            required: true
                        }]
                    }
                }
            },
            'parallel-tests': {
                name: 'Parallel Test Suite',
                icon: 'fa-layer-group',
                config: {
                    type: 'command',
                    properties: {
                        label: '🧪 Parallel Tests',
                        command: 'npm test',
                        parallelism: 5,
                        artifact_paths: 'test-results/**/*',
                        retry: {
                            automatic: {
                                exit_status: '*',
                                limit: 2
                            }
                        }
                    }
                }
            }
        };
        
        // Notifications config
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
        
        // Setup event listeners first
        this.setupEventListeners();
        
        // Setup drag and drop - only use enhanced version
        // this.setupDragAndDrop();  // Commented out to avoid conflicts
        this.setupEnhancedDragAndDrop();
        
        // Load from localStorage
        this.loadFromLocalStorage();
        
        // Initial render
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        
        // Auto-save every 30 seconds
        setInterval(() => this.saveToLocalStorage(), 30000);
        
        console.log('✅ Complete Pipeline Builder initialized successfully');
    }

    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Global window reference for inline handlers
        window.pipelineBuilder = this;
        
        // PRIORITY: Move button handlers - must be registered first with capture phase
        document.addEventListener('click', (e) => {
            // Check if clicked element is within a move button
            const moveUp = e.target.closest('[data-action="move-up"]');
            const moveDown = e.target.closest('[data-action="move-down"]');
            
            if (moveUp || moveDown) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const button = moveUp || moveDown;
                const stepId = button.dataset.stepId;
                
                console.log(`🎯 ${moveUp ? 'Move UP' : 'Move DOWN'} button clicked! Step ID: ${stepId}`);
                
                if (stepId) {
                    if (moveUp) {
                        this.moveStepUp(stepId);
                    } else {
                        this.moveStepDown(stepId);
                    }
                } else {
                    console.error('❌ No step ID found on button:', button);
                }
                
                return false;
            }
        }, true); // Capture phase - handles event before bubbling
        
        // Pipeline container click handler
        const pipelineContainer = document.getElementById('pipeline-steps');
        if (pipelineContainer) {
            pipelineContainer.addEventListener('click', (e) => {
                const stepCard = e.target.closest('.step-card');
                const stepElement = e.target.closest('.pipeline-step');
                
                if ((stepCard || stepElement) && !e.target.closest('.step-actions') && !e.target.closest('.step-action') && !e.target.closest('.btn-icon')) {
                    const stepId = stepCard?.dataset.stepId || stepElement?.dataset.stepId;
                    const step = this.steps.find(s => s.id === stepId);
                    if (step) {
                        this.selectStep(step);
                    }
                }
            });
        }

        // Delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="delete-step"]')) {
                e.preventDefault();
                e.stopPropagation();
                const stepId = e.target.closest('[data-action="delete-step"]').dataset.stepId;
                console.log('Delete clicked for step:', stepId);
                this.deleteStep(stepId);
            }
        });

        // Duplicate buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="duplicate-step"]')) {
                e.preventDefault();
                e.stopPropagation();
                const stepId = e.target.closest('[data-action="duplicate-step"]').dataset.stepId;
                console.log('Duplicate clicked for step:', stepId);
                this.duplicateStep(stepId);
            }
        });

        // Move button handlers are now in the PRIORITY section above

        // Step action buttons with proper event stopping
        document.addEventListener('click', (e) => {
            const actionButton = e.target.closest('.step-action');
            if (actionButton) {
                e.stopPropagation(); // Prevent step selection when clicking action buttons
                
                const stepElement = actionButton.closest('.pipeline-step');
                const stepId = stepElement?.dataset.stepId;
                
                if (!stepId) return;
                
                if (actionButton.classList.contains('move-up')) {
                    this.moveStepUp(stepId);
                } else if (actionButton.classList.contains('move-down')) {
                    this.moveStepDown(stepId);
                } else if (actionButton.classList.contains('duplicate')) {
                    this.duplicateStep(stepId);
                } else if (actionButton.classList.contains('delete')) {
                    this.deleteStep(stepId);
                }
            }
        });

        // Properties panel form handlers
        document.addEventListener('change', (e) => {
            if (e.target.closest('#properties-content') || e.target.closest('#step-properties')) {
                this.handlePropertyChange(e);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action]')) {
                this.handlePropertyAction(e);
            }
        });

        console.log('✅ Event listeners configured');
    }

    // setupDragAndDrop() - REMOVED: Using setupEnhancedDragAndDrop() instead

    setupEnhancedDragAndDrop() {
        console.log('🎯 Setting up enhanced drag and drop...');
        
        setTimeout(() => {
            this.setupDraggableElements();
            this.setupPipelineDropZones();
            
            const pipelineSteps = document.getElementById('pipeline-steps');
            if (pipelineSteps) {
                pipelineSteps.classList.add('drop-target');
                
                if (this.steps.length === 0) {
                    this.showEmptyPipeline();
                }
            }
        }, 50);
    }

    setupDraggableElements() {
        // Make step types draggable
        const stepTypes = document.querySelectorAll('.step-type');
        console.log(`🔧 Found ${stepTypes.length} step types to make draggable`);
        
        stepTypes.forEach(stepType => {
            if (!stepType.hasAttribute('draggable')) {
                stepType.draggable = true;
            }
            
            stepType.removeEventListener('dragstart', this.handleDragStart);
            stepType.removeEventListener('dragend', this.handleDragEnd);
            
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
            stepType.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        // Make template and pattern items draggable
        const templateItems = document.querySelectorAll('.template-item, .pattern-item');
        console.log(`🔧 Found ${templateItems.length} template/pattern items to make draggable`);
        
        templateItems.forEach(item => {
            if (!item.hasAttribute('draggable')) {
                item.draggable = true;
            }
            
            item.removeEventListener('dragstart', this.handleDragStart);
            item.removeEventListener('dragend', this.handleDragEnd);
            item.removeEventListener('click', this.handleTemplateClick);
            
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
            item.addEventListener('click', this.handleTemplateClick.bind(this));
        });
        
        console.log('✅ Enhanced drag and drop configured');
    }

    setupPipelineDropZones() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) {
            console.warn('⚠️ Pipeline steps container not found');
            return;
        }

        console.log('🎯 Setting up pipeline drop zones...');

        pipelineSteps.removeEventListener('dragover', this.boundHandlers.dragOver);
        pipelineSteps.removeEventListener('drop', this.boundHandlers.drop);
        pipelineSteps.removeEventListener('dragleave', this.boundHandlers.dragLeave);

        pipelineSteps.addEventListener('dragover', this.boundHandlers.dragOver);
        pipelineSteps.addEventListener('drop', this.boundHandlers.drop);
        pipelineSteps.addEventListener('dragleave', this.boundHandlers.dragLeave);
        
        console.log('✅ Pipeline drop zones configured');
    }

    handleDragStart(e) {
        console.log('🎯 Drag start detected');
        
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
            console.log(`🎯 Dragging step type: ${stepType.dataset.stepType}`);
        } else if (template) {
            this.draggedElement = {
                type: 'template',
                template: template.dataset.template,
                element: template
            };
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('template', template.dataset.template);
            console.log(`🎯 Dragging template: ${template.dataset.template}`);
        } else if (pattern) {
            this.draggedElement = {
                type: 'pattern',
                pattern: pattern.dataset.pattern,
                element: pattern
            };
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('pattern', pattern.dataset.pattern);
            console.log(`🎯 Dragging pattern: ${pattern.dataset.pattern}`);
        }
        
        this.dropHandled = false;
        this.isDragging = true;
        
        if (this.draggedElement) {
            this.draggedElement.element.classList.add('dragging');
            
            setTimeout(() => {
                this.showDropZones();
                const pipelineSteps = document.getElementById('pipeline-steps');
                if (pipelineSteps) {
                    pipelineSteps.classList.add('drag-active');
                    
                    const emptyPipeline = pipelineSteps.querySelector('.empty-pipeline');
                    if (emptyPipeline) {
                        emptyPipeline.classList.add('drag-active');
                    }
                }
            }, 0);
        }
    }

    handleDragEnd(e) {
        console.log('🎯 Drag end detected');
        
        e.target.classList.remove('dragging');
        this.hideDropZones();
        this.draggedElement = null;
        this.dropHandled = false;
        this.isDragging = false;
        this.clearDropIndicator();
        
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('drag-active');
            const emptyPipeline = pipelineSteps.querySelector('.empty-pipeline');
            if (emptyPipeline) {
                emptyPipeline.classList.remove('drag-active');
            }
        }
    }

    handleDragOver(e) {
        if (!this.isDragging && 
            !e.dataTransfer.types.includes('stepType') && 
            !e.dataTransfer.types.includes('template') &&
            !e.dataTransfer.types.includes('pattern')) {
            return;
        }

        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        
        const container = e.currentTarget;
        container.classList.add('drag-over');
        
        const afterElement = this.getDragAfterElement(container, e.clientY);
        const draggingElement = document.querySelector('.dragging');
        
        if (afterElement == null) {
            container.appendChild(this.createDropIndicator());
        } else {
            container.insertBefore(this.createDropIndicator(), afterElement);
        }
    }

    handleDrop(e) {
        console.log('🎯 Drop detected');
        
        const stepType = e.dataTransfer.getData('stepType');
        const template = e.dataTransfer.getData('template');
        const pattern = e.dataTransfer.getData('pattern');
        
        if (!stepType && !template && !pattern) {
            console.log('🎯 Ignoring non-step drop');
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        if (this.dropHandled) {
            console.log('⚠️ Drop already handled, skipping');
            return;
        }
        
        this.dropHandled = true;
        console.log(`🎯 Processing drop: stepType=${stepType}, template=${template}, pattern=${pattern}`);
        
        const container = e.currentTarget;
        container.classList.remove('drag-over');
        
        const afterElement = this.getDragAfterElement(container, e.clientY);
        let insertIndex = this.steps.length;
        
        if (afterElement && afterElement.dataset.stepId) {
            const afterStep = this.steps.find(s => s.id === afterElement.dataset.stepId);
            if (afterStep) {
                insertIndex = this.steps.indexOf(afterStep) + 1;
            }
        }
        
        let newStep = null;
        
        if (this.draggedElement?.type === 'new' || stepType) {
            const type = this.draggedElement?.stepType || stepType;
            newStep = this.createStep(type);
            
            if (insertIndex >= 0 && insertIndex <= this.steps.length) {
                this.steps.splice(insertIndex, 0, newStep);
            } else {
                this.steps.push(newStep);
            }
            
            this.renderPipeline();
            this.selectStep(newStep);
            this.saveToLocalStorage();
        } else if (template) {
            console.log(`📍 Loading template '${template}' at index ${insertIndex}`);
            this.loadTemplate(template, insertIndex);
            if (this.steps.length > 0 && insertIndex < this.steps.length) {
                newStep = this.steps[insertIndex];
            }
        } else if (pattern) {
            console.log(`📍 Loading pattern '${pattern}' at index ${insertIndex}`);
            this.loadPattern(pattern, insertIndex);
            if (this.steps.length > 0 && insertIndex < this.steps.length) {
                newStep = this.steps[insertIndex];
            }
        }
        
        this.clearDropIndicator();
        setTimeout(() => { this.dropHandled = false; }, 100);
        
        if (newStep && newStep.id) {
            setTimeout(() => {
                this.selectStep(newStep);
                console.log('✅ Force selected new step after drop:', newStep.id);
                
                const propsContent = document.getElementById('properties-content');
                if (propsContent && propsContent.innerHTML.includes('no-selection')) {
                    console.log('⚠️ Properties still showing no selection, forcing render...');
                    this.renderProperties();
                }
            }, 150);
        }
        
        setTimeout(() => {
            this.dropHandled = false;
        }, 200);
    }

    handleDragLeave(e) {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('drag-over');
        }
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.step-card:not(.dragging), .pipeline-step:not(.dragging)')];
        
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

    createDropIndicator() {
        const existing = document.getElementById('drop-indicator');
        if (existing) return existing;
        
        const indicator = document.createElement('div');
        indicator.id = 'drop-indicator';
        indicator.className = 'drop-indicator';
        indicator.style.cssText = 'height: 2px; background: #3b82f6; margin: 8px 0;';
        return indicator;
    }

    clearDropIndicator() {
        const indicator = document.getElementById('drop-indicator');
        if (indicator) indicator.remove();
    }

    clearDropZones() {
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        this.clearDropIndicator();
    }

    showDropZones() {
        console.log('📍 Showing drop zones');
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps) return;
        
        pipelineSteps.classList.add('show-drop-zones');
        
        this.dropZones = [];
        const steps = pipelineSteps.querySelectorAll('.pipeline-step');
        
        const firstZone = this.createDropZone();
        if (steps.length > 0) {
            pipelineSteps.insertBefore(firstZone, steps[0]);
        } else {
            pipelineSteps.classList.add('empty-drop-zone');
        }
        this.dropZones.push(firstZone);
        
        steps.forEach(step => {
            const zone = this.createDropZone();
            step.insertAdjacentElement('afterend', zone);
            this.dropZones.push(zone);
        });
    }

    hideDropZones() {
        console.log('📍 Hiding drop zones');
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (pipelineSteps) {
            pipelineSteps.classList.remove('show-drop-zones');
            pipelineSteps.classList.remove('empty-drop-zone');
        }
        
        this.dropZones.forEach(zone => zone.remove());
        this.dropZones = [];
    }

    createDropZone() {
        const zone = document.createElement('div');
        zone.className = 'drop-zone';
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            
            // Get the index of this drop zone
            const allZones = Array.from(document.querySelectorAll('.drop-zone'));
            const zoneIndex = allZones.indexOf(zone);
            
            // Handle the drop based on the dragged element type
            if (this.draggedElement?.type === 'existing') {
                // Handle existing step reordering
                const stepId = this.draggedElement.stepId;
                this.moveStep(stepId, zoneIndex);
                // Ensure properties panel updates
                setTimeout(() => {
                    this.renderProperties();
                }, 150);
            } else {
                // Handle new step from palette
                const stepType = e.dataTransfer.getData('stepType');
                const template = e.dataTransfer.getData('template');
                const pattern = e.dataTransfer.getData('pattern');
                
                if (stepType) {
                    const newStep = this.addStep(stepType, zoneIndex);
                    if (newStep) {
                        setTimeout(() => {
                            this.selectStep(newStep);
                            this.renderProperties();
                        }, 100);
                    }
                } else if (template) {
                    this.loadTemplate(template, zoneIndex);
                } else if (pattern) {
                    this.loadPattern(pattern, zoneIndex);
                }
            }
            
            // Clear drag state
            this.hideDropZones();
            this.draggedElement = null;
            this.dropHandled = false;
        });
        return zone;
    }

    showEmptyPipeline() {
        const pipelineSteps = document.getElementById('pipeline-steps');
        if (!pipelineSteps || pipelineSteps.querySelector('.empty-pipeline')) return;
        
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-pipeline';
        emptyState.innerHTML = `
            <div id="empty-state" class="empty-pipeline">
                <i class="fas fa-layer-group"></i>
                <p>Drag steps here to build your pipeline</p>
                <p class="hint">Start with a command step or load an example</p>
                <div class="quick-start-buttons">
                    <button class="btn btn-primary" onclick="window.pipelineBuilder.addStep('command')">
                        <i class="fas fa-plus"></i> Add Command Step
                    </button>
                    <button class="btn btn-secondary" onclick="window.pipelineBuilder.loadExample()">
                        <i class="fas fa-file-import"></i> Load Example
                    </button>
                </div>
            </div>
        `;
        pipelineSteps.appendChild(emptyState);
    }

    hideEmptyPipeline() {
        const emptyPipeline = document.querySelector('.empty-pipeline');
        if (emptyPipeline) {
            emptyPipeline.remove();
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

    createStep(type) {
        const step = {
            id: `step-${++this.stepCounter}-${Date.now()}`,
            type: type,
            properties: this.getDefaultProperties(type)
        };
        
        return step;
    }

    getDefaultProperties(type) {
        const defaults = {
            command: {
                label: '📦 Build',
                command: 'echo "Building..."',
                key: `build-${this.stepCounter}`,
                agents: { queue: 'default' },
                env: {},
                plugins: {},
                timeout_in_minutes: null,
                retry: null,
                parallelism: null,
                matrix: null,
                soft_fail: false,
                skip: false,
                artifact_paths: null,
                cancel_on_build_failing: false
            },
            wait: {
                continue_on_failure: false,
                if: null
            },
            block: {
                block: '🚦 Manual Approval',
                prompt: 'Please review and approve deployment',
                fields: [],
                blocked_state: 'passed',
                key: `block-${this.stepCounter}`
            },
            input: {
                input: 'Deployment Configuration',
                prompt: 'Please provide input',
                fields: [{
                    key: 'release-version',
                    text: 'Release Version',
                    required: true,
                    default: '1.0.0'
                }],
                key: `input-${this.stepCounter}`
            },
            trigger: {
                trigger: 'deploy-pipeline',
                label: '🚀 Trigger Deploy',
                build: {
                    message: 'Triggered from main pipeline',
                    branch: 'main'
                },
                async: false,
                branches: null,
                skip: false
            },
            group: {
                group: '📁 Test Suite',
                key: `group-${this.stepCounter}`,
                steps: [],
                depends_on: null,
                allow_dependency_failure: false
            },
            annotation: {
                body: '',
                style: 'info',
                context: 'default',
                append: false
            },
            notify: {
                email: '',
                slack: '',
                webhook: '',
                pagerduty: '',
                if: null
            },
            plugin: {
                plugins: {},
                if: null,
                key: `plugin-${this.stepCounter}`
            },
            'pipeline-upload': {
                pipeline: '.buildkite/pipeline.yml',
                replace: false,
                if: null
            }
        };
        
        return defaults[type] || { label: `New ${type} step` };
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

    addStep(type, index = -1) {
        if (!type) {
            console.warn('⚠️ No step type provided');
            return null;
        }
        
        if (this.steps.length >= this.limits.maxSteps) {
            alert(`Pipeline limit reached: maximum ${this.limits.maxSteps} steps allowed`);
            return null;
        }
        
        console.log(`➕ Adding step: ${type} at index: ${index}`);
        
        const step = this.createStep(type);
        
        if (index >= 0 && index <= this.steps.length) {
            this.steps.splice(index, 0, step);
        } else {
            this.steps.push(step);
        }
        
        this.updateStepKeys();
        this.renderPipeline();
        this.selectStep(step);
        this.updateStepCount();
        this.saveToLocalStorage();
        
        console.log(`✅ Added ${type} step with ID: ${step.id}`);
        return step;
    }

    addStepAtIndex(stepType, index) {
        return this.addStep(stepType, index);
    }

    selectStep(step) {
        if (typeof step === 'string') {
            // If step is a string (ID), find the actual step object
            step = this.steps.find(s => s.id === step);
        }
        
        if (!step) {
            console.warn('⚠️ Step not found');
            return;
        }
        
        console.log(`📌 Selecting step: ${step.id}`);
        
        this.selectedStep = step;
        
        // Update UI
        document.querySelectorAll('.step-card, .pipeline-step').forEach(card => {
            card.classList.toggle('selected', card.dataset.stepId === step.id);
        });
        
        this.renderProperties();
        
        // Emit event
        document.dispatchEvent(new CustomEvent('stepSelected', { 
            detail: { stepId: step.id, step: step } 
        }));
        
        // Scroll to selected step
        setTimeout(() => {
            const stepElement = document.querySelector(`[data-step-id="${step.id}"]`);
            if (stepElement) {
                stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
        
        console.log(`✅ Step ${step.id} selected and properties rendered`);
    }

    deleteStep(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index > -1) {
            if (confirm('Are you sure you want to delete this step?')) {
                this.steps.splice(index, 1);
                if (this.selectedStep?.id === stepId) {
                    this.selectedStep = null;
                    this.renderProperties();
                }
                this.renderPipeline();
                this.updateStepCount();
                this.saveToLocalStorage();
                console.log(`🗑️ Deleted step: ${stepId}`);
            }
        }
    }

    duplicateStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        if (this.steps.length >= this.limits.maxSteps) {
            alert(`Pipeline limit reached: Maximum ${this.limits.maxSteps} steps allowed per pipeline.`);
            return;
        }
        
        const newStep = {
            id: `step-${++this.stepCounter}-${Date.now()}`,
            type: step.type,
            properties: JSON.parse(JSON.stringify(step.properties))
        };
        
        // Update key if exists
        if (newStep.properties.key) {
            newStep.properties.key = `${newStep.properties.key}-copy`;
        }
        
        // Update label
        newStep.properties.label = `${step.properties.label || 'Step'} (Copy)`;
        
        const index = this.steps.findIndex(s => s.id === stepId);
        this.steps.splice(index + 1, 0, newStep);
        
        this.renderPipeline();
        this.selectStep(newStep);
        this.updateStepCount();
        this.saveToLocalStorage();
        
        console.log(`📋 Duplicated step: ${stepId} -> ${newStep.id}`);
    }

    moveStepUp(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index > 0) {
            [this.steps[index - 1], this.steps[index]] = [this.steps[index], this.steps[index - 1]];
            this.updateStepKeys();
            this.renderPipeline();
            this.renderProperties();
            this.saveToLocalStorage();
            console.log(`⬆️ Moved step ${stepId} up`);
        }
    }

    moveStepDown(stepId) {
        const index = this.steps.findIndex(s => s.id === stepId);
        if (index >= 0 && index < this.steps.length - 1) {
            [this.steps[index], this.steps[index + 1]] = [this.steps[index + 1], this.steps[index]];
            this.updateStepKeys();
            this.renderPipeline();
            this.renderProperties();
            this.saveToLocalStorage();
            console.log(`⬇️ Moved step ${stepId} down`);
        }
    }

    moveStep(stepId, newIndex) {
        const currentIndex = this.steps.findIndex(s => s.id === stepId);
        if (currentIndex === -1) return;
        
        const step = this.steps[currentIndex];
        this.steps.splice(currentIndex, 1);
        
        const adjustedIndex = newIndex > currentIndex ? newIndex - 1 : newIndex;
        this.steps.splice(adjustedIndex, 0, step);
        
        this.updateStepKeys();
        this.renderPipeline();
        this.selectStep(stepId);
        this.saveToLocalStorage();
    }

    updateStepKeys() {
        // Update keys based on position for steps that don't have custom keys
        const stepTypeCounts = {};
        
        this.steps.forEach((step, index) => {
            // Skip wait steps and steps with custom keys that don't follow the pattern
            if (step.type === 'wait') return;
            
            // Count steps by type
            if (!stepTypeCounts[step.type]) {
                stepTypeCounts[step.type] = 0;
            }
            stepTypeCounts[step.type]++;
            
            // Only update keys that follow the default pattern or are missing
            const typePrefix = {
                'command': 'build',
                'block': 'block',
                'input': 'input',
                'trigger': 'trigger',
                'group': 'group',
                'plugin': 'plugin',
                'notify': 'notify',
                'annotation': 'annotation',
                'pipeline-upload': 'upload'
            };
            
            const prefix = typePrefix[step.type] || step.type;
            const expectedKey = `${prefix}-${stepTypeCounts[step.type]}`;
            
            // Only update if the key is missing or follows the default pattern
            if (!step.properties.key || step.properties.key.match(new RegExp(`^${prefix}-\\d+$`))) {
                step.properties.key = expectedKey;
            }
        });
        
        // Update any dependencies that reference old keys
        this.updateDependencyReferences();
    }

    updateDependencyReferences() {
        // Create a map of all current valid keys
        const validKeys = new Set();
        this.steps.forEach(step => {
            if (step.properties.key) {
                validKeys.add(step.properties.key);
            }
            if (step.type === 'wait') {
                validKeys.add('wait');
            }
        });
        
        // Update dependencies to only include valid keys
        this.steps.forEach(step => {
            if (step.properties.depends_on) {
                if (Array.isArray(step.properties.depends_on)) {
                    step.properties.depends_on = step.properties.depends_on.filter(dep => validKeys.has(dep));
                    if (step.properties.depends_on.length === 0) {
                        delete step.properties.depends_on;
                    } else if (step.properties.depends_on.length === 1) {
                        step.properties.depends_on = step.properties.depends_on[0];
                    }
                } else if (!validKeys.has(step.properties.depends_on)) {
                    delete step.properties.depends_on;
                }
            }
        });
    }

    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;
        
        if (this.steps.length === 0) {
            this.hideEmptyPipeline();
            container.innerHTML = `
                <div class="empty-pipeline">
                    <i class="fas fa-layer-group"></i>
                    <p>Drag steps here to build your pipeline</p>
                    <p class="hint">Start with a command step or load an example</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.steps.map((step, index) => this.renderStep(step, index)).join('');
        
        // Re-setup drag for existing steps
        this.setupStepDragging();
        
        // Notify YAML generator if available
        if (window.yamlGenerator && window.yamlGenerator.generate) {
            const yaml = window.yamlGenerator.generate({ steps: this.steps });
            // Update the YAML display if it exists
            const yamlContent = document.getElementById('yaml-content');
            if (yamlContent) {
                yamlContent.textContent = yaml;
            }
        }
        
        // Update YAML if app is available
        if (window.buildkiteApp) {
            window.buildkiteApp.updateYAML();
        }
        
        // Emit pipeline changed event
        document.dispatchEvent(new CustomEvent('pipelineChanged'));
    }

    renderStep(step, index) {
        // Check if this is the version 2 format
        if (this.isVersion2Format()) {
            return this.createStepElement(step).outerHTML;
        }
        
        // Version 1 format
        if (step === 'wait' || step.type === 'wait') {
            return `
                <div class="step-card wait-step" data-step-id="${step.id || 'wait-' + index}">
                    <div class="step-content">
                        <i class="fas fa-pause-circle"></i>
                        <span>Wait</span>
                    </div>
                    <div class="step-actions">
                        <button class="btn-icon" data-action="move-up" data-step-id="${step.id || 'wait-' + index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-up"></i>
                        </button>
                        <button class="btn-icon" data-action="move-down" data-step-id="${step.id || 'wait-' + index}" title="Move Down" ${index === this.steps.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <button class="btn-icon" data-action="delete-step" data-step-id="${step.id || 'wait-' + index}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        const icons = {
            command: 'fa-terminal',
            block: 'fa-hand-paper',
            input: 'fa-keyboard',
            trigger: 'fa-bolt',
            group: 'fa-object-group'
        };
        
        const parallelGroupClass = step.properties.parallelGroup ? 
            `parallel-group parallel-group-${step.properties.parallelGroup.replace(/\s+/g, '-').toLowerCase()}` : '';
        
        return `
            <div class="step-card ${step.type}-step ${this.selectedStep?.id === step.id ? 'selected' : ''} ${parallelGroupClass}" 
                 data-step-id="${step.id}" draggable="true" ${step.properties.parallelGroup ? `data-parallel-group="${step.properties.parallelGroup}"` : ''}>
                <div class="step-header">
                    <i class="fas ${icons[step.type] || 'fa-cube'}"></i>
                    <span class="step-label">${this.getStepLabel(step)}</span>
                    ${step.properties.key ? `<code class="step-key">${step.properties.key}</code>` : ''}
                </div>
                ${this.renderStepDetails(step)}
                <div class="step-actions">
                    <button class="btn-icon" data-action="move-up" data-step-id="${step.id}" title="Move Up" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="btn-icon" data-action="move-down" data-step-id="${step.id}" title="Move Down" ${index === this.steps.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="btn-icon" data-action="duplicate-step" data-step-id="${step.id}" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn-icon" data-action="delete-step" data-step-id="${step.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    isVersion2Format() {
        // Check if we should use version 2 format based on DOM structure
        return document.querySelector('.pipeline-step') !== null || 
               document.querySelector('.step-action') !== null;
    }

    createStepElement(step) {
        const stepEl = document.createElement('div');
        stepEl.className = `pipeline-step ${step.type}-step ${this.selectedStep === step.id ? 'selected' : ''}`;
        stepEl.dataset.stepId = step.id;
        
        const style = this.getStepStyle(step.type);
        
        const hasMatrix = step.properties.matrix && Object.keys(step.properties.matrix).length > 0;
        const matrixInfo = hasMatrix ? this.getMatrixInfo(step.properties.matrix) : null;
        
        const hasCondition = step.properties.if || step.properties.unless || step.properties.branches;
        const conditionInfo = hasCondition ? this.getConditionInfo(step.properties) : null;
        
        stepEl.innerHTML = `
            <div class="step-header" style="border-left-color: ${style.color}">
                <div class="step-icon">
                    <i class="fas ${style.icon}"></i>
                </div>
                <div class="step-info">
                    <div class="step-label">${step.properties.label || step.type}</div>
                    ${this.renderStepDescription(step)}
                    <div class="step-badges">
                        ${step.properties.key ? `
                            <span class="step-key-badge">
                                <i class="fas fa-key"></i> ${step.properties.key}
                            </span>
                        ` : ''}
                        ${step.properties.parallelism && step.properties.parallelism > 1 ? `
                            <span class="step-parallel-badge">
                                <i class="fas fa-layer-group"></i> ×${step.properties.parallelism}
                            </span>
                        ` : ''}
                        ${hasMatrix ? `
                            <span class="step-matrix-badge">
                                <i class="fas fa-th"></i> Matrix: ${matrixInfo}
                            </span>
                        ` : ''}
                        ${hasCondition ? `
                            <span class="step-condition-badge">
                                <i class="fas fa-code-branch"></i> ${conditionInfo}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="step-actions">
                    <button class="step-action move-up" title="Move Up">
                        <i class="fas fa-chevron-up"></i>
                    </button>
                    <button class="step-action move-down" title="Move Down">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <button class="step-action duplicate" title="Duplicate">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="step-action delete" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${this.renderStepDetailsV2(step)}
        `;

        return stepEl;
    }

    getStepLabel(step) {
        switch (step.type) {
            case 'command': return step.properties.label || 'Command Step';
            case 'block': return step.properties.block || 'Block Step';
            case 'input': return step.properties.input || 'Input Step';
            case 'trigger': return `Trigger: ${step.properties.trigger || 'pipeline'}`;
            case 'group': return step.properties.group || 'Group Step';
            default: return step.properties.label || 'Step';
        }
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

    getMatrixInfo(matrix) {
        const dimensions = Object.keys(matrix).length;
        let combinations = 1;
        Object.values(matrix).forEach(values => {
            combinations *= values.length;
        });
        return `${dimensions}D, ${combinations} jobs`;
    }

    getConditionInfo(properties) {
        const conditions = [];
        if (properties.if) conditions.push(`if: ${properties.if}`);
        if (properties.unless) conditions.push(`unless: ${properties.unless}`);
        if (properties.branches) conditions.push(`branches: ${properties.branches}`);
        return conditions.join(', ');
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
        
        if (step.properties.depends_on?.length > 0) {
            details.push(`<i class="fas fa-link"></i> Depends on: ${step.properties.depends_on.join(', ')}`);
        }
        
        if (step.properties.if) {
            details.push(`<i class="fas fa-code-branch"></i> if: ${step.properties.if}`);
        }
        
        if (step.properties.plugins && Object.keys(step.properties.plugins).length > 0) {
            const pluginNames = Object.keys(step.properties.plugins).map(p => 
                this.pluginCatalog[p]?.name || p
            );
            details.push(`<i class="fas fa-plug"></i> ${pluginNames.join(', ')}`);
        }
        
        if (step.properties.matrix?.length > 0) {
            const dimensions = step.properties.matrix.flatMap(m => Object.keys(m));
            details.push(`<i class="fas fa-th"></i> Matrix: ${dimensions.join(', ')}`);
        }
        
        if (step.properties.concurrency || step.properties.concurrency_group) {
            let concurrencyText = [];
            if (step.properties.concurrency) {
                concurrencyText.push(`limit: ${step.properties.concurrency}`);
            }
            if (step.properties.concurrency_group) {
                concurrencyText.push(`group: ${step.properties.concurrency_group}`);
            }
            details.push(`<i class="fas fa-layer-group"></i> Concurrency: ${concurrencyText.join(', ')}`);
        }
        
        return details.length > 0 ? 
            `<div class="step-details">${details.map(d => `<small>${d}</small>`).join('')}</div>` : '';
    }

    renderStepDetailsV2(step) {
        const details = [];
        
        if (step.properties.depends_on) {
            const deps = Array.isArray(step.properties.depends_on) ? 
                step.properties.depends_on : [step.properties.depends_on];
            details.push(`<span class="step-detail"><i class="fas fa-link"></i> Depends on: ${deps.join(', ')}</span>`);
        }
        
        if (step.properties.timeout_in_minutes) {
            details.push(`<span class="step-detail"><i class="fas fa-clock"></i> Timeout: ${step.properties.timeout_in_minutes}m</span>`);
        }
        
        if (step.properties.retry) {
            const retryInfo = step.properties.retry.automatic ? 
                `Auto retry: ${step.properties.retry.automatic.limit || 3}x` : 
                'Manual retry allowed';
            details.push(`<span class="step-detail"><i class="fas fa-redo"></i> ${retryInfo}</span>`);
        }
        
        if (step.properties.artifact_paths) {
            const paths = Array.isArray(step.properties.artifact_paths) ? 
                step.properties.artifact_paths : [step.properties.artifact_paths];
            details.push(`<span class="step-detail"><i class="fas fa-file-archive"></i> Artifacts: ${paths.length} path(s)</span>`);
        }
        
        if (step.properties.soft_fail) {
            const softFailText = step.properties.soft_fail === true ? 'Soft fail' : 
                                 Array.isArray(step.properties.soft_fail) ? `Soft fail: [${step.properties.soft_fail.join(', ')}]` :
                                 `Soft fail: ${step.properties.soft_fail}`;
            details.push(`<span class="step-detail"><i class="fas fa-shield-alt"></i> ${softFailText}</span>`);
        }
        
        if (step.properties.cancel_on_build_failing) {
            details.push(`<span class="step-detail"><i class="fas fa-stop-circle"></i> Cancel on failure</span>`);
        }
        
        if (step.properties.agents && Object.keys(step.properties.agents).length > 0) {
            details.push(`<span class="step-detail"><i class="fas fa-server"></i> Agents: ${Object.keys(step.properties.agents).join(', ')}</span>`);
        }
        
        if (step.properties.plugins && Object.keys(step.properties.plugins).length > 0) {
            details.push(`<span class="step-detail"><i class="fas fa-puzzle-piece"></i> Plugins: ${Object.keys(step.properties.plugins).join(', ')}</span>`);
        }
        
        if (step.properties.concurrency || step.properties.concurrency_group) {
            let concurrencyText = [];
            if (step.properties.concurrency) {
                concurrencyText.push(`limit: ${step.properties.concurrency}`);
            }
            if (step.properties.concurrency_group) {
                concurrencyText.push(`group: ${step.properties.concurrency_group}`);
            }
            details.push(`<span class="step-detail"><i class="fas fa-layer-group"></i> Concurrency: ${concurrencyText.join(', ')}</span>`);
        }
        
        // Add parallel group indicator
        if (step.properties.parallelGroup) {
            details.push(`<span class="step-detail parallel-group-indicator"><i class="fas fa-columns"></i> Parallel: ${step.properties.parallelGroup}</span>`);
        }
        
        return details.length > 0 ? `<div class="step-details">${details.join('')}</div>` : '';
    }

    setupStepDragging() {
        document.querySelectorAll('.step-card').forEach(card => {
            card.draggable = true;
            
            card.addEventListener('dragstart', (e) => {
                this.draggedElement = {
                    type: 'existing',
                    stepId: card.dataset.stepId
                };
                e.dataTransfer.effectAllowed = 'move';
                card.classList.add('dragging');
                this.isDragging = true;
                
                // Show drop zones after a short delay
                setTimeout(() => {
                    this.showDropZones();
                }, 0);
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.hideDropZones();
                this.draggedElement = null;
                this.isDragging = false;
                this.dropHandled = false;
            });
        });
        
        // Also setup for pipeline-step elements
        document.querySelectorAll('.pipeline-step').forEach(stepEl => {
            stepEl.draggable = true;
            
            stepEl.addEventListener('dragstart', (e) => {
                this.draggedElement = {
                    type: 'existing',
                    stepId: stepEl.dataset.stepId
                };
                e.dataTransfer.effectAllowed = 'move';
                stepEl.classList.add('dragging');
                this.isDragging = true;
                
                // Show drop zones after a short delay
                setTimeout(() => {
                    this.showDropZones();
                }, 0);
            });
            
            stepEl.addEventListener('dragend', () => {
                stepEl.classList.remove('dragging');
                this.hideDropZones();
                this.draggedElement = null;
                this.isDragging = false;
                this.dropHandled = false;
            });
        });
    }

    createDropZones() {
        // Implementation for creating drop zones during drag
    }

    removeDropZones() {
        // Implementation for removing drop zones after drag
    }

    renderProperties() {
        console.log('🎨 Rendering properties panel...');
        
        // Try both container IDs
        const container = document.getElementById('properties-content') || 
                         document.getElementById('step-properties');
        if (!container) {
            console.warn('⚠️ Properties container not found');
            return;
        }
        
        if (!this.selectedStep) {
            container.innerHTML = `
                <div class="no-selection">
                    <i class="fas fa-mouse-pointer"></i>
                    <p>Select a step to configure</p>
                </div>
            `;
            return;
        }
        
        // Ensure selectedStep is a full object, not just an ID
        if (typeof this.selectedStep === 'string') {
            this.selectedStep = this.steps.find(s => s.id === this.selectedStep);
            if (!this.selectedStep) {
                console.warn('⚠️ Selected step not found in steps array');
                return;
            }
        }
        
        container.innerHTML = this.generatePropertiesForm(this.selectedStep);
        this.setupPropertyFormListeners(this.selectedStep, container);
    }

    generatePropertiesForm(step) {
        console.log('Generating properties form for step:', step);
        let formHtml = `<h3>${this.getStepTypeLabel(step.type)} Configuration</h3>`;
        
        switch (step.type) {
            case 'command':
                console.log('Generating command step form');
                formHtml += this.generateCommandStepForm(step);
                break;
            case 'wait':
                formHtml += this.generateWaitStepForm(step);
                break;
            case 'block':
                formHtml += this.generateBlockStepForm(step);
                break;
            case 'input':
                formHtml += this.generateInputStepForm(step);
                break;
            case 'trigger':
                formHtml += this.generateTriggerStepForm(step);
                break;
            case 'group':
                formHtml += this.generateGroupStepForm(step);
                break;
            case 'annotation':
                formHtml += this.generateAnnotationStepForm(step);
                break;
            case 'notify':
                formHtml += this.generateNotifyStepForm(step);
                break;
            case 'plugin':
                formHtml += this.generatePluginStepForm(step);
                break;
            case 'pipeline-upload':
                formHtml += this.generatePipelineUploadStepForm(step);
                break;
            default:
                formHtml += this.generateGenericStepForm(step);
        }
        
        // Add common properties section
        formHtml += this.generateCommonPropertiesForm(step);
        
        return formHtml;
    }

    getStepTypeLabel(type) {
        const labels = {
            command: 'Command Step',
            wait: 'Wait Step',
            block: 'Block Step',
            input: 'Input Step',
            trigger: 'Trigger Step',
            group: 'Group Step',
            annotation: 'Annotation Step',
            notify: 'Notify Step',
            plugin: 'Plugin Step',
            'pipeline-upload': 'Pipeline Upload Step'
        };
        return labels[type] || 'Step';
    }

    generateCommandStepForm(step) {
        // Ensure properties exist
        if (!step.properties) {
            console.error('Step properties missing:', step);
            step.properties = this.getDefaultProperties('command');
        }
        
        return `
            <div class="property-section">
                <div class="property-group">
                    <label for="step-label">Label</label>
                    <input type="text" id="step-label" value="${step.properties.label || ''}" placeholder="Step label">
                </div>
                <div class="property-group">
                    <label for="step-key">Key</label>
                    <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="Unique step key">
                    <small>Used for dependencies and targeting</small>
                </div>
                <div class="property-group">
                    <label for="step-command">Command</label>
                    <textarea id="step-command" rows="4" placeholder="Commands to run">${step.properties.command || ''}</textarea>
                    <small>Shell commands to execute</small>
                </div>
                <div class="property-group">
                    <label for="step-artifact-paths">Artifact Paths</label>
                    <input type="text" id="step-artifact-paths" value="${step.properties.artifact_paths || ''}" placeholder="build/**/* test-reports/**/*">
                    <small>Files to upload as artifacts (glob patterns, space-separated)</small>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="step-cancel-on-build-failing" ${step.properties.cancel_on_build_failing ? 'checked' : ''}>
                        Cancel on build failing
                    </label>
                    <small>Cancel this step if the build fails</small>
                </div>
                <div class="property-group">
                    <label>Soft Fail</label>
                    <select id="step-soft-fail">
                        <option value="">No soft fail</option>
                        <option value="true" ${step.properties.soft_fail === true ? 'selected' : ''}>Always soft fail</option>
                        <option value="exit_status:*" ${(Array.isArray(step.properties.soft_fail) && step.properties.soft_fail.includes('exit_status:*')) || step.properties.soft_fail === 'exit_status:*' ? 'selected' : ''}>Any non-zero exit</option>
                        <option value="exit_status:1" ${step.properties.soft_fail === 'exit_status:1' ? 'selected' : ''}>Exit code 1</option>
                        <option value="custom">Custom...</option>
                    </select>
                    ${step.properties.soft_fail && !['true', 'exit_status:*', 'exit_status:1'].includes(String(step.properties.soft_fail)) ? 
                        `<input type="text" id="step-soft-fail-custom" value="${step.properties.soft_fail}" placeholder="e.g., exit_status:2" class="mt-2">` : ''}
                </div>
                <div class="property-group">
                    <label>Retry</label>
                    <div class="retry-config">
                        <label>
                            <input type="checkbox" id="step-retry-automatic" ${step.properties.retry?.automatic ? 'checked' : ''}>
                            Automatic retry
                        </label>
                        <label>
                            <input type="checkbox" id="step-retry-manual" ${step.properties.retry?.manual !== false ? 'checked' : ''}>
                            Allow manual retry
                        </label>
                    </div>
                </div>
                <div class="property-group">
                    <label>Matrix Build</label>
                    ${this.renderMatrixSummary(step)}
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.buildkiteApp?.showMatrixBuilder()">
                        <i class="fas fa-th"></i> Configure Matrix
                    </button>
                </div>
                <div class="property-group">
                    <label>Plugins</label>
                    ${this.renderPluginsList(step)}
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-plugin">
                        <i class="fas fa-plug"></i> Add Plugin
                    </button>
                </div>
                <div class="property-group">
                    <label for="step-agents">Agent Targeting</label>
                    <input type="text" id="step-agents-queue" value="${step.properties.agents?.queue || 'default'}" placeholder="Agent queue">
                    <small>Specify agent queue (default: 'default')</small>
                </div>
                <div class="property-group">
                    <label for="step-timeout">Timeout (minutes)</label>
                    <input type="number" id="step-timeout" value="${step.properties.timeout_in_minutes || ''}" placeholder="e.g., 30" min="1">
                    <small>Maximum time for step execution</small>
                </div>
                <div class="property-group">
                    <label for="step-parallelism">Parallelism</label>
                    <input type="number" id="step-parallelism" value="${step.properties.parallelism || ''}" placeholder="e.g., 5" min="1">
                    <small>Number of parallel jobs to run</small>
                </div>
                <div class="property-group">
                    <label for="step-depends-on">Dependencies</label>
                    <input type="text" id="step-depends-on" value="${Array.isArray(step.properties.depends_on) ? step.properties.depends_on.join(', ') : step.properties.depends_on || ''}" placeholder="step-key-1, step-key-2">
                    <small>Comma-separated list of step keys this depends on</small>
                </div>
                <div class="property-group">
                    <label>Environment Variables</label>
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.buildkiteApp?.quickActions?.['variable-manager']?.()">
                        <i class="fas fa-dollar-sign"></i> Manage Variables
                    </button>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="step-skip" ${step.properties.skip ? 'checked' : ''}>
                        Skip this step
                    </label>
                    <small>Step will be skipped during pipeline execution</small>
                </div>
                <div class="property-group">
                    <label>Conditional Execution</label>
                    <input type="text" id="step-if" value="${step.properties.if || ''}" placeholder="e.g., build.branch == 'main'">
                    <button type="button" class="btn btn-secondary btn-small" onclick="window.buildkiteApp?.quickActions?.['conditional-logic']?.()">
                        <i class="fas fa-code-branch"></i> Build Condition
                    </button>
                </div>
            </div>
        `;
    }

    generateWaitStepForm(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    <label for="wait-continue-on-failure">
                        <input type="checkbox" id="wait-continue-on-failure" ${step.properties.continue_on_failure ? 'checked' : ''}>
                        Continue on failure
                    </label>
                    <small>Continue pipeline even if previous steps failed</small>
                </div>
            </div>
        `;
    }

    generateBlockStepForm(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    <label for="block-label">Block Label</label>
                    <input type="text" id="block-label" value="${step.properties.block || ''}" placeholder="e.g., Deploy to Production">
                </div>
                <div class="property-group">
                    <label for="block-prompt">Prompt Message</label>
                    <textarea id="block-prompt" rows="2">${step.properties.prompt || ''}</textarea>
                </div>
                <div class="property-group">
                    <label for="block-fields">Fields</label>
                    <div id="block-fields-list">${this.renderBlockFields(step.properties.fields || [])}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-block-field">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
            </div>
        `;
    }

    generateInputStepForm(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    <label for="input-label">Input Label</label>
                    <input type="text" id="input-label" value="${step.properties.input || ''}" placeholder="e.g., Release Notes">
                </div>
                <div class="property-group">
                    <label for="input-fields">Input Fields</label>
                    <div id="input-fields-list">${this.renderInputFields(step.properties.fields || [])}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-input-field">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
            </div>
        `;
    }

    generateTriggerStepForm(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    <label for="trigger-pipeline">Pipeline to Trigger</label>
                    <input type="text" id="trigger-pipeline" value="${step.properties.trigger || ''}" placeholder="pipeline-slug">
                </div>
                <div class="property-group">
                    <label for="trigger-label">Trigger Label</label>
                    <input type="text" id="trigger-label" value="${step.properties.label || ''}" placeholder="e.g., Deploy to Production">
                </div>
                <div class="property-group">
                    <label for="trigger-branch">Branch</label>
                    <input type="text" id="trigger-branch" value="${step.properties.build?.branch || ''}" placeholder="e.g., main">
                </div>
                <div class="property-group">
                    <label for="trigger-message">Build Message</label>
                    <input type="text" id="trigger-message" value="${step.properties.build?.message || ''}" placeholder="Custom build message">
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="trigger-async" ${step.properties.async !== false ? 'checked' : ''}>
                        Async (don't wait for triggered build)
                    </label>
                </div>
            </div>
        `;
    }

    generateGroupStepForm(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    <label for="group-label">Group Label</label>
                    <input type="text" id="group-label" value="${step.properties.group || ''}" placeholder="e.g., Test Suite">
                </div>
                <div class="property-group">
                    <label for="group-key">Group Key</label>
                    <input type="text" id="group-key" value="${step.properties.key || ''}" placeholder="Unique group key">
                </div>
                <div class="property-group">
                    <p class="info-text">
                        <i class="fas fa-info-circle"></i>
                        Add steps inside this group by configuring them separately
                    </p>
                </div>
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
                    <small>Unique context identifier</small>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="annotation-append" ${step.properties.append ? 'checked' : ''}>
                        Append to existing annotation
                    </label>
                </div>
            </div>
        `;
    }

    generateNotifyStepForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-bell"></i> Notification Channels</h4>
                <div class="property-group">
                    <label for="notify-email">Email Address</label>
                    <input type="email" id="notify-email" value="${step.properties.email || ''}" placeholder="team@example.com">
                    <small>Email address for notifications</small>
                </div>
                <div class="property-group">
                    <label for="notify-slack">Slack Channel</label>
                    <input type="text" id="notify-slack" value="${step.properties.slack || ''}" placeholder="https://hooks.slack.com/...">
                    <small>Slack webhook URL</small>
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

    generateGenericStepForm(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    <label for="step-label">Label</label>
                    <input type="text" id="step-label" value="${step.properties.label || ''}" placeholder="Step label">
                </div>
            </div>
        `;
    }

    generateCommonPropertiesForm(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-sitemap"></i> Dependencies & Parallel Execution</h4>
                <div class="property-group">
                    <label for="parallel-group">Parallel Group</label>
                    <select id="parallel-group" value="${step.properties.parallelGroup || ''}">
                        <option value="">No parallel group (runs after dependencies)</option>
                        ${this.renderParallelGroupOptions(step)}
                    </select>
                    <small>Steps in the same parallel group run simultaneously</small>
                    <div id="parallel-group-members" style="margin-top: 0.5rem;">
                        ${this.renderParallelGroupMembers(step)}
                    </div>
                </div>
                <div class="property-group">
                    <label>Dependencies</label>
                    <div class="dependency-manager">
                        <select id="dependency-select" style="width: 100%;">
                            <option value="">-- Select a dependency --</option>
                            ${this.renderAvailableDependencyOptions(step)}
                        </select>
                        <div class="dependency-list" id="dependency-list">
                            ${this.renderDependencyList(step)}
                        </div>
                        <small>Select steps that must complete before this step</small>
                    </div>
                </div>
                <div class="property-group">
                    <label for="step-if">If Condition</label>
                    <input type="text" id="step-if" value="${step.properties.if || ''}" placeholder="build.branch == 'main'">
                    <small>Only run this step if condition is true</small>
                </div>
                <div class="property-group">
                    <label for="step-branches">Branch Filter</label>
                    <input type="text" id="step-branches" value="${step.properties.branches || ''}" placeholder="main develop feature/*">
                    <small>Only run on matching branches (space separated)</small>
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="step-allow-dependency-failure" ${step.properties.allow_dependency_failure ? 'checked' : ''}>
                        Allow dependency failure
                    </label>
                </div>
            </div>
            <div class="property-section">
                <h4><i class="fas fa-server"></i> Agent Configuration</h4>
                <div class="property-group">
                    <label for="agent-queue">Agent Queue</label>
                    <input type="text" id="agent-queue" value="${step.properties.agents?.queue || 'default'}" placeholder="default">
                </div>
                <div class="property-group">
                    <label for="agent-tags">Agent Tags</label>
                    <input type="text" id="agent-tags" value="${this.formatAgentTags(step.properties.agents)}" placeholder="docker=true size=large">
                    <small>Key=value pairs, space separated</small>
                </div>
            </div>
            <div class="property-section">
                <h4><i class="fas fa-clock"></i> Timeouts & Parallelism</h4>
                <div class="property-group">
                    <label for="step-timeout">Timeout (minutes)</label>
                    <input type="number" id="step-timeout" value="${step.properties.timeout_in_minutes || ''}" min="1" placeholder="60">
                </div>
                <div class="property-group">
                    <label for="step-parallelism">Parallelism</label>
                    <input type="number" id="step-parallelism" value="${step.properties.parallelism || ''}" min="1" placeholder="1">
                </div>
            </div>
            <div class="property-section">
                <h4><i class="fas fa-layer-group"></i> Concurrency Control</h4>
                <div class="property-group">
                    <label for="step-concurrency">Concurrency Limit</label>
                    <input type="number" id="step-concurrency" value="${step.properties.concurrency || ''}" min="1" placeholder="No limit">
                    <small>Maximum number of jobs that can run at the same time</small>
                </div>
                <div class="property-group">
                    <label for="step-concurrency-group">Concurrency Group</label>
                    <input type="text" id="step-concurrency-group" value="${step.properties.concurrency_group || ''}" placeholder="e.g., deploy/prod">
                    <small>Group name for concurrency limits (shared across steps)</small>
                </div>
            </div>
        `;
    }

    renderAvailableDependencyOptions(currentStep) {
        const currentDeps = Array.isArray(currentStep.properties.depends_on) ? 
            currentStep.properties.depends_on : 
            (currentStep.properties.depends_on ? [currentStep.properties.depends_on] : []);
        
        const availableSteps = this.steps.filter(s => 
            s.id !== currentStep.id && 
            (s.properties?.key || s.type === 'wait') &&
            !currentDeps.includes(s.properties?.key || (s.type === 'wait' ? 'wait' : s.id))
        );
        
        return availableSteps.map(step => {
            const key = step.properties?.key || (step.type === 'wait' ? 'wait' : step.id);
            const label = step.properties?.label || step.properties?.block || step.type;
            
            return `<option value="${key}">${label} (${key})</option>`;
        }).join('');
    }

    renderParallelGroupOptions(currentStep) {
        // Get all unique parallel groups from other steps
        const parallelGroups = new Set();
        this.steps.forEach(s => {
            if (s.properties.parallelGroup && s.id !== currentStep.id) {
                parallelGroups.add(s.properties.parallelGroup);
            }
        });
        
        // Add option to create a new group
        let options = '<option value="new-group">+ Create new parallel group</option>';
        
        // Add existing groups
        Array.from(parallelGroups).forEach(group => {
            const selected = currentStep.properties.parallelGroup === group ? 'selected' : '';
            options += `<option value="${group}" ${selected}>Group: ${group}</option>`;
        });
        
        return options;
    }
    
    renderParallelGroupMembers(currentStep) {
        if (!currentStep.properties.parallelGroup) {
            return '';
        }
        
        const members = this.steps.filter(s => 
            s.properties.parallelGroup === currentStep.properties.parallelGroup && 
            s.id !== currentStep.id
        );
        
        if (members.length === 0) {
            return '<small style="color: #718096;">No other steps in this parallel group yet</small>';
        }
        
        return `
            <div style="background: #f7fafc; padding: 0.5rem; border-radius: 4px; margin-top: 0.25rem;">
                <small style="font-weight: 600; color: #4a5568;">Other steps in this group:</small>
                <ul style="margin: 0.25rem 0 0 1.25rem; padding: 0;">
                    ${members.map(s => `<li style="font-size: 0.85rem; color: #718096;">${s.properties.label || s.type}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderDependencyList(step) {
        const currentDeps = Array.isArray(step.properties.depends_on) ? 
            step.properties.depends_on : 
            (step.properties.depends_on ? [step.properties.depends_on] : []);
        
        if (currentDeps.length === 0) {
            return '<div class="no-dependencies">No dependencies</div>';
        }
        
        return currentDeps.map(depKey => {
            const depStep = this.steps.find(s => 
                (s.properties?.key === depKey) || 
                (s.type === 'wait' && depKey === 'wait')
            );
            
            const label = depStep ? 
                (depStep.properties?.label || depStep.properties?.block || depStep.type) : 
                depKey;
            
            return `
                <div class="dependency-item" data-dependency="${depKey}">
                    <span class="dependency-label">${label} (${depKey})</span>
                    <button type="button" class="btn-remove-dependency" data-dependency="${depKey}" title="Remove dependency">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    renderMatrixSummary(step) {
        if (!step.properties.matrix || step.properties.matrix.length === 0) {
            return '<div class="empty-list">No matrix configuration</div>';
        }
        
        const dimensions = step.properties.matrix.flatMap(m => Object.entries(m));
        return `
            <div class="matrix-summary">
                ${dimensions.map(([key, values]) => 
                    `<div><strong>${key}:</strong> ${Array.isArray(values) ? values.join(', ') : values}</div>`
                ).join('')}
            </div>
        `;
    }

    renderPluginsList(step) {
        if (!step.properties.plugins || Object.keys(step.properties.plugins).length === 0) {
            return '<div class="empty-list">No plugins configured</div>';
        }
        
        return `
            <div class="plugins-list">
                ${Object.entries(step.properties.plugins).map(([key, config]) => `
                    <div class="plugin-config" data-plugin="${key}">
                        <div class="plugin-header">
                            <span class="plugin-name">
                                <i class="fas ${this.pluginCatalog[key]?.icon || 'fa-plug'}"></i>
                                ${this.pluginCatalog[key]?.name || key}
                            </span>
                            <button class="btn-icon btn-small" data-action="remove-plugin" data-plugin="${key}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        ${this.renderPluginConfig(key, config)}
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPluginConfig(pluginKey, config) {
        const pluginDef = this.pluginCatalog[pluginKey];
        if (!pluginDef?.config) return '';
        
        return `
            <div class="plugin-fields">
                ${Object.entries(pluginDef.config).map(([fieldKey, fieldDef]) => {
                    const value = config[fieldKey] || fieldDef.default || '';
                    const fieldId = `plugin-${pluginKey}-${fieldKey}`;
                    
                    if (fieldDef.type === 'boolean') {
                        return `
                            <div class="plugin-field">
                                <label>
                                    <input type="checkbox" id="${fieldId}" 
                                           data-plugin="${pluginKey}" 
                                           data-field="${fieldKey}"
                                           ${value ? 'checked' : ''}>
                                    ${fieldDef.description || fieldKey}
                                </label>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="plugin-field">
                                <label for="${fieldId}">${fieldDef.description || fieldKey}</label>
                                <input type="${fieldDef.secret ? 'password' : 'text'}" 
                                       id="${fieldId}"
                                       data-plugin="${pluginKey}" 
                                       data-field="${fieldKey}"
                                       value="${value}" 
                                       placeholder="${fieldDef.default || ''}"
                                       ${fieldDef.required ? 'required' : ''}>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
    }

    renderBlockFields(fields) {
        if (!fields || fields.length === 0) {
            return '<div class="empty-list">No fields configured</div>';
        }
        
        return fields.map((field, index) => `
            <div class="field-config">
                <input type="text" placeholder="Field key" value="${field.key || ''}" data-field="key" data-index="${index}">
                <input type="text" placeholder="Field text" value="${field.text || ''}" data-field="text" data-index="${index}">
                <button class="btn-icon btn-small" data-action="remove-field" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    renderInputFields(fields) {
        return this.renderBlockFields(fields);
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

    formatAgentTags(agents) {
        if (!agents) return '';
        const tags = [];
        Object.entries(agents).forEach(([key, value]) => {
            if (key !== 'queue') {
                tags.push(`${key}=${value}`);
            }
        });
        return tags.join(' ');
    }

    handlePropertyChange(e) {
        if (!this.selectedStep) return;
        
        const input = e.target;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        
        // Handle different property types
        if (input.id === 'step-label') {
            this.selectedStep.properties.label = value;
        } else if (input.id === 'step-key') {
            this.selectedStep.properties.key = value;
        } else if (input.id === 'step-command') {
            this.selectedStep.properties.command = value;
        } else if (input.id === 'step-artifact-paths') {
            this.selectedStep.properties.artifact_paths = value;
        } else if (input.id === 'step-cancel-on-build-failing') {
            this.selectedStep.properties.cancel_on_build_failing = value;
        } else if (input.id === 'step-soft-fail') {
            if (value === 'custom') {
                this.renderProperties();
            } else if (value === '') {
                delete this.selectedStep.properties.soft_fail;
            } else if (value === 'true') {
                this.selectedStep.properties.soft_fail = true;
            } else {
                this.selectedStep.properties.soft_fail = value;
            }
        } else if (input.id === 'step-soft-fail-custom') {
            this.selectedStep.properties.soft_fail = value;
        } else if (input.id === 'step-retry-automatic') {
            if (!this.selectedStep.properties.retry) {
                this.selectedStep.properties.retry = {};
            }
            if (value) {
                this.selectedStep.properties.retry.automatic = true;
            } else {
                delete this.selectedStep.properties.retry.automatic;
            }
        } else if (input.id === 'step-retry-manual') {
            if (!this.selectedStep.properties.retry) {
                this.selectedStep.properties.retry = {};
            }
            this.selectedStep.properties.retry.manual = value;
        } else if (input.id === 'dependency-select-old') {
            // Old multi-select handler - disabled
            const selected = Array.from(input.selectedOptions).map(opt => opt.value);
            if (selected.length > 0) {
                this.selectedStep.properties.depends_on = selected;
            } else {
                delete this.selectedStep.properties.depends_on;
            }
        } else if (input.id === 'step-if') {
            if (value) {
                this.selectedStep.properties.if = value;
            } else {
                delete this.selectedStep.properties.if;
            }
        } else if (input.id === 'step-branches') {
            if (value) {
                this.selectedStep.properties.branches = value;
            } else {
                delete this.selectedStep.properties.branches;
            }
        } else if (input.id === 'step-allow-dependency-failure') {
            this.selectedStep.properties.allow_dependency_failure = value;
        } else if (input.id === 'agent-queue') {
            if (!this.selectedStep.properties.agents) {
                this.selectedStep.properties.agents = {};
            }
            this.selectedStep.properties.agents.queue = value || 'default';
        } else if (input.id === 'agent-tags') {
            if (!this.selectedStep.properties.agents) {
                this.selectedStep.properties.agents = {};
            }
            const tags = value.split(' ').filter(t => t.includes('='));
            tags.forEach(tag => {
                const [key, val] = tag.split('=');
                this.selectedStep.properties.agents[key] = val;
            });
        } else if (input.id === 'step-timeout') {
            if (value) {
                this.selectedStep.properties.timeout_in_minutes = parseInt(value);
            } else {
                delete this.selectedStep.properties.timeout_in_minutes;
            }
        } else if (input.id === 'step-parallelism') {
            if (value && parseInt(value) > 1) {
                this.selectedStep.properties.parallelism = parseInt(value);
            } else {
                delete this.selectedStep.properties.parallelism;
            }
        } else if (input.id === 'parallel-group') {
            if (value === 'new-group') {
                const groupName = prompt('Enter a name for the new parallel group:');
                if (groupName) {
                    this.selectedStep.properties.parallelGroup = groupName;
                    this.renderProperties(); // Re-render to show the new group
                }
            } else if (value) {
                this.selectedStep.properties.parallelGroup = value;
            } else {
                delete this.selectedStep.properties.parallelGroup;
            }
            this.renderProperties(); // Re-render to update group members
        } else if (input.dataset.plugin && input.dataset.field) {
            const plugin = input.dataset.plugin;
            const field = input.dataset.field;
            if (!this.selectedStep.properties.plugins[plugin]) {
                this.selectedStep.properties.plugins[plugin] = {};
            }
            this.selectedStep.properties.plugins[plugin][field] = value;
        }
        
        // Update specific step type properties
        this.handleStepTypeSpecificChanges(input, value);
        
        // Re-render pipeline and update YAML
        this.renderPipeline();
        this.saveToLocalStorage();
        
        if (window.buildkiteApp) {
            window.buildkiteApp.updateYAML();
        }
    }

    handleStepTypeSpecificChanges(input, value) {
        if (!this.selectedStep) return;
        
        switch (this.selectedStep.type) {
            case 'wait':
                if (input.id === 'wait-continue-on-failure') {
                    this.selectedStep.properties.continue_on_failure = value;
                }
                break;
                
            case 'block':
                if (input.id === 'block-label') {
                    this.selectedStep.properties.block = value;
                } else if (input.id === 'block-prompt') {
                    this.selectedStep.properties.prompt = value;
                }
                break;
                
            case 'input':
                if (input.id === 'input-label') {
                    this.selectedStep.properties.input = value;
                }
                break;
                
            case 'trigger':
                if (input.id === 'trigger-pipeline') {
                    this.selectedStep.properties.trigger = value;
                } else if (input.id === 'trigger-label') {
                    this.selectedStep.properties.label = value;
                } else if (input.id === 'trigger-branch') {
                    if (!this.selectedStep.properties.build) {
                        this.selectedStep.properties.build = {};
                    }
                    this.selectedStep.properties.build.branch = value;
                } else if (input.id === 'trigger-message') {
                    if (!this.selectedStep.properties.build) {
                        this.selectedStep.properties.build = {};
                    }
                    this.selectedStep.properties.build.message = value;
                } else if (input.id === 'trigger-async') {
                    this.selectedStep.properties.async = value;
                }
                break;
                
            case 'group':
                if (input.id === 'group-label') {
                    this.selectedStep.properties.group = value;
                } else if (input.id === 'group-key') {
                    this.selectedStep.properties.key = value;
                }
                break;
                
            case 'annotation':
                if (input.id === 'annotation-body') {
                    this.selectedStep.properties.body = value;
                } else if (input.id === 'annotation-style') {
                    this.selectedStep.properties.style = value;
                } else if (input.id === 'annotation-context') {
                    this.selectedStep.properties.context = value;
                } else if (input.id === 'annotation-append') {
                    this.selectedStep.properties.append = value;
                }
                break;
                
            case 'notify':
                if (input.id === 'notify-email') {
                    this.selectedStep.properties.email = value;
                } else if (input.id === 'notify-slack') {
                    this.selectedStep.properties.slack = value;
                } else if (input.id === 'notify-webhook') {
                    this.selectedStep.properties.webhook = value;
                } else if (input.id === 'notify-pagerduty') {
                    this.selectedStep.properties.pagerduty = value;
                }
                break;
                
            case 'pipeline-upload':
                if (input.id === 'pipeline-file') {
                    this.selectedStep.properties.pipeline = value;
                } else if (input.id === 'pipeline-replace') {
                    this.selectedStep.properties.replace = value;
                }
                break;
        }
    }

    handlePropertyAction(e) {
        const action = e.target.closest('[data-action]').dataset.action;
        
        switch (action) {
            case 'add-plugin':
                window.buildkiteApp?.showNotification('Opening plugin catalog...', 'info');
                window.showModal?.('plugin-catalog-modal');
                break;
                
            case 'remove-plugin':
                const pluginKey = e.target.closest('[data-action]').dataset.plugin;
                if (this.selectedStep?.properties.plugins) {
                    delete this.selectedStep.properties.plugins[pluginKey];
                    this.renderProperties();
                    this.renderPipeline();
                    this.saveToLocalStorage();
                }
                break;
                
            case 'add-block-field':
            case 'add-input-field':
                if (!this.selectedStep.properties.fields) {
                    this.selectedStep.properties.fields = [];
                }
                this.selectedStep.properties.fields.push({
                    key: '',
                    text: ''
                });
                this.renderProperties();
                break;
                
            case 'remove-field':
                const index = parseInt(e.target.closest('[data-action]').dataset.index);
                if (this.selectedStep?.properties.fields) {
                    this.selectedStep.properties.fields.splice(index, 1);
                    this.renderProperties();
                }
                break;
                
            case 'add-dependency':
                this.showAddDependencyDialog(this.selectedStep);
                break;
                
            case 'remove-dependency':
                const dep = e.target.closest('[data-action="remove-dependency"]').dataset.dep;
                const deps = Array.isArray(this.selectedStep.properties.depends_on) ? 
                    this.selectedStep.properties.depends_on : 
                    (this.selectedStep.properties.depends_on ? [this.selectedStep.properties.depends_on] : []);
                const depIndex = deps.indexOf(dep);
                if (depIndex > -1) {
                    deps.splice(depIndex, 1);
                    this.selectedStep.properties.depends_on = deps.length > 0 ? (deps.length === 1 ? deps[0] : deps) : null;
                    this.renderProperties();
                    this.renderPipeline();
                    this.saveToLocalStorage();
                }
                break;
                
            case 'add-artifact-path':
                this.showAddArtifactPathDialog(this.selectedStep);
                break;
                
            case 'remove-artifact-path':
                const pathIndex = parseInt(e.target.closest('[data-action="remove-artifact-path"]').dataset.index);
                const paths = Array.isArray(this.selectedStep.properties.artifact_paths) ? 
                    this.selectedStep.properties.artifact_paths : [this.selectedStep.properties.artifact_paths];
                paths.splice(pathIndex, 1);
                this.selectedStep.properties.artifact_paths = paths.length > 0 ? paths : null;
                this.renderProperties();
                this.renderPipeline();
                this.saveToLocalStorage();
                break;
                
            case 'add-agent-tag':
                this.showAddAgentTagDialog(this.selectedStep);
                break;
                
            case 'remove-agent-tag':
                const agentKey = e.target.closest('[data-action="remove-agent-tag"]').dataset.key;
                if (this.selectedStep.properties.agents) {
                    delete this.selectedStep.properties.agents[agentKey];
                    this.renderProperties();
                    this.saveToLocalStorage();
                }
                break;
                
            case 'add-env-var':
                this.showAddEnvVarDialog(this.selectedStep);
                break;
                
            case 'remove-env-var':
                const envKey = e.target.closest('[data-action="remove-env-var"]').dataset.key;
                if (this.selectedStep.properties.env) {
                    delete this.selectedStep.properties.env[envKey];
                    this.renderProperties();
                    this.saveToLocalStorage();
                }
                break;
        }
    }

    setupPropertyFormListeners(step, container) {
        if (!container) {
            container = document.getElementById('properties-content') || document.getElementById('step-properties');
        }
        if (!container) return;

        // Label change
        const labelInput = container.querySelector('#step-label');
        if (labelInput) {
            labelInput.addEventListener('input', (e) => {
                step.properties.label = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
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

    setupCommandStepListeners(step, container) {
        const commandInput = container.querySelector('#step-command');
        if (commandInput) {
            commandInput.addEventListener('input', (e) => {
                step.properties.command = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const keyInput = container.querySelector('#step-key');
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                step.properties.key = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const timeoutInput = container.querySelector('#step-timeout');
        if (timeoutInput) {
            timeoutInput.addEventListener('input', (e) => {
                step.properties.timeout_in_minutes = e.target.value ? parseInt(e.target.value) : null;
                this.saveToLocalStorage();
            });
        }

        const parallelismInput = container.querySelector('#step-parallelism');
        if (parallelismInput) {
            parallelismInput.addEventListener('input', (e) => {
                step.properties.parallelism = e.target.value ? parseInt(e.target.value) : null;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        // Agent queue
        const agentQueueInput = container.querySelector('#step-agents-queue');
        if (agentQueueInput) {
            agentQueueInput.addEventListener('input', (e) => {
                if (!step.properties.agents) step.properties.agents = {};
                step.properties.agents.queue = e.target.value || 'default';
                this.saveToLocalStorage();
            });
        }

        // Dependencies
        const dependsOnInput = container.querySelector('#step-depends-on');
        if (dependsOnInput) {
            dependsOnInput.addEventListener('input', (e) => {
                const deps = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                step.properties.depends_on = deps.length > 0 ? deps : null;
                this.saveToLocalStorage();
            });
        }

        // Skip checkbox
        const skipCheckbox = container.querySelector('#step-skip');
        if (skipCheckbox) {
            skipCheckbox.addEventListener('change', (e) => {
                step.properties.skip = e.target.checked;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        // Conditional execution
        const ifInput = container.querySelector('#step-if');
        if (ifInput) {
            ifInput.addEventListener('input', (e) => {
                step.properties.if = e.target.value || null;
                this.saveToLocalStorage();
            });
        }

        // Soft fail configuration
        const softFailSelect = container.querySelector('#step-soft-fail');
        if (softFailSelect) {
            softFailSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (!value) {
                    step.properties.soft_fail = false;
                } else if (value === 'true') {
                    step.properties.soft_fail = true;
                } else if (value === 'custom') {
                    // Handle custom input
                    this.renderProperties();
                } else {
                    step.properties.soft_fail = value;
                }
                this.saveToLocalStorage();
            });
        }

        // Custom soft fail input
        const softFailCustom = container.querySelector('#step-soft-fail-custom');
        if (softFailCustom) {
            softFailCustom.addEventListener('input', (e) => {
                step.properties.soft_fail = e.target.value || false;
                this.saveToLocalStorage();
            });
        }

        const softFailCodes = container.querySelector('#step-soft-fail-codes');
        if (softFailCodes) {
            softFailCodes.addEventListener('input', (e) => {
                const codes = e.target.value.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c));
                step.properties.soft_fail = codes;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const cancelOnFailCheckbox = container.querySelector('#step-cancel-on-build-failing');
        if (cancelOnFailCheckbox) {
            cancelOnFailCheckbox.addEventListener('change', (e) => {
                step.properties.cancel_on_build_failing = e.target.checked;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        // Plugin configuration inputs
        container.querySelectorAll('.plugin-config-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const pluginKey = e.target.dataset.plugin;
                const configKey = e.target.dataset.configKey;
                if (!step.properties.plugins[pluginKey]) {
                    step.properties.plugins[pluginKey] = {};
                }
                step.properties.plugins[pluginKey][configKey] = e.target.value;
                this.saveToLocalStorage();
            });
        });
    }

    setupWaitStepListeners(step, container) {
        const continueCheckbox = container.querySelector('#wait-continue-on-failure');
        if (continueCheckbox) {
            continueCheckbox.addEventListener('change', (e) => {
                step.properties.continue_on_failure = e.target.checked;
                this.saveToLocalStorage();
            });
        }
    }

    setupBlockStepListeners(step, container) {
        const promptInput = container.querySelector('#block-prompt');
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                step.properties.prompt = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const blockedStateSelect = container.querySelector('#step-blocked-state');
        if (blockedStateSelect) {
            blockedStateSelect.addEventListener('change', (e) => {
                step.properties.blocked_state = e.target.value;
                this.saveToLocalStorage();
            });
        }
    }

    setupInputStepListeners(step, container) {
        const promptInput = container.querySelector('#input-prompt');
        if (promptInput) {
            promptInput.addEventListener('input', (e) => {
                step.properties.prompt = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }
    }

    setupTriggerStepListeners(step, container) {
        const triggerInput = container.querySelector('#trigger-pipeline');
        if (triggerInput) {
            triggerInput.addEventListener('input', (e) => {
                step.properties.trigger = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const asyncCheckbox = container.querySelector('#trigger-async');
        if (asyncCheckbox) {
            asyncCheckbox.addEventListener('change', (e) => {
                step.properties.async = e.target.checked;
                this.saveToLocalStorage();
            });
        }
    }

    setupGroupStepListeners(step, container) {
        const groupInput = container.querySelector('#group-label');
        if (groupInput) {
            groupInput.addEventListener('input', (e) => {
                step.properties.group = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const keyInput = container.querySelector('#step-key');
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                step.properties.key = e.target.value;
                this.saveToLocalStorage();
            });
        }
    }

    setupAnnotationStepListeners(step, container) {
        const bodyInput = container.querySelector('#annotation-body');
        if (bodyInput) {
            bodyInput.addEventListener('input', (e) => {
                step.properties.body = e.target.value;
                this.saveToLocalStorage();
            });
        }

        const styleSelect = container.querySelector('#annotation-style');
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                step.properties.style = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const contextInput = container.querySelector('#annotation-context');
        if (contextInput) {
            contextInput.addEventListener('input', (e) => {
                step.properties.context = e.target.value;
                this.saveToLocalStorage();
            });
        }

        const appendCheckbox = container.querySelector('#annotation-append');
        if (appendCheckbox) {
            appendCheckbox.addEventListener('change', (e) => {
                step.properties.append = e.target.checked;
                this.saveToLocalStorage();
            });
        }
    }

    setupNotifyStepListeners(step, container) {
        const emailInput = container.querySelector('#notify-email');
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                step.properties.email = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const slackInput = container.querySelector('#notify-slack');
        if (slackInput) {
            slackInput.addEventListener('input', (e) => {
                step.properties.slack = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const webhookInput = container.querySelector('#notify-webhook');
        if (webhookInput) {
            webhookInput.addEventListener('input', (e) => {
                step.properties.webhook = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const pagerdutyInput = container.querySelector('#notify-pagerduty');
        if (pagerdutyInput) {
            pagerdutyInput.addEventListener('input', (e) => {
                step.properties.pagerduty = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
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
                this.saveToLocalStorage();
            }
        });

        container.querySelectorAll('.plugin-config-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const pluginKey = e.target.dataset.plugin;
                const configKey = e.target.dataset.configKey;
                if (!step.properties.plugins[pluginKey]) {
                    step.properties.plugins[pluginKey] = {};
                }
                step.properties.plugins[pluginKey][configKey] = e.target.value;
                this.saveToLocalStorage();
            });
        });
    }

    setupPipelineUploadListeners(step, container) {
        const pipelineInput = container.querySelector('#pipeline-file');
        if (pipelineInput) {
            pipelineInput.addEventListener('input', (e) => {
                step.properties.pipeline = e.target.value;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        const replaceCheckbox = container.querySelector('#pipeline-replace');
        if (replaceCheckbox) {
            replaceCheckbox.addEventListener('change', (e) => {
                step.properties.replace = e.target.checked;
                this.saveToLocalStorage();
            });
        }
    }

    setupCommonPropertyListeners(step, container) {
        // If condition
        const ifInput = container.querySelector('#step-if');
        if (ifInput) {
            ifInput.addEventListener('input', (e) => {
                step.properties.if = e.target.value || null;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        // Unless condition
        const unlessInput = container.querySelector('#step-unless');
        if (unlessInput) {
            unlessInput.addEventListener('input', (e) => {
                step.properties.unless = e.target.value || null;
                this.saveToLocalStorage();
            });
        }

        // Branches filter
        const branchesInput = container.querySelector('#step-branches');
        if (branchesInput) {
            branchesInput.addEventListener('input', (e) => {
                step.properties.branches = e.target.value || null;
                this.saveToLocalStorage();
            });
        }

        // Skip checkbox
        const skipCheckbox = container.querySelector('#step-skip');
        if (skipCheckbox) {
            skipCheckbox.addEventListener('change', (e) => {
                step.properties.skip = e.target.checked;
                this.renderPipeline();
                this.saveToLocalStorage();
            });
        }

        // Allow failure checkbox
        const allowFailureCheckbox = container.querySelector('#step-allow-dependency-failure');
        if (allowFailureCheckbox) {
            allowFailureCheckbox.addEventListener('change', (e) => {
                step.properties.allow_dependency_failure = e.target.checked;
                this.saveToLocalStorage();
            });
        }

        // Retry configuration
        const retryCheckbox = container.querySelector('#step-retry-automatic');
        if (retryCheckbox) {
            retryCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!step.properties.retry) step.properties.retry = {};
                    step.properties.retry.automatic = {
                        exit_status: '*',
                        limit: 3
                    };
                } else {
                    if (step.properties.retry) {
                        delete step.properties.retry.automatic;
                        if (Object.keys(step.properties.retry).length === 0) {
                            step.properties.retry = null;
                        }
                    }
                }
                this.renderProperties();
                this.saveToLocalStorage();
            });
        }

        const manualRetryCheckbox = container.querySelector('#step-retry-manual');
        if (manualRetryCheckbox) {
            manualRetryCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!step.properties.retry) step.properties.retry = {};
                    step.properties.retry.manual = {
                        allowed: true,
                        reason: false,
                        permit_on_passed: false
                    };
                } else {
                    if (step.properties.retry) {
                        delete step.properties.retry.manual;
                        if (Object.keys(step.properties.retry).length === 0) {
                            step.properties.retry = null;
                        }
                    }
                }
                this.renderProperties();
                this.saveToLocalStorage();
            });
        }

        const retryLimit = container.querySelector('#retry-limit');
        if (retryLimit && step.properties.retry && step.properties.retry.automatic) {
            retryLimit.addEventListener('input', (e) => {
                step.properties.retry.automatic.limit = parseInt(e.target.value) || 3;
                this.saveToLocalStorage();
            });
        }

        const retryExitStatus = container.querySelector('#retry-exit-status');
        if (retryExitStatus && step.properties.retry && step.properties.retry.automatic) {
            retryExitStatus.addEventListener('input', (e) => {
                step.properties.retry.automatic.exit_status = e.target.value || '*';
                this.saveToLocalStorage();
            });
        }

        // Concurrency fields
        const concurrencyInput = container.querySelector('#step-concurrency');
        if (concurrencyInput) {
            concurrencyInput.addEventListener('input', (e) => {
                if (e.target.value) {
                    step.properties.concurrency = parseInt(e.target.value);
                } else {
                    delete step.properties.concurrency;
                }
                this.saveToLocalStorage();
            });
        }

        const concurrencyGroupInput = container.querySelector('#step-concurrency-group');
        if (concurrencyGroupInput) {
            concurrencyGroupInput.addEventListener('input', (e) => {
                if (e.target.value) {
                    step.properties.concurrency_group = e.target.value;
                } else {
                    delete step.properties.concurrency_group;
                }
                this.saveToLocalStorage();
            });
        }

        // Dependency dropdown
        const dependencySelect = container.querySelector('#dependency-select');
        if (dependencySelect) {
            dependencySelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                if (selectedValue) {
                    // Add to dependencies
                    if (!step.properties.depends_on) {
                        step.properties.depends_on = [];
                    } else if (!Array.isArray(step.properties.depends_on)) {
                        step.properties.depends_on = [step.properties.depends_on];
                    }
                    
                    if (!step.properties.depends_on.includes(selectedValue)) {
                        // Check if the dependency is in the same parallel group
                        const depStep = this.steps.find(s => 
                            (s.properties?.key === selectedValue) || 
                            (s.type === 'wait' && selectedValue === 'wait')
                        );
                        
                        if (depStep && depStep.properties.parallelGroup && 
                            depStep.properties.parallelGroup === step.properties.parallelGroup) {
                            alert('Cannot add dependency on a step in the same parallel group. Steps in the same parallel group run simultaneously.');
                            e.target.value = '';
                            return;
                        }
                        
                        step.properties.depends_on.push(selectedValue);
                        this.renderProperties();
                        this.renderPipeline();
                        this.saveToLocalStorage();
                    }
                    
                    // Reset dropdown
                    e.target.value = '';
                }
            });
        }

        // Remove dependency buttons - use event delegation properly
        const removeDependencyHandler = (e) => {
            if (e.target.closest('.btn-remove-dependency')) {
                const depKey = e.target.closest('.btn-remove-dependency').dataset.dependency;
                if (depKey && step.properties.depends_on) {
                    if (Array.isArray(step.properties.depends_on)) {
                        step.properties.depends_on = step.properties.depends_on.filter(d => d !== depKey);
                        if (step.properties.depends_on.length === 0) {
                            delete step.properties.depends_on;
                        } else if (step.properties.depends_on.length === 1) {
                            step.properties.depends_on = step.properties.depends_on[0];
                        }
                    } else if (step.properties.depends_on === depKey) {
                        delete step.properties.depends_on;
                    }
                    
                    this.renderProperties();
                    this.renderPipeline();
                    this.saveToLocalStorage();
                }
            }
        };
        
        // Remove any existing handler first
        if (this._removeDependencyHandler) {
            container.removeEventListener('click', this._removeDependencyHandler);
        }
        
        // Store reference and add new handler
        this._removeDependencyHandler = removeDependencyHandler;
        container.addEventListener('click', removeDependencyHandler);
    }

    setupActionButtonListeners(step, container) {
        const actionHandler = (e) => {
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
                        this.saveToLocalStorage();
                    }
                    break;
                case 'remove-env-var':
                    const envKey = e.target.closest('[data-action="remove-env-var"]').dataset.key;
                    if (step.properties.env) {
                        delete step.properties.env[envKey];
                        this.renderProperties();
                        this.saveToLocalStorage();
                    }
                    break;
                case 'remove-plugin':
                    const pluginKey = e.target.closest('[data-action="remove-plugin"]').dataset.plugin;
                    if (step.properties.plugins) {
                        delete step.properties.plugins[pluginKey];
                        this.renderProperties();
                        this.renderPipeline();
                        this.saveToLocalStorage();
                    }
                    break;
                case 'add-block-field':
                    this.showAddBlockFieldDialog(step);
                    break;
                case 'remove-block-field':
                    const blockFieldIndex = parseInt(e.target.closest('[data-action="remove-block-field"]').dataset.index);
                    step.properties.fields.splice(blockFieldIndex, 1);
                    this.renderProperties();
                    this.saveToLocalStorage();
                    break;
                case 'add-input-field':
                    this.showAddInputFieldDialog(step);
                    break;
                case 'remove-input-field':
                    const inputFieldIndex = parseInt(e.target.closest('[data-action="remove-input-field"]').dataset.index);
                    step.properties.fields.splice(inputFieldIndex, 1);
                    this.renderProperties();
                    this.saveToLocalStorage();
                    break;
                case 'configure-build':
                    this.showBuildConfigDialog(step);
                    break;
                case 'configure-matrix':
                    this.showMatrixConfigDialog(step);
                    break;
            }
        };
        
        // Remove any existing handler first
        if (this._actionHandler) {
            container.removeEventListener('click', this._actionHandler);
        }
        
        // Store reference and add new handler
        this._actionHandler = actionHandler;
        container.addEventListener('click', actionHandler);
    }

    // Dialog methods
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
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
    }

    showAddArtifactPathDialog(step) {
        const path = prompt('Artifact path (supports glob patterns):', 'build/**/*');
        if (!path) return;
        
        if (!step.properties.artifact_paths) {
            step.properties.artifact_paths = [];
        } else if (!Array.isArray(step.properties.artifact_paths)) {
            step.properties.artifact_paths = [step.properties.artifact_paths];
        }
        
        step.properties.artifact_paths.push(path);
        this.renderProperties();
        this.renderPipeline();
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
    }

    showMatrixConfigDialog(step) {
        alert('Matrix configuration is available in the Matrix Builder. Click the "Matrix Builder" button in the sidebar.');
    }

    showPluginCatalog(step) {
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.style.display = 'block';
            window.currentStepForPlugin = step;
        } else {
            this.showPluginSelector(step);
        }
    }

    // Plugin methods
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
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        this.saveToLocalStorage();
        
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
        
        this.renderPipeline();
        this.selectStep(step.id);
        this.updateStepCount();
        this.saveToLocalStorage();
        
        console.log(`✅ Added plugin step: ${pluginKey} at index ${index}`);
    }

    // Template and pattern loading
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
        
        template.forEach(stepConfig => {
            const step = this.addStep(stepConfig.type, index);
            if (step && stepConfig.properties) {
                Object.assign(step.properties, stepConfig.properties);
            }
            if (index >= 0) index++;
        });
        
        this.renderPipeline();
        this.renderProperties();
        this.saveToLocalStorage();
        
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification(`Template "${templateName}" loaded`, 'success');
        }
    }

    loadPattern(patternName, index = -1) {
        console.log(`🎨 Loading pattern: ${patternName}`);
        
        const patterns = {
            'parallel-tests': [
                { type: 'command', properties: { 
                    label: 'Parallel Tests', 
                    command: 'npm test', 
                    key: 'parallel-tests',
                    parallelism: 5 
                }}
            ],
            'conditional-deploy': [
                { type: 'block', properties: { 
                    prompt: 'Deploy to production?', 
                    key: 'deploy-gate',
                    fields: [
                        { type: 'text', key: 'release_notes', hint: 'What changed in this release?' }
                    ]
                }},
                { type: 'command', properties: { 
                    label: 'Deploy to Production', 
                    command: './deploy-prod.sh', 
                    key: 'deploy-prod',
                    depends_on: 'deploy-gate',
                    if: 'build.branch == "main"'
                }}
            ],
            'matrix-build': [
                { type: 'command', properties: {
                    label: 'Matrix Build',
                    command: 'npm test',
                    key: 'matrix-test',
                    matrix: {
                        'node': ['14', '16', '18'],
                        'os': ['linux', 'macos']
                    }
                }}
            ]
        };
        
        const pattern = patterns[patternName];
        if (!pattern) {
            console.warn(`Pattern not found: ${patternName}`);
            return;
        }
        
        pattern.forEach((stepConfig, i) => {
            const step = this.createStep(stepConfig.type);
            Object.assign(step.properties, stepConfig.properties);
            
            if (index >= 0) {
                this.steps.splice(index + i, 0, step);
            } else {
                this.steps.push(step);
            }
        });
        
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        this.saveToLocalStorage();
        
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification(`Pattern "${patternName}" added`, 'success');
        }
    }

    loadPatternAtIndex(patternType, index) {
        this.loadPattern(patternType, index);
    }

    loadExample() {
        if (this.steps.length > 0) {
            if (!confirm('This will replace your current pipeline. Continue?')) {
                return;
            }
        }
        
        // Clear pipeline
        this.clearPipeline();
        
        // Add example steps
        const testStep = this.addStep('command');
        testStep.properties = {
            label: '🧪 Run Tests',
            key: 'test',
            command: 'npm test',
            artifact_paths: 'coverage/**/*',
            agents: { queue: 'default' }
        };
        
        this.addStep('wait');
        
        const buildStep = this.addStep('command');
        buildStep.properties = {
            label: '📦 Build',
            key: 'build',
            command: 'npm run build',
            artifact_paths: 'dist/**/*',
            depends_on: ['test'],
            agents: { queue: 'default' }
        };
        
        const deployBlock = this.addStep('block');
        deployBlock.properties = {
            block: '🚀 Deploy to Production',
            prompt: 'Are you sure you want to deploy?',
            fields: [
                { key: 'release-notes', text: 'Release Notes', required: false }
            ]
        };
        
        const deployStep = this.addStep('command');
        deployStep.properties = {
            label: '🚀 Deploy',
            key: 'deploy',
            command: 'npm run deploy',
            depends_on: ['build'],
            branches: 'main',
            agents: { queue: 'deploy' }
        };
        
        this.renderPipeline();
        this.selectStep(testStep);
        
        console.log('📋 Loaded example pipeline');
    }

    clearPipeline() {
        if (this.steps.length === 0) {
            alert('Pipeline is already empty.');
            return;
        }
        
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.renderPipeline();
        this.renderProperties();
        this.updateStepCount();
        this.saveToLocalStorage();
        console.log('🧹 Pipeline cleared');
    }

    // Export and conversion methods
    exportConfig() {
        return {
            steps: this.steps.map(step => {
                if (step.type === 'wait') {
                    return step.properties?.continue_on_failure ? 
                        { wait: { continue_on_failure: true } } : 'wait';
                }
                return { ...step.properties };
            })
        };
    }

    getPipelineConfig() {
        return {
            steps: this.steps.map(step => this.convertStepToYAML(step))
        };
    }

    convertStepToYAML(step) {
        const yamlStep = {};
        
        switch (step.type) {
            case 'wait':
                if (step.properties.continue_on_failure) {
                    yamlStep.wait = { continue_on_failure: true };
                } else {
                    yamlStep.wait = null;
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
                yamlStep.steps = step.properties.steps || [];
                break;
                
            default:
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
        
        if (step.properties.artifact_paths) {
            yamlStep.artifact_paths = step.properties.artifact_paths;
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
        
        if (step.properties.soft_fail !== false) {
            yamlStep.soft_fail = step.properties.soft_fail;
        }
        
        if (step.properties.cancel_on_build_failing) {
            yamlStep.cancel_on_build_failing = true;
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

    exportYAML() {
        if (window.yamlGenerator) {
            const yaml = window.yamlGenerator.generateYAML(this.steps);
            console.log('📋 Generated YAML:', yaml);
            window.yamlGenerator.downloadYAML(yaml);
        } else {
            const modal = document.getElementById('yaml-output-modal');
            if (modal && window.yamlGenerator) {
                const config = this.getPipelineConfig();
                const yaml = window.yamlGenerator.generate(config);
                
                const output = document.getElementById('export-yaml-output');
                if (output) {
                    output.innerHTML = window.yamlGenerator.prettify(yaml);
                }
                
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
                
                modal.style.display = 'block';
                modal.classList.remove('hidden');
            }
        }
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

    saveToLocalStorage() {
        try {
            const data = {
                steps: this.steps,
                stepCounter: this.stepCounter,
                version: '1.0'
            };
            localStorage.setItem('buildkite-pipeline', JSON.stringify(data));
            console.log('💾 Pipeline saved to localStorage');
        } catch (e) {
            console.warn('⚠️ Failed to save to localStorage:', e);
        }
    }

    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem('buildkite-pipeline');
            if (savedData) {
                const data = JSON.parse(savedData);
                if (data.version === '1.0') {
                    this.steps = data.steps || [];
                    this.stepCounter = data.stepCounter || 0;
                    console.log('📂 Pipeline loaded from localStorage');
                } else {
                    // Handle legacy format
                    const config = JSON.parse(savedData);
                    if (config.steps) {
                        this.steps = config.steps.map((stepConfig, index) => {
                            if (stepConfig === 'wait' || stepConfig.wait) {
                                return {
                                    id: `wait-${index}`,
                                    type: 'wait',
                                    properties: stepConfig.wait || {}
                                };
                            }
                            
                            let type = 'command';
                            if (stepConfig.block) type = 'block';
                            else if (stepConfig.input) type = 'input';
                            else if (stepConfig.trigger) type = 'trigger';
                            else if (stepConfig.group) type = 'group';
                            
                            return {
                                id: `step-${++this.stepCounter}-${Date.now()}`,
                                type: type,
                                properties: stepConfig
                            };
                        });
                        
                        console.log('✅ Pipeline loaded from localStorage (legacy format)');
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ Failed to load from localStorage:', e);
        }
    }

    validatePipeline() {
        console.log('✅ Validating pipeline...');
        
        const issues = [];
        
        this.steps.forEach(step => {
            if (step.type === 'command' && !step.properties.command) {
                issues.push(`Step "${step.properties.label}" has no command`);
            }
            
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
            
            if (step.properties.matrix) {
                const dimensions = Object.keys(step.properties.matrix).length;
                if (dimensions > this.limits.maxMatrixDimensions) {
                    issues.push(`Step "${step.properties.label}" exceeds maximum matrix dimensions (${dimensions}/${this.limits.maxMatrixDimensions})`);
                }
                
                let totalJobs = 1;
                Object.values(step.properties.matrix).forEach(values => {
                    totalJobs *= values.length;
                });
                
                if (totalJobs > this.limits.maxMatrixJobs) {
                    issues.push(`Step "${step.properties.label}" would create ${totalJobs} jobs, exceeding limit of ${this.limits.maxMatrixJobs}`);
                }
            }
        });
        
        if (issues.length > 0) {
            alert(`Pipeline validation issues:\n\n${issues.join('\n')}`);
        } else {
            alert('Pipeline validation passed! ✅');
        }
        
        return issues.length === 0;
    }

    updateStepProperty(stepId, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
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
        this.saveToLocalStorage();
        
        if (window.yamlGenerator) {
            window.yamlGenerator.updateYAML(this.steps);
        }
    }

    showPluginCatalogModal() {
        console.log('🏪 Opening plugin catalog...');
        const event = new CustomEvent('openPluginCatalog');
        document.dispatchEvent(event);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
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

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipelineBuilder;
}