import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import { exportOrdersReport, getCashierSummaries } from "../../Service/ReportService.js";
import FiscalService from '../../Service/FiscalService';
import { fetchUsers } from '../../Service/UserService.js';
import { AppContext } from '../../context/AppContext.jsx';
import './Reports.css';

const UnifiedReports = () => {
    const { auth } = useContext(AppContext);
    
    // Common state
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [activeTab, setActiveTab] = useState('export');
    
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
    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0],
        cashierName: '',
        deviceSerialNumber: '',
        notes: ''
    });

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
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'cashiers') {
            loadCashierSummaries();
        }
    }, [activeTab, dateFrom, dateTo]);

    const loadFiscalData = async () => {
        try {
            setLoading(true);
            
            // Load devices first - filter only ACTIVE devices
            const allDevices = await FiscalService.getAllDevices();
            const activeDevices = allDevices.filter(device => device.status === 'ACTIVE');
            setDevices(activeDevices);
            console.log('Loaded active devices for reports:', activeDevices);
            
            if (auth.role === 'ROLE_ADMIN') {
                // Load reports
                const reportsData = await FiscalService.getAllReports();
                setReports(reportsData);
            } else {
                setReports([]);
            }
        } catch (error) {
            toast.error('Грешка при зареждане на данни');
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
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
            
            toast.success('Отчетът е генериран успешно');
            resetForm();
            loadFiscalData();
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

    const getReportTypeBadge = (reportType) => {
        const typeClasses = {
            'DAILY': 'badge-primary',
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
                <li className="nav-item" role="presentation">
                    <button 
                        className={`nav-link ${activeTab === 'export' ? 'active' : ''}`}
                        onClick={() => setActiveTab('export')}
                        type="button"
                    >
                        📋 Експорт данни
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button 
                        className={`nav-link ${activeTab === 'cashiers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cashiers')}
                        type="button"
                    >
                        👩‍💼 По касиери
                    </button>
                </li>
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

            {/* Date Filters - Common for all tabs */}
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

            {/* Export Tab */}
            {activeTab === 'export' && (
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
            {activeTab === 'cashiers' && (
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
                                            <tr>
                                                <td colSpan="3" className="text-center">Няма данни за избрания период</td>
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
                                                {auth.role === 'ROLE_ADMIN' ? (
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
                                                ) : (
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
                                                )}
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
                                            </div>

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
                                                                    {report.status === 'GENERATED' && (
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
                                                                    >
                                                                        <i className="bi bi-eye"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-secondary"
                                                                        title="Свали"
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
        </div>
    );
};

export default UnifiedReports;
