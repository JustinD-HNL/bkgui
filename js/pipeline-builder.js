// Pipeline Builder Core Functionality
class PipelineBuilder {
    constructor() {
        this.steps = [];
        this.selectedStep = null;
        this.stepCounter = 0;
        this.init();
    }

    init() {
        this.setupDragAndDrop();
        this.setupEventListeners();
    }

    setupDragAndDrop() {
        // Make step types draggable
        const stepTypes = document.querySelectorAll('.step-type');
        stepTypes.forEach(stepType => {
            stepType.addEventListener('dragstart', this.handleDragStart.bind(this));
        });

        // Setup drop zones
        const pipelineSteps = document.getElementById('pipeline-steps');
        pipelineSteps.addEventListener('dragover', this.handleDragOver.bind(this));
        pipelineSteps.addEventListener('drop', this.handleDrop.bind(this));
        pipelineSteps.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('clear-pipeline').addEventListener('click', this.clearPipeline.bind(this));
        document.getElementById('load-example').addEventListener('click', this.loadExample.bind(this));
        document.getElementById('export-yaml').addEventListener('click', this.exportYAML.bind(this));

        // Modal events
        document.querySelector('.modal-close').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('copy-yaml').addEventListener('click', this.copyYAML.bind(this));
        document.getElementById('download-yaml').addEventListener('click', this.downloadYAML.bind(this));

        // Click outside modal to close
        document.getElementById('yaml-modal').addEventListener('click', (e) => {
            if (e.target.id === 'yaml-modal') {
                this.closeModal();
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
                    soft_fail: false
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
            }
        };

        return {
            id: stepId,
            ...stepConfigs[stepType]
        };
    }

    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
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
            emptyState.innerHTML = `
                <i class="fas fa-plus-circle"></i>
                <span>Drop steps here to start building your pipeline</span>
            `;
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
                    <div class="property-checkbox">
                        <input type="checkbox" name="retry" ${step.properties.retry ? 'checked' : ''} />
                        <label>Retry on failure</label>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" name="soft_fail" ${step.properties.soft_fail ? 'checked' : ''} />
                        <label>Soft fail</label>
                    </div>
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
                    <textarea name="steps" placeholder='[{"command": "echo 'step 1'"}, {"command": "echo 'step 2'"}]'>${JSON.stringify(step.properties.steps, null, 2)}</textarea>
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
        } else if (name === 'fields' || name === 'build' || name === 'steps') {
            try {
                this.selectedStep.properties[name] = JSON.parse(value || '[]');
            } catch (error) {
                console.warn('Invalid JSON:', error);
            }
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
        document.getElementById('yaml-output').value = yamlContent;
        document.getElementById('yaml-modal').classList.remove('hidden');
    }

    copyYAML() {
        const yamlOutput = document.getElementById('yaml-output');
        yamlOutput.select();
        yamlOutput.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            const btn = document.getElementById('copy-yaml');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                btn.innerHTML = originalText;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    downloadYAML() {
        const yamlContent = document.getElementById('yaml-output').value;
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
        document.getElementById('yaml-modal').classList.add('hidden');
    }
}

// Initialize pipeline builder when DOM is ready
let pipelineBuilder;
document.addEventListener('DOMContentLoaded', () => {
    pipelineBuilder = new PipelineBuilder();
});
