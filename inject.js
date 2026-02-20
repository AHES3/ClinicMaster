
/**
 * ClinicMaster Desktop Bridge v13.0
 * The "God-Mode" Window Controller
 */
(function () {
    console.log('💎 ClinicMaster Bridge v13.0: God-Mode Engaged');

    function getWindow() {
        try {
            const electron = window.require ? window.require('electron') : require('electron');
            // Try standard remote
            if (electron.remote) return electron.remote.getCurrentWindow();
            // Try process bridge
            if (window.process && window.process.mainModule) {
                return window.process.mainModule.require('electron').remote.getCurrentWindow();
            }
        } catch (e) { return null; }
        return null;
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const win = getWindow();
        const type = btn.getAttribute('title');

        if (type === 'Minimize') {
            if (win) win.minimize();
            else console.warn('Native Minimize Blocked');
        }
        else if (type === 'Maximize') {
            if (win) {
                if (win.isMaximized()) win.unmaximize();
                else win.maximize();
            } else {
                console.warn('Native Maximize Blocked');
            }
        }
        else if (type === 'Exit' || btn.classList.contains('close')) {
            if (win) win.close();
            else window.close(); // Browser fallback
        }
    }, true);

    // Magic Sync (Clipboard)
    setInterval(() => {
        try {
            const electron = window.require ? window.require('electron') : require('electron');
            const text = electron.clipboard.readText();
            if (text && text.includes('CLINICMASTER_AUTH:')) {
                const tokenData = text.split('CLINICMASTER_AUTH:')[1];
                electron.clipboard.clear();
                const hash = tokenData.includes('#') ? tokenData : '#' + tokenData;
                window.location.href = 'dashboard.html' + hash;
            }
        } catch (e) { }
    }, 1000);
})();
