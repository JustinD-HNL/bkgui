// js/pipeline-sharing.js
// Pipeline Sharing Functionality for Buildkite Pipeline Builder
/**
 * Handles pipeline sharing via URLs and export/import
 */

class PipelineSharing {
    constructor() {
        this.modal = null;
        this.baseUrl = window.location.origin;
        this.init();
    }

    init() {
        console.log('🔗 Initializing Pipeline Sharing...');
        
        this.modal = document.getElementById('share-pipeline-modal');
        if (!this.modal) {
            console.warn('⚠️ Share pipeline modal not found');
            return;
        }
        
        this.setupEventListeners();
        // Commented out auto-check for shared pipeline
        // this.checkForSharedPipeline();
        
        console.log('✅ Pipeline Sharing initialized');
    }

    setupEventListeners() {
        // Share button in header
        const shareBtn = document.getElementById('share-pipeline');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.openShareModal());
        }
        
        // Copy share link button
        const copyLinkBtn = document.getElementById('copy-share-link');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.copyShareLink());
        }
        
        // Export buttons
        const exportJsonBtn = document.getElementById('export-json');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => this.exportAsJSON());
        }
        
        const exportYamlBtn = document.getElementById('export-yaml-share');
        if (exportYamlBtn) {
            exportYamlBtn.addEventListener('click', () => this.exportAsYAML());
        }
        
        // Close handlers
        this.modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openShareModal() {
        console.log('🔗 Opening share modal');
        
        // Generate share link
        const shareLink = this.generateShareLink();
        const linkInput = document.getElementById('share-link');
        if (linkInput) {
            linkInput.value = shareLink;
        }
        
        // Generate QR code
        this.generateQRCode(shareLink);
        
        this.modal.style.display = 'block';
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.classList.add('hidden');
        }
    }

    generateShareLink() {
        if (!window.pipelineBuilder) {
            console.error('Pipeline builder not available');
            return '';
        }
        
        const config = window.pipelineBuilder.getPipelineConfig();
        const compressed = this.compressPipeline(config);
        
        // Create shareable URL
        const url = new URL(this.baseUrl);
        url.searchParams.set('pipeline', compressed);
        
        return url.toString();
    }

    compressPipeline(config) {
        try {
            // Convert to JSON and compress
            const json = JSON.stringify(config);
            // Simple base64 encoding - in production, use actual compression
            const compressed = btoa(encodeURIComponent(json));
            return compressed;
        } catch (error) {
            console.error('Failed to compress pipeline:', error);
            return '';
        }
    }

    decompressPipeline(compressed) {
        try {
            // Decompress from base64
            const json = decodeURIComponent(atob(compressed));
            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to decompress pipeline:', error);
            return null;
        }
    }

    copyShareLink() {
        const linkInput = document.getElementById('share-link');
        if (!linkInput) return;
        
        linkInput.select();
        linkInput.setSelectionRange(0, 99999); // For mobile
        
        navigator.clipboard.writeText(linkInput.value).then(() => {
            if (window.buildkiteApp) {
                window.buildkiteApp.showNotification('Share link copied to clipboard!', 'success');
            }
            
            // Visual feedback
            const copyBtn = document.getElementById('copy-share-link');
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('success');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('success');
                }, 2000);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
            if (window.buildkiteApp) {
                window.buildkiteApp.showNotification('Failed to copy link', 'error');
            }
        });
    }

    generateQRCode(url) {
        const container = document.getElementById('share-qr-code');
        if (!container) return;
        
        // Simple QR code placeholder - in production, use a QR library
        container.innerHTML = `
            <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>QR Code</p>
                <small>Scan to open pipeline</small>
            </div>
        `;
        
        // In production, use a library like qrcode.js
        // Example: QRCode.toCanvas(container, url, { width: 200 });
    }

    exportAsJSON() {
        if (!window.pipelineBuilder) return;
        
        const config = window.pipelineBuilder.getPipelineConfig();
        const json = JSON.stringify(config, null, 2);
        
        this.downloadFile('pipeline.json', json, 'application/json');
        
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification('Pipeline exported as JSON', 'success');
        }
    }

    exportAsYAML() {
        if (!window.pipelineBuilder || !window.yamlGenerator) return;
        
        const config = window.pipelineBuilder.getPipelineConfig();
        const yaml = window.yamlGenerator.generate(config);
        
        this.downloadFile('pipeline.yml', yaml, 'text/yaml');
        
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification('Pipeline exported as YAML', 'success');
        }
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    checkForSharedPipeline() {
        // Check if URL contains a shared pipeline
        const urlParams = new URLSearchParams(window.location.search);
        const sharedPipeline = urlParams.get('pipeline');
        
        if (sharedPipeline) {
            console.log('📥 Found shared pipeline in URL');
            this.importSharedPipeline(sharedPipeline);
        }
    }

    manualCheckForSharedPipeline() {
        console.log('🔍 Manually checking for shared pipeline...');
        this.checkForSharedPipeline();
    }

    importSharedPipeline(compressed) {
        const config = this.decompressPipeline(compressed);
        if (!config) {
            console.error('Failed to import shared pipeline');
            if (window.buildkiteApp) {
                window.buildkiteApp.showNotification('Failed to import shared pipeline', 'error');
            }
            return;
        }
        
        // Show confirmation dialog
        if (confirm('Import shared pipeline? This will replace your current pipeline.')) {
            this.loadPipelineConfig(config);
            
            // Clear the URL parameter
            const url = new URL(window.location);
            url.searchParams.delete('pipeline');
            window.history.replaceState({}, document.title, url.toString());
            
            if (window.buildkiteApp) {
                window.buildkiteApp.showNotification('Shared pipeline imported successfully!', 'success');
            }
        }
    }

    loadPipelineConfig(config) {
        if (!window.pipelineBuilder) {
            console.error('Pipeline builder not available');
            return;
        }
        
        // Clear existing pipeline
        window.pipelineBuilder.clearPipeline();
        
        // Load steps from config
        if (config.steps && Array.isArray(config.steps)) {
            config.steps.forEach(stepConfig => {
                if (stepConfig === 'wait') {
                    window.pipelineBuilder.addStep('wait');
                } else if (typeof stepConfig === 'object') {
                    // Determine step type from properties
                    const stepType = this.detectStepType(stepConfig);
                    const step = window.pipelineBuilder.addStep(stepType);
                    
                    // Apply properties
                    if (step) {
                        Object.assign(step.properties, stepConfig);
                        
                        // Handle special cases
                        if (stepConfig.command && step.properties.command !== undefined) {
                            step.properties.command = stepConfig.command;
                        }
                        if (stepConfig.label) {
                            step.properties.label = stepConfig.label;
                        }
                    }
                }
            });
            
            // Render the pipeline
            window.pipelineBuilder.renderPipeline();
            
            console.log('✅ Pipeline loaded from config');
        }
    }

    detectStepType(stepConfig) {
        // Detect step type based on properties
        if (stepConfig.command !== undefined) return 'command';
        if (stepConfig.block !== undefined) return 'block';
        if (stepConfig.input !== undefined) return 'input';
        if (stepConfig.trigger !== undefined) return 'trigger';
        if (stepConfig.group !== undefined) return 'group';
        if (stepConfig.annotate !== undefined) return 'annotation';
        if (stepConfig.notify !== undefined) return 'notify';
        if (stepConfig.plugins && Object.keys(stepConfig.plugins).length > 0) return 'plugin';
        
        // Default to command step
        return 'command';
    }

    // Import pipeline from file
    importFromFile(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let config;
                
                if (file.name.endsWith('.json')) {
                    config = JSON.parse(content);
                } else if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
                    // In production, use a YAML parser
                    console.warn('YAML import not implemented - use JSON format');
                    if (window.buildkiteApp) {
                        window.buildkiteApp.showNotification('YAML import coming soon - please use JSON format', 'warning');
                    }
                    return;
                }
                
                if (config) {
                    this.loadPipelineConfig(config);
                    if (window.buildkiteApp) {
                        window.buildkiteApp.showNotification('Pipeline imported successfully!', 'success');
                    }
                }
            } catch (error) {
                console.error('Failed to import pipeline:', error);
                if (window.buildkiteApp) {
                    window.buildkiteApp.showNotification('Failed to import pipeline file', 'error');
                }
            }
        };
        
        reader.readAsText(file);
    }
}

// Export the class
window.PipelineSharing = PipelineSharing;

// Initialize and export instance
window.pipelineSharing = new PipelineSharing();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipelineSharing;
}