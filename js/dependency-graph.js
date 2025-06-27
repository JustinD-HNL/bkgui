// js/dependency-graph.js
/**
 * Visual Dependency Graph and Enhanced Conditional Logic Builder
 * Completes the remaining features from the enhancement plan
 * 
 * FIXED: Complete implementation with proper initialization and event handling
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
        console.log('✅ Dependency Graph Manager initialized');
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
                                <button class="btn btn-secondary" data-action="auto-layout">
                                    <i class="fas fa-magic"></i> Auto Layout
                                </button>
                                <button class="btn btn-secondary" data-action="export-graph">
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
                            <canvas id="dependency-canvas" width="800" height="600"></canvas>
                            <div class="graph-info">
                                <div id="node-details" class="node-details">
                                    <h4>Select a step to view details</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    setupConditionalBuilder() {
        // Add conditional logic builder modal
        if (!document.getElementById('conditional-builder-modal')) {
            const modalHTML = `
                <div id="conditional-builder-modal" class="modal hidden">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3><i class="fas fa-code-branch"></i> Conditional Logic Builder</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="conditional-builder">
                                <div class="condition-groups" id="condition-groups">
                                    <div class="condition-group">
                                        <div class="condition-header">
                                            <h4>IF Conditions</h4>
                                            <button class="btn btn-secondary btn-small" data-action="add-condition" data-type="if">
                                                <i class="fas fa-plus"></i> Add Condition
                                            </button>
                                        </div>
                                        <div id="if-conditions" class="conditions-list"></div>
                                    </div>
                                    
                                    <div class="condition-group">
                                        <div class="condition-header">
                                            <h4>UNLESS Conditions</h4>
                                            <button class="btn btn-secondary btn-small" data-action="add-condition" data-type="unless">
                                                <i class="fas fa-plus"></i> Add Condition
                                            </button>
                                        </div>
                                        <div id="unless-conditions" class="conditions-list"></div>
                                    </div>
                                </div>
                                
                                <div class="condition-preview">
                                    <h4>Generated Condition</h4>
                                    <pre id="condition-output"></pre>
                                </div>
                                
                                <div class="condition-templates">
                                    <h4>Quick Templates</h4>
                                    <div class="template-buttons">
                                        <button class="btn btn-outline" data-template="main-branch">
                                            Main Branch Only
                                        </button>
                                        <button class="btn btn-outline" data-template="pull-request">
                                            Pull Request Only
                                        </button>
                                        <button class="btn btn-outline" data-template="file-changes">
                                            File Changes
                                        </button>
                                        <button class="btn btn-outline" data-template="env-var">
                                            Environment Variable
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary modal-close">Cancel</button>
                            <button class="btn btn-primary" data-action="apply-conditions">Apply Conditions</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    setupDependencyManager() {
        // Add dependency manager modal
        if (!document.getElementById('dependency-manager-modal')) {
            const modalHTML = `
                <div id="dependency-manager-modal" class="modal hidden">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3><i class="fas fa-sitemap"></i> Dependency Manager</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="dependency-manager">
                                <div class="dependency-types">
                                    <h4>Dependency Types</h4>
                                    <div class="dependency-type-buttons">
                                        <button class="btn btn-outline dependency-type-btn active" data-type="explicit">
                                            <i class="fas fa-link"></i> Explicit Dependencies
                                        </button>
                                        <button class="btn btn-outline dependency-type-btn" data-type="file-based">
                                            <i class="fas fa-file"></i> File-Based Dependencies
                                        </button>
                                        <button class="btn btn-outline dependency-type-btn" data-type="conditional">
                                            <i class="fas fa-code-branch"></i> Conditional Dependencies
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="dependency-content">
                                    <div id="explicit-dependencies" class="dependency-section">
                                        <div class="step-dependencies">
                                            <h5>Step Dependencies</h5>
                                            <div id="step-dependency-list"></div>
                                        </div>
                                    </div>
                                    
                                    <div id="file-based-dependencies" class="dependency-section" style="display: none;">
                                        <div class="file-dependency-builder">
                                            <h5>File Change Dependencies</h5>
                                            <div class="file-patterns">
                                                <div class="property-group">
                                                    <label>Watch Patterns</label>
                                                    <textarea placeholder="src/**/*.js&#10;tests/**/*.test.js&#10;package.json"></textarea>
                                                    <small>File patterns that trigger this step when changed</small>
                                                </div>
                                                <div class="property-group">
                                                    <label>Ignore Patterns</label>
                                                    <textarea placeholder="*.md&#10;docs/**/*&#10;.gitignore"></textarea>
                                                    <small>File patterns to ignore</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div id="conditional-dependencies" class="dependency-section" style="display: none;">
                                        <div class="conditional-dependency-builder">
                                            <h5>Conditional Dependencies</h5>
                                            <div class="conditional-rules">
                                                <div class="property-group">
                                                    <label>Condition</label>
                                                    <select class="condition-type">
                                                        <option value="branch">Branch Pattern</option>
                                                        <option value="env">Environment Variable</option>
                                                        <option value="metadata">Build Metadata</option>
                                                        <option value="time">Time-based</option>
                                                    </select>
                                                </div>
                                                <div class="property-group">
                                                    <label>Rule</label>
                                                    <input type="text" placeholder="main develop/*" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary modal-close">Cancel</button>
                            <button class="btn btn-primary" data-action="apply-dependencies">Apply Dependencies</button>
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
        
        steps.forEach((step, index) => {
            // Implicit dependencies (sequential flow)
            if (index > 0 && steps[index - 1].type !== 'wait') {
                const sourceNode = this.nodes.find(n => n.id === steps[index - 1].id);
                const targetNode = this.nodes.find(n => n.id === step.id);
                
                if (sourceNode && targetNode) {
                    this.edges.push({
                        source: sourceNode,
                        target: targetNode,
                        type: 'sequential',
                        style: 'solid'
                    });
                }
            }
            
            // Wait step dependencies
            if (step.type === 'wait') {
                // Wait steps depend on all previous steps
                for (let i = 0; i < index; i++) {
                    const sourceNode = this.nodes.find(n => n.id === steps[i].id);
                    const targetNode = this.nodes.find(n => n.id === step.id);
                    
                    if (sourceNode && targetNode) {
                        this.edges.push({
                            source: sourceNode,
                            target: targetNode,
                            type: 'wait',
                            style: 'dashed'
                        });
                    }
                }
            }
            
            // Explicit dependencies (if implemented)
            if (step.properties && step.properties.depends_on) {
                const dependencies = Array.isArray(step.properties.depends_on) 
                    ? step.properties.depends_on 
                    : [step.properties.depends_on];
                    
                dependencies.forEach(depId => {
                    const sourceNode = this.nodes.find(n => n.step.properties && n.step.properties.key === depId);
                    const targetNode = this.nodes.find(n => n.id === step.id);
                    
                    if (sourceNode && targetNode) {
                        this.edges.push({
                            source: sourceNode,
                            target: targetNode,
                            type: 'explicit',
                            style: 'solid'
                        });
                    }
                });
            }
        });
    }

    autoLayout() {
        // Simple force-directed layout
        const iterations = 50;
        const repulsion = 5000;
        const attraction = 0.1;
        const damping = 0.9;
        
        for (let iter = 0; iter < iterations; iter++) {
            // Reset forces
            this.nodes.forEach(node => {
                node.fx = 0;
                node.fy = 0;
            });
            
            // Repulsion between nodes
            for (let i = 0; i < this.nodes.length; i++) {
                for (let j = i + 1; j < this.nodes.length; j++) {
                    const node1 = this.nodes[i];
                    const node2 = this.nodes[j];
                    
                    const dx = node1.x - node2.x;
                    const dy = node1.y - node2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    const force = repulsion / (distance * distance);
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    node1.fx += fx;
                    node1.fy += fy;
                    node2.fx -= fx;
                    node2.fy -= fy;
                }
            }
            
            // Attraction along edges
            this.edges.forEach(edge => {
                const dx = edge.target.x - edge.source.x;
                const dy = edge.target.y - edge.source.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                
                const force = distance * attraction;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                
                edge.source.fx += fx;
                edge.source.fy += fy;
                edge.target.fx -= fx;
                edge.target.fy -= fy;
            });
            
            // Apply forces
            this.nodes.forEach(node => {
                node.x += node.fx * damping;
                node.y += node.fy * damping;
            });
        }
    }

    renderGraph() {
        if (!this.ctx || !this.canvas) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.save();
        ctx.scale(this.scale, this.scale);
        ctx.translate(this.panX, this.panY);
        
        // Draw edges
        this.edges.forEach(edge => this.drawEdge(edge));
        
        // Draw nodes
        this.nodes.forEach(node => this.drawNode(node));
        
        ctx.restore();
    }

    drawNode(node) {
        const ctx = this.ctx;
        const { x, y, width, height, type, step } = node;
        
        // Node colors by type
        const colors = {
            command: '#667eea',
            wait: '#f6ad55',
            block: '#e53e3e',
            input: '#38a169',
            trigger: '#805ad5',
            group: '#319795',
            annotation: '#d69e2e',
            plugin: '#e53e3e',
            notify: '#9f7aea',
            'pipeline-upload': '#2b6cb0'
        };
        
        const color = colors[type] || '#a0aec0';
        
        // Draw node background
        ctx.fillStyle = node === this.selectedNode ? '#2d3748' : color;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // Draw node border
        ctx.strokeStyle = node === this.selectedNode ? '#667eea' : '#ffffff';
        ctx.lineWidth = node === this.selectedNode ? 3 : 1;
        ctx.strokeRect(x - width/2, y - height/2, width, height);
        
        // Draw node text
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const label = (step.properties && step.properties.label) || step.type;
        const maxWidth = width - 10;
        const truncated = this.truncateText(label, maxWidth, ctx);
        
        ctx.fillText(truncated, x, y - 5);
        ctx.fillText(type, x, y + 10);
    }

    drawEdge(edge) {
        const ctx = this.ctx;
        const { source, target, type, style } = edge;
        
        // Edge colors by type
        const colors = {
            sequential: '#4a5568',
            wait: '#f6ad55',
            explicit: '#667eea'
        };
        
        ctx.strokeStyle = colors[type] || '#a0aec0';
        ctx.lineWidth = 2;
        
        // Set line style
        if (style === 'dashed') {
            ctx.setLineDash([5, 5]);
        } else {
            ctx.setLineDash([]);
        }
        
        // Draw line
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
        
        // Draw arrowhead
        this.drawArrowhead(source.x, source.y, target.x, target.y);
    }

    drawArrowhead(x1, y1, x2, y2) {
        const ctx = this.ctx;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        // Calculate arrowhead position (slightly before target)
        const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const ratio = (dist - 30) / dist; // 30px before target
        const arrowX = x1 + (x2 - x1) * ratio;
        const arrowY = y1 + (y2 - y1) * ratio;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle - arrowAngle),
            arrowY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowLength * Math.cos(angle + arrowAngle),
            arrowY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
    }

    truncateText(text, maxWidth, ctx) {
        if (ctx.measureText(text).width <= maxWidth) {
            return text;
        }
        
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        
        return truncated + '...';
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.scale - this.panX;
        const y = (e.clientY - rect.top) / this.scale - this.panY;
        
        const clickedNode = this.getNodeAt(x, y);
        if (clickedNode) {
            this.selectedNode = clickedNode;
            this.showNodeDetails(clickedNode);
        } else {
            this.selectedNode = null;
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        }
        
        this.renderGraph();
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            
            this.panX += dx / this.scale;
            this.panY += dy / this.scale;
            
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
        
        const zoom = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(3, this.scale * zoom));
        
        // Zoom towards cursor
        this.panX = x / newScale - (x / this.scale - this.panX);
        this.panY = y / newScale - (y / this.scale - this.panY);
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
            ${step.properties && step.properties.command ? `<p><strong>Command:</strong> <code>${step.properties.command}</code></p>` : ''}
            ${step.properties && step.properties.agents ? `<p><strong>Agents:</strong> ${step.properties.agents}</p>` : ''}
            ${step.properties && step.properties.plugins && Object.keys(step.properties.plugins).length > 0 ? 
                `<p><strong>Plugins:</strong> ${Object.keys(step.properties.plugins).join(', ')}</p>` : ''}
            <button class="btn btn-secondary btn-small" onclick="pipelineBuilder && pipelineBuilder.selectStep && pipelineBuilder.selectStep('${step.id}'); window.closeModal && window.closeModal('dependency-graph-modal')">
                Edit Step
            </button>
        `;
    }

    resetView() {
        console.log('🔄 Resetting graph view...');
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.renderGraph();
    }

    exportGraph() {
        console.log('📥 Exporting graph...');
        // Create SVG representation
        const svg = this.generateSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pipeline-dependency-graph.svg';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    generateSVG() {
        const width = 800;
        const height = 600;
        let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
        
        // Add edges
        this.edges.forEach(edge => {
            const color = edge.type === 'wait' ? '#f6ad55' : '#4a5568';
            const style = edge.style === 'dashed' ? 'stroke-dasharray="5,5"' : '';
            svg += `<line x1="${edge.source.x}" y1="${edge.source.y}" x2="${edge.target.x}" y2="${edge.target.y}" stroke="${color}" stroke-width="2" ${style}/>`;
        });
        
        // Add nodes
        this.nodes.forEach(node => {
            const colors = {
                command: '#667eea',
                wait: '#f6ad55',
                block: '#e53e3e',
                input: '#38a169',
                trigger: '#805ad5'
            };
            const color = colors[node.type] || '#a0aec0';
            
            svg += `<rect x="${node.x - node.width/2}" y="${node.y - node.height/2}" width="${node.width}" height="${node.height}" fill="${color}" stroke="#ffffff"/>`;
            svg += `<text x="${node.x}" y="${node.y}" text-anchor="middle" fill="white" font-family="Arial" font-size="12">${(node.step.properties && node.step.properties.label) || node.type}</text>`;
        });
        
        svg += '</svg>';
        return svg;
    }

    // Conditional Logic Builder Methods
    showConditionalBuilder() {
        console.log('🔀 Opening conditional builder...');
        const modal = document.getElementById('conditional-builder-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.currentStep = this.pipelineBuilder.selectedStep;
            this.loadExistingConditions();
        } else {
            console.error('❌ Conditional builder modal not found');
        }
    }

    loadExistingConditions() {
        if (!this.currentStep) return;
        
        const ifConditions = document.getElementById('if-conditions');
        const unlessConditions = document.getElementById('unless-conditions');
        
        if (ifConditions) ifConditions.innerHTML = '';
        if (unlessConditions) unlessConditions.innerHTML = '';
        
        // Load existing if condition
        if (this.currentStep.properties && this.currentStep.properties.if) {
            this.addCondition('if', this.currentStep.properties.if);
        }
        
        // Load existing unless condition
        if (this.currentStep.properties && this.currentStep.properties.unless) {
            this.addCondition('unless', this.currentStep.properties.unless);
        }
        
        this.updateConditionPreview();
    }

    addCondition(type, existingValue = '') {
        console.log(`➕ Adding ${type} condition...`);
        const container = document.getElementById(`${type}-conditions`);
        if (!container) return;
        
        const conditionId = `condition-${Date.now()}`;
        
        const conditionHTML = `
            <div class="condition-item" id="${conditionId}">
                <div class="condition-builder">
                    <select class="condition-field" onchange="window.dependencyGraph && window.dependencyGraph.updateConditionPreview()">
                        <option value="build.branch">Branch</option>
                        <option value="build.pull_request">Pull Request</option>
                        <option value="build.env">Environment Variable</option>
                        <option value="build.commit.message">Commit Message</option>
                        <option value="build.author.email">Author Email</option>
                        <option value="build.tag">Tag</option>
                    </select>
                    
                    <select class="condition-operator" onchange="window.dependencyGraph && window.dependencyGraph.updateConditionPreview()">
                        <option value="==">equals</option>
                        <option value="!=">not equals</option>
                        <option value="=~">matches regex</option>
                        <option value="!~">doesn't match regex</option>
                        <option value="in">in list</option>
                        <option value="not in">not in list</option>
                    </select>
                    
                    <input type="text" class="condition-value" placeholder="Value" value="${existingValue}" oninput="window.dependencyGraph && window.dependencyGraph.updateConditionPreview()" />
                    
                    <button class="btn btn-outline btn-small" onclick="window.dependencyGraph && window.dependencyGraph.removeCondition('${conditionId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="condition-examples">
                    <small>Examples: main, develop/*, *.feature, user@company.com</small>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', conditionHTML);
        this.updateConditionPreview();
    }

    removeCondition(conditionId) {
        console.log(`➖ Removing condition: ${conditionId}`);
        const element = document.getElementById(conditionId);
        if (element) {
            element.remove();
            this.updateConditionPreview();
        }
    }

    updateConditionPreview() {
        const ifConditions = this.collectConditions('if');
        const unlessConditions = this.collectConditions('unless');
        
        let conditionText = '';
        
        if (ifConditions.length > 0) {
            conditionText += ifConditions.join(' && ');
        }
        
        if (unlessConditions.length > 0) {
            if (conditionText) conditionText += ' && ';
            conditionText += '!(' + unlessConditions.join(' || ') + ')';
        }
        
        const output = document.getElementById('condition-output');
        if (output) {
            output.textContent = conditionText || 'No conditions defined';
        }
    }

    collectConditions(type) {
        const container = document.getElementById(`${type}-conditions`);
        if (!container) return [];
        
        const conditions = [];
        
        container.querySelectorAll('.condition-item').forEach(item => {
            const field = item.querySelector('.condition-field').value;
            const operator = item.querySelector('.condition-operator').value;
            const value = item.querySelector('.condition-value').value;
            
            if (value.trim()) {
                let condition = `${field} ${operator} `;
                
                if (operator.includes('in')) {
                    condition += `[${value.split(',').map(v => `"${v.trim()}"`).join(', ')}]`;
                } else {
                    condition += `"${value}"`;
                }
                
                conditions.push(condition);
            }
        });
        
        return conditions;
    }

    applyConditionTemplate(template) {
        console.log(`📋 Applying condition template: ${template}`);
        const templates = {
            'main-branch': {
                type: 'if',
                field: 'build.branch',
                operator: '==',
                value: 'main'
            },
            'pull-request': {
                type: 'if',
                field: 'build.pull_request',
                operator: '!=',
                value: 'null'
            },
            'file-changes': {
                type: 'if',
                field: 'build.env("CHANGED_FILES")',
                operator: '=~',
                value: '.*\\.(js|ts)$'
            },
            'env-var': {
                type: 'if',
                field: 'build.env("DEPLOY_ENV")',
                operator: '==',
                value: 'production'
            }
        };
        
        const templateConfig = templates[template];
        if (templateConfig) {
            this.addCondition(templateConfig.type);
            
            // Set the values in the last added condition
            const container = document.getElementById(`${templateConfig.type}-conditions`);
            const lastCondition = container.lastElementChild;
            
            if (lastCondition) {
                lastCondition.querySelector('.condition-field').value = templateConfig.field;
                lastCondition.querySelector('.condition-operator').value = templateConfig.operator;
                lastCondition.querySelector('.condition-value').value = templateConfig.value;
                
                this.updateConditionPreview();
            }
        }
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

    // Dependency Manager Methods
    showDependencyManager() {
        console.log('🔗 Opening dependency manager...');
        const modal = document.getElementById('dependency-manager-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.setupDependencyTabs();
            this.loadStepDependencies();
        } else {
            console.error('❌ Dependency manager modal not found');
        }
    }

    setupDependencyTabs() {
        const buttons = document.querySelectorAll('.dependency-type-btn');
        const sections = document.querySelectorAll('.dependency-section');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and sections
                buttons.forEach(b => b.classList.remove('active'));
                sections.forEach(s => s.style.display = 'none');
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Show corresponding section
                const type = button.dataset.type;
                const section = document.getElementById(`${type}-dependencies`);
                if (section) {
                    section.style.display = 'block';
                }
            });
        });
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
            step.properties.depends_on = dependencies.length > 0 ? dependencies : undefined;
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