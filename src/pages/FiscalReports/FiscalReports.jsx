import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import FiscalService from '../../Service/FiscalService';
import './FiscalReports.css';
import { AppContext } from '../../context/AppContext.jsx';
import { formatMoney } from '../../util/formatMoney.js';

const FiscalReports = () => {
    const { auth } = useContext(AppContext);
    const [reports, setReports] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('');
    
    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0],
        cashierName: '',
        deviceSerialNumber: '',
        notes: '',
        cashDrawerStartAmount: '',
        cashDrawerEndAmount: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const promises = [FiscalService.getAllDevices()];
            // Allow both ADMIN and USER to see reports (USER can see their own shift reports)
            promises.unshift(FiscalService.getAllReports());
            const [reportsData, allDevices] = await Promise.all(promises);
            setReports(reportsData);
            
            // Filter only ACTIVE devices for reports
            const activeDevices = allDevices.filter(device => device.status === 'ACTIVE');
            setDevices(activeDevices);
        } catch (error) {
            toast.error('Грешка при зареждане на данни');
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
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
            notes: '',
            cashDrawerStartAmount: '',
            cashDrawerEndAmount: ''
        });
        setSelectedReportType('');
        setShowGenerateForm(false);
    };

    const generateReport = async (e) => {
        e.preventDefault();
        
        if (!selectedReportType) {
            toast.error('Моля, изберете тип отчет');
            return;
        }

        try {
            let result;
            if (auth.role !== 'ROLE_ADMIN') {
                // Касиерките могат само SHIFT и касиер се взима от токена на бекенда
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
            // Reload reports to show the newly generated one
            await loadData();
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
                loadData();
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

    const formatCurrency = (amount) => formatMoney(amount);

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fiscal-reports-page">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>📊 Фискални отчети</h2>
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
                                <form onSubmit={generateReport}>
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
                                        {auth.role === 'ROLE_ADMIN' && (
                                            <div className="col-md-3 mb-3">
                                                <label className="form-label">Касиер</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="cashierName"
                                                    value={formData.cashierName}
                                                    onChange={handleInputChange}
                                                />
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

                                    {/* Cash drawer control fields for Z-report */}
                                    {selectedReportType === 'SHIFT' && (
                                        <div className="row">
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Начална сума в касата (€)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    name="cashDrawerStartAmount"
                                                    value={formData.cashDrawerStartAmount || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label">Крайна сума в касата (€)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    name="cashDrawerEndAmount"
                                                    value={formData.cashDrawerEndAmount || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                />
                                            </div>
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FiscalReports;
