// js/matrix-builder.js
// Matrix Build Configuration for Buildkite Pipeline Builder
/**
 * Handles matrix build configuration with visual interface
 */

class MatrixBuilder {
    constructor() {
        this.currentStep = null;
        this.matrixConfig = {};
        this.modal = null;
        this.init();
    }

    init() {
        console.log('🔢 Initializing Matrix Builder...');
        
        this.modal = document.getElementById('matrix-builder-modal');
        if (!this.modal) {
            console.warn('⚠️ Matrix builder modal not found');
            return;
        }
        
        this.setupEventListeners();
        console.log('✅ Matrix Builder initialized');
    }

    setupEventListeners() {
        // Add dimension button
        const addDimensionBtn = document.getElementById('add-matrix-dimension');
        if (addDimensionBtn) {
            addDimensionBtn.addEventListener('click', () => this.addDimension());
        }
        
        // Apply matrix button
        const applyBtn = document.getElementById('apply-matrix');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyMatrix());
        }
        
        // Close modal handlers
        this.modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        // Modal background click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openForStep(step) {
        console.log('📐 Opening matrix builder for step:', step.id);
        
        this.currentStep = step;
        this.matrixConfig = step.properties.matrix || {};
        
        this.renderDimensions();
        this.updatePreview();
        
        this.modal.style.display = 'block';
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.style.display = 'none';
        this.modal.classList.add('hidden');
        this.currentStep = null;
        this.matrixConfig = {};
    }

    addDimension(name = '', values = []) {
        const dimensionName = name || `dimension${Object.keys(this.matrixConfig).length + 1}`;
        this.matrixConfig[dimensionName] = values.length > 0 ? values : [''];
        this.renderDimensions();
        this.updatePreview();
    }

    removeDimension(name) {
        delete this.matrixConfig[name];
        this.renderDimensions();
        this.updatePreview();
    }

    addValue(dimension) {
        if (!this.matrixConfig[dimension]) {
            this.matrixConfig[dimension] = [];
        }
        this.matrixConfig[dimension].push('');
        this.renderDimensions();
        this.updatePreview();
    }

    removeValue(dimension, index) {
        if (this.matrixConfig[dimension]) {
            this.matrixConfig[dimension].splice(index, 1);
            if (this.matrixConfig[dimension].length === 0) {
                delete this.matrixConfig[dimension];
            }
        }
        this.renderDimensions();
        this.updatePreview();
    }

    updateDimensionName(oldName, newName) {
        if (oldName !== newName && this.matrixConfig[oldName]) {
            this.matrixConfig[newName] = this.matrixConfig[oldName];
            delete this.matrixConfig[oldName];
            this.renderDimensions();
            this.updatePreview();
        }
    }

    updateValue(dimension, index, value) {
        if (this.matrixConfig[dimension] && this.matrixConfig[dimension][index] !== undefined) {
            this.matrixConfig[dimension][index] = value;
            this.updatePreview();
        }
    }

    renderDimensions() {
        const container = document.getElementById('matrix-dimensions-list');
        if (!container) return;
        
        container.innerHTML = Object.entries(this.matrixConfig).map(([name, values]) => `
            <div class="matrix-dimension" data-dimension="${name}">
                <div class="dimension-header">
                    <input type="text" class="dimension-name" value="${name}" 
                           placeholder="Dimension name"
                           onchange="window.matrixBuilder.updateDimensionName('${name}', this.value)">
                    <button class="btn btn-small btn-danger" 
                            onclick="window.matrixBuilder.removeDimension('${name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="dimension-values">
                    ${values.map((value, index) => `
                        <div class="dimension-value">
                            <input type="text" value="${value}" 
                                   placeholder="Value"
                                   onchange="window.matrixBuilder.updateValue('${name}', ${index}, this.value)">
                            <button class="btn btn-small btn-danger" 
                                    onclick="window.matrixBuilder.removeValue('${name}', ${index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                    <button class="btn btn-small btn-secondary" 
                            onclick="window.matrixBuilder.addValue('${name}')">
                        <i class="fas fa-plus"></i> Add Value
                    </button>
                </div>
            </div>
        `).join('');
    }

    updatePreview() {
        const container = document.getElementById('matrix-preview-content');
        if (!container) return;
        
        const dimensions = Object.entries(this.matrixConfig).filter(([_, values]) => values.length > 0);
        
        if (dimensions.length === 0) {
            container.innerHTML = '<p class="no-data">No dimensions configured</p>';
            return;
        }
        
        // Calculate total combinations
        let totalCombinations = 1;
        dimensions.forEach(([_, values]) => {
            totalCombinations *= values.filter(v => v.trim() !== '').length;
        });
        
        // Generate example combinations (max 10)
        const combinations = this.generateCombinations(dimensions, 10);
        
        container.innerHTML = `
            <div class="matrix-stats">
                <p><strong>${dimensions.length} dimensions</strong> will create <strong>${totalCombinations} jobs</strong></p>
            </div>
            <div class="matrix-summary">
                ${dimensions.map(([name, values]) => `
                    <div class="dimension-summary">
                        <strong>${name}:</strong> 
                        <span class="values">${values.filter(v => v.trim() !== '').join(', ')}</span>
                    </div>
                `).join('')}
            </div>
            <div class="matrix-examples">
                <h4>Example Combinations:</h4>
                <div class="combination-list">
                    ${combinations.map(combo => `
                        <div class="combination-item">
                            ${Object.entries(combo).map(([key, value]) => 
                                `<span class="combo-var">${key}=${value}</span>`
                            ).join(' ')}
                        </div>
                    `).join('')}
                    ${totalCombinations > 10 ? `<p class="more">... and ${totalCombinations - 10} more</p>` : ''}
                </div>
            </div>
        `;
    }

    generateCombinations(dimensions, maxCount = 10) {
        const combinations = [];
        const validDimensions = dimensions.filter(([_, values]) => 
            values.some(v => v.trim() !== '')
        );
        
        if (validDimensions.length === 0) return combinations;
        
        const generate = (index, current) => {
            if (combinations.length >= maxCount) return;
            
            if (index === validDimensions.length) {
                combinations.push({...current});
                return;
            }
            
            const [name, values] = validDimensions[index];
            const validValues = values.filter(v => v.trim() !== '');
            
            for (const value of validValues) {
                current[name] = value;
                generate(index + 1, current);
                if (combinations.length >= maxCount) break;
            }
        };
        
        generate(0, {});
        return combinations;
    }

    applyMatrix() {
        if (!this.currentStep) return;
        
        // Clean up empty values
        const cleanedMatrix = {};
        Object.entries(this.matrixConfig).forEach(([name, values]) => {
            const cleanValues = values.filter(v => v.trim() !== '');
            if (cleanValues.length > 0) {
                cleanedMatrix[name] = cleanValues;
            }
        });
        
        // Apply to step
        if (Object.keys(cleanedMatrix).length > 0) {
            this.currentStep.properties.matrix = cleanedMatrix;
            console.log('✅ Matrix applied to step:', this.currentStep.id, cleanedMatrix);
        } else {
            delete this.currentStep.properties.matrix;
            console.log('✅ Matrix removed from step:', this.currentStep.id);
        }
        
        // Update pipeline
        if (window.pipelineBuilder) {
            window.pipelineBuilder.renderPipeline();
            window.pipelineBuilder.renderProperties();
        }
        
        // Show notification
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification(
                Object.keys(cleanedMatrix).length > 0 
                    ? 'Matrix configuration applied successfully!' 
                    : 'Matrix configuration removed',
                'success'
            );
        }
        
        this.closeModal();
    }

    // Helper method to check if a step has matrix configuration
    stepHasMatrix(step) {
        return step && step.properties && step.properties.matrix && 
               Object.keys(step.properties.matrix).length > 0;
    }

    // Get matrix summary for display
    getMatrixSummary(step) {
        if (!this.stepHasMatrix(step)) return null;
        
        const matrix = step.properties.matrix;
        const dimensions = Object.keys(matrix).length;
        let combinations = 1;
        
        Object.values(matrix).forEach(values => {
            combinations *= values.length;
        });
        
        return {
            dimensions,
            combinations,
            config: matrix
        };
    }
}

// Initialize and export
window.matrixBuilder = new MatrixBuilder();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatrixBuilder;
}