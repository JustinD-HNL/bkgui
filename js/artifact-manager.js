// js/artifact-manager.js
// Artifact Management UI for Buildkite Pipeline Builder

class ArtifactManager {
    constructor() {
        this.currentStepId = null;
        this.pipelineBuilder = null;
        this.retentionPolicy = {
            period: 30,
            compress: false,
            encrypt: false
        };
        this.init();
    }

    init() {
        console.log('📦 Initializing Artifact Manager...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
        
        // Load saved settings
        this.loadRetentionPolicy();
        
        console.log('✅ Artifact Manager initialized');
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('#artifact-manager-modal .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Step selector
        const stepSelector = document.getElementById('artifact-step-selector');
        if (stepSelector) {
            stepSelector.addEventListener('change', (e) => {
                this.currentStepId = e.target.value;
                this.renderArtifactPaths();
                this.renderArtifactDependencies();
            });
        }

        // Add path buttons
        const addUploadBtn = document.getElementById('add-upload-path');
        if (addUploadBtn) {
            addUploadBtn.addEventListener('click', () => this.addArtifactPath('upload'));
        }

        const addDownloadBtn = document.getElementById('add-download-path');
        if (addDownloadBtn) {
            addDownloadBtn.addEventListener('click', () => this.addArtifactPath('download'));
        }

        // Retention policy
        const retentionPeriod = document.getElementById('retention-period');
        if (retentionPeriod) {
            retentionPeriod.addEventListener('change', (e) => {
                this.retentionPolicy.period = parseInt(e.target.value);
                this.saveRetentionPolicy();
            });
        }

        const compressCheckbox = document.getElementById('compress-artifacts');
        if (compressCheckbox) {
            compressCheckbox.addEventListener('change', (e) => {
                this.retentionPolicy.compress = e.target.checked;
                this.saveRetentionPolicy();
            });
        }

        const encryptCheckbox = document.getElementById('encrypt-artifacts');
        if (encryptCheckbox) {
            encryptCheckbox.addEventListener('change', (e) => {
                this.retentionPolicy.encrypt = e.target.checked;
                this.saveRetentionPolicy();
            });
        }

        // Apply button
        const applyBtn = document.getElementById('apply-artifacts');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyChanges());
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('#artifact-manager-modal .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('#artifact-manager-modal .tab-content').forEach(content => {
            content.style.display = 'none';
        });

        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.style.display = 'block';
        }

        // Refresh content based on tab
        if (tabName === 'paths') {
            this.populateStepSelector();
            this.renderArtifactPaths();
        } else if (tabName === 'dependencies') {
            this.renderArtifactDependencies();
        } else if (tabName === 'retention') {
            this.loadRetentionPolicyUI();
        }
    }

    populateStepSelector() {
        const selector = document.getElementById('artifact-step-selector');
        if (!selector || !window.pipelineBuilder) return;

        const currentValue = selector.value;
        selector.innerHTML = '<option value="">-- Select a step --</option>';

        window.pipelineBuilder.steps.forEach(step => {
            if (step.type === 'command') { // Only command steps can have artifacts
                const label = step.properties.label || `Command Step ${step.id}`;
                const option = document.createElement('option');
                option.value = step.id;
                option.textContent = label;
                selector.appendChild(option);
            }
        });

        selector.value = currentValue;
    }

    renderArtifactPaths() {
        if (!this.currentStepId || !window.pipelineBuilder) return;

        const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
        if (!step) return;

        // Render upload paths
        this.renderPathsList('upload', step.properties.artifact_paths || []);

        // Render download paths (from artifacts plugin)
        const artifactsPlugin = step.properties.plugins?.artifacts;
        this.renderPathsList('download', artifactsPlugin?.download || []);
    }

    renderPathsList(type, paths) {
        const container = document.getElementById(`${type}-paths-list`);
        if (!container) return;

        container.innerHTML = '';

        // Ensure paths is an array
        const pathArray = Array.isArray(paths) ? paths : (paths ? [paths] : []);

        pathArray.forEach((path, index) => {
            container.appendChild(this.createPathRow(path, type, index));
        });

        if (pathArray.length === 0) {
            container.innerHTML = `<div class="empty-state">No ${type} paths configured</div>`;
        }
    }

    createPathRow(path, type, index) {
        const row = document.createElement('div');
        row.className = 'artifact-path-row';
        row.innerHTML = `
            <div class="path-pattern">
                <input type="text" value="${path}" placeholder="e.g., dist/**/*" 
                       data-type="${type}" data-index="${index}">
            </div>
            <div class="path-info">
                <span class="path-type">${type === 'upload' ? '↑' : '↓'}</span>
            </div>
            <div class="path-actions">
                <button class="btn-icon" onclick="artifactManager.testPattern('${path}')">
                    <i class="fas fa-vial"></i>
                </button>
                <button class="btn-icon" onclick="artifactManager.removePath('${type}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add change listener
        const input = row.querySelector('input');
        input.addEventListener('change', (e) => {
            this.updatePath(type, index, e.target.value);
        });

        return row;
    }

    addArtifactPath(type) {
        const path = prompt(`Enter ${type} artifact path (glob pattern):`);
        if (!path || !this.currentStepId || !window.pipelineBuilder) return;

        const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
        if (!step) return;

        if (type === 'upload') {
            if (!step.properties.artifact_paths) {
                step.properties.artifact_paths = [];
            } else if (!Array.isArray(step.properties.artifact_paths)) {
                step.properties.artifact_paths = [step.properties.artifact_paths];
            }
            step.properties.artifact_paths.push(path);
        } else {
            if (!step.properties.plugins) {
                step.properties.plugins = {};
            }
            if (!step.properties.plugins.artifacts) {
                step.properties.plugins.artifacts = {};
            }
            if (!step.properties.plugins.artifacts.download) {
                step.properties.plugins.artifacts.download = [];
            } else if (!Array.isArray(step.properties.plugins.artifacts.download)) {
                step.properties.plugins.artifacts.download = [step.properties.plugins.artifacts.download];
            }
            step.properties.plugins.artifacts.download.push(path);
        }

        this.renderArtifactPaths();
        window.pipelineBuilder.saveToLocalStorage();
    }

    updatePath(type, index, newPath) {
        if (!this.currentStepId || !window.pipelineBuilder) return;

        const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
        if (!step) return;

        if (type === 'upload' && step.properties.artifact_paths) {
            if (Array.isArray(step.properties.artifact_paths)) {
                step.properties.artifact_paths[index] = newPath;
            } else if (index === 0) {
                step.properties.artifact_paths = newPath;
            }
        } else if (type === 'download' && step.properties.plugins?.artifacts?.download) {
            if (Array.isArray(step.properties.plugins.artifacts.download)) {
                step.properties.plugins.artifacts.download[index] = newPath;
            } else if (index === 0) {
                step.properties.plugins.artifacts.download = newPath;
            }
        }

        window.pipelineBuilder.saveToLocalStorage();
    }

    removePath(type, index) {
        if (!confirm('Remove this artifact path?') || !this.currentStepId || !window.pipelineBuilder) return;

        const step = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
        if (!step) return;

        if (type === 'upload' && step.properties.artifact_paths) {
            if (Array.isArray(step.properties.artifact_paths)) {
                step.properties.artifact_paths.splice(index, 1);
                if (step.properties.artifact_paths.length === 0) {
                    delete step.properties.artifact_paths;
                }
            } else if (index === 0) {
                delete step.properties.artifact_paths;
            }
        } else if (type === 'download' && step.properties.plugins?.artifacts?.download) {
            if (Array.isArray(step.properties.plugins.artifacts.download)) {
                step.properties.plugins.artifacts.download.splice(index, 1);
                if (step.properties.plugins.artifacts.download.length === 0) {
                    delete step.properties.plugins.artifacts.download;
                }
            } else if (index === 0) {
                delete step.properties.plugins.artifacts.download;
            }
        }

        this.renderArtifactPaths();
        window.pipelineBuilder.saveToLocalStorage();
    }

    testPattern(pattern) {
        // Simulate testing the glob pattern
        const examples = {
            'dist/**/*': ['dist/js/app.js', 'dist/css/style.css', 'dist/images/logo.png'],
            'test-results/*.xml': ['test-results/junit.xml', 'test-results/coverage.xml'],
            '*.log': ['build.log', 'error.log', 'debug.log'],
            'build/': ['build/app.exe', 'build/readme.txt', 'build/config.json']
        };

        const matches = examples[pattern] || ['No example matches available'];
        alert(`Pattern "${pattern}" would match:\n\n${matches.join('\n')}`);
    }

    renderArtifactDependencies() {
        const container = document.getElementById('artifact-dependencies-list');
        if (!container || !this.currentStepId || !window.pipelineBuilder) return;

        container.innerHTML = '';

        const currentStep = window.pipelineBuilder.steps.find(s => s.id === this.currentStepId);
        if (!currentStep) return;

        // Find all previous steps that upload artifacts
        const previousSteps = [];
        for (const step of window.pipelineBuilder.steps) {
            if (step.id === this.currentStepId) break;
            if (step.properties.artifact_paths) {
                previousSteps.push(step);
            }
        }

        if (previousSteps.length === 0) {
            container.innerHTML = '<div class="empty-state">No previous steps upload artifacts</div>';
            return;
        }

        // Create dependency checkboxes
        previousSteps.forEach(step => {
            const depEl = document.createElement('div');
            depEl.className = 'artifact-dependency-item';
            
            const paths = Array.isArray(step.properties.artifact_paths) ? 
                step.properties.artifact_paths : [step.properties.artifact_paths];
            
            depEl.innerHTML = `
                <label>
                    <input type="checkbox" data-step-id="${step.id}">
                    <strong>${step.properties.label || step.type}</strong>
                    <div class="artifact-list">
                        ${paths.map(p => `<span class="artifact-path">${p}</span>`).join('')}
                    </div>
                </label>
            `;

            container.appendChild(depEl);
        });
    }

    loadRetentionPolicyUI() {
        document.getElementById('retention-period').value = this.retentionPolicy.period;
        document.getElementById('compress-artifacts').checked = this.retentionPolicy.compress;
        document.getElementById('encrypt-artifacts').checked = this.retentionPolicy.encrypt;
    }

    saveRetentionPolicy() {
        localStorage.setItem('buildkite-artifact-retention', JSON.stringify(this.retentionPolicy));
    }

    loadRetentionPolicy() {
        const saved = localStorage.getItem('buildkite-artifact-retention');
        if (saved) {
            try {
                this.retentionPolicy = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load retention policy:', e);
            }
        }
    }

    applyChanges() {
        // Close modal
        const modal = document.getElementById('artifact-manager-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Refresh pipeline
        if (window.pipelineBuilder) {
            window.pipelineBuilder.renderPipeline();
        }

        // Show success notification
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification('Artifact settings updated', 'success');
        }
    }

    openForStep(stepId) {
        this.currentStepId = stepId;
        this.switchTab('paths');
        
        const selector = document.getElementById('artifact-step-selector');
        if (selector) {
            selector.value = stepId;
            selector.dispatchEvent(new Event('change'));
        }
    }
}

// Initialize when DOM is ready
window.artifactManager = new ArtifactManager();