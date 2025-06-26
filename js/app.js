// Main Application Logic and Additional Features
class BuildkiteApp {
    constructor() {
        this.version = '1.0.0';
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.setupKeyboardShortcuts();
        this.setupTooltips();
        this.displayWelcomeMessage();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S - Export YAML
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                pipelineBuilder.exportYAML();
            }
            
            // Ctrl/Cmd + N - Clear pipeline
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                pipelineBuilder.clearPipeline();
            }
            
            // Ctrl/Cmd + E - Load example
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                pipelineBuilder.loadExample();
            }
            
            // Delete key - Remove selected step
            if (e.key === 'Delete' && pipelineBuilder.selectedStep) {
                const stepIndex = pipelineBuilder.steps.findIndex(
                    step => step.id === pipelineBuilder.selectedStep.id
                );
                if (stepIndex !== -1) {
                    pipelineBuilder.removeStep(stepIndex);
                }
            }
            
            // Escape key - Deselect step
            if (e.key === 'Escape') {
                pipelineBuilder.selectedStep = null;
                pipelineBuilder.renderProperties();
                document.querySelectorAll('.pipeline-step').forEach(el => {
                    el.classList.remove('selected');
                });
            }
        });
    }

    setupTooltips() {
        // Add keyboard shortcut hints to buttons
        const shortcuts = {
            'export-yaml': 'Ctrl+S',
            'clear-pipeline': 'Ctrl+N',
            'load-example': 'Ctrl+E'
        };

        Object.entries(shortcuts).forEach(([id, shortcut]) => {
            const button = document.getElementById(id);
            if (button) {
                const originalTitle = button.title || '';
                button.title = originalTitle + (originalTitle ? ' ' : '') + `(${shortcut})`;
            }
        });
    }

    displayWelcomeMessage() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║              🚀 Buildkite Pipeline Builder v${this.version}              ║
║                                                              ║
║  Welcome to the visual pipeline builder for Buildkite!      ║
║                                                              ║
║  Features:                                                   ║
║  • Drag & drop step creation                                 ║
║  • Visual pipeline editing                                   ║
║  • Real-time YAML generation                                 ║
║  • Example pipelines                                         ║
║                                                              ║
║  Keyboard Shortcuts:                                         ║
║  • Ctrl+S: Export YAML                                       ║
║  • Ctrl+N: Clear pipeline                                    ║
║  • Ctrl+E: Load example                                      ║
║  • Delete: Remove selected step                              ║
║  • Escape: Deselect step                                     ║
║                                                              ║
║  Drag step types from the sidebar to start building!        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `);
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('buildkite-pipeline-builder-settings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('buildkite-pipeline-builder-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    getDefaultSettings() {
        return {
            theme: 'light',
            autoSave: true,
            showHints: true,
            defaultTimeout: 10,
            defaultAgentQueue: 'default'
        };
    }

    // Pipeline templates for quick start
    getTemplates() {
        return {
            'basic-ci': {
                name: 'Basic CI Pipeline',
                description: 'A simple CI pipeline with test and build steps',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Install Dependencies',
                            command: 'npm install'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Run Linting',
                            command: 'npm run lint'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Run Tests',
                            command: 'npm test'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Application',
                            command: 'npm run build'
                        }
                    }
                ]
            },
            'deploy-pipeline': {
                name: 'Deployment Pipeline',
                description: 'CI/CD pipeline with manual approval before deployment',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Run Tests',
                            command: 'npm test'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Application',
                            command: 'npm run build'
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'block',
                        properties: {
                            label: 'Deploy to Production',
                            prompt: 'Ready to deploy to production?'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy',
                            command: 'npm run deploy'
                        }
                    }
                ]
            },
            'parallel-tests': {
                name: 'Parallel Test Pipeline',
                description: 'Pipeline with parallel test execution',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Setup',
                            command: 'npm install'
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'group',
                        properties: {
                            label: 'Parallel Tests',
                            steps: [
                                { command: 'npm run test:unit', label: 'Unit Tests' },
                                { command: 'npm run test:integration', label: 'Integration Tests' },
                                { command: 'npm run test:e2e', label: 'E2E Tests' }
                            ]
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Generate Report',
                            command: 'npm run test:report'
                        }
                    }
                ]
            }
        };
    }

    // Pipeline validation
    validatePipeline(steps) {
        const warnings = [];
        const errors = [];

        // Check for empty pipeline
        if (!steps || steps.length === 0) {
            warnings.push('Pipeline is empty');
            return { errors, warnings };
        }

        // Check for steps without labels
        steps.forEach((step, index) => {
            if (!step.properties.label || step.properties.label.trim() === '') {
                warnings.push(`Step ${index + 1}: Missing or empty label`);
            }
        });

        // Check for command steps without commands
        steps.forEach((step, index) => {
            if (step.type === 'command' && (!step.properties.command || step.properties.command.trim() === '')) {
                errors.push(`Step ${index + 1}: Command step missing command`);
            }
        });

        // Check for trigger steps without pipeline reference
        steps.forEach((step, index) => {
            if (step.type === 'trigger' && (!step.properties.trigger || step.properties.trigger.trim() === '')) {
                errors.push(`Step ${index + 1}: Trigger step missing pipeline reference`);
            }
        });

        // Check for potential issues
        const hasWaitStep = steps.some(step => step.type === 'wait');
        const hasBlockStep = steps.some(step => step.type === 'block');
        
        if (!hasWaitStep && steps.length > 3) {
            warnings.push('Consider adding wait steps for better pipeline flow control');
        }

        if (hasBlockStep && !hasWaitStep) {
            warnings.push('Block steps typically work better with wait steps');
        }

        return { errors, warnings };
    }

    // Export pipeline as JSON for backup/sharing
    exportPipelineJSON() {
        const pipeline = {
            version: this.version,
            created: new Date().toISOString(),
            steps: pipelineBuilder.steps
        };
        
        const blob = new Blob([JSON.stringify(pipeline, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'buildkite-pipeline.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Import pipeline from JSON
    importPipelineJSON(jsonString) {
        try {
            const pipeline = JSON.parse(jsonString);
            
            if (!pipeline.steps || !Array.isArray(pipeline.steps)) {
                throw new Error('Invalid pipeline format');
            }
            
            pipelineBuilder.steps = pipeline.steps;
            pipelineBuilder.selectedStep = null;
            pipelineBuilder.renderPipeline();
            pipelineBuilder.renderProperties();
            
            return true;
        } catch (error) {
            console.error('Failed to import pipeline:', error);
            alert('Failed to import pipeline: ' + error.message);
            return false;
        }
    }

    // Generate pipeline documentation
    generateDocumentation(steps) {
        let doc = '# Pipeline Documentation\n\n';
        doc += `Generated on: ${new Date().toLocaleString()}\n\n`;
        doc += `Total steps: ${steps.length}\n\n`;
        
        if (steps.length === 0) {
            doc += 'No steps defined.\n';
            return doc;
        }
        
        doc += '## Steps\n\n';
        
        steps.forEach((step, index) => {
            doc += `### ${index + 1}. ${step.properties.label || 'Unnamed Step'}\n\n`;
            doc += `**Type:** ${step.type}\n\n`;
            
            switch (step.type) {
                case 'command':
                    if (step.properties.command) {
                        doc += `**Command:**\n\`\`\`bash\n${step.properties.command}\n\`\`\`\n\n`;
                    }
                    if (step.properties.agents) {
                        doc += `**Agents:** ${step.properties.agents}\n\n`;
                    }
                    break;
                case 'trigger':
                    if (step.properties.trigger) {
                        doc += `**Triggers:** ${step.properties.trigger}\n\n`;
                    }
                    break;
                case 'block':
                    if (step.properties.prompt) {
                        doc += `**Prompt:** ${step.properties.prompt}\n\n`;
                    }
                    break;
                case 'input':
                    if (step.properties.prompt) {
                        doc += `**Prompt:** ${step.properties.prompt}\n\n`;
                    }
                    if (step.properties.fields && step.properties.fields.length > 0) {
                        doc += '**Input Fields:**\n';
                        step.properties.fields.forEach(field => {
                            doc += `- ${field.text || field.key} (${field.required ? 'required' : 'optional'})\n`;
                        });
                        doc += '\n';
                    }
                    break;
            }
        });
        
        return doc;
    }
}

// Initialize app when DOM is ready
let buildkiteApp;
document.addEventListener('DOMContentLoaded', () => {
    buildkiteApp = new BuildkiteApp();
});

// Add global error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});

// Add visibility change handler for auto-save
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && buildkiteApp?.settings?.autoSave) {
        // Auto-save pipeline state to localStorage
        try {
            const pipelineState = {
                steps: pipelineBuilder?.steps || [],
                timestamp: Date.now()
            };
            localStorage.setItem('buildkite-pipeline-autosave', JSON.stringify(pipelineState));
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }
});
