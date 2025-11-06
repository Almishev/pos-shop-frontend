import './OrderHistory.css';
import {useEffect, useState} from "react";
import {getOrders, refundOrder} from "../../Service/OrderService.js";

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [q, setQ] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sort, setSort] = useState('createdAt,desc');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await getOrders({ page, size, sort, q, dateFrom, dateTo });
                setOrders(response.data.content || []);
                setTotalPages(response.data.totalPages || 0);
                setTotalElements(response.data.totalElements || 0);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrders();
    }, [page, size, sort, q, dateFrom, dateTo]);

    const nextPage = () => {
        if (page + 1 < totalPages) setPage(page + 1);
    }

    const prevPage = () => {
        if (page > 0) setPage(page - 1);
    }

    const formatItems = (items) => {
        return items.map((item) => {
            let itemText = `${item.name} x ${item.quantity}`;
            if (item.barcode) {
                itemText += ` (${item.barcode})`;
            }
            return itemText;
        }).join(', ');
    }

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }
        return new Date(dateString).toLocaleDateString('bg-BG', options);
    }

    if (loading) {
        return <div className="text-center py-4">Зареждане на поръчки...</div>
    }

    if (!loading && orders.length === 0) {
        return <div className="text-center py-4">Няма намерени поръчки</div>
    }

    return (
        <div className="orders-history-container container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="mb-0 text-light">Всички поръчки</h2>
                <div className="text-light small">Общо: {totalElements}</div>
            </div>

            <div className="filters-bar text-light">
                <div className="row g-2 align-items-end m-0">
                        <div className="col-md-4">
                            <label className="form-label">Търсене</label>
                            <input className="form-control" placeholder="Поръчка, клиент, телефон" value={q} onChange={(e)=>{ setPage(0); setQ(e.target.value); }} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">От дата</label>
                            <input type="date" className="form-control" value={dateFrom} onChange={(e)=>{ setPage(0); setDateFrom(e.target.value); }} />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">До дата</label>
                            <input type="date" className="form-control" value={dateTo} onChange={(e)=>{ setPage(0); setDateTo(e.target.value); }} />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Сортиране</label>
                            <select className="form-select" value={sort} onChange={(e)=>{ setPage(0); setSort(e.target.value); }}>
                                <option value="createdAt,desc">Най-нови</option>
                                <option value="createdAt,asc">Най-стари</option>
                                <option value="grandTotal,desc">Сума ↓</option>
                                <option value="grandTotal,asc">Сума ↑</option>
                            </select>
                        </div>
                    </div>
            </div>

            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                    <tr>
                        <th>Поръчка</th>
                        <th>Касиер</th>
                        <th>Клиент</th>
                        <th>Артикули</th>
                        <th>Общо</th>
                        <th>Плащане</th>
                        <th>Статус</th>
                        <th></th>
                        <th>Дата</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map(order => (
                        <tr key={order.orderId}>
                            <td>{order.orderId}</td>
                            <td>{order.cashierUsername || '-'}</td>
                            <td>{order.customerName} <br/>
                                <small className="text-muted">{order.phoneNumber}</small>
                            </td>
                            <td>
                                <div className="items-list">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="item-detail">
                                            <span>{item.name} x {item.quantity}</span>
                                            {item.barcode && (
                                                <small className="text-dark d-block">
                                                    <i className="bi bi-upc-scan"></i> {item.barcode}
                                                </small>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td>{new Intl.NumberFormat('bg-BG', {style:'currency', currency:'BGN'}).format(order.grandTotal)}</td>
                            <td>{order.paymentMethod}</td>
                            <td>
                                {order.orderStatus === 'REFUNDED' && (
                                    <span className="badge bg-danger">ВЪРНАТО</span>
                                )}
                                {order.orderStatus === 'VOIDED' && (
                                    <span className="badge bg-secondary">АНУЛИРАНО</span>
                                )}
                                {!order.orderStatus && (
                                    <span className={`badge ${order.paymentDetails?.status === "COMPLETED"? "bg-success" : "bg-warning text-dark"}`}>
                                        {order.paymentDetails?.status === 'COMPLETED' ? 'ЗАВЪРШЕНО' : (order.paymentDetails?.status || 'ИЗЧАКВАНЕ')}
                                    </span>
                                )}
                            </td>
                            <td>
                                {(!order.orderStatus || (order.orderStatus !== 'REFUNDED' && order.orderStatus !== 'VOIDED')) && (
                                <button className="btn btn-sm btn-outline-warning" onClick={async ()=>{
                                    const reason = window.prompt('Причина за връщане:', 'Връщане от клиент');
                                    if (reason === null) return;
                                    const methodChoice = window.prompt('Изберете метод: 1=Карта, 2=В брой, 3=Изход', '1');
                                    if (methodChoice === null || methodChoice === '3') return; // Изход
                                    let method = 'CASH';
                                    if (methodChoice === '1') method = 'CARD';
                                    if (methodChoice === '2') method = 'CASH';
                                    const amountStr = window.prompt('Сума за възстановяване (празно = цялата):', '');
                                    const payload = {
                                        reason,
                                        refundMethod: method,
                                        refundAmount: amountStr ? parseFloat(amountStr) : undefined
                                    };
                                    try {
                                        await refundOrder(order.orderId, payload);
                                        alert('Връщането е регистрирано');
                                    } catch (e) {
                                        console.error(e);
                                        alert('Грешка при връщане');
                                    }
                                }}>Връщане</button>
                                )}
                            </td>
                            <td>{formatDate(order.createdAt)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                    <button className="btn btn-outline-light btn-sm me-2" onClick={prevPage} disabled={page === 0}>
                        <i className="bi bi-chevron-left"></i> Предишна
                    </button>
                    <button className="btn btn-outline-light btn-sm" onClick={nextPage} disabled={page + 1 >= totalPages}>
                        Следваща <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
                <div className="text-light small">
                    Страница {page + 1} от {totalPages || 1}
                </div>
                <div>
                    <select className="form-select form-select-sm" style={{width: 'auto'}} value={size} onChange={(e) => { setPage(0); setSize(parseInt(e.target.value)); }}>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
        </div>
    )
}

export default OrderHistory;