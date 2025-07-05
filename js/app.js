// js/app.js
// Main Application Controller for Buildkite Pipeline Builder
/**
 * Coordinates all components and handles top-level application logic
 */

class BuildkiteApp {
    constructor() {
        this.pipelineBuilder = null;
        this.yamlGenerator = null;
        this.yamlVisible = false;
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Buildkite Pipeline Builder App...');
        
        // Initialize components
        this.yamlGenerator = new YAMLGenerator();
        
        // Pipeline builder is initialized by enhanced-pipeline-builder.js
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
        } else {
            this.onDOMReady();
        }
    }

    onDOMReady() {
        console.log('📄 DOM Ready, setting up application...');
        
        // Get reference to pipeline builder
        this.pipelineBuilder = window.pipelineBuilder;
        
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
        
        console.log('✅ Buildkite Pipeline Builder App initialized successfully!');
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('load-example')?.addEventListener('click', () => {
            this.pipelineBuilder.loadExample();
            this.updateYAML();
            this.showNotification('Example pipeline loaded', 'success');
        });
        
        document.getElementById('clear-pipeline')?.addEventListener('click', () => {
            this.pipelineBuilder.clearPipeline();
            this.updateYAML();
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
        
        // Sidebar actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });
        
        // Listen for pipeline changes
        document.addEventListener('pipelineChanged', () => {
            this.updateYAML();
            this.savePipeline();
        });
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
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
        });
    }

    setupModals() {
        // Plugin Catalog Modal
        this.setupPluginCatalog();
        
        // Matrix Builder Modal
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
                <div class="plugin-card" data-plugin-key="${key}">
                    <h4>${plugin.name}</h4>
                    <p>${plugin.description}</p>
                </div>
            `).join('');
            
            // Add click handlers
            pluginList.querySelectorAll('.plugin-card').forEach(card => {
                card.addEventListener('click', () => {
                    const pluginKey = card.dataset.pluginKey;
                    this.pipelineBuilder.addPluginStep(pluginKey);
                    modal.style.display = 'none';
                    this.updateYAML();
                    this.showNotification(`Added ${this.pipelineBuilder.pluginCatalog[pluginKey].name} plugin`, 'success');
                });
            });
        };
        
        // Initial render
        renderPlugins();
        
        // Search functionality
        searchInput?.addEventListener('input', (e) => {
            renderPlugins(e.target.value);
        });
    }

    setupMatrixBuilder() {
        const modal = document.getElementById('matrix-builder-modal');
        const addDimensionBtn = document.getElementById('add-dimension');
        const dimensionsContainer = document.getElementById('matrix-dimensions');
        const previewContainer = document.getElementById('matrix-preview-content');
        
        let matrixConfig = {};
        
        const renderDimensions = () => {
            dimensionsContainer.innerHTML = Object.entries(matrixConfig).map(([name, values]) => `
                <div class="matrix-dimension" data-dimension="${name}">
                    <input type="text" class="dimension-name" value="${name}" placeholder="Dimension name">
                    <div class="dimension-values">
                        ${values.map((value, index) => `
                            <input type="text" class="dimension-value" data-index="${index}" value="${value}" placeholder="Value">
                        `).join('')}
                        <button class="btn btn-secondary btn-small add-value">Add Value</button>
                    </div>
                    <button class="btn btn-secondary btn-small remove-dimension">Remove</button>
                </div>
            `).join('');
            
            updatePreview();
        };
        
        const updatePreview = () => {
            const dimensions = Object.entries(matrixConfig).filter(([_, values]) => values.length > 0);
            if (dimensions.length === 0) {
                previewContainer.innerHTML = '<p>No dimensions configured</p>';
                return;
            }
            
            let totalCombinations = 1;
            dimensions.forEach(([_, values]) => {
                totalCombinations *= values.length;
            });
            
            previewContainer.innerHTML = `
                <p><strong>${dimensions.length} dimensions = ${totalCombinations} jobs</strong></p>
                <ul>
                    ${dimensions.map(([name, values]) => 
                        `<li><strong>${name}:</strong> ${values.join(', ')}</li>`
                    ).join('')}
                </ul>
            `;
        };
        
        addDimensionBtn?.addEventListener('click', () => {
            const name = `dimension${Object.keys(matrixConfig).length + 1}`;
            matrixConfig[name] = [''];
            renderDimensions();
        });
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
                    description: 'PyTest with coverage',
                    icon: 'fa-python'
                },
                {
                    id: 'parallel-tests',
                    name: 'Parallel Tests',
                    description: 'Split tests across agents',
                    icon: 'fa-tasks'
                }
            ],
            deployment: [
                {
                    id: 'docker-deploy',
                    name: 'Docker Deployment',
                    description: 'Build and push Docker images',
                    icon: 'fa-docker'
                },
                {
                    id: 'k8s-deploy',
                    name: 'Kubernetes Deploy',
                    description: 'Deploy to Kubernetes cluster',
                    icon: 'fa-dharmachakra'
                },
                {
                    id: 'aws-deploy',
                    name: 'AWS Deployment',
                    description: 'Deploy to AWS services',
                    icon: 'fa-aws'
                }
            ],
            docker: [
                {
                    id: 'docker-build',
                    name: 'Docker Build',
                    description: 'Build Docker image',
                    icon: 'fa-docker'
                },
                {
                    id: 'docker-compose',
                    name: 'Docker Compose',
                    description: 'Run with docker-compose',
                    icon: 'fa-layer-group'
                }
            ],
            security: [
                {
                    id: 'security-scan',
                    name: 'Security Scan',
                    description: 'Run security checks',
                    icon: 'fa-shield-alt'
                },
                {
                    id: 'dependency-check',
                    name: 'Dependency Check',
                    description: 'Check for vulnerabilities',
                    icon: 'fa-search'
                }
            ]
        };
        
        const renderTemplates = (category = 'all') => {
            const templatesToShow = category === 'all' ? 
                Object.values(templates).flat() : 
                templates[category] || [];
            
            templateList.innerHTML = templatesToShow.map(template => `
                <div class="template-item" data-template="${template.id}">
                    <i class="fas ${template.icon}"></i>
                    <span>${template.name}</span>
                    <small>${template.description}</small>
                </div>
            `).join('');
            
            // Add click handlers
            templateList.querySelectorAll('.template-item').forEach(item => {
                item.addEventListener('click', () => {
                    const templateId = item.dataset.template;
                    this.pipelineBuilder.loadTemplate(templateId);
                    modal.style.display = 'none';
                    this.updateYAML();
                    this.showNotification(`Loaded ${templateId} template`, 'success');
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
        const envVarsContainer = document.getElementById('env-variables');
        const buildOptionsContainer = document.getElementById('build-options');
        const addEnvVarBtn = document.getElementById('add-env-var');
        
        // This would typically manage global pipeline variables
        // For now, it's a placeholder for future implementation
        
        const renderVariables = () => {
            envVarsContainer.innerHTML = '<p>No global environment variables defined</p>';
            buildOptionsContainer.innerHTML = '<p>No build options configured</p>';
        };
        
        renderVariables();
    }

    setupPatternLibrary() {
        const modal = document.getElementById('pattern-library-modal');
        const patternList = document.getElementById('pattern-list');
        const categoryButtons = modal.querySelectorAll('.pattern-cat');
        
        const patterns = {
            microservices: [
                {
                    name: 'Microservice CI/CD',
                    description: 'Complete microservice pipeline with testing, building, and deployment',
                    icon: 'fa-cubes'
                },
                {
                    name: 'Service Mesh Deploy',
                    description: 'Deploy microservices with Istio/Linkerd',
                    icon: 'fa-project-diagram'
                }
            ],
            monorepo: [
                {
                    name: 'Monorepo Pipeline',
                    description: 'Handle multiple projects in a monorepo',
                    icon: 'fa-code-branch'
                },
                {
                    name: 'Selective Builds',
                    description: 'Build only changed packages',
                    icon: 'fa-filter'
                }
            ],
            mobile: [
                {
                    name: 'iOS App Pipeline',
                    description: 'Build, test, and deploy iOS apps',
                    icon: 'fa-apple'
                },
                {
                    name: 'Android App Pipeline',
                    description: 'Build, test, and deploy Android apps',
                    icon: 'fa-android'
                },
                {
                    name: 'React Native Pipeline',
                    description: 'Cross-platform mobile app pipeline',
                    icon: 'fa-react'
                }
            ],
            ml: [
                {
                    name: 'ML Model Training',
                    description: 'Train and validate ML models',
                    icon: 'fa-brain'
                },
                {
                    name: 'ML Model Deployment',
                    description: 'Deploy models to production',
                    icon: 'fa-rocket'
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

    handleAction(action) {
        const modal = document.getElementById(`${action}-modal`);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    initializeFeatures() {
        // Initialize any additional features
        console.log('🔧 Initializing additional features...');
        
        // Set up auto-save indicator
        this.setupAutoSaveIndicator();
        
        // Set up drag-drop file upload (future feature)
        this.setupFileDragDrop();
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
            }
        });
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

    exportYAML() {
        const config = this.pipelineBuilder.getPipelineConfig();
        const yaml = this.yamlGenerator.generate(config);
        
        // Create download
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pipeline.yml';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Pipeline exported successfully!', 'success');
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
            // TODO: Implement pipeline loading from config
            console.log('Found saved pipeline:', config);
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

// CSS for YAML syntax highlighting
const yamlStyles = `
    .yaml-key { color: #e06c75; font-weight: 600; }
    .yaml-string { color: #98c379; }
    .yaml-number { color: #d19a66; }
    .yaml-boolean { color: #56b6c2; }
    .yaml-array { color: #c678dd; }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = yamlStyles;
document.head.appendChild(styleSheet);

// Initialize app
window.buildkiteApp = new BuildkiteApp();

// Export for debugging
console.log('🎉 Buildkite Pipeline Builder loaded successfully!');
console.log('📚 Available in console: window.pipelineBuilder, window.buildkiteApp');