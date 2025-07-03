// js/app.js
// Main Application Initialization with ALL functionality

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Buildkite Pipeline Builder...');
    
    // Initialize the pipeline builder
    window.pipelineBuilder = new PipelineBuilder();
    
    // Setup all event handlers
    setupHeaderButtons();
    setupQuickActionButtons();
    setupTemplateHandlers();
    setupPluginQuickstart();
    setupCommandPalette();
    setupKeyboardShortcuts();
    setupModalHandlers();
    setupValidationButton();
    
    console.log('✅ Buildkite Pipeline Builder ready with ALL features!');
});

function setupHeaderButtons() {
    // Clear Pipeline button
    const clearBtn = document.getElementById('clear-pipeline');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            window.pipelineBuilder.clearPipeline();
        });
    }
    
    // Load Example button
    const loadBtn = document.getElementById('load-example');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            window.pipelineBuilder.loadExample();
        });
    }
    
    // Export YAML button
    const exportBtn = document.getElementById('export-yaml');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.pipelineBuilder.exportYAML();
        });
    }
    
    console.log('✅ Header buttons configured');
}

function setupQuickActionButtons() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        console.log(`🎯 Action clicked: ${action}`);
        
        switch (action) {
            case 'template':
            case 'step-templates':
                showTemplates();
                break;
            case 'plugin-catalog':
                window.pipelineBuilder.showPluginCatalog();
                break;
            case 'matrix-builder':
                showModal('matrix-builder-modal');
                break;
            case 'dependencies':
            case 'dependency-graph':
                showModal('dependency-graph-modal');
                break;
            case 'conditional-builder':
                showModal('conditional-builder-modal');
                break;
            case 'pipeline-validator':
            case 'validate':
                validatePipeline();
                break;
            case 'preview':
                previewPipeline();
                break;
        }
    });
}

function setupTemplateHandlers() {
    document.addEventListener('click', (e) => {
        // Template items
        const templateItem = e.target.closest('[data-template]');
        if (templateItem) {
            const templateKey = templateItem.dataset.template;
            window.pipelineBuilder.loadTemplate(templateKey);
        }
        
        // Pattern items
        const patternItem = e.target.closest('[data-pattern]');
        if (patternItem) {
            const patternKey = patternItem.dataset.pattern;
            loadPattern(patternKey);
        }
    });
}

function setupPluginQuickstart() {
    document.addEventListener('click', (e) => {
        const pluginQuick = e.target.closest('[data-plugin]');
        if (pluginQuick) {
            const pluginKey = pluginQuick.dataset.plugin;
            if (window.pipelineBuilder.selectedStep) {
                window.pipelineBuilder.addPluginToSelectedStep(pluginKey);
            } else {
                alert('Please select a step first');
            }
        }
    });
}

function setupCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (!palette) return;
    
    const input = palette.querySelector('.command-palette-input');
    const results = palette.querySelector('.command-palette-results');
    
    // Command list
    const commands = [
        { name: 'Add Command Step', icon: 'fa-terminal', action: () => window.pipelineBuilder.addStep('command') },
        { name: 'Add Wait Step', icon: 'fa-hourglass-half', action: () => window.pipelineBuilder.addStep('wait') },
        { name: 'Add Block Step', icon: 'fa-hand-paper', action: () => window.pipelineBuilder.addStep('block') },
        { name: 'Add Input Step', icon: 'fa-keyboard', action: () => window.pipelineBuilder.addStep('input') },
        { name: 'Add Trigger Step', icon: 'fa-bolt', action: () => window.pipelineBuilder.addStep('trigger') },
        { name: 'Add Group Step', icon: 'fa-layer-group', action: () => window.pipelineBuilder.addStep('group') },
        { name: 'Export YAML', icon: 'fa-download', action: () => window.pipelineBuilder.exportYAML() },
        { name: 'Clear Pipeline', icon: 'fa-trash', action: () => window.pipelineBuilder.clearPipeline() },
        { name: 'Load Example', icon: 'fa-file-import', action: () => window.pipelineBuilder.loadExample() },
        { name: 'Show Templates', icon: 'fa-file-alt', action: () => showTemplates() },
        { name: 'Show Plugin Catalog', icon: 'fa-store', action: () => window.pipelineBuilder.showPluginCatalog() },
        { name: 'Open Matrix Builder', icon: 'fa-th', action: () => showModal('matrix-builder-modal') },
        { name: 'Show Dependencies', icon: 'fa-project-diagram', action: () => showModal('dependency-graph-modal') },
        { name: 'Validate Pipeline', icon: 'fa-check-circle', action: () => validatePipeline() },
        { name: 'Preview Pipeline', icon: 'fa-eye', action: () => previewPipeline() },
        { name: 'Show Keyboard Shortcuts', icon: 'fa-keyboard', action: () => showModal('shortcuts-modal') }
    ];
    
    let selectedIndex = 0;
    
    // Filter and display commands
    function updateResults(query) {
        const filtered = commands.filter(cmd => 
            cmd.name.toLowerCase().includes(query.toLowerCase())
        );
        
        selectedIndex = 0;
        
        results.innerHTML = filtered.map((cmd, index) => `
            <div class="command-item ${index === selectedIndex ? 'selected' : ''}" data-index="${index}">
                <i class="fas ${cmd.icon}"></i>
                <span>${cmd.name}</span>
            </div>
        `).join('');
        
        return filtered;
    }
    
    // Initial render
    let currentCommands = updateResults('');
    
    // Input handling
    input.addEventListener('input', (e) => {
        currentCommands = updateResults(e.target.value);
    });
    
    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            palette.classList.add('hidden');
            input.value = '';
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, currentCommands.length - 1);
            updateSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentCommands[selectedIndex]) {
                currentCommands[selectedIndex].action();
                palette.classList.add('hidden');
                input.value = '';
            }
        }
    });
    
    // Click handling
    results.addEventListener('click', (e) => {
        const item = e.target.closest('.command-item');
        if (item) {
            const index = parseInt(item.dataset.index);
            if (currentCommands[index]) {
                currentCommands[index].action();
                palette.classList.add('hidden');
                input.value = '';
            }
        }
    });
    
    function updateSelection() {
        const items = results.querySelectorAll('.command-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === selectedIndex);
        });
    }
    
    // Open command palette
    window.pipelineBuilder.openCommandPalette = function() {
        palette.classList.remove('hidden');
        input.focus();
        input.value = '';
        currentCommands = updateResults('');
    };
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for command palette
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const palette = document.getElementById('command-palette');
            if (palette) {
                palette.classList.remove('hidden');
                const input = palette.querySelector('.command-palette-input');
                if (input) {
                    input.focus();
                    input.value = '';
                }
            }
        }
        
        // Ctrl/Cmd + S to export YAML
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            window.pipelineBuilder.exportYAML();
        }
        
        // Ctrl/Cmd + N to clear pipeline
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            window.pipelineBuilder.clearPipeline();
        }
        
        // Ctrl/Cmd + E to load example
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            window.pipelineBuilder.loadExample();
        }
        
        // Delete key to remove selected step
        if (e.key === 'Delete' && window.pipelineBuilder.selectedStep) {
            const activeElement = document.activeElement;
            // Only delete if not typing in an input
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                window.pipelineBuilder.removeStep(window.pipelineBuilder.selectedStep);
            }
        }
        
        // ? to show shortcuts
        if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
            const activeElement = document.activeElement;
            if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                showModal('shortcuts-modal');
            }
        }
    });
}

function setupModalHandlers() {
    // Close button handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
    
    // ESC to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach(modal => modal.classList.add('hidden'));
        }
    });
}

function setupValidationButton() {
    const validateBtn = document.getElementById('validate-pipeline');
    if (validateBtn) {
        validateBtn.addEventListener('click', validatePipeline);
    }
}

// Feature implementations
function showTemplates() {
    showModal('templates-modal');
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function loadPattern(patternKey) {
    const patterns = {
        'ci-cd-basic': {
            name: 'Basic CI/CD',
            steps: [
                { type: 'command', properties: { label: '📦 Install', command: 'npm ci' }},
                { type: 'command', properties: { label: '🧪 Test', command: 'npm test' }},
                { type: 'command', properties: { label: '🔨 Build', command: 'npm run build' }},
                { type: 'block', properties: { label: 'Deploy', block: ':rocket: Deploy' }},
                { type: 'command', properties: { label: '🚀 Deploy', command: 'npm run deploy' }}
            ]
        },
        'microservices': {
            name: 'Microservices',
            steps: [
                { type: 'group', properties: { label: 'Service A', group: 'Service A' }},
                { type: 'group', properties: { label: 'Service B', group: 'Service B' }},
                { type: 'group', properties: { label: 'Service C', group: 'Service C' }},
                { type: 'wait', properties: { label: 'Wait for services' }},
                { type: 'command', properties: { label: '🧪 Integration Tests', command: 'npm run test:integration' }}
            ]
        },
        'matrix-testing': {
            name: 'Matrix Testing',
            steps: [
                { type: 'command', properties: { 
                    label: '🧪 Matrix Tests', 
                    command: 'npm test',
                    matrix: {
                        setup: {
                            os: ['ubuntu', 'windows', 'macos'],
                            node: ['16', '18', '20']
                        }
                    }
                }}
            ]
        }
    };
    
    const pattern = patterns[patternKey];
    if (pattern) {
        window.pipelineBuilder.loadTemplate(patternKey);
    }
}

function validatePipeline() {
    if (window.pipelineBuilder.steps.length === 0) {
        alert('Pipeline is empty. Add some steps first!');
        return;
    }
    
    // Basic validation
    let isValid = true;
    const errors = [];
    
    window.pipelineBuilder.steps.forEach((step, index) => {
        if (!step.properties.label || step.properties.label.trim() === '') {
            errors.push(`Step ${index + 1} (${step.type}) is missing a label`);
            isValid = false;
        }
        
        if (step.type === 'command' && (!step.properties.command || step.properties.command.trim() === '')) {
            errors.push(`Command step "${step.properties.label || 'Unnamed'}" is missing a command`);
            isValid = false;
        }
    });
    
    if (isValid) {
        alert('✅ Pipeline validation passed!');
    } else {
        alert('❌ Pipeline validation failed:\n\n' + errors.join('\n'));
    }
}

function previewPipeline() {
    if (window.yamlGenerator) {
        const yaml = window.yamlGenerator.generateYAML(window.pipelineBuilder.steps);
        
        const modal = document.getElementById('yaml-modal');
        const output = document.getElementById('yaml-output');
        
        if (modal && output) {
            output.value = yaml;
            modal.classList.remove('hidden');
        }
    } else {
        alert('YAML generator not available');
    }
}

// Global utility functions
window.downloadYAML = function() {
    if (window.yamlGenerator && window.pipelineBuilder) {
        const yaml = window.yamlGenerator.generateYAML(window.pipelineBuilder.steps);
        const blob = new Blob([yaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pipeline.yml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Additional modal styles
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .command-item {
        padding: 0.75rem 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .command-item:hover {
        background: #f7fafc;
    }
    
    .command-item.selected {
        background: #edf2f7;
        border-left: 3px solid #667eea;
    }
    
    .command-item i {
        color: #667eea;
        width: 20px;
        text-align: center;
    }
    
    .template-item, .pattern-item {
        cursor: pointer;
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 0.75rem;
        transition: all 0.2s ease;
    }
    
    .template-item:hover, .pattern-item:hover {
        border-color: #667eea;
        background: #f7fafc;
    }
`;
document.head.appendChild(modalStyles);