// Buildkite SDK Integration for Pipeline Builder
// This module provides SDK features for the visual pipeline builder

class BuildkiteSDKIntegration {
    constructor() {
        this.initialized = false;
    }

    // Convert visual pipeline to SDK code
    generateSDKCode(steps, language = 'javascript') {
        switch (language) {
            case 'javascript':
                return this.generateJavaScriptSDK(steps);
            case 'typescript':
                return this.generateTypeScriptSDK(steps);
            case 'python':
                return this.generatePythonSDK(steps);
            case 'go':
                return this.generateGoSDK(steps);
            case 'ruby':
                return this.generateRubySDK(steps);
            default:
                return '';
        }
    }

    // Generate JavaScript SDK code
    generateJavaScriptSDK(steps) {
        let code = `const { BuildkitePipeline } = require('@buildkite/buildkite-sdk');\n\n`;
        code += `const pipeline = new BuildkitePipeline();\n\n`;

        steps.forEach((step, index) => {
            code += this.generateStepSDKCode(step, index);
        });

        code += `\n// Export the pipeline\n`;
        code += `console.log(pipeline.toYaml());\n`;
        code += `module.exports = pipeline;\n`;

        return code;
    }

    // Generate TypeScript SDK code
    generateTypeScriptSDK(steps) {
        let code = `import { BuildkitePipeline, CommandStep, WaitStep, BlockStep, InputStep, TriggerStep, GroupStep } from '@buildkite/buildkite-sdk';\n\n`;
        code += `const pipeline = new BuildkitePipeline();\n\n`;

        steps.forEach((step, index) => {
            code += this.generateStepSDKCode(step, index, true);
        });

        code += `\n// Export the pipeline\n`;
        code += `console.log(pipeline.toYaml());\n`;
        code += `export default pipeline;\n`;

        return code;
    }

    // Generate Python SDK code
    generatePythonSDK(steps) {
        let code = `from buildkite import BuildkitePipeline, CommandStep, WaitStep, BlockStep, InputStep, TriggerStep, GroupStep\n\n`;
        code += `pipeline = BuildkitePipeline()\n\n`;

        steps.forEach((step, index) => {
            code += this.generateStepSDKCodePython(step, index);
        });

        code += `\n# Export the pipeline\n`;
        code += `print(pipeline.to_yaml())\n`;

        return code;
    }

    // Generate Go SDK code
    generateGoSDK(steps) {
        let code = `package main\n\n`;
        code += `import (\n`;
        code += `    "fmt"\n`;
        code += `    "github.com/buildkite/buildkite-sdk/sdk/go/sdk/buildkite"\n`;
        code += `)\n\n`;
        code += `func main() {\n`;
        code += `    pipeline := buildkite.Pipeline{}\n\n`;

        steps.forEach((step, index) => {
            code += this.generateStepSDKCodeGo(step, index);
        });

        code += `\n    // Export the pipeline\n`;
        code += `    yaml, _ := pipeline.ToYAML()\n`;
        code += `    fmt.Println(yaml)\n`;
        code += `}\n`;

        return code;
    }

    // Generate Ruby SDK code
    generateRubySDK(steps) {
        let code = `require "buildkite"\n\n`;
        code += `pipeline = Buildkite::Pipeline.new\n\n`;

        steps.forEach((step, index) => {
            code += this.generateStepSDKCodeRuby(step, index);
        });

        code += `\n# Export the pipeline\n`;
        code += `puts pipeline.to_yaml\n`;

        return code;
    }

    // Generate SDK code for a single step
    generateStepSDKCode(step, index, isTypeScript = false) {
        let code = '';
        const varName = `step${index + 1}`;

        switch (step.type) {
            case 'command':
                code += this.generateCommandStepSDK(step, varName, isTypeScript);
                break;
            case 'wait':
                code += this.generateWaitStepSDK(step, varName, isTypeScript);
                break;
            case 'block':
                code += this.generateBlockStepSDK(step, varName, isTypeScript);
                break;
            case 'input':
                code += this.generateInputStepSDK(step, varName, isTypeScript);
                break;
            case 'trigger':
                code += this.generateTriggerStepSDK(step, varName, isTypeScript);
                break;
            case 'group':
                code += this.generateGroupStepSDK(step, varName, isTypeScript);
                break;
            default:
                code += `// Unknown step type: ${step.type}\n`;
        }

        return code;
    }

    // Generate command step SDK code
    generateCommandStepSDK(step, varName, isTypeScript) {
        const props = step.properties || {};
        let code = `// ${props.label || 'Command Step'}\n`;
        
        if (isTypeScript) {
            code += `const ${varName}: CommandStep = pipeline.addCommandStep({\n`;
        } else {
            code += `const ${varName} = pipeline.addCommandStep({\n`;
        }

        // Required properties
        code += `  command: ${this.formatValue(props.command || 'echo "Hello, World!"')},\n`;

        // Optional properties
        if (props.label) code += `  label: ${this.formatValue(props.label)},\n`;
        if (props.key) code += `  key: ${this.formatValue(props.key)},\n`;
        if (props.depends_on) code += `  dependsOn: ${this.formatValue(props.depends_on)},\n`;
        if (props.env) code += `  env: ${this.formatObject(props.env)},\n`;
        if (props.timeout_in_minutes) code += `  timeout: ${props.timeout_in_minutes},\n`;
        if (props.parallelism) code += `  parallelism: ${props.parallelism},\n`;
        if (props.artifact_paths) code += `  artifactPaths: ${this.formatValue(props.artifact_paths)},\n`;
        if (props.agents) code += `  agents: ${this.formatObject(props.agents)},\n`;
        if (props.retry) code += `  retry: ${this.formatRetry(props.retry)},\n`;
        if (props.soft_fail !== undefined) code += `  softFail: ${this.formatSoftFail(props.soft_fail)},\n`;
        if (props.skip) code += `  skip: ${props.skip},\n`;
        if (props.if) code += `  if: ${this.formatValue(props.if)},\n`;
        if (props.cancel_on_build_failing) code += `  cancelOnBuildFailing: ${props.cancel_on_build_failing},\n`;
        if (props.matrix) code += `  matrix: ${JSON.stringify(props.matrix, null, 2).replace(/\n/g, '\n  ')},\n`;
        
        // Plugins
        if (props.plugins && Object.keys(props.plugins).length > 0) {
            code += `  plugins: [\n`;
            Object.entries(props.plugins).forEach(([name, config]) => {
                code += `    { '${name}': ${JSON.stringify(config, null, 2).replace(/\n/g, '\n    ')} },\n`;
            });
            code += `  ],\n`;
        }

        // Custom attributes
        if (props.customAttributes) {
            Object.entries(props.customAttributes).forEach(([key, value]) => {
                if (key && !key.startsWith('custom_attr_')) {
                    code += `  ${key}: ${this.formatValue(value)},\n`;
                }
            });
        }

        code = code.replace(/,\n$/, '\n'); // Remove trailing comma
        code += `});\n\n`;

        return code;
    }

    // Generate wait step SDK code
    generateWaitStepSDK(step, varName, isTypeScript) {
        const props = step.properties || {};
        let code = `// Wait Step\n`;
        
        if (Object.keys(props).length === 0) {
            code += `pipeline.addWaitStep();\n\n`;
        } else {
            if (isTypeScript) {
                code += `const ${varName}: WaitStep = pipeline.addWaitStep({\n`;
            } else {
                code += `const ${varName} = pipeline.addWaitStep({\n`;
            }
            
            if (props.continue_on_failure) code += `  continueOnFailure: true,\n`;
            if (props.if) code += `  if: ${this.formatValue(props.if)},\n`;
            
            code = code.replace(/,\n$/, '\n');
            code += `});\n\n`;
        }

        return code;
    }

    // Generate block step SDK code
    generateBlockStepSDK(step, varName, isTypeScript) {
        const props = step.properties || {};
        let code = `// ${props.prompt || 'Block Step'}\n`;
        
        if (isTypeScript) {
            code += `const ${varName}: BlockStep = pipeline.addBlockStep({\n`;
        } else {
            code += `const ${varName} = pipeline.addBlockStep({\n`;
        }

        code += `  prompt: ${this.formatValue(props.prompt || 'Continue?')},\n`;
        
        if (props.key) code += `  key: ${this.formatValue(props.key)},\n`;
        if (props.fields && props.fields.length > 0) {
            code += `  fields: [\n`;
            props.fields.forEach(field => {
                code += `    {\n`;
                code += `      key: ${this.formatValue(field.key)},\n`;
                if (field.text) code += `      text: ${this.formatValue(field.text)},\n`;
                if (field.type) code += `      type: ${this.formatValue(field.type)},\n`;
                if (field.required) code += `      required: ${field.required},\n`;
                if (field.default) code += `      default: ${this.formatValue(field.default)},\n`;
                if (field.hint) code += `      hint: ${this.formatValue(field.hint)},\n`;
                if (field.options && field.options.length > 0) {
                    code += `      options: [\n`;
                    field.options.forEach(opt => {
                        code += `        { label: ${this.formatValue(opt.label)}, value: ${this.formatValue(opt.value)} },\n`;
                    });
                    code += `      ],\n`;
                }
                code = code.replace(/,\n$/, '\n');
                code += `    },\n`;
            });
            code += `  ],\n`;
        }
        if (props.blocked_state) code += `  blockedState: ${this.formatValue(props.blocked_state)},\n`;
        if (props.depends_on) code += `  dependsOn: ${this.formatValue(props.depends_on)},\n`;
        if (props.if) code += `  if: ${this.formatValue(props.if)},\n`;

        code = code.replace(/,\n$/, '\n');
        code += `});\n\n`;

        return code;
    }

    // Generate input step SDK code
    generateInputStepSDK(step, varName, isTypeScript) {
        const props = step.properties || {};
        let code = `// ${props.prompt || 'Input Step'}\n`;
        
        if (isTypeScript) {
            code += `const ${varName}: InputStep = pipeline.addInputStep({\n`;
        } else {
            code += `const ${varName} = pipeline.addInputStep({\n`;
        }

        code += `  prompt: ${this.formatValue(props.prompt || 'Please provide input')},\n`;
        
        if (props.key) code += `  key: ${this.formatValue(props.key)},\n`;
        if (props.fields && props.fields.length > 0) {
            code += `  fields: [\n`;
            props.fields.forEach(field => {
                code += `    {\n`;
                code += `      key: ${this.formatValue(field.key)},\n`;
                if (field.text) code += `      text: ${this.formatValue(field.text)},\n`;
                if (field.hint) code += `      hint: ${this.formatValue(field.hint)},\n`;
                if (field.required) code += `      required: ${field.required},\n`;
                if (field.default) code += `      default: ${this.formatValue(field.default)},\n`;
                code = code.replace(/,\n$/, '\n');
                code += `    },\n`;
            });
            code += `  ],\n`;
        }
        if (props.depends_on) code += `  dependsOn: ${this.formatValue(props.depends_on)},\n`;
        if (props.if) code += `  if: ${this.formatValue(props.if)},\n`;

        code = code.replace(/,\n$/, '\n');
        code += `});\n\n`;

        return code;
    }

    // Generate trigger step SDK code
    generateTriggerStepSDK(step, varName, isTypeScript) {
        const props = step.properties || {};
        let code = `// Trigger: ${props.trigger || 'pipeline'}\n`;
        
        if (isTypeScript) {
            code += `const ${varName}: TriggerStep = pipeline.addTriggerStep({\n`;
        } else {
            code += `const ${varName} = pipeline.addTriggerStep({\n`;
        }

        code += `  trigger: ${this.formatValue(props.trigger || 'pipeline')},\n`;
        
        if (props.label) code += `  label: ${this.formatValue(props.label)},\n`;
        if (props.async) code += `  async: ${props.async},\n`;
        if (props.build && Object.keys(props.build).length > 0) {
            code += `  build: {\n`;
            if (props.build.message) code += `    message: ${this.formatValue(props.build.message)},\n`;
            if (props.build.commit) code += `    commit: ${this.formatValue(props.build.commit)},\n`;
            if (props.build.branch) code += `    branch: ${this.formatValue(props.build.branch)},\n`;
            if (props.build.env) code += `    env: ${this.formatObject(props.build.env)},\n`;
            if (props.build.meta_data) code += `    metaData: ${this.formatObject(props.build.meta_data)},\n`;
            code = code.replace(/,\n$/, '\n');
            code += `  },\n`;
        }
        if (props.depends_on) code += `  dependsOn: ${this.formatValue(props.depends_on)},\n`;
        if (props.if) code += `  if: ${this.formatValue(props.if)},\n`;

        code = code.replace(/,\n$/, '\n');
        code += `});\n\n`;

        return code;
    }

    // Generate group step SDK code
    generateGroupStepSDK(step, varName, isTypeScript) {
        const props = step.properties || {};
        let code = `// ${props.group || 'Group Step'}\n`;
        
        if (isTypeScript) {
            code += `const ${varName}: GroupStep = pipeline.addGroupStep({\n`;
        } else {
            code += `const ${varName} = pipeline.addGroupStep({\n`;
        }

        code += `  group: ${this.formatValue(props.group || 'Group')},\n`;
        
        if (props.key) code += `  key: ${this.formatValue(props.key)},\n`;
        if (props.depends_on) code += `  dependsOn: ${this.formatValue(props.depends_on)},\n`;
        if (props.if) code += `  if: ${this.formatValue(props.if)},\n`;
        if (props.notify) code += `  notify: ${JSON.stringify(props.notify, null, 2).replace(/\n/g, '\n  ')},\n`;

        code = code.replace(/,\n$/, '\n');
        code += `});\n\n`;

        // TODO: Handle nested steps within groups
        if (props.steps && props.steps.length > 0) {
            code += `// TODO: Add nested steps to the group\n`;
        }

        return code;
    }

    // Format a value for SDK code
    formatValue(value) {
        if (typeof value === 'string') {
            return JSON.stringify(value);
        } else if (Array.isArray(value)) {
            if (value.length === 1 && typeof value[0] === 'string') {
                return JSON.stringify(value[0]);
            }
            return JSON.stringify(value);
        }
        return JSON.stringify(value);
    }

    // Format an object for SDK code
    formatObject(obj) {
        if (!obj || Object.keys(obj).length === 0) {
            return '{}';
        }
        return JSON.stringify(obj, null, 2).replace(/\n/g, '\n  ');
    }

    // Format retry configuration
    formatRetry(retry) {
        if (!retry) return 'null';
        
        let result = '{\n';
        if (retry.automatic) {
            result += '    automatic: ';
            if (retry.automatic === true) {
                result += 'true';
            } else {
                result += JSON.stringify(retry.automatic, null, 2).replace(/\n/g, '\n    ');
            }
            if (retry.manual !== undefined) result += ',';
            result += '\n';
        }
        if (retry.manual !== undefined) {
            result += `    manual: ${retry.manual}\n`;
        }
        result += '  }';
        
        return result;
    }

    // Format soft_fail configuration
    formatSoftFail(softFail) {
        if (softFail === true || softFail === false) {
            return softFail;
        }
        return JSON.stringify(softFail);
    }

    // Parse SDK code and convert to pipeline steps
    parseSDKCode(code) {
        // This would require a proper JavaScript parser
        // For now, we'll provide a simple implementation that recognizes basic patterns
        const steps = [];
        
        // Match addCommandStep calls
        const commandStepRegex = /pipeline\.addCommandStep\s*\(\s*{([^}]+)}\s*\)/g;
        let match;
        
        while ((match = commandStepRegex.exec(code)) !== null) {
            try {
                // Extract properties (simplified - would need proper parsing)
                const propsStr = match[1];
                const step = {
                    type: 'command',
                    properties: this.parseStepProperties(propsStr)
                };
                steps.push(step);
            } catch (e) {
                console.error('Failed to parse command step:', e);
            }
        }

        // Similar patterns for other step types...
        
        return steps;
    }

    // Parse step properties from string (simplified)
    parseStepProperties(propsStr) {
        const props = {};
        
        // Extract command
        const commandMatch = propsStr.match(/command:\s*["'`]([^"'`]+)["'`]/);
        if (commandMatch) props.command = commandMatch[1];
        
        // Extract label
        const labelMatch = propsStr.match(/label:\s*["'`]([^"'`]+)["'`]/);
        if (labelMatch) props.label = labelMatch[1];
        
        // Extract key
        const keyMatch = propsStr.match(/key:\s*["'`]([^"'`]+)["'`]/);
        if (keyMatch) props.key = keyMatch[1];
        
        // More property extraction would go here...
        
        return props;
    }

    // Validate pipeline using SDK-like rules
    validatePipeline(steps) {
        const errors = [];
        const warnings = [];
        
        // Check for empty pipeline
        if (!steps || steps.length === 0) {
            errors.push('Pipeline must have at least one step');
            return { valid: false, errors, warnings };
        }

        // Validate each step
        steps.forEach((step, index) => {
            const stepErrors = this.validateStep(step, index);
            errors.push(...stepErrors.errors);
            warnings.push(...stepErrors.warnings);
        });

        // Check dependencies
        const stepKeys = new Set(steps.filter(s => s.properties?.key).map(s => s.properties.key));
        steps.forEach((step, index) => {
            if (step.properties?.depends_on) {
                const deps = Array.isArray(step.properties.depends_on) 
                    ? step.properties.depends_on 
                    : [step.properties.depends_on];
                    
                deps.forEach(dep => {
                    if (!stepKeys.has(dep)) {
                        errors.push(`Step ${index + 1} depends on non-existent step: ${dep}`);
                    }
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate individual step
    validateStep(step, index) {
        const errors = [];
        const warnings = [];
        
        if (!step.type) {
            errors.push(`Step ${index + 1}: Missing step type`);
            return { errors, warnings };
        }

        switch (step.type) {
            case 'command':
                if (!step.properties?.command) {
                    errors.push(`Step ${index + 1}: Command step must have a command`);
                }
                break;
                
            case 'block':
                if (!step.properties?.prompt) {
                    warnings.push(`Step ${index + 1}: Block step should have a prompt`);
                }
                break;
                
            case 'input':
                if (!step.properties?.prompt) {
                    warnings.push(`Step ${index + 1}: Input step should have a prompt`);
                }
                if (!step.properties?.fields || step.properties.fields.length === 0) {
                    errors.push(`Step ${index + 1}: Input step must have at least one field`);
                }
                break;
                
            case 'trigger':
                if (!step.properties?.trigger) {
                    errors.push(`Step ${index + 1}: Trigger step must specify a pipeline to trigger`);
                }
                break;
                
            case 'group':
                if (!step.properties?.group) {
                    errors.push(`Step ${index + 1}: Group step must have a group name`);
                }
                break;
        }

        // Validate plugins
        if (step.properties?.plugins) {
            Object.entries(step.properties.plugins).forEach(([plugin, config]) => {
                if (!config || typeof config !== 'object') {
                    warnings.push(`Step ${index + 1}: Plugin ${plugin} configuration should be an object`);
                }
            });
        }

        // Validate matrix
        if (step.properties?.matrix) {
            if (!Array.isArray(step.properties.matrix)) {
                errors.push(`Step ${index + 1}: Matrix must be an array`);
            } else if (step.properties.matrix.length === 0) {
                warnings.push(`Step ${index + 1}: Matrix is empty`);
            }
        }

        return { errors, warnings };
    }

    // Python step generator
    generateStepSDKCodePython(step, index) {
        let code = '';
        const varName = `step${index + 1}`;

        switch (step.type) {
            case 'command':
                code += this.generateCommandStepPython(step, varName);
                break;
            case 'wait':
                code += this.generateWaitStepPython(step, varName);
                break;
            case 'block':
                code += this.generateBlockStepPython(step, varName);
                break;
            case 'input':
                code += this.generateInputStepPython(step, varName);
                break;
            case 'trigger':
                code += this.generateTriggerStepPython(step, varName);
                break;
            case 'group':
                code += this.generateGroupStepPython(step, varName);
                break;
            default:
                code += `# Unknown step type: ${step.type}\n`;
        }

        return code;
    }

    // Python command step
    generateCommandStepPython(step, varName) {
        const props = step.properties || {};
        let code = `# ${props.label || 'Command Step'}\n`;
        code += `${varName} = pipeline.add_command_step(\n`;
        code += `    command=${this.formatValuePython(props.command || 'echo "Hello, World!"')},\n`;
        
        if (props.label) code += `    label=${this.formatValuePython(props.label)},\n`;
        if (props.key) code += `    key=${this.formatValuePython(props.key)},\n`;
        if (props.depends_on) code += `    depends_on=${this.formatValuePython(props.depends_on)},\n`;
        if (props.env) code += `    env=${this.formatObjectPython(props.env)},\n`;
        if (props.timeout_in_minutes) code += `    timeout_in_minutes=${props.timeout_in_minutes},\n`;
        if (props.parallelism) code += `    parallelism=${props.parallelism},\n`;
        if (props.artifact_paths) code += `    artifact_paths=${this.formatValuePython(props.artifact_paths)},\n`;
        if (props.agents) code += `    agents=${this.formatObjectPython(props.agents)},\n`;
        if (props.retry) code += `    retry=${this.formatRetryPython(props.retry)},\n`;
        if (props.soft_fail !== undefined) code += `    soft_fail=${this.formatSoftFailPython(props.soft_fail)},\n`;
        if (props.plugins && Object.keys(props.plugins).length > 0) {
            code += `    plugins=[\n`;
            Object.entries(props.plugins).forEach(([name, config]) => {
                code += `        {"${name}": ${JSON.stringify(config, null, 2).replace(/"/g, "'").replace(/\n/g, '\n        ')}},\n`;
            });
            code += `    ],\n`;
        }
        
        code += `)\n\n`;
        return code;
    }

    generateWaitStepPython(step, varName) {
        const props = step.properties || {};
        let code = `# Wait Step\n`;
        code += `${varName} = pipeline.add_wait_step(\n`;
        if (props.depends_on) code += `    depends_on=${this.formatValuePython(props.depends_on)},\n`;
        if (props.if) code += `    if_condition=${this.formatValuePython(props.if)},\n`;
        if (props.allow_dependency_failure) code += `    allow_dependency_failure=${props.allow_dependency_failure ? 'True' : 'False'},\n`;
        if (props.continue_on_failure) code += `    continue_on_failure=${props.continue_on_failure ? 'True' : 'False'},\n`;
        code += `)\n\n`;
        return code;
    }

    generateBlockStepPython(step, varName) {
        const props = step.properties || {};
        let code = `# Block Step: ${props.block || 'Manual Approval'}\n`;
        code += `${varName} = pipeline.add_block_step(\n`;
        code += `    block=${this.formatValuePython(props.block || 'Manual Approval')},\n`;
        if (props.key) code += `    key=${this.formatValuePython(props.key)},\n`;
        if (props.depends_on) code += `    depends_on=${this.formatValuePython(props.depends_on)},\n`;
        if (props.fields && props.fields.length > 0) {
            code += `    fields=[\n`;
            props.fields.forEach(field => {
                code += `        ${this.formatBlockFieldPython(field)},\n`;
            });
            code += `    ],\n`;
        }
        code += `)\n\n`;
        return code;
    }

    generateInputStepPython(step, varName) {
        const props = step.properties || {};
        let code = `# Input Step\n`;
        code += `${varName} = pipeline.add_input_step(\n`;
        code += `    prompt=${this.formatValuePython(props.prompt || 'Please provide input')},\n`;
        if (props.key) code += `    key=${this.formatValuePython(props.key)},\n`;
        if (props.depends_on) code += `    depends_on=${this.formatValuePython(props.depends_on)},\n`;
        if (props.fields && props.fields.length > 0) {
            code += `    fields=[\n`;
            props.fields.forEach(field => {
                code += `        ${this.formatInputFieldPython(field)},\n`;
            });
            code += `    ],\n`;
        }
        code += `)\n\n`;
        return code;
    }

    generateTriggerStepPython(step, varName) {
        const props = step.properties || {};
        let code = `# Trigger Step\n`;
        code += `${varName} = pipeline.add_trigger_step(\n`;
        code += `    trigger=${this.formatValuePython(props.trigger || 'downstream-pipeline')},\n`;
        if (props.label) code += `    label=${this.formatValuePython(props.label)},\n`;
        if (props.depends_on) code += `    depends_on=${this.formatValuePython(props.depends_on)},\n`;
        if (props.build) {
            const build = props.build;
            code += `    build={\n`;
            if (build.message) code += `        "message": ${this.formatValuePython(build.message)},\n`;
            if (build.branch) code += `        "branch": ${this.formatValuePython(build.branch)},\n`;
            if (build.commit) code += `        "commit": ${this.formatValuePython(build.commit)},\n`;
            if (build.env) code += `        "env": ${this.formatObjectPython(build.env)},\n`;
            if (build.meta_data) code += `        "meta_data": ${this.formatObjectPython(build.meta_data)},\n`;
            code += `    },\n`;
        }
        code += `)\n\n`;
        return code;
    }

    generateGroupStepPython(step, varName) {
        const props = step.properties || {};
        let code = `# Group Step: ${props.group || 'Step Group'}\n`;
        code += `${varName} = pipeline.add_group_step(\n`;
        code += `    group=${this.formatValuePython(props.group || 'Step Group')},\n`;
        if (props.key) code += `    key=${this.formatValuePython(props.key)},\n`;
        if (props.depends_on) code += `    depends_on=${this.formatValuePython(props.depends_on)},\n`;
        if (props.steps && props.steps.length > 0) {
            code += `    steps=[\n`;
            props.steps.forEach(subStep => {
                code += `        # Add sub-steps here\n`;
            });
            code += `    ],\n`;
        }
        code += `)\n\n`;
        return code;
    }

    // Go step generator
    generateStepSDKCodeGo(step, index) {
        let code = '';
        
        switch (step.type) {
            case 'command':
                code += this.generateCommandStepGo(step, index);
                break;
            case 'wait':
                code += this.generateWaitStepGo(step, index);
                break;
            case 'block':
                code += this.generateBlockStepGo(step, index);
                break;
            case 'input':
                code += this.generateInputStepGo(step, index);
                break;
            case 'trigger':
                code += this.generateTriggerStepGo(step, index);
                break;
            case 'group':
                code += this.generateGroupStepGo(step, index);
                break;
            default:
                code += `    // Unknown step type: ${step.type}\n`;
        }

        return code;
    }

    generateCommandStepGo(step, index) {
        const props = step.properties || {};
        let code = `    // ${props.label || 'Command Step'}\n`;
        code += `    command${index + 1} := "${props.command || 'echo "Hello, World!"'}"\n`;
        code += `    pipeline.AddCommandStep(buildkite.CommandStep{\n`;
        code += `        Command: &buildkite.CommandUnion{\n`;
        code += `            String: &command${index + 1},\n`;
        code += `        },\n`;
        
        if (props.label) code += `        Label: buildkite.String("${props.label}"),\n`;
        if (props.key) code += `        Key: buildkite.String("${props.key}"),\n`;
        if (props.depends_on) code += `        DependsOn: ${this.formatGoStringSlice(props.depends_on)},\n`;
        if (props.env) code += `        Env: ${this.formatGoMap(props.env)},\n`;
        if (props.timeout_in_minutes) code += `        TimeoutInMinutes: buildkite.Int(${props.timeout_in_minutes}),\n`;
        if (props.parallelism) code += `        Parallelism: buildkite.Int(${props.parallelism}),\n`;
        if (props.artifact_paths) code += `        ArtifactPaths: ${this.formatGoStringSlice(props.artifact_paths)},\n`;
        if (props.retry) code += `        Retry: ${this.formatRetryGo(props.retry)},\n`;
        if (props.soft_fail !== undefined) code += `        SoftFail: ${this.formatSoftFailGo(props.soft_fail)},\n`;
        
        code += `    })\n\n`;
        return code;
    }

    generateWaitStepGo(step, index) {
        const props = step.properties || {};
        let code = `    // Wait Step\n`;
        code += `    pipeline.AddWaitStep(buildkite.WaitStep{\n`;
        if (props.depends_on) code += `        DependsOn: ${this.formatGoStringSlice(props.depends_on)},\n`;
        if (props.if) code += `        If: buildkite.String("${props.if}"),\n`;
        if (props.allow_dependency_failure) code += `        AllowDependencyFailure: buildkite.Bool(${props.allow_dependency_failure}),\n`;
        if (props.continue_on_failure) code += `        ContinueOnFailure: buildkite.Bool(${props.continue_on_failure}),\n`;
        code += `    })\n\n`;
        return code;
    }

    generateBlockStepGo(step, index) {
        const props = step.properties || {};
        let code = `    // Block Step: ${props.block || 'Manual Approval'}\n`;
        code += `    pipeline.AddBlockStep(buildkite.BlockStep{\n`;
        code += `        Block: buildkite.String("${props.block || 'Manual Approval'}"),\n`;
        if (props.key) code += `        Key: buildkite.String("${props.key}"),\n`;
        if (props.depends_on) code += `        DependsOn: ${this.formatGoStringSlice(props.depends_on)},\n`;
        code += `    })\n\n`;
        return code;
    }

    generateInputStepGo(step, index) {
        const props = step.properties || {};
        let code = `    // Input Step\n`;
        code += `    pipeline.AddInputStep(buildkite.InputStep{\n`;
        code += `        Prompt: buildkite.String("${props.prompt || 'Please provide input'}"),\n`;
        if (props.key) code += `        Key: buildkite.String("${props.key}"),\n`;
        if (props.depends_on) code += `        DependsOn: ${this.formatGoStringSlice(props.depends_on)},\n`;
        code += `    })\n\n`;
        return code;
    }

    generateTriggerStepGo(step, index) {
        const props = step.properties || {};
        let code = `    // Trigger Step\n`;
        code += `    pipeline.AddTriggerStep(buildkite.TriggerStep{\n`;
        code += `        Trigger: buildkite.String("${props.trigger || 'downstream-pipeline'}"),\n`;
        if (props.label) code += `        Label: buildkite.String("${props.label}"),\n`;
        if (props.depends_on) code += `        DependsOn: ${this.formatGoStringSlice(props.depends_on)},\n`;
        code += `    })\n\n`;
        return code;
    }

    generateGroupStepGo(step, index) {
        const props = step.properties || {};
        let code = `    // Group Step: ${props.group || 'Step Group'}\n`;
        code += `    pipeline.AddGroupStep(buildkite.GroupStep{\n`;
        code += `        Group: buildkite.String("${props.group || 'Step Group'}"),\n`;
        if (props.key) code += `        Key: buildkite.String("${props.key}"),\n`;
        if (props.depends_on) code += `        DependsOn: ${this.formatGoStringSlice(props.depends_on)},\n`;
        code += `    })\n\n`;
        return code;
    }

    // Ruby step generator
    generateStepSDKCodeRuby(step, index) {
        let code = '';
        
        switch (step.type) {
            case 'command':
                code += this.generateCommandStepRuby(step);
                break;
            case 'wait':
                code += this.generateWaitStepRuby(step);
                break;
            case 'block':
                code += this.generateBlockStepRuby(step);
                break;
            case 'input':
                code += this.generateInputStepRuby(step);
                break;
            case 'trigger':
                code += this.generateTriggerStepRuby(step);
                break;
            case 'group':
                code += this.generateGroupStepRuby(step);
                break;
            default:
                code += `# Unknown step type: ${step.type}\n`;
        }

        return code;
    }

    generateCommandStepRuby(step) {
        const props = step.properties || {};
        let code = `# ${props.label || 'Command Step'}\n`;
        code += `pipeline.add_command_step(\n`;
        code += `  command: ${this.formatValueRuby(props.command || 'echo "Hello, World!"')},\n`;
        
        if (props.label) code += `  label: ${this.formatValueRuby(props.label)},\n`;
        if (props.key) code += `  key: ${this.formatValueRuby(props.key)},\n`;
        if (props.depends_on) code += `  depends_on: ${this.formatValueRuby(props.depends_on)},\n`;
        if (props.env) code += `  env: ${this.formatObjectRuby(props.env)},\n`;
        if (props.timeout_in_minutes) code += `  timeout_in_minutes: ${props.timeout_in_minutes},\n`;
        if (props.parallelism) code += `  parallelism: ${props.parallelism},\n`;
        if (props.artifact_paths) code += `  artifact_paths: ${this.formatValueRuby(props.artifact_paths)},\n`;
        if (props.agents) code += `  agents: ${this.formatObjectRuby(props.agents)},\n`;
        if (props.retry) code += `  retry: ${this.formatRetryRuby(props.retry)},\n`;
        if (props.soft_fail !== undefined) code += `  soft_fail: ${this.formatSoftFailRuby(props.soft_fail)},\n`;
        if (props.plugins && Object.keys(props.plugins).length > 0) {
            code += `  plugins: [\n`;
            Object.entries(props.plugins).forEach(([name, config]) => {
                code += `    { "${name}" => ${JSON.stringify(config, null, 2).replace(/"/g, "'").replace(/\n/g, '\n    ')} },\n`;
            });
            code += `  ]\n`;
        }
        
        code = code.replace(/,\n$/, '\n');
        code += `)\n\n`;
        return code;
    }

    generateWaitStepRuby(step) {
        const props = step.properties || {};
        let code = `# Wait Step\n`;
        code += `pipeline.add_wait_step`;
        
        const hasProps = props.depends_on || props.if || props.allow_dependency_failure || props.continue_on_failure;
        if (hasProps) {
            code += `(\n`;
            if (props.depends_on) code += `  depends_on: ${this.formatValueRuby(props.depends_on)},\n`;
            if (props.if) code += `  if: ${this.formatValueRuby(props.if)},\n`;
            if (props.allow_dependency_failure) code += `  allow_dependency_failure: ${props.allow_dependency_failure},\n`;
            if (props.continue_on_failure) code += `  continue_on_failure: ${props.continue_on_failure},\n`;
            code = code.replace(/,\n$/, '\n');
            code += `)`;
        }
        
        code += `\n\n`;
        return code;
    }

    generateBlockStepRuby(step) {
        const props = step.properties || {};
        let code = `# Block Step: ${props.block || 'Manual Approval'}\n`;
        code += `pipeline.add_block_step(\n`;
        code += `  block: ${this.formatValueRuby(props.block || 'Manual Approval')},\n`;
        if (props.key) code += `  key: ${this.formatValueRuby(props.key)},\n`;
        if (props.depends_on) code += `  depends_on: ${this.formatValueRuby(props.depends_on)},\n`;
        if (props.fields && props.fields.length > 0) {
            code += `  fields: [\n`;
            props.fields.forEach(field => {
                code += `    ${this.formatBlockFieldRuby(field)},\n`;
            });
            code += `  ],\n`;
        }
        code = code.replace(/,\n$/, '\n');
        code += `)\n\n`;
        return code;
    }

    generateInputStepRuby(step) {
        const props = step.properties || {};
        let code = `# Input Step\n`;
        code += `pipeline.add_input_step(\n`;
        code += `  prompt: ${this.formatValueRuby(props.prompt || 'Please provide input')},\n`;
        if (props.key) code += `  key: ${this.formatValueRuby(props.key)},\n`;
        if (props.depends_on) code += `  depends_on: ${this.formatValueRuby(props.depends_on)},\n`;
        if (props.fields && props.fields.length > 0) {
            code += `  fields: [\n`;
            props.fields.forEach(field => {
                code += `    ${this.formatInputFieldRuby(field)},\n`;
            });
            code += `  ],\n`;
        }
        code = code.replace(/,\n$/, '\n');
        code += `)\n\n`;
        return code;
    }

    generateTriggerStepRuby(step) {
        const props = step.properties || {};
        let code = `# Trigger Step\n`;
        code += `pipeline.add_trigger_step(\n`;
        code += `  trigger: ${this.formatValueRuby(props.trigger || 'downstream-pipeline')},\n`;
        if (props.label) code += `  label: ${this.formatValueRuby(props.label)},\n`;
        if (props.depends_on) code += `  depends_on: ${this.formatValueRuby(props.depends_on)},\n`;
        if (props.build) {
            const build = props.build;
            code += `  build: {\n`;
            if (build.message) code += `    message: ${this.formatValueRuby(build.message)},\n`;
            if (build.branch) code += `    branch: ${this.formatValueRuby(build.branch)},\n`;
            if (build.commit) code += `    commit: ${this.formatValueRuby(build.commit)},\n`;
            if (build.env) code += `    env: ${this.formatObjectRuby(build.env)},\n`;
            if (build.meta_data) code += `    meta_data: ${this.formatObjectRuby(build.meta_data)},\n`;
            code = code.replace(/,\n(\s+)}/g, '\n$1}');
            code += `  },\n`;
        }
        code = code.replace(/,\n$/, '\n');
        code += `)\n\n`;
        return code;
    }

    generateGroupStepRuby(step) {
        const props = step.properties || {};
        let code = `# Group Step: ${props.group || 'Step Group'}\n`;
        code += `pipeline.add_group_step(\n`;
        code += `  group: ${this.formatValueRuby(props.group || 'Step Group')},\n`;
        if (props.key) code += `  key: ${this.formatValueRuby(props.key)},\n`;
        if (props.depends_on) code += `  depends_on: ${this.formatValueRuby(props.depends_on)},\n`;
        if (props.steps && props.steps.length > 0) {
            code += `  steps: [\n`;
            code += `    # Add sub-steps here\n`;
            code += `  ],\n`;
        }
        code = code.replace(/,\n$/, '\n');
        code += `)\n\n`;
        return code;
    }

    // Helper methods for Python formatting
    formatValuePython(value) {
        if (Array.isArray(value)) {
            return `[${value.map(v => this.formatValuePython(v)).join(', ')}]`;
        }
        if (typeof value === 'string') {
            return `"${value}"`;
        }
        return value;
    }

    formatObjectPython(obj) {
        if (!obj || Object.keys(obj).length === 0) return '{}';
        const items = Object.entries(obj).map(([k, v]) => `"${k}": ${this.formatValuePython(v)}`);
        return `{${items.join(', ')}}`;
    }

    formatRetryPython(retry) {
        if (typeof retry === 'boolean') return retry ? 'True' : 'False';
        if (typeof retry === 'object') {
            const items = [];
            if (retry.automatic !== undefined) {
                items.push(`"automatic": ${retry.automatic ? 'True' : 'False'}`);
            }
            if (retry.manual !== undefined) {
                items.push(`"manual": ${retry.manual ? 'True' : 'False'}`);
            }
            return `{${items.join(', ')}}`;
        }
        return 'None';
    }

    formatSoftFailPython(softFail) {
        if (typeof softFail === 'boolean') return softFail ? 'True' : 'False';
        if (Array.isArray(softFail)) {
            return `[${softFail.map(v => this.formatValuePython(v)).join(', ')}]`;
        }
        return 'False';
    }

    formatBlockFieldPython(field) {
        let items = [`"key": "${field.key}"`, `"type": "${field.type}"`];
        if (field.text) items.push(`"text": "${field.text}"`);
        if (field.hint) items.push(`"hint": "${field.hint}"`);
        if (field.required) items.push(`"required": True`);
        if (field.default) items.push(`"default": "${field.default}"`);
        if (field.options && field.type === 'select') {
            const options = field.options.map(opt => {
                if (typeof opt === 'string') return `{"label": "${opt}", "value": "${opt}"}`;
                return `{"label": "${opt.label}", "value": "${opt.value}"}`;
            });
            items.push(`"options": [${options.join(', ')}]`);
        }
        return `{${items.join(', ')}}`;
    }

    formatInputFieldPython(field) {
        return this.formatBlockFieldPython(field);
    }

    // Helper methods for Go formatting
    formatGoStringSlice(value) {
        if (Array.isArray(value)) {
            return `[]string{${value.map(v => `"${v}"`).join(', ')}}`;
        }
        if (typeof value === 'string') {
            return `[]string{"${value}"}`;
        }
        return 'nil';
    }

    formatGoMap(obj) {
        if (!obj || Object.keys(obj).length === 0) return 'nil';
        const items = Object.entries(obj).map(([k, v]) => `"${k}": "${v}"`);
        return `map[string]string{${items.join(', ')}}`;
    }

    formatRetryGo(retry) {
        if (typeof retry === 'boolean') {
            return retry ? '&buildkite.RetryRules{Automatic: buildkite.Bool(true)}' : 'nil';
        }
        if (typeof retry === 'object') {
            let items = [];
            if (retry.automatic !== undefined) items.push(`Automatic: buildkite.Bool(${retry.automatic})`);
            if (retry.manual !== undefined) items.push(`Manual: buildkite.Bool(${retry.manual})`);
            return `&buildkite.RetryRules{${items.join(', ')}}`;
        }
        return 'nil';
    }

    formatSoftFailGo(softFail) {
        if (typeof softFail === 'boolean') {
            return `buildkite.Bool(${softFail})`;
        }
        if (Array.isArray(softFail)) {
            const exitStatuses = softFail.filter(v => typeof v === 'object' && v.exit_status !== undefined)
                .map(v => v.exit_status);
            if (exitStatuses.length > 0) {
                return `&buildkite.SoftFailUnion{ExitStatuses: []int{${exitStatuses.join(', ')}}}`;
            }
        }
        return 'nil';
    }

    // Helper methods for Ruby formatting
    formatValueRuby(value) {
        if (Array.isArray(value)) {
            return `[${value.map(v => this.formatValueRuby(v)).join(', ')}]`;
        }
        if (typeof value === 'string') {
            return `"${value}"`;
        }
        return value;
    }

    formatObjectRuby(obj) {
        if (!obj || Object.keys(obj).length === 0) return '{}';
        const items = Object.entries(obj).map(([k, v]) => `"${k}" => ${this.formatValueRuby(v)}`);
        return `{ ${items.join(', ')} }`;
    }

    formatRetryRuby(retry) {
        if (typeof retry === 'boolean') return retry;
        if (typeof retry === 'object') {
            const items = [];
            if (retry.automatic !== undefined) items.push(`automatic: ${retry.automatic}`);
            if (retry.manual !== undefined) items.push(`manual: ${retry.manual}`);
            return `{ ${items.join(', ')} }`;
        }
        return 'nil';
    }

    formatSoftFailRuby(softFail) {
        if (typeof softFail === 'boolean') return softFail;
        if (Array.isArray(softFail)) {
            return `[${softFail.map(v => {
                if (typeof v === 'object' && v.exit_status !== undefined) {
                    return `{ exit_status: ${v.exit_status} }`;
                }
                return this.formatValueRuby(v);
            }).join(', ')}]`;
        }
        return 'false';
    }

    formatBlockFieldRuby(field) {
        let items = [`key: "${field.key}"`, `type: "${field.type}"`];
        if (field.text) items.push(`text: "${field.text}"`);
        if (field.hint) items.push(`hint: "${field.hint}"`);
        if (field.required) items.push(`required: true`);
        if (field.default) items.push(`default: "${field.default}"`);
        if (field.options && field.type === 'select') {
            const options = field.options.map(opt => {
                if (typeof opt === 'string') return `{ label: "${opt}", value: "${opt}" }`;
                return `{ label: "${opt.label}", value: "${opt.value}" }`;
            });
            items.push(`options: [${options.join(', ')}]`);
        }
        return `{ ${items.join(', ')} }`;
    }

    formatInputFieldRuby(field) {
        return this.formatBlockFieldRuby(field);
    }
}

// Create and export singleton instance
const sdkIntegration = new BuildkiteSDKIntegration();
window.buildkiteSDK = sdkIntegration;

// Make it available as a module export as well
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sdkIntegration;
}