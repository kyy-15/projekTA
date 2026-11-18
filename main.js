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
  mainWindow.loadFile('index.html')
}

function readKategoriData() {
  const filePath = path.join(__dirname, 'data', 'kategori.json');
  
  // Pastikan folder 'data' sudah dibuat
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Jika file kategori.json belum ada, buat file baru dengan array kosong
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return data ? JSON.parse(data) : [];
}

// IPC: Mengambil data barang untuk dropdown/resep
ipcMain.handle('get-barang', async () => {
  const filePath = path.join(__dirname, 'data', 'barang.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
});

// IPC: Menyimpan Menu Baru ke menu.json
ipcMain.handle('save-menu', async (event, menuBaru) => {
  const filePath = path.join(__dirname, 'data/menu.json');
  let dataMenu = [];

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    dataMenu = fileContent ? JSON.parse(fileContent) : [];
  }

  dataMenu.push(menuBaru);
  fs.writeFileSync(filePath, JSON.stringify(dataMenu, null, 2), 'utf-8');
  return { success: true };
});

// Tambahkan handler ini di bagian bawah file main.js Anda yang sudah ada

// IPC: Mengambil semua daftar menu untuk dicari berdasarkan ID
ipcMain.handle('get-all-menu', async () => {
  const filePath = path.join(__dirname, 'data/menu.json');
  if (!fs.existsSync(filePath)) return [];
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
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
});

// Handler IPC untuk menambah kategori baru
ipcMain.handle('add-category', (event, newCategoryName) => {
  const filePath = path.join(__dirname, 'data', 'kategori.json');
  
  // Memanggil fungsi pembaca yang sudah kita buat di atas
  const categories = readKategoriData();

  const newCategory = {
    id: Date.now(), 
    name: newCategoryName
  };

  categories.push(newCategory);

  fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf-8');
  return categories;
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