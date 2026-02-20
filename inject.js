
/**
 * ClinicMaster Desktop Bridge v5.0
 * This script bypasses browser security to control the native window.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Listen for events from our app.js
    window.addEventListener('clinic-minimize', () => {
        try {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('app-minimize'); // Some nativefier versions use this
        } catch (e) {
            // Fallback for different electron versions
            try {
                const win = require('electron').remote.getCurrentWindow();
                win.minimize();
            } catch (err) {
                console.error('Desktop Bridge: Minimize failed', err);
            }
        }
    });

    window.addEventListener('clinic-maximize', () => {
        try {
            const win = require('electron').remote.getCurrentWindow();
            if (win.isMaximized()) {
                win.unmaximize();
            } else {
                win.maximize();
            }
        } catch (e) {
            console.error('Desktop Bridge: Maximize failed. Note: Double-clicking the top bar is the native bypass.');
        }
    });
});
