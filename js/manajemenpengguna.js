// Filter Pencarian Tabel Live
    function filterTable() {
      const input = document.getElementById("searchInput");
      const filter = input.value.toLowerCase();
      const tbody = document.querySelector("#employeeTable tbody");
      const rows = tbody.getElementsByTagName("tr");

      for (let i = 0; i < rows.length; i++) {
        const nameCell = rows[i].getElementsByTagName("td")[0];
        const roleCell = rows[i].getElementsByTagName("td")[1];
        if (nameCell || roleCell) {
          const nameText = nameCell.textContent || nameCell.innerText;
          const roleText = roleCell.textContent || roleCell.innerText;
          if (nameText.toLowerCase().indexOf(filter) > -1 || roleText.toLowerCase().indexOf(filter) > -1) {
            rows[i].style.display = "";
          } else {
            rows[i].style.display = "none";
          }
        }
      }
    }

    // Modal Permission
    function openPermissionModal() {
      document.getElementById("permissionModal").classList.add("active");
    }

    function closePermissionModal() {
      document.getElementById("permissionModal").classList.remove("active");
    }

    function savePermission() {
      alert("Permission berhasil diperbarui!");
      closePermissionModal();
    }

    // Action Row Functions
    function editRow(btn) {
      const tr = btn.closest("tr");
      const name = tr.cells[0].innerText;
      const role = tr.cells[1].innerText;
      
      const newName = prompt("Edit Nama Karyawan:", name);
      if (newName !== null && newName.trim() !== "") {
        tr.cells[0].innerText = newName.trim();
      }
    }

    function deleteRow(btn) {
      const tr = btn.closest("tr");
      const name = tr.cells[0].innerText;
      if (confirm(`Apakah Anda yakin ingin menghapus akun ${name}?`)) {
        tr.remove();
      }
    }