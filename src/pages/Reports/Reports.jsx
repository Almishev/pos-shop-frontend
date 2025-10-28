import { useEffect, useState, useContext } from "react";
import { exportOrdersReport, getCashierSummaries } from "../../Service/ReportService.js";
import { toast } from "react-hot-toast";
import './Reports.css';
import { AppContext } from "../../context/AppContext.jsx";

const Reports = () => {
    const { auth } = useContext(AppContext);
    const isAdmin = auth?.role === 'ADMIN';
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [exporting, setExporting] = useState(false);
    const [activeTab, setActiveTab] = useState(isAdmin ? 'export' : 'cashiers');
    const [cashierLoading, setCashierLoading] = useState(false);
    const [cashierRows, setCashierRows] = useState([]);

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

    useEffect(() => {
        if (activeTab === 'cashiers') {
            loadCashierSummaries();
        }
    }, [activeTab, dateFrom, dateTo]);

    return (
        <div className="reports-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0 text-light">📊 Отчети</h2>
            </div>

            <div className="filters-bar text-light">
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
                    <div className="col-md-4 d-flex gap-2">
                        {isAdmin && (
                            <button 
                                className="btn btn-outline-light w-50"
                                onClick={() => setActiveTab('export')}
                            >
                                Експорт
                            </button>
                        )}
                        <button 
                            className="btn btn-outline-warning w-50"
                            onClick={() => setActiveTab('cashiers')}
                        >
                            По касиерки
                        </button>
                    </div>
                </div>
            </div>

            {isAdmin && activeTab === 'export' && (
            <div className="card bg-dark text-light">
                <div className="card-body">
                    <h5 className="card-title">📋 Информация за отчетите</h5>
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
                                            <td>{new Intl.NumberFormat('bg-BG', {style:'currency', currency:'BGN'}).format(r.totalAmount || 0)}</td>
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
        </div>
    );
};

export default Reports;
