import axios from 'axios';
import JsBarcode from 'jsbarcode';
import { formatMoney } from '../util/formatMoney.js';
import { formatUnitLabel } from '../util/unitOfMeasure.js';

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

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const LabelService = {
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

    formatPrice: (price) => formatMoney(price),

    formatDate: (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('bg-BG');
    },

    formatUnit: (unitOfMeasure) => formatUnitLabel(unitOfMeasure),

    /**
     * Build scannable barcode SVG (EAN-13 when possible, else CODE128).
     */
    generateBarcodeSvg: (barcode, { displayValue = true, height = 32 } = {}) => {
        const value = String(barcode ?? '').trim();
        if (!value) {
            return '<div class="item-barcode-missing">Няма баркод</div>';
        }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const isEan13 = /^\d{13}$/.test(value);
        const common = {
            width: 1.15,
            height,
            displayValue,
            fontSize: 10,
            textMargin: 1,
            margin: 0,
            background: '#ffffff',
            lineColor: '#000000'
        };

        try {
            JsBarcode(svg, value, {
                ...common,
                format: isEan13 ? 'EAN13' : 'CODE128'
            });
        } catch (_) {
            try {
                JsBarcode(svg, value, {
                    ...common,
                    format: 'CODE128',
                    width: 1.2
                });
            } catch {
                return `<div class="item-barcode">${escapeHtml(value)}</div>`;
            }
        }

        svg.setAttribute('class', 'item-barcode-svg');
        svg.setAttribute('aria-label', `barcode ${value}`);
        return svg.outerHTML;
    },

    generatePriceLabelHTML: (item) => {
        const barcodeSvg = LabelService.generateBarcodeSvg(item.barcode);
        const unitText = LabelService.formatUnit(item.unitOfMeasure);
        return `
            <div class="price-label">
                <div class="item-name">${escapeHtml(item.name || 'Продукт')}</div>
                <div class="item-price-row">
                    <span class="item-price">${LabelService.formatPrice(item.price)}</span>
                    <span class="item-unit">${escapeHtml(unitText)}</span>
                </div>
                <div class="item-barcode-wrap">${barcodeSvg}</div>
            </div>
        `;
    },

    generateShelfLabelHTML: (category) => {
        return `
            <div class="shelf-label">
                <div class="category-name">${escapeHtml(category.name || 'Категория')}</div>
                <div class="promotion-text">${escapeHtml(category.promotion || '')}</div>
                <div class="promotion-dates">${category.promoStart ? LabelService.formatDate(category.promoStart) : ''} - ${category.promoEnd ? LabelService.formatDate(category.promoEnd) : ''}</div>
            </div>
        `;
    },

    generatePromoLabelHTML: (item) => {
        const barcodeSvg = item.barcode ? LabelService.generateBarcodeSvg(item.barcode) : '';
        const unitText = LabelService.formatUnit(item.unitOfMeasure);
        return `
            <div class="promo-label">
                <div class="item-name">${escapeHtml(item.name || 'Продукт')}</div>
                <div class="old-price">${LabelService.formatPrice(item.oldPrice)}</div>
                <div class="item-price-row">
                    <span class="new-price">${LabelService.formatPrice(item.newPrice)}</span>
                    <span class="item-unit">${escapeHtml(unitText)}</span>
                </div>
                <div class="promo-badge">ПРОМОЦИЯ</div>
                ${barcodeSvg ? `<div class="item-barcode-wrap">${barcodeSvg}</div>` : ''}
            </div>
        `;
    },

    /**
     * Self-contained HTML export with name, price, unit, barcode number + graphic.
     */
    downloadLabelsFile: (items, options = {}) => {
        if (!items || items.length === 0) {
            throw new Error('Няма продукти за файл');
        }

        const title = options.title || 'Етикети';
        const generatedAt = new Date().toLocaleString('bg-BG');
        const cards = items.map((item) => {
            const barcode = String(item.barcode ?? '').trim();
            const unitShort = formatUnitLabel(item.unitOfMeasure);
            const barcodeSvg = LabelService.generateBarcodeSvg(barcode, {
                displayValue: false,
                height: 40
            });
            return `
            <article class="export-card">
                <h2 class="export-name">${escapeHtml(item.name || 'Продукт')}</h2>
                <div class="export-price-row">
                    <span class="export-price">${LabelService.formatPrice(item.price)}</span>
                    <span class="export-unit"><strong>${escapeHtml(unitShort)}</strong></span>
                </div>
                <div class="export-barcode-num"><code>${escapeHtml(barcode || '—')}</code></div>
                <div class="export-barcode-graphic">${barcodeSvg}</div>
            </article>`;
        }).join('\n');

        const html = `<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 24px; background: #f5f5f5; color: #111; }
  header { margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #333; }
  header h1 { margin: 0 0 6px; font-size: 22px; }
  header p { margin: 0; font-size: 13px; color: #444; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  .export-card {
    background: #fff; border: 1px solid #222; border-radius: 4px; padding: 12px;
    page-break-inside: avoid; break-inside: avoid;
  }
  .export-name { font-size: 14px; margin: 0 0 8px; line-height: 1.25; min-height: 2.5em; }
  .export-price-row { display: flex; align-items: baseline; justify-content: center; gap: 6px; margin-bottom: 6px; }
  .export-price { font-size: 18px; font-weight: bold; color: #c62828; }
  .export-unit { font-size: 13px; color: #333; }
  .export-barcode-num { font-size: 11px; margin-bottom: 8px; }
  .export-barcode-num code { font-family: "Courier New", monospace; font-size: 12px; }
  .export-barcode-graphic { text-align: center; background: #fff; padding: 4px 0; }
  .export-barcode-graphic svg { max-width: 100%; height: auto; }
  @media print {
    body { background: #fff; padding: 8px; }
    header { margin-bottom: 12px; }
  }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(title)}</h1>
    <p>Дата: ${escapeHtml(generatedAt)} · Продукти: ${items.length}</p>
  </header>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = options.filename || `etiketi-${dateStamp}.html`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true, count: items.length };
    },

    renderBarcodesInDocument: (doc) => {
        const nodes = doc.querySelectorAll('svg.jsbarcode[data-barcode], svg[data-barcode]');
        nodes.forEach((svg) => {
            const value = (svg.getAttribute('data-barcode') || '').trim();
            if (!value) return;
            const isEan13 = /^\d{13}$/.test(value);
            try {
                JsBarcode(svg, value, {
                    format: isEan13 ? 'EAN13' : 'CODE128',
                    width: 1.15,
                    height: 32,
                    displayValue: true,
                    fontSize: 10,
                    textMargin: 1,
                    margin: 0,
                    background: '#ffffff',
                    lineColor: '#000000'
                });
            } catch (_) {
                try {
                    JsBarcode(svg, value, {
                        format: 'CODE128',
                        width: 1.2,
                        height: 32,
                        displayValue: true,
                        fontSize: 10,
                        margin: 0
                    });
                } catch {
                    svg.replaceWith(doc.createTextNode(value));
                }
            }
        });
    },

    printLabels: (htmlContent, labelType = 'labels') => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            console.error('Popup blocked — cannot open print window');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Печат на ${escapeHtml(labelType)}</title>
                <link rel="stylesheet" href="/src/components/Labels/LabelTemplates.css">
                <style>
                    body { margin: 0; padding: 10px; background: #fff; }
                    .price-label {
                        width: 40mm;
                        height: 30mm;
                        border: 1px solid #000;
                        padding: 1.5mm;
                        font-family: Arial, sans-serif;
                        background: #fff;
                        display: inline-block;
                        margin: 1mm;
                        box-sizing: border-box;
                        page-break-inside: avoid;
                        vertical-align: top;
                        overflow: hidden;
                    }
                    .price-label .item-name {
                        font-size: 7pt;
                        font-weight: bold;
                        text-align: center;
                        line-height: 1.1;
                        max-height: 5.5mm;
                        overflow: hidden;
                        margin-bottom: 0.4mm;
                    }
                    .price-label .item-price-row {
                        display: flex;
                        align-items: baseline;
                        justify-content: center;
                        gap: 3px;
                        margin-bottom: 0.4mm;
                    }
                    .price-label .item-price {
                        font-size: 9pt;
                        font-weight: bold;
                        text-align: center;
                        color: #d32f2f;
                    }
                    .price-label .item-unit {
                        font-size: 6pt;
                        color: #333;
                        text-transform: none;
                    }
                    .promo-label .item-price-row {
                        display: flex;
                        align-items: baseline;
                        justify-content: center;
                        gap: 3px;
                    }
                    .promo-label .item-unit { font-size: 6pt; color: #333; }
                    .item-barcode-wrap { text-align: center; line-height: 0; }
                    .item-barcode-svg { max-width: 100%; height: auto; }
                    .item-barcode, .item-barcode-missing {
                        font-size: 6pt;
                        text-align: center;
                        font-family: 'Courier New', monospace;
                    }
                    .promo-label .item-barcode-wrap { margin-top: 1mm; }
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

        setTimeout(() => {
            try {
                LabelService.renderBarcodesInDocument(printWindow.document);
            } catch (e) {
                console.warn('Barcode render in print window failed:', e);
            }
            printWindow.focus();
            printWindow.print();
        }, 400);
    }
};

export default LabelService;
