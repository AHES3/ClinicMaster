
/**
 * ClinicMaster Desktop Bridge v8.0
 * This script runs with privileged access to bypass browser security.
 */
document.addEventListener('DOMContentLoaded', () => {
    const hookWindowControls = () => {
        try {
            const electron = require('electron');
            const remote = electron.remote;
            const currentWin = remote ? remote.getCurrentWindow() : null;

            // We use Event Delegation for better performance
            document.body.addEventListener('click', (e) => {
                const btn = e.target.closest('.win-btn');
                if (!btn) return;

                const title = btn.getAttribute('title');

                if (title === 'Minimize') {
                    if (currentWin) currentWin.minimize();
                    else electron.ipcRenderer.send('window-minimize');
                }
                else if (title === 'Maximize') {
                    if (currentWin) {
                        if (currentWin.isMaximized()) currentWin.unmaximize();
                        else currentWin.maximize();
                    } else {
                        electron.ipcRenderer.send('window-maximize');
                    }
                }
                else if (title === 'Exit' || btn.classList.contains('close')) {
                    window.close();
                }
            });

            console.log('✅ Desktop Bridge: Window controls hooked.');
        } catch (err) {
            console.error('❌ Desktop Bridge Error:', err);
        }
    };

    hookWindowControls();

    // Safety check for dynamic reloads
    window.addEventListener('clinic-rehook', hookWindowControls);
});
