// js/enhanced-pipeline-builder.js
/**
 * Enhanced Pipeline Builder with Advanced Buildkite Features
 * Adds support for plugins, matrix builds, annotations, and complex configurations
 * Extends the base PipelineBuilder class and inherits all core functionality
 */

class EnhancedPipelineBuilder extends PipelineBuilder {
    constructor() {
        super();
        console.log('🚀 Initializing Enhanced Pipeline Builder...');
        this.setupEnhancedEventListeners();
        console.log('✅ Enhanced Pipeline Builder initialized');
    }

    // Enhanced step properties rendering with advanced features
    renderStepProperties(step) {
        if (!step) return '';

        const baseProperties = this.renderBaseProperties(step);
        const enhancedProperties = this.renderEnhancedProperties(step);
        
        return `
            <div class="properties-content">
                <div class="properties-header">
                    <h3><i class="${step.icon}"></i> ${step.type.charAt(0).toUpperCase() + step.type.slice(1)} Step</h3>
                </div>
                ${baseProperties}
                ${enhancedProperties}
            </div>
        `;
    }

    renderBaseProperties(step) {
        switch (step.type) {
            case 'command':
                return this.renderCommandProperties(step);
            case 'wait':
                return this.renderWaitProperties(step);
            case 'block':
                return this.renderBlockProperties(step);
            case 'input':
                return this.renderInputProperties(step);
            case 'trigger':
                return this.renderTriggerProperties(step);
            case 'group':
                return this.renderGroupProperties(step);
            default:
                return this.renderGenericProperties(step);
        }
    }

    renderCommandProperties(step) {
        const props = step.properties;
        return `
            <div class="property-group">
                <label>Label</label>
                <input type="text" name="label" value="${props.label || ''}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'label', this.value)">
            </div>
            
            <div class="property-group">
                <label>Command</label>
                <textarea name="command" placeholder="echo 'Hello World'" 
                          onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'command', this.value)">${props.command || ''}</textarea>
            </div>
            
            <div class="property-group">
                <label>Working Directory</label>
                <input type="text" name="workdir" value="${props.workdir || ''}" 
                       placeholder="./src" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'workdir', this.value)">
            </div>
            
            <div class="property-group">
                <label>Timeout (minutes)</label>
                <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes || 60}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'timeout_in_minutes', parseInt(this.value))">
            </div>
            
            <div class="property-group">
                <label>Environment Variables</label>
                <textarea name="env" placeholder="NODE_ENV=production&#10;DEBUG=true" 
                          onchange="window.pipelineBuilder.updateStepEnvironment('${step.id}', this.value)">${this.formatEnvironmentVariables(props.env)}</textarea>
            </div>
            
            <div class="property-group">
                <label>Agent Targeting</label>
                <textarea name="agents" placeholder="queue=default&#10;os=linux" 
                          onchange="window.pipelineBuilder.updateStepAgents('${step.id}', this.value)">${this.formatAgentTargeting(props.agents)}</textarea>
            </div>
        `;
    }

    renderWaitProperties(step) {
        return `
            <div class="property-group">
                <label>Label</label>
                <input type="text" name="label" value="${step.properties.label || 'Wait'}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'label', this.value)">
            </div>
            
            <div class="property-group">
                <label class="checkbox-label">
                    <input type="checkbox" name="continue_on_failure" 
                           ${step.properties.continue_on_failure ? 'checked' : ''}
                           onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'continue_on_failure', this.checked)">
                    Continue on failure
                </label>
            </div>
        `;
    }

    renderBlockProperties(step) {
        const props = step.properties;
        return `
            <div class="property-group">
                <label>Block Title</label>
                <input type="text" name="block" value="${props.block || ''}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'block', this.value)">
            </div>
            
            <div class="property-group">
                <label>Prompt</label>
                <input type="text" name="prompt" value="${props.prompt || ''}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'prompt', this.value)">
            </div>
            
            <div class="property-group">
                <label>Input Fields</label>
                <div class="block-fields">
                    ${(props.fields || []).map((field, index) => `
                        <div class="field-item">
                            <input type="text" value="${field.text || ''}" placeholder="Field label">
                            <select onchange="window.pipelineBuilder.updateBlockField('${step.id}', ${index}, 'type', this.value)">
                                <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                            </select>
                            <button onclick="window.pipelineBuilder.removeBlockField('${step.id}', ${index})">Remove</button>
                        </div>
                    `).join('')}
                </div>
                <button onclick="window.pipelineBuilder.addBlockField('${step.id}')">Add Field</button>
            </div>
        `;
    }

    renderInputProperties(step) {
        // Similar to block properties but for input steps
        return this.renderBlockProperties(step);
    }

    renderTriggerProperties(step) {
        const props = step.properties;
        return `
            <div class="property-group">
                <label>Label</label>
                <input type="text" name="label" value="${props.label || ''}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'label', this.value)">
            </div>
            
            <div class="property-group">
                <label>Pipeline to Trigger</label>
                <input type="text" name="trigger" value="${props.trigger || ''}" 
                       placeholder="my-org/my-pipeline" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'trigger', this.value)">
            </div>
            
            <div class="property-group">
                <label>Branch</label>
                <input type="text" name="branch" value="${props.build?.branch || ''}" 
                       placeholder="main" 
                       onchange="window.pipelineBuilder.updateTriggerBuild('${step.id}', 'branch', this.value)">
            </div>
            
            <div class="property-group">
                <label>Message</label>
                <input type="text" name="message" value="${props.build?.message || ''}" 
                       placeholder="Triggered from upstream" 
                       onchange="window.pipelineBuilder.updateTriggerBuild('${step.id}', 'message', this.value)">
            </div>
        `;
    }

    renderGroupProperties(step) {
        const props = step.properties;
        return `
            <div class="property-group">
                <label>Group Label</label>
                <input type="text" name="group" value="${props.group || ''}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'group', this.value)">
            </div>
            
            <div class="property-group">
                <label>Group Steps</label>
                <div class="group-steps">
                    ${(props.steps || []).length} steps in this group
                    <button onclick="window.pipelineBuilder.editGroupSteps('${step.id}')">Edit Steps</button>
                </div>
            </div>
        `;
    }

    renderGenericProperties(step) {
        return `
            <div class="property-group">
                <label>Label</label>
                <input type="text" name="label" value="${step.properties.label || ''}" 
                       onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'label', this.value)">
            </div>
        `;
    }

    renderEnhancedProperties(step) {
        return `
            <div class="enhanced-properties">
                <h4>🚀 Enhanced Features</h4>
                
                ${this.renderPluginsSection(step)}
                ${this.renderMatrixSection(step)}
                ${this.renderRetrySection(step)}
                ${this.renderArtifactsSection(step)}
                ${this.renderNotificationsSection(step)}
            </div>
        `;
    }

    renderPluginsSection(step) {
        const props = step.properties;
        const plugins = props.plugins || {};
        const selectedPlugin = props.selected_plugin;

        return `
            <div class="property-section plugins-section">
                <h5><i class="fas fa-puzzle-piece"></i> Plugins</h5>
                
                <div class="property-group">
                    <label>Select Plugin</label>
                    <select name="selected_plugin" onchange="window.pipelineBuilder.updatePluginConfig('${step.id}', this.value)">
                        <option value="">No plugin</option>
                        ${Object.entries(this.pluginCatalog).map(([key, plugin]) => `
                            <option value="${key}" ${selectedPlugin === key ? 'selected' : ''}>${plugin.name}</option>
                        `).join('')}
                    </select>
                    <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.showPluginCatalog()">
                        <i class="fas fa-search"></i> Browse Catalog
                    </button>
                </div>
                
                ${this.renderPluginConfig(selectedPlugin, plugins)}
                
                <div class="plugins-preview">
                    <h6>Configured Plugins</h6>
                    ${this.renderPluginsPreview(plugins)}
                </div>
            </div>
        `;
    }

    renderMatrixSection(step) {
        const props = step.properties;
        const matrix = props.matrix;

        return `
            <div class="property-section matrix-section">
                <h5><i class="fas fa-th"></i> Matrix Builds</h5>
                
                <div class="property-group">
                    <button class="btn btn-secondary" onclick="window.pipelineBuilder.openMatrixBuilder('${step.id}')">
                        <i class="fas fa-th"></i> Configure Matrix
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder.showMatrixTemplates()">
                        <i class="fas fa-magic"></i> Templates
                    </button>
                </div>
                
                <div class="matrix-preview">
                    <h6>Matrix Configuration</h6>
                    ${this.renderMatrixPreview(matrix)}
                </div>
            </div>
        `;
    }

    renderRetrySection(step) {
        const props = step.properties;
        const retry = props.retry || { automatic: false };

        return `
            <div class="property-section retry-section">
                <h5><i class="fas fa-redo"></i> Retry Configuration</h5>
                
                <div class="property-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="retry_automatic" 
                               ${retry.automatic ? 'checked' : ''}
                               onchange="window.pipelineBuilder.updateRetryConfig('${step.id}', 'automatic', this.checked)">
                        Automatic retry on failure
                    </label>
                </div>
                
                ${retry.automatic ? `
                    <div class="property-group">
                        <label>Exit Codes (comma-separated)</label>
                        <input type="text" name="retry_exit_codes" 
                               value="${(retry.automatic_on || []).join(', ')}" 
                               placeholder="1, 2, 255"
                               onchange="window.pipelineBuilder.updateRetryExitCodes('${step.id}', this.value)">
                    </div>
                    
                    <div class="property-group">
                        <label>Max Attempts</label>
                        <input type="number" name="retry_limit" 
                               value="${retry.limit || 3}" min="1" max="10"
                               onchange="window.pipelineBuilder.updateRetryConfig('${step.id}', 'limit', parseInt(this.value))">
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderArtifactsSection(step) {
        const props = step.properties;
        const artifacts = props.artifact_paths || '';

        return `
            <div class="property-section artifacts-section">
                <h5><i class="fas fa-archive"></i> Artifacts</h5>
                
                <div class="property-group">
                    <label>Artifact Paths</label>
                    <textarea name="artifact_paths" 
                              placeholder="dist/**/*&#10;logs/*.log"
                              onchange="window.pipelineBuilder.updateStepProperty('${step.id}', 'artifact_paths', this.value)">${artifacts}</textarea>
                    <small>Glob patterns for files to upload as artifacts</small>
                </div>
            </div>
        `;
    }

    renderNotificationsSection(step) {
        return `
            <div class="property-section notifications-section">
                <h5><i class="fas fa-bell"></i> Notifications</h5>
                
                <div class="property-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="notify_on_failure">
                        Notify on failure
                    </label>
                </div>
                
                <div class="property-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="notify_on_success">
                        Notify on success
                    </label>
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
                        `<li><strong>${key}:</strong> ${Array.isArray(values) ? values.join(', ') : values}</li>`
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
                    <textarea name="plugin_config" 
                              placeholder='{"image": "node:18"}'
                              onchange="window.pipelineBuilder.updatePluginJSON('${selectedPlugin}', this.value)">${JSON.stringify(plugins[selectedPlugin] || {}, null, 2)}</textarea>
                </div>
            </div>
        `;
    }

    // ENHANCED HELPER METHODS
    calculateMatrixCombinations(setup) {
        return Object.values(setup).reduce((total, values) => {
            return total * (Array.isArray(values) ? values.length : 1);
        }, 1);
    }

    formatEnvironmentVariables(env) {
        if (!env || typeof env !== 'object') return '';
        return Object.entries(env).map(([key, value]) => `${key}=${value}`).join('\n');
    }

    formatAgentTargeting(agents) {
        if (!agents || typeof agents !== 'object') return '';
        return Object.entries(agents).map(([key, value]) => `${key}=${value}`).join('\n');
    }

    // ENHANCED UPDATE METHODS
    updateStepEnvironment(stepId, envString) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        const env = {};
        envString.split('\n').forEach(line => {
            const [key, ...valueParts] = line.trim().split('=');
            if (key && valueParts.length > 0) {
                env[key] = valueParts.join('=');
            }
        });

        step.properties.env = env;
        console.log('Updated environment variables for step:', stepId);
    }

    updateStepAgents(stepId, agentsString) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        const agents = {};
        agentsString.split('\n').forEach(line => {
            const [key, ...valueParts] = line.trim().split('=');
            if (key && valueParts.length > 0) {
                agents[key] = valueParts.join('=');
            }
        });

        step.properties.agents = agents;
        console.log('Updated agent targeting for step:', stepId);
    }

    updatePluginConfig(stepId, pluginName) {
        console.log('Updating plugin config for step:', stepId, 'plugin:', pluginName);
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            step.properties.selected_plugin = pluginName;
            if (!step.properties.plugins) {
                step.properties.plugins = {};
            }
            if (pluginName && !step.properties.plugins[pluginName]) {
                step.properties.plugins[pluginName] = {};
            }
            this.renderProperties();
        }
    }

    updatePluginJSON(pluginKey, jsonString) {
        if (!this.selectedStep) return;
        
        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step) return;

        try {
            const config = JSON.parse(jsonString);
            if (!step.properties.plugins) {
                step.properties.plugins = {};
            }
            step.properties.plugins[pluginKey] = config;
            console.log('Updated plugin configuration:', pluginKey);
        } catch (error) {
            console.error('Invalid JSON for plugin configuration:', error);
        }
    }

    updateRetryConfig(stepId, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        if (!step.properties.retry) {
            step.properties.retry = {};
        }
        step.properties.retry[property] = value;
        
        // Re-render properties to show/hide additional fields
        this.renderProperties();
        console.log('Updated retry configuration for step:', stepId);
    }

    updateRetryExitCodes(stepId, codesString) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        const codes = codesString.split(',').map(code => parseInt(code.trim())).filter(code => !isNaN(code));
        if (!step.properties.retry) {
            step.properties.retry = {};
        }
        step.properties.retry.automatic_on = codes;
        console.log('Updated retry exit codes for step:', stepId, codes);
    }

    updateTriggerBuild(stepId, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;

        if (!step.properties.build) {
            step.properties.build = {};
        }
        step.properties.build[property] = value;
        console.log('Updated trigger build property for step:', stepId);
    }

    // ENHANCED EVENT LISTENERS
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

        console.log('✅ Enhanced event listeners configured');
    }

    // PLUGIN BUILDER METHODS
    openPluginBuilder(stepId) {
        console.log('Opening plugin builder for step:', stepId);
        // This could open a dedicated plugin configuration modal
        // For now, direct users to the plugin catalog
        this.showPluginCatalog();
    }

    showStepTemplates() {
        console.log('Showing step templates');
        // TODO: Implement step templates modal
        alert('Step templates modal coming soon!');
    }

    // METHOD VALIDATION
    ensureMethodsAvailable() {
        // Ensure all required methods are available
        const requiredMethods = ['showPluginCatalog', 'showMatrixTemplates', 'openMatrixBuilder'];
        
        requiredMethods.forEach(methodName => {
            if (typeof this[methodName] !== 'function') {
                console.warn(`⚠️ Method ${methodName} not available on Enhanced Pipeline Builder`);
            }
        });
    }
}

/**
 * Enhanced YAML Generator with support for advanced Buildkite features
 */
class EnhancedYAMLGenerator {
    constructor() {
        this.indent = '  ';
    }

    generate(steps) {
        let yaml = '# Buildkite Pipeline Configuration\n';
        yaml += '# Generated by Enhanced Pipeline Builder\n\n';
        
        yaml += 'steps:\n';
        
        steps.forEach(step => {
            yaml += this.generateStep(step);
        });
        
        return yaml;
    }

    generateStep(step) {
        let yaml = `${this.indent}- `;
        
        switch (step.type) {
            case 'command':
                yaml += this.generateCommandStep(step);
                break;
            case 'wait':
                yaml += this.generateWaitStep(step);
                break;
            case 'block':
                yaml += this.generateBlockStep(step);
                break;
            case 'input':
                yaml += this.generateInputStep(step);
                break;
            case 'trigger':
                yaml += this.generateTriggerStep(step);
                break;
            case 'group':
                yaml += this.generateGroupStep(step);
                break;
            default:
                yaml += this.generateCommandStep(step);
        }
        
        return yaml + '\n';
    }

    generateCommandStep(step) {
        const props = step.properties;
        let yaml = `label: "${props.label || step.label}"\n`;
        yaml += `${this.indent}${this.indent}command: "${props.command || 'echo "Hello World"'}"\n`;
        
        // Add enhanced properties
        yaml += this.generateEnhancedProperties(props);
        
        return yaml;
    }

    generateWaitStep(step) {
        const props = step.properties;
        let yaml = 'wait: ~\n';
        
        if (props.continue_on_failure) {
            yaml += `${this.indent}${this.indent}continue_on_failure: true\n`;
        }
        
        return yaml;
    }

    generateBlockStep(step) {
        const props = step.properties;
        let yaml = `block: "${props.block || step.label}"\n`;
        
        if (props.prompt) {
            yaml += `${this.indent}${this.indent}prompt: "${props.prompt}"\n`;
        }
        
        if (props.fields && props.fields.length > 0) {
            yaml += `${this.indent}${this.indent}fields:\n`;
            props.fields.forEach(field => {
                yaml += `${this.indent}${this.indent}${this.indent}- text: "${field.text}"\n`;
                if (field.key) {
                    yaml += `${this.indent}${this.indent}${this.indent}${this.indent}key: "${field.key}"\n`;
                }
            });
        }
        
        return yaml;
    }

    generateInputStep(step) {
        // Similar to block step for input steps
        return this.generateBlockStep(step);
    }

    generateTriggerStep(step) {
        const props = step.properties;
        let yaml = `trigger: "${props.trigger}"\n`;
        yaml += `${this.indent}${this.indent}label: "${props.label || step.label}"\n`;
        
        if (props.build) {
            yaml += `${this.indent}${this.indent}build:\n`;
            Object.entries(props.build).forEach(([key, value]) => {
                if (value) {
                    yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
                }
            });
        }
        
        return yaml;
    }

    generateGroupStep(step) {
        const props = step.properties;
        let yaml = `group: "${props.group || step.label}"\n`;
        
        if (props.steps && props.steps.length > 0) {
            yaml += `${this.indent}${this.indent}steps:\n`;
            props.steps.forEach(groupStep => {
                const stepYaml = this.generateStep(groupStep);
                yaml += stepYaml.split('\n').map(line => `${this.indent}${line}`).join('\n') + '\n';
            });
        }
        
        return yaml;
    }

    generateEnhancedProperties(props) {
        let yaml = '';
        
        // Working directory
        if (props.workdir) {
            yaml += `${this.indent}${this.indent}workdir: "${props.workdir}"\n`;
        }
        
        // Timeout
        if (props.timeout_in_minutes && props.timeout_in_minutes !== 60) {
            yaml += `${this.indent}${this.indent}timeout_in_minutes: ${props.timeout_in_minutes}\n`;
        }
        
        // Environment variables
        if (props.env && Object.keys(props.env).length > 0) {
            yaml += `${this.indent}${this.indent}env:\n`;
            Object.entries(props.env).forEach(([key, value]) => {
                yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
            });
        }
        
        // Agent targeting
        if (props.agents && Object.keys(props.agents).length > 0) {
            yaml += `${this.indent}${this.indent}agents:\n`;
            Object.entries(props.agents).forEach(([key, value]) => {
                yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
            });
        }
        
        // Retry configuration
        if (props.retry && (props.retry.automatic || props.retry.manual)) {
            yaml += `${this.indent}${this.indent}retry:\n`;
            if (props.retry.automatic) {
                yaml += `${this.indent}${this.indent}${this.indent}automatic: true\n`;
                if (props.retry.automatic_on && props.retry.automatic_on.length > 0) {
                    yaml += `${this.indent}${this.indent}${this.indent}automatic_on:\n`;
                    props.retry.automatic_on.forEach(code => {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}- exit_status: ${code}\n`;
                    });
                }
                if (props.retry.limit) {
                    yaml += `${this.indent}${this.indent}${this.indent}limit: ${props.retry.limit}\n`;
                }
            }
        }
        
        // Artifact paths
        if (props.artifact_paths) {
            const paths = props.artifact_paths.split('\n').filter(path => path.trim());
            if (paths.length > 0) {
                yaml += `${this.indent}${this.indent}artifact_paths:\n`;
                paths.forEach(path => {
                    yaml += `${this.indent}${this.indent}${this.indent}- "${path.trim()}"\n`;
                });
            }
        }
        
        // Plugins
        if (props.plugins && Object.keys(props.plugins).length > 0) {
            yaml += `${this.indent}${this.indent}plugins:\n`;
            Object.entries(props.plugins).forEach(([plugin, config]) => {
                yaml += `${this.indent}${this.indent}${this.indent}- ${plugin}#v1.0.0:\n`;
                if (config && typeof config === 'object') {
                    Object.entries(config).forEach(([key, value]) => {
                        const yamlValue = typeof value === 'string' ? `"${value}"` : value;
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${key}: ${yamlValue}\n`;
                    });
                }
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

// Export enhanced classes to global scope
window.EnhancedPipelineBuilder = EnhancedPipelineBuilder;
window.EnhancedYAMLGenerator = EnhancedYAMLGenerator;

console.log('✅ Enhanced Pipeline Builder classes loaded');