import './Dashboard.css';
import {useEffect, useState, useContext} from "react";
import {fetchDashboardData} from "../../Service/Dashboard.js";
import toast from "react-hot-toast";
import CashDrawerService from "../../Service/CashDrawerService.js";
import { AppContext } from "../../context/AppContext.jsx";
import { formatMoney } from "../../util/formatMoney.js";

const Dashboard = () => {
    const { auth } = useContext(AppContext);
    const isAdmin = (auth?.role || '').toUpperCase() === 'ROLE_ADMIN';
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const loadData = async () => {
            try {
                const [dashboardResponse, activeSession] = await Promise.all([
                    fetchDashboardData(),
                    (async () => { try { return await CashDrawerService.getActiveSession(); } catch { return null; } })()
                ]);
                const resp = dashboardResponse?.data || {};
                const allRecent = Array.isArray(resp.recentOrders) ? resp.recentOrders : [];
                // For non-admin: show only today's orders for the logged-in cashier
                let filteredRecent = allRecent;
                if (!isAdmin) {
                    const today = new Date();
                    const isSameLocalDate = (d) => d && d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
                    const userKeys = [auth?.name, auth?.email, activeSession?.cashierUsername]
                        .filter(Boolean)
                        .map(v => String(v).trim().toLowerCase());
                    filteredRecent = allRecent.filter(o => {
                        const created = o?.createdAt ? new Date(o.createdAt) : null;
                        if (!created || !isSameLocalDate(created)) return false;
                        const cashier = String(o?.cashierUsername || '').trim().toLowerCase();
                        return userKeys.length > 0 && userKeys.includes(cashier);
                    });
                }
                setData({
                    todaySales: resp.todaySales || 0,
                    todayOrderCount: resp.todayOrderCount || 0,
                    todayVAT: resp.todayVAT || 0,
                    todayFiscalReceipts: resp.todayFiscalReceipts || 0,
                    activeDevices: resp.activeDevices || 0,
                    totalDevices: resp.totalDevices || 0,
                    recentOrders: filteredRecent
                });
            } catch (error) {
                console.error(error);
                toast.error("Неуспешно зареждане на данните");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [auth?.name, auth?.email, isAdmin]);

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
                            <p>{formatMoney(data.todaySales)}</p>
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
                            <i className="bi bi-calculator"></i>
                        </div>
                        <div className="stat-content">
                            <h3>ДДС днес</h3>
                            <p>{formatMoney(data.todayVAT)}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-printer"></i>
                        </div>
                        <div className="stat-content">
                            <h3>Фискални бонове</h3>
                            <p>{data.todayFiscalReceipts}</p>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="bi bi-wifi"></i>
                        </div>
                        <div className="stat-content">
                            <h3>Активни устройства</h3>
                            <p>{data.activeDevices}/{data.totalDevices}</p>
                        </div>
                    </div>
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
                                    <td>{formatMoney(order.grandTotal)}</td>
                                    <td>
                                        <span className={`payment-method ${order.paymentMethod.toLowerCase()}`}>
                                            {order.paymentMethod}
                                        </span>
                                    </td>
                                    <td>
                                        {(() => {
                                            const method = (order.paymentMethod || '').toUpperCase();
                                            const status = order.paymentDetails?.status;
                                            // Cash / completed sales without POS status are done, not pending
                                            const label = status === 'COMPLETED' || status === 'APPROVED'
                                                ? 'ЗАВЪРШЕНО'
                                                : status
                                                    ? status
                                                    : (method === 'CASH' || method === 'SPLIT' || method === 'CARD')
                                                        ? 'ЗАВЪРШЕНО'
                                                        : 'ИЗЧАКВАНЕ';
                                            const badgeClass = (status || (label === 'ЗАВЪРШЕНО' ? 'completed' : 'pending')).toLowerCase();
                                            return (
                                                <span className={`status-badge ${badgeClass}`}>
                                                    {label}
                                                </span>
                                            );
                                        })()}
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
