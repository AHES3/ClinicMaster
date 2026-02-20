
/**
 * ClinicMaster Desktop Bridge v14.0
 * Performance Optimized & Secure Bridge
 */
(function () {
    console.log('💎 ClinicMaster Bridge v14.0: Focus-Mode Active');

    // 1. SAFE ELECTRON RESOLVER
    function getElectron() {
        try {
            // We use window.require if available (node-integration)
            return window.require ? window.require('electron') : null;
        } catch (e) { return null; }
    }

    const electron = getElectron();

    // 2. REINFORCED WINDOW CONTROLS
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        try {
            const remote = electron ? electron.remote : null;
            if (!remote) throw new Error('Remote Module Blocked');

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
            console.error('Window Control Error:', err.message);
            // Universal fallback for Exit
            if (btn.classList.contains('close')) window.close();
        }
    }, true);

    // 3. SECURE AUTH SYNC (Event-Based)
    // Instead of looping, we only check when the app gets focus
    window.addEventListener('focus', () => {
        try {
            if (!electron || !electron.clipboard) return;

            const text = electron.clipboard.readText();
            if (text && text.startsWith('CLINICMASTER_AUTH:')) {
                const tokenData = text.split('CLINICMASTER_AUTH:')[1];

                // Security: Verify it looks like a token before clearing
                if (tokenData.includes('access_token')) {
                    electron.clipboard.clear();
                    console.log('✨ Auth Sync: Securely retrieved token from focus event');
                    const hash = tokenData.includes('#') ? tokenData : '#' + tokenData;
                    window.location.href = 'dashboard.html' + hash;
                }
            }
        } catch (e) {
            console.error('Sync Error:', e);
        }
    });

})();
