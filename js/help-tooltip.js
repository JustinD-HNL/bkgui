/**
 * Help Tooltip Component
 * Provides hover tooltips and click-to-expand detailed help for form fields
 */
class HelpTooltip {
    constructor() {
        this.activeTooltip = null;
        this.activeModal = null;
        this.helpContent = {};
        this.init();
    }

    init() {
        // Create tooltip container
        this.tooltipContainer = document.createElement('div');
        this.tooltipContainer.className = 'help-tooltip-container';
        document.body.appendChild(this.tooltipContainer);

        // Create modal container
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'help-modal-container';
        this.modalContainer.innerHTML = `
            <div class="help-modal">
                <div class="help-modal-header">
                    <h3 class="help-modal-title"></h3>
                    <button class="help-modal-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="help-modal-content"></div>
            </div>
        `;
        document.body.appendChild(this.modalContainer);

        // Setup event listeners
        this.modalContainer.addEventListener('click', (e) => {
            if (e.target === this.modalContainer || e.target.closest('.help-modal-close')) {
                this.closeModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    /**
     * Create a help icon with tooltip and modal functionality
     * @param {string} fieldId - Unique identifier for the field
     * @param {Object} content - Help content object with short and detailed descriptions
     * @returns {string} HTML string for the help icon
     */
    createHelpIcon(fieldId, content) {
        // Store content for later retrieval
        this.helpContent[fieldId] = content;
        
        return `<span class="help-icon" data-help-id="${fieldId}" tabindex="0" role="button" aria-label="Help for ${content.title || fieldId}">
            <i class="fas fa-question-circle"></i>
        </span>`;
    }

    /**
     * Attach help icon to an existing label element
     * @param {HTMLElement} labelElement - The label element to attach help to
     * @param {string} fieldId - Unique identifier for the field
     * @param {Object} content - Help content object
     */
    attachToLabel(labelElement, fieldId, content) {
        const helpIcon = this.createHelpIcon(fieldId, content);
        labelElement.insertAdjacentHTML('beforeend', helpIcon);
        this.bindEvents(labelElement.querySelector('.help-icon'));
    }

    /**
     * Bind hover and click events to a help icon
     * @param {HTMLElement} helpIcon - The help icon element
     */
    bindEvents(helpIcon) {
        if (!helpIcon) return;

        const helpId = helpIcon.dataset.helpId;
        const content = this.helpContent[helpId];

        if (!content) return;

        // Hover events for tooltip
        helpIcon.addEventListener('mouseenter', (e) => {
            this.showTooltip(e.target, content.short);
        });

        helpIcon.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });

        // Click event for modal
        helpIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showModal(content);
        });

        // Keyboard accessibility
        helpIcon.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showModal(content);
            }
        });
    }

    /**
     * Show tooltip on hover
     * @param {HTMLElement} target - The element to position tooltip near
     * @param {string} text - Tooltip text
     */
    showTooltip(target, text) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'help-tooltip';
        tooltip.textContent = text;

        this.tooltipContainer.appendChild(tooltip);
        this.activeTooltip = tooltip;

        // Position tooltip
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        let top = rect.top - tooltipRect.height - 8;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

        // Adjust if tooltip goes off screen
        if (top < 0) {
            top = rect.bottom + 8;
            tooltip.classList.add('tooltip-bottom');
        }

        if (left < 0) {
            left = 8;
        } else if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 8;
        }

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        
        // Fade in
        requestAnimationFrame(() => {
            tooltip.classList.add('visible');
        });
    }

    /**
     * Hide active tooltip
     */
    hideTooltip() {
        if (this.activeTooltip) {
            this.activeTooltip.classList.remove('visible');
            setTimeout(() => {
                if (this.activeTooltip) {
                    this.activeTooltip.remove();
                    this.activeTooltip = null;
                }
            }, 200);
        }
    }

    /**
     * Show detailed help modal
     * @param {Object} content - Help content object
     */
    showModal(content) {
        const modal = this.modalContainer.querySelector('.help-modal');
        const title = modal.querySelector('.help-modal-title');
        const body = modal.querySelector('.help-modal-content');

        title.textContent = content.title || 'Help';
        
        // Build modal content
        let bodyHtml = '';
        
        if (content.description) {
            bodyHtml += `<div class="help-description">${content.description}</div>`;
        }

        if (content.examples && content.examples.length > 0) {
            bodyHtml += '<div class="help-examples"><h4>Examples</h4>';
            content.examples.forEach(example => {
                bodyHtml += `
                    <div class="help-example">
                        <div class="help-example-title">${example.title}</div>
                        <pre class="help-example-code">${this.escapeHtml(example.code)}</pre>
                        ${example.description ? `<div class="help-example-description">${example.description}</div>` : ''}
                    </div>
                `;
            });
            bodyHtml += '</div>';
        }

        if (content.notes && content.notes.length > 0) {
            bodyHtml += '<div class="help-notes"><h4>Important Notes</h4><ul>';
            content.notes.forEach(note => {
                bodyHtml += `<li>${note}</li>`;
            });
            bodyHtml += '</ul></div>';
        }

        if (content.links && content.links.length > 0) {
            bodyHtml += '<div class="help-links"><h4>Related Documentation</h4><ul>';
            content.links.forEach(link => {
                bodyHtml += `<li><a href="${link.url}" target="_blank" rel="noopener noreferrer">
                    ${link.text} <i class="fas fa-external-link-alt"></i>
                </a></li>`;
            });
            bodyHtml += '</ul></div>';
        }

        body.innerHTML = bodyHtml;

        // Show modal
        this.modalContainer.classList.add('visible');
        this.activeModal = true;

        // Focus on close button for accessibility
        modal.querySelector('.help-modal-close').focus();
    }

    /**
     * Close active modal
     */
    closeModal() {
        if (this.activeModal) {
            this.modalContainer.classList.remove('visible');
            this.activeModal = false;
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Initialize help tooltips for all elements with data-help-id
     */
    initializeAll() {
        document.querySelectorAll('.help-icon[data-help-id]').forEach(icon => {
            this.bindEvents(icon);
        });
    }

    /**
     * Update help content for a specific field
     * @param {string} fieldId - Field identifier
     * @param {Object} content - New help content
     */
    updateContent(fieldId, content) {
        this.helpContent[fieldId] = content;
    }
}

// Export for use in other modules
window.HelpTooltip = HelpTooltip;