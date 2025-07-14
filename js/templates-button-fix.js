// Templates Button Fix - Ensures templates button is created and uses correct templates
(function() {
    'use strict';
    
    // Fix templates loading
    function ensureCorrectTemplates() {
        if (window.pipelineTemplates && window.pipelineTemplates.templates && window.templatesUI) {
            console.log('[Templates Fix] Updating templatesUI to use pipeline-templates.js templates');
            // Keep the templates object structure
            window.templatesUI.templates = { templates: window.pipelineTemplates.templates };
            
            // Update template count on button
            const btn = document.getElementById('templates-button');
            if (btn) {
                const templateCount = Object.keys(window.pipelineTemplates.templates).length;
                btn.innerHTML = `<i class="fas fa-file-code"></i> Templates (${templateCount})`;
                console.log(`[Templates Fix] Updated button to show ${templateCount} templates`);
            }
            
            // Dispatch event
            window.dispatchEvent(new Event('templatesLoaded'));
            return true;
        }
        return false;
    }
    
    // Try to fix templates when both scripts are loaded
    let templateFixAttempts = 0;
    function tryFixTemplates() {
        templateFixAttempts++;
        if (ensureCorrectTemplates()) {
            console.log('[Templates Fix] Successfully updated templates');
        } else if (templateFixAttempts < 20) {
            setTimeout(tryFixTemplates, 250);
        }
    }
    
    // Start trying after a short delay
    setTimeout(tryFixTemplates, 100);
    
    let attempts = 0;
    const maxAttempts = 10;
    
    function ensureTemplatesButton() {
        attempts++;
        console.log(`[Templates Button Fix] Attempt ${attempts} to create templates button`);
        
        const actionsContainer = document.querySelector('.header-actions');
        const existingButton = document.getElementById('templates-button');
        
        if (existingButton) {
            console.log('[Templates Button Fix] Templates button already exists');
            return true;
        }
        
        if (!actionsContainer) {
            console.log('[Templates Button Fix] Actions container not found yet');
            if (attempts < maxAttempts) {
                setTimeout(ensureTemplatesButton, 500);
            }
            return false;
        }
        
        // Create the button
        const templatesBtn = document.createElement('button');
        templatesBtn.id = 'templates-button';
        templatesBtn.className = 'btn btn-secondary';
        templatesBtn.title = 'Pipeline Templates';
        
        // Get template count if available
        let templateCount = 0;
        if (window.pipelineTemplates && window.pipelineTemplates.templates) {
            templateCount = Object.keys(window.pipelineTemplates.templates).length;
        } else if (window.templatesUI && window.templatesUI.templates && window.templatesUI.templates.templates) {
            templateCount = Object.keys(window.templatesUI.templates.templates).length;
        }
        
        templatesBtn.innerHTML = `<i class="fas fa-file-code"></i> Templates${templateCount > 0 ? ` (${templateCount})` : ''}`;
        
        // Add click handler
        templatesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[Templates Button Fix] Templates button clicked');
            
            if (window.showTemplatesModal) {
                window.showTemplatesModal();
            } else if (window.templatesUI && window.templatesUI.showTemplatesModal) {
                window.templatesUI.showTemplatesModal();
            } else {
                console.error('[Templates Button Fix] No showTemplatesModal function found');
                alert('Templates feature is still loading. Please try again in a moment.');
            }
        });
        
        // Insert at the beginning of actions
        actionsContainer.insertBefore(templatesBtn, actionsContainer.firstChild);
        console.log(`[Templates Button Fix] Created templates button with ${templateCount} templates`);
        
        return true;
    }
    
    // Try to create button when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureTemplatesButton);
    } else {
        ensureTemplatesButton();
    }
    
    // Also try on window load as fallback
    window.addEventListener('load', () => {
        setTimeout(ensureTemplatesButton, 100);
    });
    
    // Update template count when templates are loaded
    window.addEventListener('templatesLoaded', () => {
        const btn = document.getElementById('templates-button');
        if (btn) {
            let templateCount = 0;
            if (window.pipelineTemplates && window.pipelineTemplates.templates) {
                templateCount = Object.keys(window.pipelineTemplates.templates).length;
            }
            btn.innerHTML = `<i class="fas fa-file-code"></i> Templates${templateCount > 0 ? ` (${templateCount})` : ''}`;
        }
    });
})();