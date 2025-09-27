import React from 'react';
import ExcelImport from '../../components/ExcelImport/ExcelImport';
import './ExcelImportPage.css';

const ExcelImportPage = () => {
    return (
        <div className="excel-import-page">
            <div className="page-header">
                <h2>📊 Импорт на продукти от Excel</h2>
                <p className="text-muted">Качете Excel файл за масов импорт на продукти в системата</p>
            </div>
            <ExcelImport />
        </div>
    );
};

export default ExcelImportPage;
