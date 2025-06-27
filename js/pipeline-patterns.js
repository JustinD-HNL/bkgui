// js/pipeline-patterns.js
/**
 * Advanced Pipeline Patterns for Complex Buildkite Workflows
 * Demonstrates real-world patterns using enhanced features
 */

class PipelinePatterns {
    constructor() {
        this.patterns = this.initializePatterns();
    }

    initializePatterns() {
        return {
            'ci-cd': {
                name: 'Complete CI/CD Pipeline',
                description: 'Full CI/CD pipeline with testing, building, and staged deployment',
                category: 'deployment',
                complexity: 'intermediate',
                steps: this.generateCICDPattern()
            },
            'monorepo': {
                name: 'Monorepo Pipeline',
                description: 'Smart monorepo pipeline that only builds changed packages',
                category: 'monorepo',
                complexity: 'advanced',
                steps: this.generateMonorepoPattern()
            },
            'matrix-testing': {
                name: 'Matrix Testing Pipeline',
                description: 'Comprehensive testing across multiple environments and versions',
                category: 'testing',
                complexity: 'intermediate',
                steps: this.generateMatrixTestingPattern()
            },
            'staged-deployment': {
                name: 'Staged Deployment Pipeline',
                description: 'Multi-environment deployment with manual approvals',
                category: 'deployment',
                complexity: 'advanced',
                steps: this.generateStagedDeploymentPattern()
            },
            'microservices': {
                name: 'Microservices Pipeline',
                description: 'Orchestrated pipeline for microservices architecture',
                category: 'microservices',
                complexity: 'expert',
                steps: this.generateMicroservicesPattern()
            },
            'security-scanning': {
                name: 'Security-First Pipeline',
                description: 'Pipeline with comprehensive security scanning and compliance',
                category: 'security',
                complexity: 'intermediate',
                steps: this.generateSecurityScanningPattern()
            },
            'performance-testing': {
                name: 'Performance Testing Pipeline',
                description: 'Load testing and performance benchmarking pipeline',
                category: 'testing',
                complexity: 'advanced',
                steps: this.generatePerformanceTestingPattern()
            }
        };
    }

    generateCICDPattern() {
        return [
            {
                id: 'setup',
                type: 'command',
                label: 'Setup & Dependencies',
                icon: 'fas fa-download',
                properties: {
                    label: '🔧 Setup & Dependencies',
                    command: 'npm ci --production=false',
                    key: 'setup',
                    env: {
                        NODE_ENV: 'test',
                        CI: 'true'
                    },
                    agents: 'queue=default',
                    artifact_paths: ['node_modules.tar.gz'],
                    timeout_in_minutes: 5
                }
            },
            {
                id: 'parallel-checks',
                type: 'group',
                label: 'Quality Checks',
                icon: 'fas fa-check-circle',
                properties: {
                    label: '🔍 Quality Checks',
                    depends_on: ['setup'],
                    steps: [
                        {
                            label: '📝 Linting',
                            command: 'npm run lint',
                            plugins: {
                                'junit-annotate': {
                                    artifacts: 'lint-results.xml'
                                }
                            }
                        },
                        {
                            label: '🧪 Unit Tests',
                            command: 'npm test',
                            parallelism: 3,
                            artifact_paths: ['coverage/**/*', 'test-results.xml'],
                            plugins: {
                                'junit-annotate': {
                                    artifacts: 'test-results.xml'
                                }
                            }
                        },
                        {
                            label: '🔍 Type Checking',
                            command: 'npm run type-check',
                            if: 'build.env("TYPESCRIPT") == "true"'
                        }
                    ]
                }
            },
            {
                id: 'security-scan',
                type: 'command',
                label: 'Security Scan',
                icon: 'fas fa-shield-alt',
                properties: {
                    label: '🛡️ Security Scan',
                    command: 'npm audit --audit-level moderate',
                    depends_on: ['setup'],
                    allow_dependency_failure: true,
                    soft_fail: true,
                    if: 'build.branch == "main" || build.pull_request.target_branch == "main"'
                }
            },
            {
                id: 'wait-checks',
                type: 'wait',
                label: 'Wait for Checks',
                icon: 'fas fa-hourglass-half',
                properties: {
                    label: '⏳ Wait for Quality Checks',
                    continue_on_failure: false
                }
            },
            {
                id: 'build',
                type: 'command',
                label: 'Build Application',
                icon: 'fas fa-hammer',
                properties: {
                    label: '🏗️ Build Application',
                    command: 'npm run build',
                    key: 'build',
                    env: {
                        NODE_ENV: 'production'
                    },
                    artifact_paths: ['dist/**/*', 'build/**/*'],
                    timeout_in_minutes: 10,
                    retry: {
                        automatic: [
                            { exit_status: -1, limit: 2 },
                            { exit_status: 255, limit: 1 }
                        ]
                    }
                }
            },
            {
                id: 'e2e-tests',
                type: 'command',
                label: 'E2E Tests',
                icon: 'fas fa-robot',
                properties: {
                    label: '🤖 E2E Tests',
                    command: 'npm run test:e2e',
                    depends_on: ['build'],
                    matrix: {
                        setup: {
                            browser: ['chrome', 'firefox'],
                            viewport: ['desktop', 'mobile']
                        }
                    },
                    plugins: {
                        'docker': {
                            image: 'browserless/chrome',
                            always_pull: true
                        }
                    },
                    artifact_paths: ['e2e-screenshots/**/*', 'e2e-videos/**/*'],
                    timeout_in_minutes: 15
                }
            },
            {
                id: 'docker-build',
                type: 'command',
                label: 'Docker Build',
                icon: 'fab fa-docker',
                properties: {
                    label: '🐳 Docker Build & Push',
                    commands: [
                        'docker build -t $IMAGE_TAG .',
                        'docker push $IMAGE_TAG'
                    ],
                    depends_on: ['build'],
                    if: 'build.branch == "main"',
                    env: {
                        IMAGE_TAG: '$BUILDKITE_PIPELINE_SLUG:$BUILDKITE_COMMIT'
                    },
                    plugins: {
                        'ecr': {
                            login: true
                        }
                    },
                    agents: 'queue=docker'
                }
            },
            {
                id: 'deployment-gate',
                type: 'block',
                label: 'Deployment Gate',
                icon: 'fas fa-hand-paper',
                properties: {
                    label: '🚦 Deployment Approval',
                    prompt: 'Ready to deploy to staging?',
                    depends_on: ['docker-build', 'e2e-tests'],
                    if: 'build.branch == "main"',
                    fields: [
                        {
                            select: 'Environment',
                            key: 'deploy_env',
                            options: [
                                { label: 'Staging', value: 'staging' },
                                { label: 'Production', value: 'production' }
                            ],
                            default: 'staging'
                        },
                        {
                            text: 'Deployment Notes',
                            key: 'deploy_notes',
                            hint: 'Any special instructions for this deployment'
                        }
                    ]
                }
            },
            {
                id: 'deploy',
                type: 'command',
                label: 'Deploy',
                icon: 'fas fa-rocket',
                properties: {
                    label: '🚀 Deploy to $(buildkite-agent meta-data get "deploy_env")',
                    command: './scripts/deploy.sh',
                    depends_on: ['deployment-gate'],
                    concurrency: 1,
                    concurrency_group: 'deployment/${BUILDKITE_PIPELINE_SLUG}',
                    env: {
                        DEPLOY_ENV: '$(buildkite-agent meta-data get "deploy_env")',
                        DEPLOY_NOTES: '$(buildkite-agent meta-data get "deploy_notes")'
                    },
                    timeout_in_minutes: 20,
                    retry: {
                        manual: {
                            allowed: false,
                            reason: 'Deployments should not be retried manually'
                        }
                    }
                }
            },
            {
                id: 'post-deploy',
                type: 'group',
                label: 'Post-Deployment',
                icon: 'fas fa-check',
                properties: {
                    label: '✅ Post-Deployment Checks',
                    depends_on: ['deploy'],
                    steps: [
                        {
                            label: '🏥 Health Check',
                            command: './scripts/health-check.sh',
                            timeout_in_minutes: 5
                        },
                        {
                            label: '🔔 Notify Team',
                            command: './scripts/notify-deployment.sh',
                            soft_fail: true
                        }
                    ]
                }
            }
        ];
    }

    generateMonorepoPattern() {
        return [
            {
                id: 'analyze-changes',
                type: 'pipeline-upload',
                label: 'Analyze Changes',
                icon: 'fas fa-search',
                properties: {
                    label: '🔍 Analyze Changed Packages',
                    dynamic_script: './scripts/generate-monorepo-pipeline.sh',
                    command: './scripts/generate-monorepo-pipeline.sh | buildkite-agent pipeline upload'
                }
            },
            {
                id: 'shared-setup',
                type: 'command',
                label: 'Shared Setup',
                icon: 'fas fa-cog',
                properties: {
                    label: '⚙️ Shared Dependencies',
                    command: 'npm install --frozen-lockfile',
                    key: 'shared-setup',
                    artifact_paths: ['node_modules.tar.gz']
                }
            }
            // Dynamic steps would be generated by the pipeline upload script based on:
            // - Changed files detection
            // - Package dependency analysis
            // - Affected services identification
        ];
    }

    generateMatrixTestingPattern() {
        return [
            {
                id: 'setup',
                type: 'command',
                label: 'Setup',
                icon: 'fas fa-download',
                properties: {
                    label: '🔧 Install Dependencies',
                    command: 'npm ci',
                    key: 'setup'
                }
            },
            {
                id: 'matrix-tests',
                type: 'command',
                label: 'Matrix Tests',
                icon: 'fas fa-th',
                properties: {
                    label: '🧪 Test: Node {{matrix.node}} on {{matrix.os}}',
                    command: 'npm test',
                    depends_on: ['setup'],
                    matrix: {
                        setup: {
                            node: ['16', '18', '20'],
                            os: ['ubuntu', 'windows', 'macos']
                        },
                        adjustments: [
                            {
                                with: { os: 'windows', node: '16' },
                                soft_fail: true
                            }
                        ]
                    },
                    plugins: {
                        'junit-annotate': {
                            artifacts: 'test-results-{{matrix.node}}-{{matrix.os}}.xml',
                            context: 'tests-{{matrix.node}}-{{matrix.os}}'
                        }
                    },
                    artifact_paths: [
                        'test-results-{{matrix.node}}-{{matrix.os}}.xml',
                        'coverage-{{matrix.node}}-{{matrix.os}}/**/*'
                    ]
                }
            },
            {
                id: 'collect-results',
                type: 'command',
                label: 'Collect Results',
                icon: 'fas fa-chart-bar',
                properties: {
                    label: '📊 Collect Test Results',
                    command: './scripts/collect-matrix-results.sh',
                    depends_on: ['matrix-tests'],
                    allow_dependency_failure: true,
                    plugins: {
                        'junit-annotate': {
                            artifacts: 'combined-test-results.xml'
                        }
                    }
                }
            },
            {
                id: 'coverage-report',
                type: 'annotation',
                label: 'Coverage Report',
                icon: 'fas fa-chart-line',
                properties: {
                    label: '📈 Coverage Report',
                    command: 'buildkite-agent annotate --context coverage --style info < coverage-report.md',
                    depends_on: ['collect-results']
                }
            }
        ];
    }

    generateStagedDeploymentPattern() {
        return [
            {
                id: 'build-artifact',
                type: 'command',
                label: 'Build',
                icon: 'fas fa-hammer',
                properties: {
                    label: '🏗️ Build Release Artifact',
                    command: './scripts/build-release.sh',
                    key: 'build',
                    artifact_paths: ['release.tar.gz', 'version.txt']
                }
            },
            {
                id: 'deploy-dev',
                type: 'command',
                label: 'Deploy Dev',
                icon: 'fas fa-laptop-code',
                properties: {
                    label: '💻 Deploy to Development',
                    command: './scripts/deploy.sh dev',
                    depends_on: ['build'],
                    env: { ENVIRONMENT: 'dev' },
                    concurrency: 1,
                    concurrency_group: 'deploy/dev'
                }
            },
            {
                id: 'smoke-tests-dev',
                type: 'command',
                label: 'Smoke Tests Dev',
                icon: 'fas fa-smoke',
                properties: {
                    label: '💨 Smoke Tests (Dev)',
                    command: './scripts/smoke-tests.sh dev',
                    depends_on: ['deploy-dev'],
                    soft_fail: false
                }
            },
            {
                id: 'staging-gate',
                type: 'block',
                label: 'Staging Gate',
                icon: 'fas fa-hand-paper',
                properties: {
                    label: '🎭 Staging Deployment Gate',
                    prompt: 'Deploy to staging environment?',
                    depends_on: ['smoke-tests-dev'],
                    if: 'build.branch == "main"',
                    fields: [
                        {
                            select: 'Deployment Type',
                            key: 'deploy_type',
                            options: [
                                { label: 'Blue/Green', value: 'blue-green' },
                                { label: 'Rolling', value: 'rolling' },
                                { label: 'Canary', value: 'canary' }
                            ],
                            default: 'blue-green'
                        }
                    ]
                }
            },
            {
                id: 'deploy-staging',
                type: 'command',
                label: 'Deploy Staging',
                icon: 'fas fa-theater-masks',
                properties: {
                    label: '🎭 Deploy to Staging',
                    command: './scripts/deploy.sh staging',
                    depends_on: ['staging-gate'],
                    env: {
                        ENVIRONMENT: 'staging',
                        DEPLOY_TYPE: '$(buildkite-agent meta-data get "deploy_type")'
                    },
                    concurrency: 1,
                    concurrency_group: 'deploy/staging',
                    timeout_in_minutes: 15
                }
            },
            {
                id: 'integration-tests',
                type: 'command',
                label: 'Integration Tests',
                icon: 'fas fa-puzzle-piece',
                properties: {
                    label: '🧩 Integration Tests (Staging)',
                    command: './scripts/integration-tests.sh staging',
                    depends_on: ['deploy-staging'],
                    parallelism: 3,
                    artifact_paths: ['integration-test-results/**/*'],
                    timeout_in_minutes: 30
                }
            },
            {
                id: 'production-gate',
                type: 'input',
                label: 'Production Gate',
                icon: 'fas fa-rocket',
                properties: {
                    label: '🚀 Production Deployment Authorization',
                    prompt: 'Authorize production deployment',
                    depends_on: ['integration-tests'],
                    if: 'build.branch == "main"',
                    fields: [
                        {
                            text: 'Authorized By',
                            key: 'authorized_by',
                            required: true,
                            hint: 'Full name of person authorizing deployment'
                        },
                        {
                            text: 'Business Justification',
                            key: 'business_justification',
                            required: true
                        },
                        {
                            select: 'Maintenance Window',
                            key: 'maintenance_window',
                            options: [
                                { label: 'Standard Hours', value: 'standard' },
                                { label: 'After Hours', value: 'after-hours' },
                                { label: 'Emergency', value: 'emergency' }
                            ]
                        }
                    ]
                }
            },
            {
                id: 'deploy-production',
                type: 'command',
                label: 'Deploy Production',
                icon: 'fas fa-rocket',
                properties: {
                    label: '🚀 Deploy to Production',
                    command: './scripts/deploy.sh production',
                    depends_on: ['production-gate'],
                    env: {
                        ENVIRONMENT: 'production',
                        AUTHORIZED_BY: '$(buildkite-agent meta-data get "authorized_by")',
                        MAINTENANCE_WINDOW: '$(buildkite-agent meta-data get "maintenance_window")'
                    },
                    concurrency: 1,
                    concurrency_group: 'deploy/production',
                    timeout_in_minutes: 20,
                    retry: {
                        manual: {
                            allowed: false,
                            reason: 'Production deployments require re-authorization'
                        }
                    }
                }
            },
            {
                id: 'production-verification',
                type: 'group',
                label: 'Production Verification',
                icon: 'fas fa-check-double',
                properties: {
                    label: '✅ Production Verification',
                    depends_on: ['deploy-production'],
                    steps: [
                        {
                            label: '🏥 Health Checks',
                            command: './scripts/health-check.sh production',
                            timeout_in_minutes: 10
                        },
                        {
                            label: '📊 Performance Baseline',
                            command: './scripts/performance-check.sh',
                            timeout_in_minutes: 5,
                            soft_fail: true
                        },
                        {
                            label: '🔔 Notify Stakeholders',
                            command: './scripts/notify-deployment.sh production',
                            env: {
                                AUTHORIZED_BY: '$(buildkite-agent meta-data get "authorized_by")'
                            }
                        }
                    ]
                }
            }
        ];
    }

    generateMicroservicesPattern() {
        return [
            {
                id: 'service-discovery',
                type: 'pipeline-upload',
                label: 'Service Discovery',
                icon: 'fas fa-sitemap',
                properties: {
                    label: '🗺️ Discover Changed Services',
                    dynamic_script: './scripts/discover-services.sh',
                    command: './scripts/discover-services.sh | buildkite-agent pipeline upload'
                }
            },
            {
                id: 'shared-deps',
                type: 'command',
                label: 'Shared Dependencies',
                icon: 'fas fa-download',
                properties: {
                    label: '📦 Install Shared Dependencies',
                    command: './scripts/install-shared-deps.sh',
                    key: 'shared-deps'
                }
            }
            // The pipeline upload script would generate steps like:
            // - Individual service tests
            // - Service-specific builds
            // - Integration contract tests
            // - Cross-service dependency checks
            // - Orchestrated deployment sequence
        ];
    }

    generateSecurityScanningPattern() {
        return [
            {
                id: 'dependency-scan',
                type: 'command',
                label: 'Dependency Scan',
                icon: 'fas fa-shield-alt',
                properties: {
                    label: '🔍 Dependency Vulnerability Scan',
                    commands: [
                        'npm audit --json > dependency-audit.json',
                        'npm run security:deps'
                    ],
                    allow_dependency_failure: true,
                    artifact_paths: ['dependency-audit.json', 'security-reports/**/*'],
                    plugins: {
                        'junit-annotate': {
                            artifacts: 'security-results.xml'
                        }
                    }
                }
            },
            {
                id: 'code-scan',
                type: 'command',
                label: 'Code Security Scan',
                icon: 'fas fa-search',
                properties: {
                    label: '🔎 Static Code Security Analysis',
                    command: './scripts/security-scan.sh',
                    parallelism: 2,
                    artifact_paths: ['sast-results/**/*'],
                    timeout_in_minutes: 15
                }
            },
            {
                id: 'license-check',
                type: 'command',
                label: 'License Compliance',
                icon: 'fas fa-balance-scale',
                properties: {
                    label: '⚖️ License Compliance Check',
                    command: 'npm run license:check',
                    soft_fail: true,
                    artifact_paths: ['license-report.json']
                }
            },
            {
                id: 'secrets-scan',
                type: 'command',
                label: 'Secrets Scan',
                icon: 'fas fa-key',
                properties: {
                    label: '🔑 Secrets Detection Scan',
                    command: './scripts/scan-secrets.sh',
                    artifact_paths: ['secrets-scan-results.json']
                }
            },
            {
                id: 'wait-security',
                type: 'wait',
                label: 'Wait for Security',
                icon: 'fas fa-hourglass-half',
                properties: {
                    label: '⏳ Wait for Security Scans',
                    continue_on_failure: true
                }
            },
            {
                id: 'security-report',
                type: 'annotation',
                label: 'Security Report',
                icon: 'fas fa-file-shield',
                properties: {
                    label: '📋 Security Summary Report',
                    command: './scripts/generate-security-report.sh | buildkite-agent annotate --context security --style warning',
                    depends_on: ['wait-security']
                }
            },
            {
                id: 'security-gate',
                type: 'block',
                label: 'Security Gate',
                icon: 'fas fa-hand-paper',
                properties: {
                    label: '🛡️ Security Review Gate',
                    prompt: 'Security findings require review',
                    depends_on: ['security-report'],
                    if: 'build.env("SECURITY_GATE_REQUIRED") == "true"',
                    fields: [
                        {
                            select: 'Security Review Result',
                            key: 'security_review',
                            required: true,
                            options: [
                                { label: 'Approved - No issues', value: 'approved' },
                                { label: 'Approved - Acceptable risk', value: 'approved-risk' },
                                { label: 'Rejected - Security issues', value: 'rejected' }
                            ]
                        },
                        {
                            text: 'Security Officer Notes',
                            key: 'security_notes',
                            hint: 'Required for approval with risk'
                        }
                    ]
                }
            }
        ];
    }

    generatePerformanceTestingPattern() {
        return [
            {
                id: 'build-app',
                type: 'command',
                label: 'Build Application',
                icon: 'fas fa-hammer',
                properties: {
                    label: '🏗️ Build for Performance Testing',
                    command: 'npm run build:performance',
                    env: { NODE_ENV: 'production' },
                    artifact_paths: ['dist/**/*']
                }
            },
            {
                id: 'deploy-test-env',
                type: 'command',
                label: 'Deploy Test Environment',
                icon: 'fas fa-server',
                properties: {
                    label: '🖥️ Deploy to Performance Test Environment',
                    command: './scripts/deploy-test-env.sh',
                    depends_on: ['build-app'],
                    concurrency: 1,
                    concurrency_group: 'perf-test-env',
                    timeout_in_minutes: 10
                }
            },
            {
                id: 'load-tests',
                type: 'command',
                label: 'Load Tests',
                icon: 'fas fa-weight-hanging',
                properties: {
                    label: '⚖️ Load Testing ({{matrix.users}} users)',
                    command: './scripts/run-load-test.sh',
                    depends_on: ['deploy-test-env'],
                    matrix: {
                        setup: {
                            users: ['100', '500', '1000'],
                            duration: ['5m', '10m']
                        }
                    },
                    env: {
                        USERS: '{{matrix.users}}',
                        DURATION: '{{matrix.duration}}'
                    },
                    artifact_paths: [
                        'load-test-results-{{matrix.users}}-{{matrix.duration}}/**/*'
                    ],
                    timeout_in_minutes: 20
                }
            },
            {
                id: 'stress-test',
                type: 'command',
                label: 'Stress Test',
                icon: 'fas fa-heartbeat',
                properties: {
                    label: '💥 Stress Testing',
                    command: './scripts/stress-test.sh',
                    depends_on: ['deploy-test-env'],
                    allow_dependency_failure: true,
                    soft_fail: true,
                    artifact_paths: ['stress-test-results/**/*'],
                    timeout_in_minutes: 30
                }
            },
            {
                id: 'wait-tests',
                type: 'wait',
                label: 'Wait for Tests',
                icon: 'fas fa-hourglass-half',
                properties: {
                    label: '⏳ Wait for Performance Tests',
                    continue_on_failure: true
                }
            },
            {
                id: 'performance-analysis',
                type: 'command',
                label: 'Performance Analysis',
                icon: 'fas fa-chart-line',
                properties: {
                    label: '📊 Analyze Performance Results',
                    command: './scripts/analyze-performance.sh',
                    depends_on: ['wait-tests'],
                    artifact_paths: ['performance-report.html', 'performance-summary.json']
                }
            },
            {
                id: 'performance-report',
                type: 'annotation',
                label: 'Performance Report',
                icon: 'fas fa-tachometer-alt',
                properties: {
                    label: '🏁 Performance Report',
                    command: 'buildkite-agent annotate --context performance --style info < performance-summary.md',
                    depends_on: ['performance-analysis']
                }
            },
            {
                id: 'cleanup-env',
                type: 'command',
                label: 'Cleanup',
                icon: 'fas fa-broom',
                properties: {
                    label: '🧹 Cleanup Test Environment',
                    command: './scripts/cleanup-test-env.sh',
                    depends_on: ['performance-analysis'],
                    allow_dependency_failure: true,
                    soft_fail: true
                }
            }
        ];
    }

    // Helper methods to apply patterns
    applyPattern(patternKey) {
        const pattern = this.patterns[patternKey];
        if (!pattern) {
            console.error('Pattern not found:', patternKey);
            return;
        }

        // Clear existing pipeline
        if (window.pipelineBuilder) {
            if (window.pipelineBuilder.steps.length > 0 && 
                !confirm(`Replace current pipeline with "${pattern.name}" pattern?`)) {
                return;
            }
            
            // Apply the pattern
            window.pipelineBuilder.steps = pattern.steps.map((step, index) => ({
                ...step,
                id: step.id || `step-${Date.now()}-${index}`
            }));
            
            window.pipelineBuilder.stepCounter = pattern.steps.length;
            window.pipelineBuilder.selectedStep = null;
            window.pipelineBuilder.renderPipeline();
            window.pipelineBuilder.renderProperties();
            
            console.log(`Applied pattern: ${pattern.name}`);
        }
    }

    getPatternCategories() {
        const categories = {};
        Object.values(this.patterns).forEach(pattern => {
            if (!categories[pattern.category]) {
                categories[pattern.category] = [];
            }
            categories[pattern.category].push(pattern);
        });
        return categories;
    }

    getPatternsByComplexity(complexity) {
        return Object.entries(this.patterns).filter(([key, pattern]) => 
            pattern.complexity === complexity
        );
    }
}

// Make patterns available globally
window.pipelinePatterns = new PipelinePatterns();

// Extend the enhanced pipeline builder with pattern functionality
if (window.pipelineBuilder) {
    window.pipelineBuilder.addPattern = function(patternKey) {
        window.pipelinePatterns.applyPattern(patternKey);
    };
}