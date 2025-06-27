// js/app.js
/**
 * Application utilities and helper functions
 * Provides modal management and other utility functions
 */

// Global modal management function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        console.log(`📋 Closed modal: ${modalId}`);
    } else {
        console.warn(`⚠️ Modal not found: ${modalId}`);
    }
}

// Global utility functions
window.closeModal = closeModal;

// Initialize app utilities when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 App utilities initialized');
    
    // Setup global ESC key listener for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            openModals.forEach(modal => {
                modal.classList.add('hidden');
            });
            if (openModals.length > 0) {
                console.log('📋 Closed modals with ESC key');
            }
        }
    });

    // Setup click outside modal to close
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
            console.log('📋 Closed modal by clicking outside');
        }
    });
    
    console.log('✅ Modal management setup complete');
});