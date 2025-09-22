import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import InventoryService from '../../Service/InventoryService';
import './InventoryManagement.css';

const InventoryManagement = () => {
    const [summary, setSummary] = useState(null);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showStockForm, setShowStockForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        quantity: 0,
        unitPrice: 0,
        notes: '',
        adjustmentType: 'COUNT_CORRECTION',
        reason: ''
    });

    useEffect(() => {
        loadInventoryData();
    }, []);

    const loadInventoryData = async () => {
        try {
            setLoading(true);
            const [summaryData, lowStockData, outOfStockData, allItemsData, transactionsData, alertsData] = await Promise.all([
                InventoryService.getInventorySummary(),
                InventoryService.getLowStockItems(),
                InventoryService.getOutOfStockItems(),
                InventoryService.getAllItems(),
                InventoryService.getRecentTransactions(),
                InventoryService.getActiveAlerts()
            ]);
            
            setSummary(summaryData);
            setLowStockItems(lowStockData);
            setOutOfStockItems(outOfStockData);
            setAllItems(allItemsData);
            setRecentTransactions(transactionsData);
            setActiveAlerts(alertsData);
        } catch (error) {
            toast.error('Error loading inventory data');
            console.error('Error loading inventory data:', error);
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
            quantity: 0,
            unitPrice: 0,
            notes: '',
            adjustmentType: 'COUNT_CORRECTION',
            reason: ''
        });
        setSelectedItem(null);
        setShowStockForm(false);
    };

    const handleStockOperation = async (operation) => {
        if (!selectedItem) {
            toast.error('Please select an item first');
            return;
        }

        try {
            const request = {
                itemId: selectedItem.itemId,
                itemName: selectedItem.name,
                quantity: parseInt(formData.quantity),
                unitPrice: parseFloat(formData.unitPrice),
                notes: formData.notes,
                createdBy: 'Admin', // You can get this from context
                adjustmentType: formData.adjustmentType,
                reason: formData.reason
            };

            let result;
            switch (operation) {
                case 'add':
                    result = await InventoryService.addStock(request);
                    break;
                case 'remove':
                    result = await InventoryService.removeStock(request);
                    break;
                case 'adjust':
                    result = await InventoryService.adjustStock(request);
                    break;
                default:
                    toast.error('Invalid operation');
                    return;
            }
            
            toast.success(`${operation.charAt(0).toUpperCase() + operation.slice(1)} stock operation completed successfully`);
            resetForm();
            loadInventoryData();
        } catch (error) {
            toast.error(error.response?.data?.message || `Error performing ${operation} operation`);
            console.error(`Error performing ${operation} operation:`, error);
        }
    };

    const getStockStatusBadge = (status) => {
        const statusClasses = {
            'NORMAL': 'badge-success',
            'LOW_STOCK': 'badge-warning',
            'OUT_OF_STOCK': 'badge-danger',
            'OVERSTOCK': 'badge-info'
        };
        
        return (
            <span className={`badge ${statusClasses[status] || 'badge-secondary'}`}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const getTransactionTypeBadge = (type) => {
        const typeClasses = {
            'SALE': 'badge-danger',
            'PURCHASE': 'badge-success',
            'ADJUSTMENT': 'badge-warning',
            'TRANSFER_IN': 'badge-info',
            'TRANSFER_OUT': 'badge-secondary'
        };
        
        return (
            <span className={`badge ${typeClasses[type] || 'badge-secondary'}`}>
                {type.replace('_', ' ')}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount || 0);
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
        <div className="container mt-4 inventory-page">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>📦 Inventory Management</h2>
                        <button 
                            className="btn btn-primary"
                            onClick={() => setShowStockForm(true)}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            Stock Operation
                        </button>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card bg-primary text-white">
                                    <div className="card-body">
                                        <h5 className="card-title">Total Items</h5>
                                        <h3>{summary.totalItems}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-warning text-dark">
                                    <div className="card-body">
                                        <h5 className="card-title">Low Stock</h5>
                                        <h3>{summary.lowStockItems}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-danger text-white">
                                    <div className="card-body">
                                        <h5 className="card-title">Out of Stock</h5>
                                        <h3>{summary.outOfStockItems}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-success text-white">
                                    <div className="card-body">
                                        <h5 className="card-title">Total Value</h5>
                                        <h3>{formatCurrency(summary.totalInventoryValue)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stock Operation Form */}
                    {showStockForm && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5>Stock Operation</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Item</label>
                                        <select
                                            className="form-select"
                                            value={selectedItem?.itemId || ''}
                                            onChange={(e) => {
                                                const item = allItems.find(i => i.itemId === e.target.value);
                                                setSelectedItem(item);
                                            }}
                                        >
                                            <option value="">Select Item</option>
                                            {allItems.map((item) => (
                                                <option key={item.itemId} value={item.itemId}>
                                                    {item.name} - Current: {item.stockQuantity || 0} {item.unitOfMeasure || 'pcs'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Operation Type</label>
                                        <select
                                            className="form-select"
                                            name="adjustmentType"
                                            value={formData.adjustmentType}
                                            onChange={handleInputChange}
                                        >
                                            <option value="COUNT_CORRECTION">Count Correction</option>
                                            <option value="DAMAGE">Damage</option>
                                            <option value="EXPIRY">Expiry</option>
                                            <option value="THEFT">Theft</option>
                                            <option value="LOSS">Loss</option>
                                            <option value="FOUND">Found</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            placeholder="Enter quantity"
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Unit Price</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="unitPrice"
                                            value={formData.unitPrice}
                                            onChange={handleInputChange}
                                            placeholder="Enter unit price"
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Reason</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="reason"
                                            value={formData.reason}
                                            onChange={handleInputChange}
                                            placeholder="Enter reason"
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-control"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Additional notes..."
                                    />
                                </div>

                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-success"
                                        onClick={() => handleStockOperation('add')}
                                        disabled={!selectedItem}
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Add Stock
                                    </button>
                                    <button 
                                        className="btn btn-warning"
                                        onClick={() => handleStockOperation('remove')}
                                        disabled={!selectedItem}
                                    >
                                        <i className="bi bi-dash-circle me-2"></i>
                                        Remove Stock
                                    </button>
                                    <button 
                                        className="btn btn-info"
                                        onClick={() => handleStockOperation('adjust')}
                                        disabled={!selectedItem}
                                    >
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        Adjust Stock
                                    </button>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={resetForm}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Low Stock Items */}
                    <div className="card mb-4 low-stock-card">
                        <div className="card-header">
                            <h5>⚠️ Low Stock Items ({lowStockItems.length})</h5>
                        </div>
                        <div className="card-body">
                            {lowStockItems.length === 0 ? (
                                <p className="text-muted">No low stock items.</p>
                            ) : (
                                <div className="table-responsive scroll-y">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Item Name</th>
                                                <th>Barcode</th>
                                                <th>Current Stock</th>
                                                <th>Reorder Point</th>
                                                <th>Status</th>
                                                <th>Needs Reorder</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStockItems.map((item) => (
                                                <tr key={item.itemId}>
                                                    <td>{item.itemName || item.name}</td>
                                                    <td>{item.barcode}</td>
                                                    <td>
                                                        <strong>{(item.currentStock ?? item.stockQuantity ?? 0)} {item.unitOfMeasure}</strong>
                                                    </td>
                                                    <td>{item.reorderPoint} {item.unitOfMeasure}</td>
                                                    <td>{getStockStatusBadge(item.stockStatus)}</td>
                                                    <td>
                                                        {item.needsReorder ? (
                                                            <span className="badge bg-danger">Yes</span>
                                                        ) : (
                                                            <span className="badge bg-success">No</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => {
                                                                setSelectedItem(item);
                                                                setShowStockForm(true);
                                                            }}
                                                        >
                                                            <i className="bi bi-plus-circle"></i> Add Stock
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="card recent-transactions-card">
                        <div className="card-header">
                            <h5>📊 Recent Transactions</h5>
                        </div>
                        <div className="card-body">
                            {recentTransactions.length === 0 ? (
                                <p className="text-muted">No recent transactions.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Type</th>
                                                <th>Quantity</th>
                                                <th>Previous Stock</th>
                                                <th>New Stock</th>
                                                <th>Unit Price</th>
                                                <th>Total Value</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map((transaction) => (
                                                <tr key={transaction.transactionId}>
                                                    <td>{transaction.itemName}</td>
                                                    <td>{getTransactionTypeBadge(transaction.transactionType)}</td>
                                                    <td>
                                                        <span className={transaction.quantity > 0 ? 'text-success' : 'text-danger'}>
                                                            {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                                                        </span>
                                                    </td>
                                                    <td>{transaction.previousStock}</td>
                                                    <td>{transaction.newStock}</td>
                                                    <td>{formatCurrency(transaction.unitPrice)}</td>
                                                    <td>{formatCurrency(transaction.totalValue)}</td>
                                                    <td>
                                                        {new Date(transaction.createdAt).toLocaleString()}
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

export default InventoryManagement;
