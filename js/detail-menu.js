const { ipcRenderer } = require('electron');

// State Internal Halaman Detail
let menuIdAktif = ""; // ID Menu yang dimuat
let dataMenuPenuh = null; // Menampung objek menu dari json
let masterBarang = [];
let resepBahanAktif = []; // Resep berdasarkan varian yang dipilih saat ini

// Selectors
const detailInputNama = document.getElementById('detail-input-nama');
const detailTxtTitle = document.getElementById('detail-txt-title');
const detailInputKategori = document.getElementById('detail-input-kategori');
const detailSelectVarian = document.getElementById('detail-select-varian');
const detailInputDeskripsi = document.getElementById('detail-input-deskripsi');
const detailTbodyResep = document.getElementById('detail-tbody-resep');
const detailInputHpp = document.getElementById('detail-input-hpp');
const detailInputHargaJual = document.getElementById('detail-input-harga-jual');
const detailTxtMargin = document.getElementById('detail-txt-margin');
const detailImgPreview = document.getElementById('detail-img-preview');

// Modal Selectors
const detailModalBahan = document.getElementById('detail-modal-bahan');
const modalSelectBarang = document.getElementById('modal-select-barang');
const modalTxtStok = document.getElementById('modal-txt-stok');
const modalTxtSatuan = document.getElementById('modal-txt-satuan');
const modalInputTakaran = document.getElementById('modal-input-takaran');

// Ambil Menu ID dari URL Parameter (Misal: detail-menu.html?id=MN-12345)
const urlParams = new URLSearchParams(window.location.search);
menuIdAktif = urlParams.get('id');

// 1. Inisialisasi Utama Halaman Detail
async function initDetail() {
  // 1a. Ambil data master barang baku
  masterBarang = await ipcRenderer.invoke('get-barang');
  buildModalDropdown();

  // 1b. Ambil dan render seluruh master kategori ke dropdown select secara dinamis
  await initKategoriDropdown();

  // 2. Ambil data menu spesifik
  const semuaMenu = await ipcRenderer.invoke('get-all-menu');

  // Catatan Jalur Cadangan: Jika tidak ada id di parameter URL, ambil data item pertama dari menu.json untuk simulasi
  dataMenuPenuh = semuaMenu.find(m => m.id === menuIdAktif) || semuaMenu[0];

  if (!dataMenuPenuh) {
    alert("Data menu kosong atau tidak ditemukan! Pastikan data/menu.json sudah terisi.");
    return;
  }

  // 3. Petakan Data Menu ke Form Input UI
  menuIdAktif = dataMenuPenuh.id;
  detailInputNama.value = dataMenuPenuh.nama_menu;
  detailTxtTitle.textContent = dataMenuPenuh.nama_menu;
  detailInputDeskripsi.value = dataMenuPenuh.deskripsi || "";
  detailInputHargaJual.value = dataMenuPenuh.harga_jual || 0;

  // Sinkronisasi Kategori Terpilih di Dropdown berdasarkan kategori_id dari database menu
  if (detailInputKategori) {
    detailInputKategori.value = dataMenuPenuh.kategori_id || "";
  }

  if (dataMenuPenuh.gambar_base64) {
    detailImgPreview.style.backgroundImage = `url('${dataMenuPenuh.gambar_base64}')`;
  }

  // Load resep awal berdasarkan opsi default select varian (dine-in)
  extractResepByVarian();
}

// 2. Mengambil data dari json kategori dan merender opsi secara dinamis ke dropdown
async function initKategoriDropdown() {
  if (!detailInputKategori) return;

  try {
    const semuakategori = await ipcRenderer.invoke('get-categories');

    // Kosongkan HTML bawaan mockup statis
    detailInputKategori.innerHTML = '<option value="">-- Pilih Kategori --</option>';

    if (semuakategori && semuakategori.length > 0) {
      semuakategori.forEach(kategori => {
        const opt = document.createElement('option');
        opt.value = kategori.id;       // Menyimpan ID kategori unik
        opt.textContent = kategori.name; // Menampilkan nama teks kategori
        detailInputKategori.appendChild(opt);
      });
    }
  } catch (error) {
    console.error("Gagal memuat daftar kategori ke dropdown detail:", error);
  }
}

// Ekstraksi data resep modular saat varian ditukar
function extractResepByVarian() {
  const varianPilihan = detailSelectVarian.value; // 'dine-in' atau 'takeaway'

  if (dataMenuPenuh.varian_data) {
    const key = varianPilihan === 'dine-in' ? 'dine_in' : 'takeaway';
    resepBahanAktif = dataMenuPenuh.varian_data[key]?.resep || [];
  } else {
    // Jalur fallback jika struktur file json lama/sederhana
    resepBahanAktif = dataMenuPenuh.bahan_baku || [];
  }

  renderTabelResep();
  hitungHppDanMarginLive();
}

detailSelectVarian.addEventListener('change', extractResepByVarian);

// Render Data ke Komponen Tabel Hijau
function renderTabelResep() {
  detailTbodyResep.innerHTML = '';
  resepBahanAktif.forEach((item, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nama}</td>
      <td>${item.jumlah} ${item.satuan || ''}</td>
      <td>Rp ${Math.round(item.modal).toLocaleString('id-ID')}</td>
      <td><button type="button" class="btn-delete-icon-table" onclick="hapusBahanDetail(${index})">✖</button></td>
    `;
    detailTbodyResep.appendChild(tr);
  });
}

// Hapus Item Resep dari Tabel
window.hapusBahanDetail = (index) => {
  resepBahanAktif.splice(index, 1);
  renderTabelResep();
  hitungHppDanMarginLive();
};

// Hitung HPP Modal & Margin Laba Seketika
function hitungHppDanMarginLive() {
  let totalHpp = 0;
  resepBahanAktif.forEach(item => { totalHpp += item.modal; });

  detailInputHpp.value = Math.round(totalHpp).toLocaleString('id-ID');
  detailInputHpp.dataset.raw = totalHpp;

  const hargaJual = parseFloat(detailInputHargaJual.value) || 0;
  if (hargaJual > 0) {
    const marginPersen = Math.round(((hargaJual - totalHpp) / hargaJual) * 100);
    detailTxtMargin.textContent = `${marginPersen} %`;
  } else {
    detailTxtMargin.textContent = `0 %`;
  }
}

detailInputHargaJual.addEventListener('input', hitungHppDanMarginLive);
detailInputNama.addEventListener('input', (e) => {
  detailTxtTitle.textContent = e.target.value.trim() || 'Untitled';
});

// 5. Fitur Modal Pendukung Tambah Bahan Baru Saat Edit Halaman
function buildModalDropdown() {
  modalSelectBarang.innerHTML = '';
  masterBarang.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.nama;
    modalSelectBarang.appendChild(opt);
  });
  syncModalBarangInfo();
}

function syncModalBarangInfo() {
  const item = masterBarang.find(b => b.id === modalSelectBarang.value);
  if (item) {
    modalTxtStok.textContent = `Stok: ${item.stok} ${item.satuan}`;
    modalTxtSatuan.textContent = item.satuan;
  }
}
modalSelectBarang.addEventListener('change', syncModalBarangInfo);

document.getElementById('btn-detail-tambah-bahan').addEventListener('click', () => {
  detailModalBahan.classList.add('show');
});
document.getElementById('btn-modal-tutup').addEventListener('click', () => {
  detailModalBahan.classList.remove('show');
});

document.getElementById('btn-modal-save-item').addEventListener('click', () => {
  const itemMaster = masterBarang.find(b => b.id === modalSelectBarang.value);
  const qty = parseFloat(modalInputTakaran.value) || 0;

  if (qty <= 0) return alert('Takaran jumlah harus bernilai positif!');

  const modalCost = itemMaster.harga_satuan * qty;

  // Cek duplikasi komponen resep
  const sdhAda = resepBahanAktif.find(i => i.id === itemMaster.id);
  if (sdhAda) {
    sdhAda.jumlah += qty;
    sdhAda.modal += modalCost;
  } else {
    resepBahanAktif.push({
      id: itemMaster.id,
      nama: itemMaster.nama,
      jumlah: qty,
      satuan: itemMaster.satuan,
      modal: modalCost
    });
  }

  detailModalBahan.classList.remove('show');
  renderTabelResep();
  hitungHppDanMarginLive();
});

// 6. Fitur Ganti / Ulang Unggah Foto
const btnUbahFoto = document.getElementById('btn-ubah-foto');
const detailInputFoto = document.getElementById('detail-input-foto');
btnUbahFoto.addEventListener('click', () => detailInputFoto.click());
detailInputFoto.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (evt) {
      dataMenuPenuh.gambar_base64 = evt.target.result;
      detailImgPreview.style.backgroundImage = `url('${evt.target.result}')`;
    };
    reader.readAsDataURL(file);
  }
});

// ==========================================
// ACTION CRUD UTAMA: UPDATE DETAIL MENU
// ==========================================
document.getElementById('btn-ubah-detail-menu').addEventListener('click', async () => {
  const vKey = detailSelectVarian.value === 'dine-in' ? 'dine_in' : 'takeaway';
  const currentHpp = parseFloat(detailInputHpp.dataset.raw || 0);

  // Perbarui struktur objek state internal sebelum dikirim via IPC
  dataMenuPenuh.nama_menu = detailInputNama.value.trim();

  // Simpan nilai id kategori baru dari hasil seleksi pengguna ke dalam objek menu
  dataMenuPenuh.kategori_id = detailInputKategori.value;

  dataMenuPenuh.deskripsi = detailInputDeskripsi.value;
  dataMenuPenuh.harga_jual = parseFloat(detailInputHargaJual.value) || 0;

  if (!dataMenuPenuh.varian_data) dataMenuPenuh.varian_data = {};
  dataMenuPenuh.varian_data[vKey] = {
    resep: resepBahanAktif,
    hpp_total: currentHpp // Disamakan dengan format payload simpan-menu (hpp_total)
  };

  // Validasi sebelum proses kirim
  if (!dataMenuPenuh.nama_menu) return alert('Nama menu utama wajib diisi!');
  if (!dataMenuPenuh.kategori_id) return alert('Silakan pilih kategori menu terlebih dahulu!');

  const res = await ipcRenderer.invoke('update-menu', dataMenuPenuh);
  if (res.success) {
    alert('Perubahan data detail menu termasuk kategori berhasil disimpan ke menu.json!');
    window.location.href = 'menu.html';

  } else {
    alert('Gagal memperbarui menu.');
  }
});

// ==========================================
// ACTION CRUD UTAMA: HAPUS MENU
// ==========================================
document.getElementById('btn-hapus-menu').addEventListener('click', async () => {
  const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus menu "${dataMenuPenuh.nama_menu}" secara permanen?`);
  if (konfirmasi) {
    const res = await ipcRenderer.invoke('delete-menu', menuIdAktif);
    if (res.success) {
      alert('Menu telah berhasil dihapus dari sistem.');
      window.location.href = 'menu.html'; // Mengarahkan kembali ke daftar menu utama setelah sukses menghapus
    }
  }
});
// Jalankan inisialisasi awal saat window siap
initDetail();