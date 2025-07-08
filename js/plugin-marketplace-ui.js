// js/plugin-marketplace-ui.js
/**
 * Plugin Marketplace UI
 * Beautiful interface for browsing and installing Buildkite plugins
 */

class PluginMarketplaceUI {
    constructor() {
        this.marketplace = window.pluginMarketplace;
        this.selectedPlugin = null;
        
        // If marketplace isn't ready, wait for it
        if (!this.marketplace || !this.marketplace.plugins) {
            console.log('PluginMarketplaceUI: Waiting for marketplace to initialize...');
            setTimeout(() => {
                this.marketplace = window.pluginMarketplace;
                if (this.marketplace && this.marketplace.plugins) {
                    console.log(`PluginMarketplaceUI: Marketplace ready with ${Object.keys(this.marketplace.plugins).length} plugins`);
                    this.init();
                }
            }, 200);
        } else {
            this.init();
        }
    }

    init() {
        this.createMarketplaceModal();
        this.setupEventListeners();
        this.createMarketplaceButton();
    }

    createMarketplaceButton() {
        // Add marketplace button to header
        const actionsContainer = document.querySelector('.header-actions');
        if (actionsContainer && !document.getElementById('marketplace-button')) {
            const marketplaceBtn = document.createElement('button');
            marketplaceBtn.id = 'marketplace-button';
            marketplaceBtn.className = 'action-btn';
            
            // Show plugin count if available
            const pluginCount = this.marketplace && this.marketplace.plugins ? 
                Object.keys(this.marketplace.plugins).length : 0;
            
            marketplaceBtn.innerHTML = `<i class="fas fa-store"></i> Plugin Marketplace${pluginCount > 0 ? ` (${pluginCount})` : ''}`;
            marketplaceBtn.onclick = () => this.showMarketplace();
            
            // Insert after templates button
            const templatesBtn = document.getElementById('templates-button');
            if (templatesBtn && templatesBtn.nextSibling) {
                actionsContainer.insertBefore(marketplaceBtn, templatesBtn.nextSibling);
            } else {
                actionsContainer.appendChild(marketplaceBtn);
            }
            
            console.log(`PluginMarketplaceUI: Created button with ${pluginCount} plugins`);
        }
    }
    
    updatePluginCount() {
        const btn = document.getElementById('marketplace-button');
        if (btn && this.marketplace && this.marketplace.plugins) {
            const pluginCount = Object.keys(this.marketplace.plugins).length;
            btn.innerHTML = `<i class="fas fa-store"></i> Plugin Marketplace${pluginCount > 0 ? ` (${pluginCount})` : ''}`;
        }
    }

    createMarketplaceModal() {
        const modal = document.createElement('div');
        modal.id = 'plugin-marketplace-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="event.stopPropagation()">
                <div class="modal-content large" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2><i class="fas fa-store"></i> Buildkite Plugin Marketplace</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="marketplace-container">
                        <div class="marketplace-sidebar">
                            <div class="marketplace-search">
                                <i class="fas fa-search"></i>
                                <input type="text" id="plugin-marketplace-search" placeholder="Search plugins..." />
                            </div>
                            
                            <div class="marketplace-filters">
                                <h3>Categories</h3>
                                <ul id="plugin-categories">
                                    <li class="active" data-category="all">
                                        <i class="fas fa-th"></i> All Plugins
                                        <span class="count">0</span>
                                    </li>
                                </ul>
                                
                                <h3>Sort By</h3>
                                <select id="plugin-sort" class="form-control">
                                    <option value="usage">Most Used</option>
                                    <option value="name">Name</option>
                                    <option value="category">Category</option>
                                </select>
                            </div>
                            
                            <div class="marketplace-stats">
                                <div class="stat">
                                    <i class="fas fa-puzzle-piece"></i>
                                    <span id="total-plugins">0</span> Plugins
                                </div>
                                <div class="stat">
                                    <i class="fas fa-certificate"></i>
                                    <span id="official-plugins">0</span> Official
                                </div>
                            </div>
                        </div>
                        
                        <div class="marketplace-main">
                            <div class="marketplace-header">
                                <h3 id="marketplace-title">All Plugins</h3>
                                <div class="marketplace-actions">
                                    <button class="btn btn-secondary" onclick="window.pluginMarketplaceUI.refreshPlugins()">
                                        <i class="fas fa-sync"></i> Refresh
                                    </button>
                                    <a href="https://buildkite.com/resources/plugins/" target="_blank" class="btn btn-secondary">
                                        <i class="fas fa-external-link-alt"></i> View All
                                    </a>
                                </div>
                            </div>
                            
                            <div id="plugins-grid" class="plugins-grid">
                                <!-- Plugins will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <style>
                .modal-backdrop {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .marketplace-container {
                    display: flex;
                    height: 600px;
                    gap: 0;
                }

                .marketplace-sidebar {
                    width: 250px;
                    background: var(--bg-secondary);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                }

                .marketplace-search {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    position: relative;
                }

                .marketplace-search i {
                    position: absolute;
                    left: 1.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-tertiary);
                }

                .marketplace-search input {
                    width: 100%;
                    padding: 0.5rem 0.5rem 0.5rem 2.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .marketplace-filters {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }

                .marketplace-filters h3 {
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                    margin-bottom: 0.75rem;
                    margin-top: 1rem;
                }

                .marketplace-filters h3:first-child {
                    margin-top: 0;
                }

                .marketplace-filters ul {
                    list-style: none;
                    padding: 0;
                    margin: 0 0 1.5rem 0;
                }

                .marketplace-filters li {
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.25rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.2s ease;
                }

                .marketplace-filters li:hover {
                    background: var(--hover-bg);
                }

                .marketplace-filters li.active {
                    background: var(--primary);
                    color: white;
                }

                .marketplace-filters li i {
                    margin-right: 0.75rem;
                }

                .marketplace-filters .count {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }

                .marketplace-stats {
                    padding: 1rem;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    gap: 1rem;
                }

                .marketplace-stats .stat {
                    flex: 1;
                    text-align: center;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .marketplace-stats .stat i {
                    display: block;
                    font-size: 1.5rem;
                    margin-bottom: 0.25rem;
                    color: var(--primary);
                }

                .marketplace-main {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .marketplace-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .marketplace-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .plugins-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 1.5rem;
                }

                .plugin-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1.5rem;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }

                .plugin-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--primary);
                }

                .plugin-header {
                    display: flex;
                    align-items: start;
                    margin-bottom: 1rem;
                }

                .plugin-icon {
                    font-size: 2rem;
                    color: var(--primary);
                    margin-right: 1rem;
                    width: 2.5rem;
                }

                .plugin-info {
                    flex: 1;
                }

                .plugin-name {
                    font-weight: 600;
                    font-size: 1.125rem;
                    margin-bottom: 0.25rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .plugin-badge {
                    background: var(--primary);
                    color: white;
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.625rem;
                    text-transform: uppercase;
                }

                .plugin-description {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                }

                .plugin-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .plugin-tag {
                    background: var(--bg-secondary);
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .plugin-stats {
                    display: flex;
                    gap: 1.5rem;
                    margin-bottom: 1rem;
                    font-size: 0.875rem;
                    color: var(--text-tertiary);
                }

                .plugin-stat {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .plugin-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .plugin-actions button {
                    flex: 1;
                }

                /* Plugin Details Modal */
                .plugin-details-modal {
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

                .plugin-details-content {
                    background: var(--card-bg);
                    border-radius: 12px;
                    width: 90%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .plugin-details-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                }

                .plugin-details-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }

                .plugin-details-tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .plugin-tab {
                    padding: 0.75rem 0;
                    cursor: pointer;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s ease;
                    color: var(--text-secondary);
                }

                .plugin-tab.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                }

                .plugin-example {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                }

                .plugin-example pre {
                    margin: 0;
                    white-space: pre-wrap;
                }

                .plugin-readme {
                    font-size: 0.875rem;
                    line-height: 1.6;
                }

                .plugin-readme h1,
                .plugin-readme h2,
                .plugin-readme h3 {
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                }

                .plugin-readme pre {
                    background: var(--bg-secondary);
                    padding: 1rem;
                    border-radius: 6px;
                    overflow-x: auto;
                }

                .plugin-readme code {
                    background: var(--bg-secondary);
                    padding: 0.125rem 0.25rem;
                    border-radius: 3px;
                }

                .plugin-config-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .config-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .config-field label {
                    font-weight: 500;
                    font-size: 0.875rem;
                }

                .config-field input,
                .config-field select,
                .config-field textarea {
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .loading-spinner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    color: var(--text-secondary);
                }

                .loading-spinner i {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('plugin-marketplace-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.marketplace.searchQuery = e.target.value;
                this.renderPlugins();
            });
        }

        // Sort
        const sortSelect = document.getElementById('plugin-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.marketplace.sortBy = e.target.value;
                this.renderPlugins();
            });
        }

        // Close modal - use event delegation on the modal itself to avoid conflicts
        const modal = document.getElementById('plugin-marketplace-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-modal')) {
                    e.preventDefault();
                    e.stopPropagation();
                    modal.classList.add('hidden');
                    modal.style.display = 'none';
                }
            });
        }
    }

    showMarketplace() {
        const modal = document.getElementById('plugin-marketplace-modal');
        if (modal) {
            // Ensure modal is properly shown (remove both hidden class and display:none)
            modal.classList.remove('hidden');
            modal.style.display = 'block';
            this.renderCategories();
            this.renderPlugins();
            this.updateStats();
        }
    }

    renderCategories() {
        const categoriesList = document.getElementById('plugin-categories');
        if (!categoriesList) return;

        const allCount = Object.keys(this.marketplace.plugins).length;
        let html = `
            <li class="${this.marketplace.selectedCategory === 'all' ? 'active' : ''}" data-category="all">
                <i class="fas fa-th"></i> All Plugins
                <span class="count">${allCount}</span>
            </li>
        `;

        Object.entries(this.marketplace.categories).forEach(([key, category]) => {
            const count = this.marketplace.getPluginsByCategory(key).length;
            html += `
                <li class="${this.marketplace.selectedCategory === key ? 'active' : ''}" data-category="${key}">
                    <i class="fas ${category.icon}"></i> ${category.name}
                    <span class="count">${count}</span>
                </li>
            `;
        });

        categoriesList.innerHTML = html;

        // Add click handlers
        categoriesList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.marketplace.selectedCategory = li.dataset.category;
                categoriesList.querySelectorAll('li').forEach(l => l.classList.remove('active'));
                li.classList.add('active');
                
                const title = document.getElementById('marketplace-title');
                if (title) {
                    title.textContent = li.textContent.trim();
                }
                
                this.renderPlugins();
            });
        });
        
        // Plugin card button event delegation
        document.addEventListener('click', (e) => {
            // Handle details button
            if (e.target.closest('.plugin-details-btn')) {
                const btn = e.target.closest('.plugin-details-btn');
                const pluginKey = btn.dataset.plugin;
                this.showPluginDetails(pluginKey);
            }
            
            // Handle add button
            if (e.target.closest('.plugin-add-btn')) {
                const btn = e.target.closest('.plugin-add-btn');
                const pluginKey = btn.dataset.plugin;
                this.quickAddPlugin(pluginKey);
            }
        });
    }

    renderPlugins() {
        const grid = document.getElementById('plugins-grid');
        if (!grid) return;

        let plugins = this.marketplace.searchQuery
            ? this.marketplace.searchPlugins(this.marketplace.searchQuery)
            : this.marketplace.getPluginsByCategory(this.marketplace.selectedCategory);

        plugins = this.marketplace.sortPlugins(plugins, this.marketplace.sortBy);

        if (plugins.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    No plugins found
                </div>
            `;
            return;
        }

        grid.innerHTML = plugins.map(([key, plugin]) => {
            const isOfficial = plugin.category === 'official';
            const usage = this.marketplace.formatUsageCount(plugin.usage || 0);
            
            return `
                <div class="plugin-card" data-plugin="${key}">
                    <div class="plugin-header">
                        <div class="plugin-icon">
                            <i class="fas ${plugin.icon || 'fa-puzzle-piece'}"></i>
                        </div>
                        <div class="plugin-info">
                            <div class="plugin-name">
                                ${plugin.name}
                                ${isOfficial ? '<span class="plugin-badge">Official</span>' : ''}
                            </div>
                            <div class="plugin-category">${this.marketplace.categories[plugin.category]?.name || plugin.category}</div>
                        </div>
                    </div>
                    
                    <div class="plugin-description">${plugin.description}</div>
                    
                    <div class="plugin-tags">
                        ${plugin.tags.map(tag => `<span class="plugin-tag">${tag}</span>`).join('')}
                    </div>
                    
                    <div class="plugin-stats">
                        <div class="plugin-stat">
                            <i class="fas fa-download"></i> ${usage} uses
                        </div>
                        ${plugin.github ? `
                        <div class="plugin-stat">
                            <i class="fab fa-github"></i> View on GitHub
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="plugin-actions">
                        <button class="btn btn-secondary btn-sm plugin-details-btn" data-plugin="${key}">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        ${(window.pipelineBuilder?.selectedStep || this.onPluginSelect) ? `
                        <button class="btn btn-primary btn-sm plugin-add-btn" data-plugin="${key}">
                            <i class="fas fa-plus"></i> Add to Step
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async showPluginDetails(pluginKey) {
        const plugin = this.marketplace.plugins[pluginKey];
        if (!plugin) return;

        // Create details modal
        const modal = document.createElement('div');
        modal.className = 'plugin-details-modal';
        modal.innerHTML = `
            <div class="plugin-details-content">
                <div class="plugin-details-header">
                    <div>
                        <h3><i class="fas ${plugin.icon || 'fa-puzzle-piece'}"></i> ${plugin.name}</h3>
                        <p>${plugin.description}</p>
                    </div>
                    <button class="close-modal">
                        &times;
                    </button>
                </div>
                <div class="plugin-details-body">
                    <div class="plugin-details-tabs">
                        <div class="plugin-tab active" data-tab="overview">Overview</div>
                        <div class="plugin-tab" data-tab="readme">Documentation</div>
                        <div class="plugin-tab" data-tab="configure">Configure</div>
                    </div>
                    
                    <div id="plugin-tab-content">
                        <div class="loading-spinner">
                            <i class="fas fa-spinner"></i> Loading...
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Setup close button
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());

        // Setup tab handlers
        modal.querySelectorAll('.plugin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                modal.querySelectorAll('.plugin-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadPluginTab(pluginKey, tab.dataset.tab);
            });
        });

        // Load default tab
        this.loadPluginTab(pluginKey, 'overview');
    }

    async loadPluginTab(pluginKey, tab) {
        const content = document.getElementById('plugin-tab-content');
        if (!content) return;

        const plugin = this.marketplace.plugins[pluginKey];
        if (!plugin) return;

        switch (tab) {
            case 'overview':
                content.innerHTML = await this.renderPluginOverview(pluginKey);
                break;
            case 'readme':
                content.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner"></i> Loading documentation...</div>';
                try {
                    const readme = await this.marketplace.fetchReadme(pluginKey);
                    if (readme) {
                        content.innerHTML = `<div class="plugin-readme">${this.renderMarkdown(readme)}</div>`;
                    } else {
                        const plugin = this.marketplace.plugins[pluginKey];
                        content.innerHTML = `
                            <div class="plugin-readme">
                                <p><strong>Documentation:</strong></p>
                                <p>${plugin.description}</p>
                                ${window.location.protocol === 'file:' ? 
                                    '<p class="text-muted"><em>Note: Full documentation requires running from a web server (not file://).</em></p>' :
                                    '<p class="text-muted"><em>Full documentation not available at this time.</em></p>'
                                }
                                ${plugin.github ? `<p>View full documentation on <a href="${plugin.github}" target="_blank">GitHub</a></p>` : ''}
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Error loading readme:', error);
                    const plugin = this.marketplace.plugins[pluginKey];
                    content.innerHTML = `
                        <div class="plugin-readme">
                            <p><strong>Documentation:</strong></p>
                            <p>${plugin.description}</p>
                            ${plugin.github ? `<p>View full documentation on <a href="${plugin.github}" target="_blank">GitHub</a></p>` : ''}
                        </div>
                    `;
                }
                break;
            case 'configure':
                content.innerHTML = this.renderPluginConfigure(pluginKey);
                break;
        }
    }

    async renderPluginOverview(pluginKey) {
        const plugin = this.marketplace.plugins[pluginKey];
        let details = null;
        
        try {
            details = await this.marketplace.fetchPluginDetails(pluginKey);
        } catch (error) {
            console.error('Error fetching plugin details:', error);
        }
        
        const example = this.marketplace.getPluginExample(pluginKey);
        
        return `
            <div class="plugin-overview">
                <h4>Example Usage</h4>
                <div class="plugin-example">
                    <pre><code>plugins:
${example ? this.formatYAML(example, 2) : `  - ${pluginKey}#latest:\n      # Add your configuration here`}</code></pre>
                </div>
                
                ${plugin.github ? `
                <h4>Repository Information</h4>
                <div class="plugin-stats" style="margin-bottom: 1rem;">
                    ${details?.stars ? `<div class="plugin-stat"><i class="fas fa-star"></i> ${details.stars} stars</div>` : ''}
                    ${details?.forks ? `<div class="plugin-stat"><i class="fas fa-code-branch"></i> ${details.forks} forks</div>` : ''}
                    ${details?.issues ? `<div class="plugin-stat"><i class="fas fa-exclamation-circle"></i> ${details.issues} issues</div>` : ''}
                    ${details?.latestVersion ? `<div class="plugin-stat"><i class="fas fa-tag"></i> ${details.latestVersion}</div>` : ''}
                </div>
                ` : ''}
                
                <h4>Tags</h4>
                <div class="plugin-tags">
                    ${plugin.tags.map(tag => `<span class="plugin-tag">${tag}</span>`).join('')}
                </div>
                
                ${plugin.github ? `
                <div style="margin-top: 2rem;">
                    <a href="${plugin.github}" target="_blank" class="btn btn-secondary">
                        <i class="fab fa-github"></i> View on GitHub
                    </a>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderPluginConfigure(pluginKey) {
        const plugin = this.marketplace.plugins[pluginKey];
        if (!window.pipelineBuilder?.selectedStep) {
            return `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-info-circle" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    Please select a step to add this plugin to
                </div>
            `;
        }

        const step = window.pipelineBuilder.selectedStep;
        const example = this.marketplace.getPluginExample(pluginKey) || {};
        const pluginName = Object.keys(example)[0] || `${pluginKey}#latest`;
        const defaultConfig = example[pluginName] || {};

        return `
            <div class="plugin-configure">
                <h4>Configure ${plugin.name}</h4>
                <p>Adding to step: <strong>${step.properties.label || step.type}</strong></p>
                
                <form id="plugin-config-form" class="plugin-config-form">
                    ${Object.entries(defaultConfig).map(([key, value]) => `
                        <div class="config-field">
                            <label for="config-${key}">${this.formatConfigKey(key)}</label>
                            ${this.renderConfigInput(key, value)}
                        </div>
                    `).join('')}
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('plugin-details-modal').style.display='none';document.getElementById('plugin-details-modal').classList.add('hidden')">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Add Plugin
                        </button>
                    </div>
                </form>
            </div>
            
            <script>
                document.getElementById('plugin-config-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const config = {};
                    for (const [key, value] of formData.entries()) {
                        const cleanKey = key.replace('config-', '');
                        config[cleanKey] = value;
                    }
                    
                    if (window.pluginMarketplaceUI.addPluginWithConfig('${pluginKey}', config)) {
                        const modal = document.getElementById('plugin-details-modal');
                        if (modal) {
                            modal.style.display = 'none';
                            modal.classList.add('hidden');
                        }
                        window.pluginMarketplaceUI.showNotification('Plugin added successfully', 'success');
                    }
                });
            </script>
        `;
    }

    renderConfigInput(key, defaultValue) {
        if (typeof defaultValue === 'boolean') {
            return `
                <select name="config-${key}" id="config-${key}" class="form-control">
                    <option value="true" ${defaultValue ? 'selected' : ''}>Yes</option>
                    <option value="false" ${!defaultValue ? 'selected' : ''}>No</option>
                </select>
            `;
        } else if (Array.isArray(defaultValue)) {
            return `
                <input type="text" 
                       name="config-${key}" 
                       id="config-${key}" 
                       value="${defaultValue.join(', ')}"
                       placeholder="Comma-separated values"
                       class="form-control" />
            `;
        } else {
            return `
                <input type="text" 
                       name="config-${key}" 
                       id="config-${key}" 
                       value="${defaultValue}"
                       class="form-control" />
            `;
        }
    }

    formatConfigKey(key) {
        return key.replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    formatYAML(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        let yaml = '';
        
        if (!obj || typeof obj !== 'object') {
            return `${spaces}# Invalid configuration`;
        }
        
        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object' && !Array.isArray(value)) {
                yaml += `${spaces}- ${key}:\n`;
                yaml += this.formatYAML(value, indent + 4);
            } else if (Array.isArray(value)) {
                yaml += `${spaces}- ${key}:\n`;
                value.forEach(item => {
                    yaml += `${spaces}    - ${item}\n`;
                });
            } else {
                yaml += `${spaces}- ${key}: ${value}\n`;
            }
        });
        
        return yaml;
    }

    renderMarkdown(markdown) {
        // Basic markdown to HTML conversion
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    quickAddPlugin(pluginKey) {
        const plugin = this.marketplace.plugins[pluginKey];
        
        // If there's a callback function set (from pipeline builder), use it
        if (this.onPluginSelect) {
            this.onPluginSelect(pluginKey);
            this.showNotification(`Added ${plugin.name} plugin`, 'success');
            return;
        }
        
        // Otherwise, check if there's a selected step in pipeline builder
        if (!window.pipelineBuilder?.selectedStep) {
            this.showNotification('Please select a step first', 'warning');
            return;
        }

        // Add plugin to the selected step
        if (window.pipelineBuilder.addPluginToStep) {
            window.pipelineBuilder.addPluginToStep(pluginKey);
            this.showNotification(`Added ${plugin.name} plugin`, 'success');
            
            // Close marketplace modal properly
            const marketplaceModal = document.getElementById('plugin-marketplace-modal');
            if (marketplaceModal) {
                marketplaceModal.classList.add('hidden');
                marketplaceModal.style.display = 'none';
            }
        }
    }

    addPluginWithConfig(pluginKey, config) {
        if (!window.pipelineBuilder?.selectedStep) {
            this.showNotification('Please select a step first', 'warning');
            return false;
        }

        const step = window.pipelineBuilder.selectedStep;
        
        // Initialize plugins object if needed
        if (!step.properties.plugins) {
            step.properties.plugins = {};
        }
        
        // Process config values
        const processedConfig = {};
        Object.entries(config).forEach(([key, value]) => {
            if (value === 'true') processedConfig[key] = true;
            else if (value === 'false') processedConfig[key] = false;
            else if (typeof value === 'string' && value.includes(',')) processedConfig[key] = value.split(',').map(v => v.trim());
            else processedConfig[key] = value;
        });

        // Add plugin with version
        const versionedKey = `${pluginKey}#latest`;
        step.properties.plugins[versionedKey] = processedConfig;
        
        // Update the UI without clearing other steps
        if (window.pipelineBuilder.renderProperties) {
            window.pipelineBuilder.renderProperties();
        }
        if (window.pipelineBuilder.renderPipeline) {
            window.pipelineBuilder.renderPipeline();
        }
        if (window.pipelineBuilder.saveToLocalStorage) {
            window.pipelineBuilder.saveToLocalStorage();
        }
        
        console.log(`Added plugin ${pluginKey} with config to step`);
        return true;
    }

    refreshPlugins() {
        this.renderPlugins();
        this.showNotification('Plugins refreshed', 'info');
    }

    updateStats() {
        const totalPlugins = document.getElementById('total-plugins');
        const officialPlugins = document.getElementById('official-plugins');
        
        if (totalPlugins) {
            totalPlugins.textContent = Object.keys(this.marketplace.plugins).length;
        }
        
        if (officialPlugins) {
            const officialCount = Object.values(this.marketplace.plugins)
                .filter(p => p.category === 'official').length;
            officialPlugins.textContent = officialCount;
        }
    }

    async refreshPlugins() {
        const grid = document.getElementById('plugins-grid');
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                    Loading more plugins...
                </div>
            `;
        }
        
        // Fetch all plugins if available
        if (this.marketplace.fetchAllPlugins) {
            await this.marketplace.fetchAllPlugins();
        }
        
        // Re-render everything
        this.renderCategories();
        this.renderPlugins();
        this.updateStats();
        
        this.showNotification('Plugin list refreshed!', 'success');
    }

    showNotification(message, type = 'info') {
        if (window.mainInitializer?.showToast) {
            window.mainInitializer.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize
if (typeof window !== 'undefined') {
    window.PluginMarketplaceUI = PluginMarketplaceUI;
    
    // Function to initialize when marketplace is ready
    const initializeMarketplaceUI = () => {
        if (window.pluginMarketplace && window.pluginMarketplace.plugins && Object.keys(window.pluginMarketplace.plugins).length > 0) {
            window.pluginMarketplaceUI = new PluginMarketplaceUI();
            console.log('Plugin Marketplace UI initialized');
        } else {
            console.log('Plugin Marketplace UI: Waiting for marketplace...');
            setTimeout(initializeMarketplaceUI, 100);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMarketplaceUI);
    } else {
        initializeMarketplaceUI();
    }
}