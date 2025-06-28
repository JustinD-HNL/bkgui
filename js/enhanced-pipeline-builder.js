// js/enhanced-pipeline-builder.js
/**
 * Enhanced Pipeline Builder with Advanced Buildkite Features
 * Adds support for plugins, matrix builds, annotations, and complex configurations
 */

class EnhancedPipelineBuilder extends PipelineBuilder {
    constructor() {
        super();
        this.pluginCatalog = this.initializePluginCatalog();
        this.stepTemplates = this.initializeStepTemplates();
        this.matrixPresets = this.initializeMatrixPresets();
        this.setupEnhancedEventListeners();
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
                    login: { type: 'boolean', label: 'Auto-login', default: true },
                    region: { type: 'text', label: 'AWS Region' },
                    registry_ids: { type: 'array', label: 'Registry IDs' }
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
            },
            'kubernetes': {
                name: 'Kubernetes',
                description: 'Deploy to Kubernetes clusters',
                version: 'v1.3.0',
                category: 'deployment',
                fields: {
                    namespace: { type: 'text', label: 'Namespace' },
                    config_file: { type: 'text', label: 'Config File Path' },
                    context: { type: 'text', label: 'Kubectl Context' }
                }
            }
        };
    }

    initializeStepTemplates() {
        return {
            'node-test': {
                name: 'Node.js Test Suite',
                description: 'Standard Node.js testing with coverage',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Node.js Tests',
                        commands: ['npm ci', 'npm test'],
                        artifact_paths: ['coverage/**/*', 'test-results.xml'],
                        plugins: {
                            'junit-annotate': {
                                artifacts: 'test-results.xml'
                            }
                        }
                    }
                }
            },
            'docker-build': {
                name: 'Docker Build & Push',
                description: 'Build Docker image and push to registry',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Docker Build',
                        command: 'docker build -t $IMAGE_TAG .',
                        plugins: {
                            'ecr': { login: true },
                            'docker': {
                                image: 'docker:latest',
                                always_pull: true
                            }
                        }
                    }
                }
            },
            'parallel-tests': {
                name: 'Parallel Test Matrix',
                description: 'Run tests in parallel across multiple environments',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Tests ({{matrix.env}})',
                        command: 'npm test',
                        matrix: {
                            setup: {
                                env: ['development', 'staging', 'production'],
                                node: ['16', '18', '20']
                            }
                        }
                    }
                }
            },
            'microservice-pipeline': {
                name: 'Microservice Pipeline',
                description: 'Complete microservice CI/CD',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Microservice Build',
                        command: 'npm install && npm test && npm run build',
                        plugins: {
                            'docker': {
                                image: 'node:18-alpine',
                                workdir: '/app'
                            }
                        }
                    }
                }
            },
            'deployment-pipeline': {
                name: 'Deployment Pipeline',
                description: 'Deploy with approvals',
                template: {
                    type: 'command',
                    properties: {
                        label: 'Deploy to Production',
                        command: 'npm run deploy',
                        agents: {
                            queue: 'deployment'
                        }
                    }
                }
            }
        };
    }

    initializeMatrixPresets() {
        return {
            'node_versions': {
                name: 'Node.js Versions',
                matrix: { node: ['16', '18', '20', '21'] }
            },
            'os_matrix': {
                name: 'Operating Systems',
                matrix: { os: ['ubuntu-latest', 'windows-latest', 'macos-latest'] }
            },
            'browser_matrix': {
                name: 'Browser Testing',
                matrix: { 
                    browser: ['chrome', 'firefox', 'safari'],
                    version: ['latest', 'latest-1']
                }
            },
            'database_matrix': {
                name: 'Database Testing',
                matrix: {
                    database: ['postgresql', 'mysql', 'sqlite'],
                    version: ['latest', '14', '13']
                }
            }
        };
    }

    // Enhanced step type support
    getDefaultProperties(type) {
        const baseProperties = super.getDefaultProperties(type);
        
        // Add enhanced properties for existing types
        if (type === 'command') {
            return {
                ...baseProperties,
                parallelism: null,
                concurrency: null,
                concurrency_group: '',
                matrix: {},
                depends_on: [],
                skip: '',
                if: '',
                branches: '',
                soft_fail: false,
                cancel_on_build_failing: false,
                allow_dependency_failure: false
            };
        }
        
        // Add new step types
        const enhancedDefaults = {
            annotation: {
                label: 'Annotation Step',
                body: '',
                style: 'info',
                context: 'default',
                priority: 0
            },
            plugin: {
                label: 'Plugin Step',
                command: '',
                plugins: {},
                selected_plugin: ''
            },
            notify: {
                label: 'Notification Step',
                notify: [],
                command: ''
            },
            'pipeline-upload': {
                label: 'Pipeline Upload',
                dynamic_script: '',
                pipeline_file: '.buildkite/pipeline.yml'
            }
        };

        return enhancedDefaults[type] || baseProperties;
    }

    // Enhanced step creation
    createStep(stepType) {
        const step = super.createStep(stepType);
        
        const enhancedStepConfigs = {
            'annotation': {
                type: 'annotation',
                label: 'Annotation',
                icon: 'fas fa-comment',
                properties: {
                    label: `Annotation ${this.stepCounter}`,
                    body: '# Build Status\n\nBuild completed successfully!',
                    style: 'success',
                    context: 'default',
                    priority: 0
                }
            },
            'plugin': {
                type: 'plugin',
                label: 'Plugin',
                icon: 'fas fa-plug',
                properties: {
                    label: `Plugin Step ${this.stepCounter}`,
                    command: '',
                    plugins: {},
                    selected_plugin: ''
                }
            },
            'notify': {
                type: 'notify',
                label: 'Notification',
                icon: 'fas fa-bell',
                properties: {
                    label: `Notification ${this.stepCounter}`,
                    command: 'echo "Sending notification"',
                    notify: {
                        slack: {
                            webhook_url: '',
                            channel: '#builds'
                        }
                    }
                }
            },
            'pipeline-upload': {
                type: 'pipeline-upload',
                label: 'Pipeline Upload',
                icon: 'fas fa-upload',
                properties: {
                    label: `Pipeline Upload ${this.stepCounter}`,
                    command: 'buildkite-agent pipeline upload',
                    pipeline_file: '.buildkite/pipeline.yml',
                    dynamic_script: ''
                }
            }
        };

        if (enhancedStepConfigs[stepType]) {
            return {
                id: step.id,
                ...enhancedStepConfigs[stepType]
            };
        }

        return step;
    }

    generatePropertiesForm(step) {
        const baseForm = super.generatePropertiesForm(step);
        
        if (step.type === 'command') {
            return this.generateEnhancedCommandForm(step);
        } else if (step.type === 'annotation') {
            return this.generateAnnotationForm(step);
        } else if (step.type === 'plugin') {
            return this.generatePluginForm(step);
        } else if (step.type === 'notify') {
            return this.generateNotifyForm(step);
        } else if (step.type === 'pipeline-upload') {
            return this.generatePipelineUploadForm(step);
        }
        
        return baseForm;
    }

    generateEnhancedCommandForm(step) {
        return `
            <div class="properties-form">
                <h3><i class="fas fa-terminal"></i> Enhanced Command Step Properties</h3>
                
                <!-- Basic Properties -->
                <div class="property-section">
                    <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Command</label>
                        <textarea name="command" placeholder="echo 'Hello World'">${step.properties.command || ''}</textarea>
                    </div>
                </div>

                <!-- Advanced Conditions -->
                <div class="property-section">
                    <h4><i class="fas fa-question-circle"></i> Conditions & Flow Control</h4>
                    
                    <div class="property-group">
                        <label>Skip Condition</label>
                        <input type="text" name="skip" value="${step.properties.skip || ''}" 
                               placeholder="e.g., 'Temporarily disabled'" />
                        <small>Message to display when step is skipped</small>
                    </div>
                    
                    <div class="property-group">
                        <label>If Condition</label>
                        <input type="text" name="if" value="${step.properties.if || ''}" 
                               placeholder="e.g., build.branch == 'main'" />
                        <small>Boolean expression to control when step runs</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Branch Filter</label>
                        <input type="text" name="branches" value="${step.properties.branches || ''}" 
                               placeholder="main feature/*" />
                        <small>Space-separated list of branch patterns</small>
                    </div>
                </div>

                <!-- Execution Control -->
                <div class="property-section">
                    <h4><i class="fas fa-play"></i> Execution Control</h4>
                    
                    <div class="property-group">
                        <label>Parallelism</label>
                        <input type="number" name="parallelism" value="${step.properties.parallelism || ''}" 
                               min="1" max="50" placeholder="1" />
                        <small>Number of jobs to run in parallel</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Concurrency</label>
                        <input type="number" name="concurrency" value="${step.properties.concurrency || ''}" 
                               min="1" placeholder="1" />
                        <small>Limit concurrent executions</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Concurrency Group</label>
                        <input type="text" name="concurrency_group" value="${step.properties.concurrency_group || ''}" 
                               placeholder="deployment" />
                        <small>Group name for concurrency limiting</small>
                    </div>
                </div>

                <!-- Error Handling -->
                <div class="property-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Error Handling</h4>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="retry" ${step.properties.retry ? 'checked' : ''} />
                        <label>Retry on failure</label>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="soft_fail" ${step.properties.soft_fail ? 'checked' : ''} />
                        <label>Soft fail</label>
                        <small>Don't fail the build if this step fails</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="cancel_on_build_failing" ${step.properties.cancel_on_build_failing ? 'checked' : ''} />
                        <label>Cancel on build failing</label>
                        <small>Cancel this step if the build is already failing</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="allow_dependency_failure" ${step.properties.allow_dependency_failure ? 'checked' : ''} />
                        <label>Allow dependency failure</label>
                        <small>Run even if dependencies fail</small>
                    </div>
                </div>

                <!-- Matrix Builds -->
                <div class="property-section">
                    <h4><i class="fas fa-th"></i> Matrix Builds</h4>
                    <div class="property-group">
                        <div class="matrix-builder">
                            <button type="button" class="btn btn-secondary" onclick="window.openMatrixBuilderSafe('${step.id}')">
                                <i class="fas fa-plus"></i> Configure Matrix
                            </button>
                            <div id="matrix-preview-${step.id}" class="matrix-preview">
                                ${this.renderMatrixPreview(step.properties.matrix)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Plugins -->
                <div class="property-section">
                    <h4><i class="fas fa-plug"></i> Plugins</h4>
                    <div class="property-group">
                        <div class="plugin-builder">
                            <button type="button" class="btn btn-secondary" onclick="pipelineBuilder.openPluginBuilder('${step.id}')">
                                <i class="fas fa-plus"></i> Add Plugin
                            </button>
                            <div id="plugins-preview-${step.id}" class="plugins-preview">
                                ${this.renderPluginsPreview(step.properties.plugins)}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Agents & Environment -->
                <div class="property-section">
                    <h4><i class="fas fa-server"></i> Agents & Environment</h4>
                    
                    <div class="property-group">
                        <label>Agent Query</label>
                        <input type="text" name="agents" value="${step.properties.agents || ''}" 
                               placeholder="queue=default,os=linux" />
                        <small>Key=value pairs to target specific agents</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Environment Variables (JSON)</label>
                        <textarea name="env" placeholder='{"NODE_ENV": "test", "API_KEY": "secret"}'>${JSON.stringify(step.properties.env || {}, null, 2)}</textarea>
                    </div>
                </div>

                <!-- Artifacts -->
                <div class="property-section">
                    <h4><i class="fas fa-archive"></i> Artifacts</h4>
                    
                    <div class="property-group">
                        <label>Artifact Paths</label>
                        <textarea name="artifact_paths" placeholder="build/**/*${String.fromCharCode(10)}test-results/**/*${String.fromCharCode(10)}coverage/**/*">${Array.isArray(step.properties.artifact_paths) ? step.properties.artifact_paths.join('\n') : ''}</textarea>
                        <small>One path per line, supports glob patterns</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Timeout (minutes)</label>
                        <input type="number" name="timeout_in_minutes" value="${step.properties.timeout_in_minutes || ''}" 
                               min="1" max="1440" placeholder="30" />
                    </div>
                </div>
            </div>
        `;
    }

    generateAnnotationForm(step) {
        return `
            <div class="properties-form">
                <h3><i class="fas fa-comment"></i> Annotation Step Properties</h3>
                
                <div class="property-section">
                    <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Context</label>
                        <input type="text" name="context" value="${step.properties.context || 'default'}" 
                               placeholder="default" />
                        <small>Unique identifier for this annotation</small>
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
                        <label>Content (Markdown)</label>
                        <textarea name="body" rows="6" placeholder="# Your Markdown Here${String.fromCharCode(10)}${String.fromCharCode(10)}Add **formatted** content to your build.">${step.properties.body || ''}</textarea>
                        <small>CommonMark markdown content for the annotation</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Priority</label>
                        <input type="number" name="priority" value="${step.properties.priority || 0}" 
                               min="0" max="10" />
                        <small>Display priority (0-10, higher numbers shown first)</small>
                    </div>
                </div>
            </div>
        `;
    }

    generatePluginForm(step) {
        const pluginOptions = Object.entries(this.pluginCatalog)
            .map(([key, plugin]) => `<option value="${key}">${plugin.name}</option>`)
            .join('');
            
        return `
            <div class="properties-form">
                <h3><i class="fas fa-plug"></i> Plugin Step Properties</h3>
                
                <div class="property-section">
                    <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Command</label>
                        <textarea name="command" placeholder="echo 'Running with plugins'">${step.properties.command || ''}</textarea>
                    </div>
                    
                    <div class="property-group">
                        <label>Select Plugin</label>
                        <select name="selected_plugin" onchange="pipelineBuilder.updatePluginConfig('${step.id}', this.value)">
                            <option value="">Choose a plugin...</option>
                            ${pluginOptions}
                        </select>
                    </div>
                    
                    <div id="plugin-config-${step.id}" class="plugin-config">
                        ${this.renderPluginConfig(step.properties.selected_plugin, step.properties.plugins)}
                    </div>
                </div>
            </div>
        `;
    }

    generateNotifyForm(step) {
        return `
            <div class="properties-form">
                <h3><i class="fas fa-bell"></i> Notification Step Properties</h3>
                
                <div class="property-section">
                    <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Command</label>
                        <textarea name="command" placeholder="echo 'Sending notification'">${step.properties.command || ''}</textarea>
                    </div>
                    
                    <div class="property-group">
                        <label>Notification Config (JSON)</label>
                        <textarea name="notify" placeholder='{"slack": {"webhook_url": "", "channel": "#builds"}}'>${JSON.stringify(step.properties.notify || {}, null, 2)}</textarea>
                    </div>
                </div>
            </div>
        `;
    }

    generatePipelineUploadForm(step) {
        return `
            <div class="properties-form">
                <h3><i class="fas fa-upload"></i> Pipeline Upload Properties</h3>
                
                <div class="property-section">
                    <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Pipeline File</label>
                        <input type="text" name="pipeline_file" value="${step.properties.pipeline_file || '.buildkite/pipeline.yml'}" 
                               placeholder=".buildkite/pipeline.yml" />
                        <small>Path to the pipeline file to upload</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Dynamic Script</label>
                        <input type="text" name="dynamic_script" value="${step.properties.dynamic_script || ''}" 
                               placeholder="./scripts/generate-pipeline.sh" />
                        <small>Script to generate pipeline dynamically</small>
                    </div>
                </div>
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
                        `<li>${key}: ${Array.isArray(values) ? 
                            values.join(', ') : values}</li>`
                    ).join('')}
                </ul>
                <p><strong>Total Combinations:</strong> ${combinations}</p>
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

    calculateMatrixCombinations(setup) {
        return Object.values(setup).reduce((total, values) => {
            return total * (Array.isArray(values) ? values.length : 1);
        }, 1);
    }

    openMatrixBuilder(stepId) {
        console.log('Opening matrix builder for step:', stepId);
        alert('Matrix builder modal coming soon!');
    }

    openPluginBuilder(stepId) {
        console.log('Opening plugin builder for step:', stepId);
        alert('Plugin builder modal coming soon!');
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

    setupEnhancedEventListeners() {
        // Add keyboard shortcuts for enhanced features
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'm':
                        e.preventDefault();
                        this.showMatrixTemplates();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.showPluginCatalog();
                        break;
                    case 't':
                        e.preventDefault();
                        this.showStepTemplates();
                        break;
                }
            }
        });
    }

    showMatrixTemplates() {
        console.log('Showing matrix templates');
        alert('Matrix templates modal coming soon!');
    }

    // ✅ REMOVED STUB - Now inherits working showPluginCatalog from parent class

    showStepTemplates() {
        console.log('Showing step templates');
        alert('Step templates modal coming soon!');
    }

    // Enhanced YAML generation with new features
    generateStepYAML(step) {
        if (['annotation', 'plugin', 'notify', 'pipeline-upload'].includes(step.type)) {
            return this.generateEnhancedStepYAML(step);
        }
        return super.generateStepYAML(step);
    }

    generateEnhancedStepYAML(step) {
        const props = step.properties;
        let yaml = '';

        switch (step.type) {
            case 'annotation':
                yaml = `  - label: "${props.label}"\n`;
                yaml += `    command: buildkite-agent annotate --context "${props.context}" --style "${props.style}" <<EOF\n`;
                yaml += `${props.body}\nEOF\n`;
                break;
                
            case 'plugin':
                yaml = `  - label: "${props.label}"\n`;
                if (props.command) {
                    yaml += `    command: "${props.command}"\n`;
                }
                if (Object.keys(props.plugins).length > 0) {
                    yaml += `    plugins:\n`;
                    Object.entries(props.plugins).forEach(([plugin, config]) => {
                        const pluginInfo = this.pluginCatalog[plugin];
                        const version = pluginInfo ? pluginInfo.version : 'latest';
                        yaml += `      - ${plugin}#${version}:\n`;
                        Object.entries(config).forEach(([key, value]) => {
                            yaml += `          ${key}: ${JSON.stringify(value)}\n`;
                        });
                    });
                }
                break;
                
            case 'pipeline-upload':
                yaml = `  - label: "${props.label}"\n`;
                yaml += `    command: `;
                if (props.dynamic_script) {
                    yaml += `${props.dynamic_script} | `;
                }
                yaml += `buildkite-agent pipeline upload`;
                if (props.pipeline_file && props.pipeline_file !== '.buildkite/pipeline.yml') {
                    yaml += ` ${props.pipeline_file}`;
                }
                yaml += `\n`;
                break;
        }

        return yaml + '\n';
    }
}

// Enhanced YAML Generator with new features
class EnhancedYAMLGenerator extends YAMLGenerator {
    generateCommandStep(props) {
        let yaml = `${this.indent}- label: "${props.label || 'Command Step'}"\n`;
        
        // Command or commands
        if (props.command) {
            if (props.command.includes('\n')) {
                yaml += `${this.indent}${this.indent}command: |\n`;
                props.command.split('\n').forEach(line => {
                    yaml += `${this.indent}${this.indent}${this.indent}${line}\n`;
                });
            } else {
                yaml += `${this.indent}${this.indent}command: "${props.command}"\n`;
            }
        }

        // Skip condition
        if (props.skip) {
            yaml += `${this.indent}${this.indent}skip: "${props.skip}"\n`;
        }

        // If condition
        if (props.if) {
            yaml += `${this.indent}${this.indent}if: "${props.if}"\n`;
        }

        // Branch filter
        if (props.branches) {
            yaml += `${this.indent}${this.indent}branches: "${props.branches}"\n`;
        }

        // Matrix configuration
        if (props.matrix && props.matrix.setup) {
            yaml += `${this.indent}${this.indent}matrix:\n`;
            yaml += `${this.indent}${this.indent}${this.indent}setup:\n`;
            Object.entries(props.matrix.setup).forEach(([key, values]) => {
                yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${key}:\n`;
                if (Array.isArray(values)) {
                    values.forEach(value => {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${this.indent}- "${value}"\n`;
                    });
                }
            });

            // Matrix adjustments
            if (props.matrix.adjustments) {
                yaml += `${this.indent}${this.indent}${this.indent}adjustments:\n`;
                props.matrix.adjustments.forEach(adjustment => {
                    yaml += `${this.indent}${this.indent}${this.indent}${this.indent}- with:\n`;
                    Object.entries(adjustment.with).forEach(([key, value]) => {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
                    });
                    if (adjustment.soft_fail) {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${this.indent}soft_fail: true\n`;
                    }
                });
            }
        }

        // Enhanced features
        if (props.parallelism) {
            yaml += `${this.indent}${this.indent}parallelism: ${props.parallelism}\n`;
        }
        
        if (props.concurrency) {
            yaml += `${this.indent}${this.indent}concurrency: ${props.concurrency}\n`;
        }
        
        if (props.concurrency_group) {
            yaml += `${this.indent}${this.indent}concurrency_group: "${props.concurrency_group}"\n`;
        }

        // Dependencies
        if (props.depends_on && props.depends_on.length > 0) {
            yaml += `${this.indent}${this.indent}depends_on:\n`;
            props.depends_on.forEach(dep => {
                yaml += `${this.indent}${this.indent}${this.indent}- "${dep}"\n`;
            });
        }

        // Plugins
        if (props.plugins && Object.keys(props.plugins).length > 0) {
            yaml += `${this.indent}${this.indent}plugins:\n`;
            Object.entries(props.plugins).forEach(([plugin, config]) => {
                yaml += `${this.indent}${this.indent}${this.indent}- ${plugin}:\n`;
                Object.entries(config).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${key}:\n`;
                        Object.entries(value).forEach(([subKey, subValue]) => {
                            yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${this.indent}${subKey}: "${subValue}"\n`;
                        });
                    } else {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${key}: ${typeof value === 'string' ? 
                            `"${value}"` : value}\n`;
                    }
                });
            });
        }

        // Concurrency
        if (props.concurrency) {
            yaml += `${this.indent}${this.indent}concurrency: ${props.concurrency}\n`;
        }
        if (props.concurrency_group) {
            yaml += `${this.indent}${this.indent}concurrency_group: "${props.concurrency_group}"\n`;
        }

        // Agents
        if (props.agents) {
            yaml += `${this.indent}${this.indent}agents:\n`;
            const agentPairs = props.agents.split(',').map(pair => pair.trim());
            agentPairs.forEach(pair => {
                const [key, value] = pair.split('=').map(s => s.trim());
                if (key && value) {
                    yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
                }
            });
        }

        // Environment variables
        if (props.env && Object.keys(props.env).length > 0) {
            yaml += `${this.indent}${this.indent}env:\n`;
            Object.entries(props.env).forEach(([key, value]) => {
                yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
            });
        }

        // Artifact paths
        if (props.artifact_paths && props.artifact_paths.length > 0) {
            yaml += `${this.indent}${this.indent}artifact_paths:\n`;
            props.artifact_paths.forEach(path => {
                yaml += `${this.indent}${this.indent}${this.indent}- "${path}"\n`;
            });
        }

        // Timeout
        if (props.timeout_in_minutes && props.timeout_in_minutes !== 10) {
            yaml += `${this.indent}${this.indent}timeout_in_minutes: ${props.timeout_in_minutes}\n`;
        }

        // Retry configuration
        if (props.retry) {
            yaml += `${this.indent}${this.indent}retry:\n`;
            yaml += `${this.indent}${this.indent}${this.indent}automatic: true\n`;
        }

        // Soft fail
        if (props.soft_fail) {
            yaml += `${this.indent}${this.indent}soft_fail: true\n`;
        }

        // Cancel on build failing
        if (props.cancel_on_build_failing) {
            yaml += `${this.indent}${this.indent}cancel_on_build_failing: true\n`;
        }

        // Allow dependency failure
        if (props.allow_dependency_failure) {
            yaml += `${this.indent}${this.indent}allow_dependency_failure: true\n`;
        }

        return yaml + '\n';
    }
}

// js/enhanced-pipeline-builder.js
// MATRIX BUILDER FIX: Add to the bottom of the enhanced-pipeline-builder.js file

// Ensure matrix builder methods are properly available in EnhancedPipelineBuilder
if (window.EnhancedPipelineBuilder) {
    // Add matrix builder methods to prototype if they're missing
    if (!window.EnhancedPipelineBuilder.prototype.openMatrixBuilder) {
        window.EnhancedPipelineBuilder.prototype.openMatrixBuilder = function(stepId) {
            console.log('🔲 Enhanced Pipeline Builder - Opening matrix builder for step:', stepId);
            
            // Call the parent method if available
            if (this.showMatrixTemplates) {
                this.showMatrixTemplates();
                
                // If we have a specific step ID, pre-populate the matrix
                if (stepId) {
                    const step = this.steps.find(s => s.id === stepId);
                    if (step && step.properties.matrix && step.properties.matrix.setup) {
                        setTimeout(() => {
                            if (this.prePopulateMatrix) {
                                this.prePopulateMatrix(step.properties.matrix.setup);
                            }
                        }, 100);
                    }
                }
            } else {
                console.warn('⚠️ showMatrixTemplates method not available');
                alert('Matrix builder is loading. Please try again in a moment.');
            }
        };
    }
    
    // Ensure the method is bound properly to instances
    const originalConstructor = window.EnhancedPipelineBuilder;
    window.EnhancedPipelineBuilder = function() {
        const instance = new originalConstructor();
        
        // Ensure matrix builder methods are bound
        if (!instance.openMatrixBuilder && instance.showMatrixTemplates) {
            instance.openMatrixBuilder = function(stepId) {
                console.log('🔲 Instance method - Opening matrix builder for step:', stepId);
                this.showMatrixTemplates();
                
                if (stepId) {
                    const step = this.steps.find(s => s.id === stepId);
                    if (step && step.properties.matrix && step.properties.matrix.setup) {
                        setTimeout(() => {
                            if (this.prePopulateMatrix) {
                                this.prePopulateMatrix(step.properties.matrix.setup);
                            }
                        }, 100);
                    }
                }
            };
        }
        
        return instance;
    };
    
    // Copy prototype
    window.EnhancedPipelineBuilder.prototype = originalConstructor.prototype;
    
    console.log('✅ Enhanced Pipeline Builder matrix methods ensured');
}

// Also ensure the method is available on the global instance
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.pipelineBuilder && !window.pipelineBuilder.openMatrixBuilder) {
            console.log('🔧 Adding openMatrixBuilder method to global instance');
            
            window.pipelineBuilder.openMatrixBuilder = function(stepId) {
                console.log('🔲 Global instance - Opening matrix builder for step:', stepId);
                
                if (this.showMatrixTemplates) {
                    this.showMatrixTemplates();
                    
                    if (stepId) {
                        const step = this.steps.find(s => s.id === stepId);
                        if (step && step.properties.matrix && step.properties.matrix.setup) {
                            setTimeout(() => {
                                if (this.prePopulateMatrix) {
                                    this.prePopulateMatrix(step.properties.matrix.setup);
                                }
                            }, 100);
                        }
                    }
                } else {
                    console.warn('⚠️ showMatrixTemplates method not available on instance');
                    alert('Matrix builder is loading. Please try again in a moment.');
                }
            };
        }
    }, 1000);
});

// Export enhanced classes to global scope
window.EnhancedPipelineBuilder = EnhancedPipelineBuilder;
window.EnhancedYAMLGenerator = EnhancedYAMLGenerator;


