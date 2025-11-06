import axios from 'axios';

const API_BASE_URL = '/api';

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
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/admin/labels/price-labels', items);
            return response.data;
        } catch (error) {
            console.error('Error printing price labels:', error);
            throw error;
        }
    },

    // Печат на рафтови етикети
    printShelfLabels: async (categories) => {
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/admin/labels/shelf-labels', categories);
            return response.data;
        } catch (error) {
            console.error('Error printing shelf labels:', error);
            throw error;
        }
    },

    // Печат на промо етикети
    printPromoLabels: async (promoItems) => {
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/admin/labels/promo-labels', promoItems);
            return response.data;
        } catch (error) {
            console.error('Error printing promo labels:', error);
            throw error;
        }
    },

    // Масов печат на всички продукти
    bulkPrintAllItems: async (categoryId = null) => {
        const instance = createAuthInstance();
        try {
            const url = categoryId 
                ? `/admin/labels/bulk-print?categoryId=${categoryId}`
                : '/admin/labels/bulk-print';
            const response = await instance.post(url);
            return response.data;
        } catch (error) {
            console.error('Error in bulk print:', error);
            throw error;
        }
    },

    // Предварителен преглед на етикет
    previewLabel: async (labelData) => {
        const instance = createAuthInstance();
        try {
            const response = await instance.post('/admin/labels/preview', labelData);
            return response.data;
        } catch (error) {
            console.error('Error generating label preview:', error);
            throw error;
        }
    },

    // Получаване на налични етикет шаблони
    getLabelTemplates: async () => {
        const instance = createAuthInstance();
        try {
            const response = await instance.get('/admin/labels/templates');
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
