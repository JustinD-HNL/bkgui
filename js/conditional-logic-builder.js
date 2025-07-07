// js/conditional-logic-builder.js
// Visual Conditional Logic Builder for Buildkite Pipeline Builder
/**
 * Provides a visual interface for building conditional expressions
 */

class ConditionalLogicBuilder {
    constructor() {
        this.currentStep = null;
        this.conditions = [];
        this.conditionType = 'if';
        this.modal = null;
        this.operators = {
            '==': 'equals',
            '!=': 'not equals',
            '=~': 'matches regex',
            '!~': 'does not match regex',
            '<': 'less than',
            '>': 'greater than',
            '<=': 'less than or equal',
            '>=': 'greater than or equal'
        };
        this.logicalOperators = ['&&', '||'];
        this.buildkiteVariables = [
            'build.branch',
            'build.tag',
            'build.commit',
            'build.message',
            'build.pull_request.id',
            'build.pull_request.base_branch',
            'build.source',
            'build.creator.name',
            'build.creator.email',
            'build.number',
            'pipeline.slug',
            'organization.slug',
            'agent.meta_data.*'
        ];
        this.init();
    }

    init() {
        console.log('🔀 Initializing Conditional Logic Builder...');
        
        this.modal = document.getElementById('conditional-logic-modal');
        if (!this.modal) {
            console.warn('⚠️ Conditional logic modal not found');
            return;
        }
        
        this.setupEventListeners();
        console.log('✅ Conditional Logic Builder initialized');
    }

    setupEventListeners() {
        // Condition type selector
        const typeSelect = document.getElementById('condition-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.conditionType = e.target.value;
                this.updatePreview();
            });
        }
        
        // Preset buttons
        this.modal.querySelectorAll('.condition-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const condition = e.target.dataset.condition;
                this.applyPreset(condition);
            });
        });
        
        // Add condition button
        const addConditionBtn = document.getElementById('add-condition-group');
        if (addConditionBtn) {
            addConditionBtn.addEventListener('click', () => this.addCondition());
        }
        
        // Apply button
        const applyBtn = document.getElementById('apply-condition');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyCondition());
        }
        
        // Close handlers
        this.modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeModal();
            });
        });
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });
    }

    openForStep(step) {
        console.log('🔀 Opening conditional logic builder for step:', step.id);
        
        this.currentStep = step;
        this.conditions = [];
        
        // Load existing condition if present
        if (step.properties.if) {
            this.conditionType = 'if';
            this.parseExistingCondition(step.properties.if);
        } else if (step.properties.unless) {
            this.conditionType = 'unless';
            this.parseExistingCondition(step.properties.unless);
        } else {
            // Start with one empty condition
            this.addCondition();
        }
        
        // Update UI
        document.getElementById('condition-type').value = this.conditionType;
        this.renderConditions();
        this.updatePreview();
        
        this.modal.style.display = 'block';
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.classList.add('hidden');
        }
        this.currentStep = null;
        this.conditions = [];
    }

    addCondition(variable = '', operator = '==', value = '', logicalOp = '&&') {
        this.conditions.push({
            id: `cond-${Date.now()}`,
            variable: variable,
            operator: operator,
            value: value,
            logicalOperator: logicalOp
        });
        this.renderConditions();
        this.updatePreview();
    }

    removeCondition(id) {
        this.conditions = this.conditions.filter(c => c.id !== id);
        if (this.conditions.length === 0) {
            this.addCondition();
        }
        this.renderConditions();
        this.updatePreview();
    }

    updateCondition(id, field, value) {
        const condition = this.conditions.find(c => c.id === id);
        if (condition) {
            condition[field] = value;
            this.updatePreview();
        }
    }

    renderConditions() {
        const container = document.getElementById('condition-builder-content');
        if (!container) return;
        
        container.innerHTML = this.conditions.map((condition, index) => `
            <div class="condition-group" data-condition-id="${condition.id}">
                ${index > 0 ? `
                    <select class="logical-operator" 
                            onchange="window.conditionalLogicBuilder.updateCondition('${condition.id}', 'logicalOperator', this.value)">
                        ${this.logicalOperators.map(op => `
                            <option value="${op}" ${condition.logicalOperator === op ? 'selected' : ''}>
                                ${op === '&&' ? 'AND' : 'OR'}
                            </option>
                        `).join('')}
                    </select>
                ` : ''}
                
                <div class="condition-row">
                    <input type="text" 
                           class="condition-variable" 
                           list="buildkite-variables"
                           value="${condition.variable}" 
                           placeholder="Variable (e.g., build.branch)"
                           onchange="window.conditionalLogicBuilder.updateCondition('${condition.id}', 'variable', this.value)">
                    
                    <select class="condition-operator" 
                            onchange="window.conditionalLogicBuilder.updateCondition('${condition.id}', 'operator', this.value)">
                        ${Object.entries(this.operators).map(([op, label]) => `
                            <option value="${op}" ${condition.operator === op ? 'selected' : ''}>
                                ${label}
                            </option>
                        `).join('')}
                    </select>
                    
                    <input type="text" 
                           class="condition-value" 
                           value="${condition.value}" 
                           placeholder="Value"
                           onchange="window.conditionalLogicBuilder.updateCondition('${condition.id}', 'value', this.value)">
                    
                    <button class="btn btn-small btn-danger" 
                            onclick="window.conditionalLogicBuilder.removeCondition('${condition.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add datalist for variable suggestions
        if (!document.getElementById('buildkite-variables')) {
            const datalist = document.createElement('datalist');
            datalist.id = 'buildkite-variables';
            datalist.innerHTML = this.buildkiteVariables.map(v => 
                `<option value="${v}">`
            ).join('');
            document.body.appendChild(datalist);
        }
    }

    updatePreview() {
        const preview = document.getElementById('condition-preview-text');
        if (!preview) return;
        
        const conditionStr = this.buildConditionString();
        preview.textContent = conditionStr || '(no conditions defined)';
    }

    buildConditionString() {
        if (this.conditions.length === 0) return '';
        
        const validConditions = this.conditions.filter(c => 
            c.variable && c.value
        );
        
        if (validConditions.length === 0) return '';
        
        let result = validConditions.map((condition, index) => {
            let expr = '';
            
            // Add logical operator for subsequent conditions
            if (index > 0) {
                expr += ` ${condition.logicalOperator} `;
            }
            
            // Build the condition expression
            const variable = condition.variable;
            const value = this.formatValue(condition.value, condition.operator);
            
            expr += `${variable} ${condition.operator} ${value}`;
            
            return expr;
        }).join('');
        
        // Wrap in parentheses if multiple conditions
        if (validConditions.length > 1) {
            result = `(${result})`;
        }
        
        return result;
    }

    formatValue(value, operator) {
        // For regex operators, don't quote
        if (operator === '=~' || operator === '!~') {
            return value;
        }
        
        // For numeric comparisons, try to parse as number
        if (['<', '>', '<=', '>='].includes(operator)) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                return num.toString();
            }
        }
        
        // For null/true/false, don't quote
        if (value === 'null' || value === 'true' || value === 'false') {
            return value;
        }
        
        // Otherwise, quote the string
        return `"${value}"`;
    }

    applyPreset(conditionString) {
        // Clear existing conditions
        this.conditions = [];
        
        // Parse the preset condition
        this.parseExistingCondition(conditionString);
        
        this.renderConditions();
        this.updatePreview();
    }

    parseExistingCondition(conditionString) {
        // Simple parser for common patterns
        // This is a simplified version - could be enhanced for complex conditions
        
        const patterns = [
            // Simple comparison: variable == "value"
            /^(\S+)\s*(==|!=|=~|!~|<|>|<=|>=)\s*(.+)$/,
            // With parentheses: (variable == "value")
            /^\((\S+)\s*(==|!=|=~|!~|<|>|<=|>=)\s*(.+)\)$/
        ];
        
        for (const pattern of patterns) {
            const match = conditionString.match(pattern);
            if (match) {
                const [, variable, operator, value] = match;
                this.addCondition(
                    variable.trim(),
                    operator.trim(),
                    value.trim().replace(/^["']|["']$/g, ''), // Remove quotes
                    '&&'
                );
                return;
            }
        }
        
        // If we can't parse it, add it as a raw condition
        console.warn('Could not parse condition:', conditionString);
    }

    applyCondition() {
        if (!this.currentStep) return;
        
        const conditionStr = this.buildConditionString();
        
        // Clear both if/unless
        delete this.currentStep.properties.if;
        delete this.currentStep.properties.unless;
        
        // Apply the new condition
        if (conditionStr) {
            this.currentStep.properties[this.conditionType] = conditionStr;
            console.log(`✅ Applied ${this.conditionType} condition:`, conditionStr);
        } else {
            console.log('✅ Removed conditions from step');
        }
        
        // Update pipeline
        if (window.pipelineBuilder) {
            window.pipelineBuilder.renderPipeline();
            window.pipelineBuilder.renderProperties();
        }
        
        // Show notification
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification(
                conditionStr 
                    ? `Condition applied: ${this.conditionType} ${conditionStr}`
                    : 'Conditions removed',
                'success'
            );
        }
        
        this.closeModal();
    }

    // Helper to get condition summary for display
    getConditionSummary(step) {
        if (step.properties.if) {
            return { type: 'if', condition: step.properties.if };
        } else if (step.properties.unless) {
            return { type: 'unless', condition: step.properties.unless };
        }
        return null;
    }
}

// Export the class
window.ConditionalLogicBuilder = ConditionalLogicBuilder;

// Initialize and export instance
window.conditionalLogicBuilder = new ConditionalLogicBuilder();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConditionalLogicBuilder;
}