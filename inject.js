
/**
 * ClinicMaster Desktop Bridge v20.0
 * The "Multi-Channel IPC" Diagnostic Edition
 */
(function () {
    console.log('💎 ClinicMaster Bridge v20.0: Multi-Channel IPC Active');

    function forceAction(action) {
        try {
            // Discovery: Try to find Electron in any way possible
            const electron = window.require ? window.require('electron') : (window.electron || null);
            if (!electron) {
                console.error('❌ OS Control Failed: Electron module not found. Check --node-integration.');
                return false;
            }

            const ipc = electron.ipcRenderer;
            const remote = electron.remote || (window.require ? window.require('@electron/remote') : null);

            // Strategy A: The Remote Module (Direct Window Control)
            if (remote) {
                const win = remote.getCurrentWindow();
                if (win) {
                    if (action === 'Minimize') {
                        win.minimize();
                        console.log('✅ Native Minimize triggered via Remote');
                    } else if (action === 'Maximize') {
                        win.isMaximized() ? win.unmaximize() : win.maximize();
                        console.log('✅ Native Maximize/Unmaximize triggered via Remote');
                    }
                    return true;
                }
            }

            // Strategy B: Multi-Channel IPC (Shouting in different rooms)
            if (ipc) {
                if (action === 'Minimize') {
                    ipc.send('window-minimize');
                    ipc.send('minimize');
                    ipc.send('window:minimize');
                    console.log('📡 Sent Minimize signal to multiple IPC channels');
                }
                else if (action === 'Maximize') {
                    ipc.send('window-maximize');
                    ipc.send('maximize');
                    ipc.send('window:maximize');
                    ipc.send('window-toggle-maximize');
                    console.log('📡 Sent Maximize signal to multiple IPC channels');
                }
                return true;
            }
        } catch (e) {
            console.error('❌ OS Control Error:', e);
        }
        return false;
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        // Visual Feedback (Proves JS is running)
        btn.style.transform = 'scale(0.85)';
        btn.style.transition = 'transform 0.1s';
        setTimeout(() => btn.style.transform = '', 100);

        const type = btn.getAttribute('title');

        if (type === 'Exit' || btn.classList.contains('close')) {
            console.log('🚪 Exit requested. Calling window.close()');
            window.close();
        } else {
            const success = forceAction(type);
            if (!success) console.warn(`⚠️ Could not send [${type}] signal - no bridge found.`);
        }
    }, true);

    // Auth Sync (Focus-based)
    window.addEventListener('focus', () => {
        try {
            const electron = window.require ? window.require('electron') : require('electron');
            const text = electron.clipboard.readText();
            if (text && text.startsWith('CLINICMASTER_AUTH:')) {
                const tokenData = text.split('CLINICMASTER_AUTH:')[1];
                electron.clipboard.clear();
                window.location.href = 'dashboard.html' + (tokenData.includes('#') ? tokenData : '#' + tokenData);
            }
        } catch (e) { }
    });
})();
