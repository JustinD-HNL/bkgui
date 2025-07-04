/* styles.css - COMPLETE VERSION WITH ALL FIXES AND FEATURES */
/* Enhanced Buildkite Pipeline Builder - Full Styles */

/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
    overflow-x: hidden;
}

.app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

/* Enhanced Scrollbars */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 4px;
    transition: background 0.2s ease;
}

::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
}

/* Header - FIXED: Title properly positioned at top */
.header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 100;
    position: relative;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1600px;
    margin: 0 auto;
}

.header-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header h1,
.header-brand h1 {
    color: #4a5568;
    font-size: 1.5rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
}

.header h1 i,
.header-brand h1 i {
    color: #667eea;
}

.version {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
}

.header-actions {
    display: flex;
    gap: 0.75rem;
}

/* Enhanced Button Styles */
.btn {
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    background: transparent;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
    background: #ffffff;
    color: #4a5568;
    border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
    transform: translateY(-1px);
}

.btn-small {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
}

.btn-outline {
    background: transparent;
    border: 2px solid #e2e8f0;
    color: #4a5568;
}

.btn-outline:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
}

.btn-ghost {
    background: transparent;
    color: #4a5568;
    padding: 0.4rem 0.8rem;
}

.btn-ghost:hover {
    background: rgba(0, 0, 0, 0.05);
}

/* Main Content - 3 Column Layout */
.main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    gap: 1.5rem;
    padding: 1.5rem;
    max-width: 1600px;
    margin: 0 auto;
    width: 100%;
}

/* Enhanced Sidebar - Left Column */
.sidebar,
.enhanced-sidebar {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow-y: auto;
    max-height: calc(100vh - 120px);
}

.sidebar-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.sidebar-header h3 {
    color: #4a5568;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sidebar-header p {
    color: #718096;
    font-size: 0.85rem;
    margin-top: 0.5rem;
}

/* Step Palette */
.step-palette {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.step-type {
    padding: 1rem;
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    cursor: grab;
    transition: all 0.3s ease;
    user-select: none;
    position: relative;
    overflow: hidden;
    margin-bottom: 0.75rem;
}

.step-type:hover {
    border-color: #667eea;
    background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
}

.step-type:active {
    cursor: grabbing;
    transform: translateY(0);
}

.step-type.dragging {
    opacity: 0.6;
    transform: rotate(3deg) scale(0.95);
    z-index: 1000;
}

/* Pipeline Canvas - Center Column */
.pipeline-canvas {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;
    position: relative;
}

/* Enhanced Pipeline Steps Container */
.pipeline-steps {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 300px;
    position: relative;
    padding: 1rem;
    border-radius: 12px;
    transition: all 0.3s ease;
}

/* Pipeline Step Enhanced Styles */
.pipeline-step {
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: fadeInUp 0.4s ease;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    margin: 0.5rem 0;
}

.pipeline-step:hover {
    border-color: #cbd5e0;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
}

.pipeline-step.selected {
    border-color: #667eea;
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

/* Step Header */
.step-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
}

.step-info {
    flex: 1;
}

.step-type-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: #667eea;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.step-label {
    font-weight: 600;
    color: #4a5568;
    font-size: 1rem;
    margin-bottom: 0.25rem;
}

.step-description {
    color: #718096;
    font-size: 0.85rem;
    line-height: 1.3;
}

/* Step Actions - FIXED: Proper positioning and move buttons */
.step-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
}

.pipeline-step:hover .step-actions {
    opacity: 1;
    pointer-events: auto;
}

.step-action {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: #f7fafc;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
}

.step-action:hover {
    background: #edf2f7;
    transform: scale(1.1);
}

/* Move up/down buttons - FIXED STYLES */
.step-action.move-up,
.step-action.move-down {
    background: #f0fff4;
    color: #38a169;
}

.step-action.move-up:hover,
.step-action.move-down:hover {
    background: #c6f6d5;
    color: #276749;
}

.step-action.configure {
    background: #667eea;
    color: white;
}

.step-action.configure:hover {
    background: #5a6fd8;
}

.step-action.duplicate {
    background: #805ad5;
    color: white;
}

.step-action.duplicate:hover {
    background: #6b46c1;
}

.step-action.delete {
    background: #e53e3e;
    color: white;
}

.step-action.delete:hover {
    background: #c53030;
}

/* Properties Panel - Right Column */
.properties-panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow-y: auto;
    max-height: calc(100vh - 120px);
}

.properties-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.properties-header h3 {
    color: #4a5568;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Property Form Styles */
.property-section {
    margin-bottom: 2rem;
}

.property-section h4 {
    color: #4a5568;
    font-size: 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.property-group {
    margin-bottom: 1rem;
}

.property-group label {
    display: block;
    color: #4a5568;
    font-weight: 500;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.property-group input[type="text"],
.property-group input[type="number"],
.property-group textarea,
.property-group select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.9rem;
    transition: all 0.2s ease;
}

.property-group input:focus,
.property-group textarea:focus,
.property-group select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.property-group small {
    display: block;
    color: #718096;
    font-size: 0.8rem;
    margin-top: 0.25rem;
}

/* Modal Styles */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
}

.modal.hidden {
    display: none;
}

.modal-content {
    background: white;
    border-radius: 16px;
    padding: 0;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.3s ease;
}

.modal-content.large {
    max-width: 900px;
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    color: #4a5568;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #718096;
    cursor: pointer;
    padding: 0.5rem;
    transition: all 0.2s ease;
}

.modal-close:hover {
    color: #4a5568;
    transform: rotate(90deg);
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(80vh - 120px);
}

.modal-actions {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
}

/* Dependency Graph Styles */
.graph-container {
    position: relative;
    width: 100%;
    height: 600px;
    background: #f8fafc;
    border-radius: 12px;
    overflow: hidden;
}

#dependency-canvas {
    width: 100%;
    height: 100%;
    cursor: move;
}

.graph-controls {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    align-items: center;
}

.graph-legend {
    margin-left: auto;
    display: flex;
    gap: 1rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #4a5568;
}

.legend-color {
    width: 16px;
    height: 16px;
    border-radius: 4px;
}

.node-details {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    max-width: 300px;
}

.node-details h4 {
    color: #4a5568;
    margin-bottom: 0.5rem;
}

.node-details p {
    font-size: 0.85rem;
    color: #718096;
    margin-bottom: 0.25rem;
}

.node-details code {
    background: #f7fafc;
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.8rem;
}

/* Toast Notification Styles */
#toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
}

.toast {
    background: white;
    padding: 12px 20px;
    margin: 8px 0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #667eea;
    max-width: 350px;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.toast.show {
    transform: translateX(0);
}

.toast.success {
    border-left-color: #48bb78;
}

.toast.error {
    border-left-color: #e53e3e;
}

.toast.warning {
    border-left-color: #ed8936;
}

.toast.info {
    border-left-color: #4299e1;
}

/* Command Palette Styles */
.command-palette {
    max-width: 600px;
    width: 90%;
    margin-top: 10vh;
}

.command-palette-content {
    padding: 0;
}

.command-palette-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
}

.command-palette-header i {
    color: #667eea;
    margin-right: 0.5rem;
}

.command-palette-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1rem;
    background: transparent;
}

.command-palette-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #666;
    cursor: pointer;
    padding: 0.25rem;
    margin-left: 0.5rem;
}

.command-palette-results {
    max-height: 400px;
    overflow-y: auto;
}

.command-palette-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.15s ease;
}

.command-palette-item:hover,
.command-palette-item.active {
    background: #667eea;
    color: white;
}

.command-palette-item i {
    margin-right: 0.75rem;
    width: 1rem;
    text-align: center;
}

/* Plugin Catalog Styles */
.plugin-catalog {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}

.plugin-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.3s ease;
    cursor: pointer;
}

.plugin-item:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    transform: translateY(-2px);
}

.plugin-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 1rem;
}

.plugin-name {
    font-weight: 600;
    color: #4a5568;
    font-size: 1.1rem;
}

.plugin-version {
    color: #718096;
    font-size: 0.85rem;
}

.plugin-description {
    color: #718096;
    font-size: 0.9rem;
    line-height: 1.4;
    margin-bottom: 1rem;
}

.plugin-actions {
    display: flex;
    gap: 0.5rem;
}

/* Template and Pattern Items */
.template-item,
.pattern-item {
    padding: 1rem;
    background: #f8fafc;
    border: 2px dashed #cbd5e0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;
    position: relative;
    overflow: hidden;
    margin-bottom: 0.75rem;
}

.template-item:hover,
.pattern-item:hover {
    border-color: #667eea;
    background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
}

.template-item i,
.pattern-item i {
    font-size: 1.3rem;
    color: #667eea;
    margin-bottom: 0.5rem;
    display: block;
}

.template-item span,
.pattern-item span {
    display: block;
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.25rem;
    font-size: 0.95rem;
}

.template-item small,
.pattern-item small {
    color: #718096;
    font-size: 0.8rem;
    line-height: 1.3;
}

/* Matrix Builder Styles */
.matrix-builder {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.matrix-config {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1rem;
}

.matrix-item {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
}

.matrix-preview {
    background: #2d3748;
    color: #f7fafc;
    padding: 1rem;
    border-radius: 8px;
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: 0.85rem;
    max-height: 300px;
    overflow-y: auto;
}

/* Validation Styles */
.validation-results {
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
}

.validation-results.success {
    background: #f0fff4;
    border: 1px solid #9ae6b4;
    color: #276749;
}

.validation-results.error {
    background: #fed7d7;
    border: 1px solid #fc8181;
    color: #742a2a;
}

.validation-content ul {
    list-style: none;
    padding: 0;
}

.validation-content li {
    padding: 0.25rem 0;
}

/* Drop Zone Styles */
.drop-zone {
    position: relative;
    min-height: 60px;
    width: 100%;
    margin: 0.5rem 0;
    transition: all 0.3s ease;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
}

.drop-zone.active {
    opacity: 1;
    pointer-events: all;
    background: rgba(102, 126, 234, 0.05);
    border: 2px dashed rgba(102, 126, 234, 0.3);
}

.drop-zone.drag-over {
    background: rgba(102, 126, 234, 0.1);
    border-color: #667eea;
    transform: scaleY(1.2);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
}

.drop-zone::before {
    content: 'Drop step here';
    color: #667eea;
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0.7;
    pointer-events: none;
}

.drop-zone.drag-over::before {
    content: 'Release to add step';
    opacity: 1;
    animation: pulse 1s ease-in-out infinite;
}

/* Empty State */
.empty-pipeline {
    text-align: center;
    color: #a0aec0;
    padding: 4rem 2rem;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.empty-pipeline.drag-active {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
    color: #4a5568;
}

.empty-pipeline i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #cbd5e0;
}

.empty-pipeline h3 {
    color: #4a5568;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
}

.empty-pipeline p {
    margin-bottom: 1.5rem;
    line-height: 1.4;
}

/* No Selection State */
.no-selection {
    text-align: center;
    color: #a0aec0;
    padding: 2rem;
}

.no-selection i {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: #cbd5e0;
}

.no-selection h3 {
    color: #4a5568;
    margin-bottom: 0.5rem;
}

.properties-help {
    margin-top: 2rem;
    text-align: left;
}

.properties-help h4 {
    color: #4a5568;
    font-size: 1rem;
    margin-bottom: 0.75rem;
}

.properties-help ul {
    list-style: none;
}

.properties-help li {
    color: #718096;
    font-size: 0.85rem;
    line-height: 1.6;
    margin-bottom: 0.5rem;
}

/* Key-Value Pairs */
.key-value-pair {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.key-input,
.value-input {
    padding: 0.4rem 0.6rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.85rem;
}

.remove-btn {
    background: #fee;
    color: #e53e3e;
    border: none;
    border-radius: 4px;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.remove-btn:hover {
    background: #e53e3e;
    color: white;
}

/* Dependency Item */
.dependency-item {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
}

.dependency-select {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.85rem;
}

/* Field Item */
.field-item {
    display: grid;
    grid-template-columns: 1fr 2fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.field-key,
.field-hint {
    padding: 0.4rem 0.6rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 0.85rem;
}

/* Plugin Config */
.plugin-config {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
}

/* Empty List */
.empty-list {
    text-align: center;
    color: #a0aec0;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 6px;
    font-size: 0.85rem;
}

/* YAML Output */
.yaml-output {
    width: 100%;
    height: 400px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9rem;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    color: #2d3748;
    resize: vertical;
}

/* Quick Actions */
.quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.quick-action {
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
}

.quick-action:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
    transform: translateY(-1px);
}

.quick-action i {
    display: block;
    font-size: 1.25rem;
    color: #667eea;
    margin-bottom: 0.25rem;
}

.quick-action span {
    font-size: 0.8rem;
    color: #4a5568;
}

/* Sidebar Actions */
.sidebar-actions {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

/* Tooltips */
.tooltip {
    position: relative;
    display: inline-block;
}

.tooltip .tooltip-text {
    visibility: hidden;
    background-color: #2d3748;
    color: white;
    text-align: center;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    position: absolute;
    z-index: 1001;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.8rem;
    opacity: 0;
    transition: opacity 0.3s;
}

.tooltip .tooltip-text::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #2d3748 transparent transparent transparent;
}

.tooltip:hover .tooltip-text {
    visibility: visible;
    opacity: 1;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
}

@keyframes insertionPulse {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.1); }
}

@keyframes insertionShimmer {
    0% { left: -100%; }
    100% { left: 200%; }
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(-20px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

/* Loading States */
.loading {
    position: relative;
    pointer-events: none;
}

.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: inherit;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e2e8f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 1200px) {
    .main-content {
        grid-template-columns: 250px 1fr;
    }
    
    .properties-panel {
        display: none;
    }
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
        gap: 1rem;
    }
    
    .sidebar {
        display: none;
    }
    
    .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .header-actions {
        width: 100%;
        justify-content: space-between;
    }
    
    .modal-content {
        width: 95%;
        margin: 1rem;
    }
    
    .plugin-catalog {
        grid-template-columns: 1fr;
    }
}

/* Print Styles */
@media print {
    .header,
    .sidebar,
    .properties-panel,
    .btn,
    .step-actions {
        display: none !important;
    }
    
    .main-content {
        grid-template-columns: 1fr;
    }
    
    .pipeline-canvas {
        box-shadow: none;
        border: 1px solid #e2e8f0;
    }
}

/* Accessibility */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

/* Focus Styles */
:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
}

button:focus-visible,
.btn:focus-visible {
    outline: 2px solid #667eea;
    outline-offset: 2px;
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
    .pipeline-step {
        border-width: 3px;
    }
    
    .btn {
        border: 2px solid currentColor;
    }
}