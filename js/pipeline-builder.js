// js/pipeline-builder.js
// Pipeline Builder Core Functionality with Enhanced Features and Matrix Builder
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
        this.currentMatrixDimensions = [];
        this.matrixDimensionCounter = 0;
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
                    account_ids: { type: 'array', label: 'AWS Account IDs' },
                    region: { type: 'text', label: 'AWS Region' },
                    registry_id: { type: 'text', label: 'Registry ID' }
                }
            }
            // ADD these to your existing plugin catalog:
            'slack': {
                name: 'Slack',
                description: 'Send notifications to Slack',
                version: 'v1.4.2',
                category: 'notifications',
                fields: {
                    channels: { type: 'array', label: 'Channels' },
                    message: { type: 'text', label: 'Message' },
                    webhook_url: { type: 'text', label: 'Webhook URL' }
                }
            },
            'kubernetes': {
                name: 'Kubernetes',
                description: 'Deploy to Kubernetes clusters',
                version: 'v1.4.1',
                category: 'deployment',
                fields: {
                    apply: { type: 'array', label: 'Manifest Files' },
                    namespace: { type: 'text', label: 'Namespace' },
                    context: { type: 'text', label: 'Kubectl Context' }
                }
            },
            'terraform': {
                name: 'Terraform',
                description: 'Run Terraform commands',
                version: 'v1.0.0',
                category: 'deployment',
                fields: {
                    init: { type: 'boolean', label: 'Run Init' },
                    plan: { type: 'boolean', label: 'Run Plan' },
                    apply: { type: 'boolean', label: 'Run Apply' }
                }
            },
            'codecov': {
                name: 'Codecov',
                description: 'Upload coverage reports to Codecov',
                version: 'v2.2.4',
                category: 'testing',
                fields: {
                    file: { type: 'text', label: 'Coverage File' },
                    token: { type: 'text', label: 'Codecov Token' }
                }
            },
            'cache': {
                name: 'Cache',
                description: 'Cache dependencies and build artifacts',
                version: 'v2.4.0',
                category: 'optimization',
                fields: {
                    restore: { type: 'text', label: 'Cache Key to Restore' },
                    save: { type: 'text', label: 'Cache Key to Save' },
                    paths: { type: 'array', label: 'Paths to Cache' }
                }
            }
        };
    }

    initializeStepTemplates() {
        return {
            'test-suite': {
                name: 'Test Suite',
                steps: [
                    {
                        label: 'Install Dependencies',
                        command: 'npm install',
                        key: 'install'
                    },
                    {
                        label: 'Run Tests',
                        command: 'npm test',
                        key: 'test'
                    },
                    {
                        label: 'Generate Coverage',
                        command: 'npm run coverage',
                        key: 'coverage'
                    }
                ]
            }
        };
    }

    initializeMatrixPresets() {
        return {
            'node-versions': {
                name: 'Node.js Versions', 
                description: 'Test across multiple Node.js versions',
                matrix: {  // ✅ FIX: Change 'setup' to 'matrix'
                    node_version: ['16', '18', '20']
                }
            },
            'web-browsers': {
                name: 'Web Browsers',
                description: 'Test across multiple web browsers',
                matrix: {
                    browser: ['chrome', 'firefox', 'safari', 'edge'],
                    browser_version: ['latest', 'latest-1']
                }
            },
            'os-matrix': {
                name: 'Operating Systems',
                description: 'Test across different operating systems',
                matrix: {
                    os: ['ubuntu-20.04', 'ubuntu-22.04', 'windows-2019', 'windows-2022', 'macos-12'],
                    arch: ['x64', 'arm64']
                }
            },
            'deployment-environments': {
                name: 'Deployment Environments',
                description: 'Deploy to multiple environments',
                matrix: {
                    environment: ['staging', 'production'],
                    region: ['us-east-1', 'us-west-2', 'eu-west-1']
                }
            },
            'testing-strategies': {
                name: 'Testing Strategies',
                description: 'Run different types of tests',
                matrix: {
                    test_type: ['unit', 'integration', 'e2e'],
                    parallel: ['true', 'false']
                }
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

        // Template and pattern events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.template-item')) {
                const templateKey = e.target.closest('.template-item').dataset.template;
                this.addTemplate(templateKey);
            }
            
            if (e.target.closest('.pattern-item')) {
                const patternKey = e.target.closest('.pattern-item').dataset.pattern;
                this.addPattern(patternKey);
            }
            
            if (e.target.closest('.plugin-quick')) {
                const pluginKey = e.target.closest('.plugin-quick').dataset.plugin;
                this.addPluginStep(pluginKey);
            }
        });
    }

    setupEnhancedKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger if not in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
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
                    case 'm':
                        e.preventDefault();
                        this.showMatrixTemplates();
                        break;
                    case 't':
                        e.preventDefault();
                        this.showStepTemplates();
                        break;
                }
            }
            
            if (e.key === 'Delete' && this.selectedStep) {
                e.preventDefault();
                const stepIndex = this.steps.findIndex(s => s.id === this.selectedStep);
                if (stepIndex !== -1) {
                    this.removeStep(stepIndex);
                }
            }
            
            if (e.key === 'Escape') {
                this.selectedStep = null;
                this.renderPipeline();
                this.renderProperties();
            }
        });
    }

    // =========================
    // MATRIX BUILDER FUNCTIONALITY
    // =========================

    showMatrixTemplates() {
        console.log('🔧 Opening Matrix Builder...');
        const modal = document.getElementById('matrix-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.initializeMatrixBuilder();
            this.setupMatrixBuilderEvents();
        } else {
            console.error('❌ Matrix builder modal not found');
        }
    }

    initializeMatrixBuilder() {
        // Reset matrix builder state
        this.currentMatrixDimensions = [];
        this.matrixDimensionCounter = 0;
        
        // Clear existing dimensions
        const dimensionsList = document.getElementById('matrix-dimensions-list');
        if (dimensionsList) {
            dimensionsList.innerHTML = '';
        }
        
        // Clear preview
        this.updateMatrixPreview();
        
        // Populate preset buttons
        this.renderMatrixPresets();
        
        console.log('Matrix builder initialized');
    }

    setupMatrixBuilderEvents() {
        // Add dimension button
        const addDimensionBtn = document.getElementById('add-matrix-dimension');
        if (addDimensionBtn) {
            addDimensionBtn.onclick = () => this.addMatrixDimension();
        }
        
        // Apply matrix button
        const applyMatrixBtn = document.getElementById('apply-matrix');
        if (applyMatrixBtn) {
            applyMatrixBtn.onclick = () => this.applyMatrixConfiguration();
        }
        
        // Setup preset button events
        this.setupMatrixPresetEvents();
        
        console.log('Matrix builder events setup complete');
    }

    addMatrixDimension(key = '', values = []) {
        const dimensionId = `matrix-dimension-${++this.matrixDimensionCounter}`;
        const dimensionsList = document.getElementById('matrix-dimensions-list');
        
        if (!dimensionsList) return;
        
        const dimensionElement = document.createElement('div');
        dimensionElement.className = 'matrix-dimension';
        dimensionElement.id = dimensionId;
        dimensionElement.innerHTML = `
            <div class="matrix-dimension-header">
                <input type="text" 
                       class="matrix-key-input" 
                       placeholder="Dimension key (e.g., node, os)" 
                       value="${key}"
                       data-dimension-id="${dimensionId}">
                <button class="dimension-remove-btn" 
                        onclick="window.pipelineBuilder.removeDimension('${dimensionId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <input type="text" 
                   class="matrix-values-input" 
                   placeholder="Values separated by commas (e.g., 16, 18, 20)"
                   value="${values.join(', ')}"
                   data-dimension-id="${dimensionId}">
            <div class="matrix-values-display" data-dimension-id="${dimensionId}">
                <!-- Values will be displayed here -->
            </div>
        `;
        
        dimensionsList.appendChild(dimensionElement);
        
        // Setup events for this dimension
        this.setupDimensionEvents(dimensionId);
        
        // If values were provided, update the display
        if (values.length > 0) {
            this.updateDimensionValuesDisplay(dimensionId, values);
        }
        
        this.updateMatrixPreview();
    }

    setupDimensionEvents(dimensionId) {
        const keyInput = document.querySelector(`[data-dimension-id="${dimensionId}"].matrix-key-input`);
        const valuesInput = document.querySelector(`[data-dimension-id="${dimensionId}"].matrix-values-input`);
        
        if (keyInput) {
            keyInput.addEventListener('input', () => this.updateMatrixPreview());
        }
        
        if (valuesInput) {
            valuesInput.addEventListener('input', () => {
                const values = this.parseMatrixValues(valuesInput.value);
                this.updateDimensionValuesDisplay(dimensionId, values);
                this.updateMatrixPreview();
            });
        }
    }

    parseMatrixValues(valuesString) {
        return valuesString
            .split(',')
            .map(v => v.trim())
            .filter(v => v.length > 0);
    }

    updateDimensionValuesDisplay(dimensionId, values) {
        const display = document.querySelector(`[data-dimension-id="${dimensionId}"].matrix-values-display`);
        if (!display) return;
        
        display.innerHTML = values.map(value => `
            <div class="matrix-value-tag">
                ${value}
                <button class="value-remove-btn" 
                        onclick="window.pipelineBuilder.removeMatrixValue('${dimensionId}', '${value}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeMatrixValue(dimensionId, valueToRemove) {
        const valuesInput = document.querySelector(`[data-dimension-id="${dimensionId}"].matrix-values-input`);
        if (!valuesInput) return;
        
        const currentValues = this.parseMatrixValues(valuesInput.value);
        const newValues = currentValues.filter(v => v !== valueToRemove);
        
        valuesInput.value = newValues.join(', ');
        this.updateDimensionValuesDisplay(dimensionId, newValues);
        this.updateMatrixPreview();
    }

    removeDimension(dimensionId) {
        const element = document.getElementById(dimensionId);
        if (element) {
            element.remove();
            this.updateMatrixPreview();
        }
    }

    getCurrentMatrixConfiguration() {
        const dimensions = {};
        const dimensionElements = document.querySelectorAll('.matrix-dimension');
        
        dimensionElements.forEach(element => {
            const keyInput = element.querySelector('.matrix-key-input');
            const valuesInput = element.querySelector('.matrix-values-input');
            
            if (keyInput && valuesInput) {
                const key = keyInput.value.trim();
                const values = this.parseMatrixValues(valuesInput.value);
                
                if (key && values.length > 0) {
                    dimensions[key] = values;
                }
            }
        });
        
        return dimensions;
    }

    calculateMatrixCombinations(dimensions) {
        const keys = Object.keys(dimensions);
        if (keys.length === 0) return 0;
        
        return keys.reduce((total, key) => {
            return total * dimensions[key].length;
        }, 1);
    }

    updateMatrixPreview() {
        const dimensions = this.getCurrentMatrixConfiguration();
        const preview = document.getElementById('matrix-live-preview');
        const stats = document.getElementById('matrix-stats');
        const totalJobsEl = document.getElementById('total-jobs');
        const dimensionCountEl = document.getElementById('dimension-count');
        
        if (!preview) return;
        
        const dimensionKeys = Object.keys(dimensions);
        const totalJobs = this.calculateMatrixCombinations(dimensions);
        
        if (dimensionKeys.length === 0) {
            // Show empty state
            preview.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-cube"></i>
                    <p>Add matrix dimensions to see preview</p>
                </div>
            `;
            if (stats) stats.style.display = 'none';
            return;
        }
        
        // Show matrix preview
        const exampleCombinations = this.generateExampleCombinations(dimensions, 5);
        
        preview.innerHTML = `
            <div class="matrix-combinations">
                <h5>Matrix Dimensions:</h5>
                <ul>
                    ${dimensionKeys.map(key => 
                        `<li><strong>${key}:</strong> ${dimensions[key].join(', ')}</li>`
                    ).join('')}
                </ul>
                
                <h5>Example Combinations:</h5>
                <div class="combination-examples">
                    ${exampleCombinations.map(combo => `
                        <div class="combination-item">
                            {${Object.entries(combo).map(([k, v]) => `"${k}": "${v}"`).join(', ')}}
                        </div>
                    `).join('')}
                    ${totalJobs > 5 ? `<div class="combination-more">... and ${totalJobs - 5} more</div>` : ''}
                </div>
            </div>
            
            ${totalJobs > 50 ? `
                <div class="matrix-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Warning: This matrix will create ${totalJobs} jobs. Consider reducing dimensions for better performance.
                </div>
            ` : ''}
        `;
        
        // Update stats
        if (stats && totalJobsEl && dimensionCountEl) {
            stats.style.display = 'grid';
            totalJobsEl.textContent = totalJobs;
            dimensionCountEl.textContent = dimensionKeys.length;
        }
    }

    generateExampleCombinations(dimensions, maxExamples = 5) {
        const keys = Object.keys(dimensions);
        if (keys.length === 0) return [];
        
        const combinations = [];
        const generateCombos = (currentCombo, keyIndex) => {
            if (keyIndex >= keys.length) {
                combinations.push({ ...currentCombo });
                return;
            }
            
            if (combinations.length >= maxExamples) return;
            
            const key = keys[keyIndex];
            const values = dimensions[key];
            
            for (const value of values) {
                if (combinations.length >= maxExamples) break;
                currentCombo[key] = value;
                generateCombos(currentCombo, keyIndex + 1);
            }
        };
        
        generateCombos({}, 0);
        return combinations.slice(0, maxExamples);
    }

    renderMatrixPresets() {
        const presetsContainer = document.getElementById('matrix-preset-buttons');
        if (!presetsContainer) return;
        
        const presets = Object.entries(this.matrixPresets);
        
        presetsContainer.innerHTML = presets.map(([key, preset]) => `
            <button class="preset-btn" data-preset="${key}" type="button">
                <i class="fas fa-layer-group"></i>
                <span>${preset.name}</span>
            </button>
        `).join('');
        
        // ✅ FIX: Re-setup events after rendering
        setTimeout(() => {
            this.setupMatrixPresetEvents();
        }, 100);
    }



    setupMatrixPresetEvents() {
        const presetsContainer = document.getElementById('matrix-preset-buttons');
        if (!presetsContainer) return;
        
        // ✅ FIX: Bind context properly and remove existing listeners
        presetsContainer.removeEventListener('click', this.handleMatrixPresetClick);
        this.handleMatrixPresetClick = this.handleMatrixPresetClick.bind(this);
        presetsContainer.addEventListener('click', this.handleMatrixPresetClick);
    }

    // ✅ FIX: Add separate event handler method
    handleMatrixPresetClick(e) {
        const presetBtn = e.target.closest('.preset-btn');
        if (!presetBtn) return;
        
        const presetKey = presetBtn.dataset.preset;
        console.log(`🔲 Applying matrix preset: ${presetKey}`);
        
        try {
            this.applyMatrixPreset(presetKey);
            console.log(`✅ Matrix preset ${presetKey} applied successfully`);
        } catch (error) {
            console.error(`❌ Error applying preset ${presetKey}:`, error);
            alert(`Error applying preset: ${error.message}`);
        }
    }



    applyMatrixPreset(presetKey) {
        const preset = this.matrixPresets[presetKey];
        if (!preset || !preset.matrix) return;
        
        // Clear existing dimensions
        const dimensionsList = document.getElementById('matrix-dimensions-list');
        if (dimensionsList) {
            dimensionsList.innerHTML = '';
        }
        this.matrixDimensionCounter = 0;
        
        // Add preset dimensions
        Object.entries(preset.matrix).forEach(([key, values]) => {
            this.addMatrixDimension(key, values);
        });
        
        console.log(`Applied matrix preset: ${preset.name}`);
    }

    applyMatrixConfiguration() {
        const dimensions = this.getCurrentMatrixConfiguration();
        
        if (Object.keys(dimensions).length === 0) {
            alert('Please add at least one matrix dimension before applying.');
            return;
        }
        
        // Get the currently selected step or create a new one
        let targetStep = null;
        
        if (this.selectedStep) {
            targetStep = this.steps.find(s => s.id === this.selectedStep);
        }
        
        if (!targetStep) {
            // Create a new command step with matrix
            targetStep = this.createStep('command');
            targetStep.properties.label = 'Matrix Build';
            targetStep.properties.command = 'echo "Matrix job: $${BUILDKITE_MATRIX_KEY}"';
            this.steps.push(targetStep);
        }
        
        // Apply matrix configuration to the step
        targetStep.properties.matrix = {
            setup: dimensions
        };
        
        // Re-render pipeline and select the step
        this.renderPipeline();
        this.selectStep(targetStep.id);
        
        // Close the modal
        if (window.closeModal) {
            window.closeModal('matrix-builder-modal');
        }
        
        // Success feedback
        const totalJobs = this.calculateMatrixCombinations(dimensions);
        console.log(`✅ Matrix applied successfully! Created ${totalJobs} job combinations.`);
        
        // Show success message
        this.showNotification(`Matrix applied! Created ${totalJobs} job combinations.`, 'success');
    }

    openMatrixBuilder(stepId) {
        console.log('Opening matrix builder for step:', stepId);
        
        // Find the step and pre-populate matrix if it exists
        const step = this.steps.find(s => s.id === stepId);
        
        if (step && step.properties.matrix && step.properties.matrix.setup) {
            // Pre-populate the matrix builder with existing configuration
            this.showMatrixTemplates();
            
            // Wait for modal to initialize, then populate
            setTimeout(() => {
                this.prePopulateMatrix(step.properties.matrix.setup);
            }, 100);
        } else {
            this.showMatrixTemplates();
        }
    }

    prePopulateMatrix(matrixSetup) {
        // Clear existing dimensions
        const dimensionsList = document.getElementById('matrix-dimensions-list');
        if (dimensionsList) {
            dimensionsList.innerHTML = '';
        }
        this.matrixDimensionCounter = 0;
        
        // Add existing dimensions
        Object.entries(matrixSetup).forEach(([key, values]) => {
            this.addMatrixDimension(key, Array.isArray(values) ? values : [values]);
        });
        
        console.log('Matrix builder pre-populated with existing configuration');
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i>
            ${message}
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : '#667eea'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 2000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // =========================
    // PLUGIN CATALOG FUNCTIONALITY
    // =========================

    showPluginCatalog() {
        console.log('🔧 Opening Plugin Catalog...');
        const modal = document.getElementById('plugin-catalog-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.initializePluginCatalogModal();
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
        return `
            <div class="plugin-card" data-plugin-key="${key}">
                <div class="plugin-card-header">
                    <h5>${plugin.name}</h5>
                    <span class="plugin-version">${plugin.version}</span>
                </div>
                <p>${plugin.description}</p>
                <div class="plugin-card-footer">
                    <span class="plugin-category">${plugin.category}</span>
                    <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); window.pipelineBuilder.addPluginStepDirect('${key}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `;
    }

    getFilteredPlugins() {
        return Object.entries(this.pluginCatalog).filter(([key, plugin]) => {
            const matchesSearch = !this.currentSearchTerm || 
                plugin.name.toLowerCase().includes(this.currentSearchTerm.toLowerCase()) ||
                plugin.description.toLowerCase().includes(this.currentSearchTerm.toLowerCase());
            
            const matchesCategory = this.currentPluginFilter === 'all' || 
                plugin.category === this.currentPluginFilter;
            
            return matchesSearch && matchesCategory;
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
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
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
        const nameEl = document.getElementById('plugin-details-name');
        const descEl = document.getElementById('plugin-details-description');
        const versionEl = document.getElementById('plugin-details-version');
        const categoryEl = document.getElementById('plugin-details-category');
        const fieldsEl = document.getElementById('plugin-details-fields');
        
        if (preview && nameEl && descEl && versionEl && categoryEl && fieldsEl) {
            nameEl.textContent = plugin.name;
            descEl.textContent = plugin.description;
            versionEl.textContent = plugin.version;
            categoryEl.textContent = plugin.category;
            
            const fieldsHTML = Object.entries(plugin.fields || {}).map(([key, field]) => `
                <div class="field-item">
                    <strong>${field.label}:</strong>
                    <span>${field.type}${field.required ? ' (required)' : ''}</span>
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

    // =========================
    // CORE PIPELINE FUNCTIONALITY
    // =========================

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.stepType);
        e.dataTransfer.effectAllowed = 'copy';
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        const stepType = e.dataTransfer.getData('text/plain');
        if (stepType) {
            this.addStep(stepType);
        }
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
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
                retry: { automatic: { limit: 0 } },
                plugins: {},
                matrix: null
            },
            wait: {
                label: 'Wait Step'
            },
            block: {
                label: 'Block Step',
                prompt: 'Please confirm to continue',
                blocked_state: 'passed',
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
                    branch: 'main',
                    env: {}
                }
            },
            group: {
                label: 'Group',
                steps: []
            },
            annotation: {
                label: 'Annotation',
                body: '',
                style: 'info',
                context: 'default'
            },
            plugin: {
                label: 'Plugin Step',
                plugins: {},
                selected_plugin: ''
            },
            notify: {
                label: 'Notify Step',
                command: 'echo "Sending notification"',
                notify: {}
            },
            upload: {
                label: 'Pipeline Upload',
                pipeline_file: '.buildkite/pipeline.yml',
                dynamic_script: ''
            }
        };
        
        return { ...defaults[type] };
    }

    addStep(type) {
        const step = this.createStep(type);
        this.steps.push(step);
        this.renderPipeline();
        this.selectStep(step.id);
    }

    renderPipeline() {
        const container = document.getElementById('pipeline-steps');
        if (!container) return;

        if (this.steps.length === 0) {
            container.innerHTML = `
                <div class="empty-pipeline">
                    <i class="fas fa-stream"></i>
                    <h3>Start Building Your Pipeline</h3>
                    <p>Drag step types from the sidebar or use the quick actions to get started</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.steps.map((step, index) => {
            return this.renderStep(step, index);
        }).join('');
    }

    renderStep(step, index) {
        const stepElement = document.createElement('div');
        stepElement.className = `pipeline-step ${step.id === this.selectedStep ? 'selected' : ''}`;
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
        return icons[type] || 'fa-cog';
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
                return pluginCount > 0 ? `${pluginCount} plugin(s) configured` : 'No plugins configured';
            case 'notify':
                return 'Sends notifications after step completion';
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
                return this.generatePipelineUploadForm(step);
            default:
                return '<p>No properties available for this step type</p>';
        }
    }

    generateCommandForm(step) {
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Command</label>
                <textarea name="command" placeholder="npm test">${step.properties.command}</textarea>
            </div>
            
            <div class="property-group">
                <label>Timeout (minutes)</label>
                <input type="number" name="timeout_in_minutes" value="${step.properties.timeout_in_minutes}" min="1" max="1440" />
            </div>
            
            <div class="property-section">
                <h4><i class="fas fa-th"></i> Matrix Configuration</h4>
                <div class="matrix-builder">
                    <div class="matrix-preview">
                        ${this.renderMatrixPreview(step.properties.matrix)}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.openMatrixBuilder('${step.id}')">
                        <i class="fas fa-th"></i> Configure Matrix
                    </button>
                </div>
            </div>
            
            <div class="property-section">
                <h4><i class="fas fa-plug"></i> Plugins</h4>
                <div class="plugin-builder">
                    <div class="plugins-preview">
                        ${this.renderPluginsPreview(step.properties.plugins)}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.openPluginBuilder('${step.id}')">
                        <i class="fas fa-plug"></i> Add Plugins
                    </button>
                </div>
            </div>
        `;
    }

    generateWaitForm(step) {
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Wait Condition</label>
                <select name="wait_condition">
                    <option value="">Wait for all previous steps</option>
                    <option value="continue_on_failure">Continue on failure</option>
                </select>
            </div>
        `;
    }

    generateBlockForm(step) {
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Prompt Message</label>
                <input type="text" name="prompt" value="${step.properties.prompt}" />
            </div>
            
            <div class="property-group">
                <label>Blocked State</label>
                <select name="blocked_state">
                    <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                    <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                    <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                </select>
            </div>
        `;
    }

    generateInputForm(step) {
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Prompt Message</label>
                <input type="text" name="prompt" value="${step.properties.prompt}" />
            </div>
            
            <div class="property-group">
                <label>Input Fields (JSON)</label>
                <textarea name="fields" placeholder='[{"text": "deployment_environment", "hint": "Which environment?"}]'>${JSON.stringify(step.properties.fields, null, 2)}</textarea>
            </div>
        `;
    }

    generateTriggerForm(step) {
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Pipeline to Trigger</label>
                <input type="text" name="trigger" value="${step.properties.trigger}" placeholder="my-org/my-pipeline" />
            </div>
            
            <div class="property-group">
                <label>Build Message</label>
                <input type="text" name="build_message" value="${step.properties.build?.message || ''}" />
            </div>
            
            <div class="property-group">
                <label>Branch</label>
                <input type="text" name="build_branch" value="${step.properties.build?.branch || 'main'}" />
            </div>
        `;
    }

    generateGroupForm(step) {
        return `
            <div class="property-group">
                <label>Group Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Group Steps</label>
                <p>Group steps are managed separately. Use the pipeline editor to add steps to this group.</p>
            </div>
        `;
    }

    generateAnnotationForm(step) {
        return `
            <div class="property-group">
                <label>Annotation Body</label>
                <textarea name="body" placeholder="Build completed successfully!">${step.properties.body}</textarea>
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
                <label>Context</label>
                <input type="text" name="context" value="${step.properties.context}" />
            </div>
        `;
    }

    generatePluginForm(step) {
        const pluginOptions = Object.entries(this.pluginCatalog).map(([key, plugin]) => 
            `<option value="${key}" ${step.properties.selected_plugin === key ? 'selected' : ''}>${plugin.name}</option>`
        ).join('');
        
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Plugin</label>
                <select name="selected_plugin" onchange="window.pipelineBuilder.updatePluginConfig('${step.id}', this.value)">
                    <option value="">Choose a plugin...</option>
                    ${pluginOptions}
                </select>
            </div>
            
            <div id="plugin-config-${step.id}" class="plugin-config">
                ${this.renderPluginConfig(step.properties.selected_plugin, step.properties.plugins)}
            </div>
        `;
    }

    generateNotifyForm(step) {
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Command</label>
                <textarea name="command" placeholder="echo 'Sending notification'">${step.properties.command}</textarea>
            </div>
            
            <div class="property-group">
                <label>Notification Config (JSON)</label>
                <textarea name="notify" placeholder='{"slack": {"webhook_url": "", "channel": "#builds"}}'>${JSON.stringify(step.properties.notify, null, 2)}</textarea>
            </div>
        `;
    }

    generatePipelineUploadForm(step) {
        return `
            <div class="property-group">
                <label>Step Label</label>
                <input type="text" name="label" value="${step.properties.label}" />
            </div>
            
            <div class="property-group">
                <label>Pipeline File</label>
                <input type="text" name="pipeline_file" value="${step.properties.pipeline_file}" 
                       placeholder=".buildkite/pipeline.yml" />
                <small>Path to the pipeline file to upload</small>
            </div>
            
            <div class="property-group">
                <label>Dynamic Script</label>
                <input type="text" name="dynamic_script" value="${step.properties.dynamic_script}" 
                       placeholder="./scripts/generate-pipeline.sh" />
                <small>Script to generate pipeline dynamically</small>
            </div>
        `;
    }

    renderMatrixPreview(matrix) {
        if (!matrix || !matrix.setup) {
            return '<p class="empty-state">No matrix configured</p>';
        }
        
        const dimensions = Object.entries(matrix.setup);
        const combinations = this.calculateMatrixCombinations(matrix.setup);
        
        return `
            <div class="matrix-summary">
                <p><strong>Matrix Dimensions:</strong></p>
                <ul>
                    ${dimensions.map(([key, values]) => 
                        `<li><strong>${key}:</strong> ${Array.isArray(values) ? values.join(', ') : values}</li>`
                    ).join('')}
                </ul>
                <p><strong>Total Combinations:</strong> ${combinations}</p>
                <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.openMatrixBuilder('${this.selectedStep}')">
                    <i class="fas fa-edit"></i> Edit Matrix
                </button>
            </div>
        `;
    }

    renderPluginsPreview(plugins) {
        if (!plugins || Object.keys(plugins).length === 0) {
            return '<p class="empty-state">No plugins configured</p>';
        }
        
        return `
            <div class="plugins-summary">
                <ul>
                    ${Object.entries(plugins).map(([key, config]) => {
                        const plugin = this.pluginCatalog[key];
                        return `<li><strong>${plugin ? plugin.name : key}</strong></li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    }

    renderPluginConfig(selectedPlugin, plugins) {
        if (!selectedPlugin) {
            return '<p class="empty-state">Select a plugin to configure</p>';
        }
        
        const plugin = this.pluginCatalog[selectedPlugin];
        if (!plugin) {
            return '<p class="empty-state">Plugin configuration not available</p>';
        }
        
        return `
            <div class="plugin-configuration">
                <h5>${plugin.name} Configuration</h5>
                <p>${plugin.description}</p>
                <div class="property-group">
                    <label>Plugin Config (JSON)</label>
                    <textarea name="plugin_config" placeholder='{"image": "node:18"}'>${JSON.stringify(plugins[selectedPlugin] || {}, null, 2)}</textarea>
                </div>
            </div>
        `;
    }

    setupPropertyEvents(step) {
        const container = document.getElementById('properties-content');
        if (!container) return;

        const inputs = container.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateStepProperty(step, input.name, input.value);
            });
        });
    }

    updateStepProperty(step, property, value) {
        // Handle nested properties
        if (property.includes('_')) {
            const [parent, child] = property.split('_');
            if (!step.properties[parent]) step.properties[parent] = {};
            step.properties[parent][child] = value;
        } else {
            step.properties[property] = value;
        }
        
        this.renderPipeline();
    }

    updatePluginConfig(stepId, pluginName) {
        console.log('Updating plugin config for step:', stepId, 'plugin:', pluginName);
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            step.properties.selected_plugin = pluginName;
            if (pluginName && !step.properties.plugins[pluginName]) {
                step.properties.plugins[pluginName] = {};
            }
            this.renderProperties();
        }
    }

    openPluginBuilder(stepId) {
        console.log('Opening plugin builder for step:', stepId);
        this.showPluginCatalog();
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

    duplicateStep(index) {
        const step = this.steps[index];
        const duplicate = {
            ...step,
            id: `step-${++this.stepCounter}`,
            properties: { ...step.properties }
        };
        this.steps.splice(index + 1, 0, duplicate);
        this.renderPipeline();
    }

    removeStep(index) {
        this.steps.splice(index, 1);
        this.selectedStep = null;
        this.renderPipeline();
        this.renderProperties();
    }

    clearPipeline() {
        if (confirm('Are you sure you want to clear the entire pipeline?')) {
            this.steps = [];
            this.selectedStep = null;
            this.stepCounter = 0;
            this.renderPipeline();
            this.renderProperties();
        }
    }

    loadExample() {
        this.steps = [
            {
                id: 'step-1',
                type: 'command',
                properties: {
                    label: 'Install Dependencies',
                    command: 'npm install',
                    timeout_in_minutes: 10,
                    agents: {},
                    env: {},
                    retry: { automatic: { limit: 2 } },
                    plugins: {},
                    matrix: null
                }
            },
            {
                id: 'step-2',
                type: 'command',
                properties: {
                    label: 'Run Tests',
                    command: 'npm test',
                    timeout_in_minutes: 30,
                    agents: {},
                    env: {},
                    retry: { automatic: { limit: 0 } },
                    plugins: {},
                    matrix: {
                        setup: {
                            node: ['16', '18', '20'],
                            os: ['ubuntu', 'windows']
                        }
                    }
                }
            },
            {
                id: 'step-3',
                type: 'wait',
                properties: {
                    label: 'Wait for Tests'
                }
            },
            {
                id: 'step-4',
                type: 'block',
                properties: {
                    label: 'Deploy to Production',
                    prompt: 'Ready to deploy to production?',
                    blocked_state: 'passed',
                    fields: []
                }
            },
            {
                id: 'step-5',
                type: 'command',
                properties: {
                    label: 'Deploy',
                    command: 'npm run deploy',
                    timeout_in_minutes: 15,
                    agents: {},
                    env: {},
                    retry: { automatic: { limit: 1 } },
                    plugins: {},
                    matrix: null
                }
            }
        ];
        
        this.stepCounter = 5;
        this.renderPipeline();
        this.renderProperties();
    }

    exportYAML() {
        const generator = new YAMLGenerator();
        const yaml = generator.generateFromSteps(this.steps);
        
        const modal = document.getElementById('yaml-modal');
        const output = document.getElementById('yaml-output');
        
        if (modal && output) {
            output.value = yaml;
            modal.classList.remove('hidden');
        }
    }

    copyYAML() {
        const output = document.getElementById('yaml-output');
        if (output) {
            output.select();
            document.execCommand('copy');
            this.showNotification('YAML copied to clipboard!', 'success');
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
    }

    addTemplate(templateKey) {
        console.log('Adding template:', templateKey);
        // Template functionality can be expanded here
    }

    addPattern(patternKey) {
        console.log('Adding pattern:', patternKey);
        // Pattern functionality can be expanded here
    }

    addPluginStep(pluginKey) {
        this.addPluginStepDirect(pluginKey);
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
}

// Export to global scope for initialization
window.PipelineBuilder = PipelineBuilder;