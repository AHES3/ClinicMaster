
/**
 * ClinicMaster Desktop Bridge v12.0
 * Reinforced Window Controls & Clipboard Sync
 */
(function () {
    console.log('💎 ClinicMaster Bridge v12.0 Active');

    // 1. WINDOW CONTROLS
    // We use a high-level catch for clicks
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        try {
            const electron = window.require ? window.require('electron') : require('electron');
            const remote = electron.remote;
            const win = remote.getCurrentWindow();

            const type = btn.getAttribute('title');
            if (type === 'Minimize') win.minimize();
            else if (type === 'Maximize') {
                if (win.isMaximized()) win.unmaximize();
                else win.maximize();
            } else if (type === 'Exit') {
                win.close();
            }
        } catch (err) {
            // Fallback for standard Close
            if (btn.classList.contains('close')) window.close();
            console.error('Bridge Error:', err);
        }
    }, true);

    // 2. MAGIC SYNC (Clipboard)
    // Automatically watches for tokens from the Zen browser
    setInterval(() => {
        try {
            const electron = window.require ? window.require('electron') : require('electron');
            const text = electron.clipboard.readText();
            if (text && text.includes('CLINICMASTER_AUTH:')) {
                const tokenData = text.split('CLINICMASTER_AUTH:')[1];
                electron.clipboard.clear();

                // Show a nice notification in the console
                console.log('✨ Auth Sync Successful');

                // Apply token and jump to dashboard
                const hash = tokenData.includes('#') ? tokenData : '#' + tokenData;
                window.location.href = 'dashboard.html' + hash;
            }
        } catch (e) { }
    }, 1000);
})();
