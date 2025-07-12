// js/pipeline-patterns.js
// Pipeline patterns and templates functionality

class PipelinePatterns {
    constructor() {
        this.patterns = {
            'ci-cd-basic': {
                name: 'Basic CI/CD Pipeline',
                description: 'Standard continuous integration and deployment workflow',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '📦 Install Dependencies',
                            command: 'npm ci',
                            key: 'install'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🧪 Run Tests',
                            command: 'npm test',
                            key: 'test',
                            depends_on: ['install']
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🔨 Build Application',
                            command: 'npm run build',
                            key: 'build',
                            depends_on: ['test']
                        }
                    },
                    {
                        type: 'wait',
                        properties: {
                            label: 'Wait for approval'
                        }
                    },
                    {
                        type: 'block',
                        properties: {
                            label: 'Deploy to Production',
                            block: ':rocket: Deploy to Production',
                            fields: [
                                {
                                    key: 'deploy_confirm',
                                    text: 'Type DEPLOY to confirm',
                                    required: true
                                }
                            ]
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🚀 Deploy',
                            command: 'npm run deploy:production',
                            key: 'deploy'
                        }
                    }
                ]
            },
            'microservices': {
                name: 'Microservices Pipeline',
                description: 'Build and test multiple services in parallel',
                steps: [
                    {
                        type: 'group',
                        properties: {
                            label: 'Build Services',
                            group: 'Services',
                            key: 'services_group',
                            steps: [
                                {
                                    type: 'command',
                                    properties: {
                                        label: '🔨 Build Service A',
                                        command: 'cd services/a && npm run build',
                                        key: 'build_service_a'
                                    }
                                },
                                {
                                    type: 'command',
                                    properties: {
                                        label: '🔨 Build Service B',
                                        command: 'cd services/b && npm run build',
                                        key: 'build_service_b'
                                    }
                                },
                                {
                                    type: 'command',
                                    properties: {
                                        label: '🔨 Build Service C',
                                        command: 'cd services/c && npm run build',
                                        key: 'build_service_c'
                                    }
                                }
                            ]
                        }
                    },
                    {
                        type: 'wait',
                        properties: {
                            label: 'Wait for all services'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🧪 Integration Tests',
                            command: 'npm run test:integration',
                            key: 'integration_tests'
                        }
                    }
                ]
            },
            'matrix-testing': {
                name: 'Matrix Testing Pipeline',
                description: 'Test across multiple environments and versions',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '🧪 Matrix Tests',
                            command: 'npm test',
                            key: 'matrix_test',
                            matrix: {
                                setup: {
                                    os: ['ubuntu-latest', 'windows-latest', 'macos-latest'],
                                    node: ['16', '18', '20'],
                                    database: ['postgres', 'mysql', 'mongodb']
                                },
                                adjustments: [
                                    {
                                        with: {
                                            os: 'windows-latest',
                                            node: '16'
                                        },
                                        soft_fail: true
                                    }
                                ]
                            }
                        }
                    },
                    {
                        type: 'wait',
                        properties: {
                            label: 'Wait for matrix completion'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '📊 Coverage Report',
                            command: 'npm run coverage:report',
                            key: 'coverage'
                        }
                    }
                ]
            }
        };
    }

    getPattern(patternKey) {
        return this.patterns[patternKey];
    }

    getAllPatterns() {
        return Object.entries(this.patterns).map(([key, pattern]) => ({
            key,
            name: pattern.name,
            description: pattern.description,
            stepCount: pattern.steps.length
        }));
    }

    applyPattern(patternKey, pipelineBuilder) {
        const pattern = this.patterns[patternKey];
        if (!pattern) {
            console.error('Pattern not found:', patternKey);
            return false;
        }

        try {
            // Clear existing pipeline
            pipelineBuilder.steps = [];
            pipelineBuilder.stepCounter = 0;

            // Add pattern steps
            pattern.steps.forEach(stepData => {
                const step = {
                    id: `step-${++pipelineBuilder.stepCounter}`,
                    type: stepData.type,
                    properties: JSON.parse(JSON.stringify(stepData.properties))
                };
                pipelineBuilder.steps.push(step);
            });

            // Refresh UI
            pipelineBuilder.renderPipeline();
            pipelineBuilder.updateStepCount();

            console.log(`✅ Applied pattern: ${pattern.name}`);
            return true;
        } catch (error) {
            console.error('Error applying pattern:', error);
            return false;
        }
    }
}

// Export to global scope
window.PipelinePatterns = PipelinePatterns;