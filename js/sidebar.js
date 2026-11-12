document.addEventListener("DOMContentLoaded", () => {
    const sidebarContainer = document.getElementById("sidebar-container");
    
    if (sidebarContainer) {
        // Mengambil file HTML sidebar secara lokal
        fetch('sidebar.html')
            .then(response => response.text())
            .then(data => {
                sidebarContainer.innerHTML = data;
                tandaiMenuAktif();
            })
            .catch(error => console.error('Gagal memuat sidebar:', error));
    }
});
function tandaiMenuAktif() {
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll("#sidebar-container a");
    sidebarLinks.forEach(link => {
        // Mengambil nilai atribut href dari link (misal: "beranda.html")
        const linkHref = link.getAttribute("href");

        // Jika URL saat ini mengandung nama file di href, tambahkan class 'active'
        if (currentPath.endsWith(linkHref)) {
            link.classList.add("active");
        }
    });
}