import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import FiscalService from '../../Service/FiscalService';
import './ManageFiscalDevices.css';

const ManageFiscalDevices = () => {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [formData, setFormData] = useState({
        serialNumber: '',
        manufacturer: '',
        model: '',
        fiscalMemoryNumber: '',
        apiEndpoint: '',
        apiKey: '',
        location: '',
        notes: ''
    });

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const data = await FiscalService.getAllDevices();
            setDevices(data);
        } catch (error) {
            toast.error('Грешка при зареждане на фискални устройства');
            console.error('Error loading devices:', error);
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
            serialNumber: '',
            manufacturer: '',
            model: '',
            fiscalMemoryNumber: '',
            apiEndpoint: '',
            apiKey: '',
            location: '',
            notes: ''
        });
        setEditingDevice(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (editingDevice) {
                await FiscalService.updateDevice(formData);
                toast.success('Фискалното устройство е обновено');
            } else {
                await FiscalService.registerDevice(formData);
                toast.success('Фискалното устройство е регистрирано');
            }
            
            resetForm();
            loadDevices();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при запис на фискално устройство');
            console.error('Error saving device:', error);
        }
    };

    const handleEdit = (device) => {
        setEditingDevice(device);
        setFormData({
            serialNumber: device.serialNumber,
            manufacturer: device.manufacturer || '',
            model: device.model || '',
            fiscalMemoryNumber: device.fiscalMemoryNumber || '',
            apiEndpoint: device.apiEndpoint || '',
            apiKey: device.apiKey || '',
            location: device.location || '',
            notes: device.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (deviceId) => {
        if (window.confirm('Сигурни ли сте, че искате да изтриете това фискално устройство?')) {
            try {
                await FiscalService.deleteDevice(deviceId);
                toast.success('Фискалното устройство е изтрито');
                loadDevices();
            } catch (error) {
                toast.error('Грешка при изтриване на фискално устройство');
                console.error('Error deleting device:', error);
            }
        }
    };

    const checkDeviceStatus = async (serialNumber) => {
        try {
            const status = await FiscalService.checkDeviceStatus(serialNumber);
            toast.success(`Устройство ${serialNumber}: ${status ? 'свързано' : 'изключено'}`);
        } catch (error) {
            toast.error('Грешка при проверка на статуса');
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'ACTIVE': 'badge-success',
            'INACTIVE': 'badge-secondary',
            'MAINTENANCE': 'badge-warning',
            'ERROR': 'badge-danger',
            'DISCONNECTED': 'badge-dark'
        };
        
        return (
            <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
                {status}
            </span>
        );
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
                        <h2>🏪 Фискални устройства</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Добави устройство
                        </button>
                    </div>

                    {showForm && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5>{editingDevice ? 'Редакция на фискално устройство' : 'Регистрация на фискално устройство'}</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Сериен номер *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="serialNumber"
                                                value={formData.serialNumber}
                                                onChange={handleInputChange}
                                                required
                                                disabled={editingDevice}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Производител</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="manufacturer"
                                                value={formData.manufacturer}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Модел</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="model"
                                                value={formData.model}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Номер на фискална памет</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="fiscalMemoryNumber"
                                                value={formData.fiscalMemoryNumber}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">API адрес</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                name="apiEndpoint"
                                                value={formData.apiEndpoint}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">API ключ</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="apiKey"
                                                value={formData.apiKey}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Локация</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Бележки</label>
                                            <textarea
                                                className="form-control"
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleInputChange}
                                                rows="3"
                                            />
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-primary">
                                            {editingDevice ? 'Обнови устройство' : 'Регистрирай устройство'}
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

                    <div className="card">
                        <div className="card-header">
                            <h5>Регистрирани фискални устройства</h5>
                        </div>
                        <div className="card-body">
                            {devices.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="bi bi-printer display-1 text-muted"></i>
                                    <p className="mt-3 text-muted">Няма регистрирани фискални устройства.</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => setShowForm(true)}
                                    >
                                        Регистрирай първо устройство
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Сериен номер</th>
                                                <th>Производител</th>
                                                <th>Модел</th>
                                                <th>Локация</th>
                                                <th>Статус</th>
                                                <th>Дата на регистрация</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {devices.map((device) => (
                                                <tr key={device.id}>
                                                    <td>
                                                        <strong>{device.serialNumber}</strong>
                                                    </td>
                                                    <td>{device.manufacturer || '-'}</td>
                                                    <td>{device.model || '-'}</td>
                                                    <td>{device.location || '-'}</td>
                                                    <td>{getStatusBadge(device.status)}</td>
                                                    <td>
                                                        {new Date(device.registrationDate).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <div className="btn-group" role="group">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary"
                                                                onClick={() => checkDeviceStatus(device.serialNumber)}
                                                                title="Провери статус"
                                                            >
                                                                <i className="bi bi-wifi"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => handleEdit(device)}
                                                                title="Редакция"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(device.id)}
                                                                title="Изтрий"
                                                            >
                                                                <i className="bi bi-trash"></i>
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

export default ManageFiscalDevices;
