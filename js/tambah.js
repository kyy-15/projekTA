const tambahMenuAPI = window.electronAPI;

// Penampung data master
let masterBarang = [];
let pathGambarMenu = ""; // Menyimpan path base64 / path lokal gambar menu

// Struktur Data Resep Terpisah Berdasarkan Varian Aktif
let dataResepPerVarian = {
  "dine-in": [],
  "takeaway": []
};

// Selectors Komponen Utama
const selectVarian = document.getElementById('select-varian');
const inputNamaMenu = document.getElementById('input-nama-menu');
const txtLiveTitle = document.getElementById('txt-live-title');
const inputHargaJual = document.getElementById('input-harga-jual');
const inputHpp = document.getElementById('input-hpp');
const txtMarginPercentage = document.getElementById('txt-margin-percentage');

// Placeholder Resep & Tabel
const blockPlaceholderBahan = document.getElementById('block-placeholder-bahan');
const blockTabelBahan = document.getElementById('block-tabel-bahan');
const tbodyResepTerpilih = document.getElementById('tbody-resep-terpilih');
const btnTambahBakuLagi = document.getElementById('btn-tambah-baku-lagi');

// Modal Elements
const modalBahan = document.getElementById('modal-bahan');
const btnTutupModal = document.getElementById('btn-tutup-modal');
const txtModalVarianTitle = document.getElementById('txt-modal-varian-title');
const selectBahanBaku = document.getElementById('select-bahan-baku');
const txtStokTersedia = document.getElementById('txt-stok-tersedia');
const txtSatuanBahan = document.getElementById('txt-satuan-bahan');
const inputTakaran = document.getElementById('input-takaran');
const btnTambahkanKeList = document.getElementById('btn-tambahkan-ke-list');
const listResepPreview = document.getElementById('list-resep-preview');

// Uploader Foto Elements
const btnTriggerUpload = document.getElementById('btn-trigger-upload');
const inputFoto = document.getElementById('input-foto');
const imgPreview = document.getElementById('img-preview');

// 1. Inisialisasi Ambil Data Barang
async function init() {
  masterBarang = await window.electronAPI.getBarang();
  buildDropdownBahan();
  hitungHppDanMargin();
}

function buildDropdownBahan() {
  selectBahanBaku.innerHTML = '';
  masterBarang.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.nama;
    selectBahanBaku.appendChild(opt);
  });
  syncInfoDetailBahan();
}

function syncInfoDetailBahan() {
  const idSelected = selectBahanBaku.value;
  const barang = masterBarang.find(b => b.id === idSelected);
  if (barang) {
    txtStokTersedia.textContent = `Stok: ${barang.stok} ${barang.satuan}`;
    txtSatuanBahan.textContent = barang.satuan;
  }
}
selectBahanBaku.addEventListener('change', syncInfoDetailBahan);

// 2. Fitur Sinkronisasi Judul & Live Margin Laba
inputNamaMenu.addEventListener('input', (e) => {
  txtLiveTitle.textContent = e.target.value.trim() || 'Untitled';
});

function hitungHppDanMargin() {
  const varianAktif = selectVarian.value;
  const resepAktif = dataResepPerVarian[varianAktif];
  
  // Hitung akumulasi nilai modal (HPP) berdasarkan bahan terdaftar
  let totalHpp = 0;
  resepAktif.forEach(item => { totalHpp += item.modal; });
  
  inputHpp.value = Math.round(totalHpp).toLocaleString('id-ID');
  
  // Hitung Margin Laba Persentase
  const hargaJual = parseFloat(inputHargaJual.value) || 0;
  if (hargaJual > 0) {
    const persenMargin = Math.round(((hargaJual - totalHpp) / hargaJual) * 100);
    txtMarginPercentage.textContent = `${persenMargin} %`;
  } else {
    txtMarginPercentage.textContent = `0 %`;
  }
}

inputHargaJual.addEventListener('input', hitungHppDanMargin);

// 3. Logika Perpindahan Varian Dinamis
selectVarian.addEventListener('change', () => {
  renderTabelBahanUtama();
  hitungHppDanMargin();
});

// 4. Manajemen Upload Foto Komponen
btnTriggerUpload.addEventListener('click', () => inputFoto.click());
inputFoto.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      pathGambarMenu = event.target.result; // Menyimpan data URL base64 gambar
      imgPreview.style.backgroundImage = `url('${pathGambarMenu}')`;
      imgPreview.textContent = ''; // Hapus teks jika ada
    };
    reader.readAsDataURL(file);
  }
});

// 5. Interaksi Blok & Modal Resep Bahan Baku
function bukaModalBahan() {
  const varianAktif = selectVarian.value;
  txtModalVarianTitle.textContent = varianAktif === 'dine-in' ? 'Makan di Tempat' : 'Dibawa Pulang';
  renderModalPreviewList();
  modalBahan.classList.add('show');
}

blockPlaceholderBahan.addEventListener('click', bukaModalBahan);
btnTambahBakuLagi.addEventListener('click', bukaModalBahan);
btnTutupModal.addEventListener('click', () => {
  modalBahan.classList.remove('show');
  renderTabelBahanUtama();
  hitungHppDanMargin();
});

// Aksi simpan item resep di dalam modal
btnTambahkanKeList.addEventListener('click', () => {
  const varianAktif = selectVarian.value;
  const idBahan = selectBahanBaku.value;
  const barang = masterBarang.find(b => b.id === idBahan);
  const takaran = parseFloat(inputTakaran.value) || 0;

  if (takaran <= 0) return alert('Masukkan nilai takaran bahan baku!');

  const costItem = barang.harga_satuan * takaran;
  const listResepVarian = dataResepPerVarian[varianAktif];

  const sudahAda = listResepVarian.find(i => i.id === idBahan);
  if (sudahAda) {
    sudahAda.jumlah += takaran;
    sudahAda.modal += costItem;
  } else {
    listResepVarian.push({
      id: barang.id,
      nama: barang.nama,
      jumlah: takaran,
      satuan: barang.satuan,
      modal: costItem
    });
  }
  renderModalPreviewList();
});

function renderModalPreviewList() {
  listResepPreview.innerHTML = '';
  const varianAktif = selectVarian.value;
  dataResepPerVarian[varianAktif].forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${item.nama} - ${item.jumlah} ${item.satuan} 
                    <button class="btn-delete-item" onclick="hapusBahanModal(${index})">×</button>`;
    listResepPreview.appendChild(li);
  });
}

window.hapusBahanModal = (index) => {
  const varianAktif = selectVarian.value;
  dataResepPerVarian[varianAktif].splice(index, 1);
  renderModalPreviewList();
};

// Render List Utama di Form Luar Modal
function renderTabelBahanUtama() {
  const varianAktif = selectVarian.value;
  const resepAktif = dataResepPerVarian[varianAktif];

  if (resepAktif.length === 0) {
    blockPlaceholderBahan.classList.remove('hidden');
    blockTabelBahan.classList.add('hidden');
  } else {
    blockPlaceholderBahan.classList.add('hidden');
    blockTabelBahan.classList.remove('hidden');
    
    tbodyResepTerpilih.innerHTML = '';
    resepAktif.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.nama}</strong></td>
        <td>${item.jumlah} ${item.satuan}</td>
        <td><button class="btn-delete-item" onclick="hapusBahanUtama(${index})">Hapus</button></td>
      `;
      tbodyResepTerpilih.appendChild(tr);
    });
  }
}

window.hapusBahanUtama = (index) => {
  const varianAktif = selectVarian.value;
  dataResepPerVarian[varianAktif].splice(index, 1);
  renderTabelBahanUtama();
  hitungHppDanMargin();
};

// 6. Menyimpan Data Kompilasi Melalui IPC Main
const btnSimpanMenu = document.getElementById('btn-simpan-menu');
btnSimpanMenu.addEventListener('click', async () => {
  const namaMenu = inputNamaMenu.value.trim();
  const kategori = document.getElementById('input-kategori').value;
  const deskripsi = document.getElementById('input-deskripsi').value;
  const hargaJual = parseFloat(inputHargaJual.value) || 0;

  if (!namaMenu) return alert('Nama menu tidak boleh kosong!');
  if (dataResepPerVarian["dine-in"].length === 0 && dataResepPerVarian["takeaway"].length === 0) {
    return alert('Harap masukkan bahan baku setidaknya untuk salah satu varian!');
  }

  // Kompilasi payload objek menu baru
  const payloadMenuBaru = {
    id: "MN-" + Date.now(),
    nama_menu: namaMenu,
    kategori: kategori,
    deskripsi: deskripsi,
    gambar_base64: pathGambarMenu,
    varian_data: {
      dine_in: {
        resep: dataResepPerVarian["dine-in"],
        hpp: dataResepPerVarian["dine-in"].reduce((acc, curr) => acc + curr.modal, 0)
      },
      takeaway: {
        resep: dataResepPerVarian["takeaway"],
        hpp: dataResepPerVarian["takeaway"].reduce((acc, curr) => acc + curr.modal, 0)
      }
    },
    harga_jual: hargaJual
  };

  const response = await window.electronAPI.saveMenu(payloadMenuBaru);
  if (response.success) {
    const session = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (window.electronAPI?.logActivity) {
      await window.electronAPI.logActivity(
        session.user || 'Sistem',
        session.role || 'owner',
        `Menambah menu ${namaMenu}`
      );
    }
    alert('Sukses menyimpan Menu Baru ke dalam menu.json!');
    // Bersihkan formulir kembali ke kondisi default
    window.location = "../html/menu.html";
  }
});

// Run Init
init();

const inputKategoriSelect = document.getElementById('input-kategori');

// 1. Inisialisasi Ambil Data Barang dan Kategori
async function init() {
  masterBarang = await window.electronAPI.getBarang();
  buildDropdownBahan();
  
  // Panggil fungsi inisialisasi kategori baru di sini
  await initKategori(); 
  
  hitungHppDanMargin();
}

// Fungsi Baru: Mengambil kategori dari JSON dan merender ke elemen <select>
async function initKategori() {
  if (!inputKategoriSelect) return;
  
  try {
    const semuakategori = await window.electronAPI.getCategories();
    
    // Set opsi default awal
    inputKategoriSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    
    if (semuakategori && semuakategori.length > 0) {
      semuakategori.forEach(kategori => {
        const opt = document.createElement('option');
        opt.value = kategori.id;       // Menyimpan ID kategori unik
        opt.textContent = kategori.name; // Menampilkan nama kategori teks di dropdown
        inputKategoriSelect.appendChild(opt);
      });
    }
  } catch (error) {
    console.error("Gagal memuat kategori ke dropdown tambah menu:", error);
  }
}