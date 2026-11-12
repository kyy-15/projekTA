const { app, BrowserWindow } = require('electron')
const path = require('node:path')

function createWindow () {
  // Buat jendela browser utama.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,    
      contextIsolation: false,  
      webSecurity: true         
    }
  })

  // dan muat file index.html aplikasi Anda.
  mainWindow.loadFile('index.html')

  // Buka DevTools (Opsional, untuk melihat konsol log/inspect element)
  // mainWindow.webContents.openDevTools()
}

// Metode ini akan dipanggil setelah Electron selesai melakukan inisialisasi
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Keluar ketika semua jendela ditutup, kecuali di macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
