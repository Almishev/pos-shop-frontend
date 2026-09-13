import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ExcelImport from '../../components/ExcelImport/ExcelImport';
import DeliveryExcelImport from '../../components/ExcelImport/DeliveryExcelImport';
import './ExcelImportPage.css';

const ExcelImportPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const tabParam = searchParams.get('tab') === 'deliveries' ? 'deliveries' : 'products';
    const [tab, setTab] = useState(tabParam);

    useEffect(() => {
        setTab(tabParam);
    }, [tabParam]);

    const selectTab = (next) => {
        setTab(next);
        setSearchParams(next === 'deliveries' ? { tab: 'deliveries' } : {});
    };

    return (
        <div className="excel-import-page">
            <div className="page-header">
                <h2>Импорт от Excel</h2>
                <p className="text-muted">
                    {tab === 'products'
                        ? 'Масов импорт на продукти в каталога'
                        : 'Масов импорт на входяща стока (доставка)'}
                </p>
            </div>

            <ul className="nav nav-tabs excel-import-tabs mb-3">
                <li className="nav-item">
                    <button
                        type="button"
                        className={`nav-link excel-tab-btn ${tab === 'products' ? 'active' : ''}`}
                        onClick={() => selectTab('products')}
                    >
                        Продукти
                    </button>
                </li>
                <li className="nav-item">
                    <button
                        type="button"
                        className={`nav-link excel-tab-btn ${tab === 'deliveries' ? 'active' : ''}`}
                        onClick={() => selectTab('deliveries')}
                    >
                        Доставки / стока
                    </button>
                </li>
            </ul>

            {tab === 'products' ? (
                <ExcelImport />
            ) : (
                <DeliveryExcelImport
                    onImportComplete={() => navigate('/deliveries')}
                />
            )}
        </div>
    );
};

export default ExcelImportPage;
