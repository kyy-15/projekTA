const { ipcRenderer } = require('electron');

// --- DEKLARASI ELEMEN DOM ---
const addBtn = document.getElementById('addBtn');
const categoryBtn = document.getElementById('categoryBtn');
const categoryInput = document.getElementById('categoryInput');
const popup = document.getElementById('popup-kategori');
const listMenu = document.getElementById('list-menu');
const categoryContainer = document.getElementById('category');
const inputKategoriSelect = document.getElementById('input-kategori');

// --- INTEGRASI PENCARIAN TEKS ---
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchProduct');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const productCards = document.querySelectorAll('.menu-card-item');

            productCards.forEach(card => {
                const title = card.querySelector('.menu-card-name').textContent.toLowerCase();
                card.style.display = title.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }
});

// --- FUNGSI UNTUK MERENDER TOMBOL FILTER DAN DROPDOWN KATEGORI ---
function renderCategories(semuakategori) {
    if (!categoryContainer) return;

    // 1. Kosongkan daftar tombol filter lama agar tidak menumpuk ganda
    categoryContainer.innerHTML = '';

    // 2. Buat tombol "Semua" secara statis di awal baris filter
    const semuaWrapper = document.createElement('div');
    semuaWrapper.innerHTML = `<button class="menu-btn-filter active" data-category="all">Semua</button>`;
    const btnSemua = semuaWrapper.querySelector('button');

    btnSemua.addEventListener('click', () => {
        document.querySelectorAll('.menu-btn-filter').forEach(btn => btn.classList.remove('active'));
        btnSemua.classList.add('active');

        // Tampilkan seluruh kartu menu kembali
        const productCards = document.querySelectorAll('.menu-card-item');
        productCards.forEach(card => {
            card.style.display = 'block';
        });
    });

    categoryContainer.appendChild(semuaWrapper);

    // 3. Render tombol kategori dinamis dari data JSON kategori
    if (semuakategori && semuakategori.length > 0) {
        semuakategori.forEach(kategori => {
            const wrapper = document.createElement('div');
            wrapper.setAttribute('data-id', kategori.id);

            wrapper.innerHTML = `<button class="menu-btn-filter" data-category="${kategori.id}">${kategori.name}</button>`;
            const button = wrapper.querySelector('button');

            // Event klik filter kategori spesifik
            button.addEventListener('click', () => {
                document.querySelectorAll('.menu-btn-filter').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const selectedCategory = button.getAttribute('data-category');
                const productCards = document.querySelectorAll('.menu-card-item');

                productCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');

                    // Jika cocok tampilkan, jika tidak sembunyikan total (agar posisi merapat otomatis)
                    if (cardCategory === selectedCategory) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });

            categoryContainer.appendChild(wrapper);
        });
    }

    // 4. Render data kategori masuk ke elemen dropdown select form tambah menu (jika ada di halaman)
    if (inputKategoriSelect) {
        inputKategoriSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
        if (semuakategori && semuakategori.length > 0) {
            semuakategori.forEach(kategori => {
                const opt = document.createElement('option');
                opt.value = kategori.id;
                opt.textContent = kategori.name;
                inputKategoriSelect.appendChild(opt);
            });
        }
    }
}

// --- INISIALISASI DATA MASTER KATEGORI ---
async function initKategori() {
    try {
        const semuakategori = await ipcRenderer.invoke('get-categories');
        renderCategories(semuakategori);
    } catch (error) {
        console.error("Gagal memuat daftar kategori:", error);
        if (categoryContainer) {
            categoryContainer.innerHTML = `<p style="color: red;">Terjadi kesalahan saat memuat data sistem.</p>`;
        }
    }
}

// --- INISIALISASI DAN PENGATURAN STRUKTUR ELEMENT DAFTAR MENU ---
async function initDaftarMenu() {
    try {
        const semuamenu = await ipcRenderer.invoke('get-all-menu');

        if (!semuamenu || semuamenu.length === 0) {
            listMenu.innerHTML = `<p>Tidak ada data menu. Silakan tambah menu baru terlebih dahulu.</p>`;
            return;
        }

        listMenu.innerHTML = '';

        semuamenu.forEach(menu => {
            // SOLUSI MERAPAT: Elemen terluar langsung disuntikkan kelas menu-card-item
            const card = document.createElement('div');
            card.className = 'menu-card-item';
            card.setAttribute('data-id', menu.id);
            card.setAttribute('data-category', menu.kategori_id || ''); // Bind ID Kategori relasional

            const gambarStyle = menu.gambar_base64 ? `background-image: url('${menu.gambar_base64}')` : '';
            const hargaTeks = menu.harga_jual ? `Rp ${Math.round(menu.harga_jual).toLocaleString('id-ID')}` : 'Rp 0';

            // Bagian dalam kartu menu
            card.innerHTML = `
                <div class="menu-card-thumb" style="${gambarStyle}"></div>
                <div class="menu-card-body">
                    <div class="menu-card-name">${menu.nama_menu}</div>
                    <div class="menu-card-price">${hargaTeks}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                const idMenu = card.getAttribute('data-id');
                window.location.href = `detailmenu.html?id=${idMenu}`;
            });

            listMenu.appendChild(card);
        });

    } catch (error) {
        console.error("Gagal memuat daftar menu:", error);
        listMenu.innerHTML = `<p style="color: red;">Terjadi kesalahan saat memuat data sistem.</p>`;
    }
}

// Jalankan inisialisasi awal saat halaman dibuka pertama kali
initDaftarMenu();
initKategori();

// --- EVENT LISTENER AKSES TOMBOL UI POPUP ---
if (categoryBtn && popup) {
    categoryBtn.addEventListener('click', () => {
        popup.style.display = 'block';
    });
}

// Logika simpan tambah kategori baru lewat modal popup
if (addBtn) {
    addBtn.addEventListener('click', async () => {
        const name = categoryInput.value.trim();

        if (name === '') {
            alert('Nama kategori tidak boleh kosong!');
            return;
        }

        try {
            // 1. Kirim data ke Main Process
            const updatedCategories = await ipcRenderer.invoke('add-category', name);

            // 2. Render ulang UI tombol filter & dropdown select secara langsung tanpa refresh aplikasi
            renderCategories(updatedCategories);

            // 3. Reset form input & tutup jendela popup otomatis
            categoryInput.value = '';
            if (popup) popup.style.display = 'none';

        } catch (error) {
            console.error("Gagal menambah kategori:", error);
        }
    });
}

const btnTambahMenu = document.getElementById('btnTambahMenu');

if (btnTambahMenu) {
    btnTambahMenu.addEventListener('click', () => {
        window.location.href = '../html/tambah-menu.html';
    });
}