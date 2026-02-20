
/**
 * ClinicMaster Desktop Bridge
 * This script runs with privileged access to the Electron window.
 */
document.addEventListener('DOMContentLoaded', () => {
    // We listen for custom events from our app.js
    window.addEventListener('clinic-minimize', () => {
        const win = require('electron').remote.getCurrentWindow();
        win.minimize();
    });

    window.addEventListener('clinic-maximize', () => {
        const win = require('electron').remote.getCurrentWindow();
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });
});
