// js/enhanced-pipeline-builder.js
// Complete Enhanced Pipeline Builder with all advanced features
/**
 * Enhanced Pipeline Builder - Extends base with matrix builds, advanced configs, validation
 */

class EnhancedPipelineBuilder extends PipelineBuilder {
    constructor() {
        super();
        
        // Additional enhanced features
        this.commandPalette = null;
        this.matrixBuilder = null;
        this.dependencyGraph = null;
        this.hasEnhancedFeatures = true;
        
        // Advanced step configurations
        this.advancedConfigs = {
            retry: {
                automatic: {
                    exit_status: '*',
                    limit: 3,
                    delay: 30
                },
                manual: {
                    allowed: true,
                    permit_on_passed: false,
                    reason: 'Retry failed step'
                }
            },
            parallelism: {
                count: 1,
                strategy: 'eager'
            },
            priority: {
                min: -100,
                max: 100,
                default: 0
            }
        };
        
        console.log('✅ Enhanced Pipeline Builder initialized with complete features');
    }

    // Override base property form generation with enhanced sections
    generatePropertyForm(step) {
        let formHtml = '';
        
        // Basic properties
        formHtml += this.generateBasicPropertySection(step);
        
        // Execution environment (for applicable step types)
        if (!['wait', 'annotation', 'notify'].includes(step.type)) {
            formHtml += this.generateExecutionEnvironmentSection(step);
        }
        
        // Conditional execution
        formHtml += this.generateConditionalSection(step);
        
        // Dependencies
        formHtml += this.generateDependencySection(step);
        
        // Retry configuration (for command and plugin steps)
        if (['command', 'plugin'].includes(step.type)) {
            formHtml += this.generateRetrySection(step);
        }
        
        // Artifacts (for command and plugin steps)
        if (['command', 'plugin'].includes(step.type)) {
            formHtml += this.generateArtifactsSection(step);
        }
        
        // Matrix configuration (for command steps)
        if (step.type === 'command') {
            formHtml += this.generateMatrixSection(step);
        }
        
        // Notifications (for all steps)
        formHtml += this.generateNotificationSection(step);
        
        // Advanced options
        formHtml += this.generateAdvancedSection(step);
        
        return formHtml;
    }

    generateBasicPropertySection(step) {
        let basicFields = '';
        
        switch (step.type) {
            case 'command':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Run Tests" />
                    </div>
                    <div class="property-group">
                        <label for="command">Command</label>
                        <textarea name="command" rows="4" placeholder="echo 'Hello, World!'">${step.properties.command || ''}</textarea>
                        <small>Shell command(s) to execute</small>
                    </div>
                    <div class="property-group">
                        <label for="key">Step Key</label>
                        <input type="text" name="key" value="${step.properties.key || ''}" placeholder="unique-step-key" />
                        <small>Unique identifier for dependencies</small>
                    </div>
                `;
                break;
            case 'wait':
                basicFields = `
                    <div class="property-checkbox">
                        <input type="checkbox" id="continue_on_failure" name="continue_on_failure" 
                               ${step.properties.continue_on_failure ? 'checked' : ''} />
                        <label for="continue_on_failure">Continue on failure</label>
                    </div>
                    <p class="property-help">Wait for all previous steps to complete before continuing</p>
                `;
                break;
            case 'block':
                basicFields = `
                    <div class="property-group">
                        <label for="prompt">Block Prompt</label>
                        <input type="text" name="prompt" value="${step.properties.prompt || ''}" placeholder="Continue deployment?" />
                    </div>
                    <div class="property-group">
                        <label for="blocked_state">Blocked State</label>
                        <select name="blocked_state">
                            <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                            <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                            <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                        </select>
                    </div>
                    ${this.generateBlockFieldsSection(step)}
                `;
                break;
            case 'input':
                basicFields = `
                    <div class="property-group">
                        <label for="prompt">Input Prompt</label>
                        <input type="text" name="prompt" value="${step.properties.prompt || ''}" placeholder="Please provide input" />
                    </div>
                    ${this.generateInputFieldsSection(step)}
                `;
                break;
            case 'trigger':
                basicFields = `
                    <div class="property-group">
                        <label for="trigger">Pipeline to Trigger</label>
                        <input type="text" name="trigger" value="${step.properties.trigger || ''}" placeholder="my-other-pipeline" />
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="async" name="async" ${step.properties.async ? 'checked' : ''} />
                        <label for="async">Asynchronous (don't wait for completion)</label>
                    </div>
                    ${this.generateTriggerOptionsSection(step)}
                `;
                break;
            case 'annotation':
                basicFields = `
                    <div class="property-group">
                        <label for="body">Annotation Body (Markdown)</label>
                        <textarea name="body" rows="6" placeholder="Build completed successfully! 🎉">${step.properties.body || ''}</textarea>
                        <small>Supports Markdown formatting</small>
                    </div>
                    <div class="property-group">
                        <label for="style">Style</label>
                        <select name="style">
                            <option value="info" ${step.properties.style === 'info' ? 'selected' : ''}>Info</option>
                            <option value="success" ${step.properties.style === 'success' ? 'selected' : ''}>Success</option>
                            <option value="warning" ${step.properties.style === 'warning' ? 'selected' : ''}>Warning</option>
                            <option value="error" ${step.properties.style === 'error' ? 'selected' : ''}>Error</option>
                        </select>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="append" name="append" ${step.properties.append ? 'checked' : ''} />
                        <label for="append">Append to existing annotations</label>
                    </div>
                `;
                break;
            case 'notify':
                basicFields = `
                    <div class="property-group">
                        <label for="email">Email</label>
                        <input type="text" name="email" value="${step.properties.email || ''}" placeholder="team@example.com" />
                    </div>
                    <div class="property-group">
                        <label for="slack">Slack Channel/User</label>
                        <input type="text" name="slack" value="${step.properties.slack || ''}" placeholder="#channel or @user" />
                    </div>
                    <div class="property-group">
                        <label for="webhook">Webhook URL</label>
                        <input type="text" name="webhook" value="${step.properties.webhook || ''}" placeholder="https://..." />
                    </div>
                    <div class="property-group">
                        <label for="pagerduty">PagerDuty Service Key</label>
                        <input type="text" name="pagerduty" value="${step.properties.pagerduty || ''}" placeholder="Service key" />
                    </div>
                `;
                break;
            case 'plugin':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Build Docker Image" />
                    </div>
                    ${this.generatePluginSelector(step)}
                `;
                break;
            case 'pipeline-upload':
                basicFields = `
                    <div class="property-group">
                        <label for="pipeline">Pipeline File</label>
                        <input type="text" name="pipeline" value="${step.properties.pipeline || ''}" placeholder=".buildkite/pipeline.yml" />
                        <small>Path to pipeline YAML file</small>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="replace" name="replace" ${step.properties.replace ? 'checked' : ''} />
                        <label for="replace">Replace existing pipeline</label>
                    </div>
                `;
                break;
            case 'group':
                basicFields = `
                    <div class="property-group">
                        <label for="group">Group Name</label>
                        <input type="text" name="group" value="${step.properties.group || ''}" placeholder="e.g., Test Suite" />
                    </div>
                    <p class="property-help">Group steps can be configured after creation</p>
                `;
                break;
        }
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-info-circle"></i> Basic Properties</h4>
                ${basicFields}
            </div>
        `;
    }

    generateExecutionEnvironmentSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-server"></i> Execution Environment</h4>
                
                ${step.type !== 'notify' ? `
                    <div class="property-group">
                        <label>Agent Requirements</label>
                        <div class="agent-tags">
                            ${this.generateAgentTags(props.agents || {})}
                        </div>
                        <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.addAgentTag('${step.id}')">
                            <i class="fas fa-plus"></i> Add Tag
                        </button>
                    </div>
                ` : ''}
                
                ${!['block', 'input', 'trigger', 'notify'].includes(step.type) ? `
                    <div class="property-group">
                        <label>Environment Variables</label>
                        <div class="env-vars">
                            ${this.generateEnvVars(props.env || {})}
                        </div>
                        <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.addEnvVar('${step.id}')">
                            <i class="fas fa-plus"></i> Add Variable
                        </button>
                    </div>
                ` : ''}
                
                ${step.type === 'command' ? `
                    <div class="property-group">
                        <label for="priority">Priority</label>
                        <input type="number" name="priority" value="${props.priority || 0}" 
                               min="-100" max="100" placeholder="0" />
                        <small>Higher priority steps run first (-100 to 100)</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateConditionalSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">If Condition</label>
                    <input type="text" name="if" value="${props.if || ''}" 
                           placeholder="build.branch == 'main'" />
                    <small>Only run if this condition is true</small>
                </div>
                
                <div class="property-group">
                    <label for="unless">Unless Condition</label>
                    <input type="text" name="unless" value="${props.unless || ''}" 
                           placeholder="build.pull_request.draft == true" />
                    <small>Skip if this condition is true</small>
                </div>
                
                <div class="property-group">
                    <label for="branches">Branch Filter</label>
                    <input type="text" name="branches" value="${props.branches || ''}" 
                           placeholder="main develop feature/*" />
                    <small>Space-separated branch patterns</small>
                </div>
                
                ${step.type === 'command' ? `
                    <div class="property-checkbox">
                        <input type="checkbox" id="skip" name="skip" ${props.skip ? 'checked' : ''} />
                        <label for="skip">Skip this step by default</label>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateDependencySection(step) {
        const props = step.properties;
        const deps = Array.isArray(props.depends_on) ? props.depends_on : 
                    (props.depends_on ? [props.depends_on] : []);
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-sitemap"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label>Step Dependencies</label>
                    <div class="dependencies-list">
                        ${deps.length > 0 ? deps.map(dep => `
                            <div class="dependency-item">
                                <span>${dep}</span>
                                <button class="remove-btn" onclick="pipelineBuilder.removeDependency('${step.id}', '${dep}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('') : '<div class="empty-list">No dependencies</div>'}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.addDependency('${step.id}')">
                        <i class="fas fa-plus"></i> Add Dependency
                    </button>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="allow_dependency_failure" name="allow_dependency_failure" 
                           ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow dependency failure</label>
                </div>
            </div>
        `;
    }

    generateRetrySection(step) {
        const props = step.properties;
        const hasRetry = props.retry && props.retry.automatic;
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-redo"></i> Retry Configuration</h4>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="enable_retry" ${hasRetry ? 'checked' : ''} 
                           onchange="pipelineBuilder.toggleRetry('${step.id}', this.checked)" />
                    <label for="enable_retry">Enable automatic retry</label>
                </div>
                
                ${hasRetry ? `
                    <div class="retry-config">
                        <div class="property-group">
                            <label for="retry_limit">Retry limit</label>
                            <input type="number" name="retry_limit" 
                                   value="${props.retry.automatic.limit || 3}" 
                                   min="1" max="10" />
                        </div>
                        
                        <div class="property-group">
                            <label for="retry_exit_status">Exit status</label>
                            <input type="text" name="retry_exit_status" 
                                   value="${props.retry.automatic.exit_status || '*'}" 
                                   placeholder="* or specific codes" />
                        </div>
                        
                        <div class="property-group">
                            <label for="retry_delay">Delay (seconds)</label>
                            <input type="number" name="retry_delay" 
                                   value="${props.retry.automatic.delay || 0}" 
                                   min="0" placeholder="0" />
                        </div>
                    </div>
                ` : ''}
                
                <div class="property-checkbox">
                    <input type="checkbox" id="manual_retry" name="manual_retry" 
                           ${props.retry && props.retry.manual ? 'checked' : ''} />
                    <label for="manual_retry">Allow manual retry</label>
                </div>
            </div>
        `;
    }

    generateArtifactsSection(step) {
        const props = step.properties;
        const artifacts = props.artifacts || [];
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-archive"></i> Artifacts</h4>
                
                <div class="property-group">
                    <label>Upload Artifacts</label>
                    <div class="artifacts-list">
                        ${artifacts.length > 0 ? artifacts.map((artifact, index) => `
                            <div class="artifact-item">
                                <input type="text" value="${artifact}" 
                                       onchange="pipelineBuilder.updateArtifact('${step.id}', ${index}, this.value)" />
                                <button class="remove-btn" onclick="pipelineBuilder.removeArtifact('${step.id}', ${index})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('') : '<div class="empty-list">No artifacts configured</div>'}
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.addArtifact('${step.id}')">
                        <i class="fas fa-plus"></i> Add Artifact Path
                    </button>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="compress_artifacts" name="compress_artifacts" 
                           ${props.compress_artifacts ? 'checked' : ''} />
                    <label for="compress_artifacts">Compress artifacts</label>
                </div>
            </div>
        `;
    }

    generateMatrixSection(step) {
        const props = step.properties;
        const matrix = props.matrix || {};
        const dimensions = Object.entries(matrix).map(([name, values]) => ({ name, values }));
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-th"></i> Matrix Configuration</h4>
                
                <div class="matrix-builder">
                    ${dimensions.length > 0 ? `
                        <div class="matrix-dimensions">
                            ${dimensions.map((dim, index) => this.generateMatrixDimension(step.id, dim, index)).join('')}
                        </div>
                        ${this.generateMatrixPreview(dimensions)}
                    ` : '<p class="property-help">No matrix dimensions configured</p>'}
                    
                    <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.addMatrixDimension('${step.id}')">
                        <i class="fas fa-plus"></i> Add Dimension
                    </button>
                </div>
            </div>
        `;
    }

    generateMatrixDimension(stepId, dimension, index) {
        return `
            <div class="matrix-dimension">
                <div class="dimension-header">
                    <input type="text" class="dimension-name" value="${dimension.name}" 
                           placeholder="Dimension name" 
                           onchange="pipelineBuilder.updateMatrixDimensionName('${stepId}', ${index}, this.value)" />
                    <button class="remove-btn" onclick="pipelineBuilder.removeMatrixDimension('${stepId}', ${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="dimension-values">
                    ${dimension.values.map((value, valueIndex) => `
                        <div class="dimension-value">
                            <input type="text" value="${value}" 
                                   onchange="pipelineBuilder.updateMatrixValue('${stepId}', ${index}, ${valueIndex}, this.value)" />
                            <button class="remove-btn" onclick="pipelineBuilder.removeMatrixValue('${stepId}', ${index}, ${valueIndex})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                    <button class="btn btn-secondary btn-small" 
                            onclick="pipelineBuilder.addMatrixValue('${stepId}', ${index})">
                        <i class="fas fa-plus"></i> Add Value
                    </button>
                </div>
            </div>
        `;
    }

    generateMatrixPreview(dimensions) {
        if (dimensions.length === 0) return '';
        
        const validDimensions = dimensions.filter(d => d.name && d.values.length > 0);
        if (validDimensions.length === 0) return '';
        
        const combinations = this.generateMatrixCombinations(validDimensions);
        
        return `
            <div class="matrix-preview">
                <h5>Matrix Preview</h5>
                <p class="matrix-stats">${validDimensions.length} dimension${validDimensions.length !== 1 ? 's' : ''} = ${combinations.length} job${combinations.length !== 1 ? 's' : ''}</p>
                <ul>
                    ${validDimensions.map(dim => `<li><strong>${dim.name}:</strong> ${dim.values.join(', ')}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    generateMatrixCombinations(dimensions) {
        if (dimensions.length === 0) return [];
        
        let combinations = dimensions[0].values.map(value => ({ [dimensions[0].name]: value }));
        
        for (let i = 1; i < dimensions.length; i++) {
            const newCombinations = [];
            combinations.forEach(combo => {
                dimensions[i].values.forEach(value => {
                    newCombinations.push({ ...combo, [dimensions[i].name]: value });
                });
            });
            combinations = newCombinations;
        }
        
        return combinations;
    }

    generateNotificationSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-bell"></i> Notifications</h4>
                
                <div class="property-group">
                    <label for="notify">Notification Configuration</label>
                    <select name="notify" onchange="pipelineBuilder.updateNotification('${step.id}', this.value)">
                        <option value="">No notifications</option>
                        <option value="email">Email</option>
                        <option value="slack">Slack</option>
                        <option value="webhook">Webhook</option>
                        <option value="pagerduty">PagerDuty</option>
                    </select>
                </div>
                
                ${props.notify ? this.generateNotificationConfig(step, props.notify) : ''}
            </div>
        `;
    }

    generateAdvancedSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-cog"></i> Advanced Options</h4>
                
                ${step.type === 'command' ? `
                    <div class="property-group">
                        <label for="timeout_in_minutes">Timeout (minutes)</label>
                        <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes || ''}" 
                               min="0" placeholder="No timeout" />
                        <small>Maximum execution time before step is terminated</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" id="soft_fail" name="soft_fail" 
                               ${props.soft_fail ? 'checked' : ''} />
                        <label for="soft_fail">Soft fail (allow pipeline to pass on failure)</label>
                    </div>
                    
                    <div class="property-group">
                        <label for="parallelism">Parallelism</label>
                        <input type="number" name="parallelism" value="${props.parallelism || ''}" 
                               min="1" placeholder="1" />
                        <small>Number of parallel jobs to run</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="concurrency">Concurrency Group</label>
                        <input type="text" name="concurrency" value="${props.concurrency || ''}" 
                               placeholder="deploy/production" />
                        <small>Limit concurrent builds per group</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="concurrency_limit">Concurrency Limit</label>
                        <input type="number" name="concurrency_limit" value="${props.concurrency_limit || ''}" 
                               min="1" placeholder="1" />
                    </div>
                ` : ''}
                
                ${step.type === 'wait' ? `
                    <div class="property-checkbox">
                        <input type="checkbox" id="continue_on_failure" name="continue_on_failure" 
                               ${props.continue_on_failure ? 'checked' : ''} />
                        <label for="continue_on_failure">Continue pipeline on failure</label>
                    </div>
                ` : ''}
                
                ${step.type === 'block' ? `
                    <div class="property-group">
                        <label for="branches">Branch restrictions</label>
                        <input type="text" name="branches" value="${props.branches || ''}" 
                               placeholder="main develop" />
                        <small>Only block on these branches</small>
                    </div>
                ` : ''}
                
                <div class="property-group">
                    <label for="notes">Internal Notes</label>
                    <textarea name="notes" rows="3" placeholder="Notes about this step...">${props.notes || ''}</textarea>
                    <small>These notes won't appear in the generated YAML</small>
                </div>
            </div>
        `;
    }

    // Helper methods for specific step types
    generateBlockFieldsSection(step) {
        const fields = step.properties.fields || [];
        
        return `
            <div class="property-group">
                <label>Block Fields</label>
                <div class="block-fields">
                    ${fields.length > 0 ? fields.map((field, index) => `
                        <div class="field-item">
                            <span>${field.key} (${field.type || 'text'})</span>
                            <button class="remove-btn" onclick="pipelineBuilder.removeField('${step.id}', ${index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('') : '<div class="empty-list">No fields configured</div>'}
                </div>
                <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.addField('${step.id}')">
                    <i class="fas fa-plus"></i> Add Field
                </button>
            </div>
        `;
    }

    generateInputFieldsSection(step) {
        const fields = step.properties.fields || [];
        
        return `
            <div class="property-group">
                <label>Input Fields</label>
                <div class="input-fields">
                    ${fields.length > 0 ? fields.map((field, index) => `
                        <div class="field-config">
                            <div class="field-header">
                                <input type="text" value="${field.key}" placeholder="Field key" 
                                       onchange="pipelineBuilder.updateFieldKey('${step.id}', ${index}, this.value)" />
                                <select onchange="pipelineBuilder.updateFieldType('${step.id}', ${index}, this.value)">
                                    <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                    <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                                    <option value="boolean" ${field.type === 'boolean' ? 'selected' : ''}>Boolean</option>
                                </select>
                                <button class="remove-btn" onclick="pipelineBuilder.removeField('${step.id}', ${index})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            ${field.type === 'select' ? this.generateSelectOptions(step.id, index, field) : ''}
                        </div>
                    `).join('') : '<div class="empty-list">No fields configured</div>'}
                </div>
                <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.addField('${step.id}')">
                    <i class="fas fa-plus"></i> Add Field
                </button>
            </div>
        `;
    }

    generateTriggerOptionsSection(step) {
        const build = step.properties.build || {};
        
        return `
            <div class="property-group">
                <label>Trigger Options</label>
                <div class="trigger-options">
                    <div class="property-group">
                        <label for="build_branch">Branch</label>
                        <input type="text" name="build_branch" value="${build.branch || ''}" 
                               placeholder="main" />
                    </div>
                    <div class="property-group">
                        <label for="build_commit">Commit</label>
                        <input type="text" name="build_commit" value="${build.commit || ''}" 
                               placeholder="HEAD" />
                    </div>
                    <div class="property-group">
                        <label for="build_message">Message</label>
                        <input type="text" name="build_message" value="${build.message || ''}" 
                               placeholder="Triggered from parent pipeline" />
                    </div>
                </div>
            </div>
        `;
    }

    generatePluginSelector(step) {
        const plugins = step.properties.plugins || {};
        
        return `
            <div class="property-group">
                <label>Configured Plugins</label>
                <div class="configured-plugins">
                    ${Object.keys(plugins).length > 0 ? Object.entries(plugins).map(([pluginKey, config]) => `
                        <div class="plugin-config">
                            <div class="plugin-header">
                                <span>${this.pluginCatalog[pluginKey]?.name || pluginKey}</span>
                                <button class="remove-btn" onclick="pipelineBuilder.removePlugin('${step.id}', '${pluginKey}')">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            ${this.generatePluginConfigForm(step.id, pluginKey, config)}
                        </div>
                    `).join('') : '<div class="empty-list">No plugins configured</div>'}
                </div>
                <button class="btn btn-secondary btn-small" onclick="pipelineBuilder.showPluginCatalog('${step.id}')">
                    <i class="fas fa-plus"></i> Add Plugin
                </button>
            </div>
        `;
    }

    generatePluginConfigForm(stepId, pluginKey, config) {
        const pluginDef = this.pluginCatalog[pluginKey];
        if (!pluginDef || !pluginDef.config) return '';
        
        return Object.entries(pluginDef.config).map(([key, schema]) => `
            <div class="plugin-field">
                <label>${key}${schema.required ? ' *' : ''}</label>
                <input type="text" value="${config[key] || ''}" 
                       placeholder="${schema.default || ''}"
                       onchange="pipelineBuilder.updatePluginConfig('${stepId}', '${pluginKey}', '${key}', this.value)" />
                ${schema.description ? `<small>${schema.description}</small>` : ''}
            </div>
        `).join('');
    }

    generateSelectOptions(stepId, fieldIndex, field) {
        const options = field.options || [];
        
        return `
            <div class="select-options">
                <label>Options</label>
                ${options.map((option, optionIndex) => `
                    <div class="option-item">
                        <input type="text" value="${option}" 
                               onchange="pipelineBuilder.updateSelectOption('${stepId}', ${fieldIndex}, ${optionIndex}, this.value)" />
                        <button class="remove-btn" onclick="pipelineBuilder.removeSelectOption('${stepId}', ${fieldIndex}, ${optionIndex})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
                <button class="btn btn-secondary btn-small" 
                        onclick="pipelineBuilder.addSelectOption('${stepId}', ${fieldIndex})">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            </div>
        `;
    }

    generateAgentTags(agents) {
        return Object.entries(agents).map(([key, value]) => `
            <div class="agent-tag">
                <span class="tag-key">${key}</span>
                <span class="tag-value">${value}</span>
                <button class="remove-btn" onclick="pipelineBuilder.removeAgentTag('${key}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') || '<div class="empty-list">No agent requirements</div>';
    }

    generateEnvVars(env) {
        return Object.entries(env).map(([key, value]) => `
            <div class="env-var">
                <span class="var-key">${key}</span>
                <span class="var-value">${value}</span>
                <button class="remove-btn" onclick="pipelineBuilder.removeEnvVar('${key}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('') || '<div class="empty-list">No environment variables</div>';
    }

    generateNotificationConfig(step, type) {
        switch (type) {
            case 'email':
                return `
                    <div class="notification-config">
                        <div class="property-group">
                            <label for="notify_email">Email address</label>
                            <input type="email" name="notify_email" value="${step.properties.notify_email || ''}" 
                                   placeholder="team@example.com" />
                        </div>
                    </div>
                `;
            case 'slack':
                return `
                    <div class="notification-config">
                        <div class="property-group">
                            <label for="notify_slack_channel">Slack channel</label>
                            <input type="text" name="notify_slack_channel" value="${step.properties.notify_slack_channel || ''}" 
                                   placeholder="#deployments" />
                        </div>
                    </div>
                `;
            case 'webhook':
                return `
                    <div class="notification-config">
                        <div class="property-group">
                            <label for="notify_webhook_url">Webhook URL</label>
                            <input type="url" name="notify_webhook_url" value="${step.properties.notify_webhook_url || ''}" 
                                   placeholder="https://example.com/webhook" />
                        </div>
                    </div>
                `;
            case 'pagerduty':
                return `
                    <div class="notification-config">
                        <div class="property-group">
                            <label for="notify_pagerduty_key">PagerDuty integration key</label>
                            <input type="text" name="notify_pagerduty_key" value="${step.properties.notify_pagerduty_key || ''}" 
                                   placeholder="Integration key" />
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    // Setup enhanced event listeners
    setupPropertyFormListeners(step) {
        super.setupPropertyFormListeners(step);
        
        const container = document.getElementById('properties-content');
        if (!container) return;
        
        // Collapsible sections
        container.querySelectorAll('.property-section h4').forEach(header => {
            header.addEventListener('click', () => {
                header.parentElement.classList.toggle('collapsed');
            });
        });
        
        // Form inputs
        container.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', (e) => {
                const name = e.target.name;
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                
                if (name) {
                    this.updateStepProperty(step.id, name, value);
                }
            });
        });
    }

    // Update step property
    updateStepProperty(stepId, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        // Handle nested properties
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
    }

    // Matrix builder methods
    addMatrixDimension(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const name = prompt('Dimension name (e.g., os, node_version):');
        if (!name) return;
        
        if (!step.properties.matrix) step.properties.matrix = {};
        step.properties.matrix[name] = [''];
        
        this.renderProperties();
    }

    updateMatrixDimensionName(stepId, index, newName) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix) return;
        
        const entries = Object.entries(step.properties.matrix);
        if (index >= entries.length) return;
        
        const [oldName, values] = entries[index];
        delete step.properties.matrix[oldName];
        step.properties.matrix[newName] = values;
        
        this.renderProperties();
    }

    removeMatrixDimension(stepId, index) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix) return;
        
        const keys = Object.keys(step.properties.matrix);
        if (index >= keys.length) return;
        
        delete step.properties.matrix[keys[index]];
        
        if (Object.keys(step.properties.matrix).length === 0) {
            delete step.properties.matrix;
        }
        
        this.renderProperties();
    }

    addMatrixValue(stepId, dimensionIndex) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix) return;
        
        const keys = Object.keys(step.properties.matrix);
        if (dimensionIndex >= keys.length) return;
        
        step.properties.matrix[keys[dimensionIndex]].push('');
        this.renderProperties();
    }

    updateMatrixValue(stepId, dimensionIndex, valueIndex, newValue) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix) return;
        
        const keys = Object.keys(step.properties.matrix);
        if (dimensionIndex >= keys.length) return;
        
        step.properties.matrix[keys[dimensionIndex]][valueIndex] = newValue;
    }

    removeMatrixValue(stepId, dimensionIndex, valueIndex) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix) return;
        
        const keys = Object.keys(step.properties.matrix);
        if (dimensionIndex >= keys.length) return;
        
        step.properties.matrix[keys[dimensionIndex]].splice(valueIndex, 1);
        this.renderProperties();
    }

    // Artifact methods
    addArtifact(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const path = prompt('Artifact path (e.g., dist/**, test-results/):');
        if (!path) return;
        
        if (!step.properties.artifacts) step.properties.artifacts = [];
        step.properties.artifacts.push(path);
        
        this.renderProperties();
    }

    updateArtifact(stepId, index, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.artifacts) return;
        
        step.properties.artifacts[index] = value;
    }

    removeArtifact(stepId, index) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.artifacts) return;
        
        step.properties.artifacts.splice(index, 1);
        
        if (step.properties.artifacts.length === 0) {
            delete step.properties.artifacts;
        }
        
        this.renderProperties();
    }

    // Field management for block/input steps
    addField(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const key = prompt('Field key:');
        if (!key) return;
        
        const type = prompt('Field type (text, select, boolean):', 'text');
        
        if (!step.properties.fields) step.properties.fields = [];
        
        const field = { key, type };
        if (type === 'select') {
            field.options = ['Option 1', 'Option 2'];
        }
        
        step.properties.fields.push(field);
        this.renderProperties();
    }

    updateFieldKey(stepId, index, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        step.properties.fields[index].key = value;
    }

    updateFieldType(stepId, index, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        step.properties.fields[index].type = value;
        
        if (value === 'select' && !step.properties.fields[index].options) {
            step.properties.fields[index].options = ['Option 1', 'Option 2'];
        }
        
        this.renderProperties();
    }

    removeField(stepId, index) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        step.properties.fields.splice(index, 1);
        
        if (step.properties.fields.length === 0) {
            delete step.properties.fields;
        }
        
        this.renderProperties();
    }

    addSelectOption(stepId, fieldIndex) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        const field = step.properties.fields[fieldIndex];
        if (!field || field.type !== 'select') return;
        
        if (!field.options) field.options = [];
        field.options.push(`Option ${field.options.length + 1}`);
        
        this.renderProperties();
    }

    updateSelectOption(stepId, fieldIndex, optionIndex, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        const field = step.properties.fields[fieldIndex];
        if (!field || !field.options) return;
        
        field.options[optionIndex] = value;
    }

    removeSelectOption(stepId, fieldIndex, optionIndex) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        const field = step.properties.fields[fieldIndex];
        if (!field || !field.options) return;
        
        field.options.splice(optionIndex, 1);
        this.renderProperties();
    }

    // Plugin management
    showPluginCatalog(stepId) {
        // This would open the plugin catalog modal
        // For now, we'll use a simple prompt
        const availablePlugins = Object.entries(this.pluginCatalog)
            .map(([key, plugin]) => `${key}: ${plugin.name}`)
            .join('\n');
        
        const pluginKey = prompt(`Available plugins:\n${availablePlugins}\n\nEnter plugin key:`);
        if (!pluginKey || !this.pluginCatalog[pluginKey]) return;
        
        this.addPluginToStep(stepId, pluginKey);
    }

    addPluginToStep(stepId, pluginKey) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        if (!step.properties.plugins) step.properties.plugins = {};
        
        const plugin = this.pluginCatalog[pluginKey];
        step.properties.plugins[pluginKey] = {};
        
        // Set default values
        if (plugin.config) {
            Object.entries(plugin.config).forEach(([key, schema]) => {
                step.properties.plugins[pluginKey][key] = schema.default || '';
            });
        }
        
        this.renderProperties();
        this.renderPipeline();
    }

    removePlugin(stepId, pluginKey) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.plugins) return;
        
        delete step.properties.plugins[pluginKey];
        
        if (Object.keys(step.properties.plugins).length === 0) {
            delete step.properties.plugins;
        }
        
        this.renderProperties();
        this.renderPipeline();
    }

    updatePluginConfig(stepId, pluginKey, configKey, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.plugins || !step.properties.plugins[pluginKey]) return;
        
        step.properties.plugins[pluginKey][configKey] = value;
    }

    // Agent and environment variable management
    addAgentTag(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const key = prompt('Agent tag key (e.g., queue, docker):');
        if (!key) return;
        
        const value = prompt('Agent tag value:');
        if (!value) return;
        
        if (!step.properties.agents) step.properties.agents = {};
        step.properties.agents[key] = value;
        
        this.renderProperties();
    }

    removeAgentTag(key) {
        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step || !step.properties.agents) return;
        
        delete step.properties.agents[key];
        
        if (Object.keys(step.properties.agents).length === 0) {
            delete step.properties.agents;
        }
        
        this.renderProperties();
    }

    addEnvVar(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const key = prompt('Environment variable name:');
        if (!key) return;
        
        const value = prompt('Environment variable value:');
        if (value === null) return;
        
        if (!step.properties.env) step.properties.env = {};
        step.properties.env[key] = value;
        
        this.renderProperties();
    }

    removeEnvVar(key) {
        const step = this.steps.find(s => s.id === this.selectedStep);
        if (!step || !step.properties.env) return;
        
        delete step.properties.env[key];
        
        if (Object.keys(step.properties.env).length === 0) {
            delete step.properties.env;
        }
        
        this.renderProperties();
    }

    // Dependency management
    addDependency(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        const availableSteps = this.steps
            .filter(s => s.id !== stepId && s.properties.key)
            .map(s => `${s.properties.key}: ${s.properties.label || s.type}`);
        
        if (availableSteps.length === 0) {
            alert('No other steps with keys available for dependencies. Add a key to other steps first.');
            return;
        }
        
        const dependency = prompt(`Available steps:\n${availableSteps.join('\n')}\n\nEnter step key:`);
        if (!dependency) return;
        
        if (!step.properties.depends_on) {
            step.properties.depends_on = [];
        } else if (!Array.isArray(step.properties.depends_on)) {
            step.properties.depends_on = [step.properties.depends_on];
        }
        
        if (!step.properties.depends_on.includes(dependency)) {
            step.properties.depends_on.push(dependency);
            this.renderProperties();
            this.renderPipeline();
        }
    }

    removeDependency(stepId, dependency) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.depends_on) return;
        
        if (Array.isArray(step.properties.depends_on)) {
            const index = step.properties.depends_on.indexOf(dependency);
            if (index > -1) {
                step.properties.depends_on.splice(index, 1);
                if (step.properties.depends_on.length === 0) {
                    delete step.properties.depends_on;
                }
            }
        } else if (step.properties.depends_on === dependency) {
            delete step.properties.depends_on;
        }
        
        this.renderProperties();
        this.renderPipeline();
    }

    // Retry configuration
    toggleRetry(stepId, enabled) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        if (enabled) {
            step.properties.retry = {
                automatic: {
                    exit_status: '*',
                    limit: 3
                }
            };
        } else {
            delete step.properties.retry;
        }
        
        this.renderProperties();
    }

    // Notification management
    updateNotification(stepId, type) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        step.properties.notify = type || null;
        this.renderProperties();
    }

    // Override getPipelineConfig to handle new step types
    getPipelineConfig() {
        const config = super.getPipelineConfig();
        
        // Additional processing for enhanced features
        config.steps = config.steps.map(step => {
            // Handle matrix configuration
            if (step.matrix) {
                // Clean up empty matrix values
                Object.keys(step.matrix).forEach(key => {
                    step.matrix[key] = step.matrix[key].filter(v => v);
                    if (step.matrix[key].length === 0) {
                        delete step.matrix[key];
                    }
                });
                
                if (Object.keys(step.matrix).length === 0) {
                    delete step.matrix;
                }
            }
            
            // Handle artifacts
            if (step.artifacts && step.artifacts.length > 0) {
                step.artifact_paths = step.artifacts;
                delete step.artifacts;
            }
            
            // Clean up internal properties
            delete step.notes;
            delete step.notify;
            
            return step;
        });
        
        return config;
    }
}

// Command Palette functionality
class CommandPalette {
    constructor(pipelineBuilder) {
        this.pipelineBuilder = pipelineBuilder;
        this.isOpen = false;
        this.commands = this.getCommands();
        
        this.setupKeyboardShortcut();
    }
    
    getCommands() {
        return [
            { name: 'Add Command Step', action: () => this.pipelineBuilder.addStep('command'), shortcut: 'Ctrl+1' },
            { name: 'Add Wait Step', action: () => this.pipelineBuilder.addStep('wait'), shortcut: 'Ctrl+2' },
            { name: 'Add Block Step', action: () => this.pipelineBuilder.addStep('block'), shortcut: 'Ctrl+3' },
            { name: 'Add Input Step', action: () => this.pipelineBuilder.addStep('input'), shortcut: 'Ctrl+4' },
            { name: 'Add Trigger Step', action: () => this.pipelineBuilder.addStep('trigger'), shortcut: 'Ctrl+5' },
            { name: 'Add Group Step', action: () => this.pipelineBuilder.addStep('group'), shortcut: 'Ctrl+6' },
            { name: 'Add Annotation Step', action: () => this.pipelineBuilder.addStep('annotation'), shortcut: 'Ctrl+7' },
            { name: 'Add Notify Step', action: () => this.pipelineBuilder.addStep('notify'), shortcut: 'Ctrl+8' },
            { name: 'Add Plugin Step', action: () => this.pipelineBuilder.addStep('plugin'), shortcut: 'Ctrl+9' },
            { name: 'Add Pipeline Upload Step', action: () => this.pipelineBuilder.addStep('pipeline-upload'), shortcut: 'Ctrl+0' },
            { name: 'Export YAML', action: () => document.getElementById('export-yaml').click(), shortcut: 'Ctrl+E' },
            { name: 'Clear Pipeline', action: () => this.pipelineBuilder.clearPipeline(), shortcut: 'Ctrl+Shift+C' },
            { name: 'Load Example', action: () => this.pipelineBuilder.loadExample(), shortcut: 'Ctrl+L' },
            { name: 'Toggle YAML Preview', action: () => document.getElementById('toggle-yaml').click(), shortcut: 'Ctrl+Y' },
            { name: 'Show Plugin Catalog', action: () => document.querySelector('[data-action="plugin-catalog"]').click() },
            { name: 'Show Matrix Builder', action: () => document.querySelector('[data-action="matrix-builder"]').click() },
            { name: 'Show Step Templates', action: () => document.querySelector('[data-action="step-templates"]').click() },
            { name: 'Show Pattern Library', action: () => document.querySelector('[data-action="pattern-library"]').click() },
            { name: 'Duplicate Selected Step', action: () => this.duplicateSelected(), shortcut: 'Ctrl+D' },
            { name: 'Delete Selected Step', action: () => this.deleteSelected(), shortcut: 'Delete' }
        ];
    }
    
    setupKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to open command palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            
            // ESC to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        const palette = document.getElementById('command-palette');
        const input = document.getElementById('command-input');
        
        palette.style.display = 'block';
        input.value = '';
        input.focus();
        
        this.isOpen = true;
        this.renderCommands();
        
        // Setup event listeners
        input.addEventListener('input', () => this.filterCommands());
        input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    close() {
        const palette = document.getElementById('command-palette');
        palette.style.display = 'none';
        this.isOpen = false;
    }
    
    renderCommands(filter = '') {
        const container = document.getElementById('command-results');
        const filtered = this.commands.filter(cmd => 
            cmd.name.toLowerCase().includes(filter.toLowerCase())
        );
        
        container.innerHTML = filtered.map((cmd, index) => `
            <div class="command-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
                <span class="command-name">${cmd.name}</span>
                ${cmd.shortcut ? `<span class="command-shortcut">${cmd.shortcut}</span>` : ''}
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.command-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.executeCommand(filtered[index]);
            });
        });
    }
    
    filterCommands() {
        const input = document.getElementById('command-input');
        this.renderCommands(input.value);
    }
    
    handleKeyDown(e) {
        const items = document.querySelectorAll('.command-item');
        const selected = document.querySelector('.command-item.selected');
        const currentIndex = selected ? parseInt(selected.dataset.index) : 0;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentIndex < items.length - 1) {
                    items[currentIndex].classList.remove('selected');
                    items[currentIndex + 1].classList.add('selected');
                    items[currentIndex + 1].scrollIntoView({ block: 'nearest' });
                }
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (currentIndex > 0) {
                    items[currentIndex].classList.remove('selected');
                    items[currentIndex - 1].classList.add('selected');
                    items[currentIndex - 1].scrollIntoView({ block: 'nearest' });
                }
                break;
                
            case 'Enter':
                e.preventDefault();
                const input = document.getElementById('command-input');
                const filter = input.value;
                const filtered = this.commands.filter(cmd => 
                    cmd.name.toLowerCase().includes(filter.toLowerCase())
                );
                
                if (filtered[currentIndex]) {
                    this.executeCommand(filtered[currentIndex]);
                }
                break;
        }
    }
    
    executeCommand(command) {
        this.close();
        command.action();
    }
    
    duplicateSelected() {
        if (this.pipelineBuilder.selectedStep) {
            this.pipelineBuilder.duplicateStep(this.pipelineBuilder.selectedStep);
        }
    }
    
    deleteSelected() {
        if (this.pipelineBuilder.selectedStep) {
            this.pipelineBuilder.deleteStep(this.pipelineBuilder.selectedStep);
        }
    }
}

// Initialize enhanced features when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // The base class will initialize, but we add command palette
    if (window.pipelineBuilder && window.pipelineBuilder.hasEnhancedFeatures) {
        window.pipelineBuilder.commandPalette = new CommandPalette(window.pipelineBuilder);
        console.log('✅ Command Palette initialized');
    }
});