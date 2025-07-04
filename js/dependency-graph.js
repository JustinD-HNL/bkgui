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
                                <button class="btn btn-secondary" onclick="window.dependencyGraph && window.dependencyGraph.exportGraph()">
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
                            <button class="modal-close" onclick="window.closeModal && window.closeModal('conditional-builder-modal')">&times;</button>
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
                                        
                                        <button class="btn btn-primary" onclick="window.dependencyGraph && window.dependencyGraph.addCondition()">
                                            Add to Expression
                                        </button>
                                    </div>
                                    
                                    <h4>Current Expression</h4>
                                    <textarea id="condition-expression" rows="3"></textarea>
                                    
                                    <div class="modal-actions">
                                        <button class="btn btn-primary" onclick="window.dependencyGraph && window.dependencyGraph.applyCondition()">
                                            Apply Condition
                                        </button>
                                        <button class="btn btn-secondary" onclick="window.closeModal && window.closeModal('conditional-builder-modal')">
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
        // The dependency manager modal is already in the HTML
        // Just ensure event handlers are set up
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('dependency-type-btn')) {
                const type = e.target.dataset.type;
                this.switchDependencyType(type);
            }
        });
    }

    showDependencyGraph() {
        console.log('📊 Showing dependency graph...');
        
        // Get canvas
        this.canvas = document.getElementById('dependency-graph-canvas');
        if (!this.canvas) {
            console.error('Canvas not found');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Setup canvas
        this.setupCanvas();
        
        // Build graph data
        this.buildGraphData();
        
        // Render graph
        this.renderGraph();
        
        // Show modal
        if (window.showModal) {
            window.showModal('dependency-graph-modal');
        } else {
            const modal = document.getElementById('dependency-graph-modal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }
        
        // Setup interactions
        this.setupInteractions();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = 600;
        
        // Set up high DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    buildGraphData() {
        this.nodes = [];
        this.edges = [];
        
        if (!this.pipelineBuilder || !this.pipelineBuilder.steps) {
            console.warn('No pipeline steps to graph');
            return;
        }
        
        const steps = this.pipelineBuilder.steps;
        const nodeMap = new Map();
        
        // Create nodes
        steps.forEach((step, index) => {
            const node = {
                id: step.id,
                key: step.properties.key,
                label: step.properties.label || `Step ${index + 1}`,
                type: step.type,
                x: 100 + (index % 4) * 200,
                y: 100 + Math.floor(index / 4) * 150,
                radius: 40,
                color: this.getNodeColor(step.type)
            };
            
            this.nodes.push(node);
            nodeMap.set(step.properties.key, node);
        });
        
        // Create edges
        steps.forEach(step => {
            if (step.properties.depends_on && step.properties.depends_on.length > 0) {
                const targetNode = nodeMap.get(step.properties.key);
                
                step.properties.depends_on.forEach(dep => {
                    const sourceNode = nodeMap.get(dep);
                    if (sourceNode && targetNode) {
                        this.edges.push({
                            source: sourceNode,
                            target: targetNode
                        });
                    }
                });
            }
        });
        
        // Apply force-directed layout
        this.applyForceLayout();
    }

    getNodeColor(type) {
        const colors = {
            'command': '#667eea',
            'wait': '#48bb78',
            'block': '#ed8936',
            'input': '#38b2ac',
            'trigger': '#e53e3e',
            'group': '#805ad5',
            'annotation': '#d69e2e'
        };
        
        return colors[type] || '#718096';
    }

    applyForceLayout() {
        // Simple force-directed layout
        const iterations = 50;
        const k = 100; // Ideal spring length
        const c = 0.1; // Spring constant
        
        for (let iter = 0; iter < iterations; iter++) {
            // Repulsive forces between all nodes
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const dx = this.nodes[j].x - this.nodes[i].x;
                    const dy = this.nodes[j].y - this.nodes[i].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        const force = k * k / dist;
                        const fx = (dx / dist) * force * c;
                        const fy = (dy / dist) * force * c;
                        
                        this.nodes[i].x -= fx;
                        this.nodes[i].y -= fy;
                        this.nodes[j].x += fx;
                        this.nodes[j].y += fy;
                    }
                }
            }
            
            // Attractive forces for connected nodes
            this.edges.forEach(edge => {
                const dx = edge.target.x - edge.source.x;
                const dy = edge.target.y - edge.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const force = (dist - k) * c;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    
                    edge.source.x += fx;
                    edge.source.y += fy;
                    edge.target.x -= fx;
                    edge.target.y -= fy;
                }
            });
        }
        
        // Center the graph
        this.centerGraph();
    }

    centerGraph() {
        if (this.nodes.length === 0) return;
        
        // Find bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });
        
        // Center
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const canvasCenterX = this.canvas.width / (2 * (window.devicePixelRatio || 1));
        const canvasCenterY = this.canvas.height / (2 * (window.devicePixelRatio || 1));
        
        const offsetX = canvasCenterX - centerX;
        const offsetY = canvasCenterY - centerY;
        
        this.nodes.forEach(node => {
            node.x += offsetX;
            node.y += offsetY;
        });
    }

    renderGraph() {
        if (!this.ctx) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save state
        this.ctx.save();
        
        // Apply transformations
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw edges
        this.edges.forEach(edge => {
            this.drawEdge(edge);
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(node);
        });
        
        // Restore state
        this.ctx.restore();
    }

    drawEdge(edge) {
        const ctx = this.ctx;
        
        // Calculate edge path
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Start and end points (accounting for node radius)
        const startX = edge.source.x + (dx / dist) * edge.source.radius;
        const startY = edge.source.y + (dy / dist) * edge.source.radius;
        const endX = edge.target.x - (dx / dist) * edge.target.radius;
        const endY = edge.target.y - (dy / dist) * edge.target.radius;
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#cbd5e0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arrowhead
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fillStyle = '#cbd5e0';
        ctx.fill();
    }

    drawNode(node) {
        const ctx = this.ctx;
        
        // Draw circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        if (node === this.selectedNode) {
            ctx.strokeStyle = '#2d3748';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Draw icon
        ctx.fillStyle = 'white';
        ctx.font = '20px Font Awesome 5 Free';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const icons = {
            'command': '\uf120',  // terminal
            'wait': '\uf252',     // hourglass-half
            'block': '\uf256',    // hand-paper
            'input': '\uf11c',    // keyboard
            'trigger': '\uf0e7',  // bolt
            'group': '\uf5fd',    // layer-group
            'annotation': '\uf27a' // comment-alt
        };
        
        ctx.fillText(icons[node.type] || '\uf013', node.x, node.y);
        
        // Draw label
        ctx.fillStyle = '#2d3748';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillText(node.label, node.x, node.y + node.radius + 15);
    }

    setupInteractions() {
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
        const x = (e.clientX - rect.left) / this.scale - this.panX / this.scale;
        const y = (e.clientY - rect.top) / this.scale - this.panY / this.scale;
        
        // Check if clicking on a node
        this.selectedNode = null;
        for (const node of this.nodes) {
            const dx = x - node.x;
            const dy = y - node.y;
            if (Math.sqrt(dx * dx + dy * dy) <= node.radius) {
                this.selectedNode = node;
                break;
            }
        }
        
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        
        this.renderGraph();
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        
        if (this.selectedNode) {
            // Move selected node
            this.selectedNode.x += dx / this.scale;
            this.selectedNode.y += dy / this.scale;
        } else {
            // Pan view
            this.panX += dx;
            this.panY += dy;
        }
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        
        this.renderGraph();
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
}

// Export the class
window.DependencyGraphManager = DependencyGraphManager;
export default DependencyGraphManager;  