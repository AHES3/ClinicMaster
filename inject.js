
/**
 * ClinicMaster Desktop Bridge v18.0
 * The "Low-Level Signal" Edition
 */
(function () {
    console.log('💎 ClinicMaster Bridge v18.0: Low-Level Signals Active');

    function getIPC() {
        try {
            const electron = window.require ? window.require('electron') : require('electron');
            return electron.ipcRenderer;
        } catch (e) { return null; }
    }

    const ipc = getIPC();

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.win-btn');
        if (!btn) return;

        // Visual Feedback: Prove the click was captured
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = '', 100);

        const type = btn.getAttribute('title');
        console.log('📡 Sending Signal:', type);

        if (type === 'Minimize') {
            if (ipc) ipc.send('window-minimize');
            // Try fallback if IPC is blocked
            else if (window.electron && window.electron.ipcRenderer) window.electron.ipcRenderer.send('window-minimize');
        }
        else if (type === 'Maximize') {
            if (ipc) ipc.send('window-maximize');
            else if (window.electron && window.electron.ipcRenderer) window.electron.ipcRenderer.send('window-maximize');
        }
        else if (type === 'Exit' || btn.classList.contains('close')) {
            window.close(); // Reliable browser standard
        }
    }, true);

    // Focus-based Auth Sync (No performance hit)
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
