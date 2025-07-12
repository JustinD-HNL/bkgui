// js/templates-ui.js
/**
 * Enhanced Templates UI
 * Provides a beautiful interface for browsing and loading pipeline templates
 */

class TemplatesUI {
    constructor() {
        // Prefer pipelineTemplates over enhancedTemplates since we restored all 16 templates there
        this.templates = window.pipelineTemplates || window.enhancedTemplates;
        this.selectedCategory = 'all';
        this.searchQuery = '';
        
        // Debug log to check if templates are loaded
        console.log('TemplatesUI: Available templates:', this.templates);
        
        // If templates aren't loaded yet, wait for them
        if (!this.templates || !this.templates.templates) {
            console.log('TemplatesUI: Waiting for templates to load...');
            setTimeout(() => {
                this.templates = window.enhancedTemplates || window.pipelineTemplates;
                if (this.templates && this.templates.templates) {
                    console.log('TemplatesUI: Templates loaded:', Object.keys(this.templates.templates).length);
                    this.init();
                    this.updateTemplateCount();
                }
            }, 100);
        } else {
            this.init();
            this.updateTemplateCount();
        }
    }

    init() {
        this.createTemplatesModal();
        this.setupEventListeners();
        this.createTemplatesButton();
    }

    createTemplatesButton() {
        // Add a prominent templates button to the header if it doesn't exist
        const actionsContainer = document.querySelector('.header-actions');
        if (actionsContainer && !document.getElementById('templates-button')) {
            const templatesBtn = document.createElement('button');
            templatesBtn.id = 'templates-button';
            templatesBtn.className = 'btn btn-secondary';
            
            // Show template count if available
            const templateCount = this.templates && this.templates.templates ? 
                Object.keys(this.templates.templates).length : 0;
            
            templatesBtn.innerHTML = `<i class="fas fa-file-code"></i> Templates${templateCount > 0 ? ` (${templateCount})` : ''}`;
            templatesBtn.addEventListener('click', () => this.showTemplatesModal());
            
            // Insert at the beginning of actions
            actionsContainer.insertBefore(templatesBtn, actionsContainer.firstChild);
            
            console.log(`TemplatesUI: Created button with ${templateCount} templates`);
        }
    }
    
    updateTemplateCount() {
        const btn = document.getElementById('templates-button');
        if (btn && this.templates && this.templates.templates) {
            const templateCount = Object.keys(this.templates.templates).length;
            btn.innerHTML = `<i class="fas fa-file-code"></i> Templates${templateCount > 0 ? ` (${templateCount})` : ''}`;
        }
    }

    createTemplatesModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('enhanced-templates-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'enhanced-templates-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2><i class="fas fa-file-code"></i> Pipeline Templates</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="templates-container">
                        <div class="templates-sidebar">
                            <div class="templates-search">
                                <i class="fas fa-search"></i>
                                <input type="text" id="template-search" placeholder="Search templates..." />
                            </div>
                            <div class="templates-categories">
                                <h3>Categories</h3>
                                <ul id="template-categories">
                                    <li class="active" data-category="all">
                                        <i class="fas fa-th"></i> All Templates
                                        <span class="count">0</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="templates-actions">
                                <button class="btn btn-secondary" id="import-template-btn">
                                    <i class="fas fa-upload"></i> Import Template
                                </button>
                                <button class="btn btn-secondary" id="export-current-template-btn">
                                    <i class="fas fa-download"></i> Export Current
                                </button>
                            </div>
                        </div>
                        <div class="templates-main">
                            <div class="templates-header">
                                <h3 id="templates-category-title">All Templates</h3>
                                <div class="templates-view-toggle">
                                    <button class="view-btn active" data-view="grid">
                                        <i class="fas fa-th-large"></i>
                                    </button>
                                    <button class="view-btn" data-view="list">
                                        <i class="fas fa-list"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="templates-grid" class="templates-grid">
                                <!-- Templates will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .templates-container {
                    display: flex;
                    height: 600px;
                    gap: 0;
                }

                .templates-sidebar {
                    width: 250px;
                    background: var(--bg-secondary);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                }

                .templates-search {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    position: relative;
                }

                .templates-search i {
                    position: absolute;
                    left: 1.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-tertiary);
                }

                .templates-search input {
                    width: 100%;
                    padding: 0.5rem 0.5rem 0.5rem 2.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .templates-categories {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }

                .templates-categories h3 {
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                    margin-bottom: 0.75rem;
                }

                .templates-categories ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .templates-categories li {
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.25rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.2s ease;
                }

                .templates-categories li:hover {
                    background: var(--hover-bg);
                }

                .templates-categories li.active {
                    background: var(--primary);
                    color: white;
                }

                .templates-categories li i {
                    margin-right: 0.75rem;
                }

                .templates-categories .count {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }

                .templates-actions {
                    padding: 1rem;
                    border-top: 1px solid var(--border-color);
                }

                .templates-actions button {
                    width: 100%;
                    margin-bottom: 0.5rem;
                }

                .templates-main {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .templates-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .templates-view-toggle {
                    display: flex;
                    gap: 0.25rem;
                }

                .view-btn {
                    padding: 0.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .view-btn:first-child {
                    border-radius: 6px 0 0 6px;
                }

                .view-btn:last-child {
                    border-radius: 0 6px 6px 0;
                }

                .view-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .templates-grid.list-view {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .template-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .template-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--primary);
                }

                .template-card.list-view {
                    display: flex;
                    align-items: center;
                    padding: 1rem 1.5rem;
                }

                .template-icon {
                    font-size: 2rem;
                    color: var(--primary);
                    margin-bottom: 1rem;
                }

                .list-view .template-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0;
                    margin-right: 1rem;
                }

                .template-content {
                    flex: 1;
                }

                .template-name {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--text-primary);
                }

                .template-description {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                }

                .list-view .template-description {
                    margin-bottom: 0;
                }

                .template-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }

                .template-steps {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .template-category {
                    background: var(--bg-secondary);
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                }

                .template-preview {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: var(--primary);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 0 8px 0 8px;
                    font-size: 0.75rem;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .template-card:hover .template-preview {
                    opacity: 1;
                }

                .template-details-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                }

                .template-details-content {
                    background: var(--card-bg);
                    border-radius: 12px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .template-details-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .template-details-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }

                .template-details-footer {
                    padding: 1.5rem;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .template-steps-preview {
                    margin-top: 1.5rem;
                }

                .template-steps-preview h4 {
                    margin-bottom: 1rem;
                }

                .step-preview {
                    background: var(--bg-secondary);
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.5rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .step-preview-icon {
                    color: var(--primary);
                }

                .step-preview-label {
                    flex: 1;
                }

                .step-preview-type {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    background: var(--bg-tertiary);
                    padding: 0.125rem 0.5rem;
                    border-radius: 4px;
                }
            </style>
        `;

        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Also handle the sidebar templates button
        const templatesBtn = document.getElementById('templates-btn');
        if (templatesBtn) {
            console.log('TemplatesUI: Found templates-btn, attaching handler');
            // Remove any existing listeners to prevent duplicates
            const newBtn = templatesBtn.cloneNode(true);
            templatesBtn.parentNode.replaceChild(newBtn, templatesBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('TemplatesUI: Templates button clicked');
                this.showTemplatesModal();
            });
        } else {
            console.warn('TemplatesUI: templates-btn not found in DOM');
        }
        
        // Search functionality
        const searchInput = document.getElementById('template-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderTemplates();
            });
        }

        // View toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-btn')) {
                const btn = e.target.closest('.view-btn');
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const grid = document.getElementById('templates-grid');
                if (btn.dataset.view === 'list') {
                    grid.classList.add('list-view');
                } else {
                    grid.classList.remove('list-view');
                }
            }
        });

        // Close modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            }
        });
        
        // Import/Export buttons
        const importBtn = document.getElementById('import-template-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importTemplate());
        }
        
        const exportBtn = document.getElementById('export-current-template-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCurrentAsTemplate());
        }
    }

    showTemplatesModal() {
        const modal = document.getElementById('enhanced-templates-modal');
        if (modal) {
            // Re-check for templates when showing modal
            if (!this.templates || !this.templates.templates) {
                console.log('TemplatesUI: Re-checking for templates on modal show');
                this.templates = window.enhancedTemplates || window.pipelineTemplates;
                
                if (!this.templates || !this.templates.templates) {
                    console.log('TemplatesUI: Templates still not available, trying to initialize');
                    // Try to wait a bit more
                    setTimeout(() => {
                        this.templates = window.enhancedTemplates || window.pipelineTemplates;
                        if (this.templates && this.templates.templates) {
                            console.log('TemplatesUI: Templates now available:', Object.keys(this.templates.templates).length);
                            this.renderCategories();
                            this.renderTemplates();
                        } else {
                            console.error('TemplatesUI: Failed to load templates');
                            // Show error in modal
                            const grid = document.getElementById('templates-grid');
                            if (grid) {
                                grid.innerHTML = `
                                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                                        <i class="fas fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: var(--error);"></i>
                                        Failed to load templates. Please refresh the page and try again.
                                    </div>
                                `;
                            }
                        }
                    }, 200);
                }
            }
            
            modal.classList.remove('hidden');
            this.renderCategories();
            this.renderTemplates();
        }
    }

    renderCategories() {
        const categoriesList = document.getElementById('template-categories');
        if (!categoriesList || !this.templates) {
            console.log('TemplatesUI: Cannot render categories - list or templates missing');
            return;
        }

        // Ensure templates are properly loaded
        if (!this.templates.templates) {
            console.log('TemplatesUI: Templates not loaded yet in renderCategories');
            this.templates = window.enhancedTemplates || window.pipelineTemplates;
            if (!this.templates || !this.templates.templates) {
                console.log('TemplatesUI: Still no templates available');
                return;
            }
        }

        const categories = this.templates.getAllCategories ? this.templates.getAllCategories() : [];
        const allTemplates = this.templates.templates ? Object.keys(this.templates.templates).length : 0;

        let html = `
            <li class="${this.selectedCategory === 'all' ? 'active' : ''}" data-category="all">
                <i class="fas fa-th"></i> All Templates
                <span class="count">${allTemplates}</span>
            </li>
        `;

        const categoryIcons = {
            'ci-cd': 'fa-infinity',
            'testing': 'fa-vial',
            'deployment': 'fa-rocket',
            'microservices': 'fa-cubes',
            'workflow': 'fa-sitemap',
            'security': 'fa-shield-alt'
        };

        categories.forEach(category => {
            const count = this.templates.getTemplatesByCategory(category).length;
            const icon = categoryIcons[category] || 'fa-folder';
            const name = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            
            html += `
                <li class="${this.selectedCategory === category ? 'active' : ''}" data-category="${category}">
                    <i class="fas ${icon}"></i> ${name}
                    <span class="count">${count}</span>
                </li>
            `;
        });

        categoriesList.innerHTML = html;

        // Add click handlers
        categoriesList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.selectedCategory = li.dataset.category;
                categoriesList.querySelectorAll('li').forEach(l => l.classList.remove('active'));
                li.classList.add('active');
                
                const title = document.getElementById('templates-category-title');
                if (title) {
                    title.textContent = li.textContent.trim();
                }
                
                this.renderTemplates();
            });
        });
    }

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        if (!grid || !this.templates) {
            console.log('TemplatesUI: Cannot render - grid or templates missing');
            return;
        }

        // Ensure templates exist
        if (!this.templates.templates || Object.keys(this.templates.templates).length === 0) {
            console.log('TemplatesUI: No templates available, checking again...');
            this.templates = window.enhancedTemplates || window.pipelineTemplates;
            if (!this.templates || !this.templates.templates || Object.keys(this.templates.templates).length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <i class="fas fa-info-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        No templates available yet. Please wait...
                    </div>
                `;
                return;
            }
        }

        let templates = this.selectedCategory === 'all' 
            ? Object.entries(this.templates.templates)
            : Object.entries(this.templates.templates).filter(([_, t]) => t.category === this.selectedCategory);

        // Apply search filter
        if (this.searchQuery) {
            templates = templates.filter(([key, template]) => {
                return template.name.toLowerCase().includes(this.searchQuery) ||
                       template.description.toLowerCase().includes(this.searchQuery) ||
                       key.toLowerCase().includes(this.searchQuery);
            });
        }

        const isListView = grid.classList.contains('list-view');

        grid.innerHTML = templates.map(([key, template]) => {
            const stepCount = template.pipeline?.steps?.length || 0;
            const category = template.category || 'general';
            
            return `
                <div class="template-card ${isListView ? 'list-view' : ''}" data-template="${key}">
                    <div class="template-icon">
                        <i class="fas ${template.icon || 'fa-file-code'}"></i>
                    </div>
                    <div class="template-content">
                        <div class="template-name">${template.name}</div>
                        <div class="template-description">${template.description}</div>
                        ${!isListView ? `
                        <div class="template-meta">
                            <div class="template-steps">
                                <i class="fas fa-layer-group"></i> ${stepCount} steps
                            </div>
                            <div class="template-category">${category}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="template-preview">Click to preview</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateKey = card.dataset.template;
                this.showTemplateDetails(templateKey);
            });
        });
    }

    showTemplateDetails(templateKey) {
        const template = this.templates.templates[templateKey];
        if (!template) return;

        const modal = document.createElement('div');
        modal.className = 'template-details-modal';
        modal.innerHTML = `
            <div class="template-details-content">
                <div class="template-details-header">
                    <div>
                        <h3><i class="fas ${template.icon || 'fa-file-code'}"></i> ${template.name}</h3>
                        <p>${template.description}</p>
                    </div>
                    <button class="close-modal">
                        &times;
                    </button>
                </div>
                <div class="template-details-body">
                    <div class="template-steps-preview">
                        <h4>Pipeline Steps</h4>
                        ${this.renderStepsPreview(template.pipeline.steps)}
                    </div>
                </div>
                <div class="template-details-footer">
                    <button class="btn btn-secondary cancel-btn">
                        Cancel
                    </button>
                    <button class="btn btn-primary load-template-btn" data-template-key="${templateKey}">
                        <i class="fas fa-download"></i> Load Template
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.load-template-btn').addEventListener('click', (e) => {
            const key = e.currentTarget.dataset.templateKey;
            this.loadTemplate(key);
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    renderStepsPreview(steps) {
        return steps.map(step => {
            if (step === 'wait') {
                return `
                    <div class="step-preview">
                        <i class="fas fa-hourglass-half step-preview-icon"></i>
                        <span class="step-preview-label">Wait</span>
                        <span class="step-preview-type">wait</span>
                    </div>
                `;
            } else if (typeof step === 'object') {
                const icon = this.getStepIcon(step);
                const label = step.label || step.block || step.input || step.trigger || step.group || 'Step';
                const type = this.getStepType(step);
                
                return `
                    <div class="step-preview">
                        <i class="fas ${icon} step-preview-icon"></i>
                        <span class="step-preview-label">${label}</span>
                        <span class="step-preview-type">${type}</span>
                    </div>
                `;
            }
        }).join('');
    }

    getStepIcon(step) {
        if (step.block) return 'fa-hand-paper';
        if (step.input) return 'fa-keyboard';
        if (step.trigger) return 'fa-bolt';
        if (step.group) return 'fa-layer-group';
        return 'fa-terminal';
    }

    getStepType(step) {
        if (step.block) return 'block';
        if (step.input) return 'input';
        if (step.trigger) return 'trigger';
        if (step.group) return 'group';
        return 'command';
    }

    loadTemplate(templateKey) {
        if (this.templates && this.templates.loadTemplate) {
            this.templates.loadTemplate(templateKey);
            
            // Close modals
            document.querySelector('.template-details-modal')?.remove();
            document.getElementById('enhanced-templates-modal')?.classList.add('hidden');
            
            // Show notification
            const template = this.templates.templates[templateKey];
            if (template) {
                this.showNotification(`Loaded "${template.name}" template`, 'success');
            }
        }
    }

    importTemplate() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const templateData = JSON.parse(e.target.result);
                        const key = this.templates.importTemplate(templateData);
                        if (key) {
                            this.renderCategories();
                            this.renderTemplates();
                            this.showNotification('Template imported successfully', 'success');
                        }
                    } catch (error) {
                        this.showNotification('Failed to import template: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    exportCurrentAsTemplate() {
        if (!window.pipelineBuilder || window.pipelineBuilder.steps.length === 0) {
            this.showNotification('No pipeline to export', 'warning');
            return;
        }

        const name = prompt('Template name:');
        if (!name) return;

        const description = prompt('Template description:');
        
        const templateData = this.templates.exportTemplate(name, description || '');
        
        const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Template exported successfully', 'success');
    }

    showNotification(message, type = 'info') {
        if (window.mainInitializer && window.mainInitializer.showToast) {
            window.mainInitializer.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize
if (typeof window !== 'undefined') {
    window.TemplatesUI = TemplatesUI;
    
    // Function to initialize when templates are ready
    const initializeTemplatesUI = () => {
        try {
            // Check if templates are loaded - prefer pipelineTemplates with our 16 templates
            if (window.pipelineTemplates && window.pipelineTemplates.templates) {
                console.log('TemplatesUI: Initializing with pipeline templates');
                window.templatesUI = new TemplatesUI();
                
                // Set up periodic update for template count
                setTimeout(() => {
                    if (window.templatesUI && window.templatesUI.updateTemplateCount) {
                        window.templatesUI.updateTemplateCount();
                    }
                }, 500);
            } else if (window.enhancedTemplates && window.enhancedTemplates.templates) {
                console.log('TemplatesUI: Initializing with enhanced templates');
                window.templatesUI = new TemplatesUI();
            } else {
                console.log('TemplatesUI: Templates not ready yet, waiting...');
                // Try again in a moment
                setTimeout(initializeTemplatesUI, 100);
            }
        } catch (error) {
            console.error('TemplatesUI: Error during initialization:', error);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTemplatesUI);
    } else {
        initializeTemplatesUI();
    }
    
    // Also expose a global function for showing templates
    window.showTemplatesModal = () => {
        if (window.templatesUI && window.templatesUI.showTemplatesModal) {
            window.templatesUI.showTemplatesModal();
        } else {
            console.warn('TemplatesUI not initialized yet, attempting to initialize now...');
            initializeTemplatesUI();
            // Try again after initialization
            setTimeout(() => {
                if (window.templatesUI && window.templatesUI.showTemplatesModal) {
                    window.templatesUI.showTemplatesModal();
                }
            }, 100);
        }
    };
    
    // Ensure initialization happens even if scripts load out of order
    window.addEventListener('load', () => {
        if (!window.templatesUI) {
            console.log('TemplatesUI: Running failsafe initialization on window load');
            initializeTemplatesUI();
        }
    });
}