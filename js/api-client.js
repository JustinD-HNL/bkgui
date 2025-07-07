// Buildkite API Client Module
class BuildkiteAPIClient {
    constructor() {
        this.baseURL = '/api/buildkite';
        this.organization = null;
        this.apiToken = null;
        this.initialized = false;
        
        // Load configuration from localStorage
        this.loadConfiguration();
    }

    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('buildkite_api_config');
            if (savedConfig) {
                const config = JSON.parse(savedConfig);
                this.organization = config.organization;
                this.apiToken = config.apiToken;
                this.initialized = !!(config.organization && config.apiToken);
            }
        } catch (error) {
            console.error('Failed to load API configuration:', error);
        }
    }

    async initialize() {
        // Just check if we have configuration loaded
        this.loadConfiguration();
        return this.initialized;
    }

    async request(endpoint, options = {}) {
        if (!this.initialized) {
            throw new Error('API client not initialized. Please configure your Buildkite API token.');
        }

        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Buildkite-Token': this.apiToken,
                'X-Buildkite-Organization': this.organization
            },
            ...options
        };

        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `API request failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Pipeline Management
    async listPipelines() {
        return this.request(`/organizations/${this.organization}/pipelines`);
    }

    async getPipeline(slug) {
        return this.request(`/organizations/${this.organization}/pipelines/${slug}`);
    }

    async createPipeline(pipelineData) {
        return this.request(`/organizations/${this.organization}/pipelines`, {
            method: 'POST',
            body: JSON.stringify(pipelineData)
        });
    }

    async updatePipeline(slug, pipelineData) {
        return this.request(`/organizations/${this.organization}/pipelines/${slug}`, {
            method: 'PATCH',
            body: JSON.stringify(pipelineData)
        });
    }

    async deletePipeline(slug) {
        return this.request(`/organizations/${this.organization}/pipelines/${slug}`, {
            method: 'DELETE'
        });
    }

    // Build Management
    async listBuilds(pipelineSlug, options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        const endpoint = `/organizations/${this.organization}/pipelines/${pipelineSlug}/builds${queryParams ? '?' + queryParams : ''}`;
        return this.request(endpoint);
    }

    async getBuild(pipelineSlug, buildNumber) {
        return this.request(`/organizations/${this.organization}/pipelines/${pipelineSlug}/builds/${buildNumber}`);
    }

    async createBuild(pipelineSlug, buildData) {
        return this.request(`/organizations/${this.organization}/pipelines/${pipelineSlug}/builds`, {
            method: 'POST',
            body: JSON.stringify(buildData)
        });
    }

    async cancelBuild(pipelineSlug, buildNumber) {
        return this.request(`/organizations/${this.organization}/pipelines/${pipelineSlug}/builds/${buildNumber}/cancel`, {
            method: 'PUT'
        });
    }

    async rebuildBuild(pipelineSlug, buildNumber) {
        return this.request(`/organizations/${this.organization}/pipelines/${pipelineSlug}/builds/${buildNumber}/rebuild`, {
            method: 'PUT'
        });
    }

    // Agent Management
    async listAgents() {
        return this.request(`/organizations/${this.organization}/agents`);
    }

    async getAgent(agentId) {
        return this.request(`/organizations/${this.organization}/agents/${agentId}`);
    }

    // Artifact Management
    async listArtifacts(pipelineSlug, buildNumber, jobId) {
        return this.request(`/organizations/${this.organization}/pipelines/${pipelineSlug}/builds/${buildNumber}/jobs/${jobId}/artifacts`);
    }

    async downloadArtifact(pipelineSlug, buildNumber, jobId, artifactId) {
        const url = `${this.baseURL}/organizations/${this.organization}/pipelines/${pipelineSlug}/builds/${buildNumber}/jobs/${jobId}/artifacts/${artifactId}/download`;
        window.open(url, '_blank');
    }

    // Organization Management
    async getOrganization() {
        return this.request(`/organizations/${this.organization}`);
    }

    async listOrganizationMembers() {
        return this.request(`/organizations/${this.organization}/members`);
    }

    // Webhook Management
    async listWebhooks() {
        return this.request(`/organizations/${this.organization}/webhooks`);
    }

    async createWebhook(webhookData) {
        return this.request(`/organizations/${this.organization}/webhooks`, {
            method: 'POST',
            body: JSON.stringify(webhookData)
        });
    }

    async updateWebhook(webhookId, webhookData) {
        return this.request(`/organizations/${this.organization}/webhooks/${webhookId}`, {
            method: 'PATCH',
            body: JSON.stringify(webhookData)
        });
    }

    async deleteWebhook(webhookId) {
        return this.request(`/organizations/${this.organization}/webhooks/${webhookId}`, {
            method: 'DELETE'
        });
    }

    // Pipeline Templates (custom endpoint for this app)
    async savePipelineTemplate(template) {
        return this.request('/templates', {
            method: 'POST',
            body: JSON.stringify(template)
        });
    }

    async listPipelineTemplates() {
        return this.request('/templates');
    }

    // Validation
    async validatePipelineYAML(yaml) {
        return this.request('/validate', {
            method: 'POST',
            body: JSON.stringify({ yaml })
        });
    }

    // Search
    async searchPipelines(query) {
        return this.request(`/organizations/${this.organization}/pipelines/search?q=${encodeURIComponent(query)}`);
    }

    // Metrics
    async getPipelineMetrics(pipelineSlug, options = {}) {
        const queryParams = new URLSearchParams(options).toString();
        return this.request(`/organizations/${this.organization}/pipelines/${pipelineSlug}/metrics${queryParams ? '?' + queryParams : ''}`);
    }

    // Utility method to check API connection
    async testConnection() {
        if (!this.apiToken || !this.organization) {
            return false;
        }
        
        try {
            // Test with a simple API call
            const response = await fetch(`${this.baseURL}/organizations/${this.organization}`, {
                headers: {
                    'X-Buildkite-Token': this.apiToken,
                    'X-Buildkite-Organization': this.organization
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Set API configuration (stores in localStorage)
    setConfiguration(apiToken, organization) {
        this.apiToken = apiToken;
        this.organization = organization;
        this.initialized = !!(apiToken && organization);
        
        // Save to localStorage
        if (this.initialized) {
            localStorage.setItem('buildkite_api_config', JSON.stringify({
                apiToken,
                organization
            }));
        } else {
            localStorage.removeItem('buildkite_api_config');
        }
        
        return Promise.resolve({ success: true });
    }
    
    // Clear configuration
    clearConfiguration() {
        this.apiToken = null;
        this.organization = null;
        this.initialized = false;
        localStorage.removeItem('buildkite_api_config');
    }
}

// Export as singleton
const buildkiteAPI = new BuildkiteAPIClient();

// Make available globally
window.buildkiteAPI = buildkiteAPI;

// Export for modules if available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = buildkiteAPI;
} else if (typeof define === 'function' && define.amd) {
    define([], function() { return buildkiteAPI; });
}

export default buildkiteAPI;