/* ═══════════════════════════════════════════════════════════
   CLINICMASTER — Shared Application Logic
   ═══════════════════════════════════════════════════════════ */

/* ── SUPABASE ────────────────────────────────────────────── */
const SBU = 'https://pxbfwesywdbxiibxgmwe.supabase.co';
const SBK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4YmZ3ZXN5d2RieGlpYnhnbXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTczOTcsImV4cCI6MjA4NzAzMzM5N30.eixNDkcZIwgwltOWSyam2dSN_BNN3EeyhJGjniueQOY';
const sb = supabase.createClient(SBU, SBK);

/* Global data store */
let DB = { patients: [], drugs: [], appointments: [], files: [], diagnoses: [] };

/* ── CRUD HELPERS ────────────────────────────────────────── */
async function qry(table, order = 'created') {
    const { data, error } = await sb.from(table).select('*').order(order, { ascending: false }).limit(500);
    return error ? [] : data || [];
}

async function ins(table, row) {
    const { error } = await sb.from(table).insert(row);
    if (error) toast('DB: ' + error.message, 'err');
    return !error;
}

async function del(table, id) {
    await sb.from(table).delete().eq('id', id);
}

async function upd(table, id, patch) {
    await sb.from(table).update(patch).eq('id', id);
}

/* ── LOAD ALL DATA ───────────────────────────────────────── */
async function loadAll() {
    try {
        [DB.patients, DB.drugs, DB.appointments, DB.files, DB.diagnoses] = await Promise.all([
            qry('cm_patients'),
            qry('cm_drugs'),
            qry('cm_appointments'),
            qry('cm_files'),
            qry('cm_diagnoses', 'date')
        ]);
        setStatus('Connected · ' + DB.patients.length + ' patients', true);
        return true;
    } catch (e) {
        setStatus('Connection error', false);
        console.error(e);
        return false;
    }
}

/* ── STATUS INDICATOR ────────────────────────────────────── */
function setStatus(msg, ok) {
    document.querySelectorAll('.dd-indicator').forEach(el => {
        ok ? el.classList.add('on') : el.classList.remove('on');
    });
    document.querySelectorAll('.ds-text').forEach(el => {
        el.textContent = ok ? 'Supabase Live' : 'Offline';
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
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        cd.style.left = mx + 'px'; cd.style.top = my + 'px';
    });
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
    // Active state based on current page
    const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    document.querySelectorAll('.ni[data-page]').forEach(n => {
        const page = n.getAttribute('data-page');
        if (page === path || (path === 'index' && page === 'dashboard')) {
            n.classList.add('active');
        }
    });

    // Mobile toggle
    const toggle = document.querySelector('.sb-toggle');
    const sidebar = document.querySelector('.sb');
    if (toggle && sidebar) {
        toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
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

/* ── INIT COMMON ─────────────────────────────────────────── */
function initCommon() {
    initCursor();
    initSidebar();
    initModals();
}

/* Run on every page */
document.addEventListener('DOMContentLoaded', initCommon);
