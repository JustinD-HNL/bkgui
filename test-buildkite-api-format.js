// Test script to understand Buildkite API format requirements
// This script tests different YAML formats to see what Buildkite expects

console.log('=== Buildkite API Format Test ===\n');

// Test configurations
const testConfigs = [
    {
        name: 'Test 1: Wrapped in yaml property (current implementation)',
        payload: {
            yaml: `steps:
  - label: "Build"
    command: "make build"`
        }
    },
    {
        name: 'Test 2: Wrapped in configuration property',
        payload: {
            configuration: `steps:
  - label: "Build"
    command: "make build"`
        }
    },
    {
        name: 'Test 3: Direct YAML string',
        payload: `steps:
  - label: "Build"
    command: "make build"`
    },
    {
        name: 'Test 4: Pipeline object with configuration',
        payload: {
            pipeline: {
                configuration: `steps:
  - label: "Build"
    command: "make build"`
            }
        }
    },
    {
        name: 'Test 5: Steps as parsed object',
        payload: {
            steps: [
                {
                    label: "Build",
                    command: "make build"
                }
            ]
        }
    },
    {
        name: 'Test 6: Configuration as object with steps',
        payload: {
            configuration: {
                steps: [
                    {
                        label: "Build",
                        command: "make build"
                    }
                ]
            }
        }
    }
];

// Function to test each configuration
async function testConfiguration(config) {
    console.log(`\n${config.name}`);
    console.log('Payload:', JSON.stringify(config.payload, null, 2));
    
    // Log what would be sent
    const isJsonPayload = typeof config.payload === 'object';
    console.log('Content-Type:', isJsonPayload ? 'application/json' : 'text/plain');
    console.log('Body:', isJsonPayload ? JSON.stringify(config.payload) : config.payload);
    
    // Simulate validation
    if (isJsonPayload && config.payload.yaml) {
        console.log('⚠️  This format might cause "key is invalid" error if Buildkite expects different structure');
    } else if (isJsonPayload && config.payload.configuration && typeof config.payload.configuration === 'string') {
        console.log('✅ This might be the expected format for Buildkite API');
    } else if (!isJsonPayload) {
        console.log('❓ Direct string might need specific Content-Type header');
    }
}

// Run all tests
console.log('Running format tests...\n');
testConfigs.forEach(testConfiguration);

console.log('\n\n=== Recommendations ===');
console.log('1. The error "key is invalid: configuration must be defined with an object" suggests:');
console.log('   - Buildkite expects the YAML under a "configuration" key, not "yaml"');
console.log('   - OR it expects the configuration to be an object, not a string');
console.log('\n2. Try changing line 191 in api-client.js from:');
console.log('   body: JSON.stringify({ yaml })');
console.log('   to:');
console.log('   body: JSON.stringify({ configuration: yaml })');
console.log('\n3. Or parse the YAML and send as an object:');
console.log('   body: JSON.stringify({ configuration: parseYAML(yaml) })');

// Export for use in console
window.buildkiteFormatTest = {
    testConfigs,
    testConfiguration,
    runAllTests: () => testConfigs.forEach(testConfiguration)
};