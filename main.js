const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs')

function createWindow() {
  // Buat jendela browser utama.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })
  // PERBAIKAN: Sesuaikan jalur muat karena file html berada di dalam folder html/
  mainWindow.loadFile(path.join(__dirname, 'index.html'))
}

// Fungsi pembantu untuk memastikan folder data dan file json dasar ada
function ensureFileExists(filePath, defaultContent = []) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
  }
}

function readKategoriData() {
  const filePath = path.join(__dirname, 'data', 'kategori.json');
  ensureFileExists(filePath);
  const data = fs.readFileSync(filePath, 'utf-8');
  return data ? JSON.parse(data) : [];
}

// IPC: Mengambil data barang untuk dropdown/resep
ipcMain.handle('get-barang', async () => {
  const filePath = path.join(__dirname, 'data', 'barang.json');
  // PERBAIKAN: Pastikan file dibuat otomatis jika belum ada agar tidak melempar error crash
  ensureFileExists(filePath);
  const data = fs.readFileSync(filePath, 'utf-8');
  return data ? JSON.parse(data) : [];
});

ipcMain.handle('save-barang', async (event, barangInput) => {
  const filePath = path.join(__dirname, 'data', 'barang.json');
  ensureFileExists(filePath);

  let dataBarang = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (barangInput.id) {
    // Mode EDIT: cari index berdasarkan ID string atau number
    const index = dataBarang.findIndex(b => b.id.toString() === barangInput.id.toString());
    if (index !== -1) {
      // PERBAIKAN DATA: Petakan nama properti json agar konsisten dengan contoh data awal Anda
      dataBarang[index] = { 
        id: barangInput.id.toString(),
        nama: barangInput.nama,
        satuan: barangInput.satuan,
        stok: barangInput.stok_fisik, // fallback ke key data "stok" resep lama Anda
        stok_fisik: barangInput.stok_fisik,
        stok_sistem: barangInput.stok_sistem,
        harga_satuan: parseFloat(barangInput.harga_beli.toString().replace(/[^0-9.-]/g, '')) || 0,
        harga_beli: barangInput.harga_beli,
        minimal_stok: barangInput.minimal_stok,
        keterangan: barangInput.keterangan,
        kategori: barangInput.kategori,
        kode: barangInput.kode
      };
    } else {
      return { success: false, message: "Barang tidak ditemukan" };
    }
  } else {
    // Mode TAMBAH BARU: Buat ID unik otomatis
    const newId = (dataBarang.length > 0 ? Math.max(...dataBarang.map(b => parseInt(b.id) || 0)) + 1 : 1).toString();
    dataBarang.push({
      id: newId,
      nama: barangInput.nama,
      satuan: barangInput.satuan,
      stok: barangInput.stok_fisik,
      stok_fisik: barangInput.stok_fisik,
      stok_sistem: barangInput.stok_sistem,
      harga_satuan: parseFloat(barangInput.harga_beli.toString().replace(/[^0-9.-]/g, '')) || 0,
      harga_beli: barangInput.harga_beli,
      minimal_stok: barangInput.minimal_stok,
      keterangan: barangInput.keterangan,
      kategori: barangInput.kategori,
      kode: barangInput.kode
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(dataBarang, null, 2), 'utf-8');
  return { success: true, data: dataBarang };
});

// IPC: Mengambil semua daftar menu untuk dicari berdasarkan ID
ipcMain.handle('get-all-menu', async () => {
  const filePath = path.join(__dirname, 'data/menu.json');
  ensureFileExists(filePath);
  const data = fs.readFileSync(filePath, 'utf-8');
  return data ? JSON.parse(data) : [];
});

// IPC: Memperbarui/Mengedit Menu yang Sudah Ada
ipcMain.handle('update-menu', async (event, menuUpdated) => {
  const filePath = path.join(__dirname, 'data/menu.json');
  if (!fs.existsSync(filePath)) return { success: false };

  let dataMenu = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const index = dataMenu.findIndex(m => m.id === menuUpdated.id);

  if (index !== -1) {
    dataMenu[index] = menuUpdated;
    fs.writeFileSync(filePath, JSON.stringify(dataMenu, null, 2), 'utf-8');
    return { success: true };
  }
  return { success: false };
});

// IPC: Menghapus Menu dari menu.json
ipcMain.handle('delete-menu', async (event, menuId) => {
  const filePath = path.join(__dirname, 'data/menu.json');
  if (!fs.existsSync(filePath)) return { success: false };

  let dataMenu = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  dataMenu = dataMenu.filter(m => m.id !== menuId);

  fs.writeFileSync(filePath, JSON.stringify(dataMenu, null, 2), 'utf-8');
  return { success: true };
});

ipcMain.handle('get-categories', () => {
  const filePath = path.join(__dirname, 'data', 'kategori.json');
  ensureFileExists(filePath);
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
});

// Handler IPC untuk menambah kategori baru
ipcMain.handle('add-category', (event, newCategoryName) => {
  const filePath = path.join(__dirname, 'data', 'kategori.json');
  const categories = readKategoriData();

  const newCategory = {
    id: Date.now(), 
    name: newCategoryName
  };

  categories.push(newCategory);
  fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf-8');
  return categories;
});

ipcMain.handle('save-transaksi', async (event, transaksiBaru) => {
  const filePath = path.join(__dirname, 'data', 'transaksi.json');
  
  // Pastikan folder data dan file transaksi.json tersedia
  ensureFileExists(filePath);

  try {
    // Baca data transaksi lama
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let dataTransaksi = fileContent ? JSON.parse(fileContent) : [];

    // Tambahkan data transaksi baru ke dalam array
    dataTransaksi.push(transaksiBaru);

    // Tulis kembali ke file transaksi.json
    fs.writeFileSync(filePath, JSON.stringify(dataTransaksi, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan transaksi:", error);
    return { success: false, message: error.message };
  }
});


app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})


