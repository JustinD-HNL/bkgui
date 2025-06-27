// console-debug.js
/**
 * Quick Debug Script for Firebase auth/internal-error
 * 
 * Usage: Copy and paste this entire script into your browser console
 * when experiencing auth/internal-error to get immediate diagnostics
 */

(function() {
    console.log('🔬 Firebase Auth Internal Error Debug Script Starting...');
    console.log('================================================================');
    
    async function runQuickDiagnostic() {
        const results = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            tests: []
        };
        
        // Test 1: Environment Check
        console.log('🌐 Testing Environment...');
        try {
            const envTest = {
                name: 'Environment',
                status: 'pass',
                details: {
                    firebaseSDK: typeof firebase !== 'undefined',
                    firebaseAuth: typeof firebase !== 'undefined' && !!firebase.auth,
                    secureContext: window.isSecureContext,
                    cookiesEnabled: navigator.cookieEnabled,
                    online: navigator.onLine
                }
            };
            
            if (!envTest.details.firebaseSDK) {
                envTest.status = 'fail';
                envTest.error = 'Firebase SDK not loaded';
            } else if (!envTest.details.firebaseAuth) {
                envTest.status = 'fail';
                envTest.error = 'Firebase Auth not available';
            } else if (!envTest.details.secureContext && window.location.protocol !== 'http:') {
                envTest.status = 'warning';
                envTest.error = 'Not in secure context (may cause issues)';
            }
            
            results.tests.push(envTest);
            console.log('✅ Environment test:', envTest);
        } catch (error) {
            results.tests.push({
                name: 'Environment',
                status: 'fail',
                error: error.message
            });
            console.error('❌ Environment test failed:', error);
        }
        
        // Test 2: Server Configuration
        console.log('🖥️ Testing Server Configuration...');
        try {
            const configResponse = await fetch('/api/firebase-config');
            const configTest = {
                name: 'Server Configuration',
                status: configResponse.ok ? 'pass' : 'fail',
                details: {
                    status: configResponse.status,
                    available: configResponse.ok
                }
            };
            
            if (configResponse.ok) {
                const config = await configResponse.json();
                configTest.details.hasApiKey = !!config.apiKey;
                configTest.details.hasAuthDomain = !!config.authDomain;
                configTest.details.hasProjectId = !!config.projectId;
                
                if (!config.apiKey || !config.authDomain || !config.projectId) {
                    configTest.status = 'fail';
                    configTest.error = 'Incomplete Firebase configuration';
                }
            } else {
                configTest.error = `Server returned ${configResponse.status}`;
            }
            
            results.tests.push(configTest);
            console.log('🖥️ Server config test:', configTest);
        } catch (error) {
            results.tests.push({
                name: 'Server Configuration',
                status: 'fail',
                error: error.message
            });
            console.error('❌ Server config test failed:', error);
        }
        
        // Test 3: Firebase Connectivity
        console.log('🔥 Testing Firebase Connectivity...');
        try {
            // Try to access Firebase endpoints
            const endpoints = [
                'https://identitytoolkit.googleapis.com/',
                'https://securetoken.googleapis.com/'
            ];
            
            const connectivityTest = {
                name: 'Firebase Connectivity',
                status: 'pass',
                details: {}
            };
            
            for (const endpoint of endpoints) {
                try {
                    await fetch(endpoint, { method: 'HEAD', mode: 'no-cors' });
                    connectivityTest.details[endpoint] = 'reachable';
                } catch (error) {
                    connectivityTest.details[endpoint] = 'unreachable';
                    connectivityTest.status = 'warning';
                }
            }
            
            results.tests.push(connectivityTest);
            console.log('🔥 Firebase connectivity test:', connectivityTest);
        } catch (error) {
            results.tests.push({
                name: 'Firebase Connectivity',
                status: 'fail',
                error: error.message
            });
            console.error('❌ Firebase connectivity test failed:', error);
        }
        
        // Test 4: Google Auth Provider
        console.log('🔐 Testing Google Auth Provider...');
        try {
            const authTest = {
                name: 'Google Auth Provider',
                status: 'pass',
                details: {}
            };
            
            if (typeof firebase !== 'undefined' && firebase.auth) {
                if (!firebase.apps.length) {
                    // Try to get config and initialize
                    const configResponse = await fetch('/api/firebase-config');
                    if (configResponse.ok) {
                        const config = await configResponse.json();
                        firebase.initializeApp(config);
                    }
                }
                
                if (firebase.apps.length > 0) {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    authTest.details.providerCreated = !!provider;
                    authTest.details.providerId = provider.providerId;
                } else {
                    authTest.status = 'fail';
                    authTest.error = 'Firebase not initialized';
                }
            } else {
                authTest.status = 'fail';
                authTest.error = 'Firebase Auth not available';
            }
            
            results.tests.push(authTest);
            console.log('🔐 Google Auth test:', authTest);
        } catch (error) {
            results.tests.push({
                name: 'Google Auth Provider',
                status: 'fail',
                error: error.message
            });
            console.error('❌ Google Auth test failed:', error);
        }
        
        // Test 5: Browser Security
        console.log('🛡️ Testing Browser Security...');
        try {
            const securityTest = {
                name: 'Browser Security',
                status: 'pass',
                details: {}
            };
            
            // Test localStorage
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                securityTest.details.localStorage = 'available';
            } catch (error) {
                securityTest.details.localStorage = 'blocked';
                securityTest.status = 'warning';
            }
            
            // Test popup capability
            const popup = window.open('', '', 'width=1,height=1');
            if (popup) {
                popup.close();
                securityTest.details.popups = 'allowed';
            } else {
                securityTest.details.popups = 'blocked';
                securityTest.status = 'warning';
            }
            
            results.tests.push(securityTest);
            console.log('🛡️ Browser security test:', securityTest);
        } catch (error) {
            results.tests.push({
                name: 'Browser Security',
                status: 'fail',
                error: error.message
            });
            console.error('❌ Browser security test failed:', error);
        }
        
        return results;
    }
    
    function analyzeResults(results) {
        console.log('📊 Analyzing Results...');
        console.log('================================================================');
        
        const failures = results.tests.filter(t => t.status === 'fail');
        const warnings = results.tests.filter(t => t.status === 'warning');
        const passed = results.tests.filter(t => t.status === 'pass');
        
        console.log(`✅ ${passed.length} tests passed`);
        console.log(`⚠️ ${warnings.length} warnings`);
        console.log(`❌ ${failures.length} failures`);
        
        if (failures.length === 0 && warnings.length === 0) {
            console.log('🎉 All tests passed! The auth/internal-error might be temporary.');
            console.log('💡 Try signing in again. If the error persists, it might be a Firebase service issue.');
            return;
        }
        
        console.log('\n🔧 RECOMMENDED FIXES:');
        console.log('================================================================');
        
        failures.forEach(failure => {
            console.log(`\n❌ ${failure.name}: ${failure.error}`);
            
            switch (failure.name) {
                case 'Environment':
                    if (failure.error.includes('Firebase SDK')) {
                        console.log('  🔧 Fix: Ensure Firebase scripts are loaded in your HTML');
                        console.log('  📋 Add: <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>');
                        console.log('  📋 Add: <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>');
                    }
                    break;
                    
                case 'Server Configuration':
                    console.log('  🔧 Fix: Set Firebase environment variables in your deployment');
                    console.log('  📋 Required: FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID');
                    console.log('  📋 For local development: Create firebase-config.js file');
                    break;
                    
                case 'Google Auth Provider':
                    console.log('  🔧 Fix: Enable Google Sign-In in Firebase Console');
                    console.log('  📋 Go to: Firebase Console → Authentication → Sign-in method');
                    console.log('  📋 Enable: Google provider');
                    break;
            }
        });
        
        warnings.forEach(warning => {
            console.log(`\n⚠️ ${warning.name}: May cause issues`);
            
            if (warning.name === 'Browser Security') {
                if (warning.details.localStorage === 'blocked') {
                    console.log('  🔧 Fix: Enable localStorage/cookies in browser settings');
                }
                if (warning.details.popups === 'blocked') {
                    console.log('  🔧 Fix: Allow popups for this domain');
                }
            }
        });
        
        console.log('\n🔗 NEXT STEPS:');
        console.log('================================================================');
        console.log('1. Fix the issues identified above');
        console.log('2. Refresh the page and try signing in again');
        console.log('3. If issues persist, open /debug-auth.html for advanced diagnostics');
        console.log('4. Check Firebase Console for any service alerts');
        
        // Copy results to clipboard for easy sharing
        try {
            const resultsText = JSON.stringify(results, null, 2);
            navigator.clipboard.writeText(resultsText).then(() => {
                console.log('\n📋 Results copied to clipboard for easy sharing!');
            });
        } catch (error) {
            console.log('\n📋 Results available in the results variable for copying');
        }
    }
    
    // Run the diagnostic
    runQuickDiagnostic()
        .then(results => {
            console.log('\n📊 DIAGNOSTIC RESULTS:');
            console.log('================================================================');
            console.table(results.tests);
            
            analyzeResults(results);
            
            // Make results available globally
            window.firebaseDebugResults = results;
            console.log('\n💾 Full results stored in window.firebaseDebugResults');
            
        })
        .catch(error => {
            console.error('❌ Diagnostic failed:', error);
        });
        
})();