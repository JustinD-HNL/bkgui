/**
 * Pipeline Builder Help Integration
 * Extends PipelineBuilder with help tooltip functionality
 */

// Helper function to create label with help icon
function createLabelWithHelp(forId, labelText, helpId) {
    const helpTooltip = window.helpTooltip || new HelpTooltip();
    const content = window.helpContent[helpId];
    
    if (!content) {
        // Return label without help if no content defined
        return `<label for="${forId}">${labelText}</label>`;
    }
    
    return `<label for="${forId}">${labelText}${helpTooltip.createHelpIcon(helpId, content)}</label>`;
}

// Override the generateCommandStepForm method
if (window.PipelineBuilder) {
    const originalGenerateCommandStepForm = window.PipelineBuilder.prototype.generateCommandStepForm;
    
    window.PipelineBuilder.prototype.generateCommandStepForm = function(step) {
        // Ensure properties exist
        if (!step.properties) {
            console.error('Step properties missing:', step);
            step.properties = this.getDefaultProperties('command');
        }
        
        return `
            <div class="property-section">
                <div class="property-group">
                    ${createLabelWithHelp('step-label', 'Label', 'step-label')}
                    <input type="text" id="step-label" value="${step.properties.label || ''}" placeholder="Step label">
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('step-key', 'Key', 'step-key')}
                    <input type="text" id="step-key" value="${step.properties.key || ''}" placeholder="Unique step key">
                    <small>Used for dependencies and targeting</small>
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('step-command', 'Command', 'step-command')}
                    <textarea id="step-command" rows="4" placeholder="Commands to run">${step.properties.command || ''}</textarea>
                </div>
            </div>

            ${this.generateAgentsSection(step)}
            ${this.generatePluginsSection(step)}
            ${this.generateCommonPropertiesForm(step)}
        `;
    };

    // Override other form generation methods
    const originalGenerateWaitStepForm = window.PipelineBuilder.prototype.generateWaitStepForm;
    
    window.PipelineBuilder.prototype.generateWaitStepForm = function(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="wait-continue-on-failure" ${step.properties.continue_on_failure ? 'checked' : ''}>
                        Continue on failure
                    </label>
                    ${window.helpTooltip.createHelpIcon('wait-continue-on-failure', window.helpContent['wait-continue-on-failure'])}
                    <small>Allow the pipeline to continue even if previous steps failed</small>
                </div>
            </div>
            ${this.generateCommonPropertiesForm(step)}
        `;
    };

    const originalGenerateBlockStepForm = window.PipelineBuilder.prototype.generateBlockStepForm;
    
    window.PipelineBuilder.prototype.generateBlockStepForm = function(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    ${createLabelWithHelp('block-label', 'Block Label', 'block-label')}
                    <input type="text" id="block-label" value="${step.properties.block || ''}" placeholder="e.g., Deploy to Production">
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('block-prompt', 'Prompt Message', 'block-prompt')}
                    <textarea id="block-prompt" rows="2">${step.properties.prompt || ''}</textarea>
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('block-fields', 'Fields', 'block-fields')}
                    <div id="block-fields-list">${this.renderBlockFields(step.properties.fields || [])}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-block-field">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
            </div>
        `;
    };

    const originalGenerateInputStepForm = window.PipelineBuilder.prototype.generateInputStepForm;
    
    window.PipelineBuilder.prototype.generateInputStepForm = function(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    ${createLabelWithHelp('input-label', 'Input Label', 'input-label')}
                    <input type="text" id="input-label" value="${step.properties.input || ''}" placeholder="e.g., Deployment Configuration">
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('input-prompt', 'Prompt', 'input-prompt')}
                    <textarea id="input-prompt" rows="2">${step.properties.prompt || ''}</textarea>
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('input-fields', 'Fields', 'input-fields')}
                    <div id="input-fields-list">${this.renderInputFields(step.properties.fields || [])}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-input-field">
                        <i class="fas fa-plus"></i> Add Field
                    </button>
                </div>
            </div>
        `;
    };

    const originalGenerateTriggerStepForm = window.PipelineBuilder.prototype.generateTriggerStepForm;
    
    window.PipelineBuilder.prototype.generateTriggerStepForm = function(step) {
        return `
            <div class="property-section">
                <div class="property-group">
                    ${createLabelWithHelp('trigger-pipeline', 'Target Pipeline', 'trigger-pipeline')}
                    <input type="text" id="trigger-pipeline" value="${step.properties.trigger || ''}" placeholder="pipeline-slug">
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('trigger-label', 'Label', 'trigger-label')}
                    <input type="text" id="trigger-label" value="${step.properties.label || ''}" placeholder="Trigger label">
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('trigger-branch', 'Branch', 'trigger-build')}
                    <input type="text" id="trigger-branch" value="${step.properties.build?.branch || ''}" placeholder="main">
                </div>
                <div class="property-group">
                    ${createLabelWithHelp('trigger-message', 'Build Message', 'trigger-build')}
                    <input type="text" id="trigger-message" value="${step.properties.build?.message || ''}" placeholder="Triggered from main pipeline">
                </div>
                <div class="property-group">
                    <label>
                        <input type="checkbox" id="trigger-async" ${step.properties.async ? 'checked' : ''}>
                        Async (don't wait for triggered build)
                    </label>
                    ${window.helpTooltip.createHelpIcon('trigger-async', window.helpContent['trigger-async'])}
                </div>
            </div>
            ${this.generateCommonPropertiesForm(step)}
        `;
    };

    // Override common properties form
    const originalGenerateCommonPropertiesForm = window.PipelineBuilder.prototype.generateCommonPropertiesForm;
    
    window.PipelineBuilder.prototype.generateCommonPropertiesForm = function(step) {
        const supportsIf = !['annotation'].includes(step.type);
        const supportsBranches = ['command', 'trigger', 'plugin'].includes(step.type);
        const supportsDependsOn = !['wait'].includes(step.type);
        
        let html = '';
        
        // Conditional execution
        if (supportsIf) {
            html += `
                <div class="property-section collapsed">
                    <h4><i class="fas fa-code-branch"></i> Conditional Execution</h4>
                    <div class="property-group">
                        ${createLabelWithHelp('step-if', 'If Condition', 'step-if')}
                        <input type="text" id="step-if" value="${step.properties.if || ''}" placeholder="e.g., branch == 'main'">
                        <small>Run this step only when condition is true</small>
                    </div>
                    ${supportsBranches ? `
                        <div class="property-group">
                            ${createLabelWithHelp('step-branches', 'Branch Filter', 'step-branches')}
                            <input type="text" id="step-branches" value="${step.properties.branches || ''}" placeholder="e.g., main develop feature/*">
                            <small>Space-separated list of branch patterns</small>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Dependencies
        if (supportsDependsOn) {
            html += `
                <div class="property-section collapsed">
                    <h4><i class="fas fa-project-diagram"></i> Dependencies</h4>
                    <div class="property-group">
                        ${createLabelWithHelp('step-depends-on', 'Depends On', 'step-depends-on')}
                        <input type="text" id="step-depends-on" value="${Array.isArray(step.properties.depends_on) ? step.properties.depends_on.join(', ') : step.properties.depends_on || ''}" placeholder="e.g., build, test">
                        <small>Comma-separated list of step keys</small>
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="step-allow-dependency-failure" ${step.properties.allow_dependency_failure ? 'checked' : ''}>
                            Allow dependency failure
                        </label>
                        <small>Continue even if dependencies fail</small>
                    </div>
                </div>
            `;
        }
        
        return html;
    };

    // Override agents section
    const originalGenerateAgentsSection = window.PipelineBuilder.prototype.generateAgentsSection;
    
    window.PipelineBuilder.prototype.generateAgentsSection = function(step) {
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-server"></i> Agent Targeting</h4>
                <div class="property-group">
                    ${createLabelWithHelp('step-agents-queue', 'Queue', 'step-agents')}
                    <input type="text" id="step-agents-queue" value="${step.properties.agents?.queue || ''}" placeholder="default">
                </div>
                <div class="property-group">
                    <label for="step-agents-tags">Agent Tags</label>
                    <div id="agent-tags-list">${this.renderAgentTags(step.properties.agents || {})}</div>
                    <button type="button" class="btn btn-secondary btn-small" data-action="add-agent-tag">
                        <i class="fas fa-plus"></i> Add Tag
                    </button>
                </div>
            </div>
        `;
    };

    // Override additional properties
    const originalGenerateAdditionalProperties = window.PipelineBuilder.prototype.generateAdditionalProperties;
    
    window.PipelineBuilder.prototype.generateAdditionalProperties = function(step) {
        const isCommandStep = step.type === 'command';
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-cog"></i> Additional Properties</h4>
                ${isCommandStep ? `
                    <div class="property-group">
                        ${createLabelWithHelp('step-parallelism', 'Parallelism', 'step-parallelism')}
                        <input type="number" id="step-parallelism" value="${step.properties.parallelism || ''}" min="1" placeholder="1">
                        <small>Number of parallel jobs to run</small>
                    </div>
                    <div class="property-group">
                        ${createLabelWithHelp('step-timeout', 'Timeout (minutes)', 'step-timeout')}
                        <input type="number" id="step-timeout" value="${step.properties.timeout_in_minutes || ''}" min="1" placeholder="No timeout">
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="step-skip" ${step.properties.skip ? 'checked' : ''}>
                            Skip this step
                        </label>
                        ${window.helpTooltip.createHelpIcon('step-skip', window.helpContent['step-skip'])}
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="step-cancel-on-build-failing" ${step.properties.cancel_on_build_failing ? 'checked' : ''}>
                            Cancel on build failing
                        </label>
                        ${window.helpTooltip.createHelpIcon('step-cancel-on-build-failing', window.helpContent['step-cancel-on-build-failing'])}
                    </div>
                ` : ''}
                <div class="property-group">
                    ${createLabelWithHelp('step-priority', 'Priority', 'step-priority')}
                    <input type="number" id="step-priority" value="${step.properties.priority || ''}" placeholder="0">
                    <small>Higher numbers = higher priority</small>
                </div>
            </div>
        `;
    };

    // Override retry configuration
    const originalGenerateRetryConfig = window.PipelineBuilder.prototype.generateRetryConfig;
    
    window.PipelineBuilder.prototype.generateRetryConfig = function(step) {
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-redo"></i> Retry Configuration ${window.helpTooltip.createHelpIcon('step-retry', window.helpContent['step-retry'])}</h4>
                <div class="retry-config">
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="retry-automatic" ${step.properties.retry?.automatic ? 'checked' : ''}>
                            Enable automatic retry
                        </label>
                    </div>
                    <div id="retry-options" style="${step.properties.retry?.automatic ? '' : 'display: none;'}">
                        <div class="property-group">
                            <label for="retry-limit">Retry Limit</label>
                            <input type="number" id="retry-limit" min="1" max="10" value="${step.properties.retry?.automatic?.limit || 2}">
                        </div>
                        <div class="property-group">
                            <label for="retry-exit-codes">Exit Codes (comma-separated)</label>
                            <input type="text" id="retry-exit-codes" placeholder="e.g., -1, 255" value="${step.properties.retry?.automatic?.exit_status || ''}">
                        </div>
                    </div>
                    <div class="property-group">
                        <label>
                            <input type="checkbox" id="retry-manual" ${step.properties.retry?.manual ? 'checked' : ''}>
                            Allow manual retry
                        </label>
                    </div>
                </div>
            </div>
        `;
    };

    // Override artifact paths
    const originalGenerateArtifactPaths = window.PipelineBuilder.prototype.generateArtifactPaths;
    
    window.PipelineBuilder.prototype.generateArtifactPaths = function(step) {
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-archive"></i> Artifacts ${window.helpTooltip.createHelpIcon('step-artifact-paths', window.helpContent['step-artifact-paths'])}</h4>
                <div class="property-group">
                    <label for="step-artifact-paths">Artifact Paths</label>
                    <textarea id="step-artifact-paths" rows="3" placeholder="logs/**/*.log&#10;coverage/**/*&#10;test-results.xml">${step.properties.artifact_paths || ''}</textarea>
                    <small>One glob pattern per line</small>
                </div>
            </div>
        `;
    };

    // Override soft fail config
    const originalGenerateSoftFailConfig = window.PipelineBuilder.prototype.generateSoftFailConfig;
    
    window.PipelineBuilder.prototype.generateSoftFailConfig = function(step) {
        const softFailValue = step.properties.soft_fail;
        let softFailType = 'false';
        let exitCodes = '';
        
        if (softFailValue === true) {
            softFailType = 'true';
        } else if (softFailValue === false) {
            softFailType = 'false';
        } else if (typeof softFailValue === 'object' && softFailValue !== null) {
            if (Array.isArray(softFailValue)) {
                softFailType = 'exit_codes';
                exitCodes = softFailValue.map(item => 
                    typeof item === 'object' && item.exit_status !== undefined ? item.exit_status : item
                ).join(', ');
            } else if (softFailValue.exit_status !== undefined) {
                softFailType = 'exit_codes';
                exitCodes = Array.isArray(softFailValue.exit_status) 
                    ? softFailValue.exit_status.join(', ') 
                    : softFailValue.exit_status.toString();
            }
        }
        
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-feather-alt"></i> Soft Fail ${window.helpTooltip.createHelpIcon('step-soft-fail', window.helpContent['step-soft-fail'])}</h4>
                <div class="property-group">
                    <label for="step-soft-fail-type">Soft Fail Behavior</label>
                    <select id="step-soft-fail-type">
                        <option value="false" ${softFailType === 'false' ? 'selected' : ''}>Never soft fail (default)</option>
                        <option value="true" ${softFailType === 'true' ? 'selected' : ''}>Always soft fail</option>
                        <option value="exit_codes" ${softFailType === 'exit_codes' ? 'selected' : ''}>Soft fail on specific exit codes</option>
                    </select>
                </div>
                <div class="property-group" id="soft-fail-codes-group" style="${softFailType === 'exit_codes' ? '' : 'display: none;'}">
                    <label for="step-soft-fail-codes">Exit Codes (comma-separated)</label>
                    <input type="text" id="step-soft-fail-codes" value="${exitCodes}" placeholder="e.g., 1, 2, 127">
                    <small>Step will soft fail when command exits with these codes</small>
                </div>
            </div>
        `;
    };

    // Override environment variables
    const originalGenerateEnvVarsSection = window.PipelineBuilder.prototype.generateEnvVarsSection;
    
    window.PipelineBuilder.prototype.generateEnvVarsSection = function(step) {
        return `
            <div class="property-section collapsed">
                <h4><i class="fas fa-terminal"></i> Environment Variables ${window.helpTooltip.createHelpIcon('step-env', window.helpContent['step-env'])}</h4>
                <div id="env-vars-list">${this.renderEnvVars(step.properties.env || {})}</div>
                <button type="button" class="btn btn-secondary btn-small" data-action="add-env-var">
                    <i class="fas fa-plus"></i> Add Variable
                </button>
            </div>
        `;
    };
}

// Initialize help tooltips when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global help tooltip instance
    window.helpTooltip = new HelpTooltip();
    
    // Initialize any existing help icons
    window.helpTooltip.initializeAll();
});

// Re-initialize help tooltips when properties panel is updated
document.addEventListener('propertiesRendered', function() {
    if (window.helpTooltip) {
        window.helpTooltip.initializeAll();
    }
});