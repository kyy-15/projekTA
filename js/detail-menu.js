const recipes = {
    'dine-in': [
        { name: 'Pisang Ijo', qty: '1 buah', cost: 100 },
        { name: 'Es Batu', qty: '1 balok', cost: 300 },
        { name: 'Hijau hijau', qty: '0,5 gram', cost: 700 },
        { name: 'Mutiara', qty: '1,7 gram', cost: 200 },
        { name: 'Cup', qty: '1 pcs', cost: 500 }
    ],
    'takeaway': [
        { name: 'Pisang Ijo', qty: '1 buah', cost: 100 },
        { name: 'Es Batu', qty: '1 balok', cost: 300 },
        { name: 'Hijau hijau', qty: '0,5 gram', cost: 700 },
        { name: 'Mutiara', qty: '1,7 gram', cost: 200 },
        { name: 'Cup Box Premium', qty: '1 pcs', cost: 1200 },
        { name: 'Kantong Plastik', qty: '1 pcs', cost: 200 }
    ]
};

window.onload = function () {
    handleVariantChange();
};

function handleVariantChange() {
    const selectedVariant = document.getElementById('variantSelect').value;
    const container = document.getElementById('ingredients-container');
    container.innerHTML = '';
    let totalHPP = 0;

    recipes[selectedVariant].forEach(item => {
        totalHPP += item.cost;
        container.innerHTML += `<div class="table-row"> <div>${item.name}</div> <div>${item.qty}</div> <div>Rp ${item.cost.toLocaleString('id-ID')}</div> <button class="btn-delete-row">&times;</button> </div>`;
    });

    const baseOverhead = selectedVariant === 'dine-in' ? 7100 : 7500;
    const finalHPP = totalHPP + baseOverhead;
    document.getElementById('inputHPP').value = "Rp " + finalHPP.toLocaleString('id-ID');
    document.getElementById('inputHPP').dataset.rawCost = finalHPP;
    calculateMargin();
}

function calculateMargin() {
    const hppRaw = parseFloat(document.getElementById('inputHPP').dataset.rawCost) || 0;
    const hargaJual = parseFloat(document.getElementById('inputHargaJual').value) || 0;
    const marginLabel = document.getElementById('marginLabel');
    if (hargaJual > 0) {
        const profit = hargaJual - hppRaw;
        const marginPercentage = Math.round((profit / hargaJual) * 100);
        marginLabel.innerText = marginPercentage + " %";
    } else {
        marginLabel.innerText = "0 %";
    }
}
function navigateToMenu() {
    window.location.href = "../html/menu.html";
}
function openModal() {
    document.getElementById('addBahanModal').style.display = 'flex';
}
function closeModal() {
    document.getElementById('addBahanModal').style.display = 'none';
}
window.onclick = function (event) {
    const modal = document.getElementById('addBahanModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

document.getElementById('balik').addEventListener('click', () => {
    navigateToMenu();
});

document.getElementById('variantSelect').addEventListener('change', () => {
    handleVariantChange()
});

document.getElementById('tambah-bahan').addEventListener('click', () => {
    openModal();
});