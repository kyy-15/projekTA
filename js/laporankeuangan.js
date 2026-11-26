/* ===== DATA ===== */
const rupiah = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');
const shortRp = n => n >= 1000000 ? (n / 1000000).toString().replace('.', ',') + 'jt' : n / 1000 + 'rb';

const periods = {
  harian: {
    saldoAwal: 800000, income: 950000, expense: 320000,
    labels: ['Kam', 'Jum', 'Sab', 'Min', 'Sen', 'Sel', 'Rab'],
    inc: [380000, 0, 850000, 860000, 380000, 460000, 520000],
    exp: [100000, 0, 190000, 220000, 110000, 100000, 170000],
    cats: { 'Bahan Baku': 265600, 'Kemasan': 51200, 'Lain-lain': 3200 }
  },
  mingguan: {
    saldoAwal: 2100000, income: 5400000, expense: 1850000,
    labels: ['Mg 1', 'Mg 2', 'Mg 3', 'Mg 4'],
    inc: [4200000, 5100000, 4800000, 5400000],
    exp: [1500000, 1700000, 1650000, 1850000],
    cats: { 'Bahan Baku': 1480000, 'Kemasan': 296000, 'Lain-lain': 74000 }
  },
  bulanan: {
    saldoAwal: 8500000, income: 21500000, expense: 7200000,
    labels: ['Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov'],
    inc: [17000000, 18500000, 19800000, 20200000, 20900000, 21500000],
    exp: [6000000, 6400000, 6700000, 6900000, 7000000, 7200000],
    cats: { 'Bahan Baku': 5760000, 'Kemasan': 1152000, 'Lain-lain': 288000 }
  }
};

let transactions = [
  { date: '18 Nov 2026', time: '14:30', desc: 'Penjualan Es Pisang Ijo (5 pcs)', cat: 'Penjualan', amount: 150000, type: 'in' },
  { date: '18 Nov 2026', time: '12:15', desc: 'Beli Pisang Raja', cat: 'Bahan Baku', amount: 120000, type: 'out' },
  { date: '17 Nov 2026', time: '16:40', desc: 'Beli Cup 100 pcs', cat: 'Kemasan', amount: 50000, type: 'out' },
  { date: '17 Nov 2026', time: '15:10', desc: 'Penjualan Es Pisang Ijo (8 pcs)', cat: 'Penjualan', amount: 240000, type: 'in' }
];

const catColors = ['#1f9d47', '#2fbf5b', '#7dd89a'];
const catOptions = {
  in: ['Penjualan', 'Lain-lain'],
  out: ['Bahan Baku', 'Kemasan', 'Lain-lain']
};

let currentPeriod = 'harian';
let currentFilter = 'all';

/* ===== HELPERS ===== */
const $ = id => document.getElementById(id);

function niceMax(max) {
  if (max <= 0) return 1000000;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const steps = [1, 2, 2.5, 4, 5, 8, 10];
  for (const s of steps) if (max <= s * pow) return s * pow;
  return 10 * pow;
}

/* ===== RENDER ===== */
function renderSummary() {
  const p = periods[currentPeriod];
  const profit = p.income - p.expense;
  const margin = p.income ? Math.round(profit / p.income * 100) : 0;
  $('saldo').textContent = rupiah(p.saldoAwal + profit);
  $('saldoAwal').textContent = 'Saldo awal periode ' + rupiah(p.saldoAwal);
  $('income').textContent = rupiah(p.income);
  $('expense').textContent = rupiah(p.expense);
  $('profit').textContent = rupiah(profit);
  $('margin').textContent = margin + '%';
}

function renderChart() {
  const p = periods[currentPeriod];
  const top = niceMax(Math.max(...p.inc, ...p.exp));
  const ticks = [top, top * 0.75, top * 0.5, top * 0.25, 0];
  $('yAxis').innerHTML = ticks.map(t => `<span>${t === 0 ? '0' : shortRp(t)}</span>`).join('');

  $('plot').innerHTML = p.labels.map((l, i) => `
    <div class="group">
      <div class="bars">
        <div class="bar in"  style="height:0" data-h="${p.inc[i] / top * 100}" data-tip="${rupiah(p.inc[i])}"></div>
        <div class="bar out" style="height:0" data-h="${p.exp[i] / top * 100}" data-tip="${rupiah(p.exp[i])}"></div>
      </div>
      <div class="xlabel">${l}</div>
    </div>`).join('');

  // animasi tumbuh
  requestAnimationFrame(() => {
    document.querySelectorAll('.bar').forEach(b => b.style.height = b.dataset.h + '%');
  });
}

function renderDonut() {
  const p = periods[currentPeriod];
  const entries = Object.entries(p.cats);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let acc = 0;
  const stops = entries.map(([, v], i) => {
    const start = acc;
    acc += total ? v / total * 100 : 0;
    return `${catColors[i]} ${start}% ${acc}%`;
  });
  $('donut').style.background = `conic-gradient(${stops.join(',')})`;
  $('donutTotal').textContent = total.toLocaleString('id-ID');
  $('catList').innerHTML = entries.map(([name, v], i) => `
    <li>
      <i class="dot" style="background:${catColors[i]}"></i>
      <span class="name">${name}</span>
      <span class="pct">${total ? Math.round(v / total * 100) : 0}%</span>
    </li>`).join('');
}

function renderTable() {
  const rows = transactions.filter(t => currentFilter === 'all' || t.type === currentFilter);
  $('txBody').innerHTML = rows.length ? rows.map(t => `
    <tr>
      <td>${t.date} &nbsp;${t.time}</td>
      <td>${t.desc}</td>
      <td>${t.cat}</td>
      <td class="${t.type === 'in' ? 'amt-in' : 'amt-out'}">${t.type === 'in' ? '+' : '-'}${rupiah(t.amount)}</td>
      <td class="c"><span class="type-ico ${t.type}">${t.type === 'in' ? '↑' : '↓'}</span></td>
    </tr>`).join('')
    : '<tr><td colspan="5" class="empty">Belum ada transaksi</td></tr>';
}

function renderAll() {
  renderSummary(); renderChart(); renderDonut(); renderTable();
}

/* ===== EVENTS ===== */
// Tab periode
$('tabs').addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  currentPeriod = btn.dataset.period;
  renderSummary(); renderChart(); renderDonut();
});

// Filter transaksi
$('chips').addEventListener('click', e => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderTable();
});

// Menu sidebar
document.querySelector('.nav')?.addEventListener('click', e => {
  const a = e.target.closest('.nav a');
  if (!a) return;
  e.preventDefault();
  document.querySelectorAll('.nav a').forEach(m => m.classList.remove('active'));
  a.classList.add('active');
});

// Logout
$('logoutBtn')?.addEventListener('click', () => {
  if (confirm('Yakin ingin keluar?')) alert('Anda telah log out.');
});

// Export CSV
$('btnExport').addEventListener('click', () => {
  const header = ['Tanggal', 'Jam', 'Keterangan', 'Kategori', 'Jumlah', 'Jenis'];
  const lines = transactions.map(t =>
    [t.date, t.time, `"${t.desc.replace(/"/g, '""')}"`, t.cat,
     (t.type === 'in' ? '' : '-') + t.amount, t.type === 'in' ? 'Pemasukan' : 'Pengeluaran'].join(','));
  const csv = '\uFEFF' + [header.join(','), ...lines].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan-keuangan-${currentPeriod}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ===== MODAL CATAT TRANSAKSI ===== */
const modal = $('modal');
function fillCats() {
  $('fCat').innerHTML = catOptions[$('fType').value].map(c => `<option>${c}</option>`).join('');
}
fillCats();
$('fType').addEventListener('change', fillCats);
$('btnAdd').addEventListener('click', () => modal.classList.add('open'));
$('btnCancel').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

$('txForm').addEventListener('submit', e => {
  e.preventDefault();
  const type = $('fType').value;
  const amount = parseInt($('fAmount').value, 10);
  const cat = $('fCat').value;
  const now = new Date();
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

  transactions.unshift({
    date: `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`,
    time: now.toTimeString().slice(0, 5),
    desc: $('fDesc').value.trim(),
    cat, amount, type
  });

  // perbarui data periode aktif
  const p = periods[currentPeriod];
  const last = p.labels.length - 1;
  if (type === 'in') { p.income += amount; p.inc[last] += amount; }
  else {
    p.expense += amount; p.exp[last] += amount;
    if (p.cats[cat] !== undefined) p.cats[cat] += amount;
  }

  e.target.reset(); fillCats();
  modal.classList.remove('open');
  renderAll();
});

/* ===== TANGGAL OTOMATIS ===== */
(function setDate() {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const d = new Date();
  $('dateText').textContent = `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
})();

renderAll();