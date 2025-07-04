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
        if (!['wait', 'annotation'].includes(step.type)) {
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
                        <small>Allow pipeline to continue even if previous steps failed</small>
                    </div>
                `;
                break;
            case 'block':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Block Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Deploy to Production" />
                    </div>
                    <div class="property-group">
                        <label for="prompt">Prompt Message</label>
                        <input type="text" name="prompt" value="${step.properties.prompt || ''}" placeholder="Deploy to production?" />
                        <small>Question shown to users</small>
                    </div>
                    <div class="property-group">
                        <label for="blocked_state">Blocked State</label>
                        <select name="blocked_state">
                            <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed (green)</option>
                            <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed (red)</option>
                            <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running (yellow)</option>
                        </select>
                    </div>
                    ${this.generateFieldBuilder(step)}
                `;
                break;
            case 'input':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Input Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Release Version" />
                    </div>
                    <div class="property-group">
                        <label for="prompt">Input Prompt</label>
                        <textarea name="prompt" rows="2" placeholder="Please enter the release version">${step.properties.prompt || ''}</textarea>
                    </div>
                    ${this.generateFieldBuilder(step)}
                `;
                break;
            case 'trigger':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Trigger Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Deploy Pipeline" />
                    </div>
                    <div class="property-group">
                        <label for="trigger">Pipeline to Trigger</label>
                        <input type="text" name="trigger" value="${step.properties.trigger || ''}" placeholder="my-deploy-pipeline" />
                        <small>Pipeline slug to trigger</small>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="async" name="async" ${step.properties.async ? 'checked' : ''} />
                        <label for="async">Asynchronous trigger</label>
                        <small>Don't wait for triggered pipeline to complete</small>
                    </div>
                    ${this.generateTriggerBuildSection(step)}
                `;
                break;
            case 'annotation':
                basicFields = `
                    <div class="property-group">
                        <label for="body">Annotation Body</label>
                        <textarea name="body" rows="6" placeholder="## Build Results&#10;✅ All tests passed!">${step.properties.body || ''}</textarea>
                        <small>Markdown supported</small>
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
            case 'plugin':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Step Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Build Docker Image" />
                    </div>
                    ${this.generatePluginSelector(step)}
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
            case 'pipeline-upload':
                basicFields = `
                    <div class="property-group">
                        <label for="pipeline">Pipeline File</label>
                        <input type="text" name="pipeline" value="${step.properties.pipeline || ''}" placeholder=".buildkite/pipeline.yml" />
                        <small>Path to pipeline YAML file</small>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="replace" name="replace" ${step.properties.replace ? 'checked' : ''} />
                        <label for="replace">Replace current pipeline</label>
                        <small>Replace the entire pipeline with the uploaded file</small>
                    </div>
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
            <div class="property-section">
                <h4><i class="fas fa-server"></i> Execution Environment</h4>
                
                <div class="property-subsection">
                    <h5>Agent Targeting</h5>
                    <div class="agent-builder">
                        ${this.generateAgentBuilder(props.agents || {})}
                    </div>
                </div>
                
                <div class="property-subsection">
                    <h5>Environment Variables</h5>
                    <div class="env-builder">
                        ${this.generateEnvBuilder(props.env || {})}
                    </div>
                </div>
                
                ${step.type === 'command' ? `
                    <div class="property-group">
                        <label for="parallelism">Parallelism</label>
                        <input type="number" name="parallelism" value="${props.parallelism || 1}" 
                               min="1" max="100" placeholder="1" />
                        <small>Number of parallel jobs to run</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateConditionalSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                
                <div class="property-group">
                    <label for="if">If Expression</label>
                    <input type="text" name="if" value="${props.if || ''}" 
                           placeholder="build.branch == 'main' && build.tag != null" />
                    <small>JavaScript expression that must evaluate to true</small>
                </div>
                
                <div class="property-group">
                    <label for="unless">Unless Expression</label>
                    <input type="text" name="unless" value="${props.unless || ''}" 
                           placeholder="build.pull_request.id != null" />
                    <small>Skip if this expression evaluates to true</small>
                </div>
                
                <div class="property-group">
                    <label for="branches">Branch Pattern</label>
                    <input type="text" name="branches" value="${props.branches || ''}" 
                           placeholder="main develop feature/* !hotfix/*" />
                    <small>Branch patterns (space-separated, ! for exclusion)</small>
                </div>
            </div>
        `;
    }

    generateDependencySection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-project-diagram"></i> Dependencies</h4>
                
                <div class="dependency-builder">
                    ${this.generateDependencyBuilder(props.depends_on || [])}
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="allow_dependency_failure" name="allow_dependency_failure" 
                           ${props.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow dependency failure</label>
                    <small>Run even if dependencies fail</small>
                </div>
            </div>
        `;
    }

    generateRetrySection(step) {
        const retry = step.properties.retry || {};
        const automatic = retry.automatic || {};
        const manual = retry.manual || {};
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-redo"></i> Retry Configuration</h4>
                
                <div class="property-subsection">
                    <h5>Automatic Retry</h5>
                    <div class="property-checkbox">
                        <input type="checkbox" id="retry_automatic" 
                               ${automatic !== false ? 'checked' : ''}
                               onchange="pipelineBuilder.toggleRetryAutomatic('${step.id}')" />
                        <label for="retry_automatic">Enable automatic retry</label>
                    </div>
                    
                    ${automatic !== false ? `
                        <div class="property-group">
                            <label for="retry_limit">Retry Limit</label>
                            <input type="number" name="retry_limit" value="${automatic.limit || 3}" 
                                   min="0" max="10" 
                                   onchange="pipelineBuilder.updateRetryLimit('${step.id}', this.value)" />
                        </div>
                        
                        <div class="property-group">
                            <label for="retry_exit_status">Exit Status Pattern</label>
                            <input type="text" name="retry_exit_status" value="${automatic.exit_status || '*'}" 
                                   placeholder="* or 1,2,128"
                                   onchange="pipelineBuilder.updateRetryExitStatus('${step.id}', this.value)" />
                            <small>Exit codes to retry (* for all)</small>
                        </div>
                    ` : ''}
                </div>
                
                <div class="property-subsection">
                    <h5>Manual Retry</h5>
                    <div class="property-checkbox">
                        <input type="checkbox" id="retry_manual_allowed" 
                               ${manual.allowed ? 'checked' : ''}
                               onchange="pipelineBuilder.toggleRetryManual('${step.id}')" />
                        <label for="retry_manual_allowed">Allow manual retry</label>
                    </div>
                </div>
            </div>
        `;
    }

    generateArtifactsSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-archive"></i> Artifacts</h4>
                
                <div class="property-group">
                    <label for="artifact_paths">Upload Paths</label>
                    <textarea name="artifact_paths" rows="3" 
                              placeholder="build/logs/**/*&#10;coverage/**/*.html&#10;test-results/**/*.xml">${props.artifact_paths || ''}</textarea>
                    <small>File patterns to upload (one per line)</small>
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
        const matrix = step.properties.matrix || [];
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-th"></i> Matrix Configuration</h4>
                
                <div class="matrix-builder">
                    <div class="matrix-dimensions" id="matrix-${step.id}">
                        ${matrix.map((dimension, index) => this.generateMatrixDimension(step.id, dimension, index)).join('')}
                    </div>
                    
                    <div class="matrix-buttons">
                        <button type="button" class="btn btn-small btn-secondary" 
                                onclick="pipelineBuilder.addMatrixDimension('${step.id}')">
                            <i class="fas fa-plus"></i> Add Dimension
                        </button>
                        <button type="button" class="btn btn-small btn-secondary" 
                                onclick="pipelineBuilder.previewMatrix('${step.id}')">
                            <i class="fas fa-eye"></i> Preview Matrix
                        </button>
                    </div>
                    
                    ${this.generateMatrixPreview(step)}
                </div>
            </div>
        `;
    }

    generateMatrixDimension(stepId, dimension, index) {
        return `
            <div class="matrix-dimension">
                <div class="dimension-header">
                    <input type="text" value="${dimension.name || ''}" 
                           placeholder="Variable name (e.g., OS)" 
                           onchange="pipelineBuilder.updateMatrixDimension('${stepId}', ${index}, 'name', this.value)" />
                    <button type="button" class="btn btn-small btn-danger" 
                            onclick="pipelineBuilder.removeMatrixDimension('${stepId}', ${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="dimension-values">
                    <label>Values:</label>
                    <div class="matrix-values">
                        ${(dimension.values || []).map((value, valueIndex) => `
                            <div class="matrix-value">
                                <span>${value}</span>
                                <button type="button" class="btn btn-small btn-ghost" 
                                        onclick="pipelineBuilder.removeMatrixValue('${stepId}', ${index}, ${valueIndex})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                        <input type="text" placeholder="Add value..." 
                               onkeydown="if(event.key==='Enter'){pipelineBuilder.addMatrixValue('${stepId}', ${index}, this.value);this.value='';}" />
                    </div>
                </div>
            </div>
        `;
    }

    generateMatrixPreview(step) {
        const matrix = step.properties.matrix || [];
        const validDimensions = matrix.filter(d => d.name && d.values && d.values.length > 0);
        
        if (validDimensions.length === 0) {
            return '<div class="matrix-preview-empty">No valid matrix configuration</div>';
        }
        
        const combinations = this.generateMatrixCombinations(validDimensions);
        
        return `
            <div class="matrix-preview">
                <h5>Matrix Preview</h5>
                <p>Will create ${combinations.length} job${combinations.length !== 1 ? 's' : ''} = ${combinations.length} job${combinations.length !== 1 ? 's' : ''}</p>
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
                        <label for="soft_fail">Soft fail</label>
                        <small>Don't fail the build if this step fails</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="priority">Priority</label>
                        <input type="number" name="priority" value="${props.priority || 0}" 
                               placeholder="0" min="-100" max="100" />
                        <small>Higher priority steps run first (-100 to 100)</small>
                    </div>
                    
                    <div class="property-checkbox">
                        <input type="checkbox" id="skip" name="skip" 
                               ${props.skip ? 'checked' : ''} />
                        <label for="skip">Skip this step</label>
                        <small>Temporarily disable without removing</small>
                    </div>
                ` : ''}
                
                <div class="property-group">
                    <label for="id">Internal Step ID</label>
                    <input type="text" value="${step.id}" disabled />
                    <small>Auto-generated unique identifier</small>
                </div>
            </div>
        `;
    }

    // Helper generators
    generateAgentBuilder(agents) {
        const entries = Object.entries(agents);
        
        return `
            <div class="key-value-builder" id="agent-builder-${this.selectedStep}">
                ${entries.length === 0 ? '<div class="empty-builder">No agent requirements specified</div>' : ''}
                ${entries.map(([key, value], index) => `
                    <div class="key-value-pair">
                        <input type="text" value="${key}" placeholder="queue" 
                               onchange="pipelineBuilder.updateAgent('${this.selectedStep}', ${index}, 'key', this.value)" />
                        <input type="text" value="${value}" placeholder="default" 
                               onchange="pipelineBuilder.updateAgent('${this.selectedStep}', ${index}, 'value', this.value)" />
                        <button type="button" class="btn btn-small btn-danger" 
                                onclick="pipelineBuilder.removeAgent('${this.selectedStep}', ${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
                <button type="button" class="btn btn-small btn-secondary" 
                        onclick="pipelineBuilder.addAgent('${this.selectedStep}')">
                    <i class="fas fa-plus"></i> Add Agent Requirement
                </button>
            </div>
        `;
    }

    generateEnvBuilder(env) {
        const entries = Object.entries(env);
        
        return `
            <div class="key-value-builder" id="env-builder-${this.selectedStep}">
                ${entries.length === 0 ? '<div class="empty-builder">No environment variables set</div>' : ''}
                ${entries.map(([key, value], index) => `
                    <div class="key-value-pair">
                        <input type="text" value="${key}" placeholder="KEY" 
                               onchange="pipelineBuilder.updateEnv('${this.selectedStep}', ${index}, 'key', this.value)" />
                        <input type="text" value="${value}" placeholder="value" 
                               onchange="pipelineBuilder.updateEnv('${this.selectedStep}', ${index}, 'value', this.value)" />
                        <button type="button" class="btn btn-small btn-danger" 
                                onclick="pipelineBuilder.removeEnv('${this.selectedStep}', ${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
                <button type="button" class="btn btn-small btn-secondary" 
                        onclick="pipelineBuilder.addEnv('${this.selectedStep}')">
                    <i class="fas fa-plus"></i> Add Environment Variable
                </button>
            </div>
        `;
    }

    generateDependencyBuilder(dependencies) {
        const availableSteps = this.steps.filter(s => s.properties.key && s.id !== this.selectedStep);
        
        return `
            <div class="dependency-list" id="dependency-builder-${this.selectedStep}">
                ${dependencies.length === 0 ? '<div class="empty-builder">No dependencies configured</div>' : ''}
                ${dependencies.map((dep, index) => `
                    <div class="dependency-item">
                        <select onchange="pipelineBuilder.updateDependency('${this.selectedStep}', ${index}, this.value)">
                            <option value="">Select a step...</option>
                            ${availableSteps.map(s => `
                                <option value="${s.properties.key}" ${dep === s.properties.key ? 'selected' : ''}>
                                    ${s.properties.label || s.properties.key}
                                </option>
                            `).join('')}
                        </select>
                        <button type="button" class="btn btn-small btn-danger" 
                                onclick="pipelineBuilder.removeDependency('${this.selectedStep}', ${index})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('')}
                <button type="button" class="btn btn-small btn-secondary" 
                        onclick="pipelineBuilder.addDependency('${this.selectedStep}')">
                    <i class="fas fa-plus"></i> Add Dependency
                </button>
            </div>
        `;
    }

    // Field builder for block/input steps
    generateFieldBuilder(step) {
        const fields = step.properties.fields || [];
        
        return `
            <div class="property-subsection">
                <h5>Form Fields</h5>
                
                <div class="fields-list">
                    ${fields.map((field, index) => `
                        <div class="field-item">
                            <input type="text" 
                                   value="${field.text}" 
                                   placeholder="Field label"
                                   onchange="pipelineBuilder.updateField('${step.id}', ${index}, 'text', this.value)" />
                            <input type="text" 
                                   value="${field.key}" 
                                   placeholder="Field key"
                                   onchange="pipelineBuilder.updateField('${step.id}', ${index}, 'key', this.value)" />
                            <select onchange="pipelineBuilder.updateField('${step.id}', ${index}, 'type', this.value)">
                                <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
                            </select>
                            <button class="btn btn-small btn-danger" 
                                    onclick="pipelineBuilder.removeField('${step.id}', ${index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="field-actions">
                    <button type="button" class="btn btn-small btn-secondary" 
                            onclick="pipelineBuilder.addField('${step.id}', 'text')">
                        <i class="fas fa-plus"></i> Add Text Field
                    </button>
                    <button type="button" class="btn btn-small btn-secondary" 
                            onclick="pipelineBuilder.addField('${step.id}', 'select')">
                        <i class="fas fa-plus"></i> Add Select Field
                    </button>
                </div>
            </div>
        `;
    }

    generateTriggerBuildSection(step) {
        const build = step.properties.build || {};
        
        return `
            <div class="property-subsection">
                <h5>Triggered Build Configuration</h5>
                
                <div class="property-group">
                    <label for="build-message">Build Message</label>
                    <input type="text" id="build-message" value="${build.message || ''}" 
                           placeholder="Triggered by upstream build"
                           onchange="pipelineBuilder.updateTriggerBuild('${step.id}', 'message', this.value)" />
                </div>
                
                <div class="property-group">
                    <label for="build-commit">Commit</label>
                    <input type="text" id="build-commit" value="${build.commit || 'HEAD'}" 
                           placeholder="HEAD"
                           onchange="pipelineBuilder.updateTriggerBuild('${step.id}', 'commit', this.value)" />
                </div>
                
                <div class="property-group">
                    <label for="build-branch">Branch</label>
                    <input type="text" id="build-branch" value="${build.branch || 'main'}" 
                           placeholder="main"
                           onchange="pipelineBuilder.updateTriggerBuild('${step.id}', 'branch', this.value)" />
                </div>
                
                <div class="property-group">
                    <label for="build-env">Environment Variables (JSON)</label>
                    <textarea id="build-env" rows="3" 
                              placeholder='{"TRIGGERED_BY": "parent-pipeline"}'
                              onchange="pipelineBuilder.updateTriggerBuildJSON('${step.id}', 'env', this.value)">${JSON.stringify(build.env || {}, null, 2)}</textarea>
                </div>
            </div>
        `;
    }

    // Matrix builder methods
    addMatrixDimension(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        if (!step.properties.matrix) {
            step.properties.matrix = [];
        }
        
        step.properties.matrix.push({
            name: '',
            values: []
        });
        
        this.renderProperties();
    }

    removeMatrixDimension(stepId, index) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix) return;
        
        step.properties.matrix.splice(index, 1);
        this.renderProperties();
    }

    updateMatrixDimension(stepId, index, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix || !step.properties.matrix[index]) return;
        
        step.properties.matrix[index][property] = value;
        this.updateLastSaved();
    }

    addMatrixValue(stepId, dimensionIndex, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix || !step.properties.matrix[dimensionIndex]) return;
        
        if (value.trim()) {
            if (!step.properties.matrix[dimensionIndex].values) {
                step.properties.matrix[dimensionIndex].values = [];
            }
            step.properties.matrix[dimensionIndex].values.push(value.trim());
            this.renderProperties();
        }
    }

    removeMatrixValue(stepId, dimensionIndex, valueIndex) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix || !step.properties.matrix[dimensionIndex]) return;
        
        step.properties.matrix[dimensionIndex].values.splice(valueIndex, 1);
        this.renderProperties();
    }

    previewMatrix(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.matrix || step.properties.matrix.length === 0) {
            alert('No matrix configuration to preview');
            return;
        }
        
        const combinations = this.generateMatrixCombinations(step.properties.matrix);
        let preview = `Matrix will create ${combinations.length} jobs:\n\n`;
        
        combinations.forEach((combo, index) => {
            preview += `Job ${index + 1}:\n`;
            Object.entries(combo).forEach(([key, value]) => {
                preview += `  ${key}: ${value}\n`;
            });
            preview += '\n';
        });
        
        alert(preview);
    }

    // Retry configuration methods
    toggleRetryAutomatic(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        if (!step.properties.retry) {
            step.properties.retry = {};
        }
        
        if (step.properties.retry.automatic) {
            step.properties.retry.automatic = false;
        } else {
            step.properties.retry.automatic = {
                limit: 3,
                exit_status: '*'
            };
        }
        
        this.renderProperties();
    }

    updateRetryLimit(stepId, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.retry?.automatic) return;
        
        step.properties.retry.automatic.limit = parseInt(value) || 3;
        this.updateLastSaved();
    }

    updateRetryExitStatus(stepId, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.retry?.automatic) return;
        
        step.properties.retry.automatic.exit_status = value || '*';
        this.updateLastSaved();
    }

    toggleRetryManual(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step) return;
        
        if (!step.properties.retry) {
            step.properties.retry = {};
        }
        
        if (!step.properties.retry.manual) {
            step.properties.retry.manual = {};
        }
        
        step.properties.retry.manual.allowed = !step.properties.retry.manual.allowed;
        this.updateLastSaved();
    }

    // Field management for block/input steps
    addField(stepId, fieldType = 'text') {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || (step.type !== 'block' && step.type !== 'input')) return;
        
        if (!step.properties.fields) {
            step.properties.fields = [];
        }
        
        const field = {
            key: `field_${Date.now()}`,
            text: 'New Field',
            required: false,
            default: '',
            type: fieldType
        };
        
        if (fieldType === 'select') {
            field.options = ['Option 1', 'Option 2'];
        }
        
        step.properties.fields.push(field);
        this.renderProperties();
    }

    removeField(stepId, fieldIndex) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields) return;
        
        step.properties.fields.splice(fieldIndex, 1);
        this.renderProperties();
    }

    updateField(stepId, fieldIndex, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || !step.properties.fields || !step.properties.fields[fieldIndex]) return;
        
        step.properties.fields[fieldIndex][property] = value;
        this.updateLastSaved();
    }

    // Trigger build configuration
    updateTriggerBuild(stepId, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || step.type !== 'trigger') return;
        
        if (!step.properties.build) {
            step.properties.build = {};
        }
        
        step.properties.build[property] = value;
        this.updateLastSaved();
    }

    updateTriggerBuildJSON(stepId, property, value) {
        const step = this.steps.find(s => s.id === stepId);
        if (!step || step.type !== 'trigger') return;
        
        try {
            const parsed = JSON.parse(value || '{}');
            if (!step.properties.build) {
                step.properties.build = {};
            }
            step.properties.build[property] = parsed;
            this.updateLastSaved();
        } catch (e) {
            console.warn('Invalid JSON for trigger build ' + property);
        }
    }

    // Enhanced validation method
    validatePipeline() {
        const errors = [];
        const warnings = [];
        
        // Check for empty pipeline
        if (this.steps.length === 0) {
            errors.push('Pipeline has no steps');
        }
        
        // Validate each step
        this.steps.forEach((step, index) => {
            const stepName = step.properties.label || `Step ${index + 1} (${step.type})`;
            
            // Check for missing labels
            if (!step.properties.label) {
                warnings.push(`${stepName} has no label`);
            }
            
            // Type-specific validation
            switch (step.type) {
                case 'command':
                    if (!step.properties.command) {
                        errors.push(`Command step "${stepName}" has no command`);
                    }
                    break;
                case 'trigger':
                    if (!step.properties.trigger) {
                        errors.push(`Trigger step "${stepName}" has no pipeline specified`);
                    }
                    break;
                case 'block':
                case 'input':
                    if (!step.properties.prompt) {
                        warnings.push(`${step.type} step "${stepName}" has no prompt`);
                    }
                    break;
            }
            
            // Check dependencies
            if (step.properties.depends_on && step.properties.depends_on.length > 0) {
                step.properties.depends_on.forEach(dep => {
                    if (!this.steps.find(s => s.properties.key === dep)) {
                        errors.push(`Step "${stepName}" depends on unknown step: ${dep}`);
                    }
                });
            }
            
            // Check for circular dependencies
            if (this.hasCircularDependency(step)) {
                errors.push(`Step "${stepName}" has circular dependencies`);
            }
            
            // Check matrix configuration
            if (step.properties.matrix && step.properties.matrix.length > 0) {
                const validDimensions = step.properties.matrix.filter(d => d.name && d.values && d.values.length > 0);
                if (validDimensions.length === 0) {
                    warnings.push(`Step "${stepName}" has incomplete matrix configuration`);
                }
            }
        });
        
        // Show results
        this.showValidationResults(errors, warnings);
    }

    hasCircularDependency(step, visited = new Set(), recursionStack = new Set()) {
        const stepKey = step.properties.key;
        if (!stepKey) return false;
        
        visited.add(stepKey);
        recursionStack.add(stepKey);
        
        if (step.properties.depends_on) {
            for (const dep of step.properties.depends_on) {
                const depStep = this.steps.find(s => s.properties.key === dep);
                if (!depStep) continue;
                
                if (!visited.has(dep)) {
                    if (this.hasCircularDependency(depStep, visited, recursionStack)) {
                        return true;
                    }
                } else if (recursionStack.has(dep)) {
                    return true;
                }
            }
        }
        
        recursionStack.delete(stepKey);
        return false;
    }

    showValidationResults(errors, warnings) {
        let message = 'Pipeline Validation Results:\n\n';
        
        if (errors.length === 0 && warnings.length === 0) {
            message += '✅ Pipeline is valid!';
        } else {
            if (errors.length > 0) {
                message += '❌ Errors:\n';
                errors.forEach(error => {
                    message += `  • ${error}\n`;
                });
            }
            
            if (warnings.length > 0) {
                if (errors.length > 0) message += '\n';
                message += '⚠️ Warnings:\n';
                warnings.forEach(warning => {
                    message += `  • ${warning}\n`;
                });
            }
        }
        
        alert(message);
    }
}

// Export the class
window.EnhancedPipelineBuilder = EnhancedPipelineBuilder;