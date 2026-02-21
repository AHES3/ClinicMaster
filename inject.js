
/**
 * ClinicMaster Desktop Bridge v19.0
 * The "Brute-Force" OS Controller
 */
(function () {
    console.log('💎 ClinicMaster Bridge v19.0: Brute Force Engaged');

    function forceAction(action) {
        try {
            const electron = window.require ? window.require('electron') : require('electron');

            // Way 1: The 'Remote' Object (Most likely to work with our flags)
            const remote = electron.remote || (window.require ? window.require('@electron/remote') : null);
            if (remote) {
                const win = remote.getCurrentWindow();
                if (action === 'Minimize') win.minimize();
                else if (action === 'Maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
                return true;
            }

            // Way 2: The Direct IPC (Nativefier standard)
            const ipc = electron.ipcRenderer;
            if (ipc) {
                if (action === 'Minimize') ipc.send('window-minimize');
                else if (action === 'Maximize') ipc.send('window-maximize');
                return true;
            }
        } catch (e) {
            console.error('Brute Force Attempt Failed:', e.message);
        }
        return false;
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        // Shrink animation (Proves JS is working)
        btn.style.transform = 'scale(0.85)';
        btn.style.transition = 'transform 0.1s';
        setTimeout(() => btn.style.transform = '', 100);

        const type = btn.getAttribute('title');

        if (type === 'Exit' || btn.classList.contains('close')) {
            window.close();
        } else {
            const success = forceAction(type);
            console.log(`📡 Signal [${type}] sent:`, success ? 'SUCCESS' : 'FAILED');
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
