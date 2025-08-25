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
                toast.error("Unable to view the data");
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
        return <div className="loading">Loading dashboard...</div>
    }

    if (!data) {
        return <div className="error">Failed to load the dashboard data...</div>;
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
                            <h3>Today's Sales</h3>
                            <p>€{data.todaySales.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-cart-check"></i>
                        </div>
                        <div className="stat-content">
                            <h3>Today's Orders</h3>
                            <p>{data.todayOrderCount}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-upc-scan"></i>
                        </div>
                        <div className="stat-content">
                            <h3>Barcode Scans</h3>
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
                                    <h3>Fiscal Receipts</h3>
                                    <p>{fiscalStats.todayReceipts}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="bi bi-calculator"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>Today's VAT</h3>
                                    <p>€{fiscalStats.todayVAT.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">
                                    <i className="bi bi-wifi"></i>
                                </div>
                                <div className="stat-content">
                                    <h3>Active Devices</h3>
                                    <p>{fiscalStats.activeDevices}/{fiscalStats.totalDevices}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="recent-orders-card">
                    <h3 className="recent-orders-title">
                        <i className="bi bi-clock-history"></i>
                        Recent Orders
                    </h3>
                    <div className="orders-table-container">
                        <table className="orders-table">
                            <thead>
                            <tr>
                                <th>Order Id</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Time</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.recentOrders.map((order) => (
                                <tr key={order.orderId}>
                                    <td>{order.orderId.substring(0,8)}...</td>
                                    <td>{order.customerName}</td>
                                    <td>€{order.grandTotal.toFixed(2)}</td>
                                    <td>
                                        <span className={`payment-method ${order.paymentMethod.toLowerCase()}`}>
                                            {order.paymentMethod}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${order.paymentDetails.status.toLowerCase()}`}>
                                            {order.paymentDetails.status}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(order.createdAt).toLocaleDateString([], {
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