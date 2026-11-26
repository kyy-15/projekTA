/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  getDetailTransactions: () => ipcRenderer.invoke('get-detail-transactions'),
  getActivityHistory: () => ipcRenderer.invoke('get-activity-history'),
  logActivity: (user, role, activity) => ipcRenderer.invoke('log-activity', { user, role, activity }),
  exportTransactions: (payload) => ipcRenderer.invoke('export-transactions', payload),
  getBarang: () => ipcRenderer.invoke('get-barang'),
  saveBarang: (payload) => ipcRenderer.invoke('save-barang', payload),
  getAllMenu: () => ipcRenderer.invoke('get-all-menu'),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  addCategory: (name) => ipcRenderer.invoke('add-category', name),
  saveMenu: (payload) => ipcRenderer.invoke('save-menu', payload),
  updateMenu: (payload) => ipcRenderer.invoke('update-menu', payload),
  deleteMenu: (menuId) => ipcRenderer.invoke('delete-menu', menuId),
  saveTransaksi: (payload) => ipcRenderer.invoke('save-transaksi', payload)
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})


