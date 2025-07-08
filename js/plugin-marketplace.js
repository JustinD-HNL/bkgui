// js/plugin-marketplace.js
/**
 * Plugin Marketplace Integration
 * Fetches and displays Buildkite plugins with live data
 */

class PluginMarketplace {
    constructor() {
        // Load the comprehensive plugin list
        this.plugins = window.BUILDKITE_PLUGINS || {};
        
        // Initialize state
        this.selectedCategory = 'all';
        this.searchQuery = '';
        this.sortBy = 'usage';
        
        // Plugin categories with enhanced organization
        this.categories = {
            'official': { name: 'Official', icon: 'fa-certificate', description: 'Official Buildkite plugins' },
            'testing': { name: 'Testing & Quality', icon: 'fa-vial', description: 'Testing frameworks and quality tools' },
            'security': { name: 'Security', icon: 'fa-shield-alt', description: 'Security and secrets management' },
            'build': { name: 'Build & Package', icon: 'fa-hammer', description: 'Build tools and package managers' },
            'deployment': { name: 'Deployment', icon: 'fa-rocket', description: 'Deployment and release tools' },
            'docker': { name: 'Docker & Containers', icon: 'fa-docker', description: 'Docker and containerization' },
            'aws': { name: 'AWS', icon: 'fa-aws', description: 'Amazon Web Services integrations' },
            'gcp': { name: 'Google Cloud', icon: 'fa-google', description: 'Google Cloud Platform integrations' },
            'infrastructure': { name: 'Infrastructure', icon: 'fa-server', description: 'Infrastructure as Code tools' },
            'monitoring': { name: 'Monitoring', icon: 'fa-chart-line', description: 'Monitoring and observability' },
            'notifications': { name: 'Notifications', icon: 'fa-bell', description: 'Notifications and alerts' },
            'mobile': { name: 'Mobile', icon: 'fa-mobile-alt', description: 'Mobile app development' },
            'language': { name: 'Languages', icon: 'fa-code', description: 'Language-specific tools' },
            'git': { name: 'Git & VCS', icon: 'fa-code-branch', description: 'Version control integrations' },
            'database': { name: 'Database', icon: 'fa-database', description: 'Database tools and migrations' },
            'utility': { name: 'Utilities', icon: 'fa-tools', description: 'Utility and helper plugins' },
            'code-quality': { name: 'Code Quality', icon: 'fa-check-circle', description: 'Linting and code analysis' },
            'performance': { name: 'Performance', icon: 'fa-tachometer-alt', description: 'Performance and optimization' },
            'integration': { name: 'Integrations', icon: 'fa-plug', description: 'Third-party integrations' }
        };
        
        console.log(`Plugin Marketplace: Loaded ${Object.keys(this.plugins).length} plugins`);
    }
    
    getPluginsByCategory(category) {
        if (category === 'all') {
            return Object.entries(this.plugins);
        }
        
        return Object.entries(this.plugins).filter(([_, plugin]) => 
            plugin.category === category
        );
    }
    
    searchPlugins(query) {
        const searchTerm = query.toLowerCase();
        return Object.entries(this.plugins).filter(([key, plugin]) => {
            return key.toLowerCase().includes(searchTerm) ||
                   plugin.name.toLowerCase().includes(searchTerm) ||
                   plugin.description.toLowerCase().includes(searchTerm) ||
                   plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        });
    }
    
    sortPlugins(plugins, sortBy) {
        switch (sortBy) {
            case 'usage':
                return plugins.sort((a, b) => (b[1].usage || 0) - (a[1].usage || 0));
            case 'name':
                return plugins.sort((a, b) => a[1].name.localeCompare(b[1].name));
            case 'category':
                return plugins.sort((a, b) => a[1].category.localeCompare(b[1].category));
            default:
                return plugins;
        }
    }
    
    formatUsageCount(count) {
        if (!count) return '0';
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
        return count.toString();
    }
    
    getPluginExample(pluginKey) {
        const plugin = this.plugins[pluginKey];
        if (!plugin) return null;
        
        // Generate a basic example if not provided
        const example = {};
        example[`${pluginKey}#latest`] = {
            // Add basic configuration based on plugin type
        };
        
        return plugin.example || example;
    }
    
    async fetchPluginDetails(pluginKey) {
        const plugin = this.plugins[pluginKey];
        if (!plugin || !plugin.github) return null;
        
        // Extract owner and repo from GitHub URL
        const match = plugin.github.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) return null;
        
        const [_, owner, repo] = match;
        
        try {
            // Fetch repository information
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
            if (!response.ok) throw new Error('Failed to fetch repo data');
            
            const data = await response.json();
            
            // Fetch README
            const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`);
            let readme = '';
            if (readmeResponse.ok) {
                const readmeData = await readmeResponse.json();
                readme = atob(readmeData.content);
            }
            
            return {
                stars: data.stargazers_count,
                forks: data.forks_count,
                issues: data.open_issues_count,
                updated: data.updated_at,
                description: data.description || plugin.description,
                readme: readme,
                homepage: data.homepage,
                topics: data.topics || []
            };
        } catch (error) {
            console.warn(`Failed to fetch details for ${pluginKey}:`, error);
            return null;
        }
    }
    
    async fetchAllPlugins() {
        // This method is called when the user wants to see all plugins
        // Since we already have the full list loaded, we just need to ensure it's available
        if (!this.plugins || Object.keys(this.plugins).length === 0) {
            // Try to load the plugins again
            this.plugins = window.BUILDKITE_PLUGINS || {};
        }
        
        console.log(`Plugin Marketplace: Total plugins available: ${Object.keys(this.plugins).length}`);
        return this.plugins;
    }
}

// Initialize the plugin marketplace
if (typeof window !== 'undefined') {
    // Wait for the full plugin list to be loaded
    const initializeMarketplace = () => {
        if (window.BUILDKITE_PLUGINS) {
            window.pluginMarketplace = new PluginMarketplace();
            console.log('Plugin Marketplace initialized with full plugin list');
        } else {
            // Try again in a moment
            setTimeout(initializeMarketplace, 100);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMarketplace);
    } else {
        initializeMarketplace();
    }
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PluginMarketplace;
}