// Test script to debug YAML generation and API validation issues
// Run this in the browser console when the main app is loaded

console.log('=== YAML API Debug Script ===');

// Test 1: Generate a simple pipeline and check the raw output
function testSimplePipeline() {
    console.log('\n--- Test 1: Simple Pipeline ---');
    
    const config = {
        steps: [
            {
                label: 'Test Step',
                command: 'echo "Hello World"'
            }
        ]
    };
    
    const generator = new YAMLGenerator();
    const yaml = generator.generate(config);
    
    console.log('Config:', config);
    console.log('Generated YAML:');
    console.log(yaml);
    console.log('YAML as JSON string:', JSON.stringify(yaml));
    console.log('YAML length:', yaml.length);
    console.log('First 50 chars:', yaml.substring(0, 50));
    console.log('Last 50 chars:', yaml.substring(yaml.length - 50));
    
    return yaml;
}

// Test 2: Check what's being sent to the API
async function testAPIPayload() {
    console.log('\n--- Test 2: API Payload Test ---');
    
    const yaml = testSimplePipeline();
    
    // Check if we're wrapping the YAML incorrectly
    const payloads = [
        { yaml: yaml },
        { configuration: yaml },
        { pipeline: yaml },
        yaml // Just the string
    ];
    
    console.log('Testing different payload formats:');
    payloads.forEach((payload, index) => {
        console.log(`\nPayload ${index + 1}:`, payload);
        console.log('Type:', typeof payload);
        console.log('JSON stringified:', JSON.stringify(payload));
    });
}

// Test 3: Check the unified validator
function testUnifiedValidator() {
    console.log('\n--- Test 3: Unified Validator Test ---');
    
    if (typeof window.unifiedValidator !== 'undefined') {
        console.log('UnifiedValidator found');
        
        const yaml = testSimplePipeline();
        console.log('Validating YAML:', yaml);
        
        try {
            const result = window.unifiedValidator.validateYAML(yaml);
            console.log('Validation result:', result);
        } catch (error) {
            console.error('Validation error:', error);
        }
    } else {
        console.log('UnifiedValidator not found');
    }
}

// Test 4: Check what the preview modal is doing
function testPreviewModal() {
    console.log('\n--- Test 4: Preview Modal Test ---');
    
    // Check if there's a global variable storing the last YAML
    console.log('Checking for global YAML variables...');
    
    const possibleVars = ['lastGeneratedYAML', 'currentYAML', 'pipelineYAML'];
    possibleVars.forEach(varName => {
        if (window[varName]) {
            console.log(`Found ${varName}:`, window[varName]);
        }
    });
    
    // Check localStorage
    console.log('\nChecking localStorage...');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('yaml') || key.includes('pipeline')) {
            console.log(`localStorage['${key}']:`, localStorage.getItem(key));
        }
    }
}

// Test 5: Intercept API calls
function interceptAPICalls() {
    console.log('\n--- Test 5: API Call Interceptor ---');
    
    // Store the original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to log requests
    window.fetch = async function(...args) {
        const [url, options] = args;
        
        if (url.includes('buildkite') || url.includes('pipeline')) {
            console.log('\n🔍 Intercepted API call:');
            console.log('URL:', url);
            console.log('Method:', options?.method || 'GET');
            console.log('Headers:', options?.headers);
            
            if (options?.body) {
                console.log('Body type:', typeof options.body);
                console.log('Body:', options.body);
                
                try {
                    const parsed = JSON.parse(options.body);
                    console.log('Parsed body:', parsed);
                } catch (e) {
                    console.log('Body is not JSON');
                }
            }
        }
        
        // Call the original fetch
        return originalFetch.apply(this, args);
    };
    
    console.log('API call interceptor installed. Make some API calls to see the payloads.');
}

// Test 6: Check the API client
function testAPIClient() {
    console.log('\n--- Test 6: API Client Test ---');
    
    if (window.apiClient) {
        console.log('API Client found');
        console.log('API Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.apiClient)));
        
        // Check if there's a validatePipeline method
        if (typeof window.apiClient.validatePipeline === 'function') {
            console.log('validatePipeline method found');
            
            // Test with simple YAML
            const yaml = testSimplePipeline();
            console.log('Testing validatePipeline with:', yaml);
            
            // Don't actually call it to avoid side effects
            console.log('(Not calling to avoid side effects)');
        }
    } else {
        console.log('API Client not found');
    }
}

// Run all tests
function runAllTests() {
    testSimplePipeline();
    testAPIPayload();
    testUnifiedValidator();
    testPreviewModal();
    testAPIClient();
    interceptAPICalls();
    
    console.log('\n=== Debug script complete ===');
    console.log('Try creating a pipeline and clicking preview to see intercepted API calls.');
}

// Export functions for manual testing
window.yamlDebug = {
    testSimplePipeline,
    testAPIPayload,
    testUnifiedValidator,
    testPreviewModal,
    interceptAPICalls,
    testAPIClient,
    runAllTests
};

console.log('Debug functions available at window.yamlDebug');
console.log('Run yamlDebug.runAllTests() to execute all tests');