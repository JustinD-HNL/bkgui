// js/app.js
// Main Application Event Handlers and UI Setup

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting Buildkite Pipeline Builder UI setup...');
    
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
    
    console.log('✅ Buildkite Pipeline Builder UI ready!');
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
    } else if (typeof showModal === 'function') {
        showModal('step-templates-modal');
    } else {
        console.warn('Step templates functionality not available');
    }
}

function handlePluginCatalog() {
    if (window.mainInitializer && window.mainInitializer.showPluginCatalog) {
        window.mainInitializer.showPluginCatalog();
    } else if (window.pipelineBuilder && window.pipelineBuilder.showPluginCatalog) {
        window.pipelineBuilder.showPluginCatalog();
    } else if (typeof showModal === 'function') {
        showModal('plugin-catalog-modal');
    } else {
        console.warn('Plugin catalog functionality not available');
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
    } else if (window.dependencyGraph && window.dependencyGraph.showDependencyGraph) {
        window.dependencyGraph.showDependencyGraph();
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
    } else {
        console.warn('Pipeline validation functionality not available');
        alert('Pipeline validation is not available');
    }
}

function handlePipelinePreview() {
    if (window.pipelineBuilder && window.pipelineBuilder.exportYAML) {
        // Generate YAML and show in modal
        const yaml = window.pipelineBuilder.generateYAML();
        const yamlOutput = document.getElementById('yaml-output');
        if (yamlOutput) {
            yamlOutput.value = yaml;
        }
        if (typeof showModal === 'function') {
            showModal('yaml-preview-modal');
        }
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
            if (window.loadPattern && typeof window.loadPattern === 'function') {
                window.loadPattern(patternKey);
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
    
    // Helper functions for safe method calls
    const addStepSafely = (type) => {
        if (window.pipelineBuilder && window.pipelineBuilder.addStep) {
            window.pipelineBuilder.addStep(type);
        } else {
            console.warn('Add step functionality not available');
        }
    };
    
    const exportYAMLSafely = () => {
        if (window.pipelineBuilder && window.pipelineBuilder.exportYAML) {
            window.pipelineBuilder.exportYAML();
        } else {
            console.warn('Export YAML functionality not available');
        }
    };
    
    const clearPipelineSafely = () => {
        if (window.pipelineBuilder && window.pipelineBuilder.clearPipeline) {
            window.pipelineBuilder.clearPipeline();
        } else {
            console.warn('Clear pipeline functionality not available');
        }
    };
    
    const loadExampleSafely = () => {
        if (window.pipelineBuilder && window.pipelineBuilder.loadExample) {
            window.pipelineBuilder.loadExample();
        } else {
            console.warn('Load example functionality not available');
        }
    };
    
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
            <div class="command-item ${index === selectedIndex ? 'active' : ''}" data-index="${index}">
                <i class="fas ${cmd.icon}"></i>
                <span>${cmd.name}</span>
            </div>
        `).join('');
        
        // Click handlers
        results.querySelectorAll('.command-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                filtered[index].action();
                closeCommandPalette();
            });
        });
    }
    
    // Show command palette
    function showCommandPalette() {
        palette.classList.remove('hidden');
        input.value = '';
        input.focus();
        updateResults('');
    }
    
    // Close command palette
    function closeCommandPalette() {
        palette.classList.add('hidden');
    }
    
    // Event handlers
    if (input) {
        input.addEventListener('input', (e) => updateResults(e.target.value));
        
        input.addEventListener('keydown', (e) => {
            const items = results.querySelectorAll('.command-item');
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                    updateResults(input.value);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    updateResults(input.value);
                    break;
                case 'Enter':
                    e.preventDefault();
                    const filtered = commands.filter(cmd => 
                        cmd.name.toLowerCase().includes(input.value.toLowerCase())
                    );
                    if (filtered[selectedIndex]) {
                        filtered[selectedIndex].action();
                        closeCommandPalette();
                    }
                    break;
                case 'Escape':
                    closeCommandPalette();
                    break;
            }
        });
    }
    
    // Close button
    const closeBtn = palette.querySelector('.command-palette-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCommandPalette);
    }
    
    // Make functions globally available
    window.showCommandPalette = showCommandPalette;
    window.closeCommandPalette = closeCommandPalette;
    
    console.log('✅ Command palette configured');
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Check for Ctrl/Cmd key
        const isCtrlCmd = e.ctrlKey || e.metaKey;
        
        if (!isCtrlCmd) return;
        
        switch(e.key.toLowerCase()) {
            case 'k':
                e.preventDefault();
                if (window.showCommandPalette) {
                    window.showCommandPalette();
                }
                break;
            case 's':
                e.preventDefault();
                if (window.pipelineBuilder && window.pipelineBuilder.exportYAML) {
                    window.pipelineBuilder.exportYAML();
                }
                break;
            case 'n':
                e.preventDefault();
                if (window.pipelineBuilder && window.pipelineBuilder.clearPipeline) {
                    window.pipelineBuilder.clearPipeline();
                }
                break;
            case 'e':
                e.preventDefault();
                if (window.pipelineBuilder && window.pipelineBuilder.loadExample) {
                    window.pipelineBuilder.loadExample();
                }
                break;
            case 'p':
                e.preventDefault();
                handlePluginCatalog();
                break;
            case 'm':
                e.preventDefault();
                handleMatrixBuilder();
                break;
            case 't':
                e.preventDefault();
                handleStepTemplates();
                break;
            case 'g':
                e.preventDefault();
                handleDependencyGraph();
                break;
        }
    });
    
    console.log('✅ Keyboard shortcuts configured');
}

function setupModalHandlers() {
    // Show modal helper function
    function showModal(modalId) {
        if (window.showModal) {
            window.showModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    // Close modal helper function  
    function closeModal(modalId) {
        if (window.closeModal) {
            window.closeModal(modalId);
        } else {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        }
    }
    
    // Make globally available if not already
    if (!window.showModal) {
        window.showModal = showModal;
    }
    if (!window.closeModal) {
        window.closeModal = closeModal;
    }
    
    console.log('✅ Modal handlers configured');
}

function setupValidationButton() {
    // Already handled by quick action buttons, but ensure validation button works
    const validateBtn = document.querySelector('[onclick*="validatePipeline"]');
    if (validateBtn) {
        validateBtn.onclick = () => handlePipelineValidation();
    }
    
    console.log('✅ Validation button configured');
}