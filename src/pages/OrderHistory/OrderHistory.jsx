import './OrderHistory.css';
import {useEffect, useMemo, useRef, useState} from "react";
import {getOrderById, getOrders, refundOrder} from "../../Service/OrderService.js";
import { formatMoney } from "../../util/formatMoney.js";
import toast from "react-hot-toast";

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [size] = useState(20);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sort, setSort] = useState('createdAt,desc');
    const searchInputRef = useRef(null);

    const [refundOrderData, setRefundOrderData] = useState(null);
    const [refundSelections, setRefundSelections] = useState({});
    const [refundReason, setRefundReason] = useState('Връщане от клиент');
    const [refundMethod, setRefundMethod] = useState('CASH');
    const [refundSubmitting, setRefundSubmitting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q.trim()), 250);
        return () => clearTimeout(timer);
    }, [q]);

    const refreshOrders = async (pageToLoad = page) => {
        setLoading(true);
        try {
            const query = debouncedQ;

            if (/^ORD\d{8,}$/i.test(query)) {
                try {
                    const exact = await getOrderById(query.toUpperCase());
                    setOrders(exact.data ? [exact.data] : []);
                    setTotalPages(1);
                    setTotalElements(exact.data ? 1 : 0);
                    return;
                } catch (exactError) {
                    if (exactError.response?.status !== 404) {
                        throw exactError;
                    }
                }
            }

            const response = await getOrders({
                page: pageToLoad,
                size,
                sort,
                q: query || undefined,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined
            });
            setOrders(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
            setTotalElements(response.data.totalElements || 0);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Грешка при зареждане на поръчки');
            setOrders([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const fetchOrders = async () => {
            setLoading(true);
            try {
                const query = debouncedQ;

                if (/^ORD\d{8,}$/i.test(query)) {
                    try {
                        const exact = await getOrderById(query.toUpperCase());
                        if (!cancelled) {
                            setOrders(exact.data ? [exact.data] : []);
                            setTotalPages(1);
                            setTotalElements(exact.data ? 1 : 0);
                        }
                        return;
                    } catch (exactError) {
                        if (exactError.response?.status !== 404) {
                            throw exactError;
                        }
                    }
                }

                const response = await getOrders({
                    page,
                    size,
                    sort,
                    q: query || undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined
                });
                if (!cancelled) {
                    setOrders(response.data.content || []);
                    setTotalPages(response.data.totalPages || 0);
                    setTotalElements(response.data.totalElements || 0);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                if (!cancelled) {
                    toast.error('Грешка при зареждане на поръчки');
                    setOrders([]);
                    setTotalPages(0);
                    setTotalElements(0);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchOrders();
        return () => { cancelled = true; };
    }, [page, size, sort, debouncedQ, dateFrom, dateTo]);

    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    const nextPage = () => {
        if (page + 1 < totalPages) setPage(page + 1);
    };

    const prevPage = () => {
        if (page > 0) setPage(page - 1);
    };

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return new Date(dateString).toLocaleDateString('bg-BG', options);
    };

    const handleSearchChange = (value) => {
        setPage(0);
        setQ(value);
    };

    const canReturnOrder = (order) => {
        if (!order || order.originalOrderId) return false;
        if (order.orderStatus === 'REFUNDED' || order.orderStatus === 'VOIDED') return false;
        return (order.items || []).some((item) => (item.returnableQuantity ?? item.quantity ?? 0) > 0);
    };

    const openRefundModal = (order) => {
        const selections = {};
        (order.items || []).forEach((item) => {
            const max = item.returnableQuantity ?? item.quantity ?? 0;
            if (max > 0) {
                selections[item.itemId] = { selected: false, quantity: 1, max };
            }
        });
        setRefundOrderData(order);
        setRefundSelections(selections);
        setRefundReason('Връщане от клиент');
        setRefundMethod(order.paymentMethod === 'CARD' ? 'CARD' : 'CASH');
    };

    const closeRefundModal = () => {
        if (refundSubmitting) return;
        setRefundOrderData(null);
        setRefundSelections({});
    };

    const toggleItem = (itemId) => {
        setRefundSelections((prev) => {
            const cur = prev[itemId];
            if (!cur) return prev;
            return { ...prev, [itemId]: { ...cur, selected: !cur.selected } };
        });
    };

    const setItemQty = (itemId, qty) => {
        setRefundSelections((prev) => {
            const cur = prev[itemId];
            if (!cur) return prev;
            const n = Math.max(1, Math.min(cur.max, Number(qty) || 1));
            return { ...prev, [itemId]: { ...cur, quantity: n, selected: true } };
        });
    };

    const selectAllReturnable = () => {
        setRefundSelections((prev) => {
            const next = {};
            Object.entries(prev).forEach(([id, cur]) => {
                next[id] = { ...cur, selected: true, quantity: cur.max };
            });
            return next;
        });
    };

    const refundPreview = useMemo(() => {
        if (!refundOrderData) return { items: [], amount: 0 };
        const items = [];
        let amount = 0;
        (refundOrderData.items || []).forEach((item) => {
            const sel = refundSelections[item.itemId];
            if (!sel?.selected) return;
            items.push({ itemId: item.itemId, quantity: sel.quantity });
            // Prices are VAT-inclusive (same as cart grandTotal)
            amount += (item.price || 0) * sel.quantity;
        });
        return { items, amount };
    }, [refundOrderData, refundSelections]);

    const submitRefund = async () => {
        if (!refundOrderData) return;
        if (refundPreview.items.length === 0) {
            toast.error('Изберете поне един артикул за връщане');
            return;
        }
        setRefundSubmitting(true);
        try {
            // Software refund only — fiscal device storno TODO after purchasing FU printer
            await refundOrder(refundOrderData.orderId, {
                reason: refundReason || 'Връщане от клиент',
                refundMethod,
                refundAmount: Number(refundPreview.amount.toFixed(2)),
                items: refundPreview.items
            });
            toast.success('Връщането е регистрирано');
            setRefundOrderData(null);
            setRefundSelections({});
            await refreshOrders(0);
            setPage(0);
        } catch (e) {
            console.error(e);
            const data = e.response?.data;
            let msg = e.message;
            if (typeof data === 'string') {
                msg = data;
            } else if (data?.error) {
                msg = `${data.error}${data.uri ? ` — ${data.method || ''} ${data.uri}` : ''}`;
            } else if (data?.message) {
                msg = data.message;
            }
            toast.error(msg || 'Грешка при връщане');
        } finally {
            setRefundSubmitting(false);
        }
    };

    const statusBadge = (order) => {
        if (order.orderStatus === 'REFUNDED') {
            return <span className="badge bg-danger">ВЪРНАТО</span>;
        }
        if (order.orderStatus === 'PARTIALLY_REFUNDED') {
            return <span className="badge bg-warning text-dark">ЧАСТИЧНО</span>;
        }
        if (order.orderStatus === 'VOIDED') {
            return <span className="badge bg-secondary">АНУЛИРАНО</span>;
        }
        return (
            <span className={`badge ${order.paymentDetails?.status === "COMPLETED"? "bg-success" : "bg-warning text-dark"}`}>
                {order.paymentDetails?.status === 'COMPLETED' ? 'ЗАВЪРШЕНО' : (order.paymentDetails?.status || 'ИЗЧАКВАНЕ')}
            </span>
        );
    };

    return (
        <div className="orders-history-container container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <h2 className="mb-0 text-light">Връщане / сторно</h2>
                    <p className="text-muted small mb-0">Въведете номер на поръчка — резултатът се показва автоматично</p>
                </div>
                <div className="text-light small">Общо: {totalElements}</div>
            </div>

            <div className="filters-bar text-light">
                <div className="row g-2 align-items-end m-0">
                    <div className="col-md-4">
                        <label className="form-label">Номер на поръчка</label>
                        <input
                            ref={searchInputRef}
                            className="form-control"
                            placeholder="напр. ORD1785579800024"
                            value={q}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setDebouncedQ(q.trim());
                                }
                            }}
                            autoComplete="off"
                        />
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

            {loading ? (
                <div className="text-center text-light py-4">Търсене...</div>
            ) : orders.length === 0 ? (
                <div className="text-center text-light py-4">
                    {debouncedQ
                        ? `Няма поръчка за „${debouncedQ}“`
                        : 'Няма намерени поръчки'}
                </div>
            ) : (
                <>
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
                                    <td><code>{order.orderId}</code></td>
                                    <td>{order.cashierUsername || '-'}</td>
                                    <td>{order.customerName} <br/>
                                        <small className="text-muted">{order.phoneNumber}</small>
                                    </td>
                                    <td>
                                        <div className="items-list">
                                            {(order.items || []).map((item, index) => {
                                                const refunded = item.refundedQuantity ?? 0;
                                                const returnable = item.returnableQuantity;
                                                const fullyReturned = returnable === 0 && refunded > 0;
                                                const partiallyReturned = refunded > 0 && returnable > 0;
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`item-detail ${fullyReturned ? 'item-returned' : ''} ${partiallyReturned ? 'item-partial-return' : ''}`}
                                                    >
                                                        <span className={fullyReturned ? 'item-name-returned' : ''}>
                                                            {item.name} x {item.quantity}
                                                        </span>
                                                        {refunded > 0 && (
                                                            <small className="d-block item-returned-qty">
                                                                върнато: {refunded}
                                                                {returnable > 0 ? ` · остава: ${returnable}` : ''}
                                                            </small>
                                                        )}
                                                        {item.barcode && (
                                                            <small className="text-dark d-block">
                                                                <i className="bi bi-upc-scan"></i> {item.barcode}
                                                            </small>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td>{formatMoney(order.grandTotal)}</td>
                                    <td>{order.paymentMethod}</td>
                                    <td>{statusBadge(order)}</td>
                                    <td>
                                        {canReturnOrder(order) && (
                                            <button className="btn btn-sm btn-outline-warning" onClick={() => openRefundModal(order)}>
                                                Връщане
                                            </button>
                                        )}
                                    </td>
                                    <td>{formatDate(order.createdAt)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {!/^ORD\d{8,}$/i.test(debouncedQ) && (
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
                        </div>
                    )}
                </>
            )}

            {refundOrderData && (
                <div className="refund-modal-backdrop" onClick={closeRefundModal}>
                    <div className="refund-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="refund-modal-header">
                            <h5 className="mb-0">Връщане — {refundOrderData.orderId}</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={closeRefundModal} disabled={refundSubmitting} />
                        </div>
                        <div className="refund-modal-body">
                            <p className="small text-muted mb-3">Изберете артикули и количества за връщане (като в магазин).</p>
                            <div className="d-flex justify-content-end mb-2">
                                <button type="button" className="btn btn-sm btn-outline-light" onClick={selectAllReturnable}>
                                    Всички останали
                                </button>
                            </div>
                            <div className="refund-items">
                                {(refundOrderData.items || []).map((item) => {
                                    const max = item.returnableQuantity ?? item.quantity ?? 0;
                                    const refunded = item.refundedQuantity ?? 0;
                                    if (max <= 0) {
                                        return (
                                            <div key={item.itemId} className="refund-item refund-item-returned">
                                                <div className="refund-item-info">
                                                    <span className="refund-item-name">{item.name} x {item.quantity}</span>
                                                    <small>върнато: {refunded || item.quantity}</small>
                                                </div>
                                            </div>
                                        );
                                    }
                                    const sel = refundSelections[item.itemId] || { selected: false, quantity: 1, max };
                                    return (
                                        <label key={item.itemId} className={`refund-item ${sel.selected ? 'selected' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={!!sel.selected}
                                                onChange={() => toggleItem(item.itemId)}
                                            />
                                            <div className="refund-item-info">
                                                <span className="refund-item-name">{item.name}</span>
                                                <small>
                                                    {formatMoney(item.price)} · макс. {max}
                                                    {refunded > 0 ? ` · вече върнато: ${refunded}` : ''}
                                                </small>
                                            </div>
                                            <input
                                                type="number"
                                                className="form-control form-control-sm refund-qty"
                                                min={1}
                                                max={max}
                                                value={sel.quantity}
                                                disabled={!sel.selected}
                                                onChange={(e) => setItemQty(item.itemId, e.target.value)}
                                            />
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="row g-2 mt-3">
                                <div className="col-md-8">
                                    <label className="form-label">Причина</label>
                                    <input
                                        className="form-control"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Метод</label>
                                    <select
                                        className="form-select"
                                        value={refundMethod}
                                        onChange={(e) => setRefundMethod(e.target.value)}
                                    >
                                        <option value="CASH">В брой</option>
                                        <option value="CARD">Карта</option>
                                    </select>
                                </div>
                            </div>

                            <div className="refund-total mt-3">
                                За възстановяване: <strong>{formatMoney(refundPreview.amount)}</strong>
                            </div>
                        </div>
                        <div className="refund-modal-footer">
                            <button type="button" className="btn btn-outline-light" onClick={closeRefundModal} disabled={refundSubmitting}>
                                Отказ
                            </button>
                            <button
                                type="button"
                                className="btn btn-warning"
                                onClick={submitRefund}
                                disabled={refundSubmitting || refundPreview.items.length === 0}
                            >
                                {refundSubmitting ? 'Запис...' : 'Потвърди връщане'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
