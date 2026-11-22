const STORAGE_KEY = "pengaturanOutlet";

// Ambil elemen dengan aman (tidak error kalau id tidak ada)
const $ = id => document.getElementById(id);


// ============================
// PINDAH TAB
// ============================
function showTab(id, button) {

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });

    button.classList.add("active");

    const profile = $("profilOutlet");
    const tax = $("biayaPajak");
    const backup = $("backupData");
    const rightContent = document.querySelector(".right-content");

    profile.classList.add("hidden");
    tax.classList.add("hidden");
    backup.classList.add("hidden");

    if (id === "profilOutlet") {
        profile.classList.remove("hidden");
        rightContent.classList.add("hidden");
    }

    else if (id === "biayaPajak") {
        tax.classList.remove("hidden");
        rightContent.classList.remove("hidden");
    }

    else if (id === "backupData") {
        backup.classList.remove("hidden");
        rightContent.classList.remove("hidden");
    }
}


// ============================
// AMBIL DATA FORM
// ============================
function getOutletData() {

    return {
        namaOutlet: $("namaOutlet").value,
        alamat: $("alamatOutlet").value,
        nomor: $("nomorOutlet").value,
        pajak: $("pajak").value,
        biayaTambahan: $("biayaTambahan").value,
        logo: localStorage.getItem("logoOutlet") || ""
    };
}


// ============================
// SIMPAN PENGATURAN
// ============================
function saveSettings() {

    const data = getOutletData();

    const pajak = Number(data.pajak);
    const biaya = Number(data.biayaTambahan);

    if (!data.namaOutlet.trim() ||
        !data.alamat.trim() ||
        !data.nomor.trim()) {

        alert("Mohon lengkapi data outlet!");
        return;
    }

    if (
        data.pajak === "" ||
        data.biayaTambahan === "" ||
        !Number.isFinite(pajak) ||
        !Number.isFinite(biaya) ||
        pajak < 0 || pajak > 100 ||
        biaya < 0 || biaya > 100
    ) {
        alert("Pajak dan biaya harus diisi antara 0 sampai 100!");
        return;
    }

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(data)
        );
    } catch (error) {
        console.error("Gagal menyimpan:", error);
        alert("Gagal menyimpan pengaturan!");
        return;
    }

    alert("Pengaturan berhasil disimpan!");
}


// ============================
// UPLOAD LOGO
// ============================
function aktifkanUploadLogo() {

    const input = $("logoInput");

    if (!input) return;

    input.addEventListener("change", function() {

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Pilih file gambar!");
            this.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran logo maksimal 2 MB!");
            this.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {

            const imageData = e.target.result;

            $("previewImage").src = imageData;
            $("previewImage").style.display = "block";

            localStorage.setItem("logoOutlet", imageData);

            alert("Logo berhasil diperbarui!");
        };

        reader.readAsDataURL(file);
    });
}


// ============================
// BACKUP DATA (unduh file .json)
// Nama fungsi diganti dari backupData() karena sama dengan
// id section "backupData" di HTML, yang bisa saling bentrok.
// ============================
function lakukanBackup() {

    const data = getOutletData();

    data.tanggalBackup = new Date().toLocaleString("id-ID");

    const json = JSON.stringify(data, null, 4);

    const blob = new Blob(
        [json],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "backup_es_pisang_ijo_oma.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);

    alert("Backup data berhasil diunduh!");
}


// ============================
// MUAT DATA TERSIMPAN
// ============================
function loadSettings() {

    // Logo disimpan terpisah, jadi dimuat walau pengaturan belum pernah disimpan
    const logo = localStorage.getItem("logoOutlet");

    if (logo && $("previewImage")) {
        $("previewImage").src = logo;
        $("previewImage").style.display = "block";
    }

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    try {
        const data = JSON.parse(saved);

        $("namaOutlet").value = data.namaOutlet || "";
        $("alamatOutlet").value = data.alamat || "";
        $("nomorOutlet").value = data.nomor || "";
        $("pajak").value = data.pajak ?? 11;
        $("biayaTambahan").value = data.biayaTambahan ?? 0;

    } catch (error) {
        console.error("Gagal memuat pengaturan:", error);
    }
}


// ============================
// LOGOUT
// ============================
function logout() {

    const yakin = confirm("Apakah kamu yakin ingin keluar?");

    if (yakin) {
        window.location.href = "/";
    }
}


// ============================
// HUBUNGKAN TOMBOL
// Tombol dicari lewat id / class. Kalau di HTML sudah ada
// onclick="..." pada tombolnya, tombol itu dilewati agar
// tidak terpanggil dua kali.
// ============================
function hubungkan(selector, aksi) {

    document.querySelectorAll(selector).forEach(el => {

        if (el.hasAttribute("onclick") || el.dataset.terhubung) return;

        el.dataset.terhubung = "1";

        el.addEventListener("click", function(e) {
            e.preventDefault();
            aksi();
        });
    });
}

function aktifkanPopupBackup() {

    const modal = $("modalBackup");

    function tutupPopup() {
        if (modal) modal.classList.remove("show");
    }

    function bukaPopup() {
        if (modal) {
            modal.classList.add("show");
        } else {
            // Tidak ada popup di HTML -> langsung backup
            lakukanBackup();
        }
    }

    // Tombol "Backup Data" di kartu
    hubungkan("#btnBackupData, .backup-button, .btn-backup", bukaPopup);

    // Tombol di dalam popup
    if ($("closeBackup")) $("closeBackup").addEventListener("click", tutupPopup);
    if ($("batalBackup")) $("batalBackup").addEventListener("click", tutupPopup);

    if ($("simpanBackup")) {
        $("simpanBackup").addEventListener("click", function() {
            lakukanBackup();
            tutupPopup();
        });
    }

    if (modal) {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) tutupPopup();
        });
    }

    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") tutupPopup();
    });
}


// ============================
// JALANKAN SAAT HALAMAN DIBUKA
// ============================
document.addEventListener("DOMContentLoaded", function() {

    loadSettings();
    aktifkanUploadLogo();

    // Tombol Simpan
    hubungkan("#btnSimpan, .save-button", saveSettings);

    // Tombol Backup Data + popup
    aktifkanPopupBackup();

    // Tombol Logout (jika belum punya onclick)
    hubungkan("#logoutBtn, .logout", logout);
});