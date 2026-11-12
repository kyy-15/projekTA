document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchProduct');
    const filterButtons = document.querySelectorAll('.menu-btn-filter');
    const productCards = document.querySelectorAll('.menu-card-item');

    // --- FITUR FILTER PENCARIAN TEKS ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        productCards.forEach(card => {
            const title = card.querySelector('.menu-card-name').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });

    // --- FITUR FILTER KLIK KATEGORI ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCategory = button.getAttribute('data-category');

            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
