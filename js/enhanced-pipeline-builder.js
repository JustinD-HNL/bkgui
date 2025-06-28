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
                    style: { type: 'select', label: 'Annotation Style', options: ['info', 'success', 'warning', 'error'] },
                    job_uuid_file_pattern: { type: 'text', label: 'Job UUID File Pattern' }
                }
            },
            'slack': {
                name: 'Slack',
                description: 'Send notifications to Slack',
                version: 'v1.4.2',
                category: 'notifications',
                fields: {
                    notify: { type: 'array', label: 'Notify Events' },
                    webhook_url: { type: 'text', label: 'Webhook URL', required: true },
                    channel: { type: 'text', label: 'Channel' },
                    username: { type: 'text', label: 'Username' }
                }
            },
            'github-status': {
                name: 'GitHub Status',
                description: 'Update GitHub commit status',
                version: 'v1.7.0',
                category: 'notifications',
                fields: {
                    repo: { type: 'text', label: 'Repository', required: true },
                    commit: { type: 'text', label: 'Commit SHA' },
                    context: { type: 'text', label: 'Status Context' }
                }
            },
            'ecr': {
                name: 'AWS ECR',
                description: 'Push Docker images to AWS ECR',
                version: 'v2.7.0',
                category: 'deployment',
                fields: {
                    login: { type: 'boolean', label: 'ECR Login' },
                    account_ids: { type: 'array', label: 'Account IDs' },
                    region: { type: 'text', label: 'AWS Region' },
                    registry_region: { type: 'text', label: 'Registry Region' }
                }
            }
        };
    }

    initializeStepTemplates() {
        return {
            'node-ci': {
                name: 'Node.js CI',
                description: 'Standard Node.js CI pipeline with testing',
                steps: [
                    { type: 'command', label: 'Install Dependencies', command: 'npm ci' },
                    { type: 'command', label: 'Run Tests', command: 'npm test' },
                    { type: 'command', label: 'Build', command: 'npm run build' }
                ]
            },
            'docker-build': {
                name: 'Docker Build & Push',
                description: 'Build and push Docker images',
                steps: [
                    { type: 'command', label: 'Build Image', command: 'docker build -t my-app .' },
                    { type: 'command', label: 'Push Image', command: 'docker push my-app' }
                ]
            },
            'approval-deploy': {
                name: 'Approval + Deploy',
                description: 'Manual approval followed by deployment',
                steps: [
                    { type: 'block', label: 'Deploy to Production?', prompt: 'Ready to deploy?' },
                    { type: 'command', label: 'Deploy', command: 'npm run deploy' }
                ]
            }
        };
    }

    initializeMatrixPresets() {
        return {
            'node-versions': {
                name: 'Node.js Versions',
                description: 'Test across multiple Node.js versions',
                setup: {
                    node_version: ['16', '18', '20']
                }
            },
            'os-matrix': {
                name: 'Operating Systems',
                description: 'Test across different operating systems',
                setup: {
                    os: ['ubuntu-20.04', 'ubuntu-22.04', 'windows-2019', 'macos-12']
                }
            },
            'browser-testing': {
                name: 'Browser Testing',
                description: 'Test across multiple browsers',
                setup: {
                    browser: ['chrome', 'firefox', 'safari', 'edge'],
                    browser_version: ['latest', 'latest-1']
                }
            },
            'deployment-environments': {
                name: 'Deployment Environments',
                description: 'Deploy to multiple environments',
                setup: {
                    environment: ['staging', 'production'],
                    region: ['us-east-1', 'us-west-2', 'eu-west-1']
                }
            }
        };
    }

    // Enhanced property rendering with new step types
    renderCommandProperties(step) {
        const props = step.properties;
        return `
            <div class="properties-panel">
                <h3><i class="fas fa-cog"></i> Command Step Properties</h3>
                
                <div class="property-section">
                    <h4><i class="fas fa-tag"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${props.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Command</label>
                        <textarea name="command" rows="3" placeholder="npm test">${props.command || ''}</textarea>
                        <small>Shell command(s) to execute</small>
                    </div>
                </div>

                <!-- Conditional Logic -->
                <div class="property-section">
                    <h4><i class="fas fa-code-branch"></i> Conditional Logic</h4>
                    
                    <div class="property-group">
                        <label>Skip Condition</label>
                        <input type="text" name="skip" value="${props.skip || ''}" 
                               placeholder="build.branch == 'main'" />
                        <small>Skip this step when condition is true</small>
                    </div>
                    
                    <div class="property-group">
                        <label>If Condition</label>
                        <input type="text" name="if" value="${props.if || ''}" 
                               placeholder="build.pull_request.id != null" />
                        <small>Only run when condition is true</small>
                    </div>
                </div>

                <!-- Advanced Settings -->
                <div class="property-section">
                    <h4><i class="fas fa-sliders-h"></i> Advanced Settings</h4>
                    
                    <div class="property-group">
                        <label>Timeout (minutes)</label>
                        <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes || ''}" 
                               placeholder="30" min="1" max="480" />
                    </div>
                    
                    <div class="property-group">
                        <label>Parallelism</label>
                        <input type="number" name="parallelism" value="${props.parallelism || ''}" 
                               placeholder="1" min="1" max="100" />
                        <small>Number of parallel jobs</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Concurrency</label>
                        <input type="number" name="concurrency" value="${props.concurrency || ''}" 
                               placeholder="1" min="1" />
                        <small>Maximum concurrent jobs</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Concurrency Group</label>
                        <input type="text" name="concurrency_group" value="${props.concurrency_group || ''}" 
                               placeholder="deploy-group" />
                        <small>Group name for concurrency limiting</small>
                    </div>
                </div>

                <!-- Build Behavior -->
                <div class="property-section">
                    <h4><i class="fas fa-exclamation-triangle"></i> Build Behavior</h4>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="soft_fail" ${props.soft_fail ? 'checked' : ''} />
                        <label>Soft fail</label>
                        <small>Allow pipeline to continue if this step fails</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="cancel_on_build_failing" ${props.cancel_on_build_failing ? 'checked' : ''} />
                        <label>Cancel on build failing</label>
                        <small>Cancel this step if the build is already failing</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" name="allow_dependency_failure" ${props.allow_dependency_failure ? 'checked' : ''} />
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
                        <input type="text" name="agents" value="${props.agents || ''}" 
                               placeholder="queue=default" />
                        <small>Target specific build agents</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Environment Variables</label>
                        <textarea name="env" rows="3" placeholder="NODE_ENV=production">${this.formatEnvVars(props.env)}</textarea>
                        <small>One per line: KEY=value</small>
                    </div>
                </div>

                <!-- Dependencies -->
                <div class="property-section">
                    <h4><i class="fas fa-link"></i> Dependencies</h4>
                    <div class="property-group">
                        <label>Depends On</label>
                        <input type="text" name="depends_on" value="${(props.depends_on || []).join(',')}" 
                               placeholder="step-1,step-2" />
                        <small>Comma-separated list of step IDs</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Enhanced annotation step properties
    renderAnnotationProperties(step) {
        const props = step.properties;
        return `
            <div class="properties-panel">
                <h3><i class="fas fa-comment"></i> Annotation Step Properties</h3>
                
                <div class="property-section">
                    <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${props.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Annotation Context</label>
                        <input type="text" name="context" value="${props.context || 'default'}" 
                               placeholder="default" />
                        <small>Unique identifier for this annotation</small>
                    </div>
                    
                    <div class="property-group">
                        <label>Style</label>
                        <select name="style">
                            <option value="info" ${props.style === 'info' ? 'selected' : ''}>Info</option>
                            <option value="success" ${props.style === 'success' ? 'selected' : ''}>Success</option>
                            <option value="warning" ${props.style === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="error" ${props.style === 'error' ? 'selected' : ''}>Error</option>
                        </select>
                    </div>
                    
                    <div class="property-group">
                        <label>Annotation Body</label>
                        <textarea name="body" rows="5" placeholder="Enter your annotation content here...">${props.body || ''}</textarea>
                        <small>Supports Markdown formatting</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Plugin step properties
    renderPluginProperties(step) {
        const props = step.properties;
        return `
            <div class="properties-panel">
                <h3><i class="fas fa-plug"></i> Plugin Step Properties</h3>
                
                <div class="property-section">
                    <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                    <div class="property-group">
                        <label>Step Label</label>
                        <input type="text" name="label" value="${props.label || ''}" />
                    </div>
                    
                    <div class="property-group">
                        <label>Command (Optional)</label>
                        <input type="text" name="command" value="${props.command || ''}" 
                               placeholder="echo 'Running with plugin'" />
                        <small>Command to run alongside the plugin</small>
                    </div>
                </div>

                <!-- Plugin Selection -->
                <div class="property-section">
                    <h4><i class="fas fa-puzzle-piece"></i> Plugin Configuration</h4>
                    <div class="property-group">
                        <label>Selected Plugin</label>
                        <select name="selected_plugin" onchange="pipelineBuilder.updatePluginConfig('${step.id}', this.value)">
                            <option value="">Select a plugin...</option>
                            ${Object.entries(this.pluginCatalog).map(([key, plugin]) => 
                                `<option value="${key}" ${props.selected_plugin === key ? 'selected' : ''}>${plugin.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div id="plugin-config-${step.id}">
                        ${this.renderPluginConfig(props.selected_plugin, props.plugins)}
                    </div>
                </div>
            </div>
        `;
    }

    // Pipeline upload step properties
    renderPipelineUploadProperties(step) {
        const props = step.properties;
        return `
            <div class="properties-panel">
                <h3><i class="fas fa-upload"></i> Pipeline Upload Step Properties</h3>
                
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

    // NOTE: Removed stub implementations of openMatrixBuilder() and showMatrixTemplates()
    // These methods are now inherited from the parent PipelineBuilder class which has
    // the full working implementation

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
                        // Use inherited method from parent class
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

        // Timeout
        if (props.timeout_in_minutes) {
            yaml += `${this.indent}${this.indent}timeout_in_minutes: ${props.timeout_in_minutes}\n`;
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

        // Agents
        if (props.agents) {
            yaml += `${this.indent}${this.indent}agents:\n`;
            yaml += `${this.indent}${this.indent}${this.indent}queue: "${props.agents}"\n`;
        }

        // Environment variables
        if (props.env && typeof props.env === 'object' && Object.keys(props.env).length > 0) {
            yaml += `${this.indent}${this.indent}env:\n`;
            Object.entries(props.env).forEach(([key, value]) => {
                yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
            });
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
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${key}: ${typeof value === 'string' ? `"${value}"` : value}\n`;
                    }
                });
            });
        }

        // Matrix
        if (props.matrix && props.matrix.setup && Object.keys(props.matrix.setup).length > 0) {
            yaml += `${this.indent}${this.indent}matrix:\n`;
            yaml += `${this.indent}${this.indent}${this.indent}setup:\n`;
            Object.entries(props.matrix.setup).forEach(([key, values]) => {
                yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${key}:\n`;
                if (Array.isArray(values)) {
                    values.forEach(value => {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${this.indent}- "${value}"\n`;
                    });
                } else {
                    yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${this.indent}- "${values}"\n`;
                }
            });
        }

        return yaml;
    }
}

// MATRIX BUILDER FIX: Ensure matrix builder methods are properly available in EnhancedPipelineBuilder
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