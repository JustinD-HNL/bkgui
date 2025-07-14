/**
 * Help Content Definitions
 * Contains all help content for form fields in the Buildkite Pipeline Builder
 */

const helpContent = {
    // Command Step Fields
    'step-label': {
        title: 'Step Label',
        short: 'A human-readable name for this step',
        description: 'The label is displayed in the Buildkite UI to identify this step. It helps you and your team understand what the step does at a glance.',
        examples: [
            {
                title: 'Basic Label',
                code: 'Run Tests',
                description: 'Simple, descriptive label'
            },
            {
                title: 'With Emoji',
                code: '🧪 Run Unit Tests',
                description: 'Emojis make steps more visually distinctive'
            },
            {
                title: 'Dynamic Label',
                code: 'Deploy to $BUILDKITE_BRANCH',
                description: 'Labels can include environment variables'
            }
        ],
        links: [
            {
                text: 'Buildkite Step Types Documentation',
                url: 'https://buildkite.com/docs/pipelines/step-types'
            }
        ]
    },

    'step-key': {
        title: 'Step Key',
        short: 'Unique identifier for dependencies and targeting',
        description: 'The key uniquely identifies this step within the pipeline. Other steps can depend on this step by referencing its key. Keys are also used for retry targeting and artifact dependencies.',
        examples: [
            {
                title: 'Simple Key',
                code: 'build',
                description: 'Use lowercase, no spaces'
            },
            {
                title: 'Descriptive Key',
                code: 'unit-tests-backend',
                description: 'Be specific for complex pipelines'
            }
        ],
        notes: [
            'Keys must be unique within the pipeline',
            'Use only lowercase letters, numbers, and hyphens',
            'Keys cannot contain spaces or special characters'
        ],
        links: [
            {
                text: 'Dependencies Documentation',
                url: 'https://buildkite.com/docs/pipelines/dependencies'
            }
        ]
    },

    'step-command': {
        title: 'Command',
        short: 'Shell commands to execute in this step',
        description: 'The command field contains one or more shell commands that will be executed by the agent. Commands run in the order specified and the step fails if any command returns a non-zero exit code.',
        examples: [
            {
                title: 'Single Command',
                code: 'npm test',
                description: 'Run a single command'
            },
            {
                title: 'Multiple Commands',
                code: 'npm install\nnpm run build\nnpm test',
                description: 'Each line is a separate command'
            },
            {
                title: 'With Environment Variables',
                code: 'echo "Building branch: $BUILDKITE_BRANCH"\nmake build',
                description: 'Access Buildkite environment variables'
            }
        ],
        notes: [
            'Commands run in a Bash shell by default',
            'Each line is executed as a separate command',
            'Use && to chain commands that must all succeed',
            'Exit code 0 means success, non-zero means failure'
        ],
        links: [
            {
                text: 'Command Step Documentation',
                url: 'https://buildkite.com/docs/pipelines/command-step'
            },
            {
                text: 'Environment Variables',
                url: 'https://buildkite.com/docs/pipelines/environment-variables'
            }
        ]
    },

    'step-agents': {
        title: 'Agent Targeting',
        short: 'Specify which agents can run this step',
        description: 'Agent targeting determines which agents are eligible to run this step. You can target agents by queue name or by matching agent tags.',
        examples: [
            {
                title: 'Target by Queue',
                code: 'queue: "default"',
                description: 'Run on agents in the default queue'
            },
            {
                title: 'Target by Tags',
                code: 'docker: "true"\nos: "linux"',
                description: 'Match agents with specific tags'
            }
        ],
        links: [
            {
                text: 'Agent Queues Documentation',
                url: 'https://buildkite.com/docs/agent/v3/queues'
            },
            {
                text: 'Agent Targeting',
                url: 'https://buildkite.com/docs/pipelines/defining-steps#targeting-agents'
            }
        ]
    },

    'step-parallelism': {
        title: 'Parallelism',
        short: 'Run multiple instances of this step in parallel',
        description: 'Parallelism allows you to run multiple instances of the same step simultaneously. This is useful for splitting up test suites or running the same deployment across multiple regions.',
        examples: [
            {
                title: 'Fixed Parallelism',
                code: '5',
                description: 'Run exactly 5 parallel jobs'
            },
            {
                title: 'With Index Variable',
                code: 'npm test -- --shard=$BUILDKITE_PARALLEL_JOB_INDEX/$BUILDKITE_PARALLEL_JOB_COUNT',
                description: 'Use job index to split work'
            }
        ],
        notes: [
            'Each parallel job gets a unique BUILDKITE_PARALLEL_JOB_INDEX (0-based)',
            'BUILDKITE_PARALLEL_JOB_COUNT contains the total number of jobs',
            'All parallel jobs must complete before dependent steps can run'
        ],
        links: [
            {
                text: 'Parallel Builds Documentation',
                url: 'https://buildkite.com/docs/pipelines/parallel-builds'
            }
        ]
    },

    'step-timeout': {
        title: 'Timeout',
        short: 'Maximum time this step can run (in minutes)',
        description: 'Set a timeout to prevent steps from running indefinitely. If the step exceeds this time limit, it will be automatically canceled and marked as failed.',
        examples: [
            {
                title: 'Quick Task',
                code: '5',
                description: '5 minute timeout for fast operations'
            },
            {
                title: 'Long Build',
                code: '60',
                description: '1 hour for complex builds'
            }
        ],
        notes: [
            'Timeout is specified in minutes',
            'Default is no timeout (step can run indefinitely)',
            'Includes time spent waiting for an agent'
        ],
        links: [
            {
                text: 'Timeouts Documentation',
                url: 'https://buildkite.com/docs/pipelines/command-step#timeout-in-minutes'
            }
        ]
    },

    'step-retry': {
        title: 'Retry Configuration',
        short: 'Automatically retry failed steps',
        description: 'Configure automatic retries for steps that fail. This is useful for handling transient failures like network issues or flaky tests.',
        examples: [
            {
                title: 'Simple Retry',
                code: 'automatic: true',
                description: 'Retry once automatically on failure'
            },
            {
                title: 'Multiple Retries',
                code: 'automatic:\n  limit: 3',
                description: 'Retry up to 3 times'
            },
            {
                title: 'Conditional Retry',
                code: 'automatic:\n  - exit_status: -1\n    limit: 2\n  - exit_status: 255\n    limit: 1',
                description: 'Different retry limits based on exit code'
            }
        ],
        links: [
            {
                text: 'Retry Documentation',
                url: 'https://buildkite.com/docs/pipelines/command-step#retry-attributes'
            }
        ]
    },

    'step-artifact-paths': {
        title: 'Artifact Paths',
        short: 'Files to upload as build artifacts',
        description: 'Specify files or directories to upload as build artifacts. These artifacts can be downloaded by subsequent steps or viewed in the Buildkite UI.',
        examples: [
            {
                title: 'Single File',
                code: 'report.html',
                description: 'Upload a specific file'
            },
            {
                title: 'Directory',
                code: 'coverage/**/*',
                description: 'Upload all files in a directory'
            },
            {
                title: 'Multiple Patterns',
                code: 'dist/**/*\nlogs/*.log\ntest-results.xml',
                description: 'Multiple patterns on separate lines'
            }
        ],
        notes: [
            'Uses glob patterns for matching files',
            'Uploaded after the step completes successfully',
            'Artifacts are retained according to your retention policy'
        ],
        links: [
            {
                text: 'Artifacts Documentation',
                url: 'https://buildkite.com/docs/pipelines/artifacts'
            }
        ]
    },

    'step-soft-fail': {
        title: 'Soft Fail',
        short: 'Allow step to fail without failing the build',
        description: 'When soft fail is enabled, the step can fail without causing the entire build to fail. You can make this conditional based on exit codes or other criteria.',
        examples: [
            {
                title: 'Always Soft Fail',
                code: 'true',
                description: 'Step failure never fails the build'
            },
            {
                title: 'Specific Exit Codes',
                code: 'exit_status: 2',
                description: 'Only soft fail for exit code 2'
            },
            {
                title: 'Multiple Exit Codes',
                code: 'exit_status: [1, 2, 127]',
                description: 'Soft fail for specific exit codes'
            }
        ],
        links: [
            {
                text: 'Soft Fail Documentation',
                url: 'https://buildkite.com/docs/pipelines/command-step#soft-fail'
            }
        ]
    },

    'step-env': {
        title: 'Environment Variables',
        short: 'Set environment variables for this step',
        description: 'Define environment variables that will be available during step execution. These override any existing variables with the same name.',
        examples: [
            {
                title: 'Simple Variable',
                code: 'NODE_ENV: "test"',
                description: 'Set a single variable'
            },
            {
                title: 'Multiple Variables',
                code: 'NODE_ENV: "production"\nDATABASE_URL: "postgres://..."',
                description: 'Each line is a key: value pair'
            }
        ],
        links: [
            {
                text: 'Environment Variables Documentation',
                url: 'https://buildkite.com/docs/pipelines/environment-variables'
            }
        ]
    },

    'step-skip': {
        title: 'Skip Condition',
        short: 'Conditionally skip this step',
        description: 'Skip this step based on a condition. Skipped steps are shown in the UI but do not run. Use boolean expressions with environment variables.',
        examples: [
            {
                title: 'Skip on Branch',
                code: 'branch != "main"',
                description: 'Skip unless on main branch'
            },
            {
                title: 'Skip on Tag',
                code: 'build.tag == null',
                description: 'Skip if not a tagged build'
            }
        ],
        links: [
            {
                text: 'Conditionals Documentation',
                url: 'https://buildkite.com/docs/pipelines/conditionals'
            }
        ]
    },

    'step-plugins': {
        title: 'Plugins',
        short: 'Extend step functionality with plugins',
        description: 'Plugins add functionality to your steps like Docker support, secret management, or test analytics. Each plugin has its own configuration options.',
        examples: [
            {
                title: 'Docker Plugin',
                code: 'docker#v5.0.0:\n  image: "node:16"',
                description: 'Run commands in a Docker container'
            },
            {
                title: 'Multiple Plugins',
                code: 'docker#v5.0.0:\n  image: "node:16"\nartifacts#v1.5.0:\n  upload: "coverage/**/*"',
                description: 'Combine multiple plugins'
            }
        ],
        links: [
            {
                text: 'Plugins Directory',
                url: 'https://buildkite.com/plugins'
            },
            {
                text: 'Using Plugins',
                url: 'https://buildkite.com/docs/plugins/using'
            }
        ]
    },

    // Wait Step Fields
    'wait-continue-on-failure': {
        title: 'Continue on Failure',
        short: 'Continue pipeline even if previous steps failed',
        description: 'When enabled, the pipeline continues past this wait step even if previous steps have failed. This is useful for cleanup steps that should always run.',
        examples: [
            {
                title: 'Always Continue',
                code: 'continue_on_failure: true',
                description: 'Pipeline continues regardless of failures'
            }
        ],
        links: [
            {
                text: 'Wait Step Documentation',
                url: 'https://buildkite.com/docs/pipelines/wait-step'
            }
        ]
    },

    // Block Step Fields
    'block-label': {
        title: 'Block Label',
        short: 'Text shown on the manual unblock button',
        description: 'The label appears on the button that users click to unblock the pipeline. Make it clear what action will be taken.',
        examples: [
            {
                title: 'Deployment Block',
                code: '🚀 Deploy to Production',
                description: 'Clear action with emoji'
            },
            {
                title: 'Approval Block',
                code: 'Manager Approval Required',
                description: 'Indicates who should unblock'
            }
        ],
        links: [
            {
                text: 'Block Step Documentation',
                url: 'https://buildkite.com/docs/pipelines/block-step'
            }
        ]
    },

    'block-prompt': {
        title: 'Block Prompt',
        short: 'Message shown when pipeline is blocked',
        description: 'This message provides context about why the pipeline is blocked and what should be done before unblocking.',
        examples: [
            {
                title: 'Deployment Prompt',
                code: 'Please review the changes and confirm deployment to production',
                description: 'Clear instructions for the reviewer'
            }
        ]
    },

    'block-fields': {
        title: 'Block Fields',
        short: 'Collect input when unblocking',
        description: 'Define form fields that users must fill out when unblocking the pipeline. Field values are available as environment variables in subsequent steps.',
        examples: [
            {
                title: 'Text Field',
                code: 'key: "release_notes"\ntext: "Release Notes"\nrequired: true',
                description: 'Required text input'
            },
            {
                title: 'Select Field',
                code: 'key: "environment"\nselect: "Target Environment"\noptions:\n  - label: "Staging"\n    value: "staging"\n  - label: "Production"\n    value: "production"',
                description: 'Dropdown selection'
            }
        ],
        links: [
            {
                text: 'Block Step Fields',
                url: 'https://buildkite.com/docs/pipelines/block-step#block-step-attributes'
            }
        ]
    },

    // Input Step Fields
    'input-label': {
        title: 'Input Label',
        short: 'Title for the input collection form',
        description: 'The main heading shown on the input collection form. This should clearly indicate what information is being requested.',
        examples: [
            {
                title: 'Deployment Configuration',
                code: 'Deployment Configuration',
                description: 'Clear, descriptive title'
            }
        ],
        links: [
            {
                text: 'Input Step Documentation',
                url: 'https://buildkite.com/docs/pipelines/input-step'
            }
        ]
    },

    'input-prompt': {
        title: 'Input Prompt',
        short: 'Instructions for filling out the form',
        description: 'Provide detailed instructions or context about what information should be entered in the form fields.',
        examples: [
            {
                title: 'Version Input',
                code: 'Enter the version number for this release (e.g., v1.2.3)',
                description: 'Specific format instructions'
            }
        ]
    },

    'input-fields': {
        title: 'Input Fields',
        short: 'Form fields for collecting user input',
        description: 'Define the fields that users will fill out. Each field\'s value becomes available as an environment variable in subsequent steps.',
        examples: [
            {
                title: 'Text Input',
                code: 'key: "version"\ntext: "Version Number"\ndefault: "v1.0.0"\nrequired: true',
                description: 'Required text field with default'
            },
            {
                title: 'Boolean Field',
                code: 'key: "skip_tests"\nboolean: "Skip Tests"\ndefault: false',
                description: 'Checkbox input'
            }
        ],
        notes: [
            'Field values are available as environment variables',
            'Use the field key to reference values: $BUILDKITE_INPUT_KEY'
        ],
        links: [
            {
                text: 'Input Step Fields',
                url: 'https://buildkite.com/docs/pipelines/input-step#input-step-attributes'
            }
        ]
    },

    // Trigger Step Fields
    'trigger-pipeline': {
        title: 'Target Pipeline',
        short: 'Pipeline to trigger (slug or UUID)',
        description: 'Specify which pipeline to trigger. Use the pipeline slug (from the URL) or the pipeline UUID.',
        examples: [
            {
                title: 'By Slug',
                code: 'deploy-pipeline',
                description: 'Using the pipeline slug'
            },
            {
                title: 'By UUID',
                code: '5e3b2f3a-3e3f-4dc7-a98f-6b5d0f3e3b2f',
                description: 'Using the pipeline UUID'
            }
        ],
        links: [
            {
                text: 'Trigger Step Documentation',
                url: 'https://buildkite.com/docs/pipelines/trigger-step'
            }
        ]
    },

    'trigger-label': {
        title: 'Trigger Label',
        short: 'Label for this trigger step',
        description: 'A descriptive label for the trigger step, shown in the pipeline UI.',
        examples: [
            {
                title: 'Deploy Trigger',
                code: '🚀 Trigger Deployment Pipeline',
                description: 'Clear description of what\'s triggered'
            }
        ]
    },

    'trigger-async': {
        title: 'Async Mode',
        short: 'Don\'t wait for triggered build to complete',
        description: 'When enabled, the pipeline continues immediately without waiting for the triggered build to complete. When disabled, the step waits for the triggered build to finish.',
        examples: [
            {
                title: 'Fire and Forget',
                code: 'async: true',
                description: 'Continue immediately'
            },
            {
                title: 'Wait for Completion',
                code: 'async: false',
                description: 'Wait for triggered build'
            }
        ]
    },

    'trigger-build': {
        title: 'Build Configuration',
        short: 'Configuration for the triggered build',
        description: 'Specify build parameters like branch, commit, message, and environment variables for the triggered pipeline.',
        examples: [
            {
                title: 'Basic Trigger',
                code: 'branch: "main"\nmessage: "Triggered from main pipeline"',
                description: 'Trigger with branch and message'
            },
            {
                title: 'With Environment Variables',
                code: 'branch: "main"\nenv:\n  DEPLOY_ENV: "production"\n  VERSION: "$BUILDKITE_TAG"',
                description: 'Pass environment variables'
            }
        ]
    },

    // Group Step Fields
    'group-label': {
        title: 'Group Label',
        short: 'Name for this group of steps',
        description: 'Groups allow you to organize related steps together. The label is shown as a collapsible section in the build UI.',
        examples: [
            {
                title: 'Test Group',
                code: '🧪 Test Suite',
                description: 'Group all test-related steps'
            },
            {
                title: 'Platform Group',
                code: '📱 iOS Build and Test',
                description: 'Platform-specific grouping'
            }
        ],
        links: [
            {
                text: 'Group Step Documentation',
                url: 'https://buildkite.com/docs/pipelines/group-step'
            }
        ]
    },

    // Notification Fields
    'notify-email': {
        title: 'Email Notification',
        short: 'Email addresses to notify',
        description: 'Send email notifications when builds reach certain states. Separate multiple addresses with commas.',
        examples: [
            {
                title: 'Single Email',
                code: 'team@example.com',
                description: 'Notify one address'
            },
            {
                title: 'Multiple Emails',
                code: 'dev@example.com, ops@example.com',
                description: 'Comma-separated list'
            }
        ],
        links: [
            {
                text: 'Notifications Documentation',
                url: 'https://buildkite.com/docs/pipelines/notifications'
            }
        ]
    },

    'notify-slack': {
        title: 'Slack Notification',
        short: 'Slack webhook URL or channel',
        description: 'Send notifications to Slack using a webhook URL or by specifying a channel (requires Slack integration).',
        examples: [
            {
                title: 'Webhook URL',
                code: 'https://hooks.slack.com/services/...',
                description: 'Direct webhook URL'
            },
            {
                title: 'Channel Name',
                code: '#deployments',
                description: 'Requires Slack integration'
            }
        ]
    },

    // Pipeline Upload Fields
    'pipeline-upload-file': {
        title: 'Pipeline File',
        short: 'Path to pipeline YAML file',
        description: 'Upload a pipeline configuration from a file in your repository. This allows dynamic pipeline generation.',
        examples: [
            {
                title: 'Default Location',
                code: '.buildkite/pipeline.yml',
                description: 'Standard pipeline location'
            },
            {
                title: 'Dynamic Pipeline',
                code: '.buildkite/pipeline-${BUILDKITE_BRANCH}.yml',
                description: 'Branch-specific pipeline'
            }
        ],
        links: [
            {
                text: 'Dynamic Pipelines',
                url: 'https://buildkite.com/docs/pipelines/dynamic-pipelines'
            }
        ]
    },

    'pipeline-upload-replace': {
        title: 'Replace Pipeline',
        short: 'Replace current pipeline instead of appending',
        description: 'When enabled, the uploaded pipeline replaces all remaining steps. When disabled, steps are appended to the current pipeline.',
        examples: [
            {
                title: 'Replace Mode',
                code: 'replace: true',
                description: 'Replace all remaining steps'
            },
            {
                title: 'Append Mode',
                code: 'replace: false',
                description: 'Add to existing pipeline'
            }
        ]
    },

    // Common Fields
    'step-depends-on': {
        title: 'Dependencies',
        short: 'Steps that must complete before this one',
        description: 'Specify which steps must complete successfully before this step can run. Use step keys or wait for all previous steps.',
        examples: [
            {
                title: 'Single Dependency',
                code: 'build',
                description: 'Wait for the build step'
            },
            {
                title: 'Multiple Dependencies',
                code: '- build\n- test\n- lint',
                description: 'Wait for multiple steps'
            },
            {
                title: 'Allow Failures',
                code: 'depends_on:\n  - step: "tests"\n    allow_failure: true',
                description: 'Continue even if dependency fails'
            }
        ],
        links: [
            {
                text: 'Dependencies Documentation',
                url: 'https://buildkite.com/docs/pipelines/dependencies'
            }
        ]
    },

    'step-if': {
        title: 'Conditional Execution',
        short: 'Run step only if condition is true',
        description: 'Use conditional expressions to control when steps run. Conditions can check branch names, build properties, and environment variables.',
        examples: [
            {
                title: 'Branch Condition',
                code: 'branch == "main"',
                description: 'Only run on main branch'
            },
            {
                title: 'Tag Condition',
                code: 'build.tag != null',
                description: 'Only run for tagged builds'
            },
            {
                title: 'Complex Condition',
                code: 'branch == "main" && build.pull_request == null',
                description: 'Multiple conditions with AND'
            }
        ],
        links: [
            {
                text: 'Conditionals Documentation',
                url: 'https://buildkite.com/docs/pipelines/conditionals'
            }
        ]
    },

    'step-branches': {
        title: 'Branch Filtering',
        short: 'Limit step to specific branches',
        description: 'Specify which branches this step should run on. Supports exact matches and glob patterns.',
        examples: [
            {
                title: 'Single Branch',
                code: 'main',
                description: 'Only run on main'
            },
            {
                title: 'Multiple Branches',
                code: 'main develop feature/*',
                description: 'Space-separated list'
            },
            {
                title: 'Exclude Pattern',
                code: '!feature/*',
                description: 'Run on all except feature branches'
            }
        ]
    },

    // Matrix Configuration
    'step-matrix': {
        title: 'Matrix Configuration',
        short: 'Run step with multiple parameter combinations',
        description: 'Matrix builds allow you to run the same step with different combinations of parameters. Each combination runs as a separate job.',
        examples: [
            {
                title: 'Simple Matrix',
                code: 'os: ["ubuntu", "macos"]\nnode: ["14", "16", "18"]',
                description: 'Test on multiple OS and Node versions'
            },
            {
                title: 'With Exclusions',
                code: 'setup:\n  os: ["ubuntu", "macos"]\n  node: ["14", "16"]\nadjustments:\n  - with:\n      os: "macos"\n      node: "14"\n    skip: true',
                description: 'Skip specific combinations'
            }
        ],
        links: [
            {
                text: 'Matrix Builds Documentation',
                url: 'https://buildkite.com/docs/pipelines/matrix-builds'
            }
        ]
    },

    // Priority
    'step-priority': {
        title: 'Step Priority',
        short: 'Job priority in the agent queue',
        description: 'Higher priority jobs are assigned to agents first. Priority is an integer where higher numbers mean higher priority.',
        examples: [
            {
                title: 'High Priority',
                code: '100',
                description: 'Prioritize critical builds'
            },
            {
                title: 'Low Priority',
                code: '-1',
                description: 'Run after other jobs'
            }
        ],
        notes: [
            'Default priority is 0',
            'Priority only matters when multiple jobs are waiting',
            'Negative priorities are allowed'
        ]
    },

    // Cancel on Build Failing
    'step-cancel-on-build-failing': {
        title: 'Cancel on Build Failing',
        short: 'Cancel this step if the build is failing',
        description: 'When enabled, this step will be automatically canceled if any other step in the build fails. This prevents running unnecessary steps in a failing build.',
        examples: [
            {
                title: 'Enable Cancellation',
                code: 'cancel_on_build_failing: true',
                description: 'Skip if build is already failing'
            }
        ]
    },

    // Group Step Fields
    'group-key': {
        title: 'Group Key',
        short: 'Unique identifier for this group',
        description: 'A unique key for this group that can be used in dependencies. Other steps can depend on the entire group completing.',
        examples: [
            {
                title: 'Simple Key',
                code: 'test-group',
                description: 'All tests must complete before dependent steps'
            }
        ],
        links: [
            {
                text: 'Group Step Documentation',
                url: 'https://buildkite.com/docs/pipelines/group-step'
            }
        ]
    },

    // Annotation Fields
    'annotation-body': {
        title: 'Annotation Body',
        short: 'Content of the build annotation',
        description: 'The annotation content supports Markdown formatting. Annotations appear on the build page to provide additional context or information.',
        examples: [
            {
                title: 'Simple Text',
                code: 'Build completed successfully!',
                description: 'Plain text annotation'
            },
            {
                title: 'Markdown Formatted',
                code: '## Test Results\\n\\n- ✅ 150 tests passed\\n- ⚠️ 2 tests skipped',
                description: 'Rich formatting with Markdown'
            }
        ],
        links: [
            {
                text: 'Annotations Documentation',
                url: 'https://buildkite.com/docs/agent/v3/cli-annotate'
            }
        ]
    },

    'annotation-style': {
        title: 'Annotation Style',
        short: 'Visual style of the annotation',
        description: 'Choose how the annotation appears on the build page. Different styles help categorize different types of information.',
        examples: [
            {
                title: 'Success Style',
                code: 'style: "success"',
                description: 'Green background for positive messages'
            },
            {
                title: 'Warning Style',
                code: 'style: "warning"',
                description: 'Yellow background for warnings'
            },
            {
                title: 'Error Style',
                code: 'style: "error"',
                description: 'Red background for errors'
            }
        ]
    },

    'annotation-context': {
        title: 'Annotation Context',
        short: 'Unique identifier for this annotation',
        description: 'Context allows you to update or replace specific annotations. Annotations with the same context will replace each other.',
        examples: [
            {
                title: 'Test Results',
                code: 'test-results',
                description: 'Updates test result annotation'
            },
            {
                title: 'Coverage Report',
                code: 'coverage',
                description: 'Updates coverage annotation'
            }
        ]
    },

    'annotation-append': {
        title: 'Append Mode',
        short: 'Append to existing annotation',
        description: 'When enabled, the annotation content is appended to any existing annotation with the same context instead of replacing it.',
        examples: [
            {
                title: 'Append Logs',
                code: 'append: true',
                description: 'Add to existing annotation content'
            }
        ]
    },

    // Plugin Configuration
    'plugin-config': {
        title: 'Plugin Configuration',
        short: 'Configure plugin settings',
        description: 'Each plugin has its own configuration options. Refer to the plugin documentation for available settings.',
        links: [
            {
                text: 'Buildkite Plugins Directory',
                url: 'https://buildkite.com/plugins'
            }
        ]
    },

    // Environment Variable Manager
    'env-var-name': {
        title: 'Variable Name',
        short: 'Environment variable name',
        description: 'The name of the environment variable. Use uppercase letters with underscores for conventional naming.',
        examples: [
            {
                title: 'Standard Variable',
                code: 'NODE_ENV',
                description: 'Common Node.js environment'
            },
            {
                title: 'Custom Variable',
                code: 'API_KEY',
                description: 'Application-specific variable'
            }
        ]
    },

    'env-var-value': {
        title: 'Variable Value',
        short: 'Value for the environment variable',
        description: 'The value assigned to the environment variable. Can include references to other variables using $VARIABLE_NAME syntax.',
        examples: [
            {
                title: 'Static Value',
                code: 'production',
                description: 'Fixed value'
            },
            {
                title: 'Dynamic Value',
                code: 'v$BUILDKITE_BUILD_NUMBER',
                description: 'Include build number'
            }
        ]
    },

    // Matrix Builder
    'matrix-dimension': {
        title: 'Matrix Dimension',
        short: 'Variable name for matrix axis',
        description: 'Each dimension creates a new axis in the matrix. The build will run once for each combination of dimension values.',
        examples: [
            {
                title: 'OS Dimension',
                code: 'os: ["ubuntu", "macos", "windows"]',
                description: 'Test across operating systems'
            },
            {
                title: 'Version Dimension',
                code: 'node: ["14", "16", "18"]',
                description: 'Test across Node.js versions'
            }
        ],
        links: [
            {
                text: 'Matrix Builds Documentation',
                url: 'https://buildkite.com/docs/pipelines/matrix-builds'
            }
        ]
    },

    // Conditional Logic
    'condition-type': {
        title: 'Condition Type',
        short: 'Type of conditional check',
        description: 'Choose what aspect of the build to check in your condition. Conditions determine whether steps run.',
        examples: [
            {
                title: 'Branch Check',
                code: 'branch == "main"',
                description: 'Check current branch'
            },
            {
                title: 'Build Property',
                code: 'build.tag != null',
                description: 'Check if build is tagged'
            },
            {
                title: 'Environment Check',
                code: 'env.DEPLOY_ENV == "production"',
                description: 'Check environment variable'
            }
        ],
        links: [
            {
                text: 'Conditional Steps',
                url: 'https://buildkite.com/docs/pipelines/conditionals'
            }
        ]
    },

    // Agent Tags
    'agent-tag-key': {
        title: 'Tag Key',
        short: 'Agent tag name',
        description: 'Agent tags are key-value pairs used to target specific agents. Common tags include OS, architecture, or custom capabilities.',
        examples: [
            {
                title: 'OS Tag',
                code: 'os',
                description: 'Operating system type'
            },
            {
                title: 'Docker Tag',
                code: 'docker',
                description: 'Docker availability'
            },
            {
                title: 'GPU Tag',
                code: 'gpu',
                description: 'GPU availability'
            }
        ]
    },

    'agent-tag-value': {
        title: 'Tag Value',
        short: 'Required value for the tag',
        description: 'The value that agents must have for this tag to be eligible to run the step.',
        examples: [
            {
                title: 'OS Value',
                code: 'linux',
                description: 'Target Linux agents'
            },
            {
                title: 'Boolean Value',
                code: 'true',
                description: 'Agent must have this capability'
            }
        ]
    },

    // Webhook Notification
    'notify-webhook': {
        title: 'Webhook URL',
        short: 'URL to send notifications',
        description: 'Send HTTP POST notifications to a webhook URL when builds reach certain states.',
        examples: [
            {
                title: 'Webhook Endpoint',
                code: 'https://api.example.com/buildkite/webhook',
                description: 'Your webhook endpoint'
            }
        ]
    },

    'notify-pagerduty': {
        title: 'PagerDuty Integration Key',
        short: 'PagerDuty service integration key',
        description: 'Send alerts to PagerDuty when builds fail. Requires a PagerDuty Events API v2 integration key.',
        examples: [
            {
                title: 'Integration Key',
                code: 'YOUR_INTEGRATION_KEY',
                description: 'From PagerDuty service settings'
            }
        ],
        links: [
            {
                text: 'PagerDuty Integration',
                url: 'https://buildkite.com/docs/integrations/pagerduty'
            }
        ]
    }
};

// Export for use in other modules
window.helpContent = helpContent;