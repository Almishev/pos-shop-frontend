import './Dashboard.css';
import {useEffect, useState} from "react";
import {fetchDashboardData} from "../../Service/Dashboard.js";
import toast from "react-hot-toast";
import FiscalService from "../../Service/FiscalService.js";

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [fiscalStats, setFiscalStats] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const [dashboardResponse, fiscalData] = await Promise.all([
                    fetchDashboardData(),
                    loadFiscalStats()
                ]);
                setData(dashboardResponse.data);
                setFiscalStats(fiscalData);
            } catch (error) {
                console.error(error);
                toast.error("Неуспешно зареждане на данните");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const loadFiscalStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const [sales, vat, receipts, devices] = await Promise.all([
                FiscalService.getSalesForDate(today),
                FiscalService.getVATForDate(today),
                FiscalService.getReceiptsForDate(today),
                FiscalService.getAllDevices()
            ]);
            
            return {
                todaySales: sales || 0,
                todayVAT: vat || 0,
                todayReceipts: receipts || 0,
                activeDevices: devices.filter(d => d.status === 'ACTIVE').length,
                totalDevices: devices.length
            };
        } catch (error) {
            console.error('Error loading fiscal stats:', error);
            return {
                todaySales: 0,
                todayVAT: 0,
                todayReceipts: 0,
                activeDevices: 0,
                totalDevices: 0
            };
        }
    };

    if (loading) {
        return <div className="loading">Зареждане на таблото...</div>
    }

    if (!data) {
        return <div className="error">Неуспешно зареждане на данните...</div>;
    }

    return (
        <div className="dashboard-wrapper">
            <div className="dashboard-container">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-currency-euro"></i>
                        </div>
                        <div className="stat-content">
                            <h3>Продажби днес</h3>
                            <p>{new Intl.NumberFormat('bg-BG', {style:'currency', currency:'BGN'}).format(data.todaySales)}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-cart-check"></i>
                        </div>
                        <div className="stat-content">
                            <h3>Поръчки днес</h3>
                            <p>{data.todayOrderCount}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-upc-scan"></i>
                        </div>
                        <div className="stat-content">
                            <h3>Сканирания</h3>
                            <p>{data.recentOrders.length}</p>
                        </div>
                    </div>

                    {fiscalStats && (
                        <>
                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="bi bi-printer"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>Фискални бонове</h3>
                                    <p>{fiscalStats.todayReceipts}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="bi bi-calculator"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>ДДС днес</h3>
                                    <p>{new Intl.NumberFormat('bg-BG', {style:'currency', currency:'BGN'}).format(fiscalStats.todayVAT)}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="bi bi-wifi"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>Активни устройства</h3>
                                    <p>{fiscalStats.activeDevices}/{fiscalStats.totalDevices}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="recent-orders-card">
                    <h3 className="recent-orders-title">
                        <i className="bi bi-clock-history"></i>
                        Последни поръчки
                    </h3>
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                            <tr>
                                <th>Поръчка</th>
                                <th>Клиент</th>
                                <th>Сума</th>
                                <th>Плащане</th>
                                <th>Статус</th>
                                <th>Време</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.recentOrders.map((order) => (
                                <tr key={order.orderId}>
                                    <td>{order.orderId.substring(0,8)}...</td>
                                    <td>{order.customerName}</td>
                                    <td>{new Intl.NumberFormat('bg-BG', {style:'currency', currency:'BGN'}).format(order.grandTotal)}</td>
                                    <td>
                                        <span className={`payment-method ${order.paymentMethod.toLowerCase()}`}>
                                            {order.paymentMethod}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${order.paymentDetails.status.toLowerCase()}`}>
                                            {order.paymentDetails.status === 'COMPLETED' ? 'ЗАВЪРШЕНО' : (order.paymentDetails.status || 'ИЗЧАКВАНЕ')}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(order.createdAt).toLocaleDateString('bg-BG', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard;