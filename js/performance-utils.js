// Performance Optimization Utilities
class PerformanceUtils {
    constructor() {
        this.memoCache = new Map();
        this.debouncedFunctions = new Map();
        this.throttledFunctions = new Map();
    }

    // Memoization for expensive computations
    memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
        const cache = new Map();
        
        return (...args) => {
            const key = keyGenerator(...args);
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            const result = fn(...args);
            cache.set(key, result);
            
            // Limit cache size to prevent memory leaks
            if (cache.size > 100) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            
            return result;
        };
    }

    // Debounce function calls
    debounce(fn, delay = 300) {
        let timeoutId;
        
        const debounced = (...args) => {
            clearTimeout(timeoutId);
            
            return new Promise((resolve) => {
                timeoutId = setTimeout(() => {
                    resolve(fn(...args));
                }, delay);
            });
        };
        
        debounced.cancel = () => clearTimeout(timeoutId);
        
        return debounced;
    }

    // Throttle function calls
    throttle(fn, limit = 100) {
        let inThrottle = false;
        let lastResult;
        
        return (...args) => {
            if (!inThrottle) {
                inThrottle = true;
                lastResult = fn(...args);
                
                setTimeout(() => {
                    inThrottle = false;
                }, limit);
            }
            
            return lastResult;
        };
    }

    // Request idle callback with fallback
    requestIdleCallback(callback, options = {}) {
        if ('requestIdleCallback' in window) {
            return window.requestIdleCallback(callback, options);
        }
        
        // Fallback for browsers without requestIdleCallback
        const timeout = options.timeout || 50;
        return setTimeout(() => {
            callback({
                didTimeout: false,
                timeRemaining: () => 50
            });
        }, timeout);
    }

    // Batch DOM updates
    batchDOMUpdates(updates) {
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
                resolve();
            });
        });
    }

    // Lazy load with Intersection Observer
    lazyLoad(elements, callback, options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01,
            ...options
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, defaultOptions);

        elements.forEach(element => observer.observe(element));

        return observer;
    }

    // Measure performance
    measurePerformance(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        const measureName = `${name}-duration`;

        performance.mark(startMark);
        
        const result = fn();
        
        // Handle both sync and async functions
        if (result instanceof Promise) {
            return result.finally(() => {
                performance.mark(endMark);
                performance.measure(measureName, startMark, endMark);
                
                const measure = performance.getEntriesByName(measureName)[0];
                console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
                
                // Clean up marks and measures
                performance.clearMarks(startMark);
                performance.clearMarks(endMark);
                performance.clearMeasures(measureName);
            });
        } else {
            performance.mark(endMark);
            performance.measure(measureName, startMark, endMark);
            
            const measure = performance.getEntriesByName(measureName)[0];
            console.log(`${name} took ${measure.duration.toFixed(2)}ms`);
            
            // Clean up marks and measures
            performance.clearMarks(startMark);
            performance.clearMarks(endMark);
            performance.clearMeasures(measureName);
            
            return result;
        }
    }

    // Optimize large array operations
    processInChunks(array, processFn, chunkSize = 100) {
        return new Promise((resolve) => {
            let index = 0;
            const results = [];

            const processChunk = () => {
                const chunk = array.slice(index, index + chunkSize);
                
                chunk.forEach((item, i) => {
                    results.push(processFn(item, index + i));
                });
                
                index += chunkSize;

                if (index < array.length) {
                    this.requestIdleCallback(processChunk);
                } else {
                    resolve(results);
                }
            };

            processChunk();
        });
    }

    // Create a worker pool for parallel processing
    createWorkerPool(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
        const workers = [];
        const taskQueue = [];
        const busyWorkers = new Set();

        for (let i = 0; i < poolSize; i++) {
            const worker = new Worker(workerScript);
            workers.push(worker);
        }

        const executeTask = (task) => {
            const availableWorker = workers.find(w => !busyWorkers.has(w));
            
            if (!availableWorker) {
                taskQueue.push(task);
                return;
            }

            busyWorkers.add(availableWorker);

            availableWorker.onmessage = (e) => {
                busyWorkers.delete(availableWorker);
                task.resolve(e.data);

                // Process next task in queue
                if (taskQueue.length > 0) {
                    executeTask(taskQueue.shift());
                }
            };

            availableWorker.onerror = (error) => {
                busyWorkers.delete(availableWorker);
                task.reject(error);

                // Process next task in queue
                if (taskQueue.length > 0) {
                    executeTask(taskQueue.shift());
                }
            };

            availableWorker.postMessage(task.data);
        };

        return {
            execute: (data) => {
                return new Promise((resolve, reject) => {
                    executeTask({ data, resolve, reject });
                });
            },
            terminate: () => {
                workers.forEach(worker => worker.terminate());
            }
        };
    }

    // Memory optimization - cleanup function
    cleanupMemory() {
        // Clear memoization caches
        this.memoCache.clear();
        
        // Cancel debounced functions
        this.debouncedFunctions.forEach(fn => {
            if (fn.cancel) fn.cancel();
        });
        this.debouncedFunctions.clear();
        
        // Clear performance entries
        performance.clearMarks();
        performance.clearMeasures();
        
        // Trigger garbage collection if available (Chrome with --expose-gc flag)
        if (window.gc) {
            window.gc();
        }
    }
}

// Export singleton instance
const performanceUtils = new PerformanceUtils();
window.performanceUtils = performanceUtils;