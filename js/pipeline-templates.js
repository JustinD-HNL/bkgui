// js/pipeline-templates.js
/**
 * Pipeline Templates - Complete configurations
 * FIXED: Templates now provide full pipeline configurations, not just single steps
 */

class PipelineTemplates {
    constructor() {
        this.templates = {
            'node-app': {
                name: 'Node.js Application',
                icon: 'fa-node-js',
                description: 'Complete CI/CD pipeline for Node.js applications with testing, building, and deployment',
                pipeline: {
                    steps: [
                        {
                            label: '📦 Install Dependencies',
                            key: 'install',
                            command: 'npm ci',
                            artifact_paths: 'node_modules/**/*',
                            agents: { queue: 'default' }
                        },
                        {
                            label: '🔍 Lint Code',
                            key: 'lint',
                            command: 'npm run lint',
                            depends_on: ['install'],
                            agents: { queue: 'default' }
                        },
                        {
                            label: '🧪 Run Tests',
                            key: 'test',
                            command: 'npm test -- --coverage',
                            artifact_paths: 'coverage/**/*',
                            depends_on: ['install'],
                            agents: { queue: 'default' },
                            plugins: {
                                'junit-annotate': {
                                    artifacts: 'test-results/*.xml'
                                }
                            }
                        },
                        'wait',
                        {
                            label: '🏗️ Build Application',
                            key: 'build',
                            command: 'npm run build',
                            artifact_paths: 'dist/**/*',
                            agents: { queue: 'default' }
                        },
                        {
                            block: '🚀 Deploy to Production',
                            key: 'deploy-gate',
                            prompt: 'Deploy this build to production?',
                            fields: [
                                {
                                    key: 'release-notes',
                                    text: 'Release Notes',
                                    required: false
                                }
                            ],
                            branches: 'main'
                        },
                        {
                            label: '🚀 Deploy to Production',
                            key: 'deploy',
                            command: `
                                echo "Deploying to production..."
                                npm run deploy:prod
                            `,
                            depends_on: ['build', 'deploy-gate'],
                            branches: 'main',
                            agents: { queue: 'deploy' }
                        }
                    ]
                }
            },
            
            'docker-microservice': {
                name: 'Docker Microservice',
                icon: 'fa-docker',
                description: 'Build, test, and deploy Docker-based microservices with multi-stage builds',
                pipeline: {
                    steps: [
                        {
                            label: '🧪 Run Unit Tests',
                            key: 'test',
                            command: 'docker-compose run --rm test',
                            agents: { docker: 'true' }
                        },
                        {
                            label: '🏗️ Build Docker Image',
                            key: 'build',
                            plugins: {
                                'docker-compose': {
                                    build: 'app',
                                    'image-name': 'myapp:${BUILDKITE_BUILD_NUMBER}'
                                }
                            },
                            agents: { docker: 'true' }
                        },
                        {
                            label: '🔒 Security Scan',
                            key: 'security',
                            command: 'trivy image myapp:${BUILDKITE_BUILD_NUMBER}',
                            soft_fail: true,
                            agents: { docker: 'true' }
                        },
                        'wait',
                        {
                            label: '📤 Push to Registry',
                            key: 'push',
                            plugins: {
                                'docker': {
                                    image: 'myapp:${BUILDKITE_BUILD_NUMBER}',
                                    tag: ['latest', '${BUILDKITE_BUILD_NUMBER}'],
                                    push: true
                                }
                            },
                            branches: 'main develop',
                            agents: { docker: 'true' }
                        },
                        {
                            trigger: 'deploy-pipeline',
                            label: '🚀 Trigger Deployment',
                            build: {
                                message: 'Deploy ${BUILDKITE_BUILD_NUMBER}',
                                env: {
                                    IMAGE_TAG: '${BUILDKITE_BUILD_NUMBER}'
                                }
                            },
                            branches: 'main'
                        }
                    ]
                }
            },
            
            'python-ml': {
                name: 'Python ML Pipeline',
                icon: 'fa-python',
                description: 'Machine learning pipeline with data validation, model training, and deployment',
                pipeline: {
                    steps: [
                        {
                            label: '📊 Validate Data',
                            key: 'validate-data',
                            command: `
                                python -m pip install -r requirements.txt
                                python scripts/validate_data.py
                            `,
                            artifact_paths: 'data/processed/**/*',
                            agents: { python: '3.9' }
                        },
                        {
                            label: '🧪 Run Tests',
                            key: 'test',
                            command: 'pytest tests/ --cov=src --cov-report=html',
                            artifact_paths: 'htmlcov/**/*',
                            agents: { python: '3.9' }
                        },
                        {
                            label: '🤖 Train Model',
                            key: 'train',
                            command: `
                                python scripts/train_model.py
                                python scripts/evaluate_model.py
                            `,
                            artifact_paths: [
                                'models/**/*',
                                'reports/**/*'
                            ].join(' '),
                            depends_on: ['validate-data', 'test'],
                            agents: { 
                                python: '3.9',
                                gpu: 'true'
                            },
                            timeout_in_minutes: 120
                        },
                        'wait',
                        {
                            block: '📈 Review Model Performance',
                            key: 'review',
                            prompt: 'Review the model metrics and approve for deployment',
                            fields: [
                                {
                                    key: 'accuracy-threshold',
                                    text: 'Minimum accuracy threshold',
                                    default: '0.95',
                                    required: true
                                }
                            ]
                        },
                        {
                            label: '🚀 Deploy Model',
                            key: 'deploy',
                            command: `
                                python scripts/deploy_model.py
                                python scripts/update_api.py
                            `,
                            depends_on: ['train', 'review'],
                            branches: 'main',
                            agents: { python: '3.9' }
                        }
                    ]
                }
            },
            
            'mobile-app': {
                name: 'Mobile App CI/CD',
                icon: 'fa-mobile-alt',
                description: 'Build and deploy iOS and Android apps with parallel builds',
                pipeline: {
                    steps: [
                        {
                            label: '📱 iOS Build',
                            key: 'ios-build',
                            command: `
                                bundle install
                                bundle exec fastlane ios build
                            `,
                            artifact_paths: 'build/ios/**/*.ipa',
                            agents: { 
                                queue: 'mac',
                                xcode: '14'
                            },
                            timeout_in_minutes: 45
                        },
                        {
                            label: '🤖 Android Build',
                            key: 'android-build',
                            command: `
                                ./gradlew clean assembleRelease
                                ./gradlew bundleRelease
                            `,
                            artifact_paths: [
                                'app/build/outputs/apk/**/*.apk',
                                'app/build/outputs/bundle/**/*.aab'
                            ].join(' '),
                            agents: { queue: 'android' },
                            timeout_in_minutes: 30
                        },
                        'wait',
                        {
                            label: '🧪 Run UI Tests',
                            key: 'ui-tests',
                            command: 'npm run test:e2e',
                            parallelism: 5,
                            retry: {
                                automatic: {
                                    exit_status: '*',
                                    limit: 2
                                }
                            },
                            agents: { queue: 'test-devices' }
                        },
                        {
                            block: '📲 Deploy to Stores',
                            key: 'deploy-gate',
                            prompt: 'Deploy to App Store and Play Store?',
                            branches: 'main release/*'
                        },
                        {
                            group: '🚀 Store Deployment',
                            key: 'deployment',
                            steps: [
                                {
                                    label: '🍎 Deploy to App Store',
                                    command: 'bundle exec fastlane ios deploy',
                                    depends_on: ['ios-build', 'ui-tests', 'deploy-gate'],
                                    agents: { queue: 'mac' }
                                },
                                {
                                    label: '🤖 Deploy to Play Store',
                                    command: 'bundle exec fastlane android deploy',
                                    depends_on: ['android-build', 'ui-tests', 'deploy-gate'],
                                    agents: { queue: 'android' }
                                }
                            ]
                        }
                    ]
                }
            },
            
            'terraform-infra': {
                name: 'Terraform Infrastructure',
                icon: 'fa-server',
                description: 'Infrastructure as Code pipeline with plan, review, and apply stages',
                pipeline: {
                    steps: [
                        {
                            label: '🔍 Terraform Format Check',
                            key: 'fmt-check',
                            command: 'terraform fmt -check -recursive',
                            agents: { terraform: 'latest' }
                        },
                        {
                            label: '✅ Terraform Validate',
                            key: 'validate',
                            command: `
                                terraform init -backend=false
                                terraform validate
                            `,
                            agents: { terraform: 'latest' }
                        },
                        {
                            label: '📋 Terraform Plan',
                            key: 'plan',
                            command: `
                                terraform init
                                terraform plan -out=tfplan
                            `,
                            artifact_paths: 'tfplan',
                            depends_on: ['fmt-check', 'validate'],
                            agents: { terraform: 'latest' },
                            plugins: {
                                'artifacts': {
                                    upload: 'tfplan'
                                }
                            }
                        },
                        'wait',
                        {
                            block: '🔍 Review Terraform Plan',
                            key: 'review-plan',
                            prompt: 'Review the Terraform plan before applying',
                            fields: [
                                {
                                    key: 'confirm-changes',
                                    text: 'Type CONFIRM to proceed',
                                    required: true
                                }
                            ],
                            branches: 'main'
                        },
                        {
                            label: '🚀 Terraform Apply',
                            key: 'apply',
                            command: `
                                buildkite-agent artifact download tfplan .
                                terraform apply tfplan
                            `,
                            depends_on: ['plan', 'review-plan'],
                            branches: 'main',
                            agents: { terraform: 'latest' },
                            concurrency: 1,
                            concurrency_group: 'terraform-apply'
                        }
                    ]
                }
            },
            
            'monorepo': {
                name: 'Monorepo Pipeline',
                icon: 'fa-code-branch',
                description: 'Intelligent monorepo pipeline that only builds changed packages',
                pipeline: {
                    steps: [
                        {
                            label: '🔍 Detect Changes',
                            key: 'detect-changes',
                            command: `
                                # Detect which packages changed
                                ./scripts/detect-changes.sh > changed-packages.txt
                                cat changed-packages.txt
                            `,
                            artifact_paths: 'changed-packages.txt',
                            agents: { queue: 'default' }
                        },
                        {
                            label: '📦 Build Changed Packages',
                            key: 'build-packages',
                            command: `
                                # Build only changed packages
                                buildkite-agent artifact download changed-packages.txt .
                                ./scripts/build-changed.sh
                            `,
                            depends_on: ['detect-changes'],
                            agents: { queue: 'default' },
                            matrix: [
                                {
                                    package: ['api', 'web', 'mobile', 'shared']
                                }
                            ]
                        },
                        {
                            label: '🧪 Test Changed Packages',
                            key: 'test-packages',
                            command: `
                                # Test only changed packages
                                buildkite-agent artifact download changed-packages.txt .
                                ./scripts/test-changed.sh
                            `,
                            depends_on: ['build-packages'],
                            parallelism: 4,
                            agents: { queue: 'default' }
                        },
                        'wait',
                        {
                            trigger: 'deploy-service',
                            label: '🚀 Deploy Changed Services',
                            build: {
                                message: 'Deploy changed services from ${BUILDKITE_COMMIT}',
                                env: {
                                    CHANGED_PACKAGES: '$(cat changed-packages.txt)'
                                }
                            },
                            branches: 'main',
                            depends_on: ['test-packages']
                        }
                    ]
                }
            },
            
            'security-scan': {
                name: 'Security Pipeline',
                icon: 'fa-shield-alt',
                description: 'Comprehensive security scanning pipeline for dependencies and code',
                pipeline: {
                    steps: [
                        {
                            label: '🔍 Dependency Check',
                            key: 'dep-check',
                            command: `
                                # Check for vulnerable dependencies
                                npm audit --audit-level=moderate
                                safety check --json > safety-report.json
                            `,
                            soft_fail: true,
                            artifact_paths: '*-report.json',
                            agents: { queue: 'security' }
                        },
                        {
                            label: '🔒 SAST Scan',
                            key: 'sast',
                            command: `
                                # Static Application Security Testing
                                semgrep --config=auto --json -o sast-report.json .
                            `,
                            soft_fail: 'exit_status:1',
                            artifact_paths: 'sast-report.json',
                            agents: { queue: 'security' }
                        },
                        {
                            label: '🌐 Secret Scanning',
                            key: 'secrets',
                            command: `
                                # Scan for secrets and credentials
                                trufflehog filesystem . --json > secrets-report.json
                            `,
                            artifact_paths: 'secrets-report.json',
                            agents: { queue: 'security' }
                        },
                        {
                            label: '📊 License Check',
                            key: 'license',
                            command: `
                                # Check for license compliance
                                license-checker --json > license-report.json
                            `,
                            soft_fail: true,
                            artifact_paths: 'license-report.json',
                            agents: { queue: 'security' }
                        },
                        'wait',
                        {
                            label: '📈 Generate Security Report',
                            key: 'report',
                            command: `
                                # Aggregate all security reports
                                buildkite-agent artifact download '*-report.json' .
                                ./scripts/generate-security-report.sh
                            `,
                            artifact_paths: 'security-report.html',
                            agents: { queue: 'security' }
                        },
                        {
                            block: '🛡️ Security Review',
                            key: 'security-review',
                            prompt: 'Review security findings before proceeding',
                            fields: [
                                {
                                    key: 'security-approval',
                                    text: 'Security team approval',
                                    required: true,
                                    select: 'Approved\nRejected\nConditional'
                                }
                            ]
                        }
                    ]
                }
            }
        };
    }

    loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template || !window.pipelineBuilder) {
            console.error(`Template ${templateKey} not found or pipeline builder not available`);
            return;
        }

        // Clear existing pipeline
        window.pipelineBuilder.clearPipeline();
        
        // Load template steps
        template.pipeline.steps.forEach(stepConfig => {
            if (stepConfig === 'wait') {
                window.pipelineBuilder.addStep('wait');
            } else if (typeof stepConfig === 'object') {
                // Determine step type
                let stepType = 'command';
                if (stepConfig.block) stepType = 'block';
                else if (stepConfig.input) stepType = 'input';
                else if (stepConfig.trigger) stepType = 'trigger';
                else if (stepConfig.group) stepType = 'group';
                
                const step = window.pipelineBuilder.addStep(stepType);
                if (step) {
                    // Apply all properties from template
                    Object.assign(step.properties, stepConfig);
                    
                    // Handle group steps recursively
                    if (stepType === 'group' && stepConfig.steps) {
                        // Note: In a real implementation, you'd need to handle nested steps
                        // For now, we'll just note that this group has steps
                        step.properties._groupSteps = stepConfig.steps;
                    }
                }
            }
        });
        
        // Re-render and select first step
        window.pipelineBuilder.renderPipeline();
        if (window.pipelineBuilder.steps.length > 0) {
            window.pipelineBuilder.selectStep(window.pipelineBuilder.steps[0]);
        }
        
        // Show notification
        if (window.buildkiteApp) {
            window.buildkiteApp.showNotification(`Loaded ${template.name} template`, 'success');
        }
        
        console.log(`✅ Loaded template: ${template.name}`);
    }

    getTemplateList() {
        return Object.entries(this.templates).map(([key, template]) => ({
            key,
            name: template.name,
            icon: template.icon,
            description: template.description,
            stepCount: template.pipeline.steps.length
        }));
    }

    exportTemplate(name, description) {
        if (!window.pipelineBuilder) {
            console.error('Pipeline builder not available');
            return null;
        }
        
        const config = window.pipelineBuilder.exportConfig();
        
        return {
            name,
            description,
            icon: 'fa-file',
            pipeline: config
        };
    }

    importTemplate(templateData) {
        if (!templateData || !templateData.pipeline) {
            console.error('Invalid template data');
            return false;
        }
        
        // Generate a unique key
        const key = `custom-${Date.now()}`;
        
        // Add to templates
        this.templates[key] = {
            name: templateData.name || 'Custom Template',
            description: templateData.description || 'Imported template',
            icon: templateData.icon || 'fa-file',
            pipeline: templateData.pipeline
        };
        
        console.log(`✅ Imported template: ${templateData.name}`);
        return key;
    }
}

// Initialize and export
if (typeof window !== 'undefined') {
    window.PipelineTemplates = PipelineTemplates;
    window.pipelineTemplates = new PipelineTemplates();
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipelineTemplates;
}