/**
 * Pipeline Builder Help Integration
 * Integrates help tooltips into the existing PipelineBuilder
 */

// Initialize the help system when everything is loaded
function initializeHelpSystem() {
    console.log('🚀 Initializing Buildkite Pipeline Builder Help System...');
    
    // Ensure all dependencies are loaded
    if (!window.PipelineBuilder) {
        console.error('❌ PipelineBuilder not found!');
        return false;
    }
    
    if (!window.HelpTooltip) {
        console.error('❌ HelpTooltip not found!');
        return false;
    }
    
    if (!window.helpContent) {
        console.error('❌ Help content not found!');
        return false;
    }
    
    // Create global help tooltip instance
    if (!window.helpTooltip) {
        window.helpTooltip = new HelpTooltip();
        console.log('✅ Created global helpTooltip instance');
    }
    
    // Helper function to add help icon to HTML
    function addHelpToLabel(html, labelText, helpId) {
        if (!window.helpContent[helpId]) {
            console.log(`No help content for ${helpId}`);
            return html; // No help content defined
        }
        
        const helpIcon = window.helpTooltip.createHelpIcon(helpId, window.helpContent[helpId]);
        console.log(`Created help icon for ${helpId}:`, helpIcon);
        
        // Replace the label text with label text + help icon
        const labelRegex = new RegExp(`(<label[^>]*>)(${labelText})(</label>)`, 'g');
        const newHtml = html.replace(labelRegex, `$1${labelText}${helpIcon}$3`);
        
        if (newHtml === html) {
            console.log(`Failed to add help for "${labelText}" with regex`);
        } else {
            console.log(`Successfully added help for "${labelText}"`);
        }
        
        return newHtml;
    }
    
    // Helper to add help after checkbox labels
    function addHelpAfterCheckbox(html, labelText, helpId) {
        if (!window.helpContent[helpId]) {
            return html; // No help content defined
        }
        
        const helpIcon = window.helpTooltip.createHelpIcon(helpId, window.helpContent[helpId]);
        
        // Find the closing label tag after the checkbox
        const checkboxRegex = new RegExp(`(${labelText}\\s*</label>)`, 'g');
        return html.replace(checkboxRegex, `${labelText}</label>${helpIcon}`);
    }
    
    // Store original methods
    const originalGenerateCommandStepForm = window.PipelineBuilder.prototype.generateCommandStepForm;
    const originalGenerateWaitStepForm = window.PipelineBuilder.prototype.generateWaitStepForm;
    const originalGenerateBlockStepForm = window.PipelineBuilder.prototype.generateBlockStepForm;
    const originalGenerateInputStepForm = window.PipelineBuilder.prototype.generateInputStepForm;
    const originalGenerateTriggerStepForm = window.PipelineBuilder.prototype.generateTriggerStepForm;
    const originalGenerateGroupStepForm = window.PipelineBuilder.prototype.generateGroupStepForm;
    const originalGenerateAnnotationStepForm = window.PipelineBuilder.prototype.generateAnnotationStepForm;
    const originalGenerateNotifyStepForm = window.PipelineBuilder.prototype.generateNotifyStepForm;
    const originalGeneratePluginStepForm = window.PipelineBuilder.prototype.generatePluginStepForm;
    const originalGeneratePipelineUploadStepForm = window.PipelineBuilder.prototype.generatePipelineUploadStepForm;
    
    // Override generateCommandStepForm
    window.PipelineBuilder.prototype.generateCommandStepForm = function(step) {
        console.log('🎯 Generating command step form with help');
        let html = originalGenerateCommandStepForm.call(this, step);
        
        console.log('Original HTML contains "Label":', html.includes('Label'));
        
        // Add help icons to labels
        html = addHelpToLabel(html, 'Label', 'step-label');
        html = addHelpToLabel(html, 'Key', 'step-key');
        html = addHelpToLabel(html, 'Command', 'step-command');
        
        console.log('HTML after help icons:', html.includes('help-icon'));
        html = addHelpToLabel(html, 'Artifact Paths', 'step-artifact-paths');
        html = addHelpToLabel(html, 'Timeout \\(minutes\\)', 'step-timeout');
        html = addHelpToLabel(html, 'Parallelism', 'step-parallelism');
        html = addHelpToLabel(html, 'Dependencies', 'step-depends-on');
        html = addHelpAfterCheckbox(html, 'Skip this step', 'step-skip');
        html = addHelpAfterCheckbox(html, 'Cancel on build failing', 'step-cancel-on-build-failing');
        html = addHelpToLabel(html, 'Agent Targeting', 'step-agents');
        html = addHelpToLabel(html, 'If Condition', 'step-if');
        html = addHelpToLabel(html, 'Branch Filter', 'step-branches');
        
        // Add help for sections
        html = html.replace('Retry Configuration', 'Retry Configuration' + window.helpTooltip.createHelpIcon('step-retry', window.helpContent['step-retry']));
        html = html.replace('Soft Fail', 'Soft Fail' + window.helpTooltip.createHelpIcon('step-soft-fail', window.helpContent['step-soft-fail']));
        html = html.replace('Environment Variables</label>', 'Environment Variables</label>' + window.helpTooltip.createHelpIcon('step-env', window.helpContent['step-env']));
        
        return html;
    };
    
    // Override generateWaitStepForm
    window.PipelineBuilder.prototype.generateWaitStepForm = function(step) {
        let html = originalGenerateWaitStepForm.call(this, step);
        html = addHelpAfterCheckbox(html, 'Continue on failure', 'wait-continue-on-failure');
        html = addHelpToLabel(html, 'If Condition', 'step-if');
        return html;
    };
    
    // Override generateBlockStepForm
    window.PipelineBuilder.prototype.generateBlockStepForm = function(step) {
        let html = originalGenerateBlockStepForm.call(this, step);
        html = addHelpToLabel(html, 'Block Label', 'block-label');
        html = addHelpToLabel(html, 'Prompt Message', 'block-prompt');
        html = addHelpToLabel(html, 'Fields', 'block-fields');
        html = addHelpToLabel(html, 'Blocked State', 'block-blocked-state');
        html = addHelpToLabel(html, 'If Condition', 'step-if');
        html = addHelpToLabel(html, 'Branch Filter', 'step-branches');
        html = addHelpToLabel(html, 'Dependencies', 'step-depends-on');
        return html;
    };
    
    // Override generateInputStepForm
    window.PipelineBuilder.prototype.generateInputStepForm = function(step) {
        let html = originalGenerateInputStepForm.call(this, step);
        html = addHelpToLabel(html, 'Input Label', 'input-label');
        html = addHelpToLabel(html, 'Input Fields', 'input-fields');
        html = addHelpToLabel(html, 'Prompt', 'input-prompt');
        html = addHelpToLabel(html, 'If Condition', 'step-if');
        html = addHelpToLabel(html, 'Branch Filter', 'step-branches');
        html = addHelpToLabel(html, 'Dependencies', 'step-depends-on');
        return html;
    };
    
    // Override generateTriggerStepForm
    window.PipelineBuilder.prototype.generateTriggerStepForm = function(step) {
        let html = originalGenerateTriggerStepForm.call(this, step);
        html = addHelpToLabel(html, 'Pipeline to Trigger', 'trigger-pipeline');
        html = addHelpToLabel(html, 'Target Pipeline', 'trigger-pipeline');
        html = addHelpToLabel(html, 'Label', 'trigger-label');
        html = addHelpToLabel(html, 'Branch', 'trigger-build');
        html = addHelpToLabel(html, 'Commit', 'trigger-build');
        html = addHelpToLabel(html, 'Build Message', 'trigger-build');
        html = addHelpAfterCheckbox(html, 'Async', 'trigger-async');
        html = addHelpToLabel(html, 'If Condition', 'step-if');
        html = addHelpToLabel(html, 'Skip', 'step-skip');
        return html;
    };
    
    // Override generateGroupStepForm
    if (originalGenerateGroupStepForm) {
        window.PipelineBuilder.prototype.generateGroupStepForm = function(step) {
            let html = originalGenerateGroupStepForm.call(this, step);
            html = addHelpToLabel(html, 'Group Label', 'group-label');
            html = addHelpToLabel(html, 'Key', 'group-key');
            html = addHelpToLabel(html, 'Dependencies', 'step-depends-on');
            html = addHelpToLabel(html, 'If Condition', 'step-if');
            return html;
        };
    }
    
    // Override generateAnnotationStepForm
    if (originalGenerateAnnotationStepForm) {
        window.PipelineBuilder.prototype.generateAnnotationStepForm = function(step) {
            let html = originalGenerateAnnotationStepForm.call(this, step);
            html = addHelpToLabel(html, 'Annotation Content', 'annotation-body');
            html = addHelpToLabel(html, 'Style', 'annotation-style');
            html = addHelpToLabel(html, 'Context', 'annotation-context');
            html = addHelpAfterCheckbox(html, 'Append to existing', 'annotation-append');
            return html;
        };
    }
    
    // Override generatePluginStepForm
    if (originalGeneratePluginStepForm) {
        window.PipelineBuilder.prototype.generatePluginStepForm = function(step) {
            let html = originalGeneratePluginStepForm.call(this, step);
            html = addHelpToLabel(html, 'Step Key', 'step-key');
            html = addHelpToLabel(html, 'Plugins', 'step-plugins');
            html = addHelpToLabel(html, 'If Condition', 'step-if');
            return html;
        };
    }
    
    // Override generateNotifyStepForm
    if (originalGenerateNotifyStepForm) {
        window.PipelineBuilder.prototype.generateNotifyStepForm = function(step) {
            let html = originalGenerateNotifyStepForm.call(this, step);
            html = addHelpToLabel(html, 'Email', 'notify-email');
            html = addHelpToLabel(html, 'Slack Channel/URL', 'notify-slack');
            html = addHelpToLabel(html, 'Webhook URL', 'notify-webhook');
            html = addHelpToLabel(html, 'PagerDuty Integration Key', 'notify-pagerduty');
            html = addHelpToLabel(html, 'If Condition', 'step-if');
            return html;
        };
    }
    
    // Override generatePipelineUploadStepForm
    if (originalGeneratePipelineUploadStepForm) {
        window.PipelineBuilder.prototype.generatePipelineUploadStepForm = function(step) {
            let html = originalGeneratePipelineUploadStepForm.call(this, step);
            html = addHelpToLabel(html, 'Pipeline File', 'pipeline-upload-file');
            html = addHelpAfterCheckbox(html, 'Replace current pipeline', 'pipeline-upload-replace');
            html = addHelpToLabel(html, 'If Condition', 'step-if');
            return html;
        };
    }
    
    console.log('✅ Help system integration complete!');
    return true;
}

// Try to initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, attempting to initialize help system...');
    
    // Try multiple times to ensure all scripts are loaded
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryInit() {
        attempts++;
        console.log(`Help system initialization attempt ${attempts}/${maxAttempts}`);
        
        if (initializeHelpSystem()) {
            console.log('✅ Help system initialized successfully!');
            
            // Initialize any existing help icons
            if (window.helpTooltip) {
                window.helpTooltip.initializeAll();
            }
        } else if (attempts < maxAttempts) {
            setTimeout(tryInit, 200); // Try again in 200ms
        } else {
            console.error('❌ Failed to initialize help system after ' + maxAttempts + ' attempts');
        }
    }
    
    tryInit();
});

// Re-initialize help tooltips when properties panel is updated
document.addEventListener('propertiesRendered', function(e) {
    console.log('Properties rendered event received', e.detail);
    
    // Wait a tick for DOM to update
    setTimeout(function() {
        if (window.helpTooltip) {
            window.helpTooltip.initializeAll();
        }
    }, 10);
});

// Also listen for step selection changes
document.addEventListener('stepSelected', function(e) {
    console.log('Step selected event received', e.detail);
    
    // Wait for properties to render
    setTimeout(function() {
        if (window.helpTooltip) {
            window.helpTooltip.initializeAll();
        }
    }, 100);
});