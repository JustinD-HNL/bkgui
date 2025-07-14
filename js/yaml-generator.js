// js/yaml-generator.js
// Enhanced YAML Generator for Buildkite Pipeline Builder
/**
 * Handles conversion of pipeline configuration to valid Buildkite YAML
 * Now with enhanced validation and formatting
 * Supports all Buildkite features including:
 * - Artifact paths
 * - Cancel on build failing
 * - Enhanced soft fail options
 * - Manual retry configuration
 */

class YAMLGenerator {
    constructor() {
        this.indentSize = 2;
        this.currentIndent = 0;
        
        // Performance optimization: memoization
        this.memoizedGenerateStep = null;
        this.memoizedFormatValue = null;
        this.initializeMemoization();
        
        this.validationRules = {
            required: ['steps'],
            stepTypes: ['command', 'wait', 'block', 'input', 'trigger', 'group', 'annotation', 'notify'],
            conditionalOperators: ['==', '!=', '=~', '!~', '<', '>', '<=', '>='],
            logicalOperators: ['&&', '||'],
            buildkiteVariables: [
                'build.branch',
                'build.tag',
                'build.commit',
                'build.message',
                'build.source',
                'build.creator.name',
                'build.creator.email',
                'build.number',
                'build.pull_request.id',
                'build.pull_request.base_branch',
                'pipeline.slug',
                'organization.slug'
            ]
        };
    }

    initializeMemoization() {
        if (window.performanceUtils) {
            // Memoize expensive operations
            this.memoizedGenerateStep = window.performanceUtils.memoize(
                this.generateStepInternal.bind(this),
                (step) => JSON.stringify(step)
            );
            
            this.memoizedFormatValue = window.performanceUtils.memoize(
                this.formatValueInternal.bind(this),
                (value) => JSON.stringify(value)
            );
        }
    }

    generate(pipelineConfig) {
        if (!pipelineConfig || !pipelineConfig.steps || pipelineConfig.steps.length === 0) {
            return 'steps: []';
        }

        let yaml = '';
        
        // Add global environment variables if available
        if (window.envVarManager) {
            const globalVars = window.envVarManager.getGlobalVariables();
            if (Object.keys(globalVars).length > 0) {
                yaml += 'env:\n';
                Object.entries(globalVars).forEach(([key, value]) => {
                    yaml += `  ${key}: ${this.quote(value)}\n`;
                });
                yaml += '\n';
            }
        }
        
        yaml += 'steps:\n';
        this.currentIndent = 1;

        pipelineConfig.steps.forEach((step, index) => {
            if (step === 'wait') {
                yaml += this.indent() + '- wait\n';
            } else {
                yaml += this.generateStep(step);
            }
            
            // Add blank line between steps for readability
            if (index < pipelineConfig.steps.length - 1) {
                yaml += '\n';
            }
        });

        return yaml.trim();
    }

    generateStep(step) {
        // Use memoized version if available
        if (this.memoizedGenerateStep) {
            return this.memoizedGenerateStep(step);
        }
        return this.generateStepInternal(step);
    }

    generateStepInternal(step) {
        let yaml = '';

        // Handle different step types
        if (step.command) {
            yaml += this.generateCommandStep(step);
        } else if (step.block) {
            yaml += this.generateBlockStep(step);
        } else if (step.input) {
            yaml += this.generateInputStep(step);
        } else if (step.trigger) {
            yaml += this.generateTriggerStep(step);
        } else if (step.group) {
            yaml += this.generateGroupStep(step);
        } else if (step.annotate) {
            yaml += this.generateAnnotationStep(step);
        } else if (step.notify) {
            yaml += this.generateNotifyStep(step);
        } else if (step.plugins && Object.keys(step.plugins).length > 0 && !step.command) {
            yaml += this.generatePluginStep(step);
        }

        return yaml;
    }

    generateCommandStep(step) {
        let yaml = '';
        
        // Single line command
        if (this.isSimpleCommand(step)) {
            yaml += this.indent() + `- command: ${this.quote(step.command)}\n`;
        } else {
            yaml += this.indent() + '- ';
            this.currentIndent++;
            
            // Label
            if (step.label) {
                yaml += `label: ${this.quote(step.label)}\n`;
            }
            
            // Command(s)
            if (step.command) {
                if (!step.label) {
                    // If no label, command goes on same line as dash
                    if (step.command.includes('\n')) {
                        yaml += 'commands:\n';
                        this.currentIndent++;
                        step.command.split('\n').forEach(cmd => {
                            yaml += this.indent() + `- ${this.quote(cmd.trim())}\n`;
                        });
                        this.currentIndent--;
                    } else {
                        yaml += `command: ${this.quote(step.command)}\n`;
                    }
                } else {
                    // If label exists, command is indented
                    if (step.command.includes('\n')) {
                        yaml += this.indent() + 'commands:\n';
                        this.currentIndent++;
                        step.command.split('\n').forEach(cmd => {
                            yaml += this.indent() + `- ${this.quote(cmd.trim())}\n`;
                        });
                        this.currentIndent--;
                    } else {
                        yaml += this.indent() + `command: ${this.quote(step.command)}\n`;
                    }
                }
            }
            
            // Environment variables
            if (step.env && Object.keys(step.env).length > 0) {
                yaml += this.indent() + 'env:\n';
                this.currentIndent++;
                Object.entries(step.env).forEach(([key, value]) => {
                    yaml += this.indent() + `${key}: ${this.quote(value)}\n`;
                });
                this.currentIndent--;
            }
            
            // Plugins
            if (step.plugins && Object.keys(step.plugins).length > 0) {
                yaml += this.generatePlugins(step.plugins);
            }
            
            // Parallelism
            if (step.parallelism) {
                yaml += this.indent() + `parallelism: ${step.parallelism}\n`;
            }
            
            // Timeout
            if (step.timeout_in_minutes) {
                yaml += this.indent() + `timeout_in_minutes: ${step.timeout_in_minutes}\n`;
            }
            
            // Matrix
            if (step.matrix && Object.keys(step.matrix).length > 0) {
                yaml += this.generateMatrix(step.matrix);
            }
            
            // Artifact paths
            if (step.artifact_paths) {
                if (Array.isArray(step.artifact_paths)) {
                    if (step.artifact_paths.length === 1) {
                        yaml += this.indent() + `artifact_paths: ${this.quote(step.artifact_paths[0])}\n`;
                    } else {
                        yaml += this.indent() + 'artifact_paths:\n';
                        this.currentIndent++;
                        step.artifact_paths.forEach(path => {
                            yaml += this.indent() + `- ${this.quote(path)}\n`;
                        });
                        this.currentIndent--;
                    }
                } else {
                    yaml += this.indent() + `artifact_paths: ${this.quote(step.artifact_paths)}\n`;
                }
            }
            
            // Common properties
            yaml += this.generateCommonProperties(step);
            
            // Retry
            if (step.retry && (step.retry.automatic || step.retry.manual)) {
                yaml += this.indent() + 'retry:\n';
                this.currentIndent++;
                
                if (step.retry.automatic && (Array.isArray(step.retry.automatic) ? step.retry.automatic.length > 0 : Object.keys(step.retry.automatic).length > 0)) {
                    yaml += this.indent() + 'automatic:\n';
                    this.currentIndent++;
                    
                    if (Array.isArray(step.retry.automatic)) {
                        // Handle array format: [{exit_status: -1, limit: 2}]
                        step.retry.automatic.forEach(retryConfig => {
                            yaml += this.indent() + '-';
                            if (typeof retryConfig === 'object') {
                                if (Object.keys(retryConfig).length === 1 && retryConfig.exit_status !== undefined) {
                                    // Simple format: - exit_status: -1
                                    yaml += ` exit_status: ${this.quote(retryConfig.exit_status)}\n`;
                                } else {
                                    // Complex format with multiple properties
                                    yaml += '\n';
                                    this.currentIndent++;
                                    Object.entries(retryConfig).forEach(([key, value]) => {
                                        yaml += this.indent() + `${key}: ${this.quote(value)}\n`;
                                    });
                                    this.currentIndent--;
                                }
                            } else {
                                yaml += ` ${this.quote(retryConfig)}\n`;
                            }
                        });
                    } else {
                        // Handle object format (legacy)
                        if (step.retry.automatic.exit_status) {
                            yaml += this.indent() + `exit_status: ${this.quote(step.retry.automatic.exit_status)}\n`;
                        }
                        
                        if (step.retry.automatic.limit) {
                            yaml += this.indent() + `limit: ${step.retry.automatic.limit}\n`;
                        }
                        
                        if (step.retry.automatic.delay) {
                            yaml += this.indent() + `delay: ${step.retry.automatic.delay}\n`;
                        }
                    }
                    
                    this.currentIndent--;
                }
                
                if (step.retry.manual && Object.keys(step.retry.manual).length > 0) {
                    yaml += this.indent() + 'manual:\n';
                    this.currentIndent++;
                    
                    if (step.retry.manual.allowed !== undefined) {
                        yaml += this.indent() + `allowed: ${step.retry.manual.allowed}\n`;
                    }
                    
                    if (step.retry.manual.permit_on_passed !== undefined) {
                        yaml += this.indent() + `permit_on_passed: ${step.retry.manual.permit_on_passed}\n`;
                    }
                    
                    if (step.retry.manual.reason) {
                        yaml += this.indent() + `reason: ${this.quote(step.retry.manual.reason)}\n`;
                    }
                    
                    this.currentIndent--;
                }
                
                this.currentIndent--;
            }
            
            // Soft fail
            if (step.soft_fail !== undefined && step.soft_fail !== false) {
                if (step.soft_fail === true) {
                    yaml += this.indent() + 'soft_fail: true\n';
                } else if (Array.isArray(step.soft_fail)) {
                    // For array format, check if it's already in the correct format
                    if (step.soft_fail.length > 0 && typeof step.soft_fail[0] === 'object' && 'exit_status' in step.soft_fail[0]) {
                        // Already in correct format: [{exit_status: 1}, {exit_status: 2}]
                        yaml += this.indent() + 'soft_fail:\n';
                        this.currentIndent++;
                        step.soft_fail.forEach(item => {
                            yaml += this.indent() + `- exit_status: ${item.exit_status}\n`;
                        });
                        this.currentIndent--;
                    } else {
                        // Array of numbers: [1, 2, 3] - convert to correct format
                        yaml += this.indent() + 'soft_fail:\n';
                        this.currentIndent++;
                        step.soft_fail.forEach(code => {
                            yaml += this.indent() + `- exit_status: ${code}\n`;
                        });
                        this.currentIndent--;
                    }
                } else if (typeof step.soft_fail === 'object' && step.soft_fail.exit_status) {
                    // Handle object format { exit_status: [1, 2] } - convert to array format
                    yaml += this.indent() + 'soft_fail:\n';
                    this.currentIndent++;
                    const exitStatuses = Array.isArray(step.soft_fail.exit_status) ? step.soft_fail.exit_status : [step.soft_fail.exit_status];
                    exitStatuses.forEach(code => {
                        yaml += this.indent() + `- exit_status: ${code}\n`;
                    });
                    this.currentIndent--;
                } else {
                    yaml += this.indent() + `soft_fail: ${this.quote(step.soft_fail)}\n`;
                }
            }
            
            // Cancel on build failing
            if (step.cancel_on_build_failing) {
                yaml += this.indent() + 'cancel_on_build_failing: true\n';
            }
            
            // Skip
            if (step.skip) {
                yaml += this.indent() + 'skip: true\n';
            }
            
            // Allow dependency failure
            if (step.allow_dependency_failure) {
                yaml += this.indent() + 'allow_dependency_failure: true\n';
            }
            
            this.currentIndent--;
        }
        
        return yaml;
    }

    generateBlockStep(step) {
        let yaml = '';
        
        if (this.isSimpleBlock(step)) {
            yaml += this.indent() + `- block: ${this.quote(step.block || step.prompt)}\n`;
        } else {
            yaml += this.indent() + '- ';
            this.currentIndent++;
            
            yaml += `block: ${this.quote(step.block || step.prompt || 'Block')}\n`;
            
            // Label (from version 2)
            if (step.label && step.label !== step.block && step.label !== step.prompt) {
                yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
            }
            
            // Note: key is not valid at step level for block steps - only on fields
            
            if (step.fields && step.fields.length > 0) {
                yaml += this.indent() + 'fields:\n';
                this.currentIndent++;
                step.fields.forEach(field => {
                    yaml += this.generateField(field);
                });
                this.currentIndent--;
            }
            
            if (step.blocked_state && step.blocked_state !== 'passed') {
                yaml += this.indent() + `blocked_state: ${step.blocked_state}\n`;
            }
            
            yaml += this.generateCommonProperties(step);
            
            this.currentIndent--;
        }
        
        return yaml;
    }

    generateInputStep(step) {
        let yaml = this.indent() + '- ';
        this.currentIndent++;
        
        yaml += `input: ${this.quote(step.input || step.prompt || 'Input')}\n`;
        
        // Label handling from version 2
        if (step.label && step.label !== step.input && step.label !== step.prompt) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
        // Note: key is not valid at step level for input steps - only on fields
        
        if (step.fields && step.fields.length > 0) {
            yaml += this.indent() + 'fields:\n';
            this.currentIndent++;
            step.fields.forEach(field => {
                yaml += this.generateField(field);
            });
            this.currentIndent--;
        }
        
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generateTriggerStep(step) {
        let yaml = this.indent() + '- ';
        this.currentIndent++;
        
        yaml += `trigger: ${this.quote(step.trigger)}\n`;
        
        if (step.label) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
        if (step.async) {
            yaml += this.indent() + 'async: true\n';
        }
        
        if (step.build && Object.keys(step.build).length > 0) {
            yaml += this.indent() + 'build:\n';
            this.currentIndent++;
            
            // Order from version 2
            if (step.build.branch) {
                yaml += this.indent() + `branch: ${this.quote(step.build.branch)}\n`;
            }
            
            if (step.build.commit) {
                yaml += this.indent() + `commit: ${this.quote(step.build.commit)}\n`;
            }
            
            if (step.build.message) {
                yaml += this.indent() + `message: ${this.quote(step.build.message)}\n`;
            }
            
            if (step.build.env) {
                yaml += this.indent() + 'env:\n';
                this.currentIndent++;
                Object.entries(step.build.env).forEach(([key, value]) => {
                    yaml += this.indent() + `${key}: ${this.quote(value)}\n`;
                });
                this.currentIndent--;
            }
            
            // Meta data from version 2
            if (step.build.meta_data) {
                yaml += this.indent() + 'meta_data:\n';
                this.currentIndent++;
                Object.entries(step.build.meta_data).forEach(([key, value]) => {
                    yaml += this.indent() + `${key}: ${this.quote(value)}\n`;
                });
                this.currentIndent--;
            }
            
            this.currentIndent--;
        }
        
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generateGroupStep(step) {
        let yaml = this.indent() + '- ';
        this.currentIndent++;
        
        yaml += `group: ${this.quote(step.group || 'Group')}\n`;
        
        // Label from version 2
        if (step.label && step.label !== step.group) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
        // Note: key is not valid at step level for group steps - removed
        
        if (step.steps && step.steps.length > 0) {
            yaml += this.indent() + 'steps:\n';
            this.currentIndent++;
            step.steps.forEach(subStep => {
                yaml += this.generateStep(subStep);
            });
            this.currentIndent--;
        }
        
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generateAnnotationStep(step) {
        // Check which version's approach to use
        if (step.annotate && typeof step.annotate === 'object') {
            // Version 2 approach - structured annotation
            let yaml = this.indent() + '- ';
            this.currentIndent++;
            
            if (step.label) {
                yaml += `label: ${this.quote(step.label)}\n`;
                yaml += this.indent() + 'annotate:\n';
            } else {
                yaml += 'annotate:\n';
            }
            
            this.currentIndent++;
            
            yaml += this.indent() + `body: ${this.quote(step.annotate.body || step.body || '')}\n`;
            yaml += this.indent() + `style: ${step.annotate.style || step.style || 'info'}\n`;
            yaml += this.indent() + `context: ${this.quote(step.annotate.context || step.context || 'default')}\n`;
            
            if (step.annotate.append || step.append) {
                yaml += this.indent() + 'append: true\n';
            }
            
            this.currentIndent--;
            
            yaml += this.generateCommonProperties(step);
            
            this.currentIndent--;
            return yaml;
        } else {
            // Version 1 approach - command-based annotation
            let yaml = this.indent() + '- ';
            this.currentIndent++;
            
            yaml += `command: buildkite-agent annotate ${this.quote(step.body || step.annotate || '')}`;
            
            if (step.style && step.style !== 'info') {
                yaml += ` --style ${step.style}`;
            }
            
            if (step.context && step.context !== 'default') {
                yaml += ` --context ${this.quote(step.context)}`;
            }
            
            if (step.append) {
                yaml += ' --append';
            }
            
            yaml += '\n';
            
            if (step.label) {
                yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
            }
            
            yaml += this.generateCommonProperties(step);
            
            this.currentIndent--;
            return yaml;
        }
    }

    generateNotifyStep(step) {
        // Version 2 structured approach
        let yaml = this.indent() + '- ';
        this.currentIndent++;
        
        if (step.label) {
            yaml += `label: ${this.quote(step.label)}\n`;
        }
        
        // Build notify array
        const notifications = step.notify || [];
        if (!Array.isArray(notifications)) {
            // Convert from properties to array format
            const notifyArray = [];
            if (step.email) notifyArray.push({ email: step.email });
            if (step.slack) notifyArray.push({ slack: step.slack });
            if (step.webhook) notifyArray.push({ webhook: step.webhook });
            if (step.pagerduty) notifyArray.push({ pagerduty_change_event: step.pagerduty });
            
            if (notifyArray.length > 0) {
                yaml += this.indent() + 'notify:\n';
                this.currentIndent++;
                
                notifyArray.forEach(notification => {
                    if (Object.keys(notification).length === 1) {
                        // Simple notification
                        const [key, value] = Object.entries(notification)[0];
                        yaml += this.indent() + `- ${key}: ${this.quote(value)}\n`;
                    } else {
                        // Complex notification
                        yaml += this.indent() + '-\n';
                        this.currentIndent++;
                        Object.entries(notification).forEach(([key, value]) => {
                            yaml += this.indent() + `${key}: ${this.quote(value)}\n`;
                        });
                        this.currentIndent--;
                    }
                });
                
                this.currentIndent--;
            }
        }
        
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generatePluginStep(step) {
        let yaml = this.indent() + '- ';
        this.currentIndent++;
        
        if (step.label) {
            yaml += `label: ${this.quote(step.label)}\n`;
        }
        
        if (step.key) {
            yaml += this.indent() + `key: ${this.quote(step.key)}\n`;
        }
        
        yaml += this.generatePlugins(step.plugins);
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generatePlugins(plugins) {
        let yaml = this.indent() + 'plugins:\n';
        this.currentIndent++;
        
        Object.entries(plugins).forEach(([pluginName, config]) => {
            // Version 1 includes version, version 2 doesn't
            const pluginKey = pluginName.includes('#') ? pluginName : `${pluginName}#v3.0.0`;
            yaml += this.indent() + `- ${pluginKey}:\n`;
            this.currentIndent++;
            
            if (typeof config === 'object' && config !== null && Object.keys(config).length > 0) {
                Object.entries(config).forEach(([key, value]) => {
                    if (value !== '' && value !== null && value !== undefined) {
                        if (Array.isArray(value)) {
                            yaml += this.indent() + `${key}:\n`;
                            this.currentIndent++;
                            value.forEach(item => {
                                yaml += this.indent() + `- ${this.quote(item)}\n`;
                            });
                            this.currentIndent--;
                        } else if (typeof value === 'object' && value !== null) {
                            yaml += this.indent() + `${key}:\n`;
                            this.currentIndent++;
                            Object.entries(value).forEach(([k, v]) => {
                                yaml += this.indent() + `${k}: ${this.quote(v)}\n`;
                            });
                            this.currentIndent--;
                        } else {
                            yaml += this.indent() + `${key}: ${this.formatValue(value)}\n`;
                        }
                    }
                });
            } else {
                // Empty plugin config - add placeholder to maintain valid YAML structure
                yaml += this.indent() + '# Plugin configuration\n';
            }
            
            this.currentIndent--;
        });
        
        this.currentIndent--;
        return yaml;
    }

    generateMatrix(matrix) {
        let yaml = this.indent() + 'matrix:\n';
        this.currentIndent++;
        
        const entries = Object.entries(matrix);
        
        if (entries.length === 1) {
            // Simple format for single dimension
            const [key, values] = entries[0];
            yaml += this.indent() + `- ${key}:\n`;
            this.currentIndent++;
            values.forEach(value => {
                yaml += this.indent() + `- ${this.quote(value)}\n`;
            });
            this.currentIndent--;
        } else {
            // Complex format for multiple dimensions
            yaml += this.indent() + '-\n';
            this.currentIndent++;
            entries.forEach(([key, values]) => {
                yaml += this.indent() + `${key}:\n`;
                this.currentIndent++;
                values.forEach(value => {
                    yaml += this.indent() + `- ${this.quote(value)}\n`;
                });
                this.currentIndent--;
            });
            this.currentIndent--;
        }
        
        this.currentIndent--;
        return yaml;
    }

    generateCommonProperties(step) {
        let yaml = '';
        
        // Key - conditional from version 1
        if (step.key && !['block', 'input', 'trigger', 'group'].includes(this.getStepType(step))) {
            yaml += this.indent() + `key: ${this.quote(step.key)}\n`;
        }
        
        // Dependencies
        if (step.depends_on) {
            if (Array.isArray(step.depends_on)) {
                if (step.depends_on.length === 1) {
                    yaml += this.indent() + `depends_on: ${this.quote(step.depends_on[0])}\n`;
                } else {
                    yaml += this.indent() + 'depends_on:\n';
                    this.currentIndent++;
                    step.depends_on.forEach(dep => {
                        yaml += this.indent() + `- ${this.quote(dep)}\n`;
                    });
                    this.currentIndent--;
                }
            } else {
                yaml += this.indent() + `depends_on: ${this.quote(step.depends_on)}\n`;
            }
        }
        
        // Allow dependency failure
        if (step.allow_dependency_failure) {
            yaml += this.indent() + 'allow_dependency_failure: true\n';
        }
        
        // Conditions
        if (step.if) {
            yaml += this.indent() + `if: ${this.quote(step.if)}\n`;
        }
        
        if (step.unless) {
            yaml += this.indent() + `unless: ${this.quote(step.unless)}\n`;
        }
        
        // Branches
        if (step.branches) {
            yaml += this.indent() + `branches: ${this.quote(step.branches)}\n`;
        }
        
        // Skip
        if (step.skip) {
            yaml += this.indent() + 'skip: true\n';
        }
        
        // Agents
        if (step.agents && Object.keys(step.agents).length > 0) {
            yaml += this.indent() + 'agents:\n';
            this.currentIndent++;
            Object.entries(step.agents).forEach(([key, value]) => {
                yaml += this.indent() + `${key}: ${this.quote(value)}\n`;
            });
            this.currentIndent--;
        }
        
        // Custom attributes
        if (step.customAttributes && Object.keys(step.customAttributes).length > 0) {
            Object.entries(step.customAttributes).forEach(([key, value]) => {
                // Skip empty keys
                if (key && !key.startsWith('custom_attr_')) {
                    yaml += this.indent() + `${key}: ${this.formatValue(value)}\n`;
                }
            });
        }
        
        return yaml;
    }

    generateField(field) {
        let yaml = this.indent() + '-';
        
        // Determine field type and generate accordingly
        if (field.type === 'select' || (field.options && field.options.length > 0)) {
            // Select field format
            yaml += ` select: ${this.quote(field.text || field.label || '')}\n`;
            this.currentIndent++;
            
            yaml += this.indent() + `key: ${this.quote(field.key)}\n`;
            
            if (field.hint) {
                yaml += this.indent() + `hint: ${this.quote(field.hint)}\n`;
            }
            
            if (field.required) {
                yaml += this.indent() + 'required: true\n';
            }
            
            if (field.default !== undefined) {
                if (field.multiple && Array.isArray(field.default)) {
                    yaml += this.indent() + 'default:\n';
                    this.currentIndent++;
                    field.default.forEach(val => {
                        yaml += this.indent() + `- ${this.quote(val)}\n`;
                    });
                    this.currentIndent--;
                } else {
                    yaml += this.indent() + `default: ${this.quote(field.default)}\n`;
                }
            }
            
            if (field.multiple) {
                yaml += this.indent() + 'multiple: true\n';
            }
            
            if (field.options && field.options.length > 0) {
                yaml += this.indent() + 'options:\n';
                this.currentIndent++;
                field.options.forEach(option => {
                    if (typeof option === 'object') {
                        yaml += this.indent() + `- label: ${this.quote(option.label)}\n`;
                        this.currentIndent++;
                        yaml += this.indent() + `value: ${this.quote(option.value)}\n`;
                        this.currentIndent--;
                    } else {
                        yaml += this.indent() + `- label: ${this.quote(option)}\n`;
                        this.currentIndent++;
                        yaml += this.indent() + `value: ${this.quote(option)}\n`;
                        this.currentIndent--;
                    }
                });
                this.currentIndent--;
            }
        } else {
            // Text field format (default)
            yaml += ` text: ${this.quote(field.text || field.label || '')}\n`;
            this.currentIndent++;
            
            yaml += this.indent() + `key: ${this.quote(field.key)}\n`;
            
            if (field.hint) {
                yaml += this.indent() + `hint: ${this.quote(field.hint)}\n`;
            }
            
            if (field.required) {
                yaml += this.indent() + 'required: true\n';
            }
            
            if (field.default !== undefined) {
                yaml += this.indent() + `default: ${this.quote(field.default)}\n`;
            }
        }
        
        this.currentIndent--;
        return yaml;
    }

    formatValue(value) {
        // Use memoized version if available
        if (this.memoizedFormatValue) {
            return this.memoizedFormatValue(value);
        }
        return this.formatValueInternal(value);
    }

    formatValueInternal(value) {
        if (typeof value === 'boolean') {
            return value;
        } else if (typeof value === 'number') {
            return value;
        } else if (Array.isArray(value)) {
            return '\n' + value.map(v => this.indent() + `  - ${this.quote(v)}`).join('\n');
        } else if (typeof value === 'object') {
            let result = '\n';
            Object.entries(value).forEach(([k, v]) => {
                result += this.indent() + `  ${k}: ${this.quote(v)}\n`;
            });
            return result.trimEnd();
        } else {
            return this.quote(value);
        }
    }

    isSimpleCommand(step) {
        // Enhanced from version 1
        return step.command && 
               !step.label && 
               !step.env && 
               !step.plugins && 
               !step.depends_on && 
               !step.if && 
               !step.timeout_in_minutes &&
               !step.retry &&
               !step.artifact_paths &&
               !step.soft_fail &&
               !step.cancel_on_build_failing &&
               !step.command.includes('\n');
    }

    isSimpleBlock(step) {
        return (step.block || step.prompt) && 
               !step.fields && 
               !step.key && 
               !step.depends_on && 
               !step.if;
    }

    getStepType(step) {
        if (step.command) return 'command';
        if (step.block) return 'block';
        if (step.input) return 'input';
        if (step.trigger) return 'trigger';
        if (step.group) return 'group';
        if (step.annotate) return 'annotation';
        if (step.notify) return 'notify';
        if (step.plugins) return 'plugin';
        return 'unknown';
    }

    indent() {
        return ' '.repeat(this.currentIndent * this.indentSize);
    }

    quote(str) {
        if (str === null || str === undefined) return '""';
        
        // Convert to string
        str = String(str);
        
        // Escape Buildkite variables for runtime interpolation
        // Variables that need runtime interpolation (not available in editor)
        const runtimeVariables = [
            'BUILDKITE_PARALLEL_JOB',
            'BUILDKITE_BUILD_NUMBER',
            'BUILDKITE_BUILD_ID',
            'BUILDKITE_JOB_ID',
            'BUILDKITE_BUILD_URL',
            'BUILDKITE_BUILD_META_DATA_[A-Z_]+',
            'BUILDKITE_UNBLOCKER',
            'BUILDKITE_UNBLOCKER_ID',
            'BUILDKITE_UNBLOCKER_EMAIL',
            'BUILDKITE_UNBLOCKER_NAME',
            'BUILDKITE_UNBLOCKER_TEAMS',
            'BUILDKITE_REBUILT_FROM_BUILD_ID',
            'BUILDKITE_REBUILT_FROM_BUILD_NUMBER',
            'BUILDKITE_GROUP_ID',
            'BUILDKITE_GROUP_LABEL',
            'BUILDKITE_GROUP_KEY',
            'BUILDKITE_STEP_ID',
            'BUILDKITE_STEP_KEY',
            'BUILDKITE_PARALLEL_JOB_COUNT',
            'BUILDKITE_ARTIFACT_UPLOAD_EXIT_STATUS',
            'BUILDKITE_COMMAND_EXIT_STATUS',
            'BUILDKITE_LAST_HOOK_EXIT_STATUS',
            'BUILDKITE_BLOCK_STEP_[A-Z_]+'
        ];
        
        // Create regex pattern for runtime variables
        const runtimeVarPattern = new RegExp(
            `\\$\\{(${runtimeVariables.join('|')}|BUILDKITE_BLOCK_STEP_[A-Za-z0-9_]+)\\}`,
            'g'
        );
        
        // Escape $ to $$ for runtime interpolation
        str = str.replace(runtimeVarPattern, '$$${$1}');
        
        // Also handle variables without curly braces
        const noBracesPattern = new RegExp(
            `\\$(${runtimeVariables.join('|')})(?![A-Z_])`,
            'g'
        );
        str = str.replace(noBracesPattern, '$$$1');
        
        // Enhanced quoting logic
        if (this.needsQuotes(str)) {
            // Check for newlines
            if (str.includes('\n')) {
                return `|\n${this.indent()}  ${str.replace(/\n/g, '\n' + this.indent() + '  ')}`;
            }
            
            // Escape quotes and backslashes
            return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
        }
        
        return str;
    }

    needsQuotes(value) {
        // Empty string needs quotes
        if (value === '') return true;
        
        // YAML special values need quotes
        const specialValues = ['true', 'false', 'null', 'yes', 'no', 'on', 'off', '~'];
        if (specialValues.includes(value.toLowerCase())) return true;
        
        // Numbers and hex numbers need quotes
        if (/^(true|false|yes|no|on|off|null|~|\d+(\.\d+)?|0x[0-9a-fA-F]+)$/.test(value)) return true;
        
        // Special characters need quotes
        if (/[:\{\}\[\],&\*#\?\-\|<>=!%@\\]/.test(value)) return true;
        
        // Leading/trailing whitespace needs quotes
        if (/^\s|\s$/.test(value)) return true;
        
        // Multiline strings need special handling
        if (value.includes('\n')) return true;
        
        return false;
    }

    validate(yaml) {
        const issues = [];
        
        // Basic YAML structure validation
        if (!yaml || yaml.trim() === '') {
            issues.push('Empty pipeline');
            return { valid: false, issues };
        }
        
        if (!yaml.includes('steps:')) {
            issues.push('Missing steps declaration');
        }
        
        // Check for common syntax errors
        const lines = yaml.split('\n');
        let inMultilineString = false;
        
        lines.forEach((line, index) => {
            if (line.trim() === '|' || line.trim() === '>') {
                inMultilineString = true;
            } else if (inMultilineString && line.trim() && !line.startsWith('  ')) {
                inMultilineString = false;
            }
            
            // Check for tabs (YAML doesn't allow tabs)
            if (line.includes('\t')) {
                issues.push(`Line ${index + 1}: Contains tabs (use spaces instead)`);
            }
            
            // Check for trailing spaces
            if (line.endsWith(' ')) {
                issues.push(`Line ${index + 1}: Trailing spaces`);
            }
        });
        
        // Check for consistent indentation
        const indentSizes = new Set();
        
        lines.forEach((line, index) => {
            const match = line.match(/^( *)/);
            if (match && match[1].length > 0) {
                indentSizes.add(match[1].length);
            }
        });
        
        if (indentSizes.size > 1) {
            const sizes = Array.from(indentSizes).sort((a, b) => a - b);
            let consistent = true;
            
            for (let i = 1; i < sizes.length; i++) {
                if (sizes[i] % sizes[0] !== 0) {
                    consistent = false;
                    break;
                }
            }
            
            if (!consistent) {
                issues.push('Inconsistent indentation detected.');
            }
        }
        
        // Enhanced validation for Buildkite-specific syntax
        this.validateBuildkiteStructure(yaml, issues);
        
        return {
            valid: issues.length === 0,
            issues
        };
    }

    validateBuildkiteStructure(yamlString, issues) {
        const lines = yamlString.split('\n');
        
        // Check for common Buildkite issues
        lines.forEach((line, index) => {
            // Check for invalid step types
            if (line.match(/^\s*- (command|wait|block|input|trigger|group|annotate|notify):/)) {
                // Valid step type
            } else if (line.match(/^\s*- \w+:/) && !line.includes('plugins:')) {
                // Potentially invalid step type
                const match = line.match(/^\s*- (\w+):/);
                if (match && !this.validationRules.stepTypes.includes(match[1])) {
                    issues.push(`Line ${index + 1}: Unknown step type "${match[1]}"`);
                }
            }
            
            // Check for invalid conditional operators
            if (line.includes('if:') || line.includes('unless:')) {
                const condition = line.split(/if:|unless:/)[1]?.trim();
                if (condition) {
                    const hasValidOperator = this.validationRules.conditionalOperators.some(op => 
                        condition.includes(` ${op} `)
                    );
                    if (!hasValidOperator && !condition.includes('(') && !condition.includes(')')) {
                        issues.push(`Line ${index + 1}: Condition might be missing an operator`);
                    }
                }
            }
            
            // Check for matrix syntax
            if (line.trim() === 'matrix:') {
                // Matrix configuration should follow
                if (index + 1 < lines.length && !lines[index + 1].match(/^\s+-/)) {
                    issues.push(`Line ${index + 1}: Matrix configuration should start with a list`);
                }
            }
        });
    }

    prettify(yaml) {
        // Enhanced prettification combining both versions
        return yaml
            .replace(/^(\s*)-\s*$/gm, '$1<span class="yaml-dash">-</span>')
            .replace(/^(\s*)-\s+/gm, '$1<span class="yaml-dash">-</span> ')
            .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_-]*):(.*)$/gm, 
                '$1<span class="yaml-key">$2</span>:$3')
            .replace(/:\s*"([^"]*)"$/gm, ': <span class="yaml-string">"$1"</span>')
            .replace(/:\s*'([^']*)'$/gm, ': <span class="yaml-string">\'$1\'</span>')
            .replace(/: ([^"'\d\[\{][^\n]*[^,\]\}])$/gm, ': <span class="yaml-string">$1</span>')
            .replace(/:\s*(true|false|yes|no|null)$/gm, 
                ': <span class="yaml-boolean">$1</span>')
            .replace(/:\s*(\d+)$/gm, ': <span class="yaml-number">$1</span>')
            .replace(/^(\s*)#(.*)$/gm, '$1<span class="yaml-comment">#$2</span>')
            .replace(/(build\.\w+(\.\w+)*)/g, '<span class="yaml-variable">$1</span>')
            .replace(/(pipeline\.\w+)/g, '<span class="yaml-variable">$1</span>')
            .replace(/(organization\.\w+)/g, '<span class="yaml-variable">$1</span>');
    }

    // Download YAML file
    downloadYAML(yamlContent, filename = 'pipeline.yml') {
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Format YAML for display
    formatYAML(yamlString) {
        // Clean up and format YAML for better readability
        return yamlString
            .split('\n')
            .map(line => line.trimEnd())
            .join('\n')
            .replace(/\n\n\n+/g, '\n\n');
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.YAMLGenerator = YAMLGenerator;
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YAMLGenerator;
}