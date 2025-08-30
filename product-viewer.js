class ProductViewer {
    constructor() {
        this.products = [];
        this.currentCategory = '';
        this.init();
        // Refresh button removed
    }

    async init() {
        await this.loadExcelData();
        this.setupPopup();
        this.renderProducts();
    }

    async loadExcelData() {
        try {
            console.log('Caricamento dati prodotti...');
            
            // Prima prova a caricare dal localStorage
            const storedData = localStorage.getItem('eurekaProducts');
            if (storedData) {
                console.log('Dati trovati nel localStorage');
                const jsonData = JSON.parse(storedData);
                this.processProductData(jsonData);
                return;
            }
            
            // Se non ci sono dati nel localStorage, prova a caricare il file Excel
            console.log('Tentativo caricamento file Excel...');
            const response = await fetch('Data.xlsx');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.arrayBuffer();
            console.log('File caricato, dimensione:', data.byteLength);
            
            const workbook = XLSX.read(data, { type: 'array' });
            console.log('Fogli trovati:', workbook.SheetNames);
            
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Salva nel localStorage per le prossime visite
            localStorage.setItem('eurekaProducts', JSON.stringify(jsonData));
            
            this.processProductData(jsonData);
            
        } catch (error) {
            console.error('Errore nel caricamento dei dati:', error);
            // Mostra messaggio all'utente
            const container = document.getElementById('products-container');
            if (container) {
                container.innerHTML = `
                    <p class="error-message">
                        Nessun database trovato. 
                        <br><br>
                        <a href="excel-reader.html" style="color: #2d8a8a; text-decoration: underline;">
                            Clicca qui per caricare il file Excel
                        </a>
                    </p>
                `;
            }
        }
    }
    
    processProductData(jsonData) {
        console.log('Dati raw:', jsonData);
        
        this.products = jsonData.map(row => ({
            codice: row.CODICE || row.Codice || row.codice,
            articolo: row.ARTICOLO || row.Articolo || row.articolo,
            descrizione: row.DESCRIZIONE || row.Descrizione || row.descrizione,
            prezzo: row.PREZZO || row.Prezzo || row.prezzo,
            categoria: row.CATEGORIA || row.Categoria || row.categoria,
            evidenza: row.EVIDENZA || row.Evidenza || row.evidenza,
            foto: row.FOTO || row.Foto || row.foto
        }));
        
        console.log('Prodotti processati:', this.products);
        console.log('Numero prodotti:', this.products.length);
    }

    getCurrentCategory() {
        const path = window.location.pathname;
        if (path.includes('libri.html')) return 'libri';
        if (path.includes('regali.html')) return 'regali';
        if (path.includes('scuola.html')) return 'scuola';
        return 'home';
    }

    filterProducts() {
        const category = this.getCurrentCategory();
        
        if (category === 'home') {
            return this.products.filter(product => 
                product.evidenza && product.evidenza.toString().toLowerCase() === 'si'
            );
        }
        
        return this.products.filter(product => 
            product.categoria && product.categoria.toLowerCase() === category
        );
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => this.openPopup(product);
        
        const imageUrl = `foto/${product.codice}.png`;
        
        card.innerHTML = `
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.articolo}" onerror="this.src='assets/placeholder.png'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.articolo}</h3>
                <p class="product-description">${product.descrizione || ''}</p>
                <p class="product-price">€ ${product.prezzo || 'N/A'}</p>
            </div>
        `;
        
        return card;
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;
        
        const filteredProducts = this.filterProducts();
        container.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            container.innerHTML = '<p class="no-products">Nessun prodotto disponibile</p>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const card = this.createProductCard(product);
            container.appendChild(card);
        });
    }

    setupPopup() {
        const popup = document.createElement('div');
        popup.id = 'product-popup';
        popup.className = 'popup-overlay';
        popup.innerHTML = `
            <div class="popup-content">
                <span class="popup-close">&times;</span>
                <div class="popup-image">
                    <img id="popup-img" src="" alt="">
                </div>
                <div class="popup-info">
                    <h2 id="popup-title"></h2>
                    <p id="popup-description"></p>
                    <p id="popup-price"></p>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        popup.querySelector('.popup-close').onclick = () => this.closePopup();
        popup.onclick = (e) => {
            if (e.target === popup) this.closePopup();
        };
    }

    openPopup(product) {
        const popup = document.getElementById('product-popup');
        const img = document.getElementById('popup-img');
        const title = document.getElementById('popup-title');
        const description = document.getElementById('popup-description');
        const price = document.getElementById('popup-price');
        
        img.src = `foto/${product.codice}.png`;
        img.alt = product.articolo;
        title.textContent = product.articolo;
        description.textContent = product.descrizione || '';
        price.textContent = `€ ${product.prezzo || 'N/A'}`;
        
        popup.style.display = 'flex';
    }

    closePopup() {
        const popup = document.getElementById('product-popup');
        popup.style.display = 'none';
    }


}

// Inizializza il visualizzatore prodotti quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
    new ProductViewer();
});