/**
 * ClinicMaster Desktop Bridge v22.0
 * The "Developer's Debug" Edition
 */
(function () {
    console.log('💎 ClinicMaster Bridge v22.0: Active');

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
            const electron = window.require ? window.require('electron') : (window.electron || null);
            if (!electron) throw new Error('Electron module not found. Check --node-integration flag.');

            const remote = electron.remote || (window.require ? window.require('@electron/remote') : null);

            if (remote) {
                const win = remote.getCurrentWindow();
                if (action === 'Minimize') win.minimize();
                else if (action === 'Maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
                console.log(`✅ [${action}] SUCCESS via Remote`);
                return true;
            } else {
                console.warn('⚠️ Remote module is undefined. Trying IPC fallback...');
                const ipc = electron.ipcRenderer;
                if (ipc) {
                    ipc.send('window-minimize');
                    ipc.send('minimize');
                    ipc.send('window-maximize');
                    ipc.send('maximize');
                    return true;
                }
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
