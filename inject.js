/**
 * ClinicMaster Desktop Bridge v23.0
 * The "Developer's Debug" Edition
 */
(function () {
    console.log('💎 ClinicMaster Bridge v23.0: Active');

    function openDevTools() {
        try {
            const electron = window.require ? window.require('electron') : (window.electron || null);
            const remote = electron?.remote || (window.require ? window.require('@electron/remote') : null);
            if (remote) remote.getCurrentWindow().webContents.openDevTools();
            else console.error('❌ Cannot open DevTools: Remote module missing.');
        } catch (e) {
            console.error('❌ DevTools Error:', e.message);
        }
    }

    // 1. Keyboard Shortcuts (Bypass Radeon Screenshot)
    window.addEventListener('keydown', (e) => {
        // F12 or Ctrl+Alt+I
        if (e.key === 'F12' || (e.ctrlKey && e.altKey && e.code === 'KeyI')) {
            e.preventDefault();
            openDevTools();
        }
    });

    // 2. Window Controls
    function forceAction(action) {
        console.log(`🚀 Attempting [${action}]...`);
        try {
            // Priority 1: Direct Preload Bridge (New way)
            const ipc = window.electron?.ipcRenderer;
            if (ipc) {
                if (action === 'Minimize') ipc.send('window-minimize');
                else if (action === 'Maximize') ipc.send('window-maximize');
                else if (action === 'Inspect') ipc.send('window-dev-tools');
                console.log(`✅ [${action}] Sent via Preload Bridge`);
                return true;
            }

            // Priority 2: Standard Electron Require
            const electron = window.require ? window.require('electron') : (window.electron || null);
            const remote = electron?.remote || (window.require ? window.require('@electron/remote') : null);

            if (remote) {
                const win = remote.getCurrentWindow();
                if (action === 'Minimize') win.minimize();
                else if (action === 'Maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
                else if (action === 'Inspect') win.webContents.openDevTools();
                console.log(`✅ [${action}] Success via Remote`);
                return true;
            } else if (electron?.ipcRenderer) {
                const legacyIpc = electron.ipcRenderer;
                if (action === 'Minimize') legacyIpc.send('window-minimize');
                else if (action === 'Maximize') legacyIpc.send('window-maximize');
                else if (action === 'Inspect') legacyIpc.send('window-dev-tools');
                return true;
            }
        } catch (e) {
            console.error('❌ OS Control Error:', e.message);
        }
        return false;
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        btn.style.transform = 'scale(0.85)';
        setTimeout(() => btn.style.transform = '', 100);

        const type = btn.getAttribute('title');

        if (type === 'Inspect') {
            openDevTools();
        } else if (type === 'Exit' || btn.classList.contains('close')) {
            window.close();
        } else if (type === 'Back') {
            window.history.back();
        } else if (type === 'Forward') {
            window.history.forward();
        } else {
            forceAction(type);
        }
    }, true);

    // 3. Auth Sync
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
