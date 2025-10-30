import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { exportOrdersReport, getCashierSummaries } from "../../Service/ReportService.js";
import FiscalService from '../../Service/FiscalService';
import CashDrawerService from '../../Service/CashDrawerService';
import { fetchUsers } from '../../Service/UserService.js';
import { AppContext } from '../../context/AppContext.jsx';
import './Reports.css';

const UnifiedReports = () => {
    const { auth } = useContext(AppContext);
    const isAdmin = (auth?.role || '').toUpperCase() === 'ROLE_ADMIN';
    
    // Common state
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeTab, setActiveTab] = useState(isAdmin ? 'export' : 'fiscal');
    
    // Export reports state
    const [exporting, setExporting] = useState(false);
    const [cashierLoading, setCashierLoading] = useState(false);
    const [cashierRows, setCashierRows] = useState([]);
    
    // Fiscal reports state
    const [reports, setReports] = useState([]);
    const [devices, setDevices] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('');
    const [showReportDetails, setShowReportDetails] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0],
        cashierName: '',
        deviceSerialNumber: '',
        notes: ''
    });
    const [activeSession, setActiveSession] = useState(null);

    // When role is USER, prefill cashierName with logged-in email
    useEffect(() => {
        if (auth.role === 'ROLE_USER') {
            setFormData(prev => ({...prev, cashierName: auth.name || ''}));
        }
    }, [auth.role, auth.name]);

    useEffect(() => {
        if (activeTab === 'fiscal') {
            console.log('=== FISCAL TAB ACTIVATED ===');
            console.log('Current users state:', users);
            console.log('Current loading state:', loading);
            loadFiscalData();
            loadUsers(); // Load users separately
            // Prefill device from active cashier session
            preloadActiveSession();
        }
    }, [activeTab]);

    // Ensure non-admin users cannot access the export/cashiers tabs if role changes
    useEffect(() => {
        if (!isAdmin && (activeTab === 'export' || activeTab === 'cashiers')) {
            setActiveTab('fiscal');
        }
    }, [isAdmin]);

    useEffect(() => {
        if (activeTab === 'cashiers') {
            loadCashierSummaries();
        }
    }, [activeTab, dateFrom, dateTo]);

    const loadFiscalData = async () => {
        try {
            console.log('=== UnifiedReports.loadFiscalData called ===');
            setLoading(true);
            
            // Load devices first - filter only ACTIVE devices
            const allDevices = await FiscalService.getAllDevices();
            const activeDevices = allDevices.filter(device => device.status === 'ACTIVE');
            setDevices(activeDevices);
            console.log('Loaded active devices for reports:', activeDevices);
            
            // Allow both ADMIN and USER to see reports
            console.log('=== UnifiedReports.loadFiscalData - calling getAllReports ===');
            const reportsData = await FiscalService.getAllReports();
            console.log('UnifiedReports - Loaded reports:', reportsData);
            console.log('UnifiedReports - Reports data type:', typeof reportsData);
            console.log('UnifiedReports - Reports data length:', reportsData?.length);
            // If not admin, show only today's generated reports
            const todayStr = new Date().toISOString().split('T')[0];
            const visible = isAdmin ? (reportsData || []) : (reportsData || []).filter(r => {
                const baseDate = r.generatedAt || r.reportDate;
                if (!baseDate) return false;
                const repStr = new Date(baseDate).toISOString().split('T')[0];
                return repStr === todayStr;
            });

            // Sort newest first by generatedAt (fallback by id)
            const sorted = visible.slice().sort((a, b) => {
                const da = a.generatedAt ? new Date(a.generatedAt).getTime() : 0;
                const db = b.generatedAt ? new Date(b.generatedAt).getTime() : 0;
                if (db !== da) return db - da;
                return (b.id || 0) - (a.id || 0);
            });
            setReports(sorted);
            console.log('UnifiedReports - Reports state updated');
        } catch (error) {
            toast.error('Грешка при зареждане на данни');
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            console.log('UnifiedReports - Loading finished');
        }
    };

    const loadUsers = async () => {
        if (auth.role === 'ROLE_ADMIN') {
            try {
                console.log('=== FETCHING USERS DEBUG ===');
                console.log('Auth token:', localStorage.getItem('token'));
                console.log('Auth role:', auth.role);
                
                const response = await fetchUsers();
                console.log('Users response:', response);
                console.log('Users response.data:', response.data);
                
                // Use the same logic as ManageUsers.jsx
                setUsers(response.data);
                console.log('✅ Successfully loaded users:', response.data);
                console.log('✅ Users count:', response.data?.length || 0);
            } catch (error) {
                console.error('❌ Error fetching users:', error);
                console.error('❌ Error response:', error.response);
                console.error('❌ Error status:', error.response?.status);
                toast.error("Неуспешно зареждане на потребители");
                setUsers([]);
            }
        } else {
            setUsers([]);
        }
    };

    const preloadActiveSession = async () => {
        try {
            const session = await CashDrawerService.getActiveSession();
            setActiveSession(session);
            if (session?.deviceSerialNumber) {
                setFormData(prev => ({
                    ...prev,
                    deviceSerialNumber: session.deviceSerialNumber,
                    cashierName: auth.role === 'ROLE_USER' ? (auth.name || prev.cashierName) : prev.cashierName
                }));
            }
        } catch (e) {
            // No active session – leave device empty
            setActiveSession(null);
        }
    };

    const handleExport = async () => {
        if (!dateFrom || !dateTo) {
            toast.error('Моля, изберете начална и крайна дата');
            return;
        }

        if (new Date(dateFrom) > new Date(dateTo)) {
            toast.error('Началната дата не може да бъде по-късна от крайната');
            return;
        }

        try {
            setExporting(true);
            const response = await exportOrdersReport(dateFrom, dateTo);
            toast.success(`Отчетът е генериран: ${response.data}`);
        } catch (error) {
            toast.error('Грешка при генериране на отчета');
            console.error('Export error:', error);
        } finally {
            setExporting(false);
        }
    };

    const loadCashierSummaries = async () => {
        if (!dateFrom || !dateTo) return;
        if (new Date(dateFrom) > new Date(dateTo)) return;
        try {
            setCashierLoading(true);
            const res = await getCashierSummaries(dateFrom, dateTo);
            setCashierRows(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setCashierLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            reportDate: new Date().toISOString().split('T')[0],
            cashierName: '',
            deviceSerialNumber: '',
            notes: ''
        });
        setSelectedReportType('');
        setShowGenerateForm(false);
    };

    const generateFiscalReport = async (e) => {
        e.preventDefault();
        
        if (!selectedReportType) {
            toast.error('Моля, изберете тип отчет');
            return;
        }

        try {
            let result;
            if (auth.role !== 'ROLE_ADMIN') {
                if (selectedReportType !== 'SHIFT') {
                    toast.error('Само сменен отчет е разрешен за касиер');
                    return;
                }
                const payload = { ...formData, cashierName: undefined };
                result = await FiscalService.generateShiftReport(payload);
            } else {
                switch (selectedReportType) {
                    case 'STORE_DAILY':
                        result = await FiscalService.generateStoreDailyReport(formData);
                        break;
                    case 'DAILY':
                        result = await FiscalService.generateDailyReport(formData);
                        break;
                    case 'SHIFT':
                        result = await FiscalService.generateShiftReport(formData);
                        break;
                    case 'MONTHLY':
                        result = await FiscalService.generateMonthlyReport(formData);
                        break;
                    case 'YEARLY':
                        result = await FiscalService.generateYearlyReport(formData);
                        break;
                    default:
                        toast.error('Невалиден тип отчет');
                        return;
                }
            }
            
            console.log('UnifiedReports - Generated report result:', result);
            toast.success('Отчетът е генериран успешно');
            resetForm();
            console.log('UnifiedReports - About to reload fiscal data...');
            await loadFiscalData();
            console.log('UnifiedReports - Fiscal data reloaded after generation');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при генериране на отчет');
            console.error('Error generating report:', error);
        }
    };

    const sendReportToNAF = async (reportId) => {
        if (window.confirm('Сигурни ли сте, че искате да изпратите този отчет към НАП?')) {
            try {
                await FiscalService.sendReportToNAF(reportId);
                toast.success('Отчетът е изпратен към НАП');
                loadFiscalData();
            } catch (error) {
                toast.error('Грешка при изпращане към НАП');
                console.error('Error sending report:', error);
            }
        }
    };

    const showReportDetailsModal = (report) => {
        setSelectedReport(report);
        setShowReportDetails(true);
    };

    const downloadReport = async (report) => {
        try {
            // Localize labels and create a simple text report for download
            const typeToBg = {
                DAILY: 'Дневен отчет',
                SHIFT: 'Сменен отчет',
                MONTHLY: 'Месечен отчет',
                YEARLY: 'Годишен отчет',
                STORE_DAILY: 'Общ дневен отчет',
                Z_REPORT: 'Z-отчет',
                X_REPORT: 'X-отчет'
            };
            const statusToBg = {
                GENERATED: 'ГЕНЕРИРАН',
                SENT_TO_NAF: 'ИЗПРАТЕН КЪМ НАП',
                CONFIRMED: 'ПОТВЪРДЕН',
                ERROR: 'ГРЕШКА'
            };
            const typeLabel = typeToBg[report.reportType] || report.reportType;
            const statusLabel = statusToBg[report.status] || report.status;
            // Payment breakdown (if present)
            let pb = null;
            try { if (report.paymentBreakdown) pb = JSON.parse(report.paymentBreakdown); } catch(e) { pb = null; }
            const paymentsTxt = pb ? `\n\nПЛАЩАНИЯ\n==========\nВ БРОЙ: ${formatCurrency(pb.CASH?.total)}\nС КАРТА: ${formatCurrency(pb.CARD?.total)}\nСМЕСЕНО: ${formatCurrency(pb.SPLIT?.total)} (в брой ${formatCurrency(pb.SPLIT?.cash)}, карта ${formatCurrency(pb.SPLIT?.card)})\nОБЩО В БРОЙ: ${formatCurrency(((pb.CASH?.total || 0) + (pb.SPLIT?.cash || 0)))}\nОБЩО С КАРТА: ${formatCurrency(((pb.CARD?.total || 0) + (pb.SPLIT?.card || 0)))}\n` : '';
            const reportContent = `
ФИСКАЛЕН ОТЧЕТ
================
Номер на отчет: ${report.reportNumber}
Тип: ${typeLabel}
Дата: ${new Date(report.reportDate).toLocaleDateString('bg-BG')}
Касиер: ${report.cashierName || 'Неизвестен'}
Устройство: ${report.deviceSerialNumber || 'Неизвестно'}

СТАТИСТИКА
==========
Общо поръчки: ${report.totalReceipts || 0}
Общо продажби: ${formatCurrency(report.totalSales)}
ДДС: ${formatCurrency(report.totalVAT)}
Нето продажби: ${formatCurrency(report.totalNetSales)}
${paymentsTxt}

КОНТРОЛ НА КАСАТА
=================
Начална сума: ${formatCurrency(report.cashDrawerStartAmount)}
Крайна сума: ${formatCurrency(report.cashDrawerEndAmount)}

СТАТУС: ${statusLabel}
Генериран на: ${new Date(report.generatedAt).toLocaleString('bg-BG')}
Бележки: ${report.notes || 'Няма'}
            `.trim();

            // Create and download file
            const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fiscal-report-${report.reportNumber}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('Отчетът е изтеглен успешно');
        } catch (error) {
            toast.error('Грешка при изтегляне на отчета');
            console.error('Error downloading report:', error);
        }
    };

    const printReport = (report) => {
        try {
            const typeToBg = {
                DAILY: 'Дневен отчет',
                SHIFT: 'Сменен отчет',
                MONTHLY: 'Месечен отчет',
                YEARLY: 'Годишен отчет',
                STORE_DAILY: 'Общ дневен отчет',
                Z_REPORT: 'Z-отчет',
                X_REPORT: 'X-отчет'
            };
            const statusToBg = {
                GENERATED: 'ГЕНЕРИРАН',
                SENT_TO_NAF: 'ИЗПРАТЕН КЪМ НАП',
                CONFIRMED: 'ПОТВЪРДЕН',
                ERROR: 'ГРЕШКА'
            };
            const typeLabel = typeToBg[report.reportType] || report.reportType;
            const statusLabel = statusToBg[report.status] || report.status;
            // Create print-friendly HTML content
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Фискален отчет - ${report.reportNumber}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .section { margin-bottom: 15px; }
                        .section h3 { background-color: #f0f0f0; padding: 5px; margin: 0 0 10px 0; }
                        table { width: 100%; border-collapse: collapse; }
                        td { padding: 5px; border-bottom: 1px solid #ddd; }
                        .label { font-weight: bold; width: 50%; }
                        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>ФИСКАЛЕН ОТЧЕТ</h1>
                        <h2>${report.reportNumber}</h2>
                    </div>
                    
                    <div class="section">
                        <h3>Основна информация</h3>
                        <table>
                            <tr><td class="label">Тип отчет:</td><td>${typeLabel}</td></tr>
                            <tr><td class="label">Дата:</td><td>${new Date(report.reportDate).toLocaleDateString('bg-BG')}</td></tr>
                            <tr><td class="label">Касиер:</td><td>${report.reportType === 'STORE_DAILY' ? 'Всички касиери' : (report.cashierName || 'Неизвестен')}</td></tr>
                            <tr><td class="label">Устройство:</td><td>${report.reportType === 'STORE_DAILY' ? (report.deviceSerialNumber || 'Главно устройство') : (report.deviceSerialNumber || 'Неизвестно')}</td></tr>
                            <tr><td class="label">Статус:</td><td>${statusLabel}</td></tr>
                        </table>
                    </div>
                    
                    <div class="section">
                        <h3>Финансова статистика</h3>
                        <table>
                            <tr><td class="label">Общо поръчки:</td><td>${report.totalReceipts || 0}</td></tr>
                            <tr><td class="label">Общо продажби:</td><td>${formatCurrency(report.totalSales)}</td></tr>
                            <tr><td class="label">ДДС:</td><td>${formatCurrency(report.totalVAT)}</td></tr>
                            <tr><td class="label">Нето продажби:</td><td>${formatCurrency(report.totalNetSales)}</td></tr>
                        </table>
                    </div>
                    
                    ${report.paymentBreakdown ? (() => { try {
                        const pb = JSON.parse(report.paymentBreakdown);
                        return `
                    <div class="section">
                        <h3>Плащания</h3>
                        <table>
                            <tr><td class="label">В брой:</td><td>${formatCurrency(pb.CASH?.total)}</td></tr>
                            <tr><td class="label">С карта:</td><td>${formatCurrency(pb.CARD?.total)}</td></tr>
                            <tr><td class="label">Смесено:</td><td>${formatCurrency(pb.SPLIT?.total)} (в брой ${formatCurrency(pb.SPLIT?.cash)}, карта ${formatCurrency(pb.SPLIT?.card)})</td></tr>
                            <tr><td class="label">Общо в брой:</td><td>${formatCurrency(((pb.CASH?.total || 0) + (pb.SPLIT?.cash || 0)))}</td></tr>
                            <tr><td class="label">Общо с карта:</td><td>${formatCurrency(((pb.CARD?.total || 0) + (pb.SPLIT?.card || 0)))}</td></tr>
                        </table>
                    </div>`;
                    } catch(e) { return ''; } })() : ''}
                    
                    ${(report.reportType !== 'STORE_DAILY' && (report.cashDrawerStartAmount || report.cashDrawerEndAmount)) ? `
                    <div class="section">
                        <h3>Контрол на касата</h3>
                        <table>
                            <tr><td class="label">Начална сума:</td><td>${formatCurrency(report.cashDrawerStartAmount)}</td></tr>
                            <tr><td class="label">Крайна сума:</td><td>${formatCurrency(report.cashDrawerEndAmount)}</td></tr>
                            <tr><td class="label">Разлика (крайна - начална):</td><td>${formatCurrency((report.cashDrawerEndAmount || 0) - (report.cashDrawerStartAmount || 0))}</td></tr>
                        </table>
                    </div>
                    ` : ''}
                    
                    <div class="section">
                        <h3>Данъчни групи</h3>
                        <table>
                            <tr><td class="label">Ставка 20% (А):</td><td>Основа ${formatCurrency((report.totalNetSales) || 0)} | ДДС ${formatCurrency((report.totalVAT) || 0)}</td></tr>
                            ${report.taxGroupBBase ? `<tr><td class="label">Ставка 9% (Б):</td><td>Основа ${formatCurrency(report.taxGroupBBase)} | ДДС ${formatCurrency(report.taxGroupBVat)}</td></tr>` : ''}
                        </table>
                    </div>

                    ${report.reportType === 'STORE_DAILY' && report.cashierBreakdown ? `
                    <div class="section">
                        <h3>Разбивка по касиери</h3>
                        <table>
                            <tr style="background-color: #f0f0f0; font-weight: bold;">
                                <td>Касиер</td>
                                <td>Брой поръчки</td>
                                <td>Оборот</td>
                            </tr>
                            ${JSON.parse(report.cashierBreakdown).map(cashier => `
                                <tr>
                                    <td>${cashier.cashier}</td>
                                    <td>${cashier.ordersCount}</td>
                                    <td>${formatCurrency(cashier.totalAmount)}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    ` : ''}

                    <div class="section">
                        <h3>Сторно / Анулирания</h3>
                        <table>
                            <tr><td class="label">Брой сторно:</td><td>${report.refundsCount ?? 0}</td></tr>
                            <tr><td class="label">Сума сторно:</td><td>${formatCurrency(report.refundsAmount)}</td></tr>
                            <tr><td class="label">Анулирания:</td><td>${report.voidsCount ?? 0}</td></tr>
                        </table>
                    </div>

                    <div class="section">
                        <h3>Данни за фискално устройство</h3>
                        <table>
                            <tr><td class="label">Сериен №:</td><td>${report.deviceSerialNumber || '-'}</td></tr>
                            <tr><td class="label">Фискална памет №:</td><td>${report.fiscalMemoryNumber || '-'}</td></tr>
                            <tr><td class="label">Номер на отчет:</td><td>${report.reportNumber}</td></tr>
                        </table>
                    </div>

                    <div class="section">
                        <h3>Допълнителна информация</h3>
                        <table>
                            <tr><td class="label">Генериран на:</td><td>${new Date(report.generatedAt).toLocaleString('bg-BG')}</td></tr>
                            ${report.notes ? `<tr><td class="label">Бележки:</td><td>${report.notes}</td></tr>` : ''}
                        </table>
                    </div>
                    
                    <div class="footer">
                        <p>Отчетът е генериран автоматично от POS системата</p>
                        <p>Касиер: ${report.cashierName || '-'}</p>
                        <p>Подпис касиер: ______________________</p>
                        <p>Подпис управител: ____________________</p>
                        <p>Дата на печат: ${new Date().toLocaleString('bg-BG')}</p>
                    </div>
                </body>
                </html>
            `;

            // Open print window
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Wait for content to load, then print
            printWindow.onload = () => {
                printWindow.print();
                printWindow.close();
            };
            
            toast.success('Отчетът е готов за печат');
        } catch (error) {
            toast.error('Грешка при принтиране на отчета');
            console.error('Error printing report:', error);
        }
    };

    const getReportTypeBadge = (reportType) => {
        const typeClasses = {
            'DAILY': 'badge-primary',
            'STORE_DAILY': 'badge-danger',
            'SHIFT': 'badge-info',
            'MONTHLY': 'badge-success',
            'YEARLY': 'badge-warning',
            'Z_REPORT': 'badge-danger',
            'X_REPORT': 'badge-secondary'
        };
        
        return (
            <span className={`badge ${typeClasses[reportType] || 'badge-secondary'}`}>
                {reportType}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'GENERATED': 'badge-success',
            'SENT_TO_NAF': 'badge-info',
            'CONFIRMED': 'badge-primary',
            'ERROR': 'badge-danger'
        };
        
        return (
            <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
                {status}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('bg-BG', {
            style: 'currency',
            currency: 'BGN'
        }).format(amount || 0);
    };

    return (
        <div className="reports-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 text-light">📊 Отчети</h2>
            </div>

            {/* Tab Navigation */}
            <ul className="nav nav-tabs mb-4" role="tablist">
                {isAdmin && (
                    <li className="nav-item" role="presentation">
                        <button 
                            className={`nav-link ${activeTab === 'export' ? 'active' : ''}`}
                            onClick={() => setActiveTab('export')}
                            type="button"
                        >
                            📋 Експорт данни
                        </button>
                    </li>
                )}
                {isAdmin && (
                    <li className="nav-item" role="presentation">
                        <button 
                            className={`nav-link ${activeTab === 'cashiers' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cashiers')}
                            type="button"
                        >
                            👩‍💼 По касиери
                        </button>
                    </li>
                )}
                <li className="nav-item" role="presentation">
                    <button 
                        className={`nav-link ${activeTab === 'fiscal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('fiscal')}
                        type="button"
                    >
                        🏪 Фискални отчети
                    </button>
                </li>
            </ul>

            {/* Date Filters - only for ADMIN */}
            {isAdmin && (
            <div className="filters-bar text-light mb-4">
                <div className="row g-3 align-items-end m-0">
                    <div className="col-md-4">
                        <label className="form-label">От дата</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            value={dateFrom} 
                            onChange={(e) => setDateFrom(e.target.value)} 
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">До дата</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            value={dateTo} 
                            onChange={(e) => setDateTo(e.target.value)} 
                        />
                    </div>
                    <div className="col-md-4">
                        <button 
                            className="btn btn-outline-light"
                            onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setDateFrom(today);
                                setDateTo(today);
                            }}
                        >
                            Днес
                        </button>
                    </div>
                </div>
            </div>
            )}

            {/* Export Tab */}
            {isAdmin && activeTab === 'export' && (
                <div className="card bg-dark text-light">
                    <div className="card-body">
                        <h5 className="card-title">📋 Експорт на данни</h5>
                        <div className="mb-3">
                            <button 
                                className="btn btn-primary"
                                onClick={handleExport}
                                disabled={exporting}
                            >
                                {exporting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Генериране...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-download me-2"></i>
                                        Експорт CSV
                                    </>
                                )}
                            </button>
                        </div>
                        <ul className="list-unstyled">
                            <li><i className="bi bi-check-circle text-success me-2"></i>Отчетите се генерират в CSV формат</li>
                            <li><i className="bi bi-check-circle text-success me-2"></i>Съхраняват се в AWS S3 bucket: <code>pos-reports-supermarket</code></li>
                            <li><i className="bi bi-check-circle text-success me-2"></i>Включват всички поръчки за избрания период</li>
                            <li><i className="bi bi-check-circle text-success me-2"></i>Файловете са достъпни за данъчни и счетоводни цели</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Cashiers Tab */}
            {isAdmin && activeTab === 'cashiers' && (
                <div className="card bg-dark text-light">
                    <div className="card-body">
                        <h5 className="card-title">👩‍💼 Отчети по касиерки</h5>
                        {cashierLoading ? (
                            <div>Зареждане...</div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Касиер</th>
                                            <th>Брой поръчки</th>
                                            <th>Оборот</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cashierRows.map((r, idx) => (
                                            <tr key={idx}>
                                                <td>{r.cashierUsername || '-'}</td>
                                                <td>{r.totalOrders}</td>
                                                <td>{formatCurrency(r.totalAmount)}</td>
                                            </tr>
                                        ))}
                                        {cashierRows.length === 0 && (
                                            <tr className="empty-state-row">
                                                <td colSpan="3" className="text-center empty-state">Няма данни за избрания период</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Fiscal Reports Tab */}
            {activeTab === 'fiscal' && (
                <div className="fiscal-reports-page">
                    {loading ? (
                        <div className="d-flex justify-content-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5>🏪 Фискални отчети</h5>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowGenerateForm(true)}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Генерирай отчет
                                </button>
                            </div>

                            {showGenerateForm && (
                                <div className="card mb-4 w-100">
                                    <div className="card-header">
                                        <h5>Генерирай нов фискален отчет</h5>
                                    </div>
                                    <div className="card-body">
                                        <form onSubmit={generateFiscalReport}>
                                            <div className="row">
                                                <div className="col-md-3 mb-3">
                                                    <label className="form-label">Тип отчет *</label>
                                                    <select
                                                        className="form-select"
                                                        value={selectedReportType}
                                                        onChange={(e) => setSelectedReportType(e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Изберете тип</option>
                                                        {auth.role === 'ROLE_ADMIN' && <option value="STORE_DAILY">🏪 Общ дневен отчет за магазина</option>}
                                                        {auth.role === 'ROLE_ADMIN' && <option value="DAILY">Дневен отчет</option>}
                                                        <option value="SHIFT">Сменен отчет</option>
                                                        {auth.role === 'ROLE_ADMIN' && <option value="MONTHLY">Месечен отчет</option>}
                                                        {auth.role === 'ROLE_ADMIN' && <option value="YEARLY">Годишен отчет</option>}
                                                    </select>
                                                </div>
                                                <div className="col-md-3 mb-3">
                                                    <label className="form-label">Дата на отчет *</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        name="reportDate"
                                                        value={formData.reportDate}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                                {auth.role === 'ROLE_ADMIN' && selectedReportType !== 'STORE_DAILY' ? (
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Касиер</label>
                                                        <select
                                                            className="form-select"
                                                            name="cashierName"
                                                            value={formData.cashierName}
                                                            onChange={handleInputChange}
                                                        >
                                                            <option value="">Изберете касиер</option>
                                                            {loading ? (
                                                                <option value="" disabled>Зареждане на потребители...</option>
                                                            ) : users.length > 0 ? (
                                                                users.map((user) => (
                                                                    <option key={user.userId} value={user.name}>
                                                                        {user.name} ({user.role === 'ROLE_ADMIN' ? 'Админ' : 'Касиер'})
                                                                    </option>
                                                                ))
                                                            ) : (
                                                                <option value="" disabled>Няма налични потребители</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                ) : auth.role !== 'ROLE_ADMIN' ? (
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Касиер</label>
                                                        <select
                                                            className="form-select"
                                                            name="cashierName"
                                                            value={formData.cashierName || auth.name || ''}
                                                            onChange={handleInputChange}
                                                            disabled
                                                        >
                                                            <option value={auth.name || ''}>{auth.name || 'Липсва потребител'}</option>
                                                        </select>
                                                    </div>
                                                ) : null}
                                                {auth.role === 'ROLE_ADMIN' && selectedReportType !== 'STORE_DAILY' ? (
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Фискално устройство</label>
                                                        <select
                                                            className="form-select"
                                                            name="deviceSerialNumber"
                                                            value={formData.deviceSerialNumber}
                                                            onChange={handleInputChange}
                                                        >
                                                            <option value="">Изберете устройство</option>
                                                            {devices.map((device) => (
                                                                <option key={device.id} value={device.serialNumber}>
                                                                    {device.serialNumber} - {device.location || device.model}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : auth.role !== 'ROLE_ADMIN' ? (
                                                    <div className="col-md-3 mb-3">
                                                        <label className="form-label">Фискално устройство</label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            value={activeSession?.deviceSerialNumber || formData.deviceSerialNumber || 'Няма активна каса'}
                                                            readOnly
                                                        />
                                                        {!activeSession?.deviceSerialNumber && (
                                                            <small className="text-warning">Няма активна каса – първо започнете работен ден</small>
                                                        )}
                                                    </div>
                                                ) : null}
                                            </div>

                                            {selectedReportType === 'STORE_DAILY' && (
                                                <div className="alert alert-info mb-3">
                                                    <i className="bi bi-info-circle me-2"></i>
                                                    <strong>Общ дневен отчет за магазина:</strong> Този отчет включва данни от всички каси и всички фискални устройства в магазина за избраната дата.
                                                </div>
                                            )}

                                            <div className="mb-3">
                                                <label className="form-label">Бележки</label>
                                                <textarea
                                                    className="form-control"
                                                    name="notes"
                                                    value={formData.notes}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                />
                                            </div>

                                            <div className="d-flex gap-2">
                                                <button type="submit" className="btn btn-primary">
                                                    Генерирай отчет
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-secondary"
                                                    onClick={resetForm}
                                                >
                                                    Отказ
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="card w-100">
                                <div className="card-header">
                                    <h5>Генерирани отчети</h5>
                                </div>
                                <div className="card-body">
                                    {reports.length === 0 ? (
                                        <div className="text-center py-4">
                                            <i className="bi bi-file-earmark-text display-1 text-muted"></i>
                                            <p className="mt-3 text-muted">Няма генерирани фискални отчети.</p>
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => setShowGenerateForm(true)}
                                            >
                                                Генерирай първи отчет
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Номер</th>
                                                        <th>Тип</th>
                                                        <th>Дата</th>
                                                        <th>Брой бележки</th>
                                                        <th>Общо продажби</th>
                                                        <th>Общо ДДС</th>
                                                        <th>Статус</th>
                                                        <th>Създаден на</th>
                                                        <th>Действия</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {reports.map((report) => (
                                                        <tr key={report.id}>
                                                            <td>
                                                                <strong>{report.reportNumber}</strong>
                                                            </td>
                                                            <td>{getReportTypeBadge(report.reportType)}</td>
                                                            <td>{new Date(report.reportDate).toLocaleDateString()}</td>
                                                            <td>{report.totalReceipts || 0}</td>
                                                            <td>{formatCurrency(report.totalSales)}</td>
                                                            <td>{formatCurrency(report.totalVAT)}</td>
                                                            <td>{getStatusBadge(report.status)}</td>
                                                            <td>
                                                                {new Date(report.generatedAt).toLocaleString()}
                                                            </td>
                                                            <td>
                                                                <div className="btn-group" role="group">
                                                                    {report.status === 'GENERATED' && auth.role === 'ROLE_ADMIN' && (
                                                                        <button
                                                                            className="btn btn-sm btn-outline-success"
                                                                            onClick={() => sendReportToNAF(report.id)}
                                                                            title="Изпрати към НАП"
                                                                        >
                                                                            <i className="bi bi-send"></i>
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className="btn btn-sm btn-outline-info"
                                                                        title="Детайли"
                                                                        onClick={() => showReportDetailsModal(report)}
                                                                    >
                                                                        <i className="bi bi-eye"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-success"
                                                                        title="Принтирай"
                                                                        onClick={() => printReport(report)}
                                                                    >
                                                                        <i className="bi bi-printer"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        title="Свали"
                                                                        onClick={() => downloadReport(report)}
                                                                    >
                                                                        <i className="bi bi-download"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Report Details Modal */}
            {showReportDetails && selectedReport && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-file-earmark-text me-2"></i>
                                    Детайли на фискален отчет
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowReportDetails(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Основна информация</h6>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <td><strong>Номер на отчет:</strong></td>
                                                    <td>{selectedReport.reportNumber}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Тип:</strong></td>
                                                    <td>{getReportTypeBadge(selectedReport.reportType)}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Дата:</strong></td>
                                                    <td>{new Date(selectedReport.reportDate).toLocaleDateString('bg-BG')}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Касиер:</strong></td>
                                                    <td>{selectedReport.cashierName || 'Неизвестен'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Устройство:</strong></td>
                                                    <td>{selectedReport.deviceSerialNumber || 'Неизвестно'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Статус:</strong></td>
                                                    <td>{getStatusBadge(selectedReport.status)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Финансова статистика</h6>
                                        <table className="table table-sm">
                                            <tbody>
                                                <tr>
                                                    <td><strong>Общо поръчки:</strong></td>
                                                    <td>{selectedReport.totalReceipts || 0}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Общо продажби:</strong></td>
                                                    <td>{formatCurrency(selectedReport.totalSales)}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>ДДС:</strong></td>
                                                    <td>{formatCurrency(selectedReport.totalVAT)}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Нето продажби:</strong></td>
                                                    <td>{formatCurrency(selectedReport.totalNetSales)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                
                                {(selectedReport.cashDrawerStartAmount || selectedReport.cashDrawerEndAmount) && (
                                    <div className="row mt-3">
                                        <div className="col-12">
                                            <h6>Контрол на касата</h6>
                                            <table className="table table-sm">
                                                <tbody>
                                                    <tr>
                                                        <td><strong>Начална сума:</strong></td>
                                                        <td>{formatCurrency(selectedReport.cashDrawerStartAmount)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Крайна сума:</strong></td>
                                                        <td>{formatCurrency(selectedReport.cashDrawerEndAmount)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Разлика:</strong></td>
                                                        <td>{formatCurrency((selectedReport.cashDrawerEndAmount || 0) - (selectedReport.cashDrawerStartAmount || 0))}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="row mt-3">
                                    <div className="col-12">
                                        <h6>Допълнителна информация</h6>
                                        <p><strong>Генериран на:</strong> {new Date(selectedReport.generatedAt).toLocaleString('bg-BG')}</p>
                                        {selectedReport.notes && (
                                            <p><strong>Бележки:</strong> {selectedReport.notes}</p>
                                        )}
                                    </div>
                                </div>
                                {selectedReport.paymentBreakdown && (() => { let pb=null; try { pb=JSON.parse(selectedReport.paymentBreakdown);} catch(e){} return pb ? (
                                    <div className="row mt-3">
                                        <div className="col-12">
                                            <h6>Плащания</h6>
                                            <table className="table table-sm">
                                                <tbody>
                                                    <tr><td><strong>В брой:</strong></td><td>{formatCurrency(pb.CASH?.total)}</td></tr>
                                                    <tr><td><strong>С карта:</strong></td><td>{formatCurrency(pb.CARD?.total)}</td></tr>
                                                    <tr><td><strong>Смесено:</strong></td><td>{formatCurrency(pb.SPLIT?.total)} (в брой {formatCurrency(pb.SPLIT?.cash)}, карта {formatCurrency(pb.SPLIT?.card)})</td></tr>
                                                    <tr><td><strong>Общо в брой:</strong></td><td>{formatCurrency(((pb.CASH?.total || 0) + (pb.SPLIT?.cash || 0)))}</td></tr>
                                                    <tr><td><strong>Общо с карта:</strong></td><td>{formatCurrency(((pb.CARD?.total || 0) + (pb.SPLIT?.card || 0)))}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : null; })()}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowReportDetails(false)}
                                >
                                    Затвори
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success"
                                    onClick={() => printReport(selectedReport)}
                                >
                                    <i className="bi bi-printer me-2"></i>
                                    Принтирай
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        downloadReport(selectedReport);
                                        setShowReportDetails(false);
                                    }}
                                >
                                    <i className="bi bi-download me-2"></i>
                                    Изтегли отчет
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedReports;
