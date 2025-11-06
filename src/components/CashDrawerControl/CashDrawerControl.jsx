import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import CashDrawerService from '../../Service/CashDrawerService';
import FiscalService from '../../Service/FiscalService';
import { AppContext } from '../../context/AppContext';
import './CashDrawerControl.css';

const CashDrawerControl = () => {
    const { auth } = useContext(AppContext);
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showStartForm, setShowStartForm] = useState(false);
    const [showEndForm, setShowEndForm] = useState(false);
    const [formData, setFormData] = useState({
        startAmount: '',
        endAmount: '',
        notes: '',
        deviceSerialNumber: '',
        registerId: ''
    });
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        loadActiveSession();
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            const all = await FiscalService.getAllDevices();
            
            // Показваме всички активни устройства, но с различни статуси
            const active = (all || []).filter(d => d.status === 'ACTIVE');
            setDevices(active);
            
            // Логика за auto-selection:
            // 1) Ако има само едно свободно устройство – избери го
            // 2) Ако има предпочитано устройство и то е свободно – избери него
            // 3) Иначе не избирай нищо (потребителят да избере ръчно)
            const freeDevices = active.filter(d => !d.locked);
            const prefKey = `preferredDevice:${auth?.name || ''}`;
            const preferred = localStorage.getItem(prefKey);
            const preferredDevice = freeDevices.find(d => d.serialNumber === preferred);
            
            if (freeDevices.length === 1) {
                setFormData(prev => ({ ...prev, deviceSerialNumber: freeDevices[0].serialNumber }));
            } else if (preferredDevice) {
                setFormData(prev => ({ ...prev, deviceSerialNumber: preferredDevice.serialNumber }));
            }
        } catch (e) {
            console.error('Error loading devices', e);
        }
    };

    const loadActiveSession = async () => {
        try {
            setLoading(true);
            const session = await CashDrawerService.getActiveSession();
            setActiveSession(session);
        } catch (error) {
            console.error('Error loading active session:', error);
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

    const handleStartWorkDay = async (e) => {
        e.preventDefault();
        
        if (!formData.startAmount || parseFloat(formData.startAmount) < 0) {
            toast.error('Моля, въведете валидна начална сума');
            return;
        }

        try {
            const response = await CashDrawerService.startWorkDay(
                parseFloat(formData.startAmount), 
                formData.notes,
                formData.deviceSerialNumber || undefined,
                formData.registerId || undefined
            );
            
            setActiveSession(response);
            setShowStartForm(false);
            // запомни предпочитаното устройство за следващи смени
            try {
                const prefKey = `preferredDevice:${auth?.name || ''}`;
                if (formData.deviceSerialNumber) {
                    localStorage.setItem(prefKey, formData.deviceSerialNumber);
                }
            } catch (e) {}
            setFormData({ startAmount: '', endAmount: '', notes: '', deviceSerialNumber: '', registerId: '' });
            toast.success('Работният ден е започнат успешно!');
        } catch (error) {
            console.error('Error starting work day:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            toast.error(error.response?.data?.message || 'Грешка при започване на работния ден');
        }
    };

    const handleEndWorkDay = async (e) => {
        e.preventDefault();
        
        if (!formData.endAmount || parseFloat(formData.endAmount) < 0) {
            toast.error('Моля, въведете валидна крайна сума');
            return;
        }

        try {
            const response = await CashDrawerService.endWorkDay(
                activeSession.id,
                parseFloat(formData.endAmount), 
                formData.notes
            );
            
            setActiveSession(null);
            setShowEndForm(false);
            setFormData({ startAmount: '', endAmount: '', notes: '' });
            toast.success('Работният ден е приключен успешно!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при приключване на работния ден');
            console.error('Error ending work day:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('bg-BG', {
            style: 'currency',
            currency: 'BGN'
        }).format(amount || 0);
    };

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString('bg-BG');
    };

    if (loading) {
        return (
            <div className="cash-drawer-control">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Зареждане...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cash-drawer-control">
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">
                        <i className="bi bi-cash-coin me-2"></i>
                        Контрол на касата
                    </h5>
                </div>
                <div className="card-body">
                    {activeSession ? (
                        // Активна сесия
                        <div className="active-session">
                            <div className="alert alert-success">
                                <h6><i className="bi bi-check-circle me-2"></i>Активна сесия</h6>
                                <p className="mb-0">Работният ден е започнат в {formatDateTime(activeSession.sessionStartTime)}</p>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="info-item">
                                        <label>Начална сума:</label>
                                        <span className="amount">{formatCurrency(activeSession.startAmount)}</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="info-item">
                                        <label>Касиер:</label>
                                        <span title={activeSession.cashierUsername}>
                                            {(auth?.name && auth.name.trim()) ? auth.name : (activeSession.cashierUsername || '')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="info-item">
                                        <label>Фискално устройство:</label>
                                        <span>{(() => {
                                            try {
                                                const d = devices.find(x => x.serialNumber === activeSession.deviceSerialNumber);
                                                return d ? `${d.manufacturer || ''} ${d.model || ''} (${d.serialNumber})`.trim() : (activeSession.deviceSerialNumber || '—');
                                            } catch (e) { return activeSession.deviceSerialNumber || '—'; }
                                        })()}</span>
                                    </div>
                                </div>
                                {activeSession.registerId && (
                                    <div className="col-md-6">
                                        <div className="info-item">
                                            <label>Каса:</label>
                                            <span>{activeSession.registerId}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {activeSession.notes && (
                                <div className="info-item">
                                    <label>Бележки:</label>
                                    <span>{activeSession.notes}</span>
                                </div>
                            )}
                            
                            {/* Бутонът за ръчно приключване е премахнат. При Z-отчет сесията се затваря автоматично. */}
                        </div>
                    ) : (
                        // Няма активна сесия
                        <div className="no-session">
                            <div className="alert alert-info">
                                <h6><i className="bi bi-info-circle me-2"></i>Няма активна сесия</h6>
                                <p className="mb-0">Започнете работния ден, като въведете началната сума в касата</p>
                            </div>
                            
                            <button 
                                className="btn btn-success"
                                onClick={() => setShowStartForm(true)}
                            >
                                <i className="bi bi-play-circle me-2"></i>
                                Започни работен ден
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Форма за започване на работен ден */}
            {showStartForm && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className="bi bi-play-circle me-2"></i>
                                    Започни работен ден
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowStartForm(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleStartWorkDay}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Начална сума в касата (лв.) *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="startAmount"
                                            value={formData.startAmount}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                            required
                                        />
                                        <div className="form-text">
                                            Въведете сумата, с която започвате работния ден
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Фискално устройство *</label>
                                        <select
                                            className="form-control"
                                            name="deviceSerialNumber"
                                            value={formData.deviceSerialNumber}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Изберете устройство</option>
                                            {devices.filter(d => !d.locked).map(d => (
                                                <option key={d.serialNumber} value={d.serialNumber}>
                                                    {d.manufacturer} {d.model} ({d.serialNumber}) - СВОБОДНО
                                                </option>
                                            ))}
                                        </select>
                                        <div className="form-text">Показват се само свободните устройства</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Идентификатор на каса (по избор)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="registerId"
                                            value={formData.registerId}
                                            onChange={handleInputChange}
                                            placeholder="Каса-1 / Till-01"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Бележки</label>
                                        <textarea
                                            className="form-control"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows="3"
                                            placeholder="Допълнителни бележки..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setShowStartForm(false)}
                                    >
                                        Отказ
                                    </button>
                                    <button type="submit" className="btn btn-success">
                                        <i className="bi bi-play-circle me-2"></i>
                                        Започни деня
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалът за ръчно приключване е премахнат. */}
        </div>
    );
};

export default CashDrawerControl;
