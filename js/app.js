/* ═══════════════════════════════════════════════════════════
   CLINICMASTER — Shared Application Logic
   ═══════════════════════════════════════════════════════════ */

/* ── SUPABASE ────────────────────────────────────────────── */
const SBU = 'https://pxbfwesywdbxiibxgmwe.supabase.co';
const SBK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YmZ3ZXN5d2RieGlpYnhnbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTczOTcsImV4cCI6MjA4NzAzMzM5N30.eixNDkcZIwgwltOWSyam2dSN_BNN3EeyhJGjniueQOY';
const sb = supabase.createClient(SBU, SBK);

/* Global data store */
let DB = { patients: [], drugs: [], appointments: [], files: [], diagnoses: [] };
let USER = null;

/** Helper: Get the source-of-truth ID for all practice data */
function getPracticeID() {
    if (!USER) return null;
    const meta = USER.user_metadata || {};
    // If secretary, use doctor's ID. Otherwise use own ID.
    return meta.linked_doctor_id || USER.id;
}

/* ── CRUD HELPERS ────────────────────────────────────────── */
async function qry(table, order = 'created') {
    if (!USER) return [];

    const owner_id = getPracticeID();
    const { data, error } = await sb.from(table)
        .select('*')
        .eq('doctor_id', owner_id)
        .order(order, { ascending: false })
        .limit(500);

    if (error) {
        console.error(`🔴 Sync Error [${table}]:`, error.message);
    } else if (data.length === 0 && USER.user_metadata?.role === 'secretary') {
        console.warn(`💡 Notice: No data found for this practice. If the Physician has data, ensure your Supabase RLS Policies allow Secretaries to READ where doctor_id = linked_doctor_id.`);
    }

    return error ? [] : data || [];
}

/** 
 * HELPER: Upload file to Supabase Storage 
 * Requires a bucket named 'cm_files' with Public Access enabled.
 */
async function up(file) {
    if (!USER) return null;
    const bucket = 'cm_files';
    const folder = getPracticeID();
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const path = `${folder}/${fileName}`;

    try {
        const { data, error } = await sb.storage.from(bucket).upload(path, file);
        if (error) throw error;

        const { data: { publicUrl } } = sb.storage.from(bucket).getPublicUrl(path);
        return publicUrl;
    } catch (e) {
        console.error('Storage Upload Failed:', e);
        if (e.message?.includes('violates row-level security')) {
            toast('Permission Denied: Add an "INSERT" policy to your cm_files bucket.', 'err');
        } else {
            toast('Upload failed: Ensure bucket "cm_files" exists and is public.', 'err');
        }
        return null;
    }
}

async function ins(table, row) {
    if (!USER) return false;

    const owner_id = getPracticeID();
    const rowWithOwner = { ...row, doctor_id: owner_id };
    const { error } = await sb.from(table).insert(rowWithOwner);

    if (error) {
        console.error('Save Error:', error);
        toast('Database Error: ' + error.message, 'err');
    }
    return !error;
}

async function del(table, id) {
    await sb.from(table).delete().eq('id', id);
}

async function upd(table, id, patch) {
    await sb.from(table).update(patch).eq('id', id);
}

async function loadAll() {
    // 1. Instant UI: Load from cache if exists
    const cached = sessionStorage.getItem('cm_cache');
    if (cached) {
        DB = JSON.parse(cached);
        setStatus('Live (Cached)', true);
    }

    // 2. Ensure we have a user
    if (!USER) await checkAuth();
    if (!USER) return false;

    try {
        const [patients, drugs, appts, files, diagnoses] = await Promise.all([
            qry('cm_patients'),
            qry('cm_drugs'),
            qry('cm_appointments'),
            qry('cm_files', 'date'),
            qry('cm_diagnoses', 'date')
        ]);

        DB = { patients, drugs, appointments: appts, files, diagnoses };

        // 3. Save to cache for next page load
        sessionStorage.setItem('cm_cache', JSON.stringify(DB));

        setStatus('Connected', true);
        populatePatientSelects();
        return true;
    } catch (e) {
        console.error('Core sync failed', e);
        if (!cached) setStatus('Sync error', false);
        return false;
    }
}

/* ── STATUS INDICATOR ────────────────────────────────────── */
function setStatus(msg, ok) {
    document.querySelectorAll('.dd-indicator').forEach(el => {
        ok ? el.classList.add('on') : el.classList.remove('on');
    });
    document.querySelectorAll('.ds-text').forEach(el => {
        el.textContent = msg;
    });
}

/* ── PATIENT ID GENERATION ───────────────────────────────── */
function genPatientID() {
    const year = new Date().getFullYear();
    const seq = String(DB.patients.length + 1).padStart(4, '0');
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CM-${year}-${seq}-${rand}`;
}

/* ── CUSTOM CURSOR ───────────────────────────────────────── */
function initCursor() {
    const cd = document.getElementById('cd');
    const cr = document.getElementById('cr');
    if (!cd || !cr) return;

    // Restore last position or default to center
    let mx = parseInt(sessionStorage.getItem('cx')) || window.innerWidth / 2;
    let my = parseInt(sessionStorage.getItem('cy')) || window.innerHeight / 2;
    let rx = mx, ry = my;

    cd.style.left = mx + 'px'; cd.style.top = my + 'px';
    cr.style.left = rx + 'px'; cr.style.top = ry + 'px';

    const sync = e => {
        mx = e.clientX; my = e.clientY;
        sessionStorage.setItem('cx', mx);
        sessionStorage.setItem('cy', my);
        cd.style.left = mx + 'px'; cd.style.top = my + 'px';
    };

    document.addEventListener('mousemove', sync);
    window.addEventListener('mouseenter', sync);

    (function loop() {
        rx += (mx - rx) * .12;
        ry += (my - ry) * .12;
        cr.style.left = rx + 'px'; cr.style.top = ry + 'px';
        requestAnimationFrame(loop);
    })();
}

/* ── LETTERBOX ───────────────────────────────────────────── */
function initLetterbox() {
    setTimeout(() => {
        const lbt = document.getElementById('lbt');
        const lbb = document.getElementById('lbb');
        if (lbt) lbt.classList.add('open');
        if (lbb) lbb.classList.add('open');
    }, 400);
}

/* ── CUSTOM APP BAR (DESKTOP) ────────────────────────────── */
function initTopbar() {
    const isDesktop = navigator.userAgent.includes('ClinicMasterDesktop') || window.location.href.includes('?desktop=true');
    if (!isDesktop) return;

    if (document.getElementById('app-bar')) return;

    if (document.body) document.body.classList.add('is-desktop');
    else document.addEventListener('DOMContentLoaded', () => document.body.classList.add('is-desktop'));

    const bar = document.createElement('div');
    bar.id = 'app-bar';
    bar.innerHTML = `
        <div class="ab-left">
            <div class="ab-btn" title="Menu">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </div>
            <div class="ab-btn" title="Toggle Sidebar" onclick="document.body.classList.toggle('sb-collapsed')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            </div>
            <div class="ab-sep"></div>
            <div class="ab-btn" title="Back" onclick="window.history.back()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </div>
            <div class="ab-btn" title="Forward" onclick="window.history.forward()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>
        </div>
        
        <div class="ab-drag">
            <span class="ab-title">ClinicMaster — Intelligence</span>
        </div>
        
        <div class="ab-controls">
            <div class="ab-btn win-btn" title="Minimize" onclick="toast('Minimize is handled by OS','ok')">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </div>
            <div class="ab-btn win-btn" title="Maximize" onclick="toast('Double-click title bar to resize','ok')">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            </div>
            <div class="ab-btn win-btn close" title="Exit" onclick="if(confirm('Close ClinicMaster Intelligence?')){window.close()}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
        </div>
    `;

    if (document.body) document.body.insertAdjacentElement('afterbegin', bar);
    else document.addEventListener('DOMContentLoaded', () => document.body.insertAdjacentElement('afterbegin', bar));

    console.log('💎 Premium Native Desktop Active');
}

// Aggressive Topbar Init: Run right away
initTopbar();

/* ── SCROLL EFFECTS ──────────────────────────────────────── */
function initScrollReveal() {
    const check = () => {
        document.querySelectorAll('.reveal').forEach(e => {
            if (e.getBoundingClientRect().top < innerHeight - 80) e.classList.add('vis');
        });
    };
    window.addEventListener('scroll', check);
    check();

    // Nav scroll style (landing)
    const nav = document.getElementById('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('sc', scrollY > 50);
        });
    }
}

/* ── SIDEBAR NAVIGATION ─────────────────────────────────── */
function initSidebar() {
    const sidebar = document.querySelector('.sb');
    if (!sidebar) return;

    // Check pre-cache for instant UI states
    const hasCache = sessionStorage.getItem('cm_cache');
    const cachedUser = sessionStorage.getItem('cm_user');
    let initials = 'DR', name = 'User', role = 'Physician';

    if (cachedUser) {
        const u = JSON.parse(cachedUser);
        const meta = u.user_metadata || {};
        role = meta.role ? (meta.role.charAt(0).toUpperCase() + meta.role.slice(1)) : 'Physician';
        initials = meta.role === 'secretary' ? 'SC' : 'DR';
        name = meta.full_name || u.email.split('@')[0];
    }

    // Standard Sidebar HTML with smart defaults
    sidebar.innerHTML = `
        <div class="sbb"><a href="index.html" style="text-decoration:none;color:inherit">Clinic<em>Master</em></a></div>
        <div class="sbn">
            <div class="sb-section-label">Main</div>
            <a href="dashboard.html" class="ni" data-page="dashboard">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>Overview</a>
            <a href="patients.html" class="ni" data-page="patients">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>Patients</a>
            <a href="add-patient.html" class="ni" data-page="add-patient">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>New Patient</a>

            <div class="sb-section-label">Clinical</div>
            <a href="pharmacy.html" class="ni" data-page="pharmacy">
                <svg viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>Pharmacy</a>
            <a href="diagnoses.html" class="ni" data-page="diagnoses">
                <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>Diagnoses</a>
            <a href="appointments.html" class="ni" data-page="appointments">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>Appointments</a>
            <a href="files.html" class="ni" data-page="files">
                <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>Files</a>

            <div class="sb-section-label">System</div>
            <a href="settings.html" class="ni" data-page="settings">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</a>
        </div>
        <div class="dbs">
            <div class="dd dd-indicator ${hasCache ? 'on' : ''}"></div><span class="ds-text">${hasCache ? 'Connected' : 'Connecting…'}</span>
        </div>
        <div class="sbbot">
            <div class="uch">
                <div class="uav">${initials}</div>
                <div>
                    <div class="unm">${name}</div>
                    <div class="url2">${role}</div>
                </div>
            </div>
            <div id="sb-logout" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--sidebar-border);">
                <div class="ni" style="padding: 0; border: none; background: transparent; color: rgba(255,255,255,0.4);" onclick="signOut()">
                    <svg viewBox="0 0 24 24" style="width:14px; height:14px;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    <span style="font-size: 10px; letter-spacing: 1px;">SIGN OUT</span>
                </div>
            </div>
        </div>
    `;

    // Active state based on current page
    const path = window.location.pathname.split('/').pop().replace('.html', '') || 'dashboard';
    sidebar.querySelectorAll('.ni[data-page]').forEach(n => {
        const page = n.getAttribute('data-page');
        const isActive = (page === path || (path === 'index' && page === 'dashboard'));

        if (isActive) {
            n.classList.add('active');
            // Prevent reloading the same page
            n.addEventListener('click', e => e.preventDefault());
        }
    });

    // Mobile toggle support
    const toggle = document.querySelector('.sb-toggle');
    if (toggle) {
        toggle.onclick = () => sidebar.classList.toggle('open');
        // Close on link click (mobile)
        sidebar.querySelectorAll('.ni').forEach(n => {
            n.addEventListener('click', () => {
                if (window.innerWidth <= 900) sidebar.classList.remove('open');
            });
        });
    }
}

/* ── POPULATE PATIENT SELECTS ────────────────────────────── */
function populatePatientSelects() {
    const opts = DB.patients.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('');
    document.querySelectorAll('.patient-select').forEach(el => {
        const first = el.options[0];
        el.innerHTML = '';
        if (first) el.appendChild(first);
        el.insertAdjacentHTML('beforeend', opts);
    });
}

/* ── MODAL ───────────────────────────────────────────────── */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function initModals() {
    document.querySelectorAll('.mo').forEach(m => {
        m.addEventListener('click', e => {
            if (e.target === m) m.classList.remove('open');
        });
    });
}

/* ── TOAST ───────────────────────────────────────────────── */
let toastTimer;
function toast(msg, type = 'ok') {
    const t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('tmsg').textContent = msg;
    t.className = 'show' + (type === 'err' ? ' err' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.className = '', 3000);
}

/* ── DRAG/DROP HELPERS ───────────────────────────────────── */
function initDropZone(zoneId, callback) {
    const zone = document.getElementById(zoneId);
    if (!zone) return;
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dg'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dg'));
    zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dg'); callback(e.dataTransfer.files); });
}

/* ── AGE FROM DOB ────────────────────────────────────────── */
function calcAge(dob) {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
}

/* ── FORMAT DATE ─────────────────────────────────────────── */
function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ── FORMAT FILE SIZE ────────────────────────────────────── */
function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

/* ── AUTH HELPERS ────────────────────────────────────────── */
async function checkAuth() {
    // 1. Initial Quick Check (Cached) - Priorities local session for speed
    const cachedUser = sessionStorage.getItem('cm_user');
    if (cachedUser) USER = JSON.parse(cachedUser);

    // 2. Fetch session first (faster than getUser in many cases)
    const { data: { session } } = await sb.auth.getSession();
    const path = window.location.pathname;

    if (!session) {
        sessionStorage.clear();

        // 1. Is this the index page? (Checked via global marker or path)
        const isLanding = window.IS_LANDING === true || path.endsWith('/') || path.endsWith('index.html');
        const isAuthPage = path.includes('auth.html');

        if (!isLanding && !isAuthPage) {
            window.location.href = 'auth.html';
        }
        return null;
    }

    // 3. Update with fresh user metadata if needed, but don't block UI
    USER = session.user;

    // Sync cache: If meta changed (like joining a practice), clear data sync cache
    if (cachedUser) {
        const oldMeta = JSON.parse(cachedUser).user_metadata || {};
        const newMeta = USER.user_metadata || {};
        if (oldMeta.role !== newMeta.role || oldMeta.linked_doctor_id !== newMeta.linked_doctor_id) {
            sessionStorage.removeItem('cm_cache');
        }
    }

    sessionStorage.setItem('cm_user', JSON.stringify(USER));

    // First-time setup redirect for Google Login users
    if (!USER.user_metadata?.role && !path.includes('setup.html')) {
        window.location.href = 'setup.html';
        return USER;
    }

    return USER;
}

function updateSidebarUser() {
    if (!USER) return;
    const meta = USER.user_metadata || {};
    const role = meta.role || 'doctor';

    let initials = 'DR';
    if (role === 'secretary') initials = 'SC';

    document.querySelectorAll('.uav').forEach(el => el.textContent = initials);
    document.querySelectorAll('.unm').forEach(el => {
        // Use full_name if available, otherwise email prefix
        const name = meta.full_name || USER.email.split('@')[0];
        el.textContent = name.charAt(0).toUpperCase() + name.slice(1);
    });
    document.querySelectorAll('.url2').forEach(el => el.textContent = role.charAt(0).toUpperCase() + role.slice(1));
}

function applyRoleRestrictions() {
    if (!USER) return;
    const role = USER.user_metadata.role || 'doctor';

    if (role === 'secretary') {
        const path = window.location.pathname;

        // Restricted clinical modules
        const restricted = ['pharmacy', 'diagnoses'];
        if (restricted.some(p => path.includes(p))) {
            toast('Medical Staff Only', 'err');
            setTimeout(() => window.location.href = 'dashboard.html', 1500);
        }

        // Global CSS to hide clinical links
        const style = document.createElement('style');
        style.textContent = `
            .ni[data-page="pharmacy"], .ni[data-page="diagnoses"] { display: none !important; }
            table td button.dng { display: none !important; }
        `;
        document.head.appendChild(style);
    }
}

async function signOut() {
    await sb.auth.signOut();
    window.location.href = 'index.html';
}

/* ── INIT COMMON ─────────────────────────────────────────── */
async function initCommon() {
    // initTopbar is now called aggressively at script load
    initCursor();
    const user = await checkAuth();
    initSidebar();
    updateSidebarUser();
    applyRoleRestrictions();
    initModals();

    // Index page link adjustment
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        const ctaButtons = document.querySelectorAll('a[href="dashboard.html"]');
        ctaButtons.forEach(btn => {
            if (!user) btn.href = 'auth.html';
        });
    }
}

/* Run on every page */
document.addEventListener('DOMContentLoaded', initCommon);
