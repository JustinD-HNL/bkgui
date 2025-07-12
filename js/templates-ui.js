// js/templates-ui.js
/**
 * Enhanced Templates UI
 * Provides a beautiful interface for browsing and loading pipeline templates
 */

class TemplatesUI {
    constructor() {
        this.selectedCategory = 'all';
        this.searchQuery = '';
        
        // Create embedded templates object directly since external scripts aren't loading
        this.templates = {
            templates: {
                'node-app': {
                    name: 'Node.js Application',
                    icon: 'fa-node-js',
                    category: 'ci-cd',
                    description: 'Complete CI/CD pipeline for Node.js applications with testing, building, and deployment',
                    pipeline: {
                        steps: [
                            {
                                label: ':package: Install Dependencies',
                                key: 'install',
                                command: 'npm ci --prefer-offline --no-audit',
                                agents: { queue: 'default', os: 'linux' },
                                artifact_paths: ['node_modules.tar.gz'],
                                plugins: {
                                    'cache#v1.2.0': {
                                        key: 'npm-v1-{{ checksum "package-lock.json" }}',
                                        paths: ['node_modules']
                                    }
                                },
                                timeout_in_minutes: 10
                            },
                            {
                                label: ':mag: Lint Code',
                                key: 'lint',
                                command: 'npm run lint',
                                depends_on: ['install'],
                                agents: { queue: 'default' },
                                artifact_paths: ['lint-results.json'],
                                soft_fail: [{ exit_status: 1 }]
                            },
                            {
                                label: ':test_tube: Run Tests',
                                key: 'test',
                                command: 'npm test -- --coverage --reporters=default --reporters=jest-junit',
                                depends_on: ['install'],
                                agents: { queue: 'default' },
                                artifact_paths: ['coverage/**/*', 'junit.xml'],
                                plugins: {
                                    'test-collector#v1.11.0': {
                                        files: 'junit.xml',
                                        format: 'junit'
                                    }
                                },
                                env: { CI: 'true', NODE_ENV: 'test' },
                                parallelism: 2,
                                timeout_in_minutes: 15,
                                retry: {
                                    automatic: [
                                        { exit_status: -1, limit: 2 },
                                        { exit_status: 143, limit: 2 }
                                    ]
                                }
                            },
                            'wait',
                            {
                                label: ':hammer: Build Application',
                                key: 'build',
                                command: 'npm run build',
                                depends_on: ['test', 'lint'],
                                agents: { queue: 'default' },
                                artifact_paths: ['dist/**/*', 'build/**/*'],
                                env: { NODE_ENV: 'production' },
                                timeout_in_minutes: 20
                            },
                            {
                                block: ':shipit: Deploy to Production',
                                key: 'deploy_gate',
                                prompt: 'Deploy this build to production?',
                                fields: [
                                    {
                                        key: 'release_notes',
                                        text: 'Release Notes',
                                        required: false,
                                        default: 'Automated deployment'
                                    },
                                    {
                                        key: 'notify_team',
                                        select: 'Notify Team',
                                        options: [
                                            { label: 'Yes', value: 'true' },
                                            { label: 'No', value: 'false' }
                                        ],
                                        default: 'true'
                                    }
                                ],
                                branches: 'main'
                            },
                            {
                                label: ':rocket: Deploy to Production',
                                key: 'deploy',
                                command: 'npm run deploy:prod',
                                depends_on: ['build', 'deploy_gate'],
                                branches: 'main',
                                agents: { queue: 'deploy', os: 'linux' },
                                env: { NODE_ENV: 'production' },
                                concurrency: 1,
                                concurrency_group: 'production-deploy',
                                timeout_in_minutes: 30,
                                retry: {
                                    manual: {
                                        allowed: false,
                                        reason: 'Production deployments should not be retried'
                                    }
                                }
                            }
                        ]
                    }
                },
                'docker-microservice': {
                    name: 'Docker Microservice',
                    icon: 'fa-docker',
                    category: 'deployment',
                    description: 'Build, test, and deploy Docker-based microservices with multi-stage builds',
                    pipeline: {
                        steps: [
                            {
                                label: ':test_tube: Unit Tests',
                                key: 'test',
                                command: 'docker-compose run --rm test',
                                agents: { docker: 'true', queue: 'docker-runners' },
                                plugins: {
                                    'docker-compose#v4.14.0': {
                                        config: 'docker-compose.test.yml',
                                        run: 'app',
                                        command: ['npm', 'test']
                                    }
                                },
                                artifact_paths: ['test-results/**/*', 'coverage/**/*'],
                                timeout_in_minutes: 15
                            },
                            {
                                label: ':whale: Build Docker Image',
                                key: 'build',
                                command: 'docker build -t $$DOCKER_REGISTRY/$$BUILDKITE_PIPELINE_SLUG:$$BUILDKITE_BUILD_NUMBER .\ndocker build -t $$DOCKER_REGISTRY/$$BUILDKITE_PIPELINE_SLUG:latest .',
                                depends_on: ['test'],
                                agents: { docker: 'true', queue: 'docker-runners' },
                                env: { 
                                    DOCKER_REGISTRY: 'your-registry.com',
                                    DOCKER_BUILDKIT: '1'
                                },
                                timeout_in_minutes: 20
                            },
                            {
                                label: ':mag: Security Scan',
                                key: 'security_scan',
                                command: 'docker run --rm -v $$PWD:/workspace aquasec/trivy image $$DOCKER_REGISTRY/$$BUILDKITE_PIPELINE_SLUG:$$BUILDKITE_BUILD_NUMBER',
                                depends_on: ['build'],
                                agents: { docker: 'true' },
                                artifact_paths: ['security-scan-results.json'],
                                soft_fail: [{ exit_status: 1 }]
                            },
                            'wait',
                            {
                                label: ':arrow_up: Push to Registry',
                                key: 'push',
                                command: 'docker push $$DOCKER_REGISTRY/$$BUILDKITE_PIPELINE_SLUG:$$BUILDKITE_BUILD_NUMBER\ndocker push $$DOCKER_REGISTRY/$$BUILDKITE_PIPELINE_SLUG:latest',
                                depends_on: ['security_scan'],
                                agents: { docker: 'true' },
                                branches: 'main',
                                timeout_in_minutes: 10
                            },
                            {
                                trigger: 'deploy-microservice',
                                build: {
                                    message: 'Deploy microservice version $$BUILDKITE_BUILD_NUMBER',
                                    env: {
                                        IMAGE_TAG: '$$BUILDKITE_BUILD_NUMBER',
                                        SERVICE_NAME: '$$BUILDKITE_PIPELINE_SLUG'
                                    }
                                },
                                depends_on: ['push'],
                                branches: 'main'
                            }
                        ]
                    }
                },
                'security-scan': {
                    name: 'Security Scanning',
                    icon: 'fa-shield-alt',
                    category: 'security',
                    description: 'Comprehensive security scanning and vulnerability assessment pipeline',
                    pipeline: {
                        steps: [
                            {
                                label: ':lock: Dependency Vulnerability Scan',
                                key: 'dep_scan',
                                command: 'npm audit --audit-level moderate --json > npm-audit.json\nnpm audit --audit-level moderate',
                                agents: { queue: 'security-scanners' },
                                artifact_paths: ['npm-audit.json'],
                                soft_fail: [{ exit_status: 1 }],
                                timeout_in_minutes: 10
                            },
                            {
                                label: ':shield: SAST Code Analysis',
                                key: 'sast',
                                command: 'semgrep --config=auto --json --output=semgrep-results.json .',
                                agents: { queue: 'security-scanners' },
                                artifact_paths: ['semgrep-results.json'],
                                plugins: {
                                    'docker#v5.8.0': {
                                        image: 'returntocorp/semgrep:latest',
                                        workdir: '/src',
                                        volumes: ['$PWD:/src']
                                    }
                                },
                                timeout_in_minutes: 15
                            },
                            {
                                label: ':mag: Secret Detection',
                                key: 'secrets',
                                command: 'gitleaks detect --source . --report-format json --report-path gitleaks-report.json',
                                agents: { queue: 'security-scanners' },
                                artifact_paths: ['gitleaks-report.json'],
                                plugins: {
                                    'docker#v5.8.0': {
                                        image: 'zricethezav/gitleaks:latest',
                                        workdir: '/workspace',
                                        volumes: ['$PWD:/workspace']
                                    }
                                },
                                timeout_in_minutes: 5
                            },
                            {
                                label: ':microscope: License Compliance',
                                key: 'license_check',
                                command: 'license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC" --json > license-report.json',
                                agents: { queue: 'default' },
                                artifact_paths: ['license-report.json'],
                                soft_fail: [{ exit_status: 1 }]
                            },
                            'wait',
                            {
                                label: ':clipboard: Generate Security Report',
                                key: 'security_report',
                                command: 'python scripts/generate-security-report.py',
                                depends_on: ['dep_scan', 'sast', 'secrets', 'license_check'],
                                agents: { queue: 'default' },
                                artifact_paths: ['security-report.html', 'security-summary.json'],
                                env: { PYTHONPATH: '.' }
                            }
                        ]
                    }
                },
                'go-microservice': {
                    name: 'Go Microservice',
                    icon: 'fa-code',
                    category: 'microservices',
                    description: 'Go microservice with testing and containerization',
                    pipeline: {
                        steps: [
                            { label: '🧪 Run Tests', key: 'test', command: 'go test ./...' },
                            { label: '🏗️ Build Binary', key: 'build', command: 'go build -o app .' }
                        ]
                    }
                },
                'python-ml': {
                    name: 'Python ML Pipeline',
                    icon: 'fa-brain',
                    category: 'workflow',
                    description: 'Machine learning pipeline with data processing and model training',
                    pipeline: {
                        steps: [
                            { label: '📊 Data Processing', key: 'process', command: 'python process_data.py' },
                            { label: '🤖 Train Model', key: 'train', command: 'python train_model.py' }
                        ]
                    }
                },
                'react-frontend': {
                    name: 'React Frontend',
                    icon: 'fa-react',
                    category: 'ci-cd',
                    description: 'React application with testing and deployment',
                    pipeline: {
                        steps: [
                            { label: '📦 Install Dependencies', key: 'install', command: 'npm ci' },
                            { label: '🧪 Run Tests', key: 'test', command: 'npm test' },
                            { label: '🏗️ Build App', key: 'build', command: 'npm run build' }
                        ]
                    }
                },
                'kubernetes-deploy': {
                    name: 'Kubernetes Deployment',
                    icon: 'fa-dharmachakra',
                    category: 'deployment',
                    description: 'Deploy applications to Kubernetes cluster with health checks and rollback',
                    pipeline: {
                        steps: [
                            {
                                label: ':gear: Validate Kubernetes Manifests',
                                key: 'validate',
                                command: 'kubeval k8s/*.yaml\nkube-score score k8s/*.yaml',
                                agents: { kubectl: 'true', queue: 'k8s-deploy' },
                                plugins: {
                                    'docker#v5.8.0': {
                                        image: 'zegl/kube-score:latest',
                                        workdir: '/workspace',
                                        volumes: ['$PWD:/workspace']
                                    }
                                },
                                timeout_in_minutes: 5
                            },
                            {
                                block: ':warning: Deploy to Staging',
                                key: 'staging_gate',
                                prompt: 'Deploy to staging environment?',
                                fields: [
                                    {
                                        key: 'environment',
                                        select: 'Target Environment',
                                        default: 'staging',
                                        options: [
                                            { label: 'Staging', value: 'staging' },
                                            { label: 'UAT', value: 'uat' }
                                        ]
                                    }
                                ]
                            },
                            {
                                label: ':rocket: Deploy to Staging',
                                key: 'deploy_staging',
                                command: 'helm upgrade --install $$APP_NAME charts/$$APP_NAME --namespace staging --set image.tag=$$BUILDKITE_BUILD_NUMBER --set environment=staging --wait --timeout=600s\nkubectl rollout status deployment/$$APP_NAME -n staging --timeout=300s',
                                depends_on: ['validate', 'staging_gate'],
                                agents: { kubectl: 'true', queue: 'k8s-deploy' },
                                env: { 
                                    APP_NAME: '$$BUILDKITE_PIPELINE_SLUG',
                                    KUBECONFIG: '/etc/kubeconfig/staging'
                                },
                                timeout_in_minutes: 15,
                                retry: {
                                    automatic: [
                                        { exit_status: -1, limit: 1 }
                                    ]
                                }
                            },
                            {
                                label: ':test_tube: Run Smoke Tests',
                                key: 'smoke_tests',
                                command: 'npm run test:smoke -- --env=staging',
                                depends_on: ['deploy_staging'],
                                agents: { queue: 'default' },
                                artifact_paths: ['smoke-test-results.json'],
                                timeout_in_minutes: 10
                            },
                            {
                                block: ':shipit: Deploy to Production',
                                key: 'production_gate',
                                prompt: 'Deploy to production? This will update the live service.',
                                fields: [
                                    {
                                        key: 'rollback_plan',
                                        text: 'Rollback Plan',
                                        required: true,
                                        hint: 'Describe the rollback strategy if deployment fails'
                                    },
                                    {
                                        key: 'maintenance_window',
                                        select: 'Maintenance Window',
                                        options: [
                                            { label: 'Business Hours (High Risk)', value: 'business' },
                                            { label: 'After Hours (Recommended)', value: 'after-hours' }
                                        ],
                                        default: 'after-hours'
                                    }
                                ],
                                depends_on: ['smoke_tests'],
                                branches: 'main'
                            },
                            {
                                label: ':rocket: Deploy to Production',
                                key: 'deploy_production',
                                command: 'helm upgrade --install $$APP_NAME charts/$$APP_NAME --namespace production --set image.tag=$$BUILDKITE_BUILD_NUMBER --set environment=production --wait --timeout=900s\nkubectl rollout status deployment/$$APP_NAME -n production --timeout=600s',
                                depends_on: ['production_gate'],
                                branches: 'main',
                                agents: { kubectl: 'true', queue: 'k8s-deploy' },
                                env: { 
                                    APP_NAME: '$$BUILDKITE_PIPELINE_SLUG',
                                    KUBECONFIG: '/etc/kubeconfig/production'
                                },
                                concurrency: 1,
                                concurrency_group: 'production-k8s-deploy',
                                timeout_in_minutes: 20,
                                retry: {
                                    manual: {
                                        allowed: true,
                                        permit_on_passed: false,
                                        reason: 'Production deployments can be retried with caution'
                                    }
                                }
                            },
                            {
                                label: ':health: Production Health Check',
                                key: 'health_check',
                                command: 'sleep 30\ncurl -f http://$$APP_NAME.production.svc.cluster.local/health\nnpm run test:health -- --env=production',
                                depends_on: ['deploy_production'],
                                agents: { kubectl: 'true' },
                                timeout_in_minutes: 5,
                                retry: {
                                    automatic: [
                                        { exit_status: '*', limit: 3 }
                                    ]
                                }
                            }
                        ]
                    }
                },
                'integration-tests': {
                    name: 'Integration Testing',
                    icon: 'fa-link',
                    category: 'testing',
                    description: 'Comprehensive integration testing suite',
                    pipeline: {
                        steps: [
                            { label: '🚀 Start Services', key: 'start', command: 'docker-compose up -d' },
                            { label: '🧪 Run Integration Tests', key: 'test', command: 'npm run test:integration' }
                        ]
                    }
                },
                'load-testing': {
                    name: 'Load Testing',
                    icon: 'fa-tachometer-alt',
                    category: 'testing',
                    description: 'Performance and load testing pipeline',
                    pipeline: {
                        steps: [
                            { label: '⚡ Load Test', key: 'load_test', command: 'k6 run load-test.js' },
                            { label: '📊 Generate Report', key: 'report', command: 'k6 report' }
                        ]
                    }
                },
                'multi-environment': {
                    name: 'Multi-Environment Deploy',
                    icon: 'fa-layer-group',
                    category: 'deployment',
                    description: 'Deploy to multiple environments with approvals',
                    pipeline: {
                        steps: [
                            { label: '🏗️ Build', key: 'build', command: 'npm run build' },
                            { block: '🚦 Deploy to Staging', key: 'staging_gate' },
                            { label: '🎭 Deploy Staging', key: 'staging', command: 'deploy staging' },
                            { block: '🚀 Deploy to Production', key: 'prod_gate' },
                            { label: '🚀 Deploy Production', key: 'production', command: 'deploy production' }
                        ]
                    }
                },
                'monorepo-workflow': {
                    name: 'Monorepo Workflow',
                    icon: 'fa-sitemap',
                    category: 'workflow',
                    description: 'Efficient monorepo build and test workflow',
                    pipeline: {
                        steps: [
                            { label: '📦 Install Dependencies', key: 'install', command: 'npm ci' },
                            { label: '🔍 Detect Changes', key: 'changes', command: 'lerna changed' },
                            { label: '🧪 Test Changed', key: 'test', command: 'lerna run test --since HEAD~1' }
                        ]
                    }
                },
                'database-migration': {
                    name: 'Database Migration',
                    icon: 'fa-database',
                    category: 'workflow',
                    description: 'Safe database migration with rollback capability',
                    pipeline: {
                        steps: [
                            { label: '🔍 Validate Migrations', key: 'validate', command: 'migrate validate' },
                            { block: '⚠️ Confirm Migration', key: 'confirm' },
                            { label: '📊 Run Migration', key: 'migrate', command: 'migrate up' }
                        ]
                    }
                },
                'mobile-app': {
                    name: 'Mobile App (React Native)',
                    icon: 'fa-mobile-alt',
                    category: 'ci-cd',
                    description: 'React Native mobile app build and deployment',
                    pipeline: {
                        steps: [
                            { label: '📦 Install Dependencies', key: 'install', command: 'npm ci' },
                            { label: '🧪 Run Tests', key: 'test', command: 'npm test' },
                            { label: '📱 Build iOS', key: 'build_ios', command: 'npx react-native run-ios' },
                            { label: '🤖 Build Android', key: 'build_android', command: 'npx react-native run-android' }
                        ]
                    }
                },
                'api-testing': {
                    name: 'API Testing Suite',
                    icon: 'fa-exchange-alt',
                    category: 'testing',
                    description: 'Comprehensive API testing with multiple tools',
                    pipeline: {
                        steps: [
                            { label: '🚀 Start API', key: 'start_api', command: 'npm run start:api' },
                            { label: '🧪 Unit Tests', key: 'unit', command: 'npm run test:unit' },
                            { label: '🔗 Integration Tests', key: 'integration', command: 'npm run test:integration' },
                            { label: '📡 Postman Tests', key: 'postman', command: 'newman run api-tests.postman_collection.json' }
                        ]
                    }
                },
                'infrastructure': {
                    name: 'Infrastructure as Code',
                    icon: 'fa-server',
                    category: 'deployment',
                    description: 'Terraform infrastructure deployment and validation',
                    pipeline: {
                        steps: [
                            { label: '🔍 Terraform Validate', key: 'validate', command: 'terraform validate' },
                            { label: '📋 Terraform Plan', key: 'plan', command: 'terraform plan' },
                            { block: '⚠️ Apply Infrastructure', key: 'confirm' },
                            { label: '🏗️ Terraform Apply', key: 'apply', command: 'terraform apply -auto-approve' }
                        ]
                    }
                },
                'compliance-check': {
                    name: 'Compliance & Audit',
                    icon: 'fa-clipboard-check',
                    category: 'security',
                    description: 'Compliance checking and audit trail generation',
                    pipeline: {
                        steps: [
                            { label: '📋 License Check', key: 'license', command: 'license-checker' },
                            { label: '🔒 Security Audit', key: 'audit', command: 'npm audit' },
                            { label: '📊 Generate Report', key: 'report', command: 'compliance-report' }
                        ]
                    }
                },
                'security-audits-group': {
                    name: 'Security Audits Group',
                    icon: 'fa-shield-alt',
                    category: 'security',
                    description: 'Comprehensive security audits organized in a logical group',
                    pipeline: {
                        steps: [
                            {
                                group: ':lock_with_ink_pen: Security Audits',
                                key: 'security_audits',
                                steps: [
                                    {
                                        label: ':shield: SAST Analysis',
                                        command: 'semgrep --config=auto .',
                                        key: 'sast'
                                    },
                                    {
                                        label: ':closed_lock_with_key: Dependency Scan',
                                        command: 'npm audit --audit-level high',
                                        key: 'deps'
                                    },
                                    {
                                        label: ':key: Secret Detection',
                                        command: 'gitleaks detect --source .',
                                        key: 'secrets'
                                    },
                                    {
                                        label: ':scroll: License Check',
                                        command: 'license-checker --onlyAllow "MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause"',
                                        key: 'licenses'
                                    }
                                ]
                            },
                            'wait',
                            {
                                label: ':clipboard: Security Report',
                                command: 'python scripts/generate-security-report.py',
                                depends_on: ['security_audits'],
                                key: 'security_report'
                            }
                        ]
                    }
                }
            },
            getAllCategories: () => ['ci-cd', 'deployment', 'security', 'microservices', 'workflow', 'testing'],
            getTemplatesByCategory: (category) => Object.entries(this.templates.templates).filter(([_, t]) => t.category === category).map(([key, template]) => ({ key, ...template })),
            loadTemplate: (templateKey) => {
                const template = this.templates.templates[templateKey];
                if (template && window.pipelineBuilder) {
                    // Convert template structure to pipeline builder format
                    const stepConfigs = [];
                    
                    template.pipeline.steps.forEach(step => {
                        if (step === 'wait') {
                            stepConfigs.push({ type: 'wait', properties: {} });
                        } else if (typeof step === 'object') {
                            if (step.block) {
                                const blockStep = {
                                    type: 'block',
                                    properties: {
                                        block: step.block,
                                        prompt: step.prompt || undefined,
                                        fields: step.fields && step.fields.length > 0 ? step.fields : undefined,
                                        branches: step.branches || undefined
                                    }
                                };
                                // Set key at step level for blocks
                                if (step.key) {
                                    blockStep.key = step.key;
                                }
                                stepConfigs.push(blockStep);
                            } else if (step.input) {
                                const inputStep = {
                                    type: 'input',
                                    properties: {
                                        input: step.input,
                                        fields: step.fields && step.fields.length > 0 ? step.fields : undefined
                                    }
                                };
                                // Set key at step level for inputs
                                if (step.key) {
                                    inputStep.key = step.key;
                                }
                                stepConfigs.push(inputStep);
                            } else if (step.trigger) {
                                const triggerStep = {
                                    type: 'trigger',
                                    properties: {
                                        trigger: step.trigger,
                                        build: step.build && Object.keys(step.build).length > 0 ? step.build : undefined,
                                        async: step.async || undefined
                                    }
                                };
                                // Set key at step level for triggers
                                if (step.key) {
                                    triggerStep.key = step.key;
                                }
                                stepConfigs.push(triggerStep);
                            } else if (step.group) {
                                const groupStep = {
                                    type: 'group',
                                    properties: {
                                        group: step.group,
                                        steps: step.steps && step.steps.length > 0 ? step.steps : undefined
                                    }
                                };
                                // Set key at step level for groups
                                if (step.key) {
                                    groupStep.key = step.key;
                                }
                                stepConfigs.push(groupStep);
                            } else {
                                // Default to command step
                                const commandStep = {
                                    type: 'command',
                                    properties: {
                                        label: step.label || 'Step',
                                        command: step.command || (Array.isArray(step.commands) ? step.commands.join('\n') : step.commands) || '',
                                        agents: step.agents && Object.keys(step.agents).length > 0 ? step.agents : undefined,
                                        artifact_paths: step.artifact_paths && step.artifact_paths.length > 0 ? (Array.isArray(step.artifact_paths) ? step.artifact_paths.join('\n') : step.artifact_paths) : undefined,
                                        depends_on: step.depends_on && step.depends_on.length > 0 ? step.depends_on : undefined,
                                        if: step.if || undefined,
                                        unless: step.unless || undefined,
                                        branches: step.branches || undefined,
                                        plugins: step.plugins && Object.keys(step.plugins).length > 0 ? step.plugins : undefined,
                                        timeout_in_minutes: step.timeout_in_minutes || undefined,
                                        retry: step.retry && Object.keys(step.retry).length > 0 ? step.retry : undefined,
                                        soft_fail: step.soft_fail && step.soft_fail.length > 0 ? step.soft_fail : undefined,
                                        env: step.env && Object.keys(step.env).length > 0 ? step.env : undefined,
                                        parallelism: step.parallelism || undefined,
                                        concurrency: step.concurrency || undefined,
                                        concurrency_group: step.concurrency_group || undefined
                                    }
                                };
                                // Set key at step level for commands
                                if (step.key) {
                                    commandStep.key = step.key;
                                }
                                stepConfigs.push(commandStep);
                            }
                        }
                    });
                    
                    // Clear current pipeline and load template steps
                    window.pipelineBuilder.clearPipeline(true);
                    
                    // Add each step
                    stepConfigs.forEach(stepConfig => {
                        const step = window.pipelineBuilder.addStep(stepConfig.type);
                        if (step) {
                            // Clear problematic default properties that cause empty YAML objects
                            if (step.properties.retry === null) delete step.properties.retry;
                            if (step.properties.soft_fail === false) delete step.properties.soft_fail;
                            if (step.properties.env && Object.keys(step.properties.env).length === 0) delete step.properties.env;
                            if (step.properties.plugins && Object.keys(step.properties.plugins).length === 0) delete step.properties.plugins;
                            if (step.properties.agents && Object.keys(step.properties.agents).length === 0) delete step.properties.agents;
                            
                            // Set key in properties (pipeline builder expects it there)
                            if (stepConfig.key) {
                                step.properties.key = stepConfig.key;
                            }
                            
                            // Set step properties
                            if (stepConfig.properties) {
                                // Filter out undefined, empty, and null values to prevent empty properties in YAML
                                const cleanProperties = {};
                                Object.entries(stepConfig.properties).forEach(([key, value]) => {
                                    // Skip undefined, null, empty strings
                                    if (value === undefined || value === null || value === '') {
                                        return;
                                    }
                                    
                                    // Skip empty objects
                                    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
                                        return;
                                    }
                                    
                                    // Skip empty arrays
                                    if (Array.isArray(value) && value.length === 0) {
                                        return;
                                    }
                                    
                                    cleanProperties[key] = value;
                                });
                                Object.assign(step.properties, cleanProperties);
                            }
                        }
                    });
                    
                    // Re-render and save
                    window.pipelineBuilder.renderPipeline();
                    window.pipelineBuilder.renderProperties();
                    window.pipelineBuilder.saveToLocalStorage();
                    
                    console.log('✅ Template loaded successfully:', template.name);
                }
            }
        };
        
        console.log('TemplatesUI: Constructor called with embedded templates');
        console.log('TemplatesUI: Available templates:', Object.keys(this.templates.templates).length);
        
        this.init();
        this.updateTemplateCount();
    }

    retryInitialization() {
        console.log('TemplatesUI: Using embedded templates - no retry needed');
        this.init();
    }

    init() {
        this.createTemplatesModal();
        this.setupEventListeners();
        this.createTemplatesButton();
    }

    createTemplatesButton() {
        // Add a prominent templates button to the header if it doesn't exist
        const actionsContainer = document.querySelector('.header-actions');
        console.log('TemplatesUI: createTemplatesButton called');
        console.log('TemplatesUI: actionsContainer:', actionsContainer);
        console.log('TemplatesUI: existing templates-button:', document.getElementById('templates-button'));
        
        if (actionsContainer && !document.getElementById('templates-button')) {
            const templatesBtn = document.createElement('button');
            templatesBtn.id = 'templates-button';
            templatesBtn.className = 'btn btn-secondary';
            
            // Show template count if available
            const templateCount = this.templates && this.templates.templates ? 
                Object.keys(this.templates.templates).length : 0;
            
            templatesBtn.innerHTML = `<i class="fas fa-file-code"></i> Templates${templateCount > 0 ? ` (${templateCount})` : ''}`;
            templatesBtn.addEventListener('click', () => this.showTemplatesModal());
            
            // Insert at the beginning of actions
            actionsContainer.insertBefore(templatesBtn, actionsContainer.firstChild);
            
            console.log(`TemplatesUI: Created Templates button in header with ${templateCount} templates`);
        } else if (!actionsContainer) {
            console.warn('TemplatesUI: .header-actions container not found');
        } else {
            console.log('TemplatesUI: Templates button already exists');
        }
    }
    
    updateTemplateCount() {
        const btn = document.getElementById('templates-button');
        if (btn && this.templates && this.templates.templates) {
            const templateCount = Object.keys(this.templates.templates).length;
            btn.innerHTML = `<i class="fas fa-file-code"></i> Templates${templateCount > 0 ? ` (${templateCount})` : ''}`;
        }
    }

    createTemplatesModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('enhanced-templates-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'enhanced-templates-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2><i class="fas fa-file-code"></i> Pipeline Templates</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="templates-container">
                        <div class="templates-sidebar">
                            <div class="templates-search">
                                <i class="fas fa-search"></i>
                                <input type="text" id="template-search" placeholder="Search templates..." />
                            </div>
                            <div class="templates-categories">
                                <h3>Categories</h3>
                                <ul id="template-categories">
                                    <li class="active" data-category="all">
                                        <i class="fas fa-th"></i> All Templates
                                        <span class="count">0</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="templates-actions">
                                <button class="btn btn-secondary" id="import-template-btn">
                                    <i class="fas fa-upload"></i> Import Template
                                </button>
                                <button class="btn btn-secondary" id="export-current-template-btn">
                                    <i class="fas fa-download"></i> Export Current
                                </button>
                            </div>
                        </div>
                        <div class="templates-main">
                            <div class="templates-header">
                                <h3 id="templates-category-title">All Templates</h3>
                                <div class="templates-view-toggle">
                                    <button class="view-btn active" data-view="grid">
                                        <i class="fas fa-th-large"></i>
                                    </button>
                                    <button class="view-btn" data-view="list">
                                        <i class="fas fa-list"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="templates-grid" class="templates-grid">
                                <!-- Templates will be rendered here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                .templates-container {
                    display: flex;
                    height: 600px;
                    gap: 0;
                }

                .templates-sidebar {
                    width: 250px;
                    background: var(--bg-secondary);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                }

                .templates-search {
                    padding: 1rem;
                    border-bottom: 1px solid var(--border-color);
                    position: relative;
                }

                .templates-search i {
                    position: absolute;
                    left: 1.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-tertiary);
                }

                .templates-search input {
                    width: 100%;
                    padding: 0.5rem 0.5rem 0.5rem 2.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                }

                .templates-categories {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                }

                .templates-categories h3 {
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    color: var(--text-tertiary);
                    margin-bottom: 0.75rem;
                }

                .templates-categories ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .templates-categories li {
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.25rem;
                    border-radius: 6px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.2s ease;
                }

                .templates-categories li:hover {
                    background: var(--hover-bg);
                }

                .templates-categories li.active {
                    background: var(--primary);
                    color: white;
                }

                .templates-categories li i {
                    margin-right: 0.75rem;
                }

                .templates-categories .count {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 0.125rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.75rem;
                }

                .templates-actions {
                    padding: 1rem;
                    border-top: 1px solid var(--border-color);
                }

                .templates-actions button {
                    width: 100%;
                    margin-bottom: 0.5rem;
                }

                .templates-main {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }

                .templates-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .templates-view-toggle {
                    display: flex;
                    gap: 0.25rem;
                }

                .view-btn {
                    padding: 0.5rem;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .view-btn:first-child {
                    border-radius: 6px 0 0 6px;
                }

                .view-btn:last-child {
                    border-radius: 0 6px 6px 0;
                }

                .view-btn.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                }

                .templates-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .templates-grid.list-view {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .template-card {
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .template-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md);
                    border-color: var(--primary);
                }

                .template-card.list-view {
                    display: flex;
                    align-items: center;
                    padding: 1rem 1.5rem;
                }

                .template-icon {
                    font-size: 2rem;
                    color: var(--primary);
                    margin-bottom: 1rem;
                }

                .list-view .template-icon {
                    font-size: 1.5rem;
                    margin-bottom: 0;
                    margin-right: 1rem;
                }

                .template-content {
                    flex: 1;
                }

                .template-name {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    color: var(--text-primary);
                }

                .template-description {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                }

                .list-view .template-description {
                    margin-bottom: 0;
                }

                .template-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }

                .template-steps {
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .template-category {
                    background: var(--bg-secondary);
                    padding: 0.25rem 0.75rem;
                    border-radius: 12px;
                }

                .template-preview {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: var(--primary);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 0 8px 0 8px;
                    font-size: 0.75rem;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }

                .template-card:hover .template-preview {
                    opacity: 1;
                }

                .template-details-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                }

                .template-details-content {
                    background: var(--card-bg);
                    border-radius: 12px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .template-details-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .template-details-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }

                .template-details-footer {
                    padding: 1.5rem;
                    border-top: 1px solid var(--border-color);
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .template-steps-preview {
                    margin-top: 1.5rem;
                }

                .template-steps-preview h4 {
                    margin-bottom: 1rem;
                }

                .step-preview {
                    background: var(--bg-secondary);
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.5rem;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .step-preview-icon {
                    color: var(--primary);
                }

                .step-preview-label {
                    flex: 1;
                }

                .step-preview-type {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    background: var(--bg-tertiary);
                    padding: 0.125rem 0.5rem;
                    border-radius: 4px;
                }
            </style>
        `;

        document.body.appendChild(modal);
    }

    setupEventListeners() {
        // Also handle the sidebar templates button
        const templatesBtn = document.getElementById('templates-btn');
        if (templatesBtn) {
            console.log('TemplatesUI: Found templates-btn, attaching handler');
            // Remove any existing listeners to prevent duplicates
            const newBtn = templatesBtn.cloneNode(true);
            templatesBtn.parentNode.replaceChild(newBtn, templatesBtn);
            
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('TemplatesUI: Templates button clicked');
                this.showTemplatesModal();
            });
        } else {
            console.warn('TemplatesUI: templates-btn not found in DOM');
        }
        
        // Search functionality
        const searchInput = document.getElementById('template-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderTemplates();
            });
        }

        // View toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('.view-btn')) {
                const btn = e.target.closest('.view-btn');
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const grid = document.getElementById('templates-grid');
                if (btn.dataset.view === 'list') {
                    grid.classList.add('list-view');
                } else {
                    grid.classList.remove('list-view');
                }
            }
        });

        // Close modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) modal.classList.add('hidden');
            }
        });
        
        // Import/Export buttons
        const importBtn = document.getElementById('import-template-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importTemplate());
        }
        
        const exportBtn = document.getElementById('export-current-template-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCurrentAsTemplate());
        }
    }

    showTemplatesModal() {
        const modal = document.getElementById('enhanced-templates-modal');
        if (modal) {
            console.log('TemplatesUI: Showing templates modal with', Object.keys(this.templates.templates).length, 'templates');
            modal.classList.remove('hidden');
            this.renderCategories();
            this.renderTemplates();
        }
    }

    renderCategories() {
        const categoriesList = document.getElementById('template-categories');
        if (!categoriesList || !this.templates) {
            console.log('TemplatesUI: Cannot render categories - list or templates missing');
            return;
        }

        const categories = this.templates.getAllCategories();
        const allTemplates = Object.keys(this.templates.templates).length;

        let html = `
            <li class="${this.selectedCategory === 'all' ? 'active' : ''}" data-category="all">
                <i class="fas fa-th"></i> All Templates
                <span class="count">${allTemplates}</span>
            </li>
        `;

        const categoryIcons = {
            'ci-cd': 'fa-infinity',
            'testing': 'fa-vial',
            'deployment': 'fa-rocket',
            'microservices': 'fa-cubes',
            'workflow': 'fa-sitemap',
            'security': 'fa-shield-alt'
        };

        categories.forEach(category => {
            const count = this.templates.getTemplatesByCategory(category).length;
            const icon = categoryIcons[category] || 'fa-folder';
            const name = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            
            html += `
                <li class="${this.selectedCategory === category ? 'active' : ''}" data-category="${category}">
                    <i class="fas ${icon}"></i> ${name}
                    <span class="count">${count}</span>
                </li>
            `;
        });

        categoriesList.innerHTML = html;

        // Add click handlers
        categoriesList.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.selectedCategory = li.dataset.category;
                categoriesList.querySelectorAll('li').forEach(l => l.classList.remove('active'));
                li.classList.add('active');
                
                const title = document.getElementById('templates-category-title');
                if (title) {
                    title.textContent = li.textContent.trim();
                }
                
                this.renderTemplates();
            });
        });
    }

    renderTemplates() {
        const grid = document.getElementById('templates-grid');
        if (!grid || !this.templates) {
            console.log('TemplatesUI: Cannot render - grid or templates missing');
            return;
        }

        let templates = this.selectedCategory === 'all' 
            ? Object.entries(this.templates.templates)
            : Object.entries(this.templates.templates).filter(([_, t]) => t.category === this.selectedCategory);

        // Apply search filter
        if (this.searchQuery) {
            templates = templates.filter(([key, template]) => {
                return template.name.toLowerCase().includes(this.searchQuery) ||
                       template.description.toLowerCase().includes(this.searchQuery) ||
                       key.toLowerCase().includes(this.searchQuery);
            });
        }

        const isListView = grid.classList.contains('list-view');

        grid.innerHTML = templates.map(([key, template]) => {
            const stepCount = template.pipeline?.steps?.length || 0;
            const category = template.category || 'general';
            
            return `
                <div class="template-card ${isListView ? 'list-view' : ''}" data-template="${key}">
                    <div class="template-icon">
                        <i class="fas ${template.icon || 'fa-file-code'}"></i>
                    </div>
                    <div class="template-content">
                        <div class="template-name">${template.name}</div>
                        <div class="template-description">${template.description}</div>
                        ${!isListView ? `
                        <div class="template-meta">
                            <div class="template-steps">
                                <i class="fas fa-layer-group"></i> ${stepCount} steps
                            </div>
                            <div class="template-category">${category}</div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="template-preview">Click to preview</div>
                </div>
            `;
        }).join('');

        // Add click handlers
        grid.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                const templateKey = card.dataset.template;
                this.showTemplateDetails(templateKey);
            });
        });
    }

    showTemplateDetails(templateKey) {
        const template = this.templates.templates[templateKey];
        if (!template) return;

        const modal = document.createElement('div');
        modal.className = 'template-details-modal';
        modal.innerHTML = `
            <div class="template-details-content">
                <div class="template-details-header">
                    <div>
                        <h3><i class="fas ${template.icon || 'fa-file-code'}"></i> ${template.name}</h3>
                        <p>${template.description}</p>
                    </div>
                    <button class="close-modal">
                        &times;
                    </button>
                </div>
                <div class="template-details-body">
                    <div class="template-steps-preview">
                        <h4>Pipeline Steps</h4>
                        ${this.renderStepsPreview(template.pipeline.steps)}
                    </div>
                </div>
                <div class="template-details-footer">
                    <button class="btn btn-secondary cancel-btn">
                        Cancel
                    </button>
                    <button class="btn btn-primary load-template-btn" data-template-key="${templateKey}">
                        <i class="fas fa-download"></i> Load Template
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.load-template-btn').addEventListener('click', (e) => {
            const key = e.currentTarget.dataset.templateKey;
            this.loadTemplate(key);
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    renderStepsPreview(steps) {
        return steps.map(step => {
            if (step === 'wait') {
                return `
                    <div class="step-preview">
                        <i class="fas fa-hourglass-half step-preview-icon"></i>
                        <span class="step-preview-label">Wait</span>
                        <span class="step-preview-type">wait</span>
                    </div>
                `;
            } else if (typeof step === 'object') {
                const icon = this.getStepIcon(step);
                const label = step.label || step.block || step.input || step.trigger || step.group || 'Step';
                const type = this.getStepType(step);
                
                return `
                    <div class="step-preview">
                        <i class="fas ${icon} step-preview-icon"></i>
                        <span class="step-preview-label">${label}</span>
                        <span class="step-preview-type">${type}</span>
                    </div>
                `;
            }
        }).join('');
    }

    getStepIcon(step) {
        if (step.block) return 'fa-hand-paper';
        if (step.input) return 'fa-keyboard';
        if (step.trigger) return 'fa-bolt';
        if (step.group) return 'fa-layer-group';
        return 'fa-terminal';
    }

    getStepType(step) {
        if (step.block) return 'block';
        if (step.input) return 'input';
        if (step.trigger) return 'trigger';
        if (step.group) return 'group';
        return 'command';
    }

    loadTemplate(templateKey) {
        if (this.templates && this.templates.loadTemplate) {
            this.templates.loadTemplate(templateKey);
            
            // Close modals
            document.querySelector('.template-details-modal')?.remove();
            document.getElementById('enhanced-templates-modal')?.classList.add('hidden');
            
            // Show notification
            const template = this.templates.templates[templateKey];
            if (template) {
                this.showNotification(`Loaded "${template.name}" template`, 'success');
            }
        }
    }

    importTemplate() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const templateData = JSON.parse(e.target.result);
                        const key = this.templates.importTemplate(templateData);
                        if (key) {
                            this.renderCategories();
                            this.renderTemplates();
                            this.showNotification('Template imported successfully', 'success');
                        }
                    } catch (error) {
                        this.showNotification('Failed to import template: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    exportCurrentAsTemplate() {
        if (!window.pipelineBuilder || window.pipelineBuilder.steps.length === 0) {
            this.showNotification('No pipeline to export', 'warning');
            return;
        }

        const name = prompt('Template name:');
        if (!name) return;

        const description = prompt('Template description:');
        
        const templateData = this.templates.exportTemplate(name, description || '');
        
        const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-template.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Template exported successfully', 'success');
    }

    showNotification(message, type = 'info') {
        if (window.mainInitializer && window.mainInitializer.showToast) {
            window.mainInitializer.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize
if (typeof window !== 'undefined') {
    window.TemplatesUI = TemplatesUI;
    
    // Function to initialize templates UI with embedded data
    const initializeTemplatesUI = () => {
        try {
            console.log('TemplatesUI: Starting initialization with embedded templates...');
            window.templatesUI = new TemplatesUI();
        } catch (error) {
            console.error('TemplatesUI: Error during initialization:', error);
            // Create instance anyway
            window.templatesUI = new TemplatesUI();
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTemplatesUI);
    } else {
        initializeTemplatesUI();
    }
    
    // Also expose a global function for showing templates
    window.showTemplatesModal = () => {
        if (window.templatesUI && window.templatesUI.showTemplatesModal) {
            window.templatesUI.showTemplatesModal();
        } else {
            console.log('TemplatesUI not initialized yet, initializing now...');
            initializeTemplatesUI();
            // Try immediately after initialization
            if (window.templatesUI && window.templatesUI.showTemplatesModal) {
                window.templatesUI.showTemplatesModal();
            }
        }
    };
    
    // Ensure initialization happens even if scripts load out of order
    window.addEventListener('load', () => {
        if (!window.templatesUI) {
            console.log('TemplatesUI: Running failsafe initialization on window load');
            initializeTemplatesUI();
        }
        
        // Force template button creation after a delay to ensure DOM is ready
        setTimeout(() => {
            console.log('TemplatesUI: Forcing Templates button creation...');
            if (!document.getElementById('templates-button')) {
                console.log('TemplatesUI: Templates button missing, creating now...');
                const actionsContainer = document.querySelector('.header-actions');
                if (actionsContainer) {
                    const templatesBtn = document.createElement('button');
                    templatesBtn.id = 'templates-button';
                    templatesBtn.className = 'btn btn-secondary';
                    
                    // Count templates from embedded templates
                    let templateCount = 17; // We have 17 embedded templates
                    
                    templatesBtn.innerHTML = `<i class="fas fa-file-code"></i> Templates${templateCount > 0 ? ` (${templateCount})` : ''}`;
                    templatesBtn.addEventListener('click', () => {
                        console.log('TemplatesUI: Templates button clicked');
                        
                        // Try multiple fallback approaches
                        if (window.templatesUI && window.templatesUI.showTemplatesModal) {
                            console.log('TemplatesUI: Using templatesUI.showTemplatesModal');
                            window.templatesUI.showTemplatesModal();
                        } else if (window.showTemplatesModal) {
                            console.log('TemplatesUI: Using window.showTemplatesModal');
                            window.showTemplatesModal();
                        } else {
                            // Fallback 1: Try old template modal
                            console.log('TemplatesUI: Trying fallback step-templates-modal');
                            const oldModal = document.getElementById('step-templates-modal');
                            if (oldModal) {
                                oldModal.style.display = 'block';
                                oldModal.classList.remove('hidden');
                                console.log('TemplatesUI: Opened step-templates-modal');
                            } else {
                                // Fallback 2: Try the app.js action handler
                                console.log('TemplatesUI: Trying app action handler');
                                if (window.app && window.app.handleQuickAction) {
                                    window.app.handleQuickAction('step-templates');
                                } else if (window.mainInitializer && window.mainInitializer.handleQuickAction) {
                                    window.mainInitializer.handleQuickAction('step-templates');
                                } else {
                                    // Final fallback: click the sidebar templates button
                                    console.log('TemplatesUI: Trying to click sidebar templates button');
                                    const sidebarBtn = document.getElementById('templates-btn');
                                    if (sidebarBtn) {
                                        sidebarBtn.click();
                                    } else {
                                        alert('Templates are not available. Please refresh the page.');
                                    }
                                }
                            }
                        }
                    });
                    
                    // Insert at the beginning of actions
                    actionsContainer.insertBefore(templatesBtn, actionsContainer.firstChild);
                    
                    console.log(`TemplatesUI: Force-created Templates button with ${templateCount} templates`);
                } else {
                    console.error('TemplatesUI: .header-actions container not found for forced creation');
                }
            } else {
                console.log('TemplatesUI: Templates button already exists');
            }
        }, 2000); // Wait for scripts to load but not too long
    });
}