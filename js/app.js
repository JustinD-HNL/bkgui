// js/app.js
// Main Application Initialization with ALL functionality

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Buildkite Pipeline Builder...');
    
    // Note: Pipeline builder is now initialized by main-init.js
    // This file focuses on specific UI event handlers
    
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
            if (window.pipelineBuilder && window.pipelineBuilder.clearPipeline) {
                window.pipelineBuilder.clearPipeline();
            } else {
                console.warn('Clear pipeline functionality not available');
            }
        });
    }
    
    // Load Example button
    const loadBtn = document.getElementById('load-example');
    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            if (window.pipelineBuilder && window.pipelineBuilder.loadExample) {
                window.pipelineBuilder.loadExample();
            } else {
                console.warn('Load example functionality not available');
            }
        });
    }
    
    // Export YAML button
    const exportBtn = document.getElementById('export-yaml');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (window.pipelineBuilder && window.pipelineBuilder.exportYAML) {
                window.pipelineBuilder.exportYAML();
            } else {
                console.warn('Export YAML functionality not available');
            }
        });
    }
    
    console.log('✅ Header buttons configured');
}

// FIXED: Quick action buttons now properly delegate to the right methods
function setupQuickActionButtons() {
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;
        
        const action = button.dataset.action;
        console.log(`🎯 Action clicked: ${action}`);
        
        switch (action) {
            case 'template':
            case 'step-templates':
                handleStepTemplates();
                break;
            case 'plugin-catalog':
                handlePluginCatalog();
                break;
            case 'matrix-builder':
                handleMatrixBuilder();
                break;
            case 'dependencies':
            case 'dependency-graph':
                handleDependencyGraph();
                break;
            case 'conditional-builder':
                handleConditionalBuilder();
                break;
            case 'pipeline-validator':
            case 'validate':
                handlePipelineValidation();
                break;
            case 'preview':
                handlePipelinePreview();
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    });
    
    console.log('✅ Quick action buttons configured');
}

// FIXED: Proper action handlers that delegate to the right objects
function handleStepTemplates() {
    if (window.mainInitializer && window.mainInitializer.showStepTemplates) {
        window.mainInitializer.showStepTemplates();
    } else if (typeof showTemplates === 'function') {
        showTemplates();
    } else {
        console.warn('Step templates functionality not available');
        showModal('step-templates-modal');
    }
}

function handlePluginCatalog() {
    if (window.mainInitializer && window.mainInitializer.showPluginCatalog) {
        window.mainInitializer.showPluginCatalog();
    } else if (window.pipelineBuilder && window.pipelineBuilder.showPluginCatalog) {
        window.pipelineBuilder.showPluginCatalog();
    } else {
        console.warn('Plugin catalog functionality not available');
        showModal('plugin-catalog-modal');
    }
}

function handleMatrixBuilder() {
    if (window.mainInitializer && window.mainInitializer.showMatrixBuilder) {
        window.mainInitializer.showMatrixBuilder();
    } else if (typeof showModal === 'function') {
        showModal('matrix-builder-modal');
    } else {
        console.warn('Matrix builder functionality not available');
    }
}

function handleDependencyGraph() {
    if (window.mainInitializer && window.mainInitializer.showDependencyManager) {
        window.mainInitializer.showDependencyManager();
    } else if (typeof showModal === 'function') {
        showModal('dependency-graph-modal');
    } else {
        console.warn('Dependency graph functionality not available');
    }
}

function handleConditionalBuilder() {
    if (typeof showModal === 'function') {
        showModal('conditional-builder-modal');
    } else {
        console.warn('Conditional builder functionality not available');
    }
}

function handlePipelineValidation() {
    if (window.mainInitializer && window.mainInitializer.validatePipeline) {
        window.mainInitializer.validatePipeline();
    } else if (window.pipelineBuilder && window.pipelineBuilder.validatePipeline) {
        window.pipelineBuilder.validatePipeline();
    } else if (typeof validatePipeline === 'function') {
        validatePipeline();
    } else {
        console.warn('Pipeline validation functionality not available');
        alert('Pipeline validation is not available');
    }
}

function handlePipelinePreview() {
    if (typeof previewPipeline === 'function') {
        previewPipeline();
    } else {
        console.warn('Pipeline preview functionality not available');
        alert('Pipeline preview is not available');
    }
}

function setupTemplateHandlers() {
    document.addEventListener('click', (e) => {
        // Template items
        const templateItem = e.target.closest('[data-template]');
        if (templateItem) {
            const templateKey = templateItem.dataset.template;
            if (window.pipelineBuilder && window.pipelineBuilder.loadTemplate) {
                window.pipelineBuilder.loadTemplate(templateKey);
            } else {
                console.warn(`Template loading not available: ${templateKey}`);
            }
        }
        
        // Pattern items
        const patternItem = e.target.closest('[data-pattern]');
        if (patternItem) {
            const patternKey = patternItem.dataset.pattern;
            if (typeof loadPattern === 'function') {
                loadPattern(patternKey);
            } else {
                console.warn(`Pattern loading not available: ${patternKey}`);
            }
        }
    });
    
    console.log('✅ Template handlers configured');
}

function setupPluginQuickstart() {
    document.addEventListener('click', (e) => {
        const pluginQuick = e.target.closest('[data-plugin]');
        if (pluginQuick) {
            const pluginKey = pluginQuick.dataset.plugin;
            console.log(`🔌 Quick plugin requested: ${pluginKey}`);
            
            if (window.pipelineBuilder && window.pipelineBuilder.addPluginStep) {
                window.pipelineBuilder.addPluginStep(pluginKey);
            } else if (window.pipelineBuilder && window.pipelineBuilder.selectedStep) {
                // Try to add plugin to selected step
                if (window.pipelineBuilder.addPluginToSelectedStep) {
                    window.pipelineBuilder.addPluginToSelectedStep(pluginKey);
                } else {
                    console.warn('Plugin functionality not available');
                    alert('Please select a command step first');
                }
            } else {
                console.warn('Plugin functionality not available');
                alert('Please select a step first or ensure pipeline builder is loaded');
            }
        }
    });
    
    console.log('✅ Plugin quickstart configured');
}

function setupCommandPalette() {
    const palette = document.getElementById('command-palette');
    if (!palette) return;
    
    const input = palette.querySelector('.command-palette-input');
    const results = palette.querySelector('.command-palette-results');
    
    // Command list - FIXED: Use proper method references
    const commands = [
        { name: 'Add Command Step', icon: 'fa-terminal', action: () => addStepSafely('command') },
        { name: 'Add Wait Step', icon: 'fa-hourglass-half', action: () => addStepSafely('wait') },
        { name: 'Add Block Step', icon: 'fa-hand-paper', action: () => addStepSafely('block') },
        { name: 'Add Input Step', icon: 'fa-keyboard', action: () => addStepSafely('input') },
        { name: 'Add Trigger Step', icon: 'fa-bolt', action: () => addStepSafely('trigger') },
        { name: 'Add Group Step', icon: 'fa-layer-group', action: () => addStepSafely('group') },
        { name: 'Export YAML', icon: 'fa-download', action: () => exportYAMLSafely() },
        { name: 'Clear Pipeline', icon: 'fa-trash', action: () => clearPipelineSafely() },
        { name: 'Load Example', icon: 'fa-file-import', action: () => loadExampleSafely() },
        { name: 'Show Templates', icon: 'fa-file-alt', action: () => handleStepTemplates() },
        { name: 'Show Plugin Catalog', icon: 'fa-store', action: () => handlePluginCatalog() },
        { name: 'Open Matrix Builder', icon: 'fa-th', action: () => handleMatrixBuilder() },
        { name: 'Show Dependencies', icon: 'fa-project-diagram', action: () => handleDependencyGraph() },
        { name: 'Validate Pipeline', icon: 'fa-check-circle', action: () => handlePipelineValidation() },
        { name: 'Preview Pipeline', icon: 'fa-eye', action: () => handlePipelinePreview() },
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
        
        // Add click handlers
        results.querySelectorAll('.command-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const command = filtered[index];
                if (command && command.action) {
                    command.action();
                    hideCommandPalette();
                }
            });
        });
    }
    
    // Show/hide command palette
    function showCommandPalette() {
        palette.classList.remove('hidden');
        input.focus();
        input.select();
        updateResults('');
    }
    
    function hideCommandPalette() {
        palette.classList.add('hidden');
    }
    
    // Event handlers
    if (input) {
        input.addEventListener('input', (e) => {
            updateResults(e.target.value);
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideCommandPalette();
            } else if (e.key === 'Enter') {
                const selected = results.querySelector('.command-item.selected');
                if (selected) {
                    selected.click();
                }
            }
        });
    }
    
    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showCommandPalette();
        }
        
        if (e.key === 'Escape') {
            hideCommandPalette();
        }
    });
    
    console.log('✅ Command palette configured');
}

// Safe method wrappers
function addStepSafely(type) {
    if (window.pipelineBuilder && window.pipelineBuilder.addStep) {
        window.pipelineBuilder.addStep(type);
    } else {
        console.warn(`Cannot add ${type} step - pipeline builder not available`);
    }
}

function exportYAMLSafely() {
    if (window.pipelineBuilder && window.pipelineBuilder.exportYAML) {
        window.pipelineBuilder.exportYAML();
    } else {
        console.warn('Export YAML not available');
    }
}

function clearPipelineSafely() {
    if (window.pipelineBuilder && window.pipelineBuilder.clearPipeline) {
        window.pipelineBuilder.clearPipeline();
    } else {
        console.warn('Clear pipeline not available');
    }
}

function loadExampleSafely() {
    if (window.pipelineBuilder && window.pipelineBuilder.loadExample) {
        window.pipelineBuilder.loadExample();
    } else {
        console.warn('Load example not available');
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Command palette
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const palette = document.getElementById('command-palette');
            if (palette) {
                palette.classList.toggle('hidden');
            }
        }
        
        // Quick actions
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'e':
                    e.preventDefault();
                    exportYAMLSafely();
                    break;
                case 'r':
                    e.preventDefault();
                    clearPipelineSafely();
                    break;
                case 'l':
                    e.preventDefault();
                    loadExampleSafely();
                    break;
            }
        }
    });
    
    console.log('✅ Keyboard shortcuts configured');
}

function setupModalHandlers() {
    // Close modal functionality
    document.addEventListener('click', (e) => {
        // Close button
        if (e.target.closest('.modal-close') || e.target.closest('[data-close-modal]')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.add('hidden');
            }
        }
        
        // Backdrop click
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
        }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
                modal.classList.add('hidden');
            });
        }
    });
    
    console.log('✅ Modal handlers configured');
}

function setupValidationButton() {
    const validateBtn = document.getElementById('validate-pipeline');
    if (validateBtn) {
        validateBtn.addEventListener('click', () => {
            handlePipelineValidation();
        });
    }
    
    console.log('✅ Validation button configured');
}

// Helper functions that might be called by other scripts
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        console.log(`📋 Opened modal: ${modalId}`);
    } else {
        console.warn(`Modal not found: ${modalId}`);
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        console.log(`📋 Closed modal: ${modalId}`);
    }
}

// Global helper functions for backward compatibility
window.showModal = showModal;
window.hideModal = hideModal;
window.showTemplates = handleStepTemplates;
window.validatePipeline = handlePipelineValidation;
window.previewPipeline = handlePipelinePreview;