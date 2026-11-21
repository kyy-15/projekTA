function filterCategory(category, element) {
      // Toggle active class on filter tabs
      const tabs = document.querySelectorAll('.filter-tab');
      tabs.forEach(tab => tab.classList.remove('active'));
      element.classList.add('active');

      // Filter notification cards
      const cards = document.querySelectorAll('.notification-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'semua' || cardCategory === category) {
          card.style.display = 'block';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Show empty message if no cards match
      const noNotif = document.getElementById('noNotifications');
      if (visibleCount === 0) {
        noNotif.style.display = 'block';
      } else {
        noNotif.style.display = 'none';
      }
    }
    
    function toggleSidebar() {
            const sidebar = document.getElementById("sidebar");
            const backdrop = document.getElementById("sidebar-backdrop");
            if (sidebar && backdrop) {
                sidebar.classList.toggle("-translate-x-full");
                backdrop.classList.toggle("hidden");
            }
        }

        function handleLogout() {
            alert("Anda telah keluar dari sistem.");
        }