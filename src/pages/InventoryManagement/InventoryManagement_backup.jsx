import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import InventoryService from '../../Service/InventoryService';
import './InventoryManagement.css';

const InventoryManagement = () => {
    const [summary, setSummary] = useState(null);
    const [lowStockItems, setLowStockItems] = useState([]);
    const [outOfStockItems, setOutOfStockItems] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
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
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState('name'); // 'name', 'barcode'
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // 'NORMAL', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK'
    const [sortBy, setSortBy] = useState('name'); // 'name', 'stock', 'price', 'category'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [showAllItems, setShowAllItems] = useState(false);

    useEffect(() => {
        loadInventoryData();
    }, []);

    // Filter and sort items when dependencies change
    useEffect(() => {
        filterAndSortItems();
    }, [allItems, searchTerm, searchBy, categoryFilter, statusFilter, sortBy, sortOrder]);

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
            toast.error('Грешка при зареждане на складовите данни');
            console.error('Error loading inventory data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortItems = () => {
        let filtered = [...allItems];

        // Search filter
        if (searchTerm.trim()) {
            filtered = filtered.filter(item => {
                if (searchBy === 'name') {
                    return item.name?.toLowerCase().includes(searchTerm.toLowerCase());
                } else if (searchBy === 'barcode') {
                    return item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
                }
                return true;
            });
        }

        // Category filter
        if (categoryFilter) {
            filtered = filtered.filter(item => 
                item.category?.name === categoryFilter
            );
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(item => {
                const stock = item.stockQuantity || 0;
                switch (statusFilter) {
                    case 'OUT_OF_STOCK':
                        return stock === 0;
                    case 'LOW_STOCK':
                        return stock > 0 && stock <= (item.reorderPoint || 10);
                    case 'NORMAL':
                        return stock > (item.reorderPoint || 10);
                    case 'OVERSTOCK':
                        return stock > (item.reorderPoint || 10) * 3;
                    default:
                        return true;
                }
            });
        }

        // Sort
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'name':
                    aValue = a.name || '';
                    bValue = b.name || '';
                    break;
                case 'stock':
                    aValue = a.stockQuantity || 0;
                    bValue = b.stockQuantity || 0;
                    break;
                case 'price':
                    aValue = a.price || 0;
                    bValue = b.price || 0;
                    break;
                case 'category':
                    aValue = a.category?.name || '';
                    bValue = b.category?.name || '';
                    break;
                default:
                    aValue = a.name || '';
                    bValue = b.name || '';
            }

            if (typeof aValue === 'string') {
                return sortOrder === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else {
                return sortOrder === 'asc' 
                    ? aValue - bValue
                    : bValue - aValue;
            }
        });

        setFilteredItems(filtered);
    };

    const getUniqueCategories = () => {
        const categories = allItems
            .map(item => item.category?.name)
            .filter((name, index, arr) => name && arr.indexOf(name) === index);
        return categories.sort();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('');
        setStatusFilter('');
        setSortBy('name');
        setSortOrder('asc');
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
            toast.error('Моля, първо изберете артикул');
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
                    toast.error('Невалидна операция');
                    return;
            }
            
            toast.success('Операцията е изпълнена успешно');
            resetForm();
            loadInventoryData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при изпълнение на операцията');
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
        return new Intl.NumberFormat('bg-BG', {
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
        <div className="inventory-page">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>📦 Склад</h2>
                            <button 
                                className="btn btn-primary"
                                onClick={() => setShowStockForm(true)}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Складова операция
                            </button>
                        </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="row mb-4">
                            <div className="col-md-3">
                                <div className="card bg-primary text-white">
                                    <div className="card-body">
                                        <h5 className="card-title">Общо артикули</h5>
                                        <h3>{summary.totalItems}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-warning text-dark">
                                    <div className="card-body">
                                        <h5 className="card-title">Ниска наличност</h5>
                                        <h3>{summary.lowStockItems}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-danger text-white">
                                    <div className="card-body">
                                        <h5 className="card-title">Изчерпани</h5>
                                        <h3>{summary.outOfStockItems}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="card bg-success text-white">
                                    <div className="card-body">
                                        <h5 className="card-title">Обща стойност</h5>
                                        <h3>{formatCurrency(summary.totalInventoryValue)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search and Filter Section */}
                    <div className="card mb-4 search-filter-card">
                        <div className="card-header">
                            <h5>🔍 Търсене и филтриране</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Търсене</label>
                                    <div className="input-group">
                                        <select 
                                            className="form-select" 
                                            style={{maxWidth: '120px'}}
                                            value={searchBy}
                                            onChange={(e) => setSearchBy(e.target.value)}
                                        >
                                            <option value="name">По име</option>
                                            <option value="barcode">По баркод</option>
                                        </select>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={`Търсене ${searchBy === 'name' ? 'по име' : 'по баркод'}...`}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-2 mb-3">
                                    <label className="form-label">Категория</label>
                                    <select
                                        className="form-select"
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="">Всички категории</option>
                                        {getUniqueCategories().map(category => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2 mb-3">
                                    <label className="form-label">Статус</label>
                                    <select
                                        className="form-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">Всички статуси</option>
                                        <option value="OUT_OF_STOCK">Изчерпани</option>
                                        <option value="LOW_STOCK">Ниска наличност</option>
                                        <option value="NORMAL">Нормална</option>
                                        <option value="OVERSTOCK">Преизобилие</option>
                                    </select>
                                </div>
                                <div className="col-md-2 mb-3">
                                    <label className="form-label">Сортиране</label>
                                    <select
                                        className="form-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="name">По име</option>
                                        <option value="stock">По наличност</option>
                                        <option value="price">По цена</option>
                                        <option value="category">По категория</option>
                                    </select>
                                </div>
                                <div className="col-md-2 mb-3">
                                    <label className="form-label">Ред</label>
                                    <div className="d-flex gap-2">
                                        <button
                                            className={`btn btn-sm ${sortOrder === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setSortOrder('asc')}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            className={`btn btn-sm ${sortOrder === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setSortOrder('desc')}
                                        >
                                            ↓
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-12">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="text-muted">
                                                Показани {filteredItems.length} от {allItems.length} артикула
                                            </span>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={clearFilters}
                                            >
                                                Изчисти филтри
                                            </button>
                                            <button
                                                className={`btn btn-sm ${showAllItems ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => setShowAllItems(!showAllItems)}
                                            >
                                                {showAllItems ? 'Скрий всички' : 'Покажи всички артикули'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Operation Form */}
                    {showStockForm && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <h5>Складова операция</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Артикул</label>
                                        <select
                                            className="form-select"
                                            value={selectedItem?.itemId || ''}
                                            onChange={(e) => {
                                                const item = allItems.find(i => i.itemId === e.target.value);
                                                setSelectedItem(item);
                                            }}
                                        >
                                            <option value="">Изберете артикул</option>
                                            {allItems.map((item) => (
                                                <option key={item.itemId} value={item.itemId}>
                                                    {item.name} - Наличност: {item.stockQuantity || 0} бр
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Вид операция</label>
                                        <select
                                            className="form-select"
                                            name="adjustmentType"
                                            value={formData.adjustmentType}
                                            onChange={handleInputChange}
                                        >
                                            <option value="COUNT_CORRECTION">Корекция на наличност</option>
                                            <option value="DAMAGE">Повреда</option>
                                            <option value="EXPIRY">Изтекъл срок</option>
                                            <option value="THEFT">Кражба</option>
                                            <option value="LOSS">Загуба</option>
                                            <option value="FOUND">Намерени</option>
                                            <option value="OTHER">Друго</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="row">
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Количество</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleInputChange}
                                            placeholder="Въведете количество"
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Единична цена</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="unitPrice"
                                            value={formData.unitPrice}
                                            onChange={handleInputChange}
                                            placeholder="Въведете единична цена"
                                        />
                                    </div>
                                    <div className="col-md-4 mb-3">
                                        <label className="form-label">Причина</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="reason"
                                            value={formData.reason}
                                            onChange={handleInputChange}
                                            placeholder="Въведете причина"
                                        />
                                    </div>
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

                                <div className="d-flex gap-2">
                                    <button 
                                        className="btn btn-success"
                                        onClick={() => handleStockOperation('add')}
                                        disabled={!selectedItem}
                                    >
                                        <i className="bi bi-plus-circle me-2"></i>
                                        Добави
                                    </button>
                                    <button 
                                        className="btn btn-warning"
                                        onClick={() => handleStockOperation('remove')}
                                        disabled={!selectedItem}
                                    >
                                        <i className="bi bi-dash-circle me-2"></i>
                                        Намали
                                    </button>
                                    <button 
                                        className="btn btn-info"
                                        onClick={() => handleStockOperation('adjust')}
                                        disabled={!selectedItem}
                                    >
                                        <i className="bi bi-arrow-clockwise me-2"></i>
                                        Коригирай
                                    </button>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={resetForm}
                                    >
                                        Отказ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Low Stock Items */}
                    <div className="card mb-4 low-stock-card">
                        <div className="card-header">
                            <h5>⚠️ Ниска наличност ({lowStockItems.length})</h5>
                        </div>
                        <div className="card-body">
                            {lowStockItems.length === 0 ? (
                                <p className="text-muted">Няма артикули с ниска наличност.</p>
                            ) : (
                                <div className="table-responsive scroll-y">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Артикул</th>
                                                <th>Баркод</th>
                                                <th>Наличност</th>
                                                <th>Точка за презареждане</th>
                                                <th>Статус</th>
                                                <th>Нужда от поръчка</th>
                                                <th>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStockItems.map((item) => (
                                                <tr key={item.itemId}>
                                                    <td>{item.itemName || item.name}</td>
                                                    <td>{item.barcode}</td>
                                                    <td>
                                                        <strong>{(item.currentStock ?? item.stockQuantity ?? 0)} бр</strong>
                                                    </td>
                                                    <td>{item.reorderPoint} бр</td>
                                                    <td>{getStockStatusBadge(item.stockStatus)}</td>
                                                    <td>
                                                        {item.needsReorder ? (
                                                            <span className="badge bg-danger">Да</span>
                                                        ) : (
                                                            <span className="badge bg-success">Не</span>
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
                                                            <i className="bi bi-plus-circle"></i> Добави
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

                    {/* All Items Table */}
                    {showAllItems && (
                        <div className="card mb-4 all-items-card">
                            <div className="card-header">
                                <h5>📋 Всички артикули ({filteredItems.length})</h5>
                            </div>
                            <div className="card-body">
                                {filteredItems.length === 0 ? (
                                    <p className="text-muted">Няма артикули, отговарящи на филтрите.</p>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Артикул</th>
                                                    <th>Категория</th>
                                                    <th>Баркод</th>
                                                    <th>Наличност</th>
                                                    <th>Цена</th>
                                                    <th>Статус</th>
                                                    <th>Действия</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredItems.map((item) => {
                                                    const stock = item.stockQuantity || 0;
                                                    const reorderPoint = item.reorderPoint || 10;
                                                    let status = 'NORMAL';
                                                    if (stock === 0) status = 'OUT_OF_STOCK';
                                                    else if (stock <= reorderPoint) status = 'LOW_STOCK';
                                                    else if (stock > reorderPoint * 3) status = 'OVERSTOCK';

                                                    return (
                                                        <tr key={item.itemId}>
                                                            <td>
                                                                <div>
                                                                    <strong>{item.name}</strong>
                                                                    {item.description && (
                                                                        <div className="text-muted small">
                                                                            {item.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className="badge bg-secondary">
                                                                    {item.category?.name || 'Без категория'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <code>{item.barcode || 'Няма баркод'}</code>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <strong className={stock === 0 ? 'text-danger' : stock <= reorderPoint ? 'text-warning' : 'text-success'}>
                                                                        {stock} бр
                                                                    </strong>
                                                                    {stock <= reorderPoint && stock > 0 && (
                                                                        <small className="text-muted ms-2">
                                                                            (мин: {reorderPoint})
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <strong>{formatCurrency(item.price)}</strong>
                                                            </td>
                                                            <td>{getStockStatusBadge(status)}</td>
                                                            <td>
                                                                <div className="d-flex gap-1">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-primary"
                                                                        onClick={() => {
                                                                            setSelectedItem(item);
                                                                            setShowStockForm(true);
                                                                        }}
                                                                        title="Складова операция"
                                                                    >
                                                                        <i className="bi bi-gear"></i>
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-info"
                                                                        onClick={() => {
                                                                            // TODO: Show item details modal
                                                                            toast.info('Детайли за артикула');
                                                                        }}
                                                                        title="Детайли"
                                                                    >
                                                                        <i className="bi bi-eye"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    <div className="card recent-transactions-card">
                        <div className="card-header">
                            <h5>📊 Последни транзакции</h5>
                        </div>
                        <div className="card-body">
                            {recentTransactions.length === 0 ? (
                                <p className="text-muted">Няма последни транзакции.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Артикул</th>
                                                <th>Тип</th>
                                                <th>Количество</th>
                                                <th>Стара наличност</th>
                                                <th>Нова наличност</th>
                                                <th>Единична цена</th>
                                                <th>Обща стойност</th>
                                                <th>Дата</th>
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
        </div>
    );
};

export default InventoryManagement;
