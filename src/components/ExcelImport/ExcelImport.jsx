import React, { useState } from 'react';
import { importProductsFromExcel } from '../../Service/ExcelImportService';
import toast from 'react-hot-toast';
import './ExcelImport.css';

const ExcelImport = ({ onImportComplete }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importResult, setImportResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const fileName = selectedFile.name.toLowerCase();
            const fileType = selectedFile.type;
            
            if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                fileType === 'text/csv' ||
                fileType === 'application/csv' ||
                fileName.endsWith('.xlsx') ||
                fileName.endsWith('.csv')) {
                setFile(selectedFile);
                setImportResult(null);
            } else {
                toast.error('Моля изберете Excel (.xlsx) или CSV файл');
                setFile(null);
            }
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Моля изберете файл за импорт');
            return;
        }

        setLoading(true);
        try {
            const result = await importProductsFromExcel(file);
            setImportResult(result);
            
            if (result.successfulImports > 0) {
                toast.success(`Успешно импортирани ${result.successfulImports} продукта`);
                if (onImportComplete) {
                    onImportComplete();
                }
            }
            
            if (result.failedImports > 0) {
                toast.error(`${result.failedImports} продукта не бяха импортирани`);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Грешка при импорт на продукти');
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        // Create a simple CSV template for download with proper encoding
        const templateData = [
            ['Име на категория', 'Описание на категория', 'Име на продукт', 'Описание на продукт', 'Баркод', 'ДДС ставка', 'Цена', 'Количество'],
            ['Млечни продукти', 'Млечни продукти и яйца', 'Мляко 1л', 'Пълномаслено мляко', '1234567890123', '0.20', '2.50', '100'],
            ['Хлебни изделия', 'Хляб и хлебни изделия', 'Хляб бял', 'Свеж бял хляб', '2345678901234', '0.20', '1.20', '50']
        ];

        // Add BOM (Byte Order Mark) for UTF-8 to ensure proper encoding in Excel
        const BOM = '\uFEFF';
        const csvContent = BOM + templateData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'template_products.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="excel-import-container">
            <div className="card">
                <div className="card-header">
                    <h5>📊 Импорт на продукти от Excel</h5>
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <label htmlFor="excelFile" className="form-label">
                            Изберете Excel (.xlsx) или CSV файл
                        </label>
                        <input
                            type="file"
                            className="form-control"
                            id="excelFile"
                            accept=".xlsx,.csv"
                            onChange={handleFileChange}
                        />
                        {file && (
                            <div className="mt-2">
                                <small className="text-muted">
                                    Избран файл: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </small>
                            </div>
                        )}
                    </div>

                    <div className="mb-3">
                        <button
                            className="btn btn-primary me-2"
                            onClick={handleImport}
                            disabled={!file || loading}
                        >
                            {loading ? 'Импортиране...' : 'Импортирай продукти'}
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={downloadTemplate}
                        >
                            📥 Изтегли CSV шаблон
                        </button>
                    </div>

                    {importResult && (
                        <div className="import-result">
                            <h6>Резултат от импорта:</h6>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="stat-card">
                                        <div className="stat-number">{importResult.totalRows}</div>
                                        <div className="stat-label">Общо редове</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card success">
                                        <div className="stat-number">{importResult.successfulImports}</div>
                                        <div className="stat-label">Успешни</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card error">
                                        <div className="stat-number">{importResult.failedImports}</div>
                                        <div className="stat-label">Неуспешни</div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="stat-card">
                                        <div className="stat-number">
                                            {importResult.totalRows > 0 ? 
                                                Math.round((importResult.successfulImports / importResult.totalRows) * 100) : 0}%
                                        </div>
                                        <div className="stat-label">Успех</div>
                                    </div>
                                </div>
                            </div>

                            {importResult.errors && importResult.errors.length > 0 && (
                                <div className="mt-3">
                                    <h6 className="text-danger">Грешки:</h6>
                                    <ul className="error-list">
                                        {importResult.errors.map((error, index) => (
                                            <li key={index} className="text-danger">{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {importResult.warnings && importResult.warnings.length > 0 && (
                                <div className="mt-3">
                                    <h6 className="text-warning">Предупреждения:</h6>
                                    <ul className="warning-list">
                                        {importResult.warnings.map((warning, index) => (
                                            <li key={index} className="text-warning">{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-4">
                        <h6>Инструкции за Excel/CSV файла:</h6>
                        <div className="instructions">
                            <p>Excel (.xlsx) или CSV файлът трябва да съдържа следните колони (в този ред):</p>
                            <ol>
                                <li><strong>Име на категория</strong> - Име на категорията (задължително)</li>
                                <li><strong>Описание на категория</strong> - Описание на категорията (опционално)</li>
                                <li><strong>Име на продукт</strong> - Име на продукта (задължително)</li>
                                <li><strong>Описание на продукт</strong> - Описание на продукта (опционално)</li>
                                <li><strong>Баркод</strong> - Баркод на продукта (опционално)</li>
                                <li><strong>ДДС ставка</strong> - ДДС ставка (0.20, 0.09, 0.00) (опционално, по подразбиране 0.20)</li>
                                <li><strong>Цена</strong> - Продажна цена на продукта (задължително)</li>
                                <li><strong>Количество</strong> - Начално количество в склада (опционално, по подразбиране 0)</li>
                                <li><strong>Доставна цена</strong> - Последна/начална доставна цена (опционално)</li>
                            </ol>
                            <p><strong>Забележка:</strong> Първият ред трябва да съдържа заглавията на колоните.</p>
                            <div className="alert alert-info mt-3">
                                <h6>📋 Инструкции за отваряне на CSV файла в Excel:</h6>
                                <ol>
                                    <li><strong>Отворете Excel</strong></li>
                                    <li><strong>Файл → Отвори</strong> (File → Open)</li>
                                    <li><strong>Изберете CSV файла</strong></li>
                                    <li><strong>В прозореца "Текстов импорт"</strong> изберете:
                                        <ul>
                                            <li>Кодиране: <strong>UTF-8</strong></li>
                                            <li>Разделител: <strong>Запетая (,)</strong></li>
                                        </ul>
                                    </li>
                                    <li><strong>Натиснете "Готово"</strong></li>
                                </ol>
                                <p><strong>Алтернативно:</strong> Можете да отворите CSV файла директно в Excel, но ако видите странни символи, използвайте горните стъпки.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExcelImport;
