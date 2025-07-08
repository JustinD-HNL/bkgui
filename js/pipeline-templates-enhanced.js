// js/pipeline-templates-enhanced.js
/**
 * Enhanced Pipeline Templates with comprehensive CI/CD patterns
 * Based on Buildkite best practices and real-world examples
 */

class EnhancedPipelineTemplates {
    constructor() {
        this.templates = {
            // Comprehensive CI/CD Templates
            'cicd-complete': {
                name: 'Complete CI/CD Pipeline',
                icon: 'fa-infinity',
                category: 'ci-cd',
                description: 'Full CI/CD pipeline with build, test, security scan, and multi-environment deployment',
                pipeline: {
                    steps: [
                        {
                            label: '🔧 Setup & Dependencies',
                            key: 'setup',
                            command: `
                                echo "Installing dependencies..."
                                npm ci --prefer-offline --no-audit
                                echo "Dependency installation complete"
                            `,
                            agents: { queue: 'default' },
                            artifact_paths: 'node_modules/**/*',
                            plugins: {
                                'cache': {
                                    key: 'npm-packages-{{ checksum "package-lock.json" }}',
                                    paths: ['node_modules']
                                }
                            }
                        },
                        {
                            group: '🔍 Code Quality',
                            key: 'code-quality',
                            depends_on: ['setup'],
                            steps: [
                                {
                                    label: '📏 Linting',
                                    key: 'lint',
                                    command: 'npm run lint',
                                    agents: { queue: 'default' },
                                    soft_fail: { exit_status: [1] }
                                },
                                {
                                    label: '🎨 Code Formatting',
                                    key: 'format-check',
                                    command: 'npm run format:check',
                                    agents: { queue: 'default' }
                                },
                                {
                                    label: '📊 Type Check',
                                    key: 'typecheck',
                                    command: 'npm run typecheck',
                                    agents: { queue: 'default' }
                                }
                            ]
                        },
                        {
                            group: '🧪 Testing',
                            key: 'testing',
                            depends_on: ['setup'],
                            steps: [
                                {
                                    label: '🧪 Unit Tests',
                                    key: 'unit-tests',
                                    command: `
                                        npm run test:unit -- --coverage
                                        echo "--- :codecov: Upload coverage"
                                        bash <(curl -s https://codecov.io/bash)
                                    `,
                                    agents: { queue: 'default' },
                                    artifact_paths: [
                                        'coverage/**/*',
                                        'test-results/**/*'
                                    ],
                                    plugins: {
                                        'junit-annotate': {
                                            artifacts: 'test-results/junit.xml'
                                        }
                                    }
                                },
                                {
                                    label: '🔗 Integration Tests',
                                    key: 'integration-tests',
                                    command: 'npm run test:integration',
                                    agents: { queue: 'default' },
                                    timeout_in_minutes: 30,
                                    retry: {
                                        automatic: {
                                            exit_status: '*',
                                            limit: 2
                                        }
                                    }
                                },
                                {
                                    label: '🌐 E2E Tests',
                                    key: 'e2e-tests',
                                    command: 'npm run test:e2e',
                                    agents: { queue: 'e2e-runners' },
                                    parallelism: 5,
                                    artifact_paths: 'cypress/screenshots/**/*'
                                }
                            ]
                        },
                        {
                            label: '🔒 Security Scan',
                            key: 'security',
                            depends_on: ['setup'],
                            command: `
                                echo "--- :shield: Running security audit"
                                npm audit --production
                                echo "--- :mag: Running SAST scan"
                                semgrep --config=auto --json -o security-report.json .
                            `,
                            agents: { queue: 'security' },
                            soft_fail: true,
                            artifact_paths: 'security-report.json'
                        },
                        'wait',
                        {
                            label: '🏗️ Build Application',
                            key: 'build',
                            command: `
                                echo "--- :hammer: Building application"
                                npm run build
                                echo "--- :package: Creating artifacts"
                                tar -czf dist.tar.gz dist/
                            `,
                            agents: { queue: 'builders' },
                            artifact_paths: [
                                'dist/**/*',
                                'dist.tar.gz'
                            ]
                        },
                        {
                            label: '🐳 Build Docker Image',
                            key: 'docker-build',
                            depends_on: ['build'],
                            plugins: {
                                'docker-compose': {
                                    build: 'app',
                                    image: 'myapp:${BUILDKITE_BUILD_NUMBER}',
                                    args: {
                                        BUILDKIT_INLINE_CACHE: '1'
                                    }
                                }
                            },
                            agents: { docker: 'true' }
                        },
                        'wait',
                        {
                            block: '🚀 Deploy to Staging',
                            key: 'deploy-staging-gate',
                            branches: 'main develop',
                            fields: [
                                {
                                    text: 'Release Notes',
                                    key: 'release-notes',
                                    required: false,
                                    hint: 'What changes are included in this release?'
                                }
                            ]
                        },
                        {
                            label: '🚀 Deploy to Staging',
                            key: 'deploy-staging',
                            depends_on: ['deploy-staging-gate'],
                            command: `
                                echo "--- :rocket: Deploying to staging"
                                ./deploy.sh staging \${BUILDKITE_BUILD_NUMBER}
                                echo "--- :link: Application URL"
                                echo "https://staging.myapp.com"
                            `,
                            agents: { queue: 'deploy' },
                            env: {
                                ENVIRONMENT: 'staging'
                            },
                            concurrency: 1,
                            concurrency_group: 'deploy-staging'
                        },
                        {
                            label: '🧪 Smoke Tests - Staging',
                            key: 'smoke-tests-staging',
                            depends_on: ['deploy-staging'],
                            command: 'npm run test:smoke -- --env=staging',
                            agents: { queue: 'default' },
                            retry: {
                                automatic: {
                                    exit_status: '*',
                                    limit: 3
                                }
                            }
                        },
                        'wait',
                        {
                            block: '🚀 Deploy to Production',
                            key: 'deploy-prod-gate',
                            branches: 'main',
                            fields: [
                                {
                                    text: 'Deployment Checklist',
                                    key: 'checklist',
                                    required: true,
                                    select: [
                                        { label: 'Database migrations reviewed', value: 'db-reviewed' },
                                        { label: 'Rollback plan prepared', value: 'rollback-ready' },
                                        { label: 'Team notified', value: 'team-notified' },
                                        { label: 'All checks passed', value: 'all-passed' }
                                    ],
                                    multiple: true
                                }
                            ]
                        },
                        {
                            trigger: 'production-deploy',
                            label: '🚀 Trigger Production Deploy',
                            depends_on: ['deploy-prod-gate', 'smoke-tests-staging'],
                            branches: 'main',
                            build: {
                                message: 'Production deployment for ${BUILDKITE_BUILD_NUMBER}',
                                env: {
                                    BUILD_NUMBER: '${BUILDKITE_BUILD_NUMBER}',
                                    RELEASE_NOTES: '${BUILDKITE_BUILD_META_DATA_RELEASE_NOTES}'
                                }
                            }
                        }
                    ]
                }
            },

            // Testing-focused Templates
            'testing-comprehensive': {
                name: 'Comprehensive Testing Suite',
                icon: 'fa-vial',
                category: 'testing',
                description: 'Complete testing pipeline with unit, integration, E2E, performance, and visual regression tests',
                pipeline: {
                    steps: [
                        {
                            label: '📦 Test Environment Setup',
                            key: 'test-setup',
                            command: `
                                echo "--- :package: Installing dependencies"
                                npm ci
                                echo "--- :database: Setting up test database"
                                docker-compose -f docker-compose.test.yml up -d
                                ./scripts/wait-for-db.sh
                            `,
                            agents: { queue: 'test-runners' },
                            plugins: {
                                'docker-compose': {
                                    run: 'test-db',
                                    config: 'docker-compose.test.yml'
                                }
                            }
                        },
                        {
                            group: '🧪 Test Execution',
                            key: 'test-execution',
                            depends_on: ['test-setup'],
                            steps: [
                                {
                                    label: '🧪 Unit Tests',
                                    key: 'unit',
                                    command: `
                                        echo "--- :test_tube: Running unit tests"
                                        npm run test:unit -- --coverage --reporters=default --reporters=jest-junit
                                    `,
                                    agents: { queue: 'test-runners' },
                                    artifact_paths: [
                                        'coverage/**/*',
                                        'junit.xml'
                                    ],
                                    plugins: {
                                        'junit-annotate': {
                                            artifacts: 'junit.xml',
                                            'job-uuid-file-pattern': '_(*).xml'
                                        }
                                    }
                                },
                                {
                                    label: '🔗 Integration Tests',
                                    key: 'integration',
                                    command: `
                                        echo "--- :link: Running integration tests"
                                        npm run test:integration -- --forceExit
                                    `,
                                    agents: { queue: 'test-runners' },
                                    timeout_in_minutes: 45,
                                    retry: {
                                        automatic: {
                                            exit_status: [1],
                                            limit: 2
                                        }
                                    }
                                },
                                {
                                    label: '🌐 E2E Tests',
                                    key: 'e2e',
                                    command: `
                                        echo "--- :globe_with_meridians: Running E2E tests"
                                        npm run test:e2e -- --record --parallel
                                    `,
                                    agents: { queue: 'e2e-runners' },
                                    parallelism: 10,
                                    artifact_paths: [
                                        'cypress/screenshots/**/*',
                                        'cypress/videos/**/*'
                                    ],
                                    plugins: {
                                        'artifacts': {
                                            upload: 'cypress/screenshots/**/*;cypress/videos/**/*',
                                            compress: true
                                        }
                                    }
                                },
                                {
                                    label: '⚡ Performance Tests',
                                    key: 'performance',
                                    command: `
                                        echo "--- :zap: Running performance tests"
                                        npm run test:performance
                                        echo "--- :chart_with_upwards_trend: Generating performance report"
                                        npm run performance:report
                                    `,
                                    agents: { 
                                        queue: 'performance',
                                        memory: '8GB'
                                    },
                                    artifact_paths: 'performance-report/**/*'
                                },
                                {
                                    label: '🎨 Visual Regression Tests',
                                    key: 'visual-regression',
                                    command: `
                                        echo "--- :art: Running visual regression tests"
                                        npm run test:visual
                                    `,
                                    agents: { queue: 'test-runners' },
                                    artifact_paths: [
                                        '.percy/screenshots/**/*',
                                        'visual-diff/**/*'
                                    ],
                                    soft_fail: { exit_status: [1] }
                                },
                                {
                                    label: '♿ Accessibility Tests',
                                    key: 'a11y',
                                    command: `
                                        echo "--- :wheelchair: Running accessibility tests"
                                        npm run test:a11y
                                    `,
                                    agents: { queue: 'test-runners' },
                                    artifact_paths: 'a11y-report/**/*'
                                }
                            ]
                        },
                        {
                            label: '🧹 Test Cleanup',
                            key: 'cleanup',
                            command: `
                                echo "--- :broom: Cleaning up test environment"
                                docker-compose -f docker-compose.test.yml down -v
                            `,
                            agents: { queue: 'test-runners' },
                            allow_dependency_failure: true
                        },
                        'wait',
                        {
                            label: '📊 Test Report Generation',
                            key: 'test-report',
                            command: `
                                echo "--- :bar_chart: Generating test report"
                                buildkite-agent artifact download "coverage/**/*" .
                                buildkite-agent artifact download "performance-report/**/*" .
                                npm run test:report:generate
                            `,
                            agents: { queue: 'default' },
                            artifact_paths: [
                                'test-report.html',
                                'test-summary.json'
                            ]
                        },
                        {
                            label: '📈 Upload Test Metrics',
                            key: 'metrics',
                            command: `
                                echo "--- :chart_with_upwards_trend: Uploading test metrics"
                                buildkite-agent artifact download "test-summary.json" .
                                ./scripts/upload-test-metrics.sh
                            `,
                            agents: { queue: 'default' }
                        }
                    ]
                }
            },

            // Deployment Templates
            'deployment-bluegreen': {
                name: 'Blue-Green Deployment',
                icon: 'fa-exchange-alt',
                category: 'deployment',
                description: 'Zero-downtime blue-green deployment strategy with automated rollback',
                pipeline: {
                    steps: [
                        {
                            label: '🔍 Pre-deployment Checks',
                            key: 'pre-checks',
                            command: `
                                echo "--- :mag: Checking deployment prerequisites"
                                ./scripts/pre-deployment-checks.sh
                                echo "--- :heart: Health check current production"
                                curl -f https://api.myapp.com/health || exit 1
                            `,
                            agents: { queue: 'deploy' }
                        },
                        {
                            label: '🏗️ Build Deployment Artifact',
                            key: 'build-artifact',
                            command: `
                                echo "--- :package: Building deployment package"
                                ./scripts/build-deployment.sh
                                echo "--- :arrow_up: Uploading to artifact store"
                                aws s3 cp deployment.zip s3://artifacts/\${BUILDKITE_BUILD_NUMBER}.zip
                            `,
                            agents: { queue: 'builders' },
                            artifact_paths: 'deployment.zip'
                        },
                        {
                            label: '🔵 Deploy to Blue Environment',
                            key: 'deploy-blue',
                            depends_on: ['pre-checks', 'build-artifact'],
                            command: `
                                echo "--- :large_blue_circle: Deploying to blue environment"
                                ./scripts/deploy.sh blue \${BUILDKITE_BUILD_NUMBER}
                                echo "--- :hourglass: Waiting for blue environment to be ready"
                                ./scripts/wait-for-deployment.sh blue
                            `,
                            agents: { queue: 'deploy' },
                            timeout_in_minutes: 30
                        },
                        {
                            label: '🧪 Validate Blue Deployment',
                            key: 'validate-blue',
                            depends_on: ['deploy-blue'],
                            command: `
                                echo "--- :test_tube: Running smoke tests on blue"
                                npm run test:smoke -- --env=blue
                                echo "--- :chart: Running performance baseline"
                                npm run test:performance:baseline -- --env=blue
                            `,
                            agents: { queue: 'test-runners' }
                        },
                        'wait',
                        {
                            block: '🔄 Switch Traffic to Blue',
                            key: 'switch-traffic',
                            fields: [
                                {
                                    text: 'Traffic Switch Strategy',
                                    key: 'switch-strategy',
                                    select: [
                                        { label: 'Instant switch (100%)', value: 'instant' },
                                        { label: 'Gradual (10% → 50% → 100%)', value: 'gradual' },
                                        { label: 'Canary (5% for 30min)', value: 'canary' }
                                    ],
                                    required: true,
                                    default: 'gradual'
                                }
                            ]
                        },
                        {
                            label: '🔄 Execute Traffic Switch',
                            key: 'traffic-switch',
                            depends_on: ['switch-traffic'],
                            command: `
                                STRATEGY=\${BUILDKITE_BUILD_META_DATA_SWITCH_STRATEGY:-gradual}
                                echo "--- :twisted_rightwards_arrows: Switching traffic using \$STRATEGY strategy"
                                ./scripts/switch-traffic.sh blue \$STRATEGY
                            `,
                            agents: { queue: 'deploy' }
                        },
                        {
                            label: '📊 Monitor New Deployment',
                            key: 'monitor',
                            depends_on: ['traffic-switch'],
                            command: `
                                echo "--- :chart_with_downwards_trend: Monitoring error rates"
                                ./scripts/monitor-deployment.sh blue 300
                            `,
                            agents: { queue: 'deploy' },
                            timeout_in_minutes: 10
                        },
                        {
                            label: '🟢 Decommission Green',
                            key: 'decommission-green',
                            depends_on: ['monitor'],
                            command: `
                                echo "--- :large_green_circle: Decommissioning old green environment"
                                ./scripts/decommission.sh green
                            `,
                            agents: { queue: 'deploy' },
                            soft_fail: true
                        },
                        'wait',
                        {
                            label: '🔙 Rollback Preparation',
                            key: 'rollback-prep',
                            command: `
                                echo "--- :back: Preparing rollback plan"
                                ./scripts/prepare-rollback.sh blue green
                            `,
                            agents: { queue: 'deploy' },
                            allow_dependency_failure: true
                        }
                    ]
                }
            },

            'deployment-canary': {
                name: 'Canary Deployment',
                icon: 'fa-feather',
                category: 'deployment',
                description: 'Progressive canary deployment with automated metrics-based promotion',
                pipeline: {
                    steps: [
                        {
                            label: '📊 Baseline Metrics',
                            key: 'baseline',
                            command: `
                                echo "--- :chart: Capturing baseline metrics"
                                ./scripts/capture-baseline-metrics.sh
                            `,
                            agents: { queue: 'deploy' },
                            artifact_paths: 'baseline-metrics.json'
                        },
                        {
                            label: '🐤 Deploy Canary (5%)',
                            key: 'deploy-canary-5',
                            command: `
                                echo "--- :hatching_chick: Deploying canary to 5% of traffic"
                                kubectl set image deployment/app app=myapp:\${BUILDKITE_BUILD_NUMBER}
                                kubectl scale deployment/app-canary --replicas=1
                                ./scripts/route-traffic.sh canary 5
                            `,
                            agents: { queue: 'deploy', kubernetes: 'true' }
                        },
                        {
                            label: '⏱️ Monitor Canary (5 min)',
                            key: 'monitor-5',
                            depends_on: ['deploy-canary-5'],
                            command: `
                                echo "--- :stopwatch: Monitoring canary at 5%"
                                ./scripts/monitor-canary.sh 5 300
                            `,
                            agents: { queue: 'deploy' }
                        },
                        {
                            label: '🐥 Promote Canary (25%)',
                            key: 'deploy-canary-25',
                            depends_on: ['monitor-5'],
                            command: `
                                echo "--- :hatched_chick: Promoting canary to 25% of traffic"
                                kubectl scale deployment/app-canary --replicas=5
                                ./scripts/route-traffic.sh canary 25
                            `,
                            agents: { queue: 'deploy', kubernetes: 'true' }
                        },
                        {
                            label: '⏱️ Monitor Canary (10 min)',
                            key: 'monitor-25',
                            depends_on: ['deploy-canary-25'],
                            command: `
                                echo "--- :stopwatch: Monitoring canary at 25%"
                                ./scripts/monitor-canary.sh 25 600
                            `,
                            agents: { queue: 'deploy' }
                        },
                        'wait',
                        {
                            block: '🚀 Full Rollout',
                            key: 'full-rollout-approval',
                            fields: [
                                {
                                    text: 'Canary Metrics Review',
                                    key: 'metrics-ok',
                                    select: 'All metrics healthy\nMinor degradation\nNeeds investigation',
                                    required: true
                                }
                            ]
                        },
                        {
                            label: '🚀 Full Rollout (100%)',
                            key: 'full-rollout',
                            depends_on: ['full-rollout-approval'],
                            command: `
                                echo "--- :rocket: Rolling out to 100%"
                                kubectl set image deployment/app app=myapp:\${BUILDKITE_BUILD_NUMBER}
                                kubectl scale deployment/app --replicas=20
                                kubectl scale deployment/app-canary --replicas=0
                            `,
                            agents: { queue: 'deploy', kubernetes: 'true' }
                        }
                    ]
                }
            },

            // Microservices Templates
            'microservices-monorepo': {
                name: 'Microservices Monorepo',
                icon: 'fa-cubes',
                category: 'microservices',
                description: 'Intelligent monorepo pipeline that builds only changed services',
                pipeline: {
                    steps: [
                        {
                            label: '🔍 Detect Changed Services',
                            key: 'detect-changes',
                            command: `
                                echo "--- :mag: Detecting changed services"
                                git diff --name-only origin/main...HEAD | grep -E "^services/" | cut -d/ -f2 | sort -u > changed-services.txt
                                
                                if [ ! -s changed-services.txt ]; then
                                    echo "No service changes detected"
                                    exit 0
                                fi
                                
                                echo "Changed services:"
                                cat changed-services.txt
                            `,
                            agents: { queue: 'default' },
                            artifact_paths: 'changed-services.txt'
                        },
                        {
                            label: '🏗️ Build Changed Services',
                            key: 'build-services',
                            depends_on: ['detect-changes'],
                            command: `
                                buildkite-agent artifact download changed-services.txt .
                                
                                if [ ! -s changed-services.txt ]; then
                                    echo "No services to build"
                                    exit 0
                                fi
                                
                                SERVICE=\${SERVICE:-unknown}
                                echo "--- :hammer: Building service: \$SERVICE"
                                
                                cd services/\$SERVICE
                                docker build -t \$SERVICE:\${BUILDKITE_BUILD_NUMBER} .
                                docker tag \$SERVICE:\${BUILDKITE_BUILD_NUMBER} \$SERVICE:latest
                            `,
                            agents: { docker: 'true' },
                            matrix_setup: {
                                SERVICE: '$(cat changed-services.txt)'
                            },
                            soft_fail: { exit_status: [100] }
                        },
                        {
                            label: '🧪 Test Changed Services',
                            key: 'test-services',
                            depends_on: ['build-services'],
                            command: `
                                SERVICE=\${SERVICE:-unknown}
                                echo "--- :test_tube: Testing service: \$SERVICE"
                                
                                cd services/\$SERVICE
                                docker-compose -f docker-compose.test.yml run --rm test
                            `,
                            agents: { docker: 'true' },
                            matrix_setup: {
                                SERVICE: '$(cat changed-services.txt)'
                            },
                            parallelism: 3
                        },
                        {
                            label: '🔗 Integration Tests',
                            key: 'integration-tests',
                            depends_on: ['test-services'],
                            command: `
                                echo "--- :link: Running cross-service integration tests"
                                docker-compose -f docker-compose.integration.yml up --abort-on-container-exit
                            `,
                            agents: { docker: 'true' },
                            timeout_in_minutes: 30
                        },
                        'wait',
                        {
                            label: '📤 Push Service Images',
                            key: 'push-images',
                            branches: 'main develop',
                            command: `
                                SERVICE=\${SERVICE:-unknown}
                                echo "--- :arrow_up: Pushing \$SERVICE image"
                                
                                docker tag \$SERVICE:\${BUILDKITE_BUILD_NUMBER} registry.mycompany.com/\$SERVICE:\${BUILDKITE_BUILD_NUMBER}
                                docker push registry.mycompany.com/\$SERVICE:\${BUILDKITE_BUILD_NUMBER}
                                
                                if [[ "\${BUILDKITE_BRANCH}" == "main" ]]; then
                                    docker tag \$SERVICE:\${BUILDKITE_BUILD_NUMBER} registry.mycompany.com/\$SERVICE:latest
                                    docker push registry.mycompany.com/\$SERVICE:latest
                                fi
                            `,
                            agents: { docker: 'true' },
                            matrix_setup: {
                                SERVICE: '$(cat changed-services.txt)'
                            }
                        },
                        {
                            trigger: 'deploy-services',
                            label: '🚀 Trigger Service Deployments',
                            build: {
                                message: 'Deploy changed services from ${BUILDKITE_COMMIT}',
                                env: {
                                    CHANGED_SERVICES: '$(cat changed-services.txt | tr \'\\n\' \' \')',
                                    BUILD_NUMBER: '${BUILDKITE_BUILD_NUMBER}'
                                }
                            },
                            branches: 'main'
                        }
                    ]
                }
            },

            'microservices-kubernetes': {
                name: 'Kubernetes Microservices',
                icon: 'fa-dharmachakra',
                category: 'microservices',
                description: 'Deploy microservices to Kubernetes with Helm charts and GitOps',
                pipeline: {
                    steps: [
                        {
                            label: '📋 Validate Manifests',
                            key: 'validate',
                            command: `
                                echo "--- :clipboard: Validating Kubernetes manifests"
                                kubeval manifests/**/*.yaml
                                
                                echo "--- :helm: Validating Helm charts"
                                helm lint charts/*
                            `,
                            agents: { queue: 'k8s-tools' }
                        },
                        {
                            label: '🔒 Security Scan',
                            key: 'security',
                            command: `
                                echo "--- :shield: Scanning for security issues"
                                kubesec scan manifests/**/*.yaml
                                
                                echo "--- :lock: Checking RBAC policies"
                                ./scripts/validate-rbac.sh
                            `,
                            agents: { queue: 'security' },
                            soft_fail: { exit_status: [1] }
                        },
                        {
                            label: '📦 Package Helm Charts',
                            key: 'package-helm',
                            command: `
                                echo "--- :package: Packaging Helm charts"
                                for chart in charts/*/; do
                                    helm package \$chart
                                done
                                
                                echo "--- :arrow_up: Uploading to chart repository"
                                for package in *.tgz; do
                                    curl -F "chart=@\$package" https://charts.mycompany.com/api/charts
                                done
                            `,
                            agents: { queue: 'k8s-tools' },
                            artifact_paths: '*.tgz'
                        },
                        'wait',
                        {
                            label: '🚀 Deploy to Development',
                            key: 'deploy-dev',
                            command: `
                                echo "--- :rocket: Deploying to development cluster"
                                kubectl config use-context dev-cluster
                                
                                helmfile -e development sync
                            `,
                            agents: { 
                                queue: 'deploy',
                                kubernetes: 'dev'
                            }
                        },
                        {
                            label: '🧪 Run Service Mesh Tests',
                            key: 'mesh-tests',
                            depends_on: ['deploy-dev'],
                            command: `
                                echo "--- :spider_web: Testing service mesh"
                                ./scripts/test-istio-policies.sh
                                
                                echo "--- :bar_chart: Checking observability"
                                ./scripts/verify-metrics.sh
                            `,
                            agents: { 
                                queue: 'k8s-tools',
                                kubernetes: 'dev'
                            }
                        },
                        'wait',
                        {
                            block: '🚀 Deploy to Production',
                            key: 'prod-gate',
                            branches: 'main',
                            fields: [
                                {
                                    text: 'Target Environment',
                                    key: 'environment',
                                    select: [
                                        { label: 'US-East', value: 'us-east' },
                                        { label: 'EU-West', value: 'eu-west' },
                                        { label: 'APAC', value: 'apac' },
                                        { label: 'All Regions', value: 'all' }
                                    ],
                                    required: true
                                }
                            ]
                        },
                        {
                            label: '🌍 Deploy to Production',
                            key: 'deploy-prod',
                            depends_on: ['prod-gate'],
                            command: `
                                ENVIRONMENT=\${BUILDKITE_BUILD_META_DATA_ENVIRONMENT}
                                echo "--- :earth_americas: Deploying to \$ENVIRONMENT"
                                
                                if [[ "\$ENVIRONMENT" == "all" ]]; then
                                    for region in us-east eu-west apac; do
                                        echo "--- Deploying to \$region"
                                        kubectl config use-context prod-\$region
                                        helmfile -e production sync
                                    done
                                else
                                    kubectl config use-context prod-\$ENVIRONMENT
                                    helmfile -e production sync
                                fi
                            `,
                            agents: { 
                                queue: 'deploy',
                                kubernetes: 'prod'
                            }
                        }
                    ]
                }
            },

            // Additional specialized templates
            'feature-branch-workflow': {
                name: 'Feature Branch Workflow',
                icon: 'fa-code-branch',
                category: 'workflow',
                description: 'Automated feature branch workflow with PR checks and auto-merge',
                pipeline: {
                    steps: [
                        {
                            label: '🔍 PR Validation',
                            key: 'pr-validation',
                            command: `
                                echo "--- :mag: Validating pull request"
                                ./scripts/validate-pr.sh
                            `,
                            agents: { queue: 'default' },
                            branches: '!main'
                        },
                        {
                            group: '✅ PR Checks',
                            key: 'pr-checks',
                            branches: '!main',
                            steps: [
                                {
                                    label: '📏 Lint',
                                    command: 'npm run lint',
                                    agents: { queue: 'default' }
                                },
                                {
                                    label: '🧪 Tests',
                                    command: 'npm test',
                                    agents: { queue: 'default' }
                                },
                                {
                                    label: '📊 Coverage',
                                    command: 'npm run test:coverage',
                                    agents: { queue: 'default' },
                                    soft_fail: { exit_status: [1] }
                                }
                            ]
                        },
                        {
                            label: '🔐 Security Check',
                            key: 'security-check',
                            command: 'npm audit',
                            agents: { queue: 'security' },
                            branches: '!main',
                            soft_fail: true
                        },
                        'wait',
                        {
                            label: '✅ Update PR Status',
                            key: 'update-pr',
                            command: `
                                echo "--- :github: Updating PR status"
                                ./scripts/update-pr-status.sh success
                            `,
                            agents: { queue: 'default' },
                            branches: '!main'
                        }
                    ]
                }
            }
        };

        // Merge with existing templates
        if (window.pipelineTemplates && window.pipelineTemplates.templates) {
            Object.assign(this.templates, window.pipelineTemplates.templates);
        }
    }

    getTemplatesByCategory(category) {
        return Object.entries(this.templates)
            .filter(([_, template]) => template.category === category)
            .map(([key, template]) => ({ key, ...template }));
    }

    getAllCategories() {
        const categories = new Set();
        Object.values(this.templates).forEach(template => {
            if (template.category) {
                categories.add(template.category);
            }
        });
        return Array.from(categories);
    }

    // Override the loadTemplate method to handle matrix setup
    loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template || !window.pipelineBuilder) {
            console.error(`Template ${templateKey} not found or pipeline builder not available`);
            return;
        }

        // Clear existing pipeline
        window.pipelineBuilder.clearPipeline();
        
        // Load template steps with enhanced handling
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
                    
                    // Handle special properties
                    if (stepConfig.matrix_setup) {
                        step.properties.matrix = stepConfig.matrix_setup;
                    }
                    
                    // Handle group steps recursively
                    if (stepType === 'group' && stepConfig.steps) {
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
        this.showNotification(`Loaded ${template.name} template`, 'success');
        
        console.log(`✅ Loaded enhanced template: ${template.name}`);
    }

    showNotification(message, type = 'info') {
        if (window.mainInitializer && window.mainInitializer.showToast) {
            window.mainInitializer.showToast(message, type);
        } else if (window.buildkiteApp && window.buildkiteApp.showNotification) {
            window.buildkiteApp.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize enhanced templates
if (typeof window !== 'undefined') {
    window.EnhancedPipelineTemplates = EnhancedPipelineTemplates;
    window.enhancedTemplates = new EnhancedPipelineTemplates();
    
    // Override the global pipelineTemplates if it exists
    if (window.pipelineTemplates) {
        window.pipelineTemplates = window.enhancedTemplates;
    }
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedPipelineTemplates;
}