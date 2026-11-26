document.addEventListener('DOMContentLoaded', loadSidebar);

async function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    // Halaman kasir dapat menandai <body data-role="kasir"> atau memakai nama file beranda-kasir.
    const currentFile = window.location.pathname.split(/[\\/]/).pop().toLowerCase();
    const isKasir = document.body.dataset.role === 'kasir' || currentFile.includes('kasir');
    const sidebarFile = isKasir ? 'sidebar-kasir.html' : 'sidebar.html';

    try {
        const response = await fetch(sidebarFile);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        container.innerHTML = await response.text();
        tandaiMenuAktif();
        pasangHandlerLogout();
    } catch (error) {
        console.error(`Gagal memuat ${sidebarFile}:`, error);
        container.innerHTML = '<p class="sidebar-error">Sidebar gagal dimuat.</p>';
    }
}

function tandaiMenuAktif() {
    const currentFile = window.location.pathname.split(/[\\/]/).pop().toLowerCase();
    document.querySelectorAll('#sidebar-container a.menu-item').forEach(link => {
        link.classList.remove('active');
        const linkFile = (link.getAttribute('href') || '').split(/[\\/]/).pop().toLowerCase();
        if (linkFile && linkFile === currentFile) link.classList.add('active');
    });
}

function pasangHandlerLogout() {
    const logout = document.querySelector('#sidebar-container #btnLogout');
    if (!logout) return;
    logout.addEventListener('click', event => {
        event.preventDefault();
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('namaUser');
        sessionStorage.removeItem('roleUser');
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    });
}

window.loadSidebar = loadSidebar;