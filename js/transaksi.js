
document.addEventListener("DOMContentLoaded", function () {
    const $ = id => document.getElementById(id);

    const menuHarian = {
        Senin: [
            { nama: "Keju", jumlah: 24, total: 312000 },
            { nama: "Nangka", jumlah: 11, total: 143000 },
            { nama: "Kacang", jumlah: 10, total: 130000 },
            { nama: "Original", jumlah: 6, total: 60000 },
            { nama: "Es Krim", jumlah: 5, total: 75000 }
        ],
        Selasa: [
            { nama: "Es Krim", jumlah: 32, total: 480000 },
            { nama: "Original", jumlah: 11, total: 110000 },
            { nama: "Keju", jumlah: 9, total: 117000 },
            { nama: "Nangka", jumlah: 6, total: 78000 },
            { nama: "Kacang", jumlah: 5, total: 65000 }
        ],
        Rabu: [
            { nama: "Nangka", jumlah: 33, total: 429000 },
            { nama: "Kacang", jumlah: 21, total: 273000 },
            { nama: "Keju", jumlah: 11, total: 143000 },
            { nama: "Es Krim", jumlah: 7, total: 105000 },
            { nama: "Original", jumlah: 5, total: 50000 }
        ],
        Kamis: [
            { nama: "Original", jumlah: 20, total: 200000 },
            { nama: "Keju", jumlah: 13, total: 169000 },
            { nama: "Kacang", jumlah: 12, total: 156000 },
            { nama: "Es Krim", jumlah: 6, total: 90000 },
            { nama: "Nangka", jumlah: 5, total: 65000 }
        ],
        Jumat: [],
        Sabtu: [
            { nama: "Es Krim", jumlah: 36, total: 540000 },
            { nama: "Kacang", jumlah: 27, total: 351000 },
            { nama: "Original", jumlah: 20, total: 200000 },
            { nama: "Keju", jumlah: 18, total: 234000 },
            { nama: "Nangka", jumlah: 15, total: 195000 }
        ],
        Minggu: [
            { nama: "Keju", jumlah: 40, total: 520000 },
            { nama: "Es Krim", jumlah: 35, total: 525000 },
            { nama: "Original", jumlah: 28, total: 280000 },
            { nama: "Kacang", jumlah: 19, total: 247000 },
            { nama: "Nangka", jumlah: 16, total: 208000 }
        ]
    };

    const namaHari = [
        "Senin", "Selasa", "Rabu", "Kamis",
        "Jumat", "Sabtu", "Minggu"
    ];

    const tanggalMingguan = [
        "2026-08-03", "2026-08-04", "2026-08-05",
        "2026-08-06", "2026-08-07", "2026-08-08",
        "2026-08-09"
    ];

    const namaKasir = ["Ayik", "Maya", "Zora", "Rina", "Odis"];
    const metodePembayaran = ["Tunai", "QRIS", "Transfer", "Tunai", "QRIS"];

    let dataTransaksi = [];
    const nomorPerTanggal = {};

    namaHari.forEach((hari, indexHari) => {
        const tanggal = tanggalMingguan[indexHari];

        menuHarian[hari].forEach((menu, indexMenu) => {
            nomorPerTanggal[tanggal] = (nomorPerTanggal[tanggal] || 0) + 1;

            dataTransaksi.push({
                kode: "TRX-" + String(nomorPerTanggal[tanggal]).padStart(3, "0"),
                hari,
                tanggal,
                waktu: `${String(9 + indexMenu).padStart(2, "0")}.30`,
                kasir: namaKasir[(indexHari + indexMenu) % namaKasir.length],
                namaMenu: menu.nama,
                porsi: menu.jumlah,
                total: menu.total,
                metode: metodePembayaran[(indexHari + indexMenu) % metodePembayaran.length],
                status: "Selesai"
            });
        });
    });

    const tabel = $("tabelTransaksi");
    const searchInput = $("searchInput");
    const filterTanggal = $("filterTanggal");
    const calendarButton = $("calendarButton");
    const tanggalTerpilih = $("tanggalTerpilih");
    const dateLabelButton = $("dateLabelButton");
    const clearDateButton = $("clearDateButton");
    const dayDropdown = $("dayDropdown");
    const emptyMessage = $("emptyMessage");
    const jumlahData = $("jumlahData");
    const pagination = $("pagination");

    const cards = {
        Tunai: { total: $("totalTunai"), jumlah: $("jumlahTunai") },
        QRIS: { total: $("totalQRIS"), jumlah: $("jumlahQRIS") },
        Transfer: { total: $("totalTransfer"), jumlah: $("jumlahTransfer") },
        Pendapatan: { total: $("totalPendapatan"), jumlah: $("jumlahPendapatan") }
    };

    let halamanAktif = 1;
    const perHalaman = 7;
    let filterHari = "Semua";
    let filterMetode = "Semua";
    let cardPendapatanAktif = false;

    function formatRupiah(angka) {
        return "Rp " + Number(angka || 0).toLocaleString("id-ID");
    }

    function formatTanggal(nilai) {
        if (!nilai) return "-";

        const [tahun, bulan, hari] = nilai.split("-");
        const namaBulan = [
            "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
            "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
        ];

        return `${hari} ${namaBulan[Number(bulan) - 1]} ${tahun}`;
    }

    function getHari(tanggal) {
        const date = new Date(tanggal + "T00:00:00");
        const index = date.getDay();
        return namaHari[index === 0 ? 6 : index - 1];
    }

    function buatSel(nilai) {
        const td = document.createElement("td");
        td.textContent = nilai;
        return td;
    }

    function dataBerdasarkanHari() {
        return dataTransaksi.filter(item => {
            const cocokHari = filterHari === "Semua" || item.hari === filterHari;
            const cocokTanggal = !filterTanggal.value || item.tanggal === filterTanggal.value;
            return cocokHari && cocokTanggal && item.status === "Selesai";
        });
    }

    function updatePaymentCards() {
        const dataHari = dataBerdasarkanHari();

        ["Tunai", "QRIS", "Transfer"].forEach(metode => {
            const data = dataHari.filter(item => item.metode === metode);
            const total = data.reduce((sum, item) => sum + Number(item.total), 0);

            cards[metode].total.textContent = formatRupiah(total);
            cards[metode].jumlah.textContent = `${data.length} transaksi`;
        });

        const totalPendapatan = dataHari.reduce(
            (sum, item) => sum + Number(item.total), 0
        );

        cards.Pendapatan.total.textContent = formatRupiah(totalPendapatan);
        cards.Pendapatan.jumlah.textContent = `${dataHari.length} transaksi`;

        document.querySelectorAll(".payment-card").forEach(card => {
            const metode = card.dataset.metode;
            const aktif = metode === "Pendapatan"
                ? cardPendapatanAktif
                : filterMetode === metode;

            card.classList.toggle("selected", aktif);
            card.setAttribute("aria-pressed", aktif ? "true" : "false");
        });
    }

    // POPUP PEMBAYARAN

    const stylePopup = document.createElement("style");

    stylePopup.textContent = `
        .payment-card {
            cursor: pointer;
            transition: .2s ease;
        }

        .payment-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px #00000012;
        }

        .payment-card.selected {
            border: 2px solid #25ce68;
            background: #f5fff7;
        }

        .payment-popup {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 10001;
            align-items: center;
            justify-content: center;
            padding: 15px;
            background: #00000055;
        }

        .payment-popup.show {
            display: flex;
        }

        .payment-popup-content {
            width: 100%;
            max-width: 450px;
            max-height: 80vh;
            overflow-y: auto;
            padding: 25px;
            border-radius: 13px;
            background: white;
            box-shadow: 0 8px 30px #00000020;
        }

        .payment-popup-content h2 {
            margin-bottom: 6px;
            color: #287849;
            font-size: 19px;
        }

        .payment-popup-content .popup-subtitle {
            margin-bottom: 18px;
            color: #84958b;
            font-size: 12px;
        }

        .popup-summary {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 13px 0;
            border-bottom: 1px solid #edf1ee;
            font-size: 12px;
        }

        .popup-summary strong {
            color: #287849;
            text-align: right;
        }

        .popup-section-title {
            margin-top: 18px;
            margin-bottom: 5px;
            color: #287849;
            font-size: 13px;
            font-weight: 600;
        }

        .popup-close {
            width: 100%;
            margin-top: 18px;
            padding: 11px;
            border: 0;
            border-radius: 7px;
            background: #25ce68;
            color: white;
            cursor: pointer;
        }
    `;

    document.head.appendChild(stylePopup);

    const popup = document.createElement("div");
    popup.className = "payment-popup";
    popup.id = "paymentPopup";

    popup.innerHTML = `
        <div class="payment-popup-content">
            <h2 id="popupJudul">Detail Pembayaran</h2>
            <p class="popup-subtitle" id="popupSubtitle"></p>
            <div id="popupIsi"></div>
            <button type="button" class="popup-close" id="popupTutup">Tutup</button>
        </div>
    `;

    document.body.appendChild(popup);

    function getKeteranganFilter() {
        if (filterTanggal.value) return formatTanggal(filterTanggal.value);
        if (filterHari !== "Semua") return `Hari ${filterHari}`;
        return "Semua tanggal";
    }

    function tambahBarisPopup(label, nilai) {
        const baris = document.createElement("div");
        baris.className = "popup-summary";

        const teks = document.createElement("span");
        teks.textContent = label;

        const angka = document.createElement("strong");
        angka.textContent = nilai;

        baris.append(teks, angka);
        $("popupIsi").appendChild(baris);
    }

    function bukaPopupMetode(metode) {
        const data = dataBerdasarkanHari().filter(item => item.metode === metode);
        const total = data.reduce((sum, item) => sum + Number(item.total), 0);
        const totalPorsi = data.reduce((sum, item) => sum + Number(item.porsi), 0);

        $("popupJudul").textContent = `Detail ${metode}`;
        $("popupSubtitle").textContent = getKeteranganFilter();
        $("popupIsi").replaceChildren();

        tambahBarisPopup("Jumlah transaksi", `${data.length} transaksi`);
        tambahBarisPopup("Total porsi", `${totalPorsi} porsi`);
        tambahBarisPopup("Total pembayaran", formatRupiah(total));

        data.forEach(item => {
            tambahBarisPopup(
                `${item.kode} - ${item.namaMenu}`,
                formatRupiah(item.total)
            );
        });

        popup.classList.add("show");
    }

    function bukaPopupPendapatan() {
        const data = dataBerdasarkanHari();
        const totalPendapatan = data.reduce((sum, item) => sum + Number(item.total), 0);
        const totalPorsi = data.reduce((sum, item) => sum + Number(item.porsi), 0);

        const isi = $("popupIsi");
        isi.replaceChildren();

        $("popupJudul").textContent = "Detail Pendapatan";
        $("popupSubtitle").textContent = getKeteranganFilter();

        tambahBarisPopup("Jumlah transaksi", `${data.length} transaksi`);
        tambahBarisPopup("Total porsi terjual", `${totalPorsi} porsi`);
        tambahBarisPopup("Total pendapatan", formatRupiah(totalPendapatan));

        const judulMetode = document.createElement("p");
        judulMetode.className = "popup-section-title";
        judulMetode.textContent = "Rincian Metode Pembayaran";
        isi.appendChild(judulMetode);

        ["Tunai", "QRIS", "Transfer"].forEach(metode => {
            const dataMetode = data.filter(item => item.metode === metode);
            const totalMetode = dataMetode.reduce(
                (sum, item) => sum + Number(item.total), 0
            );

            tambahBarisPopup(
                metode,
                `${formatRupiah(totalMetode)} (${dataMetode.length} transaksi)`
            );
        });

        const judulTransaksi = document.createElement("p");
        judulTransaksi.className = "popup-section-title";
        judulTransaksi.textContent = "Daftar Transaksi";
        isi.appendChild(judulTransaksi);

        data.forEach(item => {
            tambahBarisPopup(
                `${item.kode} - ${item.namaMenu} (${item.metode})`,
                formatRupiah(item.total)
            );
        });

        popup.classList.add("show");
    }

    document.querySelectorAll(".payment-card").forEach(card => {
        card.addEventListener("click", () => {
            const metode = card.dataset.metode;

            if (metode === "Pendapatan") {
                filterMetode = "Semua";
                cardPendapatanAktif = true;
                halamanAktif = 1;

                updatePaymentCards();
                renderTransaksi();
                bukaPopupPendapatan();
                return;
            }

            cardPendapatanAktif = false;
            filterMetode = filterMetode === metode ? "Semua" : metode;
            halamanAktif = 1;

            updatePaymentCards();
            renderTransaksi();
            bukaPopupMetode(metode);
        });
    });

    $("popupTutup").addEventListener("click", () => {
        popup.classList.remove("show");
    });

    popup.addEventListener("click", event => {
        if (event.target === popup) popup.classList.remove("show");
    });

    // FILTER TANGGAL

    function updateLabelTanggal() {
        if (filterTanggal.value) {
            tanggalTerpilih.textContent = formatTanggal(filterTanggal.value);
            clearDateButton.hidden = false;
        } else if (filterHari !== "Semua") {
            tanggalTerpilih.textContent = filterHari;
            clearDateButton.hidden = false;
        } else {
            tanggalTerpilih.textContent = "Semua Tanggal";
            clearDateButton.hidden = true;
        }

        dayDropdown.querySelectorAll("button").forEach(button => {
            button.classList.toggle("active", button.dataset.day === filterHari);
        });
    }

    // FILTER TABEL

    function getFilteredData() {
        const kataKunci = searchInput.value.toLowerCase().trim();

        return dataTransaksi.filter(item => {
            const cocokKata =
                item.kode.toLowerCase().includes(kataKunci) ||
                item.kasir.toLowerCase().includes(kataKunci) ||
                item.namaMenu.toLowerCase().includes(kataKunci) ||
                item.metode.toLowerCase().includes(kataKunci);

            const cocokTanggal = !filterTanggal.value || item.tanggal === filterTanggal.value;
            const cocokHari = filterHari === "Semua" || item.hari === filterHari;
            const cocokMetode = filterMetode === "Semua" || item.metode === filterMetode;

            return cocokKata && cocokTanggal && cocokHari && cocokMetode;
        }).sort((a, b) =>
            b.tanggal.localeCompare(a.tanggal) || b.kode.localeCompare(a.kode)
        );
    }

    // RENDER TABEL TRANSAKSI

    function renderTransaksi() {
        const hasil = getFilteredData();
        const totalHalaman = Math.max(1, Math.ceil(hasil.length / perHalaman));

        if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;

        const mulai = (halamanAktif - 1) * perHalaman;
        const dataHalaman = hasil.slice(mulai, mulai + perHalaman);

        tabel.replaceChildren();

        dataHalaman.forEach((item, index) => {
            const tr = document.createElement("tr");

            tr.append(
                buatSel(mulai + index + 1),
                buatSel(item.kode),
                buatSel(item.hari),
                buatSel(formatTanggal(item.tanggal)),
                buatSel(item.kasir),
                buatSel(item.porsi + " porsi"),
                buatSel(formatRupiah(item.total)),
                buatSel(item.metode)
            );

            const tdStatus = document.createElement("td");
            const status = document.createElement("span");

            status.className = "status";
            status.textContent = item.status;
            tdStatus.appendChild(status);
            tr.appendChild(tdStatus);

            const tdAksi = document.createElement("td");
            const tombol = document.createElement("button");

            tombol.type = "button";
            tombol.className = "edit-button";
            tombol.textContent = "Detail";
            tombol.addEventListener("click", () => detailTransaksi(item));

            tdAksi.appendChild(tombol);
            tr.appendChild(tdAksi);

            tabel.appendChild(tr);
        });

        emptyMessage.hidden = hasil.length !== 0;

        jumlahData.textContent =
            `Menampilkan ${hasil.length ? mulai + 1 : 0}–${Math.min(mulai + perHalaman, hasil.length)} dari ${hasil.length} data`;

        renderPagination(totalHalaman);
    }

    // PAGINATION

    function renderPagination(totalHalaman) {
        pagination.replaceChildren();

        function tambahTombol(teks, halaman, nonaktif = false) {
            const tombol = document.createElement("button");

            tombol.type = "button";
            tombol.textContent = teks;
            tombol.disabled = nonaktif;

            if (halaman === halamanAktif && teks !== "‹" && teks !== "›") {
                tombol.classList.add("current");
            }

            tombol.addEventListener("click", () => {
                halamanAktif = halaman;
                renderTransaksi();
            });

            pagination.appendChild(tombol);
        }

        tambahTombol("‹", halamanAktif - 1, halamanAktif === 1);

        for (let i = 1; i <= totalHalaman; i++) {
            tambahTombol(String(i), i);
        }

        tambahTombol("›", halamanAktif + 1, halamanAktif === totalHalaman);
    }

    // DROPDOWN HARI

    dateLabelButton.addEventListener("click", () => {
        dayDropdown.classList.toggle("show");
    });

    dayDropdown.addEventListener("click", event => {
        const button = event.target.closest("button[data-day]");
        if (!button) return;

        filterHari = button.dataset.day;
        filterTanggal.value = "";
        filterMetode = "Semua";
        cardPendapatanAktif = false;
        halamanAktif = 1;

        dayDropdown.classList.remove("show");
        popup.classList.remove("show");

        updateLabelTanggal();
        updatePaymentCards();
        renderTransaksi();
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".date-filter")) {
            dayDropdown.classList.remove("show");
        }
    });

    // KALENDER

    calendarButton.addEventListener("click", () => {
        if (typeof filterTanggal.showPicker === "function") {
            try {
                filterTanggal.showPicker();
            } catch (error) {
                filterTanggal.click();
            }
        } else {
            filterTanggal.click();
        }
    });

    filterTanggal.addEventListener("change", () => {
        filterHari = "Semua";
        filterMetode = "Semua";
        cardPendapatanAktif = false;
        halamanAktif = 1;

        updateLabelTanggal();
        updatePaymentCards();
        renderTransaksi();
    });

    clearDateButton.addEventListener("click", () => {
        filterTanggal.value = "";
        filterHari = "Semua";
        filterMetode = "Semua";
        cardPendapatanAktif = false;
        halamanAktif = 1;

        updateLabelTanggal();
        updatePaymentCards();
        renderTransaksi();
    });

    searchInput.addEventListener("input", () => {
        halamanAktif = 1;
        renderTransaksi();
    });

    // DROPDOWN UNDUH

    const exportDropdown = document.querySelector(".export-dropdown");
    const exportButton = $("exportButton");
    const exportMenu = $("exportMenu");

    if (exportDropdown && exportButton && exportMenu) {
        exportButton.addEventListener("click", function (event) {
            event.stopPropagation();

            const terbuka = exportDropdown.classList.toggle("open");
            exportButton.setAttribute("aria-expanded", terbuka ? "true" : "false");
        });

        document.addEventListener("click", function (event) {
            if (!exportDropdown.contains(event.target)) {
                exportDropdown.classList.remove("open");
                exportButton.setAttribute("aria-expanded", "false");
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                exportDropdown.classList.remove("open");
                exportButton.setAttribute("aria-expanded", "false");
            }
        });
    }

    function tutupExportMenu() {
        if (exportDropdown && exportButton) {
            exportDropdown.classList.remove("open");
            exportButton.setAttribute("aria-expanded", "false");
        }
    }

    function getJudulFilterExport() {
        if (filterTanggal.value) return `Tanggal ${formatTanggal(filterTanggal.value)}`;
        if (filterHari !== "Semua") return `Hari ${filterHari}`;
        return "Semua Tanggal";
    }

    function getTotalPorsi(data) {
        return data.reduce((sum, item) => sum + Number(item.porsi || 0), 0);
    }

    function getTotalPendapatan(data) {
        return data.reduce((sum, item) => sum + Number(item.total || 0), 0);
    }

    function getRingkasanMetode(data, metode) {
        const dataMetode = data.filter(item => item.metode === metode);

        return {
            jumlah: dataMetode.length,
            total: getTotalPendapatan(dataMetode)
        };
    }

    function tanggalNamaFile() {
        const sekarang = new Date();
        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
        const hari = String(sekarang.getDate()).padStart(2, "0");

        return `${tahun}${bulan}${hari}`;
    }

    // UNDUH EXCEL

    function unduhExcel(data) {
        if (typeof XLSX === "undefined") {
            alert("Library Excel belum berhasil dimuat. Periksa koneksi internet.");
            return;
        }

        const workbook = XLSX.utils.book_new();
        const worksheet = {};

        const hijauTua = "168747";
        const hijau = "25CE68";
        const hijauMuda = "EAF8EF";
        const putih = "FFFFFF";
        const abu = "84958B";

        const border = {
            top: { style: "thin", color: { rgb: "DCE9DF" } },
            bottom: { style: "thin", color: { rgb: "DCE9DF" } },
            left: { style: "thin", color: { rgb: "DCE9DF" } },
            right: { style: "thin", color: { rgb: "DCE9DF" } }
        };

        function setCell(cell, value, style = {}) {
            worksheet[cell] = {
                v: value,
                t: typeof value === "number" ? "n" : "s",
                s: style
            };
        }

        function merge(startRow, startCol, endRow, endCol) {
            worksheet["!merges"] = worksheet["!merges"] || [];
            worksheet["!merges"].push({
                s: { r: startRow, c: startCol },
                e: { r: endRow, c: endCol }
            });
        }

        function judulStyle() {
            return {
                font: { bold: true, color: { rgb: putih }, sz: 16 },
                fill: { fgColor: { rgb: hijauTua } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        function subJudulStyle() {
            return {
                font: { bold: true, color: { rgb: hijauTua }, sz: 11 },
                fill: { fgColor: { rgb: hijauMuda } },
                alignment: { vertical: "center" },
                border
            };
        }

        function headerStyle() {
            return {
                font: { bold: true, color: { rgb: putih }, sz: 10 },
                fill: { fgColor: { rgb: hijau } },
                alignment: {
                    horizontal: "center",
                    vertical: "center",
                    wrapText: true
                },
                border
            };
        }

        const totalPorsi = getTotalPorsi(data);
        const totalPendapatan = getTotalPendapatan(data);

        // JUDUL LAPORAN

        merge(0, 0, 1, 10);
        setCell("A1", "LAPORAN TRANSAKSI");
        worksheet["A1"].s = judulStyle();

        merge(2, 0, 2, 10);
        setCell("A3", "ES PISANG IJO OMA");
        worksheet["A3"].s = {
            font: { bold: true, color: { rgb: hijauTua }, sz: 12 },
            alignment: { horizontal: "center" }
        };

        merge(3, 0, 3, 10);
        setCell("A4", `Periode: ${getJudulFilterExport()}`);
        worksheet["A4"].s = {
            font: { color: { rgb: abu }, italic: true, sz: 10 },
            alignment: { horizontal: "center" }
        };

        // RINGKASAN TRANSAKSI - KOLOM A:B UNTUK LABEL, C:D UNTUK NILAI

        merge(5, 0, 5, 3);
        setCell("A6", "RINGKASAN TRANSAKSI");
        worksheet["A6"].s = subJudulStyle();

        const ringkasan = [
            { label: "Jumlah Transaksi", nilai: data.length, format: '#,##0 "transaksi"' },
            { label: "Total Porsi", nilai: totalPorsi, format: '#,##0 "porsi"' },
            { label: "Total Pendapatan", nilai: totalPendapatan, format: '"Rp" #,##0' }
        ];

        ringkasan.forEach((item, index) => {
            const row = 7 + index;

            merge(row - 1, 0, row - 1, 1);
            merge(row - 1, 2, row - 1, 3);

            setCell(`A${row}`, item.label, {
                font: { bold: true, color: { rgb: hijauTua } },
                fill: { fgColor: { rgb: "F5FBF6" } },
                border,
                alignment: { vertical: "center", horizontal: "left" }
            });

            setCell(`C${row}`, item.nilai, {
                font: { bold: true, color: { rgb: hijauTua }, sz: 11 },
                fill: { fgColor: { rgb: hijauMuda } },
                border,
                alignment: { vertical: "center", horizontal: "center" },
                numFmt: item.format
            });
        });

        // RINCIAN METODE PEMBAYARAN

        merge(11, 0, 11, 2);
        setCell("A12", "RINCIAN METODE PEMBAYARAN");
        worksheet["A12"].s = subJudulStyle();

        ["Metode Pembayaran", "Jumlah Transaksi", "Total Pendapatan"].forEach(
            (judul, index) => {
                const cell = XLSX.utils.encode_cell({ r: 12, c: index });
                setCell(cell, judul, headerStyle());
            }
        );

        ["Tunai", "QRIS", "Transfer"].forEach((metode, index) => {
            const hasil = getRingkasanMetode(data, metode);
            const row = 14 + index;

            setCell(`A${row}`, metode, { border });
            setCell(`B${row}`, hasil.jumlah, {
                border,
                alignment: { horizontal: "center" },
                numFmt: "#,##0"
            });
            setCell(`C${row}`, hasil.total, {
                border,
                numFmt: '"Rp" #,##0'
            });
        });

        // DAFTAR TRANSAKSI

        merge(17, 0, 17, 10);
        setCell("A18", "DAFTAR TRANSAKSI");
        worksheet["A18"].s = subJudulStyle();

        const header = [
            "No", "Kode Transaksi", "Hari", "Tanggal", "Waktu",
            "Kasir", "Nama Menu", "Porsi", "Total",
            "Metode Pembayaran", "Status"
        ];

        header.forEach((judul, index) => {
            const cell = XLSX.utils.encode_cell({ r: 18, c: index });
            setCell(cell, judul, headerStyle());
        });

        data.forEach((item, index) => {
            const row = 20 + index;

            const isi = [
                index + 1,
                item.kode,
                item.hari,
                formatTanggal(item.tanggal),
                item.waktu || "-",
                item.kasir,
                item.namaMenu,
                Number(item.porsi),
                Number(item.total),
                item.metode,
                item.status
            ];

            isi.forEach((nilai, col) => {
                const cell = XLSX.utils.encode_cell({ r: row - 1, c: col });

                const style = {
                    border,
                    alignment: {
                        vertical: "center",
                        horizontal: [0, 7].includes(col) ? "center" : "left"
                    }
                };

                if (index % 2 === 1) {
                    style.fill = { fgColor: { rgb: "F5FBF6" } };
                }

                if (col === 8) {
                    style.numFmt = '"Rp" #,##0';
                    style.font = { bold: true, color: { rgb: hijauTua } };
                }

                if (col === 10) {
                    style.font = { bold: true, color: { rgb: hijauTua } };
                }

                setCell(cell, nilai, style);
            });
        });

        // LEBAR KOLOM

        worksheet["!cols"] = [
            { wch: 7 },
            { wch: 19 },
            { wch: 13 },
            { wch: 17 },
            { wch: 12 },
            { wch: 16 },
            { wch: 19 },
            { wch: 10 },
            { wch: 20 },
            { wch: 23 },
            { wch: 14 }
        ];

        // TINGGI BARIS

        worksheet["!rows"] = [
            { hpt: 25 },
            { hpt: 12 },
            { hpt: 22 },
            { hpt: 20 },
            { hpt: 10 },
            { hpt: 22 },
            { hpt: 25 },
            { hpt: 25 },
            { hpt: 25 },
            { hpt: 10 },
            { hpt: 10 },
            { hpt: 22 },
            { hpt: 25 },
            { hpt: 22 },
            { hpt: 22 },
            { hpt: 22 },
            { hpt: 10 },
            { hpt: 22 },
            { hpt: 28 }
        ];

        worksheet["!autofilter"] = {
            ref: `A19:K${19 + data.length}`
        };

        worksheet["!freeze"] = {
            xSplit: 0,
            ySplit: 19,
            topLeftCell: "A20",
            activePane: "bottomLeft",
            state: "frozen"
        };

        worksheet["!ref"] = `A1:K${Math.max(19 + data.length, 19)}`;

        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Transaksi");

        XLSX.writeFile(
            workbook,
            `laporan_transaksi_${tanggalNamaFile()}.xlsx`
        );

        tutupExportMenu();
    }

    // UNDUH PDF

    function unduhPDF(data) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("Library PDF belum berhasil dimuat. Periksa koneksi internet.");
            return;
        }

        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        const totalPorsi = getTotalPorsi(data);
        const totalPendapatan = getTotalPendapatan(data);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("LAPORAN TRANSAKSI", 14, 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Es Pisang Ijo Oma", 14, 25);
        doc.text(`Filter: ${getJudulFilterExport()}`, 14, 32);

        doc.autoTable({
            startY: 39,
            head: [["Ringkasan", "Jumlah"]],
            body: [
                ["Jumlah Transaksi", `${data.length} transaksi`],
                ["Total Porsi", `${totalPorsi} porsi`],
                ["Total Pendapatan", formatRupiah(totalPendapatan)]
            ],
            theme: "grid",
            headStyles: {
                fillColor: [37, 206, 104],
                textColor: [255, 255, 255],
                fontStyle: "bold"
            },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 14, right: 14 },
            tableWidth: 90
        });

        const posisiRingkasan = doc.lastAutoTable.finalY + 8;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("RINCIAN METODE PEMBAYARAN", 14, posisiRingkasan);

        const rincianMetode = ["Tunai", "QRIS", "Transfer"].map(metode => {
            const hasil = getRingkasanMetode(data, metode);
            return [
                metode,
                `${hasil.jumlah} transaksi`,
                formatRupiah(hasil.total)
            ];
        });

        doc.autoTable({
            startY: posisiRingkasan + 4,
            head: [["Metode", "Jumlah Transaksi", "Total Pendapatan"]],
            body: rincianMetode,
            theme: "grid",
            headStyles: {
                fillColor: [37, 206, 104],
                textColor: [255, 255, 255],
                fontStyle: "bold"
            },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 14, right: 14 },
            tableWidth: 130
        });

        const posisiTabel = doc.lastAutoTable.finalY + 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("DAFTAR TRANSAKSI", 14, posisiTabel);

        const barisTransaksi = data.map((item, index) => [
            index + 1,
            item.kode,
            item.hari,
            formatTanggal(item.tanggal),
            item.waktu || "-",
            item.kasir,
            item.namaMenu,
            `${item.porsi} porsi`,
            formatRupiah(item.total),
            item.metode,
            item.status
        ]);

        doc.autoTable({
            startY: posisiTabel + 4,
            head: [[
                "No", "Kode", "Hari", "Tanggal", "Waktu",
                "Kasir", "Menu", "Porsi", "Total", "Metode", "Status"
            ]],
            body: barisTransaksi,
            theme: "grid",
            headStyles: {
                fillColor: [37, 206, 104],
                textColor: [255, 255, 255],
                fontStyle: "bold"
            },
            styles: {
                fontSize: 7,
                cellPadding: 2,
                overflow: "linebreak"
            },
            columnStyles: {
                0: { cellWidth: 9 },
                1: { cellWidth: 21 },
                2: { cellWidth: 15 },
                3: { cellWidth: 20 },
                4: { cellWidth: 15 },
                5: { cellWidth: 18 },
                6: { cellWidth: 20 },
                7: { cellWidth: 16 },
                8: { cellWidth: 24 },
                9: { cellWidth: 19 },
                10: { cellWidth: 15 }
            },
            margin: { left: 10, right: 10 },
            didDrawPage: function () {
                const halaman = doc.internal.getNumberOfPages();
                const tinggiHalaman = doc.internal.pageSize.height;

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(
                    `Es Pisang Ijo Oma | Halaman ${halaman}`,
                    14,
                    tinggiHalaman - 8
                );
            }
        });

        doc.save(`laporan_transaksi_${tanggalNamaFile()}.pdf`);
        tutupExportMenu();
    }

    // TOMBOL EKSPOR

    async function prosesUnduh(format) {
        const tombolPDF = $("unduhPDF");
        const tombolExcel = $("unduhExcel");
        const tombol = format === "pdf" ? tombolPDF : tombolExcel;

        if (!tombol) return;

        const data = getFilteredData();

        if (data.length === 0) {
            alert("Tidak ada data transaksi untuk diunduh.");
            return;
        }

        const teksAsli = tombol.innerHTML;

        tombol.disabled = true;
        tombol.innerHTML = "Menyiapkan file...";

        try {
            if (format === "pdf") {
                unduhPDF(data);
            } else {
                unduhExcel(data);
            }
        } catch (error) {
            console.error("Gagal mengunduh laporan:", error);
            alert("File gagal dibuat. Silakan coba lagi.");
        } finally {
            tombol.disabled = false;
            tombol.innerHTML = teksAsli;
        }
    }

    if ($("unduhPDF")) {
        $("unduhPDF").addEventListener("click", function (event) {
            event.preventDefault();
            prosesUnduh("pdf");
        });
    }

    if ($("unduhExcel")) {
        $("unduhExcel").addEventListener("click", function (event) {
            event.preventDefault();
            prosesUnduh("excel");
        });
    }

    // MODAL TAMBAH

    window.bukaModal = function () {
        $("formTransaksi").reset();
        $("tanggalTransaksi").value = "2026-08-03";
        $("jumlahPorsi").value = 1;
        $("modalTambah").style.display = "flex";
    };

    window.tutupModal = function () {
        $("modalTambah").style.display = "none";
    };

    window.tutupDetail = function () {
        $("modalDetail").style.display = "none";
    };

    // DETAIL TRANSAKSI

    function detailTransaksi(item) {
        const jumlah = Number(item.porsi) || 0;
        const total = Number(item.total) || 0;
        const hargaSatuan = jumlah > 0 ? total / jumlah : total;

        const dataDetail = {
            kode: item.kode,
            hari: item.hari,
            tanggal: item.tanggal,
            waktu: item.waktu,
            kasir: item.kasir,
            metode: item.metode,
            status: item.status,
            total,
            items: [{
                nama: item.namaMenu,
                jumlah,
                harga: hargaSatuan
            }]
        };

        sessionStorage.setItem("detailTransaksi", JSON.stringify(dataDetail));
        window.location.href = "/detail_transaksi";
    }

    // NOMOR TRANSAKSI

    function buatKodeTransaksi(tanggal) {
        const transaksiHariIni = dataTransaksi.filter(item => item.tanggal === tanggal);

        const nomorTerakhir = transaksiHariIni.reduce((maks, item) => {
            const nomor = Number(item.kode.replace("TRX-", ""));
            return Math.max(maks, nomor);
        }, 0);

        return "TRX-" + String(nomorTerakhir + 1).padStart(3, "0");
    }

    // TAMBAH TRANSAKSI

    $("formTransaksi").addEventListener("submit", function (event) {
        event.preventDefault();

        const kasir = $("namaKasir").value.trim();
        const tanggal = $("tanggalTransaksi").value;
        const namaMenu = $("namaMenuTransaksi").value;
        const porsi = Number($("jumlahPorsi").value);
        const total = Number($("totalTransaksi").value);
        const metode = $("metodeTransaksi").value;

        if (!kasir || !tanggal || porsi <= 0 || total <= 0) {
            alert("Lengkapi data transaksi dengan benar!");
            return;
        }

        dataTransaksi.push({
            kode: buatKodeTransaksi(tanggal),
            hari: getHari(tanggal),
            tanggal,
            waktu: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit"
            }),
            kasir,
            namaMenu,
            porsi,
            total,
            metode,
            status: "Selesai"
        });

        this.reset();

        filterTanggal.value = "";
        filterHari = "Semua";
        filterMetode = "Semua";
        cardPendapatanAktif = false;
        searchInput.value = "";
        halamanAktif = 1;

        updateLabelTanggal();
        updatePaymentCards();
        renderTransaksi();
        tutupModal();

        alert("Transaksi berhasil ditambahkan.");
    });

    // MODAL KONFIRMASI KELUAR

    const logoutLink = document.querySelector(".nav-link.logout");
    const modalKeluar = $("modalKeluar");
    const batalKeluar = $("batalKeluar");
    const yaKeluar = $("yaKeluar");

    let tujuanLogout = "";

    function bukaModalKeluar() {
        if (!modalKeluar) return;
        modalKeluar.classList.add("show");
        modalKeluar.setAttribute("aria-hidden", "false");
    }

    function tutupModalKeluar() {
        if (!modalKeluar) return;
        modalKeluar.classList.remove("show");
        modalKeluar.setAttribute("aria-hidden", "true");
    }

    if (logoutLink && modalKeluar) {
        logoutLink.addEventListener("click", function (event) {
            event.preventDefault();
            tujuanLogout = logoutLink.href;
            bukaModalKeluar();
        });
    }

    if (batalKeluar) {
        batalKeluar.addEventListener("click", tutupModalKeluar);
    }

    if (yaKeluar) {
        yaKeluar.addEventListener("click", function () {
            if (tujuanLogout) window.location.href = tujuanLogout;
        });
    }

    if (modalKeluar) {
        modalKeluar.addEventListener("click", function (event) {
            if (event.target === modalKeluar) tutupModalKeluar();
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") tutupModalKeluar();
    });

    // AWAL HALAMAN

    updateLabelTanggal();
    updatePaymentCards();
    renderTransaksi();
});
