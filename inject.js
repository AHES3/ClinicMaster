
/**
 * ClinicMaster Desktop Bridge v11.0
 * The "Magic Sync" Edition - No Deep-Links Required.
 */

(function () {
    console.log('💎 ClinicMaster Magic Sync v11.0 Active');

    function getElectron() {
        try {
            const e = window.require ? window.require('electron') : require('electron');
            return e;
        } catch (e) { return null; }
    }

    const electron = getElectron();
    const remote = (electron && electron.remote) ? electron.remote : null;

    // 1. WINDOW CONTROLS
    function setupButtons() {
        const minBtn = document.querySelector('[title="Minimize"]');
        const maxBtn = document.querySelector('[title="Maximize"]');
        const closeBtn = document.querySelector('[title="Exit"]');

        if (minBtn) {
            minBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (remote) remote.getCurrentWindow().minimize();
                else if (electron) electron.ipcRenderer.send('window-minimize');
            };
        }

        if (maxBtn) {
            maxBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (remote) {
                    const win = remote.getCurrentWindow();
                    if (win.isMaximized()) win.unmaximize(); else win.maximize();
                } else if (electron) {
                    electron.ipcRenderer.send('window-maximize');
                }
            };
        }

        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.close();
            };
        }
    }

    // 2. MAGIC SYNC (Clipboard Relay)
    // This watches the clipboard for a token from Zen
    if (electron && electron.clipboard) {
        setInterval(() => {
            const text = electron.clipboard.readText();
            if (text && text.includes('CLINICMASTER_AUTH:')) {
                console.log('✨ Magic Sync: Token detected in clipboard!');
                handleToken(text.split('CLINICMASTER_AUTH:')[1]);
                electron.clipboard.clear(); // Clear so it doesn't trigger again
            }
        }, 1000);
    }

    function handleToken(data) {
        // Data can be the whole URL or just the hash
        if (data.includes('access_token=')) {
            const token = data.split('access_token=')[1].split('&')[0];
            const hash = data.includes('#') ? '#' + data.split('#')[1] : '#' + data;

            console.log('🔑 Token extracted. Applying to session...');
            localStorage.setItem('supabase.auth.token', token); // Use older Supabase key format as fallback

            // Nativefier/Supabase usually uses a specific key structure. 
            // We'll just redirect to dashboard with the hash, Supabase SDK will catch it.
            window.location.href = 'dashboard.html' + hash;
        }
    }

    // Initialize
    const observer = new MutationObserver(() => setupButtons());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setupButtons();

    // Check URL hash too for standard deep links
    if (window.location.hash.includes('access_token')) {
        handleToken(window.location.hash);
    }
})();
