// MODAL PASSWORD
function openPasswordModal() {
    document.getElementById("passwordModal").classList.add("show");
}

function closePasswordModal() {
    document.getElementById("passwordModal").classList.remove("show");
}


// SIMPAN PASSWORD
function savePassword() {
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        alert("Semua kolom harus diisi!");
        return;
    }

    if (newPassword.length < 6) {
        alert("Password baru minimal 6 karakter!");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Konfirmasi password tidak cocok!");
        return;
    }

    alert("Password berhasil diperbarui!");

    document.getElementById("passwordModal").classList.remove("show");

    document.getElementById("oldPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
}


// KONEKSI PRINTER (SIMULASI TAMPILAN)
function connectPrinter() {
    const connection = document.querySelector(
        'input[name="connection"]:checked'
    ).value;

    const statusLabel = document.getElementById("statusLabel");
    const statusDot = document.querySelector(".status-dot");

    statusLabel.textContent = "Menghubungkan...";

    statusLabel.style.color = "#d69b25";
    statusDot.style.background = "#e6ad35";

    setTimeout(() => {
        statusLabel.textContent = "Tidak Terhubung";
        statusLabel.style.color = "#d44a4a";
        statusDot.style.background = "#f00";

        alert(
            "Koneksi " + connection +
            " belum tersedia. Hubungkan perangkat printer melalui sistem perangkat terlebih dahulu."
        );
    }, 1000);
}


// EDIT NAMA TAMPILAN
document.getElementById("namaTampilan").addEventListener("change", function() {
    const nama = this.value.trim();

    if (nama !== "") {
        document.querySelector(".profile-text h3").textContent = nama;
    } else {
        alert("Nama tampilan tidak boleh kosong!");
        this.value = "Kasir A";
    }
});