import axios from 'axios';

const API_BASE_URL = 'http://localhost:8087';

const createAuthInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};

const LabelService = {
    // Печат на ценови етикети
    printPriceLabels: async (items) => {
        console.log('=== LabelService.printPriceLabels called ===');
        console.log('Items to print:', items);
        
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/api/v1.0/admin/labels/price-labels', items);
            console.log('Price labels printed successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error printing price labels:', error);
            throw error;
        }
    },

    // Печат на рафтови етикети
    printShelfLabels: async (categories) => {
        console.log('=== LabelService.printShelfLabels called ===');
        console.log('Categories to print:', categories);
        
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/api/v1.0/admin/labels/shelf-labels', categories);
            console.log('Shelf labels printed successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error printing shelf labels:', error);
            throw error;
        }
    },

    // Печат на промо етикети
    printPromoLabels: async (promoItems) => {
        console.log('=== LabelService.printPromoLabels called ===');
        console.log('Promo items to print:', promoItems);
        
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/api/v1.0/admin/labels/promo-labels', promoItems);
            console.log('Promo labels printed successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error printing promo labels:', error);
            throw error;
        }
    },

    // Масов печат на всички продукти
    bulkPrintAllItems: async (categoryId = null) => {
        console.log('=== LabelService.bulkPrintAllItems called ===');
        console.log('Category ID:', categoryId);
        
        const instance = createAuthInstance();
        try {
            const url = categoryId 
                ? `/api/v1.0/admin/labels/bulk-print?categoryId=${categoryId}`
                : '/api/v1.0/admin/labels/bulk-print';
            const response = await instance.post(url);
            console.log('Bulk print completed successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in bulk print:', error);
            throw error;
        }
    },

    // Предварителен преглед на етикет
    previewLabel: async (labelData) => {
        console.log('=== LabelService.previewLabel called ===');
        console.log('Label data:', labelData);
        
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/api/v1.0/admin/labels/preview', labelData);
            console.log('Label preview generated successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error generating label preview:', error);
            throw error;
        }
    },

    // Получаване на налични етикет шаблони
    getLabelTemplates: async () => {
        console.log('=== LabelService.getLabelTemplates called ===');
        
        const instance = createAuthInstance();
        try {
            const response = await instance.get('/api/v1.0/admin/labels/templates');
            console.log('Label templates loaded successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error loading label templates:', error);
            throw error;
        }
    },

    // Утилити функции за форматиране
    formatPrice: (price) => {
        return new Intl.NumberFormat('bg-BG', { 
            style: 'currency', 
            currency: 'BGN' 
        }).format(price || 0);
    },

    formatDate: (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('bg-BG');
    },

    // Генериране на HTML за етикети
    generatePriceLabelHTML: (item) => {
        return `
            <div class="price-label">
                <div class="item-name">${item.name || 'Продукт'}</div>
                <div class="item-price">${LabelService.formatPrice(item.price)}</div>
                <div class="item-barcode">${item.barcode || ''}</div>
            </div>
        `;
    },

    generateShelfLabelHTML: (category) => {
        return `
            <div class="shelf-label">
                <div class="category-name">${category.name || 'Категория'}</div>
                <div class="promotion-text">${category.promotion || ''}</div>
                <div class="promotion-dates">${category.promoStart ? LabelService.formatDate(category.promoStart) : ''} - ${category.promoEnd ? LabelService.formatDate(category.promoEnd) : ''}</div>
            </div>
        `;
    },

    generatePromoLabelHTML: (item) => {
        return `
            <div class="promo-label">
                <div class="item-name">${item.name || 'Продукт'}</div>
                <div class="old-price">${LabelService.formatPrice(item.oldPrice)}</div>
                <div class="new-price">${LabelService.formatPrice(item.newPrice)}</div>
                <div class="promo-badge">ПРОМОЦИЯ</div>
            </div>
        `;
    },

    // Печат на HTML етикети
    printLabels: (htmlContent, labelType = 'labels') => {
        console.log('=== LabelService.printLabels called ===');
        console.log('Label type:', labelType);
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Печат на ${labelType}</title>
                <link rel="stylesheet" href="/src/components/Labels/LabelTemplates.css">
                <style>
                    body { margin: 0; padding: 10px; }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <div class="label-print-area">
                    ${htmlContent}
                </div>
                <div class="no-print" style="text-align: center; margin-top: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #ffc107; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
                        Печат
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; margin-left: 10px;">
                        Затвори
                    </button>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Автоматично отваряне на print dialog
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};

export default LabelService;
