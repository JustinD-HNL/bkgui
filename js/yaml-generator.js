// YAML Generator for Buildkite Pipelines
class YAMLGenerator {
    constructor() {
        this.indent = '  ';
    }

    generateYAML(steps) {
        if (!steps || steps.length === 0) {
            return 'steps: []';
        }

        let yaml = 'steps:\n';
        
        steps.forEach(step => {
            yaml += this.generateStepYAML(step);
        });

        return yaml;
    }

    generateStepYAML(step) {
        const stepType = step.type;
        const props = step.properties;
        
        switch (stepType) {
            case 'command':
                return this.generateCommandStep(props);
            case 'wait':
                return this.generateWaitStep(props);
            case 'block':
                return this.generateBlockStep(props);
            case 'input':
                return this.generateInputStep(props);
            case 'trigger':
                return this.generateTriggerStep(props);
            case 'group':
                return this.generateGroupStep(props);
            default:
                return `${this.indent}# Unknown step type: ${stepType}\n`;
        }
    }

    generateCommandStep(props) {
        let yaml = `${this.indent}- label: "${props.label || 'Command Step'}"\n`;
        
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

        if (props.agents) {
            yaml += `${this.indent}${this.indent}agents:\n`;
            // Parse agent query
            const agentPairs = props.agents.split(',').map(pair => pair.trim());
            agentPairs.forEach(pair => {
                const [key, value] = pair.split('=').map(s => s.trim());
                if (key && value) {
                    yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
                }
            });
        }

        if (props.env && Object.keys(props.env).length > 0) {
            yaml += `${this.indent}${this.indent}env:\n`;
            Object.entries(props.env).forEach(([key, value]) => {
                yaml += `${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
            });
        }

        if (props.timeout_in_minutes && props.timeout_in_minutes !== 10) {
            yaml += `${this.indent}${this.indent}timeout_in_minutes: ${props.timeout_in_minutes}\n`;
        }

        if (props.retry) {
            yaml += `${this.indent}${this.indent}retry:\n`;
            yaml += `${this.indent}${this.indent}${this.indent}automatic: true\n`;
        }

        if (props.soft_fail) {
            yaml += `${this.indent}${this.indent}soft_fail: true\n`;
        }

        return yaml + '\n';
    }

    generateWaitStep(props) {
        let yaml = `${this.indent}- wait\n`;
        
        if (props.continue_on_failure) {
            yaml += `${this.indent}${this.indent}continue_on_failure: true\n`;
        }

        return yaml + '\n';
    }

    generateBlockStep(props) {
        let yaml = `${this.indent}- block: "${props.label || 'Block Step'}"\n`;
        
        if (props.prompt) {
            yaml += `${this.indent}${this.indent}prompt: "${props.prompt}"\n`;
        }

        if (props.blocked_state && props.blocked_state !== 'running') {
            yaml += `${this.indent}${this.indent}blocked_state: "${props.blocked_state}"\n`;
        }

        return yaml + '\n';
    }

    generateInputStep(props) {
        let yaml = `${this.indent}- input: "${props.label || 'Input Step'}"\n`;
        
        if (props.prompt) {
            yaml += `${this.indent}${this.indent}prompt: "${props.prompt}"\n`;
        }

        if (props.fields && props.fields.length > 0) {
            yaml += `${this.indent}${this.indent}fields:\n`;
            props.fields.forEach(field => {
                yaml += `${this.indent}${this.indent}${this.indent}- key: "${field.key || ''}"\n`;
                yaml += `${this.indent}${this.indent}${this.indent}${this.indent}text: "${field.text || ''}"\n`;
                if (field.required) {
                    yaml += `${this.indent}${this.indent}${this.indent}${this.indent}required: true\n`;
                }
                if (field.default) {
                    yaml += `${this.indent}${this.indent}${this.indent}${this.indent}default: "${field.default}"\n`;
                }
                if (field.hint) {
                    yaml += `${this.indent}${this.indent}${this.indent}${this.indent}hint: "${field.hint}"\n`;
                }
            });
        }

        return yaml + '\n';
    }

    generateTriggerStep(props) {
        let yaml = `${this.indent}- label: "${props.label || 'Trigger Step'}"\n`;
        yaml += `${this.indent}${this.indent}trigger: "${props.trigger || ''}"\n`;

        if (props.build && Object.keys(props.build).length > 0) {
            yaml += `${this.indent}${this.indent}build:\n`;
            
            if (props.build.branch) {
                yaml += `${this.indent}${this.indent}${this.indent}branch: "${props.build.branch}"\n`;
            }
            
            if (props.build.commit) {
                yaml += `${this.indent}${this.indent}${this.indent}commit: "${props.build.commit}"\n`;
            }
            
            if (props.build.message) {
                yaml += `${this.indent}${this.indent}${this.indent}message: "${props.build.message}"\n`;
            }
            
            if (props.build.env && Object.keys(props.build.env).length > 0) {
                yaml += `${this.indent}${this.indent}${this.indent}env:\n`;
                Object.entries(props.build.env).forEach(([key, value]) => {
                    yaml += `${this.indent}${this.indent}${this.indent}${this.indent}${key}: "${value}"\n`;
                });
            }
        }

        if (props.async) {
            yaml += `${this.indent}${this.indent}async: true\n`;
        }

        return yaml + '\n';
    }

    generateGroupStep(props) {
        let yaml = `${this.indent}- group: "${props.label || 'Group Step'}"\n`;
        
        if (props.steps && props.steps.length > 0) {
            yaml += `${this.indent}${this.indent}steps:\n`;
            props.steps.forEach(step => {
                if (typeof step === 'string') {
                    yaml += `${this.indent}${this.indent}${this.indent}- command: "${step}"\n`;
                } else if (step.command) {
                    yaml += `${this.indent}${this.indent}${this.indent}- command: "${step.command}"\n`;
                    if (step.label) {
                        yaml += `${this.indent}${this.indent}${this.indent}${this.indent}label: "${step.label}"\n`;
                    }
                }
            });
        }

        return yaml + '\n';
    }

    // Helper method to escape YAML strings
    escapeYAMLString(str) {
        if (!str) return '';
        
        // If string contains special characters, wrap in quotes
        if (/[:\{\}\[\],&*#?|\-<>=!%@`]/.test(str) || str.trim() !== str) {
            return `"${str.replace(/"/g, '\\"')}"`;
        }
        
        return str;
    }

    // Generate a complete pipeline with metadata
    generateFullPipeline(steps, metadata = {}) {
        let yaml = '';
        
        // Add pipeline metadata if provided
        if (metadata.name) {
            yaml += `# Pipeline: ${metadata.name}\n`;
        }
        
        if (metadata.description) {
            yaml += `# Description: ${metadata.description}\n`;
        }
        
        if (metadata.env && Object.keys(metadata.env).length > 0) {
            yaml += '\nenv:\n';
            Object.entries(metadata.env).forEach(([key, value]) => {
                yaml += `  ${key}: "${value}"\n`;
            });
        }
        
        yaml += '\n';
        yaml += this.generateYAML(steps);
        
        return yaml;
    }

    // Validate pipeline structure
    validatePipeline(steps) {
        const errors = [];
        
        if (!Array.isArray(steps)) {
            errors.push('Steps must be an array');
            return errors;
        }
        
        steps.forEach((step, index) => {
            if (!step.type) {
                errors.push(`Step ${index + 1}: Missing step type`);
            }
            
            if (!step.properties) {
                errors.push(`Step ${index + 1}: Missing properties`);
            }
            
            // Type-specific validation
            switch (step.type) {
                case 'command':
                    if (!step.properties.command) {
                        errors.push(`Step ${index + 1}: Command step missing command`);
                    }
                    break;
                case 'trigger':
                    if (!step.properties.trigger) {
                        errors.push(`Step ${index + 1}: Trigger step missing pipeline reference`);
                    }
                    break;
                case 'input':
                    if (!step.properties.fields || step.properties.fields.length === 0) {
                        errors.push(`Step ${index + 1}: Input step should have at least one field`);
                    }
                    break;
            }
        });
        
        return errors;
    }
}

// Make it globally available
window.yamlGenerator = new YAMLGenerator();
