import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import FiscalService from '../../Service/FiscalService';
import './FiscalReports.css';

const FiscalReports = () => {
    const [reports, setReports] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('');
    const [formData, setFormData] = useState({
        reportDate: new Date().toISOString().split('T')[0],
        cashierName: '',
        deviceSerialNumber: '',
        notes: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [reportsData, devicesData] = await Promise.all([
                FiscalService.getAllReports(),
                FiscalService.getAllDevices()
            ]);
            setReports(reportsData);
            setDevices(devicesData);
        } catch (error) {
            toast.error('Error loading data');
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
            notes: ''
        });
        setSelectedReportType('');
        setShowGenerateForm(false);
    };

    const generateReport = async (e) => {
        e.preventDefault();
        
        if (!selectedReportType) {
            toast.error('Please select a report type');
            return;
        }

        try {
            let result;
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
                    toast.error('Invalid report type');
                    return;
            }
            
            toast.success(`${selectedReportType} report generated successfully`);
            resetForm();
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error generating report');
            console.error('Error generating report:', error);
        }
    };

    const sendReportToNAF = async (reportId) => {
        if (window.confirm('Are you sure you want to send this report to NAF?')) {
            try {
                await FiscalService.sendReportToNAF(reportId);
                toast.success('Report sent to NAF successfully');
                loadData();
            } catch (error) {
                toast.error('Error sending report to NAF');
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
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
    };

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
        <div className="container mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>📊 Fiscal Reports Management</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowGenerateForm(true)}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Generate Report
                        </button>
                    </div>

                    {showGenerateForm && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5>Generate New Fiscal Report</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={generateReport}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Report Type *</label>
                                            <select
                                                className="form-select"
                                                value={selectedReportType}
                                                onChange={(e) => setSelectedReportType(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Report Type</option>
                                                <option value="DAILY">Daily Report</option>
                                                <option value="SHIFT">Shift Report</option>
                                                <option value="MONTHLY">Monthly Report</option>
                                                <option value="YEARLY">Yearly Report</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Report Date *</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                name="reportDate"
                                                value={formData.reportDate}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Cashier Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="cashierName"
                                                value={formData.cashierName}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Fiscal Device</label>
                                            <select
                                                className="form-select"
                                                name="deviceSerialNumber"
                                                value={formData.deviceSerialNumber}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Device</option>
                                                {devices.map((device) => (
                                                    <option key={device.id} value={device.serialNumber}>
                                                        {device.serialNumber} - {device.location || device.model}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Notes</label>
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
                                            Generate Report
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={resetForm}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <h5>Generated Reports</h5>
                        </div>
                        <div className="card-body">
                            {reports.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="bi bi-file-earmark-text display-1 text-muted"></i>
                                    <p className="mt-3 text-muted">No fiscal reports generated yet.</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => setShowGenerateForm(true)}
                                    >
                                        Generate First Report
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Report Number</th>
                                                <th>Type</th>
                                                <th>Date</th>
                                                <th>Total Receipts</th>
                                                <th>Total Sales</th>
                                                <th>Total VAT</th>
                                                <th>Status</th>
                                                <th>Generated At</th>
                                                <th>Actions</th>
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
                                                                    title="Send to NAF"
                                                                >
                                                                    <i className="bi bi-send"></i>
                                                                </button>
                                                            )}
                                                            <button
                                                                className="btn btn-sm btn-outline-info"
                                                                title="View Details"
                                                            >
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                title="Download"
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
    );
};

export default FiscalReports;
