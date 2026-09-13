import React, { useState } from 'react';
import { importDeliveriesFromExcel } from '../../Service/ExcelImportService';
import toast from 'react-hot-toast';
import './ExcelImport.css';

/**
 * Excel/CSV import for incoming stock (deliveries).
 * Columns: Barcode | Quantity | Unit Cost | Item Name (optional)
 */
const DeliveryExcelImport = ({ onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [meta, setMeta] = useState({
        supplierName: '',
        referenceNumber: '',
        deliveryDate: new Date().toISOString().slice(0, 10),
        notes: '',
        postImmediately: false
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        const fileName = selectedFile.name.toLowerCase();
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.csv')) {
            setFile(selectedFile);
            setImportResult(null);
        } else {
            toast.error('Моля изберете Excel (.xlsx) или CSV файл');
            setFile(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Моля изберете файл за импорт');
            return;
        }
        setLoading(true);
        try {
            const result = await importDeliveriesFromExcel(file, meta);
            setImportResult(result);
            if (result.successfulImports > 0) {
                toast.success(
                    meta.postImmediately
                        ? `Доставката е заредена в склада (${result.successfulImports} реда)`
                        : `Създадена чернова ${result.deliveryId || ''} (${result.successfulImports} реда)`
                );
                if (onImportComplete) onImportComplete(result);
            }
            if (result.failedImports > 0) {
                toast.error(`${result.failedImports} реда с грешки`);
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Грешка при импорт на доставка');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const templateData = [
            ['Баркод', 'Количество', 'Доставна цена', 'Име (опционално)'],
            ['1234567890124', '24', '1.10', 'Мляко'],
            ['1234567890128', '12', '0.85', 'Кока Кола']
        ];
        const BOM = '\uFEFF';
        const csvContent = BOM + templateData.map(row =>
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'template_delivery.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="excel-import-container">
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">Файл и данни за доставката</h5>
                </div>
                <div className="card-body">
                    <div className="row g-2 mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Доставчик</label>
                            <input
                                className="form-control"
                                value={meta.supplierName}
                                onChange={(e) => setMeta(prev => ({ ...prev, supplierName: e.target.value }))}
                                placeholder="Име на доставчик"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Номер / референция</label>
                            <input
                                className="form-control"
                                value={meta.referenceNumber}
                                onChange={(e) => setMeta(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                placeholder="Фактура / ЛК"
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Дата</label>
                            <input
                                type="date"
                                className="form-control"
                                value={meta.deliveryDate}
                                onChange={(e) => setMeta(prev => ({ ...prev, deliveryDate: e.target.value }))}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Бележки</label>
                            <input
                                className="form-control"
                                value={meta.notes}
                                onChange={(e) => setMeta(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Опционално"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Excel (.xlsx) или CSV файл</label>
                        <input
                            type="file"
                            className="form-control"
                            accept=".xlsx,.csv"
                            onChange={handleFileChange}
                        />
                        {file && (
                            <small className="text-muted d-block mt-1">
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </small>
                        )}
                    </div>

                    <div className="form-check mb-3">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="postImmediately"
                            checked={meta.postImmediately}
                            onChange={(e) => setMeta(prev => ({ ...prev, postImmediately: e.target.checked }))}
                        />
                        <label className="form-check-label" htmlFor="postImmediately">
                            Зареди веднага в склада (иначе се създава чернова)
                        </label>
                    </div>

                    <div className="mb-3">
                        <button
                            className="btn btn-primary me-2"
                            onClick={handleImport}
                            disabled={!file || loading}
                        >
                            {loading ? 'Импортиране...' : 'Импортирай доставка'}
                        </button>
                        <button type="button" className="btn btn-outline-secondary" onClick={downloadTemplate}>
                            Изтегли CSV шаблон
                        </button>
                    </div>

                    {importResult && (
                        <div className="import-result">
                            <h6>Резултат:</h6>
                            <p className="mb-2">{importResult.message}</p>
                            {importResult.deliveryId && (
                                <p className="mb-2"><code>{importResult.deliveryId}</code></p>
                            )}
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="stat-card">
                                        <div className="stat-number">{importResult.totalRows}</div>
                                        <div className="stat-label">Редове</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="stat-card success">
                                        <div className="stat-number">{importResult.successfulImports}</div>
                                        <div className="stat-label">Успешни</div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="stat-card error">
                                        <div className="stat-number">{importResult.failedImports}</div>
                                        <div className="stat-label">Грешки</div>
                                    </div>
                                </div>
                            </div>
                            {importResult.errors?.length > 0 && (
                                <ul className="error-list mt-3">
                                    {importResult.errors.map((err, i) => (
                                        <li key={i} className="text-danger">{err}</li>
                                    ))}
                                </ul>
                            )}
                            {importResult.warnings?.length > 0 && (
                                <ul className="warning-list mt-2">
                                    {importResult.warnings.map((w, i) => (
                                        <li key={i} className="text-warning">{w}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="mt-4 instructions">
                        <h6>Колони във файла (първи ред = заглавия):</h6>
                        <ol>
                            <li><strong>Баркод</strong> — задължително, артикулът трябва вече да съществува</li>
                            <li><strong>Количество</strong> — задължително, &gt; 0</li>
                            <li><strong>Доставна цена</strong> — задължително, &gt; 0 (€ за единица)</li>
                            <li><strong>Име</strong> — опционално (само за проверка)</li>
                        </ol>
                        <p className="mb-0 text-muted small">
                            Неизвестен баркод = грешка за реда. Баркодовете по-добре като текст в Excel, за да не се губят водещи нули.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliveryExcelImport;
