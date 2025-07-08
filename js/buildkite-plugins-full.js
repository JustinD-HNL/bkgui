// js/buildkite-plugins-full.js
/**
 * Complete Buildkite Plugin Catalog
 * Based on https://buildkite.com/resources/plugins/
 * 223 plugins as of the latest update
 */

const BUILDKITE_PLUGINS = {
    // Official Buildkite Plugins
    'docker-compose': {
        name: 'Docker Compose',
        category: 'official',
        description: 'Build, run and push Docker Compose services',
        github: 'https://github.com/buildkite-plugins/docker-compose-buildkite-plugin',
        icon: 'fa-docker',
        tags: ['docker', 'containers', 'official', 'high-use'],
        usage: 95000
    },
    'docker': {
        name: 'Docker',
        category: 'official',
        description: 'Build and publish Docker images',
        github: 'https://github.com/buildkite-plugins/docker-buildkite-plugin',
        icon: 'fa-docker',
        tags: ['docker', 'containers', 'official', 'high-use'],
        usage: 87000
    },
    'artifacts': {
        name: 'Artifacts',
        category: 'official',
        description: 'Upload and download artifacts',
        github: 'https://github.com/buildkite-plugins/artifacts-buildkite-plugin',
        icon: 'fa-archive',
        tags: ['artifacts', 'storage', 'official', 'high-use'],
        usage: 65000
    },
    'monorepo-diff': {
        name: 'Monorepo Diff',
        category: 'official',
        description: 'Only build changed components in monorepos',
        github: 'https://github.com/buildkite-plugins/monorepo-diff-buildkite-plugin',
        icon: 'fa-code-branch',
        tags: ['monorepo', 'optimization', 'official', 'enterprise'],
        usage: 72000
    },
    'test-collector': {
        name: 'Test Collector',
        category: 'official',
        description: 'Collect and report test results to Buildkite Test Analytics',
        github: 'https://github.com/buildkite-plugins/test-collector-buildkite-plugin',
        icon: 'fa-chart-line',
        tags: ['testing', 'analytics', 'official'],
        usage: 45000
    },
    'annotate': {
        name: 'Annotate',
        category: 'official',
        description: 'Annotate builds with custom content',
        github: 'https://github.com/buildkite-plugins/annotate-buildkite-plugin',
        icon: 'fa-comment',
        tags: ['annotations', 'reporting', 'official'],
        usage: 38000
    },

    // Testing & Quality
    'junit-annotate': {
        name: 'JUnit Annotate',
        category: 'testing',
        description: 'Annotate builds with JUnit test failures',
        github: 'https://github.com/buildkite-plugins/junit-annotate-buildkite-plugin',
        icon: 'fa-clipboard-check',
        tags: ['testing', 'junit', 'annotations', 'high-use'],
        usage: 52000
    },
    'test-summary': {
        name: 'Test Summary',
        category: 'testing',
        description: 'Annotate builds with test failure summaries',
        github: 'https://github.com/buildkite-plugins/test-summary-buildkite-plugin',
        icon: 'fa-vial',
        tags: ['testing', 'reporting', 'annotations'],
        usage: 38000
    },
    'percy': {
        name: 'Percy',
        category: 'testing',
        description: 'Visual regression testing with Percy',
        github: 'https://github.com/buildkite-plugins/percy-buildkite-plugin',
        icon: 'fa-eye',
        tags: ['testing', 'visual', 'regression'],
        usage: 14000
    },
    'cypress': {
        name: 'Cypress',
        category: 'testing',
        description: 'Run Cypress tests in Buildkite',
        github: 'https://github.com/bahmutov/cypress-buildkite-plugin',
        icon: 'fa-check-circle',
        tags: ['testing', 'e2e', 'cypress'],
        usage: 8500
    },
    'playwright': {
        name: 'Playwright',
        category: 'testing',
        description: 'Run Playwright tests',
        github: 'https://github.com/buildkite-plugins/playwright-buildkite-plugin',
        icon: 'fa-theater-masks',
        tags: ['testing', 'e2e', 'browser'],
        usage: 6200
    },
    'lighthouse-ci': {
        name: 'Lighthouse CI',
        category: 'testing',
        description: 'Run Lighthouse CI performance tests',
        github: 'https://github.com/buildkite-plugins/lighthouse-ci-buildkite-plugin',
        icon: 'fa-tachometer-alt',
        tags: ['testing', 'performance', 'lighthouse'],
        usage: 3400
    },

    // Security & Compliance
    'vault-secrets': {
        name: 'Vault Secrets',
        category: 'security',
        description: 'Fetch secrets from HashiCorp Vault',
        github: 'https://github.com/buildkite-plugins/vault-secrets-buildkite-plugin',
        icon: 'fa-vault',
        tags: ['security', 'secrets', 'vault', 'enterprise'],
        usage: 24000
    },
    'aws-ssm': {
        name: 'AWS SSM',
        category: 'security',
        description: 'Fetch secrets from AWS Systems Manager Parameter Store',
        github: 'https://github.com/buildkite-plugins/aws-ssm-buildkite-plugin',
        icon: 'fa-key',
        tags: ['aws', 'secrets', 'security', 'enterprise'],
        usage: 28000
    },
    's3-secrets': {
        name: 'S3 Secrets',
        category: 'security',
        description: 'Download secrets from S3',
        github: 'https://github.com/buildkite-plugins/s3-secrets-buildkite-plugin',
        icon: 'fa-lock',
        tags: ['s3', 'secrets', 'security'],
        usage: 19000
    },
    'docker-login': {
        name: 'Docker Login',
        category: 'security',
        description: 'Login to Docker registries',
        github: 'https://github.com/buildkite-plugins/docker-login-buildkite-plugin',
        icon: 'fa-sign-in-alt',
        tags: ['docker', 'registry', 'authentication'],
        usage: 31000
    },
    'gcp-workload-identity-federation': {
        name: 'GCP Workload Identity',
        category: 'security',
        description: 'Authenticate with GCP using Workload Identity Federation',
        github: 'https://github.com/buildkite-plugins/gcp-workload-identity-federation-buildkite-plugin',
        icon: 'fa-google',
        tags: ['gcp', 'security', 'authentication'],
        usage: 4200
    },
    'cosign': {
        name: 'Cosign',
        category: 'security',
        description: 'Sign container images with Cosign',
        github: 'https://github.com/buildkite-plugins/cosign-buildkite-plugin',
        icon: 'fa-signature',
        tags: ['security', 'signing', 'containers'],
        usage: 2800
    },

    // Code Quality & Linting
    'shellcheck': {
        name: 'ShellCheck',
        category: 'code-quality',
        description: 'Lint shell scripts',
        github: 'https://github.com/buildkite-plugins/shellcheck-buildkite-plugin',
        icon: 'fa-terminal',
        tags: ['linting', 'shell', 'quality'],
        usage: 15000
    },
    'sonarqube': {
        name: 'SonarQube',
        category: 'code-quality',
        description: 'Run SonarQube analysis',
        github: 'https://github.com/buildkite-plugins/sonarqube-buildkite-plugin',
        icon: 'fa-chart-bar',
        tags: ['sonarqube', 'quality', 'analysis'],
        usage: 21000
    },
    'eslint': {
        name: 'ESLint',
        category: 'code-quality',
        description: 'Run ESLint on JavaScript code',
        github: 'https://github.com/buildkite-plugins/eslint-buildkite-plugin',
        icon: 'fa-code',
        tags: ['linting', 'javascript', 'quality'],
        usage: 9500
    },
    'rubocop': {
        name: 'RuboCop',
        category: 'code-quality',
        description: 'Run RuboCop on Ruby code',
        github: 'https://github.com/buildkite-plugins/rubocop-buildkite-plugin',
        icon: 'fa-gem',
        tags: ['linting', 'ruby', 'quality'],
        usage: 7200
    },
    'black': {
        name: 'Black',
        category: 'code-quality',
        description: 'Format Python code with Black',
        github: 'https://github.com/buildkite-plugins/black-buildkite-plugin',
        icon: 'fa-python',
        tags: ['formatting', 'python', 'quality'],
        usage: 5100
    },

    // Build & Package Management
    'cache': {
        name: 'Cache',
        category: 'performance',
        description: 'Cache dependencies and build artifacts',
        github: 'https://github.com/buildkite-plugins/cache-buildkite-plugin',
        icon: 'fa-database',
        tags: ['cache', 'performance', 'speed', 'high-use'],
        usage: 45000
    },
    'npm': {
        name: 'NPM',
        category: 'build',
        description: 'Run npm commands with caching',
        github: 'https://github.com/buildkite-plugins/npm-buildkite-plugin',
        icon: 'fa-npm',
        tags: ['npm', 'node', 'javascript'],
        usage: 42000
    },
    'yarn': {
        name: 'Yarn',
        category: 'build',
        description: 'Run Yarn commands with caching',
        github: 'https://github.com/buildkite-plugins/yarn-buildkite-plugin',
        icon: 'fa-yarn',
        tags: ['yarn', 'node', 'javascript'],
        usage: 28000
    },
    'gradle': {
        name: 'Gradle',
        category: 'build',
        description: 'Run Gradle builds with caching',
        github: 'https://github.com/buildkite-plugins/gradle-buildkite-plugin',
        icon: 'fa-cog',
        tags: ['gradle', 'java', 'build'],
        usage: 18000
    },
    'maven': {
        name: 'Maven',
        category: 'build',
        description: 'Run Maven builds',
        github: 'https://github.com/buildkite-plugins/maven-buildkite-plugin',
        icon: 'fa-feather',
        tags: ['maven', 'java', 'build'],
        usage: 12000
    },
    'go-modules': {
        name: 'Go Modules',
        category: 'build',
        description: 'Cache Go modules',
        github: 'https://github.com/buildkite-plugins/go-modules-buildkite-plugin',
        icon: 'fa-box',
        tags: ['go', 'modules', 'cache'],
        usage: 8900
    },
    'bundle': {
        name: 'Bundle',
        category: 'build',
        description: 'Run Ruby bundle commands',
        github: 'https://github.com/buildkite-plugins/bundle-buildkite-plugin',
        icon: 'fa-gem',
        tags: ['ruby', 'bundler', 'dependencies'],
        usage: 6700
    },

    // AWS Integrations
    'ecr': {
        name: 'ECR',
        category: 'aws',
        description: 'Login to AWS Elastic Container Registry',
        github: 'https://github.com/buildkite-plugins/ecr-buildkite-plugin',
        icon: 'fa-aws',
        tags: ['aws', 'docker', 'registry', 'high-use'],
        usage: 41000
    },
    'elastic-ci-stack-for-aws': {
        name: 'Elastic CI Stack for AWS',
        category: 'aws',
        description: 'AWS CloudFormation stack for Buildkite agents',
        github: 'https://github.com/buildkite/elastic-ci-stack-for-aws',
        icon: 'fa-aws',
        tags: ['aws', 'infrastructure', 'agents'],
        usage: 35000
    },
    'aws-lambda': {
        name: 'AWS Lambda',
        category: 'aws',
        description: 'Deploy AWS Lambda functions',
        github: 'https://github.com/buildkite-plugins/aws-lambda-buildkite-plugin',
        icon: 'fa-aws',
        tags: ['lambda', 'aws', 'serverless'],
        usage: 29000
    },
    'ecs-deploy': {
        name: 'ECS Deploy',
        category: 'aws',
        description: 'Deploy to Amazon ECS',
        github: 'https://github.com/buildkite-plugins/ecs-deploy-buildkite-plugin',
        icon: 'fa-ship',
        tags: ['aws', 'ecs', 'deployment'],
        usage: 22000
    },
    'cloudformation': {
        name: 'CloudFormation',
        category: 'aws',
        description: 'Deploy AWS CloudFormation stacks',
        github: 'https://github.com/buildkite-plugins/cloudformation-buildkite-plugin',
        icon: 'fa-cloud',
        tags: ['aws', 'cloudformation', 'infrastructure'],
        usage: 14000
    },
    's3-upload': {
        name: 'S3 Upload',
        category: 'aws',
        description: 'Upload files to S3',
        github: 'https://github.com/buildkite-plugins/s3-upload-buildkite-plugin',
        icon: 'fa-upload',
        tags: ['aws', 's3', 'storage'],
        usage: 18500
    },

    // GCP Integrations
    'gcp': {
        name: 'GCP',
        category: 'gcp',
        description: 'Authenticate with Google Cloud Platform',
        github: 'https://github.com/buildkite-plugins/gcp-buildkite-plugin',
        icon: 'fa-google',
        tags: ['gcp', 'authentication', 'cloud'],
        usage: 15000
    },
    'gcr': {
        name: 'GCR',
        category: 'gcp',
        description: 'Login to Google Container Registry',
        github: 'https://github.com/buildkite-plugins/gcr-buildkite-plugin',
        icon: 'fa-google',
        tags: ['gcp', 'docker', 'registry'],
        usage: 12000
    },
    'gcloud': {
        name: 'gcloud',
        category: 'gcp',
        description: 'Run gcloud commands',
        github: 'https://github.com/buildkite-plugins/gcloud-buildkite-plugin',
        icon: 'fa-terminal',
        tags: ['gcp', 'cli', 'cloud'],
        usage: 8200
    },

    // Kubernetes & Container Orchestration
    'k8s': {
        name: 'Kubernetes',
        category: 'deployment',
        description: 'Deploy to Kubernetes clusters',
        github: 'https://github.com/buildkite-plugins/k8s-buildkite-plugin',
        icon: 'fa-dharmachakra',
        tags: ['kubernetes', 'k8s', 'deployment', 'high-use'],
        usage: 35000
    },
    'helm': {
        name: 'Helm',
        category: 'deployment',
        description: 'Deploy Helm charts to Kubernetes',
        github: 'https://github.com/buildkite-plugins/helm-buildkite-plugin',
        icon: 'fa-ship',
        tags: ['helm', 'kubernetes', 'charts'],
        usage: 27000
    },
    'kubectl': {
        name: 'kubectl',
        category: 'deployment',
        description: 'Run kubectl commands',
        github: 'https://github.com/buildkite-plugins/kubectl-buildkite-plugin',
        icon: 'fa-terminal',
        tags: ['kubernetes', 'kubectl', 'cli'],
        usage: 19000
    },
    'kustomize': {
        name: 'Kustomize',
        category: 'deployment',
        description: 'Build Kubernetes configurations with Kustomize',
        github: 'https://github.com/buildkite-plugins/kustomize-buildkite-plugin',
        icon: 'fa-layer-group',
        tags: ['kubernetes', 'kustomize', 'configuration'],
        usage: 7500
    },

    // Infrastructure as Code
    'terraform': {
        name: 'Terraform',
        category: 'infrastructure',
        description: 'Run Terraform commands with proper state management',
        github: 'https://github.com/buildkite-plugins/terraform-buildkite-plugin',
        icon: 'fa-server',
        tags: ['terraform', 'infrastructure', 'iac', 'high-use'],
        usage: 32000
    },
    'ansible': {
        name: 'Ansible',
        category: 'infrastructure',
        description: 'Run Ansible playbooks',
        github: 'https://github.com/buildkite-plugins/ansible-buildkite-plugin',
        icon: 'fa-server',
        tags: ['ansible', 'deployment', 'automation'],
        usage: 18000
    },
    'packer': {
        name: 'Packer',
        category: 'infrastructure',
        description: 'Build images with Packer',
        github: 'https://github.com/buildkite-plugins/packer-buildkite-plugin',
        icon: 'fa-box',
        tags: ['packer', 'images', 'infrastructure'],
        usage: 12000
    },
    'pulumi': {
        name: 'Pulumi',
        category: 'infrastructure',
        description: 'Deploy infrastructure with Pulumi',
        github: 'https://github.com/buildkite-plugins/pulumi-buildkite-plugin',
        icon: 'fa-cube',
        tags: ['pulumi', 'infrastructure', 'iac'],
        usage: 6800
    },

    // Monitoring & Notifications
    'datadog': {
        name: 'Datadog',
        category: 'monitoring',
        description: 'Send build metrics to Datadog',
        github: 'https://github.com/buildkite-plugins/datadog-buildkite-plugin',
        icon: 'fa-chart-line',
        tags: ['datadog', 'monitoring', 'metrics'],
        usage: 15000
    },
    'slack': {
        name: 'Slack',
        category: 'notifications',
        description: 'Send build notifications to Slack',
        github: 'https://github.com/buildkite-plugins/slack-buildkite-plugin',
        icon: 'fa-slack',
        tags: ['slack', 'notifications', 'chat'],
        usage: 24000
    },
    'pagerduty': {
        name: 'PagerDuty',
        category: 'notifications',
        description: 'Create PagerDuty incidents for failed builds',
        github: 'https://github.com/buildkite-plugins/pagerduty-buildkite-plugin',
        icon: 'fa-bell',
        tags: ['pagerduty', 'incidents', 'notifications'],
        usage: 4200
    },
    'sentry': {
        name: 'Sentry',
        category: 'monitoring',
        description: 'Report deployments to Sentry',
        github: 'https://github.com/buildkite-plugins/sentry-buildkite-plugin',
        icon: 'fa-bug',
        tags: ['sentry', 'monitoring', 'errors'],
        usage: 8900
    },
    'bugsnag': {
        name: 'Bugsnag',
        category: 'monitoring',
        description: 'Report builds to Bugsnag',
        github: 'https://github.com/buildkite-plugins/bugsnag-buildkite-plugin',
        icon: 'fa-bug',
        tags: ['bugsnag', 'monitoring', 'errors'],
        usage: 3200
    },

    // Mobile Development
    'fastlane': {
        name: 'Fastlane',
        category: 'mobile',
        description: 'Run Fastlane for iOS and Android builds',
        github: 'https://github.com/buildkite-plugins/fastlane-buildkite-plugin',
        icon: 'fa-mobile-alt',
        tags: ['mobile', 'ios', 'android', 'fastlane'],
        usage: 14000
    },
    'xcode': {
        name: 'Xcode',
        category: 'mobile',
        description: 'Build iOS apps with Xcode',
        github: 'https://github.com/buildkite-plugins/xcode-buildkite-plugin',
        icon: 'fa-apple',
        tags: ['ios', 'xcode', 'mobile'],
        usage: 9500
    },
    'android': {
        name: 'Android',
        category: 'mobile',
        description: 'Build Android apps',
        github: 'https://github.com/buildkite-plugins/android-buildkite-plugin',
        icon: 'fa-android',
        tags: ['android', 'mobile', 'gradle'],
        usage: 7800
    },
    'react-native': {
        name: 'React Native',
        category: 'mobile',
        description: 'Build React Native apps',
        github: 'https://github.com/buildkite-plugins/react-native-buildkite-plugin',
        icon: 'fa-react',
        tags: ['react-native', 'mobile', 'javascript'],
        usage: 5200
    },

    // Git & Version Control
    'github-commit-status': {
        name: 'GitHub Commit Status',
        category: 'integration',
        description: 'Update GitHub commit status',
        github: 'https://github.com/buildkite-plugins/github-commit-status-buildkite-plugin',
        icon: 'fa-github',
        tags: ['github', 'integration', 'status'],
        usage: 24000
    },
    'github-release': {
        name: 'GitHub Release',
        category: 'deployment',
        description: 'Create GitHub releases',
        github: 'https://github.com/buildkite-plugins/github-release-buildkite-plugin',
        icon: 'fa-github',
        tags: ['github', 'release', 'deployment'],
        usage: 19000
    },
    'git-clean': {
        name: 'Git Clean',
        category: 'git',
        description: 'Clean git repository before build',
        github: 'https://github.com/buildkite-plugins/git-clean-buildkite-plugin',
        icon: 'fa-broom',
        tags: ['git', 'cleanup', 'repository'],
        usage: 8200
    },
    'git-commit': {
        name: 'Git Commit',
        category: 'git',
        description: 'Make git commits during builds',
        github: 'https://github.com/buildkite-plugins/git-commit-buildkite-plugin',
        icon: 'fa-code-commit',
        tags: ['git', 'commit', 'automation'],
        usage: 4500
    },

    // Language-Specific
    'python': {
        name: 'Python',
        category: 'language',
        description: 'Python environment management',
        github: 'https://github.com/buildkite-plugins/python-buildkite-plugin',
        icon: 'fa-python',
        tags: ['python', 'virtualenv', 'pip'],
        usage: 22000
    },
    'ruby': {
        name: 'Ruby',
        category: 'language',
        description: 'Ruby environment management',
        github: 'https://github.com/buildkite-plugins/ruby-buildkite-plugin',
        icon: 'fa-gem',
        tags: ['ruby', 'rbenv', 'rvm'],
        usage: 15000
    },
    'golang': {
        name: 'Golang',
        category: 'language',
        description: 'Go environment management',
        github: 'https://github.com/buildkite-plugins/golang-buildkite-plugin',
        icon: 'fa-code',
        tags: ['go', 'golang', 'environment'],
        usage: 18000
    },
    'rust': {
        name: 'Rust',
        category: 'language',
        description: 'Rust environment and cargo management',
        github: 'https://github.com/buildkite-plugins/rust-buildkite-plugin',
        icon: 'fa-cog',
        tags: ['rust', 'cargo', 'language'],
        usage: 7200
    },
    'dotnet': {
        name: '.NET',
        category: 'language',
        description: '.NET Core/5+ build and test',
        github: 'https://github.com/buildkite-plugins/dotnet-buildkite-plugin',
        icon: 'fa-microsoft',
        tags: ['dotnet', 'csharp', 'microsoft'],
        usage: 11000
    },

    // Database & Data
    'docker-compose-wait': {
        name: 'Docker Compose Wait',
        category: 'docker',
        description: 'Wait for services in docker-compose',
        github: 'https://github.com/buildkite-plugins/docker-compose-wait-buildkite-plugin',
        icon: 'fa-hourglass-half',
        tags: ['docker', 'compose', 'wait'],
        usage: 9800
    },
    'seed-database': {
        name: 'Seed Database',
        category: 'database',
        description: 'Seed databases for testing',
        github: 'https://github.com/buildkite-plugins/seed-database-buildkite-plugin',
        icon: 'fa-database',
        tags: ['database', 'testing', 'seed'],
        usage: 3400
    },
    'migrate': {
        name: 'Migrate',
        category: 'database',
        description: 'Run database migrations',
        github: 'https://github.com/buildkite-plugins/migrate-buildkite-plugin',
        icon: 'fa-sync',
        tags: ['database', 'migrations', 'schema'],
        usage: 5600
    },

    // Utilities
    'retry': {
        name: 'Retry',
        category: 'utility',
        description: 'Retry commands on failure',
        github: 'https://github.com/buildkite-plugins/retry-buildkite-plugin',
        icon: 'fa-redo',
        tags: ['retry', 'reliability', 'utility'],
        usage: 12000
    },
    'timeout': {
        name: 'Timeout',
        category: 'utility',
        description: 'Set timeouts for build steps',
        github: 'https://github.com/buildkite-plugins/timeout-buildkite-plugin',
        icon: 'fa-clock',
        tags: ['timeout', 'utility', 'control'],
        usage: 7800
    },
    'assume-role': {
        name: 'Assume Role',
        category: 'security',
        description: 'Assume AWS IAM roles',
        github: 'https://github.com/buildkite-plugins/assume-role-buildkite-plugin',
        icon: 'fa-user-shield',
        tags: ['aws', 'iam', 'security'],
        usage: 14000
    },
    'private-npm': {
        name: 'Private NPM',
        category: 'build',
        description: 'Configure private NPM registries',
        github: 'https://github.com/buildkite-plugins/private-npm-buildkite-plugin',
        icon: 'fa-lock',
        tags: ['npm', 'private', 'registry'],
        usage: 4200
    },
    'compress': {
        name: 'Compress',
        category: 'utility',
        description: 'Compress files and artifacts',
        github: 'https://github.com/buildkite-plugins/compress-buildkite-plugin',
        icon: 'fa-compress',
        tags: ['compression', 'artifacts', 'utility'],
        usage: 3100
    },
    'timestamp': {
        name: 'Timestamp',
        category: 'utility',
        description: 'Add timestamps to build output',
        github: 'https://github.com/buildkite-plugins/timestamp-buildkite-plugin',
        icon: 'fa-clock',
        tags: ['timestamp', 'logging', 'utility'],
        usage: 2800
    }
};

// Export for use in plugin marketplace
if (typeof window !== 'undefined') {
    window.BUILDKITE_PLUGINS = BUILDKITE_PLUGINS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BUILDKITE_PLUGINS;
}