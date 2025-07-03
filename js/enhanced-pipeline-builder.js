// js/enhanced-pipeline-builder.js - COMPLETE VERSION with all features
/**
 * Enhanced Pipeline Builder - Complete functionality
 * FIXES: Proper event handling while maintaining ALL original features
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

    // Enhanced property form generation with ALL sections
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
                    </div>
                `;
                break;
            case 'block':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Block Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Deploy to Production?" />
                    </div>
                    <div class="property-group">
                        <label for="prompt">Prompt Message</label>
                        <input type="text" name="prompt" value="${step.properties.prompt || ''}" placeholder="Please confirm deployment" />
                    </div>
                    <div class="property-group">
                        <label for="blocked_state">Blocked State</label>
                        <select name="blocked_state">
                            <option value="passed" ${step.properties.blocked_state === 'passed' ? 'selected' : ''}>Passed</option>
                            <option value="failed" ${step.properties.blocked_state === 'failed' ? 'selected' : ''}>Failed</option>
                            <option value="running" ${step.properties.blocked_state === 'running' ? 'selected' : ''}>Running</option>
                        </select>
                    </div>
                    ${this.generateFieldBuilder(step)}
                `;
                break;
            case 'input':
                basicFields = `
                    <div class="property-group">
                        <label for="label">Input Label</label>
                        <input type="text" name="label" value="${step.properties.label || ''}" placeholder="e.g., Deployment Parameters" />
                    </div>
                    <div class="property-group">
                        <label for="prompt">Prompt Message</label>
                        <input type="text" name="prompt" value="${step.properties.prompt || ''}" placeholder="Please provide input" />
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
                        <input type="text" name="trigger" value="${step.properties.trigger || ''}" placeholder="deploy-pipeline" />
                        <small>Pipeline slug to trigger</small>
                    </div>
                    <div class="property-checkbox">
                        <input type="checkbox" id="async" name="async" ${step.properties.async ? 'checked' : ''} />
                        <label for="async">Run asynchronously</label>
                    </div>
                    ${this.generateTriggerBuildSection(step)}
                `;
                break;
            case 'annotation':
                basicFields = `
                    <div class="property-group">
                        <label for="body">Annotation Text</label>
                        <textarea name="body" rows="4" placeholder="Markdown supported...">${step.properties.body || ''}</textarea>
                        <small>Supports Markdown formatting</small>
                    </div>
                    <div class="property-group">
                        <label for="context">Context</label>
                        <input type="text" name="context" value="${step.properties.context || 'default'}" placeholder="default" />
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
                        <label for="replace">Replace Pipeline (vs append)</label>
                    </div>
                `;
                break;
        }

        return `
            <div class="property-section">
                <h4><i class="fas fa-cog"></i> Basic Configuration</h4>
                ${basicFields}
            </div>
        `;
    }

    generateExecutionEnvironmentSection(step) {
        if (step.type === 'wait' || step.type === 'annotation') {
            return '';
        }

        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-server"></i> Execution Environment</h4>
                
                <div class="property-group">
                    <label for="agents">Agent Targeting (JSON)</label>
                    <textarea name="agents" placeholder='{"queue": "default", "os": "linux"}' rows="3">${JSON.stringify(props.agents || {}, null, 2)}</textarea>
                    <small>JSON object specifying agent requirements</small>
                </div>
                
                <div class="property-group">
                    <label for="env">Environment Variables (JSON)</label>
                    <textarea name="env" placeholder='{"NODE_ENV": "test", "DEBUG": "true"}' rows="4">${JSON.stringify(props.env || {}, null, 2)}</textarea>
                    <small>JSON object of environment variables</small>
                </div>
                
                ${step.type === 'command' || step.type === 'plugin' ? `
                    <div class="property-group">
                        <label for="timeout_in_minutes">Timeout (minutes)</label>
                        <input type="number" name="timeout_in_minutes" value="${props.timeout_in_minutes || 60}" 
                               placeholder="60" min="1" max="1440" />
                        <small>Maximum execution time in minutes</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="parallelism">Parallelism</label>
                        <input type="number" name="parallelism" value="${props.parallelism || 1}" 
                               placeholder="1" min="1" max="100" />
                        <small>Number of parallel jobs to run</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="concurrency">Concurrency Group</label>
                        <input type="text" name="concurrency" value="${props.concurrency || ''}" 
                               placeholder="deployment" />
                        <small>Limit concurrent builds in this group</small>
                    </div>
                    
                    <div class="property-group">
                        <label for="concurrency_limit">Concurrency Limit</label>
                        <input type="number" name="concurrency_limit" value="${props.concurrency_limit || 1}" 
                               placeholder="1" min="1" max="100" />
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
                    <label for="branches">Branch Pattern</label>
                    <input type="text" name="branches" value="${props.branches || ''}" 
                           placeholder="main develop feature/*" />
                    <small>Space-separated branch patterns</small>
                </div>
                
                <div class="property-group">
                    <label for="if">If Condition</label>
                    <input type="text" name="if" value="${props.if || ''}" 
                           placeholder='build.branch == "main" && build.pull_request.id == null' />
                    <small>Run step if this expression evaluates to true</small>
                </div>
                
                <div class="property-group">
                    <label for="unless">Unless Condition</label>
                    <input type="text" name="unless" value="${props.unless || ''}" 
                           placeholder='build.pull_request.draft == true' />
                    <small>Skip step if this expression evaluates to true</small>
                </div>
                
                <div class="conditional-examples">
                    <h5>Common Conditions:</h5>
                    <ul>
                        <li><code>build.branch == "main"</code> - Main branch only</li>
                        <li><code>build.pull_request.id != null</code> - Pull requests only</li>
                        <li><code>build.tag != null</code> - Tagged builds only</li>
                        <li><code>build.source == "schedule"</code> - Scheduled builds only</li>
                    </ul>
                </div>
            </div>
        `;
    }

    generateDependencySection(step) {
        const availableSteps = this.steps
            .filter(s => s.id !== step.id && s.properties.key)
            .map(s => ({ id: s.properties.key, label: s.properties.label }));

        return `
            <div class="property-section">
                <h4><i class="fas fa-link"></i> Dependencies</h4>
                
                <div class="property-group">
                    <label>Depends On Steps</label>
                    <div class="dependency-list">
                        ${availableSteps.length > 0 ? availableSteps.map(s => `
                            <div class="property-checkbox">
                                <input type="checkbox" id="dep-${s.id}" value="${s.id}" 
                                       ${step.properties.depends_on?.includes(s.id) ? 'checked' : ''} 
                                       onchange="pipelineBuilder.updateDependencies('${step.id}')" />
                                <label for="dep-${s.id}">${s.label} (${s.id})</label>
                            </div>
                        `).join('') : '<p class="text-muted">No other steps with keys available</p>'}
                    </div>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="allow_dependency_failure" name="allow_dependency_failure" 
                           ${step.properties.allow_dependency_failure ? 'checked' : ''} />
                    <label for="allow_dependency_failure">Allow dependency failure</label>
                    <small>Continue even if dependencies fail</small>
                </div>
            </div>
        `;
    }

    generateRetrySection(step) {
        const retry = step.properties.retry || { automatic: false };
        const automatic = retry.automatic || false;
        const manual = retry.manual || { allowed: true };
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-redo"></i> Retry Configuration</h4>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="retry-automatic" 
                           ${automatic ? 'checked' : ''} 
                           onchange="pipelineBuilder.toggleRetryAutomatic('${step.id}')" />
                    <label for="retry-automatic">Enable automatic retry</label>
                </div>
                
                ${automatic ? `
                    <div class="retry-config">
                        <div class="property-group">
                            <label for="retry-limit">Retry Limit</label>
                            <input type="number" id="retry-limit" value="${automatic.limit || 3}" 
                                   min="1" max="10" 
                                   onchange="pipelineBuilder.updateRetryLimit('${step.id}', this.value)" />
                        </div>
                        
                        <div class="property-group">
                            <label for="retry-exit-status">Exit Status Pattern</label>
                            <input type="text" id="retry-exit-status" value="${automatic.exit_status || '*'}" 
                                   placeholder="* or specific codes like 1,2,255"
                                   onchange="pipelineBuilder.updateRetryExitStatus('${step.id}', this.value)" />
                            <small>Exit codes that trigger retry (* = any non-zero)</small>
                        </div>
                    </div>
                ` : ''}
                
                <div class="property-checkbox">
                    <input type="checkbox" id="retry-manual" 
                           ${manual.allowed !== false ? 'checked' : ''} 
                           onchange="pipelineBuilder.toggleRetryManual('${step.id}')" />
                    <label for="retry-manual">Allow manual retry</label>
                </div>
            </div>
        `;
    }

    generateArtifactsSection(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-archive"></i> Artifacts</h4>
                
                <div class="property-group">
                    <label for="artifact_paths">Artifact Paths</label>
                    <textarea name="artifact_paths" rows="3" 
                              placeholder="build/logs/**/*\ntest-results/**/*.xml">${step.properties.artifact_paths || ''}</textarea>
                    <small>Glob patterns for files to upload (one per line)</small>
                </div>
                
                <div class="property-checkbox">
                    <input type="checkbox" id="compress_artifacts" name="compress_artifacts" 
                           ${step.properties.compress_artifacts ? 'checked' : ''} />
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
                                <button type="button" onclick="pipelineBuilder.removeMatrixValue('${stepId}', ${index}, ${valueIndex})">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <input type="text" placeholder="Add value and press Enter" 
                           onkeypress="if(event.key === 'Enter') { pipelineBuilder.addMatrixValue('${stepId}', ${index}, this.value); this.value = ''; }" />
                </div>
            </div>
        `;
    }

    generateNotificationSection(step) {
        return `
            <div class="property-section">
                <h4><i class="fas fa-bell"></i> Notifications</h4>
                
                <div class="property-group">
                    <label for="notify">Notify Conditions</label>
                    <select name="notify" multiple size="4">
                        <option value="success" ${step.properties.notify?.includes('success') ? 'selected' : ''}>On Success</option>
                        <option value="failure" ${step.properties.notify?.includes('failure') ? 'selected' : ''}>On Failure</option>
                        <option value="unstable" ${step.properties.notify?.includes('unstable') ? 'selected' : ''}>On Unstable</option>
                        <option value="recovered" ${step.properties.notify?.includes('recovered') ? 'selected' : ''}>On Recovery</option>
                    </select>
                    <small>Hold Ctrl/Cmd to select multiple</small>
                </div>
            </div>
        `;
    }

    generateAdvancedSection(step) {
        const props = step.properties;
        
        return `
            <div class="property-section">
                <h4><i class="fas fa-sliders-h"></i> Advanced Options</h4>
                
                ${step.type === 'command' || step.type === 'plugin' ? `
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

    generateMatrixCombinations(matrix) {
        if (matrix.length === 0) return [];
        
        const dimensions = matrix.filter(d => d.name && d.values && d.values.length > 0);
        if (dimensions.length === 0) return [];
        
        const combinations = [];
        
        function combine(index, current) {
            if (index === dimensions.length) {
                combinations.push({ ...current });
                return;
            }
            
            const dimension = dimensions[index];
            dimension.values.forEach(value => {
                current[dimension.name] = value;
                combine(index + 1, current);
            });
        }
        
        combine(0, {});
        return combinations;
    }

    generateMatrixPreview(step) {
        if (!step.properties.matrix || step.properties.matrix.length === 0) {
            return '';
        }
        
        const validDimensions = step.properties.matrix.filter(d => d.name && d.values && d.values.length > 0);
        if (validDimensions.length === 0) return '';
        
        const combinations = this.generateMatrixCombinations(step.properties.matrix);
        
        return `
            <div class="matrix-preview">
                <h5>Matrix Configuration</h5>
                <p>${validDimensions.length} dimension${validDimensions.length !== 1 ? 's' : ''} = ${combinations.length} job${combinations.length !== 1 ? 's' : ''}</p>
                <ul>
                    ${validDimensions.map(dim => `<li><strong>${dim.name}:</strong> ${dim.values.join(', ')}</li>`).join('')}
                </ul>
            </div>
        `;
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

    // Validation method
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