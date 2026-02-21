
/**
 * ClinicMaster Desktop Bridge v15.0
 * The "Wall-Breaker" Edition
 */
(function () {
    console.log('💎 ClinicMaster Bridge v15.0: Diagnostic Mode Engaged');

    function getElectron() {
        try {
            // Path 1: Node integration
            if (typeof require !== 'undefined') return require('electron');
            // Path 2: Window Require
            if (window.require) return window.require('electron');
            // Path 3: Global bridge
            if (window.electron) return window.electron;
        } catch (e) { return null; }
        return null;
    }

    const electron = getElectron();
    if (!electron) console.error('❌ Critical: Electron not found. Check --node-integration flag.');

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        console.log('🔘 Button Click Detected:', btn.getAttribute('title'));
        e.preventDefault();
        e.stopPropagation();

        try {
            // Find the Remote module (Nativefier's biggest hurdle)
            const remote = electron.remote || (window.require ? window.require('@electron/remote') : null);
            if (!remote) throw new Error('Remote module is disabled or missing.');

            const win = remote.getCurrentWindow();
            const type = btn.getAttribute('title');

            if (type === 'Minimize') win.minimize();
            else if (type === 'Maximize') {
                if (win.isMaximized()) win.unmaximize();
                else win.maximize();
            }
            else if (type === 'Exit' || btn.classList.contains('close')) {
                win.close();
            }
        } catch (err) {
            console.error('❌ OS Control Error:', err.message);
            // Fallback for Exit only
            if (btn.classList.contains('close')) window.close();
        }
    }, true);

    // AUTH SYNC: Automatic refresh when you return to the app
    window.addEventListener('focus', () => {
        if (!electron || !electron.clipboard) return;
        const text = electron.clipboard.readText();
        if (text && text.startsWith('CLINICMASTER_AUTH:')) {
            const tokenData = text.split('CLINICMASTER_AUTH:')[1];
            electron.clipboard.clear();
            const hash = tokenData.includes('#') ? tokenData : '#' + tokenData;
            window.location.href = 'dashboard.html' + hash;
        }
    });

})();
