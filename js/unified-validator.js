// Unified Pipeline Validator
// Provides consistent validation across all validate buttons with detailed error reporting

class UnifiedValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    // Main validation entry point
    async validatePipeline(steps, yamlString = null) {
        this.errors = [];
        this.warnings = [];
        this.info = [];

        console.log('🔍 Starting unified pipeline validation...');

        // 1. Basic structure validation
        this.validateBasicStructure(steps);

        // 2. Step-level validation
        this.validateSteps(steps);

        // 3. Dependencies validation
        this.validateDependencies(steps);

        // 4. Matrix validation
        this.validateMatrix(steps);

        // 5. YAML-specific validation if YAML provided
        if (yamlString) {
            this.validateYAMLSyntax(yamlString);
        }

        // 6. Buildkite-specific rules
        this.validateBuildkiteRules(steps);

        // 7. Best practices validation (warnings)
        this.validateBestPractices(steps);

        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            info: this.info,
            summary: this.generateSummary()
        };
    }

    // 1. Basic structure validation
    validateBasicStructure(steps) {
        if (!steps || steps.length === 0) {
            this.addError('Pipeline is empty', 'Add at least one step to your pipeline');
            return;
        }

        // Check for duplicate keys
        const keys = new Set();
        const duplicateKeys = new Set();
        steps.forEach(step => {
            const key = step.properties?.key;
            if (key) {
                if (keys.has(key)) {
                    duplicateKeys.add(key);
                }
                keys.add(key);
            }
        });

        if (duplicateKeys.size > 0) {
            this.addError(
                'Duplicate step keys found',
                `The following keys are used multiple times: ${Array.from(duplicateKeys).join(', ')}`,
                'Each step key must be unique'
            );
        }

        // Check for duplicate labels
        const labels = new Set();
        const duplicateLabels = new Set();
        steps.forEach(step => {
            const label = step.properties?.label;
            if (label) {
                if (labels.has(label)) {
                    duplicateLabels.add(label);
                }
                labels.add(label);
            }
        });

        if (duplicateLabels.size > 0) {
            this.addWarning(
                'Duplicate step labels found',
                `The following labels are used multiple times: ${Array.from(duplicateLabels).join(', ')}`,
                'Consider using unique labels for better clarity'
            );
        }
    }

    // 2. Step-level validation
    validateSteps(steps) {
        steps.forEach((step, index) => {
            const stepLabel = step.properties?.label || `Step ${index + 1}`;
            
            switch (step.type) {
                case 'command':
                    this.validateCommandStep(step, stepLabel);
                    break;
                case 'wait':
                    this.validateWaitStep(step, stepLabel);
                    break;
                case 'block':
                    this.validateBlockStep(step, stepLabel);
                    break;
                case 'input':
                    this.validateInputStep(step, stepLabel);
                    break;
                case 'trigger':
                    this.validateTriggerStep(step, stepLabel);
                    break;
                case 'group':
                    this.validateGroupStep(step, stepLabel);
                    break;
                default:
                    if (step.type) {
                        this.addWarning(
                            `Unknown step type: ${step.type}`,
                            `Step "${stepLabel}" has an unrecognized type`,
                            'This may cause issues with the Buildkite agent'
                        );
                    }
            }

            // Validate common properties
            this.validateCommonProperties(step, stepLabel);
        });
    }

    validateCommandStep(step, label) {
        const props = step.properties || {};
        
        if (!props.command || props.command.trim() === '') {
            this.addError(
                'Command step missing command',
                `Step "${label}" has no command to execute`,
                'Add a command for this step'
            );
        }

        // Check for potentially dangerous commands
        if (props.command) {
            const dangerous = ['rm -rf /', 'dd if=/dev/zero', 'chmod -R 777'];
            dangerous.forEach(cmd => {
                if (props.command.includes(cmd)) {
                    this.addWarning(
                        'Potentially dangerous command',
                        `Step "${label}" contains: ${cmd}`,
                        'Double-check this command is intentional'
                    );
                }
            });
        }

        // Validate agents
        if (props.agents && typeof props.agents === 'object') {
            if (Object.keys(props.agents).length === 0) {
                this.addWarning(
                    'Empty agents specification',
                    `Step "${label}" has empty agents object`,
                    'Consider specifying agent requirements or remove the empty agents field'
                );
            }
        }
    }

    validateWaitStep(step, label) {
        const props = step.properties || {};
        
        if (props.continue_on_failure && typeof props.continue_on_failure !== 'boolean') {
            this.addError(
                'Invalid wait step configuration',
                `Step "${label}" has invalid continue_on_failure value`,
                'continue_on_failure must be true or false'
            );
        }
    }

    validateBlockStep(step, label) {
        const props = step.properties || {};
        
        if (!props.prompt || props.prompt.trim() === '') {
            this.addWarning(
                'Block step missing prompt',
                `Step "${label}" has no prompt text`,
                'Add a prompt to explain what approval is needed'
            );
        }

        if (props.fields && Array.isArray(props.fields)) {
            props.fields.forEach((field, idx) => {
                if (!field.key) {
                    this.addError(
                        'Block field missing key',
                        `Field ${idx + 1} in step "${label}" has no key`,
                        'Each field must have a unique key'
                    );
                }
            });
        }
    }

    validateInputStep(step, label) {
        const props = step.properties || {};
        
        if (!props.prompt || props.prompt.trim() === '') {
            this.addError(
                'Input step missing prompt',
                `Step "${label}" has no prompt text`,
                'Add a prompt to explain what input is needed'
            );
        }

        if (!props.fields || !Array.isArray(props.fields) || props.fields.length === 0) {
            this.addError(
                'Input step missing fields',
                `Step "${label}" has no input fields defined`,
                'Add at least one field for user input'
            );
        } else {
            props.fields.forEach((field, idx) => {
                if (!field.key) {
                    this.addError(
                        'Input field missing key',
                        `Field ${idx + 1} in step "${label}" has no key`,
                        'Each field must have a unique key'
                    );
                }
                if (!field.text && !field.hint) {
                    this.addWarning(
                        'Input field missing label',
                        `Field "${field.key || idx + 1}" in step "${label}" has no text or hint`,
                        'Add text or hint to describe the field'
                    );
                }
            });
        }
    }

    validateTriggerStep(step, label) {
        const props = step.properties || {};
        
        if (!props.trigger || props.trigger.trim() === '') {
            this.addError(
                'Trigger step missing pipeline',
                `Step "${label}" has no pipeline to trigger`,
                'Specify which pipeline to trigger'
            );
        }
    }

    validateGroupStep(step, label) {
        const props = step.properties || {};
        
        if (!props.group || props.group.trim() === '') {
            this.addWarning(
                'Group step missing name',
                `Step "${label}" has no group name`,
                'Add a group name for better organization'
            );
        }
    }

    validateCommonProperties(step, label) {
        const props = step.properties || {};

        // Validate conditional (if)
        if (props.if) {
            this.validateConditional(props.if, label);
        }

        // Validate depends_on
        if (props.depends_on) {
            if (!Array.isArray(props.depends_on)) {
                this.addError(
                    'Invalid depends_on format',
                    `Step "${label}" has invalid depends_on`,
                    'depends_on must be an array of step keys'
                );
            }
        }

        // Validate plugins
        if (props.plugins) {
            this.validatePlugins(props.plugins, label);
        }

        // Validate retry
        if (props.retry) {
            this.validateRetry(props.retry, label);
        }

        // Validate timeout
        if (props.timeout_in_minutes) {
            const timeout = parseInt(props.timeout_in_minutes);
            if (isNaN(timeout) || timeout <= 0) {
                this.addError(
                    'Invalid timeout value',
                    `Step "${label}" has invalid timeout: ${props.timeout_in_minutes}`,
                    'Timeout must be a positive number'
                );
            } else if (timeout > 1440) { // 24 hours
                this.addWarning(
                    'Very long timeout',
                    `Step "${label}" has timeout of ${timeout} minutes (${Math.floor(timeout/60)} hours)`,
                    'Consider if such a long timeout is necessary'
                );
            }
        }
    }

    // 3. Dependencies validation
    validateDependencies(steps) {
        const stepKeys = new Set(steps.map(s => s.properties?.key).filter(Boolean));
        
        steps.forEach(step => {
            const deps = step.properties?.depends_on;
            if (deps && Array.isArray(deps)) {
                deps.forEach(dep => {
                    if (!stepKeys.has(dep)) {
                        this.addError(
                            'Invalid dependency',
                            `Step "${step.properties?.label || 'Unknown'}" depends on non-existent step: "${dep}"`,
                            'Check that the dependency key exists'
                        );
                    }
                });
            }
        });

        // Check for circular dependencies
        this.checkCircularDependencies(steps);
    }

    checkCircularDependencies(steps) {
        const stepMap = new Map();
        steps.forEach(step => {
            if (step.properties?.key) {
                stepMap.set(step.properties.key, step);
            }
        });

        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (key, path = []) => {
            if (recursionStack.has(key)) {
                const cycleStart = path.indexOf(key);
                const cycle = path.slice(cycleStart).concat(key);
                this.addError(
                    'Circular dependency detected',
                    `Steps form a circular dependency: ${cycle.join(' → ')}`,
                    'Remove the circular reference'
                );
                return true;
            }

            if (visited.has(key)) return false;

            visited.add(key);
            recursionStack.add(key);

            const step = stepMap.get(key);
            if (step?.properties?.depends_on) {
                for (const dep of step.properties.depends_on) {
                    if (hasCycle(dep, [...path, key])) {
                        return true;
                    }
                }
            }

            recursionStack.delete(key);
            return false;
        };

        stepMap.forEach((_, key) => {
            if (!visited.has(key)) {
                hasCycle(key);
            }
        });
    }

    // 4. Matrix validation
    validateMatrix(steps) {
        steps.forEach(step => {
            const matrix = step.properties?.matrix;
            if (matrix && typeof matrix === 'object') {
                const dimensions = Object.keys(matrix);
                
                if (dimensions.length === 0) {
                    this.addError(
                        'Empty matrix configuration',
                        `Step "${step.properties?.label || 'Unknown'}" has empty matrix`,
                        'Add at least one dimension to the matrix'
                    );
                    return;
                }

                if (dimensions.length > 5) {
                    this.addError(
                        'Too many matrix dimensions',
                        `Step "${step.properties?.label || 'Unknown'}" has ${dimensions.length} dimensions (max 5)`,
                        'Reduce the number of matrix dimensions'
                    );
                }

                let totalJobs = 1;
                dimensions.forEach(dim => {
                    const values = matrix[dim];
                    if (!Array.isArray(values) || values.length === 0) {
                        this.addError(
                            'Invalid matrix dimension',
                            `Dimension "${dim}" in step "${step.properties?.label}" has no values`,
                            'Each dimension must have an array of values'
                        );
                    } else {
                        totalJobs *= values.length;
                    }
                });

                if (totalJobs > 100) {
                    this.addError(
                        'Matrix generates too many jobs',
                        `Step "${step.properties?.label}" generates ${totalJobs} jobs (max 100)`,
                        'Reduce the number of matrix combinations'
                    );
                } else if (totalJobs > 50) {
                    this.addWarning(
                        'Large matrix configuration',
                        `Step "${step.properties?.label}" generates ${totalJobs} jobs`,
                        'Consider if all combinations are necessary'
                    );
                }
            }
        });
    }

    // 5. YAML syntax validation
    validateYAMLSyntax(yamlString) {
        if (!yamlString || yamlString.trim() === '') {
            this.addError(
                'Empty YAML',
                'The YAML content is empty',
                'Generate or write pipeline configuration'
            );
            return;
        }

        // Check for tabs
        if (yamlString.includes('\t')) {
            const lines = yamlString.split('\n');
            const tabLines = [];
            lines.forEach((line, idx) => {
                if (line.includes('\t')) {
                    tabLines.push(idx + 1);
                }
            });
            this.addError(
                'Tabs found in YAML',
                `YAML must use spaces, not tabs. Found tabs on lines: ${tabLines.join(', ')}`,
                'Replace all tabs with spaces'
            );
        }

        // Check for trailing spaces
        const lines = yamlString.split('\n');
        const trailingSpaceLines = [];
        lines.forEach((line, idx) => {
            if (line.endsWith(' ')) {
                trailingSpaceLines.push(idx + 1);
            }
        });
        if (trailingSpaceLines.length > 0) {
            this.addWarning(
                'Trailing spaces found',
                `Lines with trailing spaces: ${trailingSpaceLines.join(', ')}`,
                'Remove trailing spaces for cleaner YAML'
            );
        }

        // Check for steps declaration
        if (!yamlString.includes('steps:')) {
            this.addError(
                'Missing steps declaration',
                'YAML must contain a "steps:" field',
                'Add "steps:" at the beginning of your pipeline'
            );
        }

        // Check indentation consistency
        const indentLevels = new Set();
        lines.forEach(line => {
            const match = line.match(/^(\s*)/);
            if (match && match[1].length > 0) {
                indentLevels.add(match[1].length);
            }
        });
        
        const indentArray = Array.from(indentLevels).sort((a, b) => a - b);
        let inconsistent = false;
        for (let i = 1; i < indentArray.length; i++) {
            if (indentArray[i] % indentArray[0] !== 0) {
                inconsistent = true;
                break;
            }
        }
        
        if (inconsistent) {
            this.addWarning(
                'Inconsistent indentation',
                'YAML indentation levels are not consistent',
                'Use consistent spacing (2 or 4 spaces per level)'
            );
        }
    }

    // 6. Buildkite-specific rules
    validateBuildkiteRules(steps) {
        // Check for wait steps between parallel groups
        let lastWasParallel = false;
        steps.forEach((step, idx) => {
            const hasParallelism = step.properties?.parallelism > 1;
            const hasMatrix = !!step.properties?.matrix;
            const isParallel = hasParallelism || hasMatrix;
            
            if (lastWasParallel && isParallel && step.type !== 'wait') {
                // Check if there's a wait step between
                let hasWaitBetween = false;
                if (idx > 0 && steps[idx - 1].type === 'wait') {
                    hasWaitBetween = true;
                }
                
                if (!hasWaitBetween) {
                    this.addWarning(
                        'Missing wait between parallel steps',
                        `Consider adding a wait step between parallel executions at position ${idx}`,
                        'This ensures proper synchronization'
                    );
                }
            }
            
            lastWasParallel = isParallel;
        });

        // Validate artifact paths
        steps.forEach(step => {
            const artifactPaths = step.properties?.artifact_paths;
            if (artifactPaths) {
                if (typeof artifactPaths === 'string') {
                    // Single path is ok
                } else if (Array.isArray(artifactPaths)) {
                    if (artifactPaths.length === 0) {
                        this.addWarning(
                            'Empty artifact paths',
                            `Step "${step.properties?.label}" has empty artifact_paths array`,
                            'Remove artifact_paths or add paths to upload'
                        );
                    }
                } else {
                    this.addError(
                        'Invalid artifact_paths format',
                        `Step "${step.properties?.label}" has invalid artifact_paths`,
                        'artifact_paths must be a string or array of strings'
                    );
                }
            }
        });
    }

    // 7. Best practices validation
    validateBestPractices(steps) {
        // Check for missing keys on important steps
        const importantSteps = steps.filter(s => 
            s.type === 'command' || 
            s.type === 'block' || 
            s.type === 'input'
        );
        
        importantSteps.forEach(step => {
            if (!step.properties?.key) {
                this.addInfo(
                    'Consider adding step keys',
                    `Step "${step.properties?.label || 'Unknown'}" has no key`,
                    'Keys help with dependencies and build insights'
                );
            }
        });

        // Check for very long pipelines
        if (steps.length > 50) {
            this.addWarning(
                'Large pipeline',
                `Pipeline has ${steps.length} steps`,
                'Consider breaking into multiple pipelines or using dynamic pipeline uploads'
            );
        }

        // Check for missing labels
        steps.forEach((step, idx) => {
            if (step.type !== 'wait' && !step.properties?.label) {
                this.addInfo(
                    'Missing step label',
                    `Step ${idx + 1} (${step.type}) has no label`,
                    'Labels make builds easier to understand'
                );
            }
        });
    }

    // Conditional validation
    validateConditional(condition, stepLabel) {
        if (typeof condition !== 'string') {
            this.addError(
                'Invalid conditional format',
                `Step "${stepLabel}" has non-string conditional`,
                'Conditionals must be strings'
            );
            return;
        }

        // Check for common conditional syntax errors
        const validOperators = ['==', '!=', '=~', '!~', '&&', '||'];
        const hasValidOperator = validOperators.some(op => condition.includes(op));
        
        if (!hasValidOperator && !condition.includes('build.') && !condition.includes('pipeline.')) {
            this.addWarning(
                'Suspicious conditional',
                `Step "${stepLabel}" has conditional: "${condition}"`,
                'Conditionals typically use build.* or pipeline.* variables with operators'
            );
        }
    }

    // Plugin validation
    validatePlugins(plugins, stepLabel) {
        if (typeof plugins !== 'object' || Array.isArray(plugins)) {
            this.addError(
                'Invalid plugins format',
                `Step "${stepLabel}" has invalid plugins configuration`,
                'Plugins must be an object'
            );
            return;
        }

        Object.entries(plugins).forEach(([pluginName, config]) => {
            // Check for null configs
            if (config === null) {
                this.addWarning(
                    'Null plugin configuration',
                    `Plugin "${pluginName}" in step "${stepLabel}" has null configuration`,
                    'Consider removing or configuring the plugin'
                );
            }
        });
    }

    // Retry validation
    validateRetry(retry, stepLabel) {
        if (typeof retry === 'object') {
            if (retry.automatic) {
                if (!Array.isArray(retry.automatic)) {
                    this.addError(
                        'Invalid retry configuration',
                        `Step "${stepLabel}" has invalid automatic retry configuration`,
                        'retry.automatic must be an array of retry rules'
                    );
                } else {
                    retry.automatic.forEach((rule, idx) => {
                        if (!rule.exit_status && !rule.signal && !rule.limit) {
                            this.addWarning(
                                'Incomplete retry rule',
                                `Retry rule ${idx + 1} in step "${stepLabel}" has no conditions`,
                                'Add exit_status, signal, or other conditions'
                            );
                        }
                    });
                }
            }
            
            if (retry.manual && typeof retry.manual !== 'boolean') {
                if (!retry.manual.allowed || !retry.manual.reason) {
                    this.addWarning(
                        'Incomplete manual retry configuration',
                        `Step "${stepLabel}" has incomplete manual retry settings`,
                        'Specify allowed and reason for manual retry'
                    );
                }
            }
        }
    }

    // Helper methods
    addError(title, message, suggestion = '') {
        this.errors.push({
            type: 'error',
            title,
            message,
            suggestion
        });
    }

    addWarning(title, message, suggestion = '') {
        this.warnings.push({
            type: 'warning',
            title,
            message,
            suggestion
        });
    }

    addInfo(title, message, suggestion = '') {
        this.info.push({
            type: 'info',
            title,
            message,
            suggestion
        });
    }

    generateSummary() {
        const total = this.errors.length + this.warnings.length + this.info.length;
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            return {
                icon: '✅',
                text: 'Pipeline validation passed!',
                details: this.info.length > 0 ? `${this.info.length} suggestions` : 'No issues found'
            };
        } else if (this.errors.length > 0) {
            return {
                icon: '❌',
                text: 'Pipeline validation failed',
                details: `${this.errors.length} errors, ${this.warnings.length} warnings`
            };
        } else {
            return {
                icon: '⚠️',
                text: 'Pipeline has warnings',
                details: `${this.warnings.length} warnings, ${this.info.length} suggestions`
            };
        }
    }

    // Format validation results for display
    formatResults(results) {
        let html = '<div class="validation-results">';
        
        // Summary
        html += `
            <div class="validation-summary ${results.valid ? 'valid' : 'invalid'}">
                <h3>${results.summary.icon} ${results.summary.text}</h3>
                <p>${results.summary.details}</p>
            </div>
        `;

        // Errors
        if (results.errors.length > 0) {
            html += '<div class="validation-section errors">';
            html += '<h4><i class="fas fa-times-circle"></i> Errors</h4>';
            results.errors.forEach(error => {
                html += this.formatIssue(error);
            });
            html += '</div>';
        }

        // Warnings
        if (results.warnings.length > 0) {
            html += '<div class="validation-section warnings">';
            html += '<h4><i class="fas fa-exclamation-triangle"></i> Warnings</h4>';
            results.warnings.forEach(warning => {
                html += this.formatIssue(warning);
            });
            html += '</div>';
        }

        // Info
        if (results.info.length > 0) {
            html += '<div class="validation-section info">';
            html += '<h4><i class="fas fa-info-circle"></i> Suggestions</h4>';
            results.info.forEach(info => {
                html += this.formatIssue(info);
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    formatIssue(issue) {
        return `
            <div class="validation-issue ${issue.type}">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-message">${issue.message}</div>
                ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
            </div>
        `;
    }
}

// Create singleton instance
window.unifiedValidator = new UnifiedValidator();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnifiedValidator;
}