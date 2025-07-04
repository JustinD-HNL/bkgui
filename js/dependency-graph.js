// js/dependency-graph.js
// Complete Dependency Graph Manager with visualization
/**
 * Visual Dependency Graph and Enhanced Conditional Logic Builder
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
            
            // Handle modal button clicks
            if (e.target.closest('[data-action="reset-view"]')) {
                this.resetView();
            }
            
            if (e.target.closest('[data-action="export-graph"]')) {
                this.exportGraph();
            }
            
            if (e.target.closest('[data-action="add-condition"]')) {
                this.addCondition();
            }
            
            if (e.target.closest('[data-action="apply-condition"]')) {
                this.applyCondition();
            }
            
            if (e.target.closest('[data-action="switch-dependency-type"]')) {
                const type = e.target.closest('[data-action="switch-dependency-type"]').dataset.type;
                this.switchDependencyType(type);
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
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="graph-controls">
                                <button class="btn btn-secondary" data-action="reset-view">
                                    <i class="fas fa-expand-arrows-alt"></i> Reset View
                                </button>
                                <button class="btn btn-secondary" data-action="export-graph">
                                    <i class="fas fa-download"></i> Export as Image
                                </button>
                            </div>
                            <div class="graph-container">
                                <canvas id="dependency-graph-canvas"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    setupConditionalBuilder() {
        if (!document.getElementById('conditional-builder-modal')) {
            const modalHTML = `
                <div id="conditional-builder-modal" class="modal hidden">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3><i class="fas fa-code-branch"></i> Conditional Logic Builder</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="conditional-builder">
                                <p class="modal-description">
                                    Build complex conditional expressions for step execution
                                </p>
                                
                                <div class="condition-builder">
                                    <h4>Build Variables</h4>
                                    <div class="build-vars">
                                        <code>build.branch</code> - Current branch<br>
                                        <code>build.tag</code> - Git tag<br>
                                        <code>build.commit</code> - Commit SHA<br>
                                        <code>build.message</code> - Commit message<br>
                                        <code>build.pull_request.id</code> - PR number<br>
                                        <code>build.source</code> - Build source
                                    </div>
                                    
                                    <h4>Expression Builder</h4>
                                    <div class="expression-builder">
                                        <select id="condition-variable">
                                            <option value="build.branch">build.branch</option>
                                            <option value="build.tag">build.tag</option>
                                            <option value="build.pull_request.id">build.pull_request.id</option>
                                            <option value="build.source">build.source</option>
                                        </select>
                                        
                                        <select id="condition-operator">
                                            <option value="==">equals</option>
                                            <option value="!=">not equals</option>
                                            <option value="=~">matches regex</option>
                                            <option value="!~">doesn't match regex</option>
                                        </select>
                                        
                                        <input type="text" id="condition-value" placeholder="value or pattern">
                                        
                                        <button class="btn btn-primary" data-action="add-condition">
                                            Add to Expression
                                        </button>
                                    </div>
                                    
                                    <h4>Current Expression</h4>
                                    <textarea id="condition-expression" rows="3"></textarea>
                                    
                                    <div class="modal-actions">
                                        <button class="btn btn-primary" data-action="apply-condition">
                                            Apply Condition
                                        </button>
                                        <button class="btn btn-secondary modal-close">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    setupDependencyManager() {
        if (!document.getElementById('dependency-manager-modal')) {
            const modalHTML = `
                <div id="dependency-manager-modal" class="modal hidden">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3><i class="fas fa-sitemap"></i> Manage Dependencies</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="dependency-manager">
                                <div class="dependency-tabs">
                                    <button class="dependency-type-btn active" data-action="switch-dependency-type" data-type="explicit">
                                        <i class="fas fa-link"></i> Explicit Dependencies
                                    </button>
                                    <button class="dependency-type-btn" data-action="switch-dependency-type" data-type="soft-fail">
                                        <i class="fas fa-shield-alt"></i> Soft Fail Rules
                                    </button>
                                    <button class="dependency-type-btn" data-action="switch-dependency-type" data-type="allow-failure">
                                        <i class="fas fa-exclamation-triangle"></i> Allow Failure
                                    </button>
                                </div>
                                
                                <div id="explicit-dependencies" class="dependency-section">
                                    <h4>Step Dependencies</h4>
                                    <div id="dependency-list"></div>
                                </div>
                                
                                <div id="soft-fail-dependencies" class="dependency-section" style="display: none;">
                                    <h4>Soft Fail Configuration</h4>
                                    <div id="soft-fail-list"></div>
                                </div>
                                
                                <div id="allow-failure-dependencies" class="dependency-section" style="display: none;">
                                    <h4>Allow Failure Settings</h4>
                                    <div id="allow-failure-list"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    showDependencyGraph() {
        console.log('📊 Showing dependency graph...');
        
        const modal = document.getElementById('dependency-graph-modal');
        if (!modal) {
            console.warn('Dependency graph modal not found');
            return;
        }
        
        modal.classList.remove('hidden');
        
        // Initialize canvas
        this.canvas = document.getElementById('dependency-graph-canvas');
        if (!this.canvas) {
            console.warn('Canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = 600;
        
        // Setup canvas event listeners
        this.setupCanvasEvents();
        
        // Build and render graph
        this.buildGraph();
        this.centerGraph();
        this.renderGraph();
    }

    buildGraph() {
        this.nodes = [];
        this.edges = [];
        
        if (!this.pipelineBuilder || !this.pipelineBuilder.steps) {
            console.warn('No pipeline steps found');
            return;
        }
        
        // Create nodes for each step
        const stepMap = new Map();
        this.pipelineBuilder.steps.forEach((step, index) => {
            const node = {
                id: step.id,
                label: step.properties.label || step.type,
                type: step.type,
                x: 0,
                y: 0,
                width: 150,
                height: 60,
                step: step
            };
            
            this.nodes.push(node);
            stepMap.set(step.id, node);
            stepMap.set(step.properties.key, node);
        });
        
        // Create edges for dependencies
        this.pipelineBuilder.steps.forEach(step => {
            if (step.properties.depends_on) {
                const deps = Array.isArray(step.properties.depends_on) 
                    ? step.properties.depends_on 
                    : [step.properties.depends_on];
                    
                deps.forEach(dep => {
                    const sourceNode = stepMap.get(dep);
                    const targetNode = stepMap.get(step.id);
                    
                    if (sourceNode && targetNode) {
                        this.edges.push({
                            source: sourceNode,
                            target: targetNode
                        });
                    }
                });
            }
        });
        
        // Layout nodes
        this.layoutGraph();
    }

    layoutGraph() {
        // Simple hierarchical layout
        const levels = new Map();
        const visited = new Set();
        
        // Find root nodes (no incoming edges)
        const roots = this.nodes.filter(node => 
            !this.edges.some(edge => edge.target === node)
        );
        
        // BFS to assign levels
        const queue = roots.map(node => ({ node, level: 0 }));
        
        while (queue.length > 0) {
            const { node, level } = queue.shift();
            
            if (visited.has(node.id)) continue;
            visited.add(node.id);
            
            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level).push(node);
            
            // Find children
            const children = this.edges
                .filter(edge => edge.source === node)
                .map(edge => edge.target);
                
            children.forEach(child => {
                if (!visited.has(child.id)) {
                    queue.push({ node: child, level: level + 1 });
                }
            });
        }
        
        // Position nodes
        const levelSpacing = 150;
        const nodeSpacing = 200;
        
        levels.forEach((nodes, level) => {
            const totalWidth = nodes.length * nodeSpacing;
            const startX = -totalWidth / 2 + nodeSpacing / 2;
            
            nodes.forEach((node, index) => {
                node.x = startX + index * nodeSpacing;
                node.y = level * levelSpacing;
            });
        });
    }

    centerGraph() {
        if (this.nodes.length === 0) return;
        
        // Calculate bounds
        const bounds = {
            minX: Math.min(...this.nodes.map(n => n.x - n.width / 2)),
            maxX: Math.max(...this.nodes.map(n => n.x + n.width / 2)),
            minY: Math.min(...this.nodes.map(n => n.y - n.height / 2)),
            maxY: Math.max(...this.nodes.map(n => n.y + n.height / 2))
        };
        
        const graphWidth = bounds.maxX - bounds.minX;
        const graphHeight = bounds.maxY - bounds.minY;
        
        // Center in canvas
        this.panX = this.canvas.width / 2 - (bounds.minX + graphWidth / 2);
        this.panY = this.canvas.height / 2 - (bounds.minY + graphHeight / 2);
    }

    renderGraph() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw edges
        this.edges.forEach(edge => this.drawEdge(edge));
        
        // Draw nodes
        this.nodes.forEach(node => this.drawNode(node));
        
        // Restore context
        this.ctx.restore();
    }

    drawNode(node) {
        const { x, y, width, height, label, type } = node;
        
        // Node colors based on type
        const colors = {
            'command': '#667eea',
            'wait': '#48bb78',
            'block': '#ed8936',
            'input': '#38b2ac',
            'trigger': '#e53e3e',
            'group': '#805ad5'
        };
        
        const color = colors[type] || '#718096';
        
        // Draw node background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = node === this.selectedNode ? '#4a5568' : color;
        this.ctx.lineWidth = node === this.selectedNode ? 3 : 2;
        
        this.roundRect(x - width / 2, y - height / 2, width, height, 8);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw type icon background
        this.ctx.fillStyle = color;
        this.roundRect(x - width / 2, y - height / 2, 30, height, [8, 0, 0, 8]);
        this.ctx.fill();
        
        // Draw label
        this.ctx.fillStyle = '#2d3748';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const labelText = label.length > 15 ? label.substring(0, 15) + '...' : label;
        this.ctx.fillText(labelText, x + 5, y);
    }

    drawEdge(edge) {
        const { source, target } = edge;
        
        // Calculate connection points
        const sx = source.x;
        const sy = source.y + source.height / 2;
        const tx = target.x;
        const ty = target.y - target.height / 2;
        
        // Draw bezier curve
        this.ctx.strokeStyle = '#cbd5e0';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        
        const controlOffset = Math.abs(ty - sy) / 2;
        this.ctx.bezierCurveTo(
            sx, sy + controlOffset,
            tx, ty - controlOffset,
            tx, ty
        );
        
        this.ctx.stroke();
        
        // Draw arrow
        const angle = Math.atan2(ty - (ty - controlOffset), tx - tx);
        this.drawArrow(tx, ty, angle);
    }

    drawArrow(x, y, angle) {
        const size = 8;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle - Math.PI / 2);
        
        this.ctx.fillStyle = '#cbd5e0';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-size / 2, size);
        this.ctx.lineTo(size / 2, size);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = [radius, radius, radius, radius];
        }
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius[0], y);
        this.ctx.lineTo(x + width - radius[1], y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius[1]);
        this.ctx.lineTo(x + width, y + height - radius[2]);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius[2], y + height);
        this.ctx.lineTo(x + radius[3], y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius[3]);
        this.ctx.lineTo(x, y + radius[0]);
        this.ctx.quadraticCurveTo(x, y, x + radius[0], y);
        this.ctx.closePath();
    }

    setupCanvasEvents() {
        if (!this.canvas) return;
        
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panX) / this.scale;
        const y = (e.clientY - rect.top - this.panY) / this.scale;
        
        // Check if clicking on a node
        const clickedNode = this.nodes.find(node => 
            x >= node.x - node.width / 2 &&
            x <= node.x + node.width / 2 &&
            y >= node.y - node.height / 2 &&
            y <= node.y + node.height / 2
        );
        
        if (clickedNode) {
            this.selectedNode = clickedNode;
            
            // Select in pipeline builder
            if (this.pipelineBuilder) {
                this.pipelineBuilder.selectStep(clickedNode.id);
            }
        } else {
            this.isDragging = true;
            this.dragStartX = e.clientX - this.panX;
            this.dragStartY = e.clientY - this.panY;
        }
        
        this.renderGraph();
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            this.panX = e.clientX - this.dragStartX;
            this.panY = e.clientY - this.dragStartY;
            this.renderGraph();
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    handleWheel(e) {
        e.preventDefault();
        
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.scale *= scaleFactor;
        this.scale = Math.max(0.1, Math.min(this.scale, 5));
        
        this.renderGraph();
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.handleMouseDown(e.touches[0]);
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1) {
            this.handleMouseMove(e.touches[0]);
        }
    }

    handleTouchEnd(e) {
        this.handleMouseUp(e);
    }

    resetView() {
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.centerGraph();
        this.renderGraph();
    }

    exportGraph() {
        if (!this.canvas) return;
        
        const link = document.createElement('a');
        link.download = 'dependency-graph.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    // Conditional builder methods
    addCondition() {
        const variable = document.getElementById('condition-variable').value;
        const operator = document.getElementById('condition-operator').value;
        const value = document.getElementById('condition-value').value;
        const expression = document.getElementById('condition-expression');
        
        if (!value) return;
        
        let condition = `${variable} ${operator} `;
        
        if (operator === '=~' || operator === '!~') {
            condition += `/${value}/`;
        } else {
            condition += `"${value}"`;
        }
        
        if (expression.value) {
            expression.value += ' && ' + condition;
        } else {
            expression.value = condition;
        }
    }

    applyCondition() {
        const expression = document.getElementById('condition-expression').value;
        
        if (!expression) return;
        
        // Apply to selected step in pipeline builder
        if (this.pipelineBuilder && this.pipelineBuilder.selectedStep) {
            const step = this.pipelineBuilder.steps.find(s => s.id === this.pipelineBuilder.selectedStep);
            if (step) {
                step.properties.if = expression;
                this.pipelineBuilder.renderProperties();
                this.pipelineBuilder.renderPipeline();
            }
        }
        
        // Close modal
        if (window.closeModal) {
            window.closeModal('conditional-builder-modal');
        }
    }

    // Dependency type switching
    switchDependencyType(type) {
        // Update buttons
        document.querySelectorAll('.dependency-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Show/hide sections
        document.querySelectorAll('.dependency-section').forEach(section => {
            const sectionType = section.id.replace('-dependencies', '').replace(/-/g, '-');
            section.style.display = section.id.includes(type) ? 'block' : 'none';
        });
    }

    showDependencyManager() {
        console.log('📊 Showing dependency manager...');
        
        const modal = document.getElementById('dependency-manager-modal');
        if (!modal) {
            console.warn('Dependency manager modal not found');
            return;
        }
        
        modal.classList.remove('hidden');
        this.updateDependencyList();
    }

    updateDependencyList() {
        const container = document.getElementById('dependency-list');
        if (!container || !this.pipelineBuilder) return;
        
        container.innerHTML = '';
        
        this.pipelineBuilder.steps.forEach(step => {
            const stepEl = document.createElement('div');
            stepEl.className = 'dependency-item';
            
            stepEl.innerHTML = `
                <div class="step-info">
                    <strong>${step.properties.label || step.type}</strong>
                    ${step.properties.key ? `<code>[${step.properties.key}]</code>` : ''}
                </div>
                <div class="dependencies">
                    ${step.properties.depends_on ? 
                        `Depends on: ${Array.isArray(step.properties.depends_on) ? 
                            step.properties.depends_on.join(', ') : 
                            step.properties.depends_on}` : 
                        'No dependencies'}
                </div>
            `;
            
            container.appendChild(stepEl);
        });
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    window.DependencyGraphManager = DependencyGraphManager;
}