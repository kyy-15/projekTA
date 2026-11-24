const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('fs')
const fsPromises = require('node:fs/promises')

function createWindow() {
  // Buat jendela browser utama.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
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

const activityLogPath = path.join(__dirname, 'data', 'riwayat-aktivitas.json');
let activityLogQueue = Promise.resolve();

function queueActivityLog(task) {
  const result = activityLogQueue.then(task, task);
  activityLogQueue = result.catch(() => undefined);
  return result;
}

async function appendActivityLog(user, role, activity) {
  const safeUser = typeof user === 'string' && user.trim() ? user.trim() : 'Sistem';
  const safeRole = role === 'kasir' ? 'kasir' : role === 'owner' ? 'owner' : 'sistem';
  const safeActivity = typeof activity === 'string' && activity.trim() ? activity.trim() : 'Aktivitas sistem';
  await fsPromises.mkdir(path.dirname(activityLogPath), { recursive: true });
  let logs = [];
  try {
    const content = await fsPromises.readFile(activityLogPath, 'utf8');
    if (content.trim()) {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) logs = parsed;
    }
  } catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
  }
  const now = new Date();
  logs.push({
    no: logs.reduce((max, item) => Math.max(max, Number(item.no || item.No) || 0), 0) + 1,
    tanggal: now.toISOString().slice(0, 10),
    waktu: now.toTimeString().slice(0, 5),
    pengguna: safeUser,
    jabatan: safeRole,
    aktivitas: safeActivity
  });
  await fsPromises.writeFile(activityLogPath, JSON.stringify(logs, null, 2), 'utf8');
  return logs[logs.length - 1];
}

ipcMain.handle('log-activity', async (event, payload) => {
  try {
    const log = await queueActivityLog(() => appendActivityLog(payload?.user, payload?.role, payload?.activity));
    return { success: true, data: log };
  } catch (error) {
    console.error('Gagal menyimpan log aktivitas:', error);
    return { success: false, message: 'Log aktivitas gagal disimpan.' };
  }
});

function readKategoriData() {
  const filePath = path.join(__dirname, 'data', 'kategori.json');
  ensureFileExists(filePath);
  const data = fs.readFileSync(filePath, 'utf-8');
  return data ? JSON.parse(data) : [];
}

// IPC untuk mengambil riwayat aktivitas dengan validasi JSON.
ipcMain.handle('get-activity-history', async () => {
  try {
    const filePath = path.join(__dirname, 'data', 'riwayat-aktivitas.json');
    const content = await fsPromises.readFile(filePath, 'utf8');
    if (!content.trim()) return { success: true, data: [] };
    const data = JSON.parse(content);
    if (!Array.isArray(data)) return { success: false, message: 'Format riwayat aktivitas tidak valid.' };
    return { success: true, data };
  } catch (error) {
    console.error('Gagal membaca riwayat aktivitas:', error);
    return { success: false, message: error.code === 'ENOENT' ? 'File riwayat aktivitas tidak ditemukan.' : 'Data riwayat aktivitas rusak atau gagal dibaca.' };
  }
});

// IPC untuk mengambil data transaksi dari proses utama.
ipcMain.handle('get-detail-transactions', async () => {
  try {
    const filePath = path.join(__dirname, 'data', 'detail-transaksi.json');
    const content = await fsPromises.readFile(filePath, 'utf8');
    if (!content.trim()) return { success: true, data: [] };
    const data = JSON.parse(content);
    if (!Array.isArray(data)) return { success: false, message: 'Format data transaksi tidak valid.' };
    return { success: true, data };
  } catch (error) {
    console.error('Gagal membaca detail-transaksi.json:', error);
    return { success: false, message: error.code === 'ENOENT' ? 'File data transaksi tidak ditemukan.' : 'Data transaksi rusak atau gagal dibaca.' };
  }
});

ipcMain.handle('export-transactions', async (event, payload) => {
  try {
    const { dialog } = require('electron');
    const records = Array.isArray(payload?.records) ? payload.records : [];
    const format = payload?.format;
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const selected = await dialog.showSaveDialog({
      title: `Unduh laporan transaksi ${extension.toUpperCase()}`,
      defaultPath: path.join(app.getPath('documents'), `laporan-transaksi.${extension}`),
      filters: [{ name: extension === 'pdf' ? 'PDF' : 'Excel', extensions: [extension] }]
    });
    if (selected.canceled || !selected.filePath) return { success: false, canceled: true };

    const { app: electronApp } = require('electron');
    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Laporan Transaksi');
      const green = 'FF2ECC71';
      sheet.mergeCells('A1:K1'); sheet.getCell('A1').value = 'LAPORAN TRANSAKSI';
      sheet.mergeCells('A2:K2'); sheet.getCell('A2').value = 'Es Pisang Ijo Oma';
      sheet.mergeCells('A3:K3'); sheet.getCell('A3').value = `Periode: ${payload.period || 'Semua tanggal'}`;
      sheet.getCell('A1').font = { bold: true, size: 16 }; sheet.getCell('A1').alignment = { horizontal: 'center' };
      let row = 5;
      const heading = title => { sheet.mergeCells(row, 1, row, 3); sheet.getCell(row, 1).value = title; sheet.getCell(row, 1).font = { bold: true }; row++; };
      const styleHeader = cells => cells.forEach(cell => { cell.font = { bold: true, color: 'FFFFFFFF' }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: green } }; cell.border = { bottom: { style: 'thin', color: { argb: 'FF777777' } } }; });
      heading('RINGKASAN TRANSAKSI'); const summary = [['Jumlah Transaksi', records.length], ['Total Porsi', records.reduce((s, r) => s + Number(r.porsi || 0), 0)], ['Total Pendapatan', records.reduce((s, r) => s + Number(r.total || 0), 0)]]; summary.forEach(item => { sheet.addRow(item); row++; }); row++;
      heading('RINCIAN METODE PEMBAYARAN'); const methods = ['Tunai', 'QRIS', 'Transfer']; const methodHeader = sheet.addRow(['Metode', 'Jumlah Transaksi', 'Total Pendapatan']); styleHeader(methodHeader.eachCell()); row++; methods.forEach(method => { const selectedRows = records.filter(r => String(r.metode).toLowerCase() === method.toLowerCase()); sheet.addRow([method, selectedRows.length, selectedRows.reduce((s, r) => s + Number(r.total || 0), 0)]); row++; }); row++;
      heading('DAFTAR TRANSAKSI'); const tableHeader = sheet.addRow(['No', 'Kode Transaksi', 'Hari', 'Tanggal', 'Waktu', 'Kasir', 'Nama Menu', 'Porsi', 'Total', 'Metode', 'Status']); styleHeader(tableHeader.eachCell()); row++; records.forEach((r, index) => { sheet.addRow([index + 1, r.id || r.kode, r.hari || '', r.tanggal || '', r.waktu || '', r.kasir || '', (r.items || []).map(i => i.nama).join(', '), r.porsi || 0, Number(r.total || 0), r.metode || '', r.status || 'Selesai']); row++; }); sheet.columns.forEach(column => { column.width = 18; }); await workbook.xlsx.writeFile(selected.filePath);
    } else {
      const { BrowserWindow } = require('electron'); const pdfWindow = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
      const html = `<!doctype html><html><head><style>body{font-family:Arial;padding:30px}h1,h2{text-align:center;color:#198754}table{width:100%;border-collapse:collapse;margin:18px 0}th{background:#2ecc71;color:white}th,td{border:1px solid #999;padding:7px;text-align:left}h3{background:#2ecc71;color:white;padding:8px}</style></head><body><h1>LAPORAN TRANSAKSI</h1><h2>Es Pisang Ijo Oma</h2><p style="text-align:center">Periode: ${payload.period || 'Semua tanggal'}</p><h3>RINGKASAN TRANSAKSI</h3><table><tr><th>Jumlah Transaksi</th><th>Total Porsi</th><th>Total Pendapatan</th></tr><tr><td>${records.length}</td><td>${records.reduce((s,r)=>s+Number(r.porsi||0),0)}</td><td>Rp ${records.reduce((s,r)=>s+Number(r.total||0),0).toLocaleString('id-ID')}</td></tr></table><h3>DAFTAR TRANSAKSI</h3><table><tr><th>No</th><th>Kode</th><th>Hari</th><th>Tanggal</th><th>Waktu</th><th>Kasir</th><th>Menu</th><th>Porsi</th><th>Total</th><th>Metode</th><th>Status</th></tr>${records.map((r,i)=>`<tr><td>${i+1}</td><td>${r.id||r.kode}</td><td>${r.hari||''}</td><td>${r.tanggal||''}</td><td>${r.waktu||''}</td><td>${r.kasir||''}</td><td>${(r.items||[]).map(x=>x.nama).join(', ')}</td><td>${r.porsi||0}</td><td>Rp ${Number(r.total||0).toLocaleString('id-ID')}</td><td>${r.metode||''}</td><td>${r.status||'Selesai'}</td></tr>`).join('')}</table></body></html>`;
      await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`); const pdf = await pdfWindow.webContents.printToPDF({ printBackground: true, marginsType: 0 }); await fsPromises.writeFile(selected.filePath, pdf); pdfWindow.close();
    }
    return { success: true, filePath: selected.filePath };
  } catch (error) { console.error('Gagal mengekspor laporan:', error); return { success: false, message: 'Gagal membuat file laporan.' }; }
});

// IPC login: Owner divalidasi di kode, akun kasir dibaca dari users.json.
ipcMain.handle('login', async (event, credentials) => {
  const username = typeof credentials?.username === 'string' ? credentials.username.trim() : '';
  const password = typeof credentials?.password === 'string' ? credentials.password : '';

  if (username === 'oma' && password === 'admin123') {
    return { success: true, username, role: 'owner', redirect: 'html/beranda.html' };
  }

  try {
    const usersPath = path.join(__dirname, 'data', 'users.json');
    const content = await fsPromises.readFile(usersPath, 'utf8');
    if (!content.trim()) {
      return { success: false, message: 'Data pengguna kosong atau belum tersedia.' };
    }

    const users = JSON.parse(content);
    if (!Array.isArray(users)) {
      return { success: false, message: 'Format users.json tidak valid.' };
    }

    const user = users.find((item) => item && item.username === username && item.password === password);
    if (user?.role === 'kasir') {
      return { success: true, username, role: 'kasir', redirect: 'html/beranda-kasir.html' };
    }
    return { success: false, message: 'Username atau kata sandi salah.' };
  } catch (error) {
    console.error('Gagal membaca users.json:', error);
    if (error.code === 'ENOENT') {
      return { success: false, message: 'Data pengguna belum tersedia.' };
    }
    if (error instanceof SyntaxError) {
      return { success: false, message: 'Data pengguna rusak atau bukan JSON yang valid.' };
    }
    return { success: false, message: 'Terjadi kesalahan saat memproses login.' };
  }
});

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


