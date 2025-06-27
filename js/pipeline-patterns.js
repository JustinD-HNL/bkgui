// js/pipeline-patterns.js
/**
 * Pipeline Patterns for Common Buildkite Workflows
 * Provides pre-built patterns for common CI/CD scenarios
 */

class PipelinePatterns {
    constructor() {
        this.patterns = this.initializePatterns();
    }

    initializePatterns() {
        return {
            'ci-cd-basic': {
                name: 'Basic CI/CD',
                description: 'Standard test, build, and deploy workflow',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Install Dependencies',
                            command: 'npm install',
                            key: 'install'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Run Tests',
                            command: 'npm test',
                            key: 'test',
                            depends_on: ['install']
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Application',
                            command: 'npm run build',
                            key: 'build',
                            depends_on: ['test']
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'block',
                        properties: {
                            label: 'Deploy to Production',
                            prompt: 'Ready to deploy to production?',
                            key: 'deploy-gate'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy',
                            command: 'npm run deploy',
                            key: 'deploy',
                            depends_on: ['deploy-gate']
                        }
                    }
                ]
            },
            
            'docker-workflow': {
                name: 'Docker Workflow',
                description: 'Build and deploy Docker containers',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Docker Image',
                            command: 'docker build -t my-app:${BUILDKITE_COMMIT} .',
                            key: 'docker-build'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Run Tests in Container',
                            command: 'docker run --rm my-app:${BUILDKITE_COMMIT} npm test',
                            key: 'docker-test',
                            depends_on: ['docker-build']
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Security Scan',
                            command: 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy my-app:${BUILDKITE_COMMIT}',
                            key: 'security-scan',
                            depends_on: ['docker-build']
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Push to Registry',
                            command: 'docker push my-app:${BUILDKITE_COMMIT}',
                            key: 'docker-push',
                            if: 'build.branch == "main"'
                        }
                    }
                ]
            },
            
            'microservices': {
                name: 'Microservices',
                description: 'Build and test multiple services in parallel',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Service A',
                            command: 'cd service-a && npm install && npm run build',
                            key: 'service-a-build'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Service B',
                            command: 'cd service-b && npm install && npm run build',
                            key: 'service-b-build'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Service C',
                            command: 'cd service-c && npm install && npm run build',
                            key: 'service-c-build'
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Integration Tests',
                            command: 'npm run test:integration',
                            key: 'integration-test',
                            depends_on: ['service-a-build', 'service-b-build', 'service-c-build']
                        }
                    }
                ]
            },
            
            'matrix-testing': {
                name: 'Matrix Testing',
                description: 'Test across multiple environments and versions',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Test Node ${NODE_VERSION} on ${OS}',
                            command: 'npm test',
                            key: 'matrix-test',
                            matrix: {
                                setup: {
                                    NODE_VERSION: ['16', '18', '20'],
                                    OS: ['ubuntu', 'windows', 'macos']
                                }
                            }
                        }
                    },
                    {
                        type: 'wait'
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Collect Test Results',
                            command: 'npm run test:report',
                            key: 'test-report'
                        }
                    }
                ]
            },
            
            'staged-deployment': {
                name: 'Staged Deployment',
                description: 'Deploy through multiple environments with approvals',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: 'Build Application',
                            command: 'npm run build',
                            key: 'build'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy to Staging',
                            command: 'npm run deploy:staging',
                            key: 'deploy-staging',
                            depends_on: ['build']
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Run Smoke Tests',
                            command: 'npm run test:smoke',
                            key: 'smoke-test',
                            depends_on: ['deploy-staging']
                        }
                    },
                    {
                        type: 'block',
                        properties: {
                            label: 'Approve Production Deploy',
                            prompt: 'Staging tests passed. Deploy to production?',
                            key: 'prod-approval'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Deploy to Production',
                            command: 'npm run deploy:production',
                            key: 'deploy-production',
                            depends_on: ['prod-approval']
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: 'Post-Deploy Verification',
                            command: 'npm run verify:production',
                            key: 'verify-production',
                            depends_on: ['deploy-production']
                        }
                    }
                ]
            }
        };
    }

    applyPattern(patternKey) {
        console.log(`Applying pattern: ${patternKey}`);
        
        const pattern = this.patterns[patternKey];
        if (!pattern) {
            console.error(`Pattern not found: ${patternKey}`);
            alert(`Pattern "${patternKey}" not found!`);
            return;
        }

        if (!window.pipelineBuilder) {
            console.error('Pipeline builder not available');
            alert('Pipeline builder not available!');
            return;
        }

        // Clear existing steps
        const shouldClear = window.pipelineBuilder.steps.length === 0 || 
                           confirm('This will replace your current pipeline. Continue?');
        
        if (!shouldClear) {
            return;
        }

        // Clear current pipeline
        window.pipelineBuilder.steps = [];

        // Add pattern steps
        pattern.steps.forEach(stepTemplate => {
            const step = window.pipelineBuilder.createStep(stepTemplate.type);
            
            // Copy all properties from template
            Object.assign(step.properties, stepTemplate.properties);
            
            window.pipelineBuilder.steps.push(step);
        });

        // Re-render pipeline
        window.pipelineBuilder.renderPipeline();
        
        console.log(`✅ Applied pattern: ${pattern.name}`);
        alert(`Applied pattern: ${pattern.name}\n\n${pattern.description}`);
    }

    getPatternDescription(patternKey) {
        const pattern = this.patterns[patternKey];
        return pattern ? pattern.description : 'Pattern not found';
    }

    listPatterns() {
        return Object.keys(this.patterns).map(key => ({
            key,
            name: this.patterns[key].name,
            description: this.patterns[key].description
        }));
    }
}

// Export to global scope
window.PipelinePatterns = PipelinePatterns;