// js/app.js
// Main Application Controller for Buildkite Pipeline Builder - Enhanced v3.0
/**
 * Coordinates all components and handles top-level application logic
 * Now with matrix builds, conditional logic, enhanced YAML validation, and sharing
 */

class BuildkiteApp {
    constructor() {
        this.pipelineBuilder = null;
        this.yamlGenerator = null;
        this.matrixBuilder = null;
        this.conditionalLogicBuilder = null;
        this.pipelineSharing = null;
        this.yamlVisible = false;
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Enhanced Buildkite Pipeline Builder App v3.0...');
        
        // Initialize components
        this.yamlGenerator = new YAMLGenerator();
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    onDOMReady() {
        console.log('📄 DOM Ready, setting up application...');
        
        // Get references to components
        this.pipelineBuilder = window.pipelineBuilder;
        this.matrixBuilder = window.matrixBuilder;
        this.conditionalLogicBuilder = window.conditionalLogicBuilder;
        this.pipelineSharing = window.pipelineSharing;
        
        if (!this.pipelineBuilder) {
            console.error('❌ Pipeline Builder not initialized!');
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup modals
        this.setupModals();
        
        // Initialize features
        this.initializeFeatures();
        
        // Load saved pipeline if exists
        this.loadSavedPipeline();
        
        // Start auto-save
        this.startAutoSave();
        
        console.log('✅ Enhanced Buildkite Pipeline Builder App initialized successfully!');
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('load-example')?.addEventListener('click', () => {
            this.pipelineBuilder.loadExample();
            this.updateYAML();
            this.showNotification('Example pipeline loaded', 'success');
        });
        
        document.getElementById('clear-pipeline')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire pipeline?')) {
                this.pipelineBuilder.clearPipeline();
                this.updateYAML();
                this.showNotification('Pipeline cleared', 'success');
            }
        });
        
        // NEW: Share pipeline button
        document.getElementById('share-pipeline')?.addEventListener('click', () => {
            if (this.pipelineSharing) {
                this.pipelineSharing.openShareModal();
            }
        });
        
        document.getElementById('export-yaml')?.addEventListener('click', () => {
            this.exportYAML();
        });
        
        // Canvas controls
        document.getElementById('toggle-yaml')?.addEventListener('click', () => {
            this.toggleYAML();
        });
        
        document.getElementById('copy-yaml')?.addEventListener('click', () => {
            this.copyYAML();
        });
        
        // NEW: Validate pipeline button
        document.getElementById('validate-pipeline')?.addEventListener('click', () => {
            this.validatePipeline();
        });
        
        // Sidebar actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Plugin quick add buttons
        document.querySelectorAll('.plugin-quick-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plugin = e.currentTarget.dataset.plugin;
                this.pipelineBuilder.addPluginStep(plugin);
                this.showNotification(`${plugin} plugin added`, 'success');
            });
        });
        
        // Listen for pipeline changes
        document.addEventListener('pipelineChanged', () => {
            this.updateYAML();
            this.savePipeline();
        });
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // YAML Export Modal buttons
        this.setupYAMLExportButtons();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save/Export
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.exportYAML();
            }
            
            // Ctrl/Cmd + O: Load example
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                this.pipelineBuilder.loadExample();
                this.updateYAML();
            }
            
            // Delete: Delete selected step
            if (e.key === 'Delete' && this.pipelineBuilder.selectedStep) {
                e.preventDefault();
                this.pipelineBuilder.deleteStep(this.pipelineBuilder.selectedStep);
            }
            
            // Ctrl/Cmd + D: Duplicate selected step
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && this.pipelineBuilder.selectedStep) {
                e.preventDefault();
                this.pipelineBuilder.duplicateStep(this.pipelineBuilder.selectedStep);
            }
            
            // Ctrl/Cmd + Y: Toggle YAML
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                this.toggleYAML();
            }
            
            // Ctrl/Cmd + K: Open command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openCommandPalette();
            }
        });
    }

    setupModals() {
        // Plugin Catalog Modal
        this.setupPluginCatalog();
        
        // Matrix Builder Modal - NEW
        this.setupMatrixBuilder();
        
        // Step Templates Modal
        this.setupStepTemplates();
        
        // Variable Manager Modal
        this.setupVariableManager();
        
        // Pattern Library Modal
        this.setupPatternLibrary();
        
        // Close modal on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Close modal buttons
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
    }

    setupPluginCatalog() {
        const modal = document.getElementById('plugin-catalog-modal');
        const searchInput = document.getElementById('plugin-search');
        const pluginList = document.getElementById('plugin-list');
        
        // Render plugins
        const renderPlugins = (filter = '') => {
            const plugins = Object.entries(this.pipelineBuilder.pluginCatalog)
                .filter(([key, plugin]) => 
                    key.toLowerCase().includes(filter.toLowerCase()) ||
                    plugin.name.toLowerCase().includes(filter.toLowerCase()) ||
                    plugin.description.toLowerCase().includes(filter.toLowerCase())
                );
            
            pluginList.innerHTML = plugins.map(([key, plugin]) => `
                <div class="plugin-card" data-plugin="${key}">
                    <h4>${plugin.name}</h4>
                    <p>${plugin.description}</p>
                    <div class="plugin-config">
                        ${Object.entries(plugin.config || {}).map(([configKey, config]) => `
                            <small><strong>${configKey}:</strong> ${config.description || configKey}</small>
                        `).join('<br>')}
                    </div>
                </div>
            `).join('');
            
            // Add click handlers
            pluginList.querySelectorAll('.plugin-card').forEach(card => {
                card.addEventListener('click', () => {
                    const pluginKey = card.dataset.plugin;
                    const currentStep = window.currentStepForPlugin;
                    
                    if (currentStep) {
                        // Add to existing step
                        if (!currentStep.properties.plugins) {
                            currentStep.properties.plugins = {};
                        }
                        
                        const plugin = this.pipelineBuilder.pluginCatalog[pluginKey];
                        currentStep.properties.plugins[pluginKey] = {};
                        
                        if (plugin.config) {
                            Object.entries(plugin.config).forEach(([key, config]) => {
                                currentStep.properties.plugins[pluginKey][key] = config.default || '';
                            });
                        }
                        
                        this.pipelineBuilder.renderProperties();
                        window.currentStepForPlugin = null;
                    } else {
                        // Create new plugin step
                        this.pipelineBuilder.addPluginStep(pluginKey);
                    }
                    
                    modal.style.display = 'none';
                    this.showNotification(`${this.pipelineBuilder.pluginCatalog[pluginKey].name} plugin added`, 'success');
                });
            });
        };
        
        // Search functionality
        searchInput?.addEventListener('input', (e) => {
            renderPlugins(e.target.value);
        });
        
        // Initial render
        renderPlugins();
    }

    setupMatrixBuilder() {
        const modal = document.getElementById('matrix-builder-modal');
        if (!modal || !this.matrixBuilder) return;
        
        // Matrix builder is self-contained
        console.log('✅ Matrix Builder modal setup complete');
    }

    setupStepTemplates() {
        const modal = document.getElementById('step-templates-modal');
        const templateList = document.getElementById('template-list');
        const categoryButtons = modal.querySelectorAll('.template-cat');
        
        const templates = {
            testing: [
                {
                    id: 'node-test',
                    name: 'Node.js Test Suite',
                    description: 'Run tests with coverage',
                    icon: 'fa-node-js'
                },
                {
                    id: 'python-test',
                    name: 'Python Test Suite',
                    description: 'Run pytest with coverage',
                    icon: 'fa-python'
                }
            ],
            deployment: [
                {
                    id: 'docker-deploy',
                    name: 'Docker Deployment',
                    description: 'Build and push Docker image',
                    icon: 'fa-docker'
                },
                {
                    id: 'k8s-deploy',
                    name: 'Kubernetes Deployment',
                    description: 'Deploy to Kubernetes cluster',
                    icon: 'fa-dharmachakra'
                }
            ],
            docker: [
                {
                    id: 'docker-build',
                    name: 'Docker Build & Push',
                    description: 'Build and push to registry',
                    icon: 'fa-docker'
                }
            ],
            notifications: [
                {
                    id: 'slack-notify',
                    name: 'Slack Notification',
                    description: 'Send build status to Slack',
                    icon: 'fa-slack'
                }
            ]
        };
        
        const renderTemplates = (category = 'all') => {
            const templatesToShow = category === 'all' ? 
                Object.values(templates).flat() : 
                templates[category] || [];
            
            templateList.innerHTML = templatesToShow.map(template => `
                <div class="template-card" data-template="${template.id}">
                    <h4><i class="fas ${template.icon}"></i> ${template.name}</h4>
                    <p>${template.description}</p>
                </div>
            `).join('');
            
            // Add click handlers
            templateList.querySelectorAll('.template-card').forEach(card => {
                card.addEventListener('click', () => {
                    const templateId = card.dataset.template;
                    this.applyTemplate(templateId);
                    modal.style.display = 'none';
                });
            });
        };
        
        // Category buttons
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderTemplates(btn.dataset.category);
            });
        });
        
        // Initial render
        renderTemplates('all');
    }

    setupVariableManager() {
        const modal = document.getElementById('variable-manager-modal');
        const variableList = document.getElementById('pipeline-variables');
        const addBtn = document.getElementById('add-pipeline-variable');
        
        const renderVariables = () => {
            // Get all environment variables from pipeline
            const allVars = {};
            this.pipelineBuilder.steps.forEach(step => {
                if (step.properties.env) {
                    Object.assign(allVars, step.properties.env);
                }
            });
            
            variableList.innerHTML = Object.entries(allVars).length > 0 ?
                Object.entries(allVars).map(([key, value]) => `
                    <div class="env-var">
                        <span class="var-key">${key}</span>
                        <span class="var-value">${value}</span>
                    </div>
                `).join('') :
                '<p class="no-data">No pipeline variables defined</p>';
        };
        
        addBtn?.addEventListener('click', () => {
            const key = prompt('Variable name:');
            if (!key) return;
            
            const value = prompt('Variable value:');
            if (value === null) return;
            
            // Add to all command steps
            this.pipelineBuilder.steps.forEach(step => {
                if (step.type === 'command') {
                    if (!step.properties.env) {
                        step.properties.env = {};
                    }
                    step.properties.env[key] = value;
                }
            });
            
            this.pipelineBuilder.renderPipeline();
            renderVariables();
            this.showNotification('Variable added to all command steps', 'success');
        });
        
        // Initial render when modal opens
        modal.addEventListener('show', renderVariables);
    }

    setupPatternLibrary() {
        const modal = document.getElementById('pattern-library-modal');
        const patternList = document.getElementById('pattern-list');
        const categoryButtons = modal.querySelectorAll('.pattern-cat');
        
        const patterns = {
            monorepo: [
                {
                    name: 'Monorepo Changed Paths',
                    description: 'Only run steps when specific paths change',
                    icon: 'fa-code-branch'
                }
            ],
            microservices: [
                {
                    name: 'Service Dependencies',
                    description: 'Deploy services in dependency order',
                    icon: 'fa-project-diagram'
                }
            ],
            mobile: [
                {
                    name: 'iOS/Android Build',
                    description: 'Parallel mobile app builds',
                    icon: 'fa-mobile-alt'
                }
            ],
            ml: [
                {
                    name: 'ML Training Pipeline',
                    description: 'Train, evaluate, and deploy models',
                    icon: 'fa-brain'
                }
            ]
        };
        
        const renderPatterns = (category = 'all') => {
            const patternsToShow = category === 'all' ? 
                Object.values(patterns).flat() : 
                patterns[category] || [];
            
            patternList.innerHTML = patternsToShow.map(pattern => `
                <div class="pattern-card">
                    <h4><i class="fas ${pattern.icon}"></i> ${pattern.name}</h4>
                    <p>${pattern.description}</p>
                    <div class="pattern-preview">
                        <code>Pipeline pattern preview...</code>
                    </div>
                </div>
            `).join('');
        };
        
        // Category buttons
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderPatterns(btn.dataset.category);
            });
        });
        
        // Initial render
        renderPatterns('all');
    }

    setupYAMLExportButtons() {
        // Download YAML button
        document.getElementById('download-yaml-file')?.addEventListener('click', () => {
            const config = this.pipelineBuilder.getPipelineConfig();
            const yaml = this.yamlGenerator.generate(config);
            this.yamlGenerator.downloadYAML(yaml, 'pipeline.yml');
            this.showNotification('Pipeline downloaded as pipeline.yml', 'success');
        });
        
        // Copy YAML button
        document.getElementById('copy-yaml-clipboard')?.addEventListener('click', () => {
            const yamlOutput = document.getElementById('export-yaml-output');
            if (yamlOutput) {
                const yaml = yamlOutput.textContent;
                navigator.clipboard.writeText(yaml).then(() => {
                    this.showNotification('YAML copied to clipboard!', 'success');
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    this.showNotification('Failed to copy YAML', 'error');
                });
            }
        });
        
        // Validate YAML button
        document.getElementById('validate-yaml-export')?.addEventListener('click', () => {
            const yamlOutput = document.getElementById('export-yaml-output');
            if (yamlOutput && this.yamlGenerator) {
                const yaml = yamlOutput.textContent;
                const validation = this.yamlGenerator.validate(yaml);
                
                const statusDiv = document.getElementById('export-validation-status');
                if (statusDiv) {
                    if (validation.valid) {
                        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> YAML validation passed!';
                        statusDiv.className = 'validation-success';
                        this.showNotification('YAML validation passed!', 'success');
                    } else {
                        statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Validation issues: ' + validation.issues.join(', ');
                        statusDiv.className = 'validation-error';
                        this.showNotification('YAML validation failed', 'error');
                    }
                }
            }
        });
    }

    handleAction(action) {
        switch (action) {
            case 'plugin-catalog':
                document.getElementById('plugin-catalog-modal').style.display = 'block';
                break;
            case 'matrix-builder':
                this.showNotification('Select a command step and click "Configure Matrix" in properties', 'info');
                break;
            case 'conditional-logic':
                this.showNotification('Select a step and click "Configure Conditions" in properties', 'info');
                break;
            case 'step-templates':
                document.getElementById('step-templates-modal').style.display = 'block';
                break;
            case 'variable-manager':
                document.getElementById('variable-manager-modal').style.display = 'block';
                break;
            case 'pattern-library':
                document.getElementById('pattern-library-modal').style.display = 'block';
                break;
        }
    }

    initializeFeatures() {
        // Initialize any additional features
        console.log('🔧 Initializing additional features...');
        
        // Set up auto-save indicator
        this.setupAutoSaveIndicator();
        
        // Set up drag-drop file upload (future feature)
        this.setupFileDragDrop();
        
        // Set up command palette
        this.setupCommandPalette();
    }

    setupAutoSaveIndicator() {
        // Add auto-save indicator to header
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const indicator = document.createElement('div');
            indicator.className = 'auto-save-indicator';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i> Auto-saved';
            indicator.style.display = 'none';
            headerActions.appendChild(indicator);
        }
    }

    setupFileDragDrop() {
        // Future feature: drag and drop YAML files to load
        const dropZone = document.getElementById('pipeline-steps');
        if (!dropZone) return;
        
        dropZone.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                // Handle file drag over
            }
        });
        
        dropZone.addEventListener('drop', (e) => {
            if (e.dataTransfer.files.length > 0) {
                e.preventDefault();
                // Handle file drop - future implementation
                const file = e.dataTransfer.files[0];
                if (file.name.endsWith('.yml') || file.name.endsWith('.yaml') || file.name.endsWith('.json')) {
                    this.importPipelineFile(file);
                }
            }
        });
    }

    setupCommandPalette() {
        const palette = document.getElementById('command-palette');
        const input = document.getElementById('command-input');
        const results = document.getElementById('command-results');
        
        if (!palette || !input || !results) return;
        
        const commands = [
            { name: 'Add Command Step', icon: 'fa-terminal', action: () => this.pipelineBuilder.addStep('command') },
            { name: 'Add Wait Step', icon: 'fa-hourglass-half', action: () => this.pipelineBuilder.addStep('wait') },
            { name: 'Add Block Step', icon: 'fa-hand-paper', action: () => this.pipelineBuilder.addStep('block') },
            { name: 'Export YAML', icon: 'fa-download', action: () => this.exportYAML() },
            { name: 'Clear Pipeline', icon: 'fa-trash', action: () => this.pipelineBuilder.clearPipeline() },
            { name: 'Load Example', icon: 'fa-file-import', action: () => this.pipelineBuilder.loadExample() },
            { name: 'Toggle YAML Preview', icon: 'fa-code', action: () => this.toggleYAML() },
            { name: 'Validate Pipeline', icon: 'fa-check-circle', action: () => this.validatePipeline() },
            { name: 'Share Pipeline', icon: 'fa-share-alt', action: () => this.pipelineSharing?.openShareModal() }
        ];
        
        const showCommands = (filter = '') => {
            const filtered = commands.filter(cmd => 
                cmd.name.toLowerCase().includes(filter.toLowerCase())
            );
            
            results.innerHTML = filtered.map((cmd, index) => `
                <div class="command-result ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <i class="fas ${cmd.icon}"></i>
                    <span>${cmd.name}</span>
                </div>
            `).join('');
            
            // Add click handlers
            results.querySelectorAll('.command-result').forEach((el, index) => {
                el.addEventListener('click', () => {
                    filtered[index].action();
                    this.closeCommandPalette();
                });
            });
        };
        
        input.addEventListener('input', (e) => {
            showCommands(e.target.value);
        });
        
        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            const active = results.querySelector('.active');
            const all = results.querySelectorAll('.command-result');
            let index = Array.from(all).indexOf(active);
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                index = (index + 1) % all.length;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                index = (index - 1 + all.length) % all.length;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                active?.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.closeCommandPalette();
            }
            
            all.forEach(el => el.classList.remove('active'));
            all[index]?.classList.add('active');
        });
    }

    openCommandPalette() {
        const palette = document.getElementById('command-palette');
        const input = document.getElementById('command-input');
        
        if (palette && input) {
            palette.classList.remove('hidden');
            input.value = '';
            input.focus();
            
            // Show all commands initially
            const event = new Event('input');
            input.dispatchEvent(event);
        }
    }

    closeCommandPalette() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.add('hidden');
        }
    }

    toggleYAML() {
        const yamlPreview = document.getElementById('yaml-preview');
        const toggleBtn = document.getElementById('toggle-yaml');
        
        if (!yamlPreview) return;
        
        this.yamlVisible = !this.yamlVisible;
        yamlPreview.style.display = this.yamlVisible ? 'block' : 'none';
        
        if (toggleBtn) {
            toggleBtn.innerHTML = this.yamlVisible ? 
                '<i class="fas fa-code"></i> Hide YAML' : 
                '<i class="fas fa-code"></i> Show YAML';
        }
        
        if (this.yamlVisible) {
            this.updateYAML();
        }
    }

    updateYAML() {
        if (!this.yamlVisible) return;
        
        const yamlOutput = document.getElementById('yaml-output');
        if (!yamlOutput) return;
        
        const config = this.pipelineBuilder.getPipelineConfig();
        const yaml = this.yamlGenerator.generate(config);
        
        // Apply syntax highlighting
        yamlOutput.innerHTML = this.yamlGenerator.prettify(yaml);
        
        // Validate
        const validation = this.yamlGenerator.validate(yaml);
        if (!validation.valid) {
            console.warn('YAML validation issues:', validation.issues);
        }
    }

    copyYAML() {
        const config = this.pipelineBuilder.getPipelineConfig();
        const yaml = this.yamlGenerator.generate(config);
        
        navigator.clipboard.writeText(yaml).then(() => {
            this.showNotification('YAML copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            this.showNotification('Failed to copy YAML', 'error');
        });
    }

    validatePipeline() {
        const config = this.pipelineBuilder.getPipelineConfig();
        const yaml = this.yamlGenerator.generate(config);
        const validation = this.yamlGenerator.validate(yaml);
        
        const validationDiv = document.getElementById('yaml-validation');
        const validationContent = document.getElementById('validation-content');
        
        if (validationDiv && validationContent) {
            validationDiv.classList.remove('hidden');
            
            if (validation.valid) {
                validationDiv.classList.remove('error');
                validationContent.innerHTML = '<p style="color: #48bb78;"><i class="fas fa-check-circle"></i> Pipeline validation passed!</p>';
                this.showNotification('Pipeline validation passed!', 'success');
            } else {
                validationDiv.classList.add('error');
                validationContent.innerHTML = `
                    <p style="color: #f56565;"><i class="fas fa-exclamation-circle"></i> Validation issues found:</p>
                    <ul>${validation.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
                `;
                this.showNotification('Pipeline validation failed', 'error');
            }
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                validationDiv.classList.add('hidden');
            }, 5000);
        }
    }

    exportYAML() {
        this.pipelineBuilder.exportYAML();
    }

    savePipeline() {
        if (!this.autoSaveEnabled) return;
        
        const config = this.pipelineBuilder.getPipelineConfig();
        localStorage.setItem('buildkite-pipeline', JSON.stringify(config));
        
        // Show auto-save indicator
        const indicator = document.querySelector('.auto-save-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        }
    }

    loadSavedPipeline() {
        const saved = localStorage.getItem('buildkite-pipeline');
        if (!saved) return;
        
        try {
            const config = JSON.parse(saved);
            if (this.pipelineSharing) {
                this.pipelineSharing.loadPipelineConfig(config);
            }
            console.log('Loaded saved pipeline from localStorage');
        } catch (err) {
            console.error('Failed to load saved pipeline:', err);
        }
    }

    startAutoSave() {
        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            this.savePipeline();
        }, 30000);
    }

    importPipelineFile(file) {
        if (this.pipelineSharing) {
            this.pipelineSharing.importFromFile(file);
        }
    }

    applyTemplate(templateId) {
        // Template implementations
        const templates = {
            'node-test': () => {
                this.pipelineBuilder.addStep('command').properties = {
                    label: 'Node.js Tests',
                    command: 'npm ci\nnpm test',
                    plugins: {
                        'test-collector': {
                            files: 'test-results/**/*.xml',
                            format: 'junit'
                        }
                    }
                };
            },
            'docker-build': () => {
                const step = this.pipelineBuilder.addStep('command');
                step.properties = {
                    label: 'Build Docker Image',
                    command: 'docker build -t myapp:$BUILDKITE_BUILD_NUMBER .',
                    plugins: {
                        'docker': {
                            image: 'myapp:$BUILDKITE_BUILD_NUMBER',
                            dockerfile: 'Dockerfile'
                        }
                    }
                };
            },
            'slack-notify': () => {
                const step = this.pipelineBuilder.addStep('notify');
                step.properties = {
                    label: 'Notify Slack',
                    slack: '#builds',
                    if: 'build.state == "failed"'
                };
            }
        };
        
        if (templates[templateId]) {
            templates[templateId]();
            this.pipelineBuilder.renderPipeline();
            this.showNotification('Template applied', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'notificationSlideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
}

// CSS for enhanced YAML syntax highlighting
const yamlStyles = `
    .yaml-key { color: #e06c75; font-weight: 600; }
    .yaml-string { color: #98c379; }
    .yaml-number { color: #d19a66; }
    .yaml-boolean { color: #56b6c2; }
    .yaml-array { color: #c678dd; }
    .yaml-variable { color: #61afef; font-style: italic; }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = yamlStyles;
document.head.appendChild(styleSheet);

// Initialize app
window.buildkiteApp = new BuildkiteApp();

// Export for debugging
console.log('🎉 Enhanced Buildkite Pipeline Builder loaded successfully!');
console.log('📚 Available in console: window.pipelineBuilder, window.buildkiteApp');
console.log('✨ New features: Matrix Builds, Conditional Logic, Enhanced YAML Validation, Pipeline Sharing');