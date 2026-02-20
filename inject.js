
/**
 * ClinicMaster Desktop Bridge v9.0
 * Handles native window controls and Zoom-style deep linking.
 */
document.addEventListener('DOMContentLoaded', () => {
    const electron = require('electron');
    const remote = electron.remote;

    // 1. Hook the Buttons (Wait for them to appear)
    const hookButtons = () => {
        const btns = {
            min: document.querySelector('[title="Minimize"]'),
            max: document.querySelector('[title="Maximize"]'),
            exit: document.querySelector('[title="Exit"]')
        };

        if (btns.min) btns.min.onclick = () => remote.getCurrentWindow().minimize();
        if (btns.max) btns.max.onclick = () => {
            const win = remote.getCurrentWindow();
            if (win.isMaximized()) win.unmaximize(); else win.maximize();
        };
        if (btns.exit) btns.exit.onclick = () => window.close();
    };

    // Watch for when app.js creates the top bar
    const observer = new MutationObserver(() => hookButtons());
    observer.observe(document.body, { childList: true, subtree: true });
    hookButtons();

    // 2. Handle Deep Linking (The "Zoom" return)
    // When the app starts with a token, we handle it here
    electron.ipcRenderer.on('deeplink', (event, url) => {
        if (url.includes('access_token')) {
            const token = url.split('access_token=')[1].split('&')[0];
            // Save token and reload
            localStorage.setItem('supabase.auth.token', token);
            window.location.href = 'dashboard.html';
        }
    });
});
