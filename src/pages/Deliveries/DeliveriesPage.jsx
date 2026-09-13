import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import DeliveryService from '../../Service/DeliveryService';
import { formatMoney } from '../../util/formatMoney.js';
import './DeliveriesPage.css';

const emptyLine = () => ({ itemId: '', quantity: '', unitCost: '' });

const DeliveriesPage = () => {
    const navigate = useNavigate();
    const { itemsData } = useContext(AppContext);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        supplierName: '',
        referenceNumber: '',
        deliveryDate: new Date().toISOString().slice(0, 10),
        notes: '',
        lines: [emptyLine()]
    });

    const loadDeliveries = async () => {
        try {
            setLoading(true);
            const data = await DeliveryService.list();
            setDeliveries(data || []);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при зареждане на доставките');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeliveries();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setForm({
            supplierName: '',
            referenceNumber: '',
            deliveryDate: new Date().toISOString().slice(0, 10),
            notes: '',
            lines: [emptyLine()]
        });
    };

    const updateLine = (index, field, value) => {
        setForm(prev => {
            const lines = [...prev.lines];
            const line = { ...lines[index], [field]: value };
            if (field === 'itemId') {
                const item = (itemsData || []).find(i => i.itemId === value);
                if (item?.costPrice != null && item.costPrice !== '') {
                    line.unitCost = item.costPrice;
                }
            }
            lines[index] = line;
            return { ...prev, lines };
        });
    };

    const addLine = () => setForm(prev => ({ ...prev, lines: [...prev.lines, emptyLine()] }));
    const removeLine = (index) => {
        setForm(prev => ({
            ...prev,
            lines: prev.lines.length <= 1 ? prev.lines : prev.lines.filter((_, i) => i !== index)
        }));
    };

    const buildRequest = () => ({
        supplierName: form.supplierName,
        referenceNumber: form.referenceNumber,
        deliveryDate: form.deliveryDate,
        notes: form.notes,
        createdBy: 'Admin',
        lines: form.lines.map(line => ({
            itemId: line.itemId,
            quantity: parseInt(line.quantity, 10),
            unitCost: parseFloat(line.unitCost)
        }))
    });

    const validateForm = () => {
        if (!form.lines.length) {
            toast.error('Добавете поне един ред');
            return false;
        }
        for (const line of form.lines) {
            if (!line.itemId) {
                toast.error('Изберете артикул за всеки ред');
                return false;
            }
            if (!parseInt(line.quantity, 10) || parseInt(line.quantity, 10) <= 0) {
                toast.error('Количеството трябва да е > 0');
                return false;
            }
            if (!parseFloat(line.unitCost) || parseFloat(line.unitCost) <= 0) {
                toast.error('Доставната цена за реда трябва да е > 0');
                return false;
            }
        }
        return true;
    };

    const handleSaveDraft = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const request = buildRequest();
            if (editingId) {
                await DeliveryService.updateDraft(editingId, request);
                toast.success('Черновата е обновена');
            } else {
                const created = await DeliveryService.createDraft(request);
                setEditingId(created.deliveryId);
                toast.success('Черновата е създадена');
            }
            await loadDeliveries();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при запис на чернова');
        } finally {
            setSaving(false);
        }
    };

    const handlePost = async (deliveryId) => {
        if (!window.confirm('Зареждане в склада? След това доставката не може да се редактира.')) {
            return;
        }
        try {
            setSaving(true);
            await DeliveryService.post(deliveryId);
            toast.success('Доставката е заредена в склада');
            resetForm();
            await loadDeliveries();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при зареждане в склада');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAndPost = async () => {
        if (!validateForm()) return;
        try {
            setSaving(true);
            const request = buildRequest();
            let deliveryId = editingId;
            if (editingId) {
                await DeliveryService.updateDraft(editingId, request);
            } else {
                const created = await DeliveryService.createDraft(request);
                deliveryId = created.deliveryId;
            }
            await DeliveryService.post(deliveryId);
            toast.success('Доставката е заредена в склада');
            resetForm();
            await loadDeliveries();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при зареждане в склада');
        } finally {
            setSaving(false);
        }
    };

    const editDraft = (delivery) => {
        if (delivery.status !== 'DRAFT') {
            toast.error('Само чернови могат да се редактират');
            return;
        }
        setEditingId(delivery.deliveryId);
        setForm({
            supplierName: delivery.supplierName || '',
            referenceNumber: delivery.referenceNumber || '',
            deliveryDate: delivery.deliveryDate || new Date().toISOString().slice(0, 10),
            notes: delivery.notes || '',
            lines: (delivery.lines || []).map(line => ({
                itemId: line.itemId,
                quantity: line.quantity,
                unitCost: line.unitCost
            }))
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const lineTotal = (line) => {
        const q = parseFloat(line.quantity);
        const c = parseFloat(line.unitCost);
        if (!q || !c) return 0;
        return q * c;
    };

    const formTotal = form.lines.reduce((sum, line) => sum + lineTotal(line), 0);

    return (
        <div className="deliveries-page">
            <div className="container-fluid">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>Доставки</h2>
                        <p className="text-muted mb-0">Документи за зареждане на склада с доставна цена на ред</p>
                    </div>
                    <div className="d-flex gap-2">
                        {editingId && (
                            <button className="btn btn-outline-secondary" onClick={resetForm}>Нова доставка</button>
                        )}
                        <button
                            className="btn btn-outline-primary"
                            onClick={() => navigate('/excel-import?tab=deliveries')}
                        >
                            Импорт от Excel
                        </button>
                    </div>
                </div>

                <div className="card mb-4 delivery-form-card">
                    <div className="card-header">
                        <h5 className="mb-0">{editingId ? `Чернова ${editingId}` : 'Нова доставка'}</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Доставчик</label>
                                <input
                                    className="form-control"
                                    value={form.supplierName}
                                    onChange={(e) => setForm(prev => ({ ...prev, supplierName: e.target.value }))}
                                    placeholder="Име на доставчик"
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Номер / референция</label>
                                <input
                                    className="form-control"
                                    value={form.referenceNumber}
                                    onChange={(e) => setForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                                    placeholder="Фактура / ЛК"
                                />
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Дата</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={form.deliveryDate}
                                    onChange={(e) => setForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Бележки</label>
                            <textarea
                                className="form-control"
                                rows="2"
                                value={form.notes}
                                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th>Артикул</th>
                                        <th style={{ width: '120px' }}>Количество</th>
                                        <th style={{ width: '160px' }}>Доставна цена (€)</th>
                                        <th style={{ width: '120px' }}>Сума</th>
                                        <th style={{ width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.lines.map((line, index) => (
                                        <tr key={index}>
                                            <td>
                                                <select
                                                    className="form-select"
                                                    value={line.itemId}
                                                    onChange={(e) => updateLine(index, 'itemId', e.target.value)}
                                                >
                                                    <option value="">Изберете артикул</option>
                                                    {(itemsData || []).map(item => (
                                                        <option key={item.itemId} value={item.itemId}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="form-control"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={line.unitCost}
                                                    onChange={(e) => updateLine(index, 'unitCost', e.target.value)}
                                                />
                                            </td>
                                            <td>{formatMoney(lineTotal(line))}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => removeLine(index)}
                                                    disabled={form.lines.length <= 1}
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center">
                            <button type="button" className="btn btn-outline-primary" onClick={addLine}>
                                + Ред
                            </button>
                            <strong>Общо: {formatMoney(formTotal)}</strong>
                        </div>

                        <div className="d-flex gap-2 mt-3">
                            <button className="btn btn-secondary" disabled={saving} onClick={handleSaveDraft}>
                                Запази чернова
                            </button>
                            <button className="btn btn-success" disabled={saving} onClick={handleSaveAndPost}>
                                Зареди в склада
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h5 className="mb-0">Списък доставки</h5>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border" role="status" />
                            </div>
                        ) : deliveries.length === 0 ? (
                            <p className="text-muted mb-0">Няма доставки.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Доставчик</th>
                                            <th>Референция</th>
                                            <th>Дата</th>
                                            <th>Статус</th>
                                            <th>Общо</th>
                                            <th>Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.map(delivery => (
                                            <tr key={delivery.deliveryId}>
                                                <td><code>{delivery.deliveryId}</code></td>
                                                <td>{delivery.supplierName || '—'}</td>
                                                <td>{delivery.referenceNumber || '—'}</td>
                                                <td>{delivery.deliveryDate || '—'}</td>
                                                <td>
                                                    <span className={`badge ${delivery.status === 'POSTED' ? 'bg-success' : 'bg-secondary'}`}>
                                                        {delivery.status === 'POSTED' ? 'Заредена' : 'Чернова'}
                                                    </span>
                                                </td>
                                                <td>{formatMoney(delivery.totalCost)}</td>
                                                <td className="d-flex gap-1">
                                                    {delivery.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => editDraft(delivery)}
                                                            >
                                                                Редактирай
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                disabled={saving}
                                                                onClick={() => handlePost(delivery.deliveryId)}
                                                            >
                                                                Зареди
                                                            </button>
                                                        </>
                                                    )}
                                                    {delivery.status === 'POSTED' && (
                                                        <span className="text-muted small">Заключена</span>
                                                    )}
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
    );
};

export default DeliveriesPage;
