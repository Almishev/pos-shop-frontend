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
            toast.error('Error loading fiscal devices');
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
                toast.success('Fiscal device updated successfully');
            } else {
                await FiscalService.registerDevice(formData);
                toast.success('Fiscal device registered successfully');
            }
            
            resetForm();
            loadDevices();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving fiscal device');
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
        if (window.confirm('Are you sure you want to delete this fiscal device?')) {
            try {
                await FiscalService.deleteDevice(deviceId);
                toast.success('Fiscal device deleted successfully');
                loadDevices();
            } catch (error) {
                toast.error('Error deleting fiscal device');
                console.error('Error deleting device:', error);
            }
        }
    };

    const checkDeviceStatus = async (serialNumber) => {
        try {
            const status = await FiscalService.checkDeviceStatus(serialNumber);
            toast.success(`Device ${serialNumber} is ${status ? 'connected' : 'disconnected'}`);
        } catch (error) {
            toast.error('Error checking device status');
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
                        <h2>🏪 Fiscal Devices Management</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowForm(true)}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add New Device
                        </button>
                    </div>

                    {showForm && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5>{editingDevice ? 'Edit Fiscal Device' : 'Register New Fiscal Device'}</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Serial Number *</label>
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
                                            <label className="form-label">Manufacturer</label>
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
                                            <label className="form-label">Model</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="model"
                                                value={formData.model}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Fiscal Memory Number</label>
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
                                            <label className="form-label">API Endpoint</label>
                                            <input
                                                type="url"
                                                className="form-control"
                                                name="apiEndpoint"
                                                value={formData.apiEndpoint}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">API Key</label>
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
                                            <label className="form-label">Location</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Notes</label>
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
                                            {editingDevice ? 'Update Device' : 'Register Device'}
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
                            <h5>Registered Fiscal Devices</h5>
                        </div>
                        <div className="card-body">
                            {devices.length === 0 ? (
                                <div className="text-center py-4">
                                    <i className="bi bi-printer display-1 text-muted"></i>
                                    <p className="mt-3 text-muted">No fiscal devices registered yet.</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => setShowForm(true)}
                                    >
                                        Register First Device
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Serial Number</th>
                                                <th>Manufacturer</th>
                                                <th>Model</th>
                                                <th>Location</th>
                                                <th>Status</th>
                                                <th>Registration Date</th>
                                                <th>Actions</th>
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
                                                                title="Check Status"
                                                            >
                                                                <i className="bi bi-wifi"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() => handleEdit(device)}
                                                                title="Edit"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(device.id)}
                                                                title="Delete"
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
