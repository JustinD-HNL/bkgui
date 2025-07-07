// Virtual Scrolling for Pipeline Steps
class VirtualScroll {
    constructor(container, itemHeight = 80, buffer = 5) {
        this.container = container;
        this.itemHeight = itemHeight;
        this.buffer = buffer;
        this.items = [];
        this.visibleRange = { start: 0, end: 0 };
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        this.enabled = false;
        this.renderCallback = null;
        
        this.init();
    }

    init() {
        // Create virtual scroll structure
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-scroll-viewport';
        this.viewport.style.overflow = 'auto';
        this.viewport.style.height = '100%';
        this.viewport.style.position = 'relative';

        this.spacer = document.createElement('div');
        this.spacer.className = 'virtual-scroll-spacer';
        this.spacer.style.position = 'absolute';
        this.spacer.style.top = '0';
        this.spacer.style.left = '0';
        this.spacer.style.width = '1px';

        this.content = document.createElement('div');
        this.content.className = 'virtual-scroll-content';
        this.content.style.position = 'absolute';
        this.content.style.top = '0';
        this.content.style.left = '0';
        this.content.style.right = '0';

        this.viewport.appendChild(this.spacer);
        this.viewport.appendChild(this.content);

        // Set up event listeners
        this.viewport.addEventListener('scroll', this.handleScroll.bind(this));
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        this.resizeObserver.observe(this.viewport);
    }

    enable() {
        if (!this.enabled) {
            this.enabled = true;
            // Replace container content with virtual scroll structure
            const parent = this.container.parentNode;
            parent.replaceChild(this.viewport, this.container);
            this.content.appendChild(this.container);
            this.container.style.position = 'relative';
            this.update();
        }
    }

    disable() {
        if (this.enabled) {
            this.enabled = false;
            // Restore original structure
            const parent = this.viewport.parentNode;
            parent.replaceChild(this.container, this.viewport);
            this.container.style.position = '';
            this.renderAll();
        }
    }

    setItems(items) {
        this.items = items;
        this.totalHeight = items.length * this.itemHeight;
        this.spacer.style.height = `${this.totalHeight}px`;
        
        // Enable virtual scrolling only for large lists
        if (items.length > 50) {
            this.enable();
        } else {
            this.disable();
        }
        
        this.update();
    }

    setRenderCallback(callback) {
        this.renderCallback = callback;
    }

    handleScroll() {
        this.scrollTop = this.viewport.scrollTop;
        this.update();
    }

    handleResize(entries) {
        for (const entry of entries) {
            this.containerHeight = entry.contentRect.height;
            this.update();
        }
    }

    update() {
        if (!this.enabled) return;

        const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
        const visibleEnd = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);

        // Add buffer items
        const start = Math.max(0, visibleStart - this.buffer);
        const end = Math.min(this.items.length, visibleEnd + this.buffer);

        // Check if range has changed
        if (start !== this.visibleRange.start || end !== this.visibleRange.end) {
            this.visibleRange = { start, end };
            this.render();
        }
    }

    render() {
        if (!this.renderCallback) return;

        // Clear content
        this.container.innerHTML = '';

        // Render visible items
        const fragment = document.createDocumentFragment();
        for (let i = this.visibleRange.start; i < this.visibleRange.end; i++) {
            const item = this.items[i];
            const element = this.renderCallback(item, i);
            if (element) {
                element.style.position = 'absolute';
                element.style.top = `${i * this.itemHeight}px`;
                element.style.left = '0';
                element.style.right = '0';
                fragment.appendChild(element);
            }
        }

        this.container.appendChild(fragment);
        this.container.style.height = `${this.totalHeight}px`;
    }

    renderAll() {
        if (!this.renderCallback) return;

        this.container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        this.items.forEach((item, index) => {
            const element = this.renderCallback(item, index);
            if (element) {
                element.style.position = '';
                element.style.top = '';
                element.style.left = '';
                element.style.right = '';
                fragment.appendChild(element);
            }
        });

        this.container.appendChild(fragment);
        this.container.style.height = '';
    }

    scrollToItem(index) {
        const position = index * this.itemHeight;
        this.viewport.scrollTop = position;
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.disable();
    }
}

// Export for use in other modules
window.VirtualScroll = VirtualScroll;