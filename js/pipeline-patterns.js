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
            },
            'microservice-cicd': {
                name: 'Microservice CI/CD',
                description: 'Complete microservice pipeline with testing, building, and deployment',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '🧪 Test',
                            command: 'make test',
                            key: 'test'
                        }
                    },
                    {
                        type: 'wait',
                        properties: {}
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🐳 Build & Push',
                            key: 'docker-build',
                            plugins: {
                                'docker#v3.8.0': {
                                    image: 'myapp',
                                    push: true
                                }
                            }
                        }
                    },
                    {
                        type: 'wait',
                        properties: {}
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '☸️ Deploy',
                            command: 'kubectl apply -f k8s/',
                            key: 'deploy'
                        }
                    }
                ]
            },
            'service-mesh': {
                name: 'Service Mesh Deploy',
                description: 'Deploy microservices with Istio/Linkerd integration',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '🔗 Service Mesh Config',
                            command: 'istioctl analyze\nkubectl apply -f istio/',
                            key: 'istio-config'
                        }
                    }
                ]
            },
            'monorepo-pipeline': {
                name: 'Monorepo Pipeline',
                description: 'Build only changed packages in a monorepo',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '📦 Detect Changes',
                            command: './scripts/detect-changes.sh',
                            key: 'detect-changes'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🔨 Build Changed',
                            command: 'lerna run build --since origin/main',
                            key: 'build-changed'
                        }
                    }
                ]
            },
            'selective-builds': {
                name: 'Selective Builds',
                description: 'Skip unchanged services',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '🔍 Check Changes',
                            command: 'git diff --name-only HEAD~1',
                            key: 'check-changes'
                        }
                    }
                ]
            },
            'ios-pipeline': {
                name: 'iOS App Pipeline',
                description: 'Build, test, and deploy iOS applications',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '📱 iOS Build',
                            command: 'xcodebuild -workspace App.xcworkspace -scheme App',
                            key: 'ios-build'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🧪 iOS Tests',
                            command: 'xcodebuild test -workspace App.xcworkspace -scheme AppTests',
                            key: 'ios-test'
                        }
                    }
                ]
            },
            'android-pipeline': {
                name: 'Android App Pipeline',
                description: 'Build and test Android applications',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '🤖 Android Build',
                            command: './gradlew assembleDebug',
                            key: 'android-build'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🧪 Android Tests',
                            command: './gradlew test',
                            key: 'android-test'
                        }
                    }
                ]
            },
            'ml-training': {
                name: 'ML Model Training',
                description: 'Train and validate machine learning models',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '📊 Prepare Data',
                            command: 'python scripts/prepare_data.py',
                            key: 'prepare-data'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🧠 Train Model',
                            command: 'python train.py --epochs 100',
                            key: 'train-model'
                        }
                    }
                ]
            },
            'ml-deployment': {
                name: 'ML Model Deployment',
                description: 'Deploy ML models to production',
                steps: [
                    {
                        type: 'command',
                        properties: {
                            label: '🔍 Validate Model',
                            command: 'python validate_model.py',
                            key: 'validate-model'
                        }
                    },
                    {
                        type: 'command',
                        properties: {
                            label: '🚀 Deploy Model',
                            command: 'python deploy_model.py --env production',
                            key: 'deploy-model'
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
            
            // Update YAML display
            if (pipelineBuilder.updateYAML) {
                pipelineBuilder.updateYAML();
            }
            
            // Save to local storage
            if (pipelineBuilder.saveToLocalStorage) {
                pipelineBuilder.saveToLocalStorage();
            }

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

// Initialize pattern library modal handlers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Handle pattern category buttons
    const categoryButtons = document.querySelectorAll('.pattern-cat');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get selected category
            const category = this.getAttribute('data-category');
            
            // Show/hide pattern sections based on category
            const sections = document.querySelectorAll('.pattern-section');
            sections.forEach(section => {
                const sectionCategory = section.getAttribute('data-category');
                if (category === 'all' || sectionCategory === category) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        });
    });
    
    // Handle "Use This Pattern" buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('use-pattern')) {
            const patternCard = e.target.closest('.pattern-card');
            const patternId = patternCard.getAttribute('data-pattern');
            
            // Get the pattern from the PipelinePatterns instance
            if (window.pipelinePatterns && window.pipelineBuilder) {
                const pattern = window.pipelinePatterns.patterns[patternId];
                if (pattern) {
                    // Apply the pattern with the pipelineBuilder instance
                    const success = window.pipelinePatterns.applyPattern(patternId, window.pipelineBuilder);
                    if (success) {
                        // Close the modal
                        window.closeModal('pattern-library-modal');
                        
                        // Show success message (optional)
                        console.log(`Applied pattern: ${pattern.name}`);
                    }
                } else {
                    console.warn(`Pattern not found: ${patternId}`);
                }
            } else {
                console.error('Pipeline builder or patterns not available');
            }
        }
    });
});