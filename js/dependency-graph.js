// js/dependency-graph.js
// FIXED: Properly initialized dependency graph with visualization
/**
 * Visual Dependency Graph and Enhanced Conditional Logic Builder
 * FIXED: Proper initialization with pipeline builder reference
 */

class DependencyGraphManager {
    constructor(pipelineBuilder) {
        this.pipelineBuilder = pipelineBuilder;
        this.canvas = null;
        this.ctx = null;
        this.nodes = [];
        this.edges = [];
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.selectedNode = null;
        this.currentStep = null;
        this.init();
    }

    init() {
        console.log('🔗 Initializing Dependency Graph Manager...');
        this.setupGraphModal();
        this.setupConditionalBuilder();
        this.setupDependencyManager();
        
        // Setup event handlers for dependency graph button
        this.setupEventHandlers();
        
        console.log('✅ Dependency Graph Manager initialized');
    }

    setupEventHandlers() {
        // Listen for dependency graph button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="dependency-graph"]')) {
                this.showDependencyGraph();
            }
        });
    }

    setupGraphModal() {
        // Add dependency graph modal to the page if it doesn't exist
        if (!document.getElementById('dependency-graph-modal')) {
            const modalHTML = `
                <div id="dependency-graph-modal" class="modal hidden">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3><i class="fas fa-project-diagram"></i> Pipeline Dependency Graph</h3>
                            <button class="modal-close" onclick="window.closeModal && window.closeModal('dependency-graph-modal')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="graph-controls">
                                <button class="btn btn-secondary" onclick="window.dependencyGraph && window.dependencyGraph.resetView()">
                                    <i class="fas fa-expand-arrows-alt"></i> Reset View
                                </button>
                                <button class="btn btn-secondary" onclick="window.dependencyGraph && window.dependencyGraph.autoLayout()">
                                    <i class="fas fa-magic"></i> Auto Layout
                                </button>
                                <button class="btn btn-secondary" onclick="window.dependencyGraph && window.dependencyGraph.exportGraph()">
                                    <i class="fas fa-download"></i> Export SVG
                                </button>
                                <div class="graph-legend">
                                    <span class="legend-item">
                                        <div class="legend-color" style="background: #667eea;"></div>
                                        Command Steps
                                    </span>
                                    <span class="legend-item">
                                        <div class="legend-color" style="background: #f6ad55;"></div>
                                        Wait Steps
                                    </span>
                                    <span class="legend-item">
                                        <div class="legend-color" style="background: #e53e3e;"></div>
                                        Block Steps
                                    </span>
                                </div>
                            </div>
                            <div class="graph-container">
                                <canvas id="dependency-canvas" width="800" height="600"></canvas>
                                <div id="node-details" class="node-details"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    setupConditionalBuilder() {
        // Add conditional builder modal if it doesn't exist
        if (!document.getElementById('conditional-builder-modal')) {
            const modalHTML = `
                <div id="conditional-builder-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3><i class="fas fa-code-branch"></i> Conditional Logic Builder</h3>
                            <button class="modal-close" onclick="window.closeModal && window.closeModal('conditional-builder-modal')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="conditional-builder">
                                <div class="condition-section">
                                    <h4>If Conditions (AND)</h4>
                                    <div id="if-conditions" class="conditions-list"></div>
                                    <button class="btn btn-secondary btn-small" onclick="window.dependencyGraph && window.dependencyGraph.addCondition('if')">
                                        <i class="fas fa-plus"></i> Add Condition
                                    </button>
                                </div>
                                
                                <div class="condition-section">
                                    <h4>Unless Conditions (OR)</h4>
                                    <div id="unless-conditions" class="conditions-list"></div>
                                    <button class="btn btn-secondary btn-small" onclick="window.dependencyGraph && window.dependencyGraph.addCondition('unless')">
                                        <i class="fas fa-plus"></i> Add Condition
                                    </button>
                                </div>
                                
                                <div class="condition-preview">
                                    <h4>Preview</h4>
                                    <code id="condition-preview-text">No conditions set</code>
                                </div>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" onclick="window.closeModal && window.closeModal('conditional-builder-modal')">Cancel</button>
                            <button class="btn btn-primary" onclick="window.dependencyGraph && window.dependencyGraph.applyConditions()">Apply</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    setupDependencyManager() {
        // Add dependency manager modal if it doesn't exist
        if (!document.getElementById('dependency-manager-modal')) {
            const modalHTML = `
                <div id="dependency-manager-modal" class="modal hidden">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3><i class="fas fa-sitemap"></i> Dependency Manager</h3>
                            <button class="modal-close" onclick="window.closeModal && window.closeModal('dependency-manager-modal')">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="dependency-manager">
                                <div class="dependency-tabs">
                                    <button class="tab-btn active" onclick="window.dependencyGraph && window.dependencyGraph.showDependencyTab('step')">
                                        Step Dependencies
                                    </button>
                                    <button class="tab-btn" onclick="window.dependencyGraph && window.dependencyGraph.showDependencyTab('conditional')">
                                        Conditional Dependencies
                                    </button>
                                    <button class="tab-btn" onclick="window.dependencyGraph && window.dependencyGraph.showDependencyTab('soft')">
                                        Soft Dependencies
                                    </button>
                                </div>
                                
                                <div class="dependency-content">
                                    <div id="step-dependencies" class="dependency-section active">
                                        <h4>Step Dependencies</h4>
                                        <div id="step-dependency-list"></div>
                                    </div>
                                    
                                    <div id="conditional-dependencies" class="dependency-section" style="display: none;">
                                        <h4>Conditional Dependencies</h4>
                                        <p>Configure dependencies that only apply under certain conditions.</p>
                                    </div>
                                    
                                    <div id="soft-dependencies" class="dependency-section" style="display: none;">
                                        <h4>Soft Dependencies</h4>
                                        <p>Configure dependencies that allow failure.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" onclick="window.closeModal && window.closeModal('dependency-manager-modal')">Cancel</button>
                            <button class="btn btn-primary" onclick="window.dependencyGraph && window.dependencyGraph.applyDependencies()">Apply Dependencies</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    showDependencyGraph() {
        console.log('🔗 Opening dependency graph...');
        const modal = document.getElementById('dependency-graph-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // Initialize canvas after modal is shown
            setTimeout(() => {
                this.canvas = document.getElementById('dependency-canvas');
                if (this.canvas) {
                    this.ctx = this.canvas.getContext('2d');
                    
                    // Set canvas size
                    const container = this.canvas.parentElement;
                    this.canvas.width = container.offsetWidth || 800;
                    this.canvas.height = container.offsetHeight || 600;
                    
                    // Setup canvas events
                    this.setupCanvasEvents();
                    
                    // Generate and render graph
                    this.generateGraph();
                    this.renderGraph();
                    
                    console.log('✅ Dependency graph initialized');
                } else {
                    console.error('❌ Canvas element not found');
                }
            }, 100);
        } else {
            console.error('❌ Dependency graph modal not found');
        }
    }

    setupCanvasEvents() {
        if (!this.canvas) return;
        
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    generateGraph() {
        this.nodes = [];
        this.edges = [];
        
        const steps = this.pipelineBuilder.steps || [];
        const nodeSpacing = 150;
        const levelHeight = 120;
        
        // Create nodes for each step
        steps.forEach((step, index) => {
            const node = {
                id: step.id,
                step: step,
                x: 100 + (index % 4) * nodeSpacing,
                y: 100 + Math.floor(index / 4) * levelHeight,
                width: 120,
                height: 60,
                type: step.type
            };
            this.nodes.push(node);
        });
        
        // Create edges based on dependencies
        this.generateEdges();
        
        // Auto-layout for better visualization
        this.autoLayout();
    }

    generateEdges() {
        const steps = this.pipelineBuilder.steps || [];
        
        steps.forEach((step) => {
            // Explicit dependencies
            if (step.properties && step.properties.depends_on && step.properties.depends_on.length > 0) {
                step.properties.depends_on.forEach(depKey => {
                    const sourceStep = steps.find(s => s.properties && s.properties.key === depKey);
                    if (sourceStep) {
                        const sourceNode = this.nodes.find(n => n.id === sourceStep.id);
                        const targetNode = this.nodes.find(n => n.id === step.id);
                        
                        if (sourceNode && targetNode) {
                            this.edges.push({
                                source: sourceNode,
                                target: targetNode,
                                type: 'explicit',
                                style: 'solid'
                            });
                        }
                    }
                });
            }
            
            // Wait steps create implicit dependencies
            if (step.type === 'wait') {
                const stepIndex = steps.findIndex(s => s.id === step.id);
                // All steps before wait depend on it
                for (let i = 0; i < stepIndex; i++) {
                    const sourceNode = this.nodes.find(n => n.id === steps[i].id);
                    const targetNode = this.nodes.find(n => n.id === step.id);
                    
                    if (sourceNode && targetNode && !this.edgeExists(sourceNode, targetNode)) {
                        this.edges.push({
                            source: sourceNode,
                            target: targetNode,
                            type: 'wait',
                            style: 'dashed'
                        });
                    }
                }
            }
        });
    }

    edgeExists(source, target) {
        return this.edges.some(edge => 
            edge.source.id === source.id && edge.target.id === target.id
        );
    }

    autoLayout() {
        if (this.nodes.length === 0) return;
        
        // Simple hierarchical layout based on dependencies
        const levels = this.calculateLevels();
        const levelCounts = {};
        
        this.nodes.forEach(node => {
            const level = levels[node.id] || 0;
            if (!levelCounts[level]) levelCounts[level] = 0;
            
            node.x = 100 + levelCounts[level] * 150;
            node.y = 100 + level * 120;
            
            levelCounts[level]++;
        });
        
        // Center the graph
        this.centerGraph();
    }

    calculateLevels() {
        const levels = {};
        const visited = new Set();
        
        // Find nodes with no dependencies (level 0)
        this.nodes.forEach(node => {
            const hasDependencies = this.edges.some(edge => edge.target.id === node.id);
            if (!hasDependencies) {
                levels[node.id] = 0;
                visited.add(node.id);
            }
        });
        
        // Calculate levels for remaining nodes
        let changed = true;
        while (changed) {
            changed = false;
            
            this.nodes.forEach(node => {
                if (visited.has(node.id)) return;
                
                const dependencies = this.edges
                    .filter(edge => edge.target.id === node.id)
                    .map(edge => edge.source.id);
                
                if (dependencies.every(depId => visited.has(depId))) {
                    const maxLevel = Math.max(...dependencies.map(depId => levels[depId] || 0));
                    levels[node.id] = maxLevel + 1;
                    visited.add(node.id);
                    changed = true;
                }
            });
        }
        
        return levels;
    }

    centerGraph() {
        if (this.nodes.length === 0) return;
        
        const bounds = this.getGraphBounds();
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        this.panX = (canvasWidth - bounds.width) / 2 - bounds.minX;
        this.panY = (canvasHeight - bounds.height) / 2 - bounds.minY;
        this.scale = Math.min(
            canvasWidth / (bounds.width + 100),
            canvasHeight / (bounds.height + 100),
            1.5
        );
    }

    getGraphBounds() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x - node.width / 2);
            minY = Math.min(minY, node.y - node.height / 2);
            maxX = Math.max(maxX, node.x + node.width / 2);
            maxY = Math.max(maxY, node.y + node.height / 2);
        });
        
        return {
            minX, minY, maxX, maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    renderGraph() {
        if (!this.ctx || !this.canvas) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw edges
        this.edges.forEach(edge => this.drawEdge(edge));
        
        // Draw nodes
        this.nodes.forEach(node => this.drawNode(node));
        
        // Restore context state
        this.ctx.restore();
    }

    drawNode(node) {
        const colors = {
            command: '#667eea',
            wait: '#f6ad55',
            block: '#e53e3e',
            input: '#38a169',
            trigger: '#805ad5',
            group: '#3182ce',
            annotation: '#d69e2e'
        };
        
        const color = colors[node.type] || '#a0aec0';
        
        // Draw node background
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            node.x - node.width / 2,
            node.y - node.height / 2,
            node.width,
            node.height
        );
        
        // Draw node border
        this.ctx.strokeStyle = node === this.selectedNode ? '#2d3748' : '#ffffff';
        this.ctx.lineWidth = node === this.selectedNode ? 3 : 2;
        this.ctx.strokeRect(
            node.x - node.width / 2,
            node.y - node.height / 2,
            node.width,
            node.height
        );
        
        // Draw node label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const label = (node.step.properties && node.step.properties.label) || node.step.type;
        const maxWidth = node.width - 10;
        
        // Truncate label if too long
        let displayLabel = label;
        while (this.ctx.measureText(displayLabel).width > maxWidth && displayLabel.length > 0) {
            displayLabel = displayLabel.slice(0, -1);
        }
        if (displayLabel !== label) {
            displayLabel += '...';
        }
        
        this.ctx.fillText(displayLabel, node.x, node.y);
    }

    drawEdge(edge) {
        const { source, target, style } = edge;
        
        // Calculate edge points
        const startX = source.x;
        const startY = source.y + source.height / 2;
        const endX = target.x;
        const endY = target.y - target.height / 2;
        
        // Draw edge line
        this.ctx.strokeStyle = edge.type === 'wait' ? '#f6ad55' : '#4a5568';
        this.ctx.lineWidth = 2;
        
        if (style === 'dashed') {
            this.ctx.setLineDash([5, 5]);
        } else {
            this.ctx.setLineDash([]);
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        
        // Draw curved line
        const controlY = (startY + endY) / 2;
        this.ctx.bezierCurveTo(startX, controlY, endX, controlY, endX, endY);
        
        this.ctx.stroke();
        
        // Draw arrowhead
        this.drawArrowhead(endX, endY, Math.atan2(endY - controlY, endX - endX));
    }

    drawArrowhead(x, y, angle) {
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - arrowLength * Math.cos(angle - arrowAngle),
            y - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(
            x - arrowLength * Math.cos(angle + arrowAngle),
            y - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.stroke();
    }

    // Canvas event handlers
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panX) / this.scale;
        const y = (e.clientY - rect.top - this.panY) / this.scale;
        
        // Check if clicking on a node
        const node = this.getNodeAt(x, y);
        if (node) {
            this.selectedNode = node;
            this.showNodeDetails(node);
            this.renderGraph();
        } else {
            // Start panning
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            
            this.panX += dx;
            this.panY += dy;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            
            this.renderGraph();
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const zoom = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(0.1, Math.min(3, this.scale * zoom));
        
        // Zoom towards cursor
        this.panX = x - (x - this.panX) * (newScale / this.scale);
        this.panY = y - (y - this.panY) * (newScale / this.scale);
        this.scale = newScale;
        
        this.renderGraph();
    }

    handleClick(e) {
        // Already handled in mousedown
    }

    getNodeAt(x, y) {
        return this.nodes.find(node => {
            return x >= node.x - node.width/2 && 
                   x <= node.x + node.width/2 && 
                   y >= node.y - node.height/2 && 
                   y <= node.y + node.height/2;
        });
    }

    showNodeDetails(node) {
        const detailsContainer = document.getElementById('node-details');
        if (!detailsContainer) return;
        
        const step = node.step;
        
        detailsContainer.innerHTML = `
            <h4>${(step.properties && step.properties.label) || step.type}</h4>
            <p><strong>Type:</strong> ${step.type}</p>
            <p><strong>ID:</strong> ${step.id}</p>
            ${step.properties && step.properties.key ? `<p><strong>Key:</strong> ${step.properties.key}</p>` : ''}
            ${step.properties && step.properties.command ? `<p><strong>Command:</strong> <code>${step.properties.command}</code></p>` : ''}
            ${step.properties && step.properties.depends_on && step.properties.depends_on.length > 0 ? 
                `<p><strong>Dependencies:</strong> ${step.properties.depends_on.join(', ')}</p>` : ''}
            <button class="btn btn-secondary btn-small" onclick="window.pipelineBuilder && window.pipelineBuilder.selectStep && window.pipelineBuilder.selectStep('${step.id}'); window.closeModal && window.closeModal('dependency-graph-modal')">
                Edit Step
            </button>
        `;
    }

    resetView() {
        console.log('🔄 Resetting graph view...');
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.centerGraph();
        this.renderGraph();
    }

    exportGraph() {
        console.log('📥 Exporting graph...');
        
        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        const bounds = this.getGraphBounds();
        const padding = 50;
        
        exportCanvas.width = bounds.width + padding * 2;
        exportCanvas.height = bounds.height + padding * 2;
        
        const exportCtx = exportCanvas.getContext('2d');
        
        // White background
        exportCtx.fillStyle = '#ffffff';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        
        // Copy graph with proper positioning
        exportCtx.save();
        exportCtx.translate(padding - bounds.minX, padding - bounds.minY);
        
        // Temporarily switch context
        const tempCtx = this.ctx;
        const tempCanvas = this.canvas;
        this.ctx = exportCtx;
        this.canvas = exportCanvas;
        
        // Temporarily reset transformations
        const tempPanX = this.panX;
        const tempPanY = this.panY;
        const tempScale = this.scale;
        this.panX = 0;
        this.panY = 0;
        this.scale = 1;
        
        // Draw the graph
        this.edges.forEach(edge => this.drawEdge(edge));
        this.nodes.forEach(node => this.drawNode(node));
        
        // Restore original context and transformations
        this.ctx = tempCtx;
        this.canvas = tempCanvas;
        this.panX = tempPanX;
        this.panY = tempPanY;
        this.scale = tempScale;
        
        exportCtx.restore();
        
        // Convert to blob and download
        exportCanvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pipeline-dependency-graph.png';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // Conditional builder methods
    showConditionalBuilder() {
        console.log('🔀 Opening conditional builder...');
        const modal = document.getElementById('conditional-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.currentStep = this.pipelineBuilder.selectedStep ? 
                this.pipelineBuilder.steps.find(s => s.id === this.pipelineBuilder.selectedStep) : null;
            this.loadExistingConditions();
        }
    }

    loadExistingConditions() {
        if (!this.currentStep) return;
        
        const ifConditions = document.getElementById('if-conditions');
        const unlessConditions = document.getElementById('unless-conditions');
        
        if (ifConditions) ifConditions.innerHTML = '';
        if (unlessConditions) unlessConditions.innerHTML = '';
        
        // Load existing conditions
        if (this.currentStep.properties) {
            if (this.currentStep.properties.if) {
                // Parse and display if conditions
                const conditions = this.currentStep.properties.if.split(' && ');
                conditions.forEach(cond => this.addCondition('if', cond));
            }
            
            if (this.currentStep.properties.unless) {
                // Parse and display unless conditions
                const conditions = this.currentStep.properties.unless.split(' || ');
                conditions.forEach(cond => this.addCondition('unless', cond));
            }
        }
        
        this.updateConditionPreview();
    }

    addCondition(type, existingCondition = '') {
        const container = document.getElementById(`${type}-conditions`);
        if (!container) return;
        
        const conditionId = `condition-${Date.now()}`;
        const conditionHTML = `
            <div class="condition-item" id="${conditionId}">
                <select class="condition-field">
                    <option value="build.branch">Branch</option>
                    <option value="build.tag">Tag</option>
                    <option value="build.pull_request.id">Pull Request</option>
                    <option value="build.env">Environment Variable</option>
                    <option value="build.message">Commit Message</option>
                </select>
                <select class="condition-operator">
                    <option value="==">equals</option>
                    <option value="!=">not equals</option>
                    <option value="=~">matches</option>
                    <option value="!~">not matches</option>
                </select>
                <input type="text" class="condition-value" placeholder="value" value="">
                <button class="remove-btn" onclick="document.getElementById('${conditionId}').remove(); window.dependencyGraph && window.dependencyGraph.updateConditionPreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', conditionHTML);
        
        // Parse existing condition if provided
        if (existingCondition) {
            // Simple parsing for common conditions
            const match = existingCondition.match(/(.+?)\s*(==|!=|=~|!~)\s*"?(.+?)"?$/);
            if (match) {
                const conditionEl = document.getElementById(conditionId);
                conditionEl.querySelector('.condition-field').value = match[1].trim();
                conditionEl.querySelector('.condition-operator').value = match[2];
                conditionEl.querySelector('.condition-value').value = match[3].trim();
            }
        }
        
        this.updateConditionPreview();
    }

    updateConditionPreview() {
        const ifConditions = this.collectConditions('if');
        const unlessConditions = this.collectConditions('unless');
        
        const preview = document.getElementById('condition-preview-text');
        if (!preview) return;
        
        let previewText = '';
        
        if (ifConditions.length > 0) {
            previewText += `if: ${ifConditions.join(' && ')}`;
        }
        
        if (unlessConditions.length > 0) {
            if (previewText) previewText += '\n';
            previewText += `unless: ${unlessConditions.join(' || ')}`;
        }
        
        preview.textContent = previewText || 'No conditions set';
    }

    collectConditions(type) {
        const container = document.getElementById(`${type}-conditions`);
        if (!container) return [];
        
        const conditions = [];
        container.querySelectorAll('.condition-item').forEach(item => {
            const field = item.querySelector('.condition-field').value;
            const operator = item.querySelector('.condition-operator').value;
            const value = item.querySelector('.condition-value').value;
            
            if (value) {
                // Format condition string
                let condition = `${field} ${operator} `;
                if (operator === '=~' || operator === '!~') {
                    condition += `/${value}/`;
                } else {
                    condition += `"${value}"`;
                }
                conditions.push(condition);
            }
        });
        
        return conditions;
    }

    applyConditions() {
        console.log('✅ Applying conditions...');
        if (!this.currentStep) return;
        
        const ifConditions = this.collectConditions('if');
        const unlessConditions = this.collectConditions('unless');
        
        if (!this.currentStep.properties) {
            this.currentStep.properties = {};
        }
        
        if (ifConditions.length > 0) {
            this.currentStep.properties.if = ifConditions.join(' && ');
        } else {
            delete this.currentStep.properties.if;
        }
        
        if (unlessConditions.length > 0) {
            this.currentStep.properties.unless = unlessConditions.join(' || ');
        } else {
            delete this.currentStep.properties.unless;
        }
        
        if (this.pipelineBuilder.renderPipeline) {
            this.pipelineBuilder.renderPipeline();
        }
        if (this.pipelineBuilder.renderProperties) {
            this.pipelineBuilder.renderProperties();
        }
        
        if (window.closeModal) {
            window.closeModal('conditional-builder-modal');
        }
    }

    // Dependency manager methods
    showDependencyManager() {
        console.log('🔗 Opening dependency manager...');
        const modal = document.getElementById('dependency-manager-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.loadStepDependencies();
        }
    }

    showDependencyTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update content sections
        document.querySelectorAll('.dependency-section').forEach(section => {
            section.style.display = 'none';
        });
        
        const section = document.getElementById(`${tab}-dependencies`);
        if (section) {
            section.style.display = 'block';
        }
    }

    loadStepDependencies() {
        const container = document.getElementById('step-dependency-list');
        if (!container) return;
        
        const steps = this.pipelineBuilder.steps || [];
        
        container.innerHTML = '';
        
        steps.forEach(step => {
            const dependencyHTML = `
                <div class="step-dependency-item">
                    <div class="step-info">
                        <span class="step-label">${(step.properties && step.properties.label) || step.type}</span>
                        <span class="step-type">(${step.type})</span>
                    </div>
                    <div class="dependency-controls">
                        <label>Key:</label>
                        <input type="text" class="dependency-key" value="${(step.properties && step.properties.key) || ''}" 
                               placeholder="unique-key" data-step-id="${step.id}" 
                               onchange="window.dependencyGraph && window.dependencyGraph.updateStepKey(this)" />
                        
                        <label>Depends on:</label>
                        <input type="text" class="dependency-list" value="${(step.properties && step.properties.depends_on || []).join(', ')}" 
                               placeholder="key1, key2" data-step-id="${step.id}"
                               onchange="window.dependencyGraph && window.dependencyGraph.updateStepDependencies(this)" />
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', dependencyHTML);
        });
    }

    updateStepKey(input) {
        const stepId = input.dataset.stepId;
        const step = this.pipelineBuilder.steps.find(s => s.id === stepId);
        if (step) {
            if (!step.properties) step.properties = {};
            step.properties.key = input.value;
        }
    }

    updateStepDependencies(input) {
        const stepId = input.dataset.stepId;
        const step = this.pipelineBuilder.steps.find(s => s.id === stepId);
        if (step) {
            if (!step.properties) step.properties = {};
            const dependencies = input.value.split(',').map(dep => dep.trim()).filter(dep => dep);
            step.properties.depends_on = dependencies.length > 0 ? dependencies : [];
        }
    }

    applyDependencies() {
        console.log('✅ Applying dependencies...');
        if (this.pipelineBuilder.renderPipeline) {
            this.pipelineBuilder.renderPipeline();
        }
        if (window.closeModal) {
            window.closeModal('dependency-manager-modal');
        }
    }
}

// Export classes to global scope
window.DependencyGraphManager = DependencyGraphManager;