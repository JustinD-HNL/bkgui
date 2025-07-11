// js/pipeline-visualizer.js
// Enhanced Pipeline Visualization for Buildkite Pipeline Builder

class PipelineVisualizer {
    constructor() {
        // Singleton pattern to prevent duplicate instances
        if (window.pipelineVisualizer) {
            console.warn('⚠️ PipelineVisualizer already exists, returning existing instance');
            return window.pipelineVisualizer;
        }
        this.pipelineBuilder = null;
        this.currentView = 'visual';
        this.canvas = null;
        this.ctx = null;
        
        // Store as singleton
        window.pipelineVisualizer = this;
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Pipeline Visualizer...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
        
        console.log('✅ Pipeline Visualizer initialized');
    }

    setupEventListeners() {
        // Tab switching in preview modal
        document.querySelectorAll('#pipeline-preview-modal .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Listen for pipeline preview button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="pipeline-preview"]')) {
                this.showPreview();
            }
        });

        // Close modal handlers
        const modal = document.getElementById('pipeline-preview-modal');
        if (modal) {
            // Close button
            const closeBtn = modal.querySelector('.close-modal');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            // Click outside modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    switchTab(tabName) {
        this.currentView = tabName;
        
        // Update tab buttons
        document.querySelectorAll('#pipeline-preview-modal .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('#pipeline-preview-modal .preview-tab').forEach(content => {
            content.style.display = 'none';
        });

        const activeTab = document.getElementById(`${tabName}-preview`) || 
                         document.getElementById(`${tabName}-preview-tab`);
        
        console.log(`🔍 Switching to tab: ${tabName}, found element:`, activeTab ? activeTab.id : 'not found');
        
        if (activeTab) {
            activeTab.style.display = 'block';
            
            // Show loading state for YAML tab
            if (tabName === 'yaml') {
                const yamlContent = document.getElementById('preview-yaml-content');
                if (yamlContent) {
                    yamlContent.textContent = 'Loading YAML...';
                    console.log('📝 Set YAML loading state');
                }
            }
        } else {
            console.error(`❌ Tab content not found for: ${tabName}`);
        }

        // Render content based on tab
        if (tabName === 'visual') {
            this.renderVisualView();
        } else if (tabName === 'yaml') {
            // Small delay to ensure tab is visible before rendering
            setTimeout(() => {
                this.renderYAMLView();
            }, 50);
        } else if (tabName === 'timeline') {
            this.renderTimelineView();
        }
    }

    showPreview() {
        if (!window.pipelineBuilder) {
            console.error('Pipeline builder not available');
            return;
        }

        this.pipelineBuilder = window.pipelineBuilder;
        
        console.log('📊 Opening pipeline preview:', {
            pipelineBuilder: !!this.pipelineBuilder,
            yamlGenerator: !!window.yamlGenerator,
            steps: this.pipelineBuilder?.steps?.length || 0,
            currentView: this.currentView
        });
        
        // Show modal
        const modal = document.getElementById('pipeline-preview-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // Render current view
        this.switchTab(this.currentView);
    }

    renderVisualView() {
        const container = document.querySelector('.pipeline-visualization');
        if (!container || !this.pipelineBuilder) return;

        container.innerHTML = '';

        // Create visual representation of pipeline
        const pipeline = document.createElement('div');
        pipeline.className = 'visual-pipeline';

        // Group steps by parallel groups
        const stepGroups = this.groupStepsByParallel();

        stepGroups.forEach((group, groupIndex) => {
            const groupEl = document.createElement('div');
            groupEl.className = 'visual-group';
            
            if (group.type === 'parallel') {
                groupEl.classList.add('parallel-group');
                const label = document.createElement('div');
                label.className = 'group-label';
                label.innerHTML = `<i class="fas fa-columns"></i> Parallel Group: ${group.name || groupIndex}`;
                groupEl.appendChild(label);
            }

            const stepsContainer = document.createElement('div');
            stepsContainer.className = group.type === 'parallel' ? 'parallel-steps' : 'sequential-steps';

            group.steps.forEach(step => {
                const stepEl = this.createVisualStep(step);
                stepsContainer.appendChild(stepEl);
            });

            groupEl.appendChild(stepsContainer);
            pipeline.appendChild(groupEl);

            // Add connector between groups
            if (groupIndex < stepGroups.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'group-connector';
                connector.innerHTML = '<i class="fas fa-arrow-down"></i>';
                pipeline.appendChild(connector);
            }
        });

        container.appendChild(pipeline);
    }

    groupStepsByParallel() {
        const groups = [];
        let currentGroup = null;

        this.pipelineBuilder.steps.forEach(step => {
            if (step.properties?.parallelGroup) {
                // Find or create parallel group
                let parallelGroup = groups.find(g => 
                    g.type === 'parallel' && g.name === step.properties.parallelGroup
                );
                
                if (!parallelGroup) {
                    if (currentGroup && currentGroup.type === 'sequential' && currentGroup.steps.length === 0) {
                        groups.pop(); // Remove empty sequential group
                    }
                    parallelGroup = {
                        type: 'parallel',
                        name: step.properties.parallelGroup,
                        steps: []
                    };
                    groups.push(parallelGroup);
                    currentGroup = null;
                }
                
                parallelGroup.steps.push(step);
            } else {
                // Sequential step
                if (!currentGroup || currentGroup.type === 'parallel') {
                    currentGroup = {
                        type: 'sequential',
                        steps: []
                    };
                    groups.push(currentGroup);
                }
                currentGroup.steps.push(step);
            }
        });

        return groups;
    }

    createVisualStep(step) {
        const stepEl = document.createElement('div');
        stepEl.className = `visual-step ${step.type}-step`;
        
        const icon = this.getStepIcon(step.type);
        const label = step.properties?.label || step.type;
        
        stepEl.innerHTML = `
            <div class="step-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="step-info">
                <div class="step-label">${label}</div>
                ${step.properties?.key ? `<div class="step-key">${step.properties.key}</div>` : ''}
            </div>
        `;

        // Add dependencies indicator
        if (step.properties?.depends_on) {
            const deps = Array.isArray(step.properties.depends_on) ? 
                step.properties.depends_on : [step.properties.depends_on];
            
            const depsEl = document.createElement('div');
            depsEl.className = 'step-dependencies';
            depsEl.innerHTML = `<i class="fas fa-link"></i> Depends on: ${deps.join(', ')}`;
            stepEl.appendChild(depsEl);
        }

        // Add condition indicator
        if (step.properties?.if || step.properties?.branches) {
            const condEl = document.createElement('div');
            condEl.className = 'step-condition';
            condEl.innerHTML = `<i class="fas fa-code-branch"></i> Conditional`;
            stepEl.appendChild(condEl);
        }

        return stepEl;
    }

    getStepIcon(type) {
        const icons = {
            command: 'fa-terminal',
            block: 'fa-hand-paper',
            input: 'fa-keyboard',
            trigger: 'fa-bolt',
            group: 'fa-object-group',
            wait: 'fa-pause-circle'
        };
        return icons[type] || 'fa-cube';
    }

    renderYAMLView() {
        const container = document.getElementById('preview-yaml-content');
        if (!container) {
            console.error('YAML preview container not found');
            return;
        }

        console.log('🔍 Debug YAML rendering:', {
            yamlGenerator: !!window.yamlGenerator,
            YAMLGeneratorClass: !!window.YAMLGenerator,
            pipelineBuilder: !!this.pipelineBuilder,
            steps: this.pipelineBuilder?.steps?.length || 0
        });

        // Check if we need to instantiate YAMLGenerator
        if (!window.yamlGenerator && window.YAMLGenerator) {
            console.log('📝 Creating YAMLGenerator instance...');
            window.yamlGenerator = new window.YAMLGenerator();
        }

        if (!window.yamlGenerator) {
            console.error('YAML generator not available');
            container.textContent = 'Error: YAML generator not loaded';
            return;
        }

        if (!this.pipelineBuilder || !this.pipelineBuilder.steps) {
            console.error('Pipeline builder or steps not available');
            container.textContent = 'Error: No pipeline steps to display';
            return;
        }

        try {
            console.log('🎯 Attempting to generate YAML with steps:', this.pipelineBuilder.steps);
            
            let yaml;
            
            // Check if we have the full YAMLGenerator class or the minimal version
            if (window.yamlGenerator.constructor && window.yamlGenerator.constructor.name === 'YAMLGenerator') {
                // Using the full YAMLGenerator class
                console.log('Using YAMLGenerator class with generate() method');
                yaml = window.yamlGenerator.generate({ steps: this.pipelineBuilder.steps });
            } else if (typeof window.yamlGenerator.generateYAML === 'function') {
                // Using the minimal yamlGenerator from main-init.js
                console.log('Using minimal yamlGenerator with generateYAML() method');
                yaml = window.yamlGenerator.generateYAML(this.pipelineBuilder.steps);
            } else if (typeof window.yamlGenerator.generate === 'function') {
                // Fallback to generate method
                console.log('Using generate() method');
                yaml = window.yamlGenerator.generate({ steps: this.pipelineBuilder.steps });
            } else {
                console.error('Available methods:', Object.getOwnPropertyNames(window.yamlGenerator));
                console.error('Constructor:', window.yamlGenerator.constructor?.name);
                throw new Error('No valid YAML generation method found');
            }

            console.log('📄 Generated YAML:', yaml ? `${yaml.substring(0, 100)}...` : 'null/empty');

            if (!yaml) {
                container.textContent = 'No YAML content generated';
                return;
            }

            container.textContent = yaml;

            // Apply syntax highlighting if available
            if (window.Prism && window.Prism.languages.yaml) {
                container.innerHTML = window.Prism.highlight(yaml, window.Prism.languages.yaml, 'yaml');
            }
        } catch (error) {
            console.error('Error generating YAML:', error);
            container.textContent = `Error generating YAML: ${error.message}`;
        }
    }

    renderTimelineView() {
        const container = document.querySelector('.timeline-visualization');
        if (!container || !this.pipelineBuilder) return;

        container.innerHTML = '';

        // Create timeline visualization
        const timeline = document.createElement('div');
        timeline.className = 'pipeline-timeline';

        // Calculate estimated times
        const timelineData = this.calculateTimeline();

        // Create time scale
        const timeScale = document.createElement('div');
        timeScale.className = 'time-scale';
        const maxTime = Math.max(...timelineData.map(d => d.endTime));
        
        for (let i = 0; i <= maxTime; i += 5) {
            const marker = document.createElement('div');
            marker.className = 'time-marker';
            marker.style.left = `${(i / maxTime) * 100}%`;
            marker.innerHTML = `<span>${i}m</span>`;
            timeScale.appendChild(marker);
        }
        timeline.appendChild(timeScale);

        // Create timeline bars
        timelineData.forEach(data => {
            const bar = document.createElement('div');
            bar.className = 'timeline-bar';
            bar.style.left = `${(data.startTime / maxTime) * 100}%`;
            bar.style.width = `${((data.endTime - data.startTime) / maxTime) * 100}%`;
            
            const label = document.createElement('div');
            label.className = 'timeline-label';
            label.textContent = data.label;
            bar.appendChild(label);
            
            const duration = document.createElement('div');
            duration.className = 'timeline-duration';
            duration.textContent = `${data.endTime - data.startTime}m`;
            bar.appendChild(duration);
            
            timeline.appendChild(bar);
        });

        container.appendChild(timeline);
    }

    calculateTimeline() {
        const timeline = [];
        let currentTime = 0;

        // Group steps by execution order
        const executionGroups = this.calculateExecutionOrder();

        executionGroups.forEach(group => {
            const groupStartTime = currentTime;
            let maxDuration = 0;

            group.forEach(step => {
                // Estimate duration based on step type
                const duration = this.estimateStepDuration(step);
                
                timeline.push({
                    step: step,
                    label: step.properties?.label || step.type,
                    startTime: groupStartTime,
                    endTime: groupStartTime + duration
                });

                maxDuration = Math.max(maxDuration, duration);
            });

            currentTime = groupStartTime + maxDuration;
        });

        return timeline;
    }

    calculateExecutionOrder() {
        const groups = [];
        const processed = new Set();

        // Helper function to get step dependencies
        const getDependencies = (step) => {
            if (!step.properties?.depends_on) return [];
            return Array.isArray(step.properties.depends_on) ? 
                step.properties.depends_on : [step.properties.depends_on];
        };

        // Build dependency map
        const dependencyMap = new Map();
        this.pipelineBuilder.steps.forEach(step => {
            const key = step.properties?.key || step.id;
            dependencyMap.set(key, getDependencies(step));
        });

        // Topological sort
        while (processed.size < this.pipelineBuilder.steps.length) {
            const currentGroup = [];

            this.pipelineBuilder.steps.forEach(step => {
                const key = step.properties?.key || step.id;
                if (processed.has(key)) return;

                const deps = getDependencies(step);
                const allDepsProcessed = deps.every(dep => processed.has(dep));

                if (allDepsProcessed) {
                    currentGroup.push(step);
                }
            });

            if (currentGroup.length === 0) {
                // Circular dependency or error
                break;
            }

            currentGroup.forEach(step => {
                processed.add(step.properties?.key || step.id);
            });

            groups.push(currentGroup);
        }

        return groups;
    }

    estimateStepDuration(step) {
        // Basic estimation based on step type and properties
        const baseDurations = {
            command: 5,
            block: 1,
            wait: 1,
            input: 1,
            trigger: 2,
            group: 10
        };

        let duration = baseDurations[step.type] || 5;

        // Adjust based on parallelism
        if (step.properties?.parallelism > 1) {
            duration = duration / 2; // Assume parallel execution is faster
        }

        // Adjust based on retry
        if (step.properties?.retry) {
            duration = duration * 1.5; // Account for potential retries
        }

        return duration;
    }
}

// Initialize when DOM is ready
if (!window.pipelineVisualizer) {
    window.pipelineVisualizer = new PipelineVisualizer();
}