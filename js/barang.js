const { ipcRenderer } = require('electron');

// ==========================================
// DOM Elements
// ==========================================
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const filterStatus = document.getElementById('filterStatus');
const btnTambahBarang = document.getElementById('btnTambahBarang');
const modalBarang = document.getElementById('modalBarang');
const modalTitle = document.getElementById('modalTitle');
const formBarang = document.getElementById('formBarang');
const btnCancel = document.getElementById('btnCancel');
const btnSubmit = document.getElementById('btnSubmit');

// Input Elemen Form Popup
const barangIdInput = document.getElementById('barangId');
const kodeBarangInput = document.getElementById('kodeBarang');
const namaBarangInput = document.getElementById('namaBarang');
const satuanBarangInput = document.getElementById('satuanBarang');
const kategoriBarangInput = document.getElementById('kategoriBarang');
const stokFisikInput = document.getElementById('stokFisik');
const stokSistemInput = document.getElementById('stokSistem');
const hargaBeliInput = document.getElementById('hargaBeli');
const minimalStokInput = document.getElementById('minimalStok');
const keteranganBarangInput = document.getElementById('keteranganBarang');

// Array penampung data utama dari JSON
let masterDataBarang = [];

// ==========================================
// 1. Ambil Data dari Backend (Main Process)
// ==========================================
async function loadBarangData() {
    try {
        masterDataBarang = await ipcRenderer.invoke('get-barang');
        renderTable(masterDataBarang);
    } catch (err) {
        console.error("Gagal mengambil data barang dari main.js:", err);
    }
}

// Helper untuk memastikan angka diparsing dengan benar
function parseNumeric(value) {
    if (value === undefined || value === null) return 0;
    let clean = value.toString().replace(/[^0-9.,-]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
}

// ==========================================
// 2. Render Data ke Tabel HTML Baru
// ==========================================
function renderTable(data) {
    tableBody.innerHTML = '';
    
    const keyword = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;
    let indexRender = 1;

    data.forEach(item => {
        // Ambil nilai stok fisik, sistem, dan minimal stok
        const fStok = parseNumeric(item.stok_fisik !== undefined ? item.stok_fisik : item.stok);
        const sStok = parseNumeric(item.stok_sistem !== undefined ? item.stok_sistem : item.stok);
        const minStok = parseNumeric(item.minimal_stok || 5); 
        
        // 1. Logika Perhitungan Selisih & Status Opname
        const selisih = fStok - sStok;
        const isSesuai = selisih === 0;
        const txtStatusOpname = isSesuai ? 'Sesuai' : 'Tidak Sesuai';

        // 2. Logika Status Stok (Aman, Menipis, Habis)
        let txtStatusStok = 'Aman';
        let classStatusStok = 'aman';
        
        if (fStok <= 0) {
            txtStatusStok = 'Habis';
            classStatusStok = 'habis';
        } else if (fStok < minStok) {
            txtStatusStok = 'Menipis';
            classStatusStok = 'menipis';
        }

        // Filter realtime berdasarkan Pencarian Kata Kunci (Nama atau Kode)
        const kode = item.kode || '';
        if (keyword && !item.nama.toLowerCase().includes(keyword) && !kode.toLowerCase().includes(keyword)) {
            return;
        }

        // Filter realtime berdasarkan Dropdown Status Opname (Sesuai / Tidak Sesuai)
        if (statusFilter !== 'Semua' && txtStatusOpname !== statusFilter) {
            return;
        }

        const tr = document.createElement('tr');
        
        // KEBUTUHAN UTAMA: Jika barang lebih rendah dari minimal stock, beri dot merah (.row-low-stock)
        if (fStok < minStok) {
            tr.classList.add('row-low-stock');
        }

        // Tampilkan format nilai selisih absolut (tanpa minus di tabel)
        const selisihAbsolut = Math.abs(selisih);
        const selisihTeks = selisihAbsolut % 1 === 0 ? selisihAbsolut : selisihAbsolut.toFixed(1);
        const satuan = item.satuan || 'Kg';

        tr.innerHTML = `
            <td>${indexRender++}</td>
            <td>${item.nama}</td>
            <td>${item.kategori || 'Bahan Baku'}</td>
            <td>${fStok} ${satuan}</td>
            <td>${sStok} ${satuan}</td>
            <td>${selisihTeks} ${satuan}</td>
            <td>
                <span class="status-badge-stok ${classStatusStok}">${txtStatusStok}</span>
            </td>
            <td>
                <span class="status-badge ${isSesuai ? 'sesuai' : 'tidak-sesuai'}">${txtStatusOpname}</span>
            </td>
            <td class="text-center">
                <button class="btn-edit" onclick="openEditModal('${item.id}')">✏️</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// Event Listener Input Pencarian dan Filter Dropdown Status Opname
searchInput.addEventListener('input', () => renderTable(masterDataBarang));
filterStatus.addEventListener('change', () => renderTable(masterDataBarang));

// ==========================================
// 3. Logika Buka / Tutup Modal Popup
// ==========================================
btnTambahBarang.addEventListener('click', () => {
    modalTitle.innerText = 'Tambah Barang';
    btnSubmit.innerText = 'Tambah';
    formBarang.reset();
    barangIdInput.value = ''; 
    modalBarang.classList.remove('hidden');
});

btnCancel.addEventListener('click', () => {
    modalBarang.classList.add('hidden');
});

// Fungsi Global untuk memicu Popup Mode Edit
window.openEditModal = function(id) {
    const item = masterDataBarang.find(b => b.id.toString() === id.toString());
    if (!item) return;

    modalTitle.innerText = 'Edit ' + item.nama;
    btnSubmit.innerText = 'Tambah'; 
    
    // Isi data lama ke field form popup
    barangIdInput.value = item.id;
    kodeBarangInput.value = item.kode || ('SKU-00' + item.id);
    namaBarangInput.value = item.nama || '';
    satuanBarangInput.value = item.satuan || 'Kg';
    kategoriBarangInput.value = item.kategori || 'Bahan Baku';
    stokFisikInput.value = item.stok_fisik !== undefined ? item.stok_fisik : item.stok;
    stokSistemInput.value = item.stok_sistem !== undefined ? item.stok_sistem : item.stok;
    hargaBeliInput.value = item.harga_beli || item.harga_satuan || '';
    minimalStokInput.value = item.minimal_stok || 5;
    keteranganBarangInput.value = item.keterangan || '';

    modalBarang.classList.remove('hidden');
};

// ==========================================
// 4. Form Submit Handler (Kirim ke main.js)
// ==========================================
formBarang.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        id: barangIdInput.value || null, 
        kode: kodeBarangInput.value,
        nama: namaBarangInput.value,
        satuan: satuanBarangInput.value,
        kategori: kategoriBarangInput.value,
        stok_fisik: parseFloat(stokFisikInput.value) || 0,
        stok_sistem: parseFloat(stokSistemInput.value) || 0,
        harga_beli: hargaBeliInput.value,
        minimal_stok: parseFloat(minimalStokInput.value) || 0,
        keterangan: keteranganBarangInput.value
    };

    try {
        const response = await ipcRenderer.invoke('save-barang', payload);
        if (response.success) {
            masterDataBarang = response.data; 
            renderTable(masterDataBarang);   
        }
    } catch (err) {
        console.error("Gagal mengirim data simpan ke main process:", err);
    }

    modalBarang.classList.add('hidden');
});

// Jalankan pengambilan data secara otomatis saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', loadBarangData);
