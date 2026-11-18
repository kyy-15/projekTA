const { ipcRenderer } = require('electron');

// --- DEKLARASI ELEMEN DOM ---
const addBtn = document.getElementById('addBtn');
const categoryBtn = document.getElementById('categoryBtn');
const categoryInput = document.getElementById('categoryInput');
const popup = document.getElementById('popup-kategori');
const listMenu = document.getElementById('list-menu');
const categoryContainer = document.getElementById('category');

// --- INTEGRASI PENCARIAN & FILTER KATEGORI ---
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

// --- FUNGSI UNTUK MERENDER TOMBOL KATEGORI KE UI (SOLUSI ERROR) ---
function renderCategories(semuakategori) {
    if (!categoryContainer) return;
    categoryContainer.innerHTML = ''; // Kosongkan daftar lama agar tidak menumpuk ganda

    if (!semuakategori || semuakategori.length === 0) return;

    semuakategori.forEach(kategori => {
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-id', kategori.id);

        // Buat elemen tombol kategori
        wrapper.innerHTML = `<button class="menu-btn-filter" data-category="${kategori.id}">${kategori.name}</button>`;
        const button = wrapper.querySelector('button');

        // Pasang Fitur Filter Klik langsung pada tombol yang baru dibuat
        button.addEventListener('click', () => {
            document.querySelectorAll('.menu-btn-filter').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCategory = button.getAttribute('data-category');
            const productCards = document.querySelectorAll('.menu-card-item');

            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category'); // Pastikan elemen menu Anda memiliki atribut ini nanti
                if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });

        categoryContainer.appendChild(wrapper);
    });
}

// --- INISIALISASI DAFTAR KATEGORI ---
async function initKategori() {
    try {
        const semuakategori = await ipcRenderer.invoke('get-categories');
        // Panggil fungsi render yang sudah dibuat di atas
        renderCategories(semuakategori);
    } catch (error) {
        console.error("Gagal memuat daftar kategori:", error);
        if (categoryContainer) {
            categoryContainer.innerHTML = `<p style="color: red;">Terjadi kesalahan saat memuat data sistem.</p>`;
        }
    }
}

// --- INISIALISASI DAFTAR MENU ---
async function initDaftarMenu() {
    try {
        const semuamenu = await ipcRenderer.invoke('get-all-menu');

        if (!semuamenu || semuamenu.length === 0) {
            listMenu.innerHTML = `<p>Tidak ada data menu. Silakan tambah menu baru terlebih dahulu.</p>`;
            return;
        }

        listMenu.innerHTML = '';

        semuamenu.forEach(menu => {
            const card = document.createElement('div');
            card.setAttribute('data-id', menu.id);

            const gambarStyle = menu.gambar_base64 ? `background-image: url('${menu.gambar_base64}')` : '';
            const hargaTeks = menu.harga_jual ? `Rp ${Math.round(menu.harga_jual).toLocaleString('id-ID')}` : 'Rp 0';

            card.innerHTML = `
            <div class="menu-card-item" data-category="${menu.kategori_id || ''}">
                <div class="menu-card-thumb" style="${gambarStyle}"></div>
                <div class="menu-card-body">
                    <div class="menu-card-name">${menu.nama_menu}</div>
                    <div class="menu-card-price">${hargaTeks}</div>
                </div>
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

// Jalankan fungsi inisialisasi awal saat halaman terbuka
initDaftarMenu();
initKategori();

// --- EVENT LISTENER TOMBOL UI ---
if (categoryBtn && popup) {
    categoryBtn.addEventListener('click', () => {
        popup.style.display = 'block';
    });
}

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

            // 2. Sekarang fungsi renderCategories sudah tersedia dan akan langsung memperbarui UI
            renderCategories(updatedCategories);

            // 3. Reset form input & tutup jendela popup otomatis
            categoryInput.value = '';
            if (popup) popup.style.display = 'none';

        } catch (error) {
            console.error("Gagal menambah kategori:", error);
        }
    });
}
// Ambil elemen select form tambah menu
const inputKategoriSelect = document.getElementById('input-kategori');

// --- FUNGSI UNTUK MERENDER TOMBOL DAN DROPDOWN KATEGORI ---
function renderCategories(semuakategori) {
    // 1. Render untuk Tombol Filter (Kode Anda yang sebelumnya)
    if (!categoryContainer) return;

    // 1. Kosongkan daftar lama
    categoryContainer.innerHTML = '';

    // 2. BUAT TOMBOL "SEMUA" SECARA STATIS DI AWAL (FITUR BARU)
    const semuaWrapper = document.createElement('div');
    semuaWrapper.innerHTML = `<button class="menu-btn-filter active" data-category="all">Semua</button>`;
    const btnSemua = semuaWrapper.querySelector('button');

    // Pasang Event Listener untuk tombol "Semua"
    btnSemua.addEventListener('click', () => {
        // Atur kelas active pas klik
        document.querySelectorAll('.menu-btn-filter').forEach(btn => btn.classList.remove('active'));
        btnSemua.classList.add('active');

        // Tampilkan SELURUH kartu menu tanpa pengecualian
        const productCards = document.querySelectorAll('.menu-card-item');
        productCards.forEach(card => {
            card.style.display = 'block';
        });
    });

    // Masukkan tombol "Semua" ke dalam container utama paling pertama
    categoryContainer.appendChild(semuaWrapper);

    // 3. RENDER TOMBOL KATEGORI DINAMIS DARI DATA JSON (Sama seperti sebelumnya)
    if (!semuakategori || semuakategori.length === 0) return;

    semuakategori.forEach(kategori => {
        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-id', kategori.id);

        wrapper.innerHTML = `<button class="menu-btn-filter" data-category="${kategori.id}">${kategori.name}</button>`;
        const button = wrapper.querySelector('button');

        // Event Listener untuk tombol kategori spesifik
        button.addEventListener('click', () => {
            document.querySelectorAll('.menu-btn-filter').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCategory = button.getAttribute('data-category');
            const productCards = document.querySelectorAll('.menu-card-item');

            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                // Jika ID Kategori kartu cocok dengan tombol yang diklik, tampilkan. Jika tidak, sembunyikan.
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

// 2. TAMPILKAN DI DROPDOWN FORM TAMBAH MENU (FITUR BARU)
if (inputKategoriSelect) {
    // Kembalikan ke opsi default awal
    inputKategoriSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';

    if (semuakategori && semuakategori.length > 0) {
        semuakategori.forEach(kategori => {
            const option = document.createElement('option');
            option.value = kategori.id;       // Menyimpan ID kategori ke dalam database menu
            option.textContent = kategori.name; // Menampilkan nama kategori di UI dropdown

            inputKategoriSelect.appendChild(option);
        });
    }
}
