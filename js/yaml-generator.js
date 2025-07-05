// js/yaml-generator.js
// Enhanced YAML Generator for Buildkite Pipeline Builder
/**
 * Handles conversion of pipeline configuration to valid Buildkite YAML
 * Now with enhanced validation and formatting
 */

class YAMLGenerator {
    constructor() {
        this.indentSize = 2;
        this.currentIndent = 0;
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

    generate(pipelineConfig) {
        if (!pipelineConfig || !pipelineConfig.steps || pipelineConfig.steps.length === 0) {
            return 'steps: []';
        }

        let yaml = 'steps:\n';
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
        let yaml = this.indent() + '-';
        
        // Single line command
        if (this.isSimpleCommand(step)) {
            yaml += ` command: ${this.quote(step.command)}\n`;
        } else {
            yaml += '\n';
            this.currentIndent++;
            
            // Label
            if (step.label) {
                yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
            }
            
            // Command(s)
            if (step.command) {
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
            
            // Matrix - NEW
            if (step.matrix && Object.keys(step.matrix).length > 0) {
                yaml += this.generateMatrix(step.matrix);
            }
            
            // Common properties
            yaml += this.generateCommonProperties(step);
            
            this.currentIndent--;
        }
        
        return yaml;
    }

    generateBlockStep(step) {
        let yaml = this.indent() + '-';
        
        if (this.isSimpleBlock(step)) {
            yaml += ` block: ${this.quote(step.block)}\n`;
        } else {
            yaml += '\n';
            this.currentIndent++;
            
            yaml += this.indent() + `block: ${this.quote(step.block || step.prompt || 'Block')}\n`;
            
            if (step.label && step.label !== step.block && step.label !== step.prompt) {
                yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
            }
            
            if (step.blocked_state) {
                yaml += this.indent() + `blocked_state: ${step.blocked_state}\n`;
            }
            
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
        }
        
        return yaml;
    }

    generateInputStep(step) {
        let yaml = this.indent() + '-\n';
        this.currentIndent++;
        
        yaml += this.indent() + `input: ${this.quote(step.input || step.prompt || 'Input')}\n`;
        
        if (step.label && step.label !== step.input && step.label !== step.prompt) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
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
        let yaml = this.indent() + '-\n';
        this.currentIndent++;
        
        yaml += this.indent() + `trigger: ${this.quote(step.trigger)}\n`;
        
        if (step.label) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
        if (step.async) {
            yaml += this.indent() + 'async: true\n';
        }
        
        if (step.build && Object.keys(step.build).length > 0) {
            yaml += this.indent() + 'build:\n';
            this.currentIndent++;
            
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
        let yaml = this.indent() + '-\n';
        this.currentIndent++;
        
        yaml += this.indent() + `group: ${this.quote(step.group)}\n`;
        
        if (step.label && step.label !== step.group) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
        if (step.key) {
            yaml += this.indent() + `key: ${this.quote(step.key)}\n`;
        }
        
        if (step.steps && step.steps.length > 0) {
            yaml += this.indent() + 'steps:\n';
            this.currentIndent++;
            step.steps.forEach(groupStep => {
                yaml += this.generateStep(groupStep);
            });
            this.currentIndent--;
        }
        
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generateAnnotationStep(step) {
        let yaml = this.indent() + '-\n';
        this.currentIndent++;
        
        if (step.label) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
        yaml += this.indent() + 'annotate:\n';
        this.currentIndent++;
        
        yaml += this.indent() + `body: ${this.quote(step.annotate?.body || step.body || '')}\n`;
        yaml += this.indent() + `style: ${step.annotate?.style || step.style || 'info'}\n`;
        yaml += this.indent() + `context: ${this.quote(step.annotate?.context || step.context || 'default')}\n`;
        
        if (step.annotate?.append || step.append) {
            yaml += this.indent() + 'append: true\n';
        }
        
        this.currentIndent--;
        
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generateNotifyStep(step) {
        let yaml = this.indent() + '-\n';
        this.currentIndent++;
        
        if (step.label) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
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
        let yaml = this.indent() + '-\n';
        this.currentIndent++;
        
        if (step.label) {
            yaml += this.indent() + `label: ${this.quote(step.label)}\n`;
        }
        
        if (step.key) {
            yaml += this.indent() + `key: ${this.quote(step.key)}\n`;
        }
        
        // Plugins are required for plugin steps
        if (step.plugins) {
            yaml += this.generatePlugins(step.plugins);
        }
        
        yaml += this.generateCommonProperties(step);
        
        this.currentIndent--;
        return yaml;
    }

    generateField(field) {
        let yaml = this.indent() + `- key: ${this.quote(field.key)}\n`;
        this.currentIndent++;
        
        if (field.type && field.type !== 'text') {
            yaml += this.indent() + `type: ${field.type}\n`;
        }
        
        if (field.text) {
            yaml += this.indent() + `text: ${this.quote(field.text)}\n`;
        }
        
        if (field.hint) {
            yaml += this.indent() + `hint: ${this.quote(field.hint)}\n`;
        }
        
        if (field.required) {
            yaml += this.indent() + 'required: true\n';
        }
        
        if (field.default) {
            yaml += this.indent() + `default: ${this.quote(field.default)}\n`;
        }
        
        if (field.type === 'select' && field.options) {
            yaml += this.indent() + 'options:\n';
            this.currentIndent++;
            field.options.forEach(option => {
                if (typeof option === 'string') {
                    yaml += this.indent() + `- label: ${this.quote(option)}\n`;
                    this.currentIndent++;
                    yaml += this.indent() + `value: ${this.quote(option)}\n`;
                    this.currentIndent--;
                } else {
                    yaml += this.indent() + `- label: ${this.quote(option.label)}\n`;
                    this.currentIndent++;
                    yaml += this.indent() + `value: ${this.quote(option.value)}\n`;
                    this.currentIndent--;
                }
            });
            this.currentIndent--;
        }
        
        this.currentIndent--;
        return yaml;
    }

    generatePlugins(plugins) {
        let yaml = this.indent() + 'plugins:\n';
        this.currentIndent++;
        
        Object.entries(plugins).forEach(([pluginName, config]) => {
            yaml += this.indent() + `- ${pluginName}:\n`;
            this.currentIndent++;
            
            if (typeof config === 'object' && config !== null) {
                Object.entries(config).forEach(([key, value]) => {
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
                        yaml += this.indent() + `${key}: ${this.quote(value)}\n`;
                    }
                });
            }
            
            this.currentIndent--;
        });
        
        this.currentIndent--;
        return yaml;
    }

    // Generate Matrix Configuration - NEW
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
        
        // Key
        if (step.key) {
            yaml += this.indent() + `key: ${this.quote(step.key)}\n`;
        }
        
        // Dependencies
        if (step.depends_on) {
            if (Array.isArray(step.depends_on) && step.depends_on.length === 1) {
                yaml += this.indent() + `depends_on: ${this.quote(step.depends_on[0])}\n`;
            } else if (Array.isArray(step.depends_on) && step.depends_on.length > 1) {
                yaml += this.indent() + 'depends_on:\n';
                this.currentIndent++;
                step.depends_on.forEach(dep => {
                    yaml += this.indent() + `- ${this.quote(dep)}\n`;
                });
                this.currentIndent--;
            } else if (typeof step.depends_on === 'string') {
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
        
        // Retry
        if (step.retry) {
            yaml += this.indent() + 'retry:\n';
            this.currentIndent++;
            
            if (step.retry.automatic) {
                yaml += this.indent() + 'automatic:\n';
                this.currentIndent++;
                
                if (step.retry.automatic.exit_status) {
                    yaml += this.indent() + `exit_status: ${this.quote(step.retry.automatic.exit_status)}\n`;
                }
                
                if (step.retry.automatic.limit) {
                    yaml += this.indent() + `limit: ${step.retry.automatic.limit}\n`;
                }
                
                if (step.retry.automatic.delay) {
                    yaml += this.indent() + `delay: ${step.retry.automatic.delay}\n`;
                }
                
                this.currentIndent--;
            }
            
            if (step.retry.manual) {
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
        
        // Artifacts
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
        
        return yaml;
    }

    // Helper methods
    indent() {
        return ' '.repeat(this.currentIndent * this.indentSize);
    }

    quote(value) {
        if (value === null || value === undefined) {
            return '""';
        }
        
        // Convert to string
        value = String(value);
        
        // Check if value needs quotes
        if (this.needsQuotes(value)) {
            // Escape quotes and backslashes
            const escaped = value
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n');
            return `"${escaped}"`;
        }
        
        return value;
    }

    needsQuotes(value) {
        // Empty string needs quotes
        if (value === '') return true;
        
        // YAML special values need quotes
        const specialValues = ['true', 'false', 'null', 'yes', 'no', 'on', 'off'];
        if (specialValues.includes(value.toLowerCase())) return true;
        
        // Numbers need quotes to be treated as strings
        if (/^-?\d+(\.\d+)?$/.test(value)) return true;
        
        // Special characters need quotes
        if (/[:\{\}\[\],&\*#\?\|\-<>=!%@\\]/.test(value)) return true;
        
        // Leading/trailing whitespace needs quotes
        if (value !== value.trim()) return true;
        
        // Multiline strings need quotes
        if (value.includes('\n')) return true;
        
        return false;
    }

    isSimpleCommand(step) {
        // A simple command has only a command property
        const keys = Object.keys(step);
        return keys.length === 1 && keys[0] === 'command' && !step.command.includes('\n');
    }

    isSimpleBlock(step) {
        // A simple block has only a block property
        const keys = Object.keys(step);
        return keys.length === 1 && keys[0] === 'block';
    }

    // Enhanced validation method
    validate(yamlString) {
        const issues = [];
        
        try {
            // Basic structure validation
            if (!yamlString || yamlString.trim() === '') {
                issues.push('YAML content is empty');
                return { valid: false, issues };
            }
            
            // Check for tabs (YAML doesn't allow tabs)
            if (yamlString.includes('\t')) {
                issues.push('YAML contains tabs. Use spaces for indentation.');
            }
            
            // Check for consistent indentation
            const lines = yamlString.split('\n');
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
            
            // Check for required fields
            if (!yamlString.includes('steps:')) {
                issues.push('Missing required "steps" field.');
            }
            
            // Enhanced validation for Buildkite-specific syntax
            this.validateBuildkiteStructure(yamlString, issues);
            
            return {
                valid: issues.length === 0,
                issues: issues
            };
        } catch (error) {
            return {
                valid: false,
                issues: ['Invalid YAML format: ' + error.message]
            };
        }
    }

    // Buildkite-specific validation
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

    // Pretty print YAML with enhanced syntax highlighting
    prettify(yamlString) {
        const lines = yamlString.split('\n');
        const formatted = lines.map(line => {
            // Keys
            line = line.replace(/^(\s*)([a-zA-Z_-]+):/g, '$1<span class="yaml-key">$2</span>:');
            
            // Strings
            line = line.replace(/: "([^"]+)"/g, ': <span class="yaml-string">"$1"</span>');
            line = line.replace(/: '([^']+)'/g, ': <span class="yaml-string">\'$1\'</span>');
            
            // Unquoted strings that look like values
            line = line.replace(/: ([^"'\d\[\{][^\n]*[^,\]\}])$/g, ': <span class="yaml-string">$1</span>');
            
            // Numbers
            line = line.replace(/: (\d+)$/g, ': <span class="yaml-number">$1</span>');
            
            // Booleans
            line = line.replace(/: (true|false)$/g, ': <span class="yaml-boolean">$1</span>');
            
            // Arrays
            line = line.replace(/^(\s*)- /g, '$1<span class="yaml-array">-</span> ');
            
            // Special Buildkite values
            line = line.replace(/(build\.\w+(\.\w+)*)/g, '<span class="yaml-variable">$1</span>');
            line = line.replace(/(pipeline\.\w+)/g, '<span class="yaml-variable">$1</span>');
            line = line.replace(/(organization\.\w+)/g, '<span class="yaml-variable">$1</span>');
            
            return line;
        });
        
        return formatted.join('\n');
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