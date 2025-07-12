// js/pipeline-templates.js
/**
 * Pipeline Templates - Complete configurations
 * FIXED: Templates now provide full pipeline configurations, not just single steps
 */

console.log('pipeline-templates.js: File starting to load...');

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
                            key: 'deploy_gate',
                            prompt: 'Deploy this build to production?',
                            fields: [
                                {
                                    key: 'release_notes',
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
                            depends_on: ['build', 'deploy_gate'],
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
                                    'image-name': 'myapp:\${BUILDKITE_BUILD_NUMBER}'
                                }
                            },
                            agents: { docker: 'true' }
                        },
                        {
                            label: '🔒 Security Scan',
                            key: 'security',
                            command: 'trivy image myapp:\${BUILDKITE_BUILD_NUMBER}',
                            soft_fail: true,
                            agents: { docker: 'true' }
                        },
                        'wait',
                        {
                            label: '📤 Push to Registry',
                            key: 'push',
                            plugins: {
                                'docker': {
                                    image: 'myapp:\${BUILDKITE_BUILD_NUMBER}',
                                    tag: ['latest', '\${BUILDKITE_BUILD_NUMBER}'],
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
                                message: 'Deploy \${BUILDKITE_BUILD_NUMBER}',
                                env: {
                                    IMAGE_TAG: '\${BUILDKITE_BUILD_NUMBER}'
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
                            key: 'validate_data',
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
                            depends_on: ['validate_data', 'test'],
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
                                    key: 'accuracy_threshold',
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
                            key: 'ios_build',
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
                            key: 'android_build',
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
                            key: 'ui_tests',
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
                            key: 'deploy_gate',
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
                                    depends_on: ['ios_build', 'ui_tests', 'deploy_gate'],
                                    agents: { queue: 'mac' }
                                },
                                {
                                    label: '🤖 Deploy to Play Store',
                                    command: 'bundle exec fastlane android deploy',
                                    depends_on: ['android_build', 'ui_tests', 'deploy_gate'],
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
                            key: 'fmt_check',
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
                            depends_on: ['fmt_check', 'validate'],
                            agents: { terraform: 'latest' }
                        },
                        'wait',
                        {
                            block: '🔍 Review Terraform Plan',
                            key: 'review_plan',
                            prompt: 'Review the Terraform plan before applying',
                            fields: [
                                {
                                    key: 'confirm_changes',
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
                            depends_on: ['plan', 'review_plan'],
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
                            key: 'detect_changes',
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
                            key: 'build_packages',
                            command: `
                                # Build only changed packages
                                buildkite-agent artifact download changed-packages.txt .
                                ./scripts/build-changed.sh
                            `,
                            depends_on: ['detect_changes'],
                            agents: { queue: 'default' },
                            matrix: [
                                {
                                    package: ['api', 'web', 'mobile', 'shared']
                                }
                            ]
                        },
                        {
                            label: '🧪 Test Changed Packages',
                            key: 'test_packages',
                            command: `
                                # Test only changed packages
                                buildkite-agent artifact download changed-packages.txt .
                                ./scripts/test-changed.sh
                            `,
                            depends_on: ['build_packages'],
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
                            depends_on: ['test_packages']
                        }
                    ]
                }
            },
            
            'security-scan': {
                name: 'Security Pipeline',
                icon: 'fa-shield-alt',
                description: 'Comprehensive security scanning with SAST, dependency checks, and container scanning',
                pipeline: {
                    steps: [
                        {
                            label: '🔍 Static Code Analysis',
                            key: 'sast',
                            command: `
                                # Run multiple security scanners
                                semgrep --config=auto .
                                bandit -r src/
                                eslint . --ext .js,.jsx,.ts,.tsx --format json > eslint-security.json
                            `,
                            artifact_paths: ['*-security.json', 'security-reports/**/*'],
                            soft_fail: [{ exit_status: 1 }],
                            agents: { queue: 'security' }
                        },
                        {
                            label: '📦 Dependency Check',
                            key: 'deps',
                            command: `
                                # Check for vulnerable dependencies
                                npm audit --json > npm-audit.json
                                snyk test --json > snyk-report.json
                            `,
                            artifact_paths: ['*-audit.json', '*-report.json'],
                            soft_fail: true,
                            agents: { queue: 'security' }
                        },
                        {
                            label: '🐳 Container Scan',
                            key: 'container',
                            command: 'trivy image --format json --output trivy-report.json myapp:latest',
                            artifact_paths: 'trivy-report.json',
                            soft_fail: true,
                            agents: { docker: 'true' }
                        },
                        'wait',
                        {
                            label: '📊 Generate Security Report',
                            key: 'report',
                            command: `
                                # Aggregate all security findings
                                python scripts/aggregate_security_reports.py
                            `,
                            artifact_paths: 'security-summary.html',
                            depends_on: ['sast', 'deps', 'container'],
                            agents: { python: '3.9' }
                        },
                        {
                            block: '🔒 Security Review',
                            key: 'review',
                            prompt: 'Review security findings before proceeding',
                            fields: [
                                {
                                    key: 'risk_accepted',
                                    text: 'I accept the security risks',
                                    type: 'select',
                                    options: [
                                        { label: 'Yes', value: 'yes' },
                                        { label: 'No', value: 'no' }
                                    ],
                                    required: true
                                }
                            ]
                        }
                    ]
                }
            },
            
            'k8s-deploy': {
                name: 'Kubernetes Deploy',
                icon: 'fa-dharmachakra',
                description: 'Deploy applications to Kubernetes with Helm charts and health checks',
                pipeline: {
                    steps: [
                        {
                            label: '📋 Validate Manifests',
                            key: 'validate',
                            command: `
                                # Validate Kubernetes manifests
                                kubectl apply --dry-run=client -f k8s/
                                helm lint ./charts/myapp
                            `,
                            agents: { kubernetes: 'true' }
                        },
                        {
                            label: '🔨 Build & Push Image',
                            key: 'build',
                            plugins: {
                                'docker-buildkite-plugin#v3.0.0': {
                                    image: 'myapp:\${BUILDKITE_BUILD_NUMBER}',
                                    dockerfile: 'Dockerfile',
                                    push: 'registry.company.com/myapp:\${BUILDKITE_BUILD_NUMBER}'
                                }
                            },
                            agents: { docker: 'true' }
                        },
                        {
                            label: '🚀 Deploy to Staging',
                            key: 'deploy_staging',
                            command: `
                                helm upgrade --install myapp-staging ./charts/myapp \
                                  --namespace staging \
                                  --set image.tag=\\${BUILDKITE_BUILD_NUMBER} \
                                  --wait --timeout 5m
                            `,
                            depends_on: ['validate', 'build'],
                            agents: { kubernetes: 'true' }
                        },
                        {
                            label: '🧪 Run Smoke Tests',
                            key: 'smoke_tests',
                            command: 'npm run test:smoke -- --env=staging',
                            depends_on: ['deploy_staging'],
                            retry: {
                                automatic: [
                                    { exit_status: '*', limit: 2 }
                                ]
                            },
                            agents: { queue: 'default' }
                        },
                        'wait',
                        {
                            block: '🚀 Deploy to Production?',
                            key: 'prod_gate',
                            branches: 'main'
                        },
                        {
                            label: '🚀 Deploy to Production',
                            key: 'deploy_prod',
                            command: `
                                helm upgrade --install myapp ./charts/myapp \
                                  --namespace production \
                                  --set image.tag=\\${BUILDKITE_BUILD_NUMBER} \
                                  --wait --timeout 10m
                            `,
                            depends_on: ['smoke_tests', 'prod_gate'],
                            branches: 'main',
                            agents: { kubernetes: 'true' },
                            concurrency: 1,
                            concurrency_group: 'prod-deploy'
                        }
                    ]
                }
            },
            
            'serverless': {
                name: 'Serverless Deploy',
                icon: 'fa-bolt',
                description: 'Deploy serverless functions with testing and staged rollouts',
                pipeline: {
                    steps: [
                        {
                            label: '📦 Install Dependencies',
                            key: 'install',
                            command: 'npm ci',
                            agents: { node: '16' }
                        },
                        {
                            label: '🧪 Unit Tests',
                            key: 'test',
                            command: 'npm test',
                            depends_on: ['install'],
                            agents: { node: '16' }
                        },
                        {
                            label: '📦 Package Functions',
                            key: 'package',
                            command: 'serverless package',
                            artifact_paths: '.serverless/**/*',
                            depends_on: ['test'],
                            agents: { node: '16' }
                        },
                        {
                            label: '🚀 Deploy to Dev',
                            key: 'deploy_dev',
                            command: 'serverless deploy --stage dev',
                            depends_on: ['package'],
                            agents: { node: '16' }
                        },
                        {
                            label: '🧪 Integration Tests',
                            key: 'integration_tests',
                            command: 'npm run test:integration -- --stage=dev',
                            depends_on: ['deploy_dev'],
                            agents: { node: '16' }
                        },
                        'wait',
                        {
                            label: '🚀 Deploy to Prod',
                            key: 'deploy_prod',
                            command: 'serverless deploy --stage prod',
                            branches: 'main',
                            agents: { node: '16' }
                        },
                        {
                            label: '🔄 Canary Rollout',
                            key: 'canary',
                            command: `
                                # Deploy canary version
                                serverless deploy function -f main --stage prod --alias canary
                                # Monitor metrics
                                npm run monitor:canary
                            `,
                            depends_on: ['deploy_prod'],
                            branches: 'main',
                            agents: { node: '16' }
                        }
                    ]
                }
            },
            
            'data-pipeline': {
                name: 'Data Pipeline',
                icon: 'fa-database',
                description: 'ETL pipeline with data validation, transformation, and quality checks',
                pipeline: {
                    steps: [
                        {
                            label: '📊 Validate Source Data',
                            key: 'validate_source',
                            command: `
                                python scripts/validate_schema.py --source=raw
                                python scripts/check_data_quality.py --source=raw
                            `,
                            agents: { python: '3.9', memory: '8GB' }
                        },
                        {
                            label: '🔄 Transform Data',
                            key: 'transform',
                            command: `
                                spark-submit \
                                  --master yarn \
                                  --deploy-mode cluster \
                                  scripts/transform_data.py
                            `,
                            depends_on: ['validate_source'],
                            agents: { spark: '3.0', memory: '16GB' },
                            timeout_in_minutes: 120
                        },
                        {
                            label: '✅ Data Quality Checks',
                            key: 'quality_check',
                            command: `
                                great_expectations checkpoint run daily_quality
                                dbt test
                            `,
                            depends_on: ['transform'],
                            artifact_paths: 'data_quality_reports/**/*',
                            agents: { python: '3.9' }
                        },
                        {
                            label: '📤 Load to Warehouse',
                            key: 'load',
                            command: `
                                python scripts/load_to_warehouse.py \
                                  --source=transformed \
                                  --target=warehouse
                            `,
                            depends_on: ['quality_check'],
                            agents: { python: '3.9' },
                            retry: {
                                automatic: [
                                    { exit_status: -1, limit: 2 }
                                ]
                            }
                        },
                        'wait',
                        {
                            label: '📊 Update Dashboards',
                            key: 'dashboards',
                            command: `
                                # Refresh materialized views
                                psql -f scripts/refresh_views.sql
                                # Update Tableau extracts
                                tabcmd refreshextracts --project "Analytics"
                            `,
                            agents: { queue: 'analytics' }
                        }
                    ]
                }
            },
            
            'multi-platform': {
                name: 'Multi-Platform Build',
                icon: 'fa-layer-group',
                description: 'Build and test across multiple platforms and architectures',
                pipeline: {
                    steps: [
                        {
                            label: '🏗️ Build Matrix',
                            key: 'build',
                            command: 'make build-${PLATFORM}-${ARCH}',
                            artifact_paths: 'build/${PLATFORM}/${ARCH}/**/*',
                            matrix: {
                                setup: [
                                    { PLATFORM: 'linux', ARCH: 'amd64' },
                                    { PLATFORM: 'linux', ARCH: 'arm64' },
                                    { PLATFORM: 'darwin', ARCH: 'amd64' },
                                    { PLATFORM: 'darwin', ARCH: 'arm64' },
                                    { PLATFORM: 'windows', ARCH: 'amd64' }
                                ]
                            },
                            agents: {
                                queue: '${PLATFORM}-${ARCH}'
                            }
                        },
                        {
                            label: '🧪 Test ${PLATFORM}/${ARCH}',
                            key: 'test',
                            command: 'make test-${PLATFORM}-${ARCH}',
                            depends_on: ['build'],
                            matrix: {
                                setup: [
                                    { PLATFORM: 'linux', ARCH: 'amd64' },
                                    { PLATFORM: 'linux', ARCH: 'arm64' },
                                    { PLATFORM: 'darwin', ARCH: 'amd64' },
                                    { PLATFORM: 'darwin', ARCH: 'arm64' },
                                    { PLATFORM: 'windows', ARCH: 'amd64' }
                                ]
                            },
                            agents: {
                                queue: '${PLATFORM}-${ARCH}'
                            }
                        },
                        'wait',
                        {
                            label: '📦 Create Release',
                            key: 'release',
                            command: `
                                # Download all artifacts
                                buildkite-agent artifact download 'build/**/*' .
                                # Create release packages
                                ./scripts/create-release.sh
                            `,
                            artifact_paths: 'release/**/*',
                            branches: 'main release/*',
                            agents: { queue: 'release' }
                        }
                    ]
                }
            },
            
            'compliance': {
                name: 'Compliance Pipeline',
                icon: 'fa-certificate',
                description: 'Automated compliance checks, audit trails, and certification',
                pipeline: {
                    steps: [
                        {
                            label: '📋 License Check',
                            key: 'license',
                            command: `
                                # Check all dependencies for license compliance
                                license-checker --json > licenses.json
                                python scripts/check_licenses.py
                            `,
                            artifact_paths: 'licenses.json',
                            agents: { queue: 'compliance' }
                        },
                        {
                            label: '🔒 Security Compliance',
                            key: 'security',
                            command: `
                                # Run CIS benchmark tests
                                inspec exec compliance/cis-benchmark
                                # OWASP dependency check
                                dependency-check.sh --project "MyApp" --out reports
                            `,
                            artifact_paths: 'reports/**/*',
                            agents: { queue: 'compliance' }
                        },
                        {
                            label: '📊 Code Coverage',
                            key: 'coverage',
                            command: `
                                # Ensure minimum coverage requirements
                                npm test -- --coverage
                                python scripts/check_coverage.py --min=80
                            `,
                            artifact_paths: 'coverage/**/*',
                            agents: { queue: 'default' }
                        },
                        {
                            label: '📝 Generate Audit Report',
                            key: 'audit',
                            command: `
                                python scripts/generate_audit_report.py \
                                  --license-report=licenses.json \
                                  --security-report=reports/dependency-check-report.json \
                                  --coverage-report=coverage/lcov.info
                            `,
                            artifact_paths: 'audit-report-*.pdf',
                            depends_on: ['license', 'security', 'coverage'],
                            agents: { python: '3.9' }
                        },
                        'wait',
                        {
                            block: '✅ Compliance Approval',
                            key: 'approval',
                            prompt: 'Review and approve compliance report',
                            fields: [
                                {
                                    key: 'approver',
                                    text: 'Approver Name',
                                    required: true
                                },
                                {
                                    key: 'comments',
                                    text: 'Comments',
                                    required: false
                                }
                            ]
                        },
                        {
                            label: '📤 Submit to Registry',
                            key: 'submit',
                            command: `
                                # Submit compliance artifacts to corporate registry
                                compliance-cli submit \
                                  --report=audit-report-*.pdf \
                                  --approver="${BUILDKITE_BLOCK_STEP_approval_approver}"
                            `,
                            depends_on: ['audit', 'approval'],
                            branches: 'main',
                            agents: { queue: 'compliance' }
                        }
                    ]
                }
            },
            
            'performance': {
                name: 'Performance Testing',
                icon: 'fa-tachometer-alt',
                description: 'Load testing, performance benchmarks, and regression detection',
                pipeline: {
                    steps: [
                        {
                            label: '🏗️ Build Test Image',
                            key: 'build',
                            command: 'docker build -t perftest:\${BUILDKITE_BUILD_NUMBER} .',
                            agents: { docker: 'true' }
                        },
                        {
                            label: '⚡ Performance Baseline',
                            key: 'baseline',
                            command: `
                                # Run baseline performance tests
                                k6 run scripts/baseline.js \
                                  --out influxdb=http://metrics:8086/k6
                            `,
                            artifact_paths: 'results/baseline/**/*',
                            depends_on: ['build'],
                            agents: { performance: 'true' }
                        },
                        {
                            label: '🔥 Load Test',
                            key: 'load',
                            command: `
                                # Run load test with increasing users
                                k6 run scripts/load-test.js \
                                  --stage 5m:100,10m:500,5m:100 \
                                  --out json=results/load-test.json
                            `,
                            artifact_paths: 'results/load-test.json',
                            depends_on: ['build'],
                            agents: { performance: 'true' },
                            timeout_in_minutes: 30
                        },
                        {
                            label: '💥 Stress Test',
                            key: 'stress',
                            command: `
                                # Find breaking point
                                k6 run scripts/stress-test.js \
                                  --stage 5m:100,5m:200,5m:300,5m:400,5m:500
                            `,
                            artifact_paths: 'results/stress/**/*',
                            depends_on: ['build'],
                            soft_fail: true,
                            agents: { performance: 'true' },
                            timeout_in_minutes: 30
                        },
                        'wait',
                        {
                            label: '📊 Analyze Results',
                            key: 'analyze',
                            command: `
                                # Compare with previous runs
                                python scripts/analyze_performance.py \
                                  --baseline=results/baseline \
                                  --current=results/load-test.json \
                                  --threshold=10
                            `,
                            artifact_paths: 'performance-report.html',
                            depends_on: ['baseline', 'load', 'stress'],
                            agents: { python: '3.9' }
                        },
                        {
                            block: '⚠️ Performance Regression?',
                            key: 'regression_review',
                            prompt: 'Performance regression detected. Continue?',
                            depends_on: ['analyze'],
                            if: 'build.env("PERFORMANCE_REGRESSION") == "true"'
                        }
                    ]
                }
            },
            
            'release': {
                name: 'Release Pipeline',
                icon: 'fa-tag',
                description: 'Automated release process with versioning, changelog, and distribution',
                pipeline: {
                    steps: [
                        {
                            label: '🏷️ Determine Version',
                            key: 'version',
                            command: `
                                # Semantic versioning based on commits
                                npx semantic-release --dry-run --no-ci \
                                  | grep "next release version" \
                                  | sed 's/.*next release version is //' \
                                  > .version
                                echo "Next version: $(cat .version)"
                            `,
                            artifact_paths: '.version',
                            agents: { node: '16' }
                        },
                        {
                            label: '📝 Generate Changelog',
                            key: 'changelog',
                            command: `
                                # Generate changelog from commits
                                conventional-changelog -p angular -i CHANGELOG.md -s
                                git add CHANGELOG.md
                            `,
                            depends_on: ['version'],
                            agents: { node: '16' }
                        },
                        {
                            label: '🏗️ Build Release',
                            key: 'build',
                            command: `
                                VERSION=$(cat .version)
                                make release VERSION=$VERSION
                            `,
                            artifact_paths: [
                                'dist/**/*',
                                'release/**/*'
                            ],
                            depends_on: ['version'],
                            agents: { queue: 'release' }
                        },
                        {
                            label: '🧪 Release Tests',
                            key: 'test',
                            command: 'npm run test:release',
                            depends_on: ['build'],
                            agents: { queue: 'release' }
                        },
                        'wait',
                        {
                            block: '🚀 Create Release?',
                            key: 'release_gate',
                            prompt: 'Create and publish release?',
                            fields: [
                                {
                                    key: 'release_notes',
                                    text: 'Additional Release Notes',
                                    required: false
                                }
                            ]
                        },
                        {
                            label: '🏷️ Tag Release',
                            key: 'tag',
                            command: `
                                VERSION=$(cat .version)
                                git tag -a "v$VERSION" -m "Release v$VERSION"
                                git push origin "v$VERSION"
                            `,
                            depends_on: ['changelog', 'test', 'release_gate'],
                            branches: 'main',
                            agents: { queue: 'release' }
                        },
                        {
                            label: '📦 Publish Packages',
                            key: 'publish',
                            command: `
                                VERSION=$(cat .version)
                                # Publish to package registries
                                npm publish
                                docker push myapp:$VERSION
                                # Upload to GitHub releases
                                gh release create "v$VERSION" \
                                  --title "Release v$VERSION" \
                                  --notes-file RELEASE_NOTES.md \
                                  dist/*
                            `,
                            depends_on: ['tag'],
                            branches: 'main',
                            agents: { queue: 'release' }
                        }
                    ]
                }
            }
        };
    }

    async loadTemplate(templateKey) {
        const template = this.templates[templateKey];
        if (!template || !window.pipelineBuilder) {
            console.error(`Template ${templateKey} not found or pipeline builder not available`);
            return;
        }

        console.log(`Loading template from pipeline-templates.js: ${templateKey}`);
        
        // Handle based on current pipeline state
        if (window.pipelineBuilder.steps.length > 0) {
            // Show options dialog
            const choice = await window.pipelineBuilder.showTemplateLoadOptions(templateKey);
            
            if (choice === 'cancel') {
                return;
            } else if (choice === 'overwrite') {
                window.pipelineBuilder.clearPipeline(true);
            }
            // For 'append', we just continue adding steps
        }
        // If pipeline is empty, just load silently
        
        // Load template steps
        console.log(`Loading ${template.pipeline.steps.length} steps from template`);
        template.pipeline.steps.forEach((stepConfig, idx) => {
            console.log(`Processing step ${idx}:`, stepConfig);
            
            if (stepConfig === 'wait') {
                const step = window.pipelineBuilder.addStep('wait');
                console.log(`Added wait step:`, step);
            } else if (typeof stepConfig === 'object') {
                // Determine step type
                let stepType = 'command';
                if (stepConfig.block) stepType = 'block';
                else if (stepConfig.input) stepType = 'input';
                else if (stepConfig.trigger) stepType = 'trigger';
                else if (stepConfig.group) stepType = 'group';
                
                console.log(`Adding ${stepType} step`);
                const step = window.pipelineBuilder.addStep(stepType);
                if (step) {
                    // Apply all properties from template
                    Object.assign(step.properties, stepConfig);
                    console.log(`Applied properties to step:`, step.properties);
                    
                    // Handle group steps recursively
                    if (stepType === 'group' && stepConfig.steps) {
                        // Note: In a real implementation, you'd need to handle nested steps
                        // For now, we'll just note that this group has steps
                        step.properties._groupSteps = stepConfig.steps;
                    }
                } else {
                    console.error(`Failed to add ${stepType} step`);
                }
            }
        });
        
        // Re-render and select first step
        console.log(`Total steps after loading: ${window.pipelineBuilder.steps.length}`);
        window.pipelineBuilder.renderPipeline();
        window.pipelineBuilder.updateStepCount();
        window.pipelineBuilder.saveToLocalStorage();
        
        if (window.pipelineBuilder.steps.length > 0) {
            window.pipelineBuilder.selectStep(window.pipelineBuilder.steps[0]);
        }
        
        // Update YAML
        if (window.buildkiteApp) {
            window.buildkiteApp.updateYAML();
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
    try {
        console.log('pipeline-templates.js: Script loaded, initializing...');
        window.PipelineTemplates = PipelineTemplates;
        window.pipelineTemplates = new PipelineTemplates();
        console.log('pipeline-templates.js: Initialized with', Object.keys(window.pipelineTemplates.templates).length, 'templates');
        console.log('pipeline-templates.js: window.pipelineTemplates =', window.pipelineTemplates);
        console.log('pipeline-templates.js: SUCCESS - Templates are available');
    } catch (error) {
        console.error('pipeline-templates.js: ERROR during initialization:', error);
    }
}

// Export for Node.js/testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PipelineTemplates;
}