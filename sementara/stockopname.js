let activeTab = 'jenis';

const jenisItems = [
    { id: 1, name: "Pisang Ijo", currentQty: "1 Kg", minQty: "1 Kg" },
    { id: 2, name: "Susu", currentQty: "1 L", minQty: "1 L" },
    { id: 3, name: "Santan", currentQty: "10 L", minQty: "10 L" },
    { id: 4, name: "Tepung Beras", currentQty: "1 kG", minQty: "1 Kg" },
    { id: 5, name: "Cup", currentQty: "14 Pcs", minQty: "14 Pcs" },
    { id: 6, name: "Sendok", currentQty: "20 Pcs", minQty: "20 Pcs" }
];

const supplierItems = [
    { id: 101, name: "PT Sukses Bananas", currentQty: "500 Kg", minQty: "100 Kg" },
    { id: 102, name: "CV Susu Murni Jaya", currentQty: "200 L", minQty: "50 L" },
    { id: 103, name: "Toko Kemasan Utama", currentQty: "1000 Pcs", minQty: "200 Pcs" }
];

let selectedItemId = null;

// Teks yang berubah sesuai tab
function getNamaLabel() {
    return activeTab === 'jenis' ? 'Nama Barang' : 'Nama Pemasuk';
}

function updateLabels() {
    document.getElementById("thNama").innerText = getNamaLabel();
    document.getElementById("labelNama").innerText = getNamaLabel();
}

function renderTable(filterQuery = "") {
    const tbody = document.getElementById("inventoryTableBody");
    tbody.innerHTML = "";

    const currentData = activeTab === 'jenis' ? jenisItems : supplierItems;

    const filtered = currentData.filter(item =>
        item.name.toLowerCase().includes(filterQuery.toLowerCase())
    );

    if (filtered.length === 0) {
        const emptyText = activeTab === 'jenis'
            ? 'Tidak ada data barang tersedia'
            : 'Tidak ada data pemasuk tersedia';

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-10 font-poppins text-slate-400 font-medium text-lg">
                    ${emptyText}
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(item => {
        const tr = document.createElement("tr");
        tr.className = "table-row-divider hover:bg-slate-50/80 transition-colors";
        tr.innerHTML = `
            <td class="py-5 pr-6 text-black align-middle">${escapeHtml(item.name)}</td>
            <td class="py-5 px-6 text-black align-middle">${escapeHtml(item.currentQty)}</td>
            <td class="py-5 px-6 text-black align-middle">${escapeHtml(item.minQty)}</td>
            <td class="py-5 pl-6 text-center align-middle">
                <button onclick="toggleActionPopover(event, ${item.id})" class="aksi-pill-btn inline-flex items-center justify-between gap-3 px-5 py-2 rounded-[10px] font-poppins font-medium text-[24px] leading-tight w-[157px] shadow-sm">
                    <svg class="w-6 h-6 text-[#1DDB5C]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    <span>Aksi</span>
                    <svg class="w-5 h-5 text-[#1DDB5C]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function switchTab(tab) {
    activeTab = tab;
    const jenisBtn = document.getElementById("tab-jenis");
    const supplierBtn = document.getElementById("tab-supplier");

    if (tab === 'jenis') {
        jenisBtn.classList.add("active");
        supplierBtn.classList.remove("active");
    } else {
        supplierBtn.classList.add("active");
        jenisBtn.classList.remove("active");
    }

    updateLabels();
    renderTable();
}

function filterTable() {
    const query = document.getElementById("searchInput").value;
    renderTable(query);
}

let activePopoverId = null;
function toggleActionPopover(event, itemId) {
    event.stopPropagation();
    const popover = document.getElementById("actionPopover");

    if (activePopoverId === itemId && !popover.classList.contains("hidden")) {
        popover.classList.add("hidden");
        activePopoverId = null;
        return;
    }

    selectedItemId = itemId;
    activePopoverId = itemId;

    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
    popover.style.left = `${rect.left + window.scrollX}px`;
    popover.classList.remove("hidden");
}

document.addEventListener("click", () => {
    const popover = document.getElementById("actionPopover");
    if (popover) popover.classList.add("hidden");
    activePopoverId = null;
});

function handleFormSubmit(e) {
    saveItem(e);
}

function triggerEdit() {
    const currentData = activeTab === 'jenis' ? jenisItems : supplierItems;
    const item = currentData.find(i => i.id === selectedItemId);
    if (!item) return;

    document.getElementById("modalTitle").innerText =
        activeTab === 'jenis' ? "Edit Stok Barang" : "Edit Stok Pemasuk";
    document.getElementById("labelNama").innerText = getNamaLabel();
    document.getElementById("editingItemId").value = item.id;
    document.getElementById("itemName").value = item.name;

    const qtyParts = item.currentQty.split(" ");
    const minParts = item.minQty.split(" ");

    document.getElementById("itemQty").value = parseFloat(qtyParts[0]) || 1;
    document.getElementById("itemMinQty").value = parseFloat(minParts[0]) || 1;
    document.getElementById("itemUnit").value = qtyParts[1] || "Kg";

    document.getElementById("itemModal").classList.remove("hidden");
}

function triggerRestock() {
    const currentData = activeTab === 'jenis' ? jenisItems : supplierItems;
    const item = currentData.find(i => i.id === selectedItemId);
    if (!item) return;

    const qtyParts = item.currentQty.split(" ");
    let currentVal = parseFloat(qtyParts[0]) || 0;
    const unit = qtyParts[1] || "";

    currentVal += 5;
    item.currentQty = `${currentVal} ${unit}`;

    renderTable();
    showToast(`Stok "${item.name}" berhasil ditambah (+5 ${unit})`);
}

function triggerDelete() {
    const currentData = activeTab === 'jenis' ? jenisItems : supplierItems;
    const index = currentData.findIndex(i => i.id === selectedItemId);

    if (index !== -1) {
        const deletedName = currentData[index].name;
        currentData.splice(index, 1);
        renderTable();
        showToast(`"${deletedName}" telah dihapus`);
    }
}

function openAddModal() {
    document.getElementById("modalTitle").innerText =
        activeTab === 'jenis' ? "Tambah Stok Barang" : "Tambah Stok Pemasuk";
    document.getElementById("labelNama").innerText = getNamaLabel();
    document.getElementById("editingItemId").value = "";
    document.getElementById("itemForm").reset();
    document.getElementById("itemModal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("itemModal").classList.add("hidden");
}

function saveItem(e) {
    e.preventDefault();
    const editId = document.getElementById("editingItemId").value;
    const name = document.getElementById("itemName").value.trim();
    const qty = document.getElementById("itemQty").value;
    const minQty = document.getElementById("itemMinQty").value;
    const unit = document.getElementById("itemUnit").value;

    const qtyStr = `${qty} ${unit}`;
    const minQtyStr = `${minQty} ${unit}`;

    const currentData = activeTab === 'jenis' ? jenisItems : supplierItems;

    if (editId) {
        const item = currentData.find(i => i.id == editId);
        if (item) {
            item.name = name;
            item.currentQty = qtyStr;
            item.minQty = minQtyStr;
            showToast(`"${name}" telah diperbarui`);
        }
    } else {
        currentData.push({
            id: Date.now(),
            name: name,
            currentQty: qtyStr,
            minQty: minQtyStr
        });
        showToast(`"${name}" berhasil ditambahkan`);
    }

    closeModal();
    renderTable();
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");

    sidebar.classList.toggle("-translate-x-full");
    backdrop.classList.toggle("hidden");
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toast-text").innerText = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 3000);
}

function handleLogout() {
    showToast("Anda telah keluar dari sistem.");
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

window.onload = function () {
    updateLabels();
    renderTable();
};