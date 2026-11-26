const rupiah = value => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateOnly = value => String(value || '').slice(0, 10);
const totalItems = tx => tx.porsi ?? (tx.items || []).reduce((sum, item) => sum + Number(item.quantity || item.jumlah || item.qty || 0), 0);
let transactions = [], filteredTransactions = [], currentPage = 1;
const pageSize = 7;

function renderSummary() {
  const totals = { tunai: 0, qris: 0, transfer: 0 };
  filteredTransactions.forEach(tx => {
    const method = String(tx.metode || tx.method || '').toLowerCase();
    const amount = Number(tx.total || tx.totalPembayaran || 0);
    if (method.includes('tunai') || method.includes('cash')) totals.tunai += amount;
    else if (method.includes('qris')) totals.qris += amount;
    else if (method.includes('transfer')) totals.transfer += amount;
  });
  document.getElementById('cashTotal').textContent = rupiah(totals.tunai);
  document.getElementById('qrisTotal').textContent = rupiah(totals.qris);
  document.getElementById('transferTotal').textContent = rupiah(totals.transfer);
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('todayTotal').textContent = rupiah(transactions.filter(tx => dateOnly(tx.tanggal || tx.date) === today).reduce((sum, tx) => sum + Number(tx.total || tx.totalPembayaran || 0), 0));
}
function render() {
  renderSummary();
  const start = (currentPage - 1) * pageSize;
  const rows = filteredTransactions.slice(start, start + pageSize);
  document.getElementById('transactionBody').innerHTML = rows.length ? rows.map(tx => `<tr><td>${esc(tx.id || tx.kode || '-')}</td><td>${esc(tx.tanggal || tx.date || '-')}</td><td>${esc(tx.kasir || '-')}</td><td>${esc(tx.metode || '-')}</td><td>${totalItems(tx)}</td><td>${rupiah(tx.total || tx.totalPembayaran)}</td><td><span class="status">${esc(tx.status || 'Selesai')}</span></td><td><button class="detail-btn" data-id="${encodeURIComponent(tx.id || tx.kode || '')}">Detail</button></td></tr>`).join('') : '<tr><td colspan="8">Belum ada data transaksi.</td></tr>';
  document.getElementById('pageStatus').textContent = filteredTransactions.length ? `Menampilkan ${start + 1}-${Math.min(start + pageSize, filteredTransactions.length)} dari ${filteredTransactions.length} data` : 'Tidak ada data';
  const pages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  document.getElementById('pagination').innerHTML = Array.from({ length: pages }, (_, i) => `<button class="${i + 1 === currentPage ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('');
}
function applyFilters() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const start = document.getElementById('startDate').value, end = document.getElementById('endDate').value;
  filteredTransactions = transactions.filter(tx => { const date = dateOnly(tx.tanggal || tx.date); const text = `${tx.id || tx.kode || ''} ${tx.kasir || ''}`.toLowerCase(); return (!query || text.includes(query)) && (!start || date >= start) && (!end || date <= end); });
  currentPage = 1; render();
}
async function loadTransactions() { try { const result = await window.electronAPI.getDetailTransactions(); if (!result?.success) throw new Error(result?.message || 'Data transaksi gagal dibaca.'); transactions = Array.isArray(result.data) ? result.data : []; applyFilters(); } catch (error) { document.getElementById('errorMessage').textContent = error.message; } }
document.addEventListener('click', event => { const detail = event.target.closest('.detail-btn'); if (detail) window.location.href = `detail-transaksi.html?id=${detail.dataset.id}`; const page = event.target.closest('[data-page]'); if (page) { currentPage = Number(page.dataset.page); render(); } });
document.addEventListener('DOMContentLoaded', () => { ['searchInput', 'startDate', 'endDate'].forEach(id => document.getElementById(id)?.addEventListener('input', applyFilters)); document.getElementById('dateText').textContent = new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }); loadTransactions(); });