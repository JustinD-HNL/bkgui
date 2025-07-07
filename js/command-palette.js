// js/command-palette.js
// Command Palette functionality

class CommandPalette {
    constructor() {
        console.log('🎮 Initializing Command Palette...');
        this.commands = [];
        this.isOpen = false;
        this.currentIndex = 0;
    }

    open() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.remove('hidden');
            this.isOpen = true;
            const input = palette.querySelector('.command-palette-input');
            if (input) {
                input.focus();
                input.select();
            }
        }
    }

    close() {
        const palette = document.getElementById('command-palette');
        if (palette) {
            palette.classList.add('hidden');
            this.isOpen = false;
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
}

window.CommandPalette = CommandPalette;
console.log('✅ Command Palette loaded');