// js/yaml-generator.js
/**
 * YAML Generator for Buildkite Pipelines
 * Converts pipeline builder steps to valid Buildkite YAML
 */

class YAMLGenerator {
    constructor() {
        this.indentSize = 2;
    }

    generateYAML(steps) {
        if (!steps || steps.length === 0) {
            return 'steps: []';
        }

        let yaml = 'steps:\n';
        
        steps.forEach(step => {
            yaml += this.convertStepToYAML(step);
        });

        return yaml;
    }

    convertStepToYAML(step) {
        let yaml = `  - `;
        
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
            case 'annotation':
                yaml += this.generateAnnotationStep(step);
                break;
            case 'plugin':
                yaml += this.generatePluginStep(step);
                break;
            default:
                yaml += this.generateCommandStep(step);
        }

        return yaml + '\n';
    }

    generateCommandStep(step) {
        const props = step.properties;
        let yaml = '';

        // Basic properties
        if (props.label) {
            yaml += `label: "${this.escapeYAML(props.label)}"\n`;
        }

        if (props.command) {
            yaml += `    command: "${this.escapeYAML(props.command)}"\n`;
        }

        // Key for dependencies
        if (props.key) {
            yaml += `    key: "${props.key}"\n`;
        }

        // Dependencies
        if (props.depends_on && props.depends_on.length > 0) {
            yaml += `    depends_on:\n`;
            props.depends_on.forEach(dep => {
                yaml += `      - "${dep}"\n`;
            });
        }

        // Conditions
        if (props.if) {
            yaml += `    if: ${props.if}\n`;
        }

        if (props.unless) {
            yaml += `    unless: ${props.unless}\n`;
        }

        // Agents
        if (props.agents) {
            yaml += `    agents:\n      queue: "${props.agents}"\n`;
        }

        // Environment variables
        if (props.env && Object.keys(props.env).length > 0) {
            yaml += `    env:\n`;
            Object.entries(props.env).forEach(([key, value]) => {
                yaml += `      ${key}: "${this.escapeYAML(value)}"\n`;
            });
        }

        // Plugins
        if (props.plugins && Object.keys(props.plugins).length > 0) {
            yaml += `    plugins:\n`;
            Object.entries(props.plugins).forEach(([pluginName, config]) => {
                if (Object.keys(config).length === 0) {
                    yaml += `      - ${pluginName}#v1.0.0\n`;
                } else {
                    yaml += `      - ${pluginName}#v1.0.0:\n`;
                    Object.entries(config).forEach(([key, value]) => {
                        yaml += `          ${key}: "${this.escapeYAML(value)}"\n`;
                    });
                }
            });
        }

        // Matrix builds
        if (props.matrix && props.matrix.setup) {
            yaml += `    matrix:\n      setup:\n`;
            Object.entries(props.matrix.setup).forEach(([key, values]) => {
                yaml += `        ${key}:\n`;
                values.forEach(value => {
                    yaml += `          - "${value}"\n`;
                });
            });
        }

        // Additional properties
        if (props.timeout_in_minutes) {
            yaml += `    timeout_in_minutes: ${props.timeout_in_minutes}\n`;
        }

        if (props.retry && props.retry.automatic) {
            yaml += `    retry:\n      automatic: ${props.retry.automatic}\n`;
        }

        if (props.soft_fail) {
            yaml += `    soft_fail: ${props.soft_fail}\n`;
        }

        return yaml.slice(0, -1); // Remove last newline
    }

    generateWaitStep(step) {
        let yaml = 'wait';
        
        if (step.properties.continue_on_failure) {
            yaml += '\n    continue_on_failure: true';
        }

        return yaml;
    }

    generateBlockStep(step) {
        const props = step.properties;
        let yaml = '';

        if (props.label) {
            yaml += `label: "${this.escapeYAML(props.label)}"\n`;
        }

        yaml += `    block: "${this.escapeYAML(props.prompt || 'Continue?')}"\n`;

        if (props.key) {
            yaml += `    key: "${props.key}"\n`;
        }

        if (props.depends_on && props.depends_on.length > 0) {
            yaml += `    depends_on:\n`;
            props.depends_on.forEach(dep => {
                yaml += `      - "${dep}"\n`;
            });
        }

        return yaml.slice(0, -1);
    }

    generateInputStep(step) {
        const props = step.properties;
        let yaml = '';

        if (props.label) {
            yaml += `label: "${this.escapeYAML(props.label)}"\n`;
        }

        yaml += `    input: "${this.escapeYAML(props.prompt || 'Please provide input')}"\n`;

        if (props.key) {
            yaml += `    key: "${props.key}"\n`;
        }

        if (props.fields && props.fields.length > 0) {
            yaml += `    fields:\n`;
            props.fields.forEach(field => {
                yaml += `      - text: "${field.key}"\n`;
                yaml += `        hint: "${field.hint || ''}"\n`;
            });
        }

        return yaml.slice(0, -1);
    }

    generateTriggerStep(step) {
        const props = step.properties;
        let yaml = '';

        if (props.label) {
            yaml += `label: "${this.escapeYAML(props.label)}"\n`;
        }

        yaml += `    trigger: "${props.trigger || 'downstream-pipeline'}"\n`;

        if (props.build && Object.keys(props.build).length > 0) {
            yaml += `    build:\n`;
            Object.entries(props.build).forEach(([key, value]) => {
                yaml += `      ${key}: "${this.escapeYAML(value)}"\n`;
            });
        }

        return yaml.slice(0, -1);
    }

    generateGroupStep(step) {
        const props = step.properties;
        let yaml = '';

        if (props.label) {
            yaml += `label: "${this.escapeYAML(props.label)}"\n`;
        }

        yaml += `    group:\n`;

        if (props.steps && props.steps.length > 0) {
            yaml += `    steps:\n`;
            props.steps.forEach(groupStep => {
                const stepYaml = this.convertStepToYAML(groupStep);
                // Indent group steps
                yaml += stepYaml.replace(/^  /gm, '      ');
            });
        }

        return yaml.slice(0, -1);
    }

    generateAnnotationStep(step) {
        const props = step.properties;
        let yaml = '';

        if (props.label) {
            yaml += `label: "${this.escapeYAML(props.label)}"\n`;
        }

        yaml += `    command: "buildkite-agent annotate`;

        if (props.body) {
            yaml += ` '${this.escapeYAML(props.body)}'`;
        }

        if (props.style && props.style !== 'info') {
            yaml += ` --style ${props.style}`;
        }

        if (props.context) {
            yaml += ` --context ${props.context}`;
        }

        yaml += `"\n`;

        return yaml.slice(0, -1);
    }

    generatePluginStep(step) {
        // Plugin steps are essentially command steps with plugins
        return this.generateCommandStep(step);
    }

    escapeYAML(str) {
        if (typeof str !== 'string') {
            return str;
        }
        
        // Escape special YAML characters
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    validateYAML(yamlString) {
        try {
            // Basic validation - check for common issues
            const lines = yamlString.split('\n');
            let errors = [];

            // Check indentation
            lines.forEach((line, index) => {
                if (line.trim() && line.search(/\S/) % 2 !== 0 && line.search(/\S/) > 0) {
                    errors.push(`Line ${index + 1}: Inconsistent indentation`);
                }
            });

            // Check for required fields
            if (!yamlString.includes('steps:')) {
                errors.push('Missing required "steps:" field');
            }

            return {
                valid: errors.length === 0,
                errors: errors
            };
        } catch (error) {
            return {
                valid: false,
                errors: [error.message]
            };
        }
    }

    formatYAML(yamlString) {
        // Basic YAML formatting
        return yamlString
            .split('\n')
            .map(line => line.trimEnd())
            .join('\n')
            .replace(/\n\n\n+/g, '\n\n'); // Remove excessive blank lines
    }
}

// Create global instance
window.yamlGenerator = new YAMLGenerator();