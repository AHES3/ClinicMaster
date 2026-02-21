/**
 * ClinicMaster Desktop Bridge v25.0
 * The "Clean UI" Edition
 */
(function () {
    console.log('💎 ClinicMaster Bridge v25.0: Active');

    // 1. Window Management
    function forceAction(action) {
        console.log(`🚀 Attempting [${action}]...`);
        try {
            // Priority 1: Direct Preload Bridge
            const ipc = window.electron?.ipcRenderer;
            if (ipc) {
                if (action === 'Minimize') ipc.send('window-minimize');
                else if (action === 'Maximize') ipc.send('window-maximize');
                console.log(`✅ [${action}] Sent via Preload Bridge`);
                return true;
            }

            // Priority 2: Standard Electron Require (Fallback)
            const electron = window.require ? window.require('electron') : (window.electron || null);
            const remote = electron?.remote || (window.require ? window.require('@electron/remote') : null);

            if (remote) {
                const win = remote.getCurrentWindow();
                if (action === 'Minimize') win.minimize();
                else if (action === 'Maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
                console.log(`✅ [${action}] Success via Remote`);
                return true;
            } else if (electron?.ipcRenderer) {
                const legacyIpc = electron.ipcRenderer;
                if (action === 'Minimize') legacyIpc.send('window-minimize');
                else if (action === 'Maximize') legacyIpc.send('window-maximize');
                return true;
            }
        } catch (e) {
            console.error('❌ OS Control Error:', e.message);
        }
        return false;
    }

    // 2. Click Handling
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        // Visual feedback
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => btn.style.transform = '', 100);

        const type = btn.getAttribute('title');

        if (type === 'Exit' || btn.classList.contains('close')) {
            window.close();
        } else {
            forceAction(type);
        }
    }, true);

    // 3. Auth Sync
    window.addEventListener('focus', () => {
        try {
            const electron = window.electron || (window.require ? window.require('electron') : null);
            if (!electron) return;
            const text = electron.clipboard.readText();
            if (text && text.startsWith('CLINICMASTER_AUTH:')) {
                const tokenData = text.split('CLINICMASTER_AUTH:')[1];
                electron.clipboard.clear();
                window.location.href = 'dashboard.html' + (tokenData.includes('#') ? tokenData : '#' + tokenData);
            }
        } catch (e) { }
    });
})();
