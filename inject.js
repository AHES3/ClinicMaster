
/**
 * ClinicMaster Desktop Injection v6.0
 * This script runs with privileged access to bypass browser security.
 */
document.addEventListener('DOMContentLoaded', () => {
    const handleButtons = () => {
        // Find our custom buttons by their titles
        const minBtn = document.querySelector('[title="Minimize"]');
        const maxBtn = document.querySelector('[title="Maximize"]');
        const exitBtn = document.querySelector('[title="Exit"]');

        if (minBtn && !minBtn.dataset.hooked) {
            minBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); require('electron').remote.getCurrentWindow().minimize(); };
            minBtn.dataset.hooked = "true";
        }
        if (maxBtn && !maxBtn.dataset.hooked) {
            maxBtn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation();
                const win = require('electron').remote.getCurrentWindow();
                if (win.isMaximized()) win.unmaximize(); else win.maximize();
            };
            maxBtn.dataset.hooked = "true";
        }
        if (exitBtn && !exitBtn.dataset.hooked) {
            exitBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); window.close(); };
            exitBtn.dataset.hooked = "true";
        }
    };

    // Run every second to catch buttons after navigation
    setInterval(handleButtons, 1000);
    handleButtons();
});
