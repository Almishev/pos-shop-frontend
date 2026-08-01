import React, { useState, useEffect, useContext, useRef } from 'react';
import toast from 'react-hot-toast';
import LoyaltyService from '../../Service/LoyaltyService';
import { AppContext } from '../../context/AppContext';
import './LoyaltyManagement.css';

const LoyaltyManagement = () => {
    const { auth } = useContext(AppContext);
    const isAdmin = auth.role === 'ROLE_ADMIN';
    const [activeTab, setActiveTab] = useState('customers');
    const [customers, setCustomers] = useState([]);
    const [promotionRules, setPromotionRules] = useState([]);
    const [topCustomers, setTopCustomers] = useState([]);
    const [mostUsedPromotions, setMostUsedPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [showPromotionForm, setShowPromotionForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [isScanMode, setIsScanMode] = useState(false);
    const loyaltyCardBarcodeInputRef = useRef(null);

    // Customer form state
    const [customerForm, setCustomerForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        loyaltyCardBarcode: '',
        isLoyaltyActive: false,
        status: 'ACTIVE',
        notes: ''
    });

    // Promotion form state
    const [promotionForm, setPromotionForm] = useState({
        name: '',
        description: '',
        ruleType: 'PRODUCT',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        minimumQuantity: null,
        minimumAmount: null,
        targetItemId: '',
        targetCategoryId: '',
        buyQuantity: null,
        getQuantity: null,
        getDiscountPercentage: null,
        validFrom: '',
        validUntil: '',
        isActive: true,
        maxUsagePerCustomer: null,
        maxTotalUsage: null,
        priority: 0,
        requiresLoyaltyCard: false,
        minimumLoyaltyPoints: 0
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'customers') {
                const response = await LoyaltyService.getAllCustomers();
                setCustomers(response.data);
            } else if (activeTab === 'promotions') {
                const response = await LoyaltyService.getAllPromotionRules();
                setPromotionRules(response.data);
            } else if (activeTab === 'analytics') {
                const [topCustomersResponse, mostUsedPromotionsResponse] = await Promise.all([
                    LoyaltyService.getTopCustomers(10),
                    LoyaltyService.getMostUsedPromotions(10)
                ]);
                setTopCustomers(topCustomersResponse.data);
                setMostUsedPromotions(mostUsedPromotionsResponse.data);
            }
        } catch (error) {
            toast.error('Грешка при зареждане на данните');
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingCustomer) {
                await LoyaltyService.updateCustomer(editingCustomer.customerId, customerForm);
                toast.success('Клиентът е обновен успешно');
            } else {
                await LoyaltyService.createCustomer(customerForm);
                toast.success('Клиентът е създаден успешно');
            }
            setShowCustomerForm(false);
            setEditingCustomer(null);
            resetCustomerForm();
            loadData();
        } catch (error) {
            toast.error('Грешка при запазване на клиента');
            console.error('Error saving customer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePromotionSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingPromotion) {
                await LoyaltyService.updatePromotionRule(editingPromotion.ruleId, promotionForm);
                toast.success('Правилото за промоция е обновено успешно');
            } else {
                await LoyaltyService.createPromotionRule(promotionForm);
                toast.success('Правилото за промоция е създадено успешно');
            }
            setShowPromotionForm(false);
            setEditingPromotion(null);
            resetPromotionForm();
            loadData();
        } catch (error) {
            toast.error('Грешка при запазване на правилото за промоция');
            console.error('Error saving promotion rule:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateLoyaltyCard = async () => {
        try {
            const response = await LoyaltyService.generateLoyaltyCardBarcode();
            setCustomerForm({ ...customerForm, loyaltyCardBarcode: response.data.barcode });
            toast.success('Баркод за лоялна карта е генериран');
        } catch (error) {
            toast.error('Грешка при генериране на баркод');
            console.error('Error generating barcode:', error);
        }
    };

    const startScanMode = () => {
        setIsScanMode(true);
        setTimeout(() => loyaltyCardBarcodeInputRef.current?.focus(), 0);
        toast.success("Сканиращ режим: насочете скенера към баркода и натиснете спусъка");
    };

    const activateLoyaltyCard = async (customerId) => {
        try {
            // Намери клиента, за да получим неговия баркод
            const customerResponse = await LoyaltyService.getCustomerById(customerId);
            const customer = customerResponse.data;
            
            if (!customer.loyaltyCardBarcode || customer.loyaltyCardBarcode.trim() === '') {
                toast.error('Клиентът няма въведен баркод на лоялна карта. Моля, редактирайте клиента и сканирайте баркода от картата.');
                return;
            }
            
            // Активирай картата с съществуващия баркод
            await LoyaltyService.activateLoyaltyCard(customerId, customer.loyaltyCardBarcode);
            toast.success('Лоялната карта е активирана успешно');
            loadData();
        } catch (error) {
            toast.error('Грешка при активиране на лоялната карта');
            console.error('Error activating loyalty card:', error);
        }
    };

    const deactivateLoyaltyCard = async (customerId) => {
        try {
            await LoyaltyService.deactivateLoyaltyCard(customerId);
            toast.success('Лоялната карта е деактивирана успешно');
            loadData();
        } catch (error) {
            toast.error('Грешка при деактивиране на лоялната карта');
            console.error('Error deactivating loyalty card:', error);
        }
    };

    const editCustomer = (customer) => {
        setEditingCustomer(customer);
        setCustomerForm({
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            phoneNumber: customer.phoneNumber || '',
            loyaltyCardBarcode: customer.loyaltyCardBarcode || '',
            isLoyaltyActive: customer.isLoyaltyActive || false,
            status: customer.status || 'ACTIVE',
            notes: customer.notes || ''
        });
        setShowCustomerForm(true);
    };

    const editPromotion = (promotion) => {
        setEditingPromotion(promotion);
        setPromotionForm({
            name: promotion.name || '',
            description: promotion.description || '',
            ruleType: promotion.ruleType || 'PRODUCT',
            discountType: promotion.discountType || 'PERCENTAGE',
            discountValue: promotion.discountValue || 0,
            minimumQuantity: promotion.minimumQuantity || null,
            minimumAmount: promotion.minimumAmount || null,
            targetItemId: promotion.targetItemId || '',
            targetCategoryId: promotion.targetCategoryId || '',
            buyQuantity: promotion.buyQuantity || null,
            getQuantity: promotion.getQuantity || null,
            getDiscountPercentage: promotion.getDiscountPercentage || null,
            validFrom: promotion.validFrom ? promotion.validFrom.split('T')[0] : '',
            validUntil: promotion.validUntil ? promotion.validUntil.split('T')[0] : '',
            isActive: promotion.isActive !== undefined ? promotion.isActive : true,
            maxUsagePerCustomer: promotion.maxUsagePerCustomer || null,
            maxTotalUsage: promotion.maxTotalUsage || null,
            priority: promotion.priority || 0,
            requiresLoyaltyCard: promotion.requiresLoyaltyCard || false,
            minimumLoyaltyPoints: promotion.minimumLoyaltyPoints || 0
        });
        setShowPromotionForm(true);
    };

    const resetCustomerForm = () => {
        setCustomerForm({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            loyaltyCardBarcode: '',
            isLoyaltyActive: false,
            status: 'ACTIVE',
            notes: ''
        });
        setIsScanMode(false);
    };

    const resetPromotionForm = () => {
        setPromotionForm({
            name: '',
            description: '',
            ruleType: 'PRODUCT',
            discountType: 'PERCENTAGE',
            discountValue: 0,
            minimumQuantity: null,
            minimumAmount: null,
            targetItemId: '',
            targetCategoryId: '',
            buyQuantity: null,
            getQuantity: null,
            getDiscountPercentage: null,
            validFrom: '',
            validUntil: '',
            isActive: true,
            maxUsagePerCustomer: null,
            maxTotalUsage: null,
            priority: 0,
            requiresLoyaltyCard: false,
            minimumLoyaltyPoints: 0
        });
    };

    const filteredCustomers = customers.filter(customer =>
        customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber?.includes(searchTerm) ||
        customer.loyaltyCardBarcode?.includes(searchTerm)
    );

    const filteredPromotions = promotionRules.filter(promotion =>
        promotion.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promotion.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="loyalty-management-page">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>Управление на лоялност</h2>
                            <div className="btn-group" role="group">
                                <button
                                    type="button"
                                    className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setActiveTab('customers')}
                                >
                                    Клиенти
                                </button>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className={`btn ${activeTab === 'promotions' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setActiveTab('promotions')}
                                    >
                                        Промоции
                                    </button>
                                )}
                                {isAdmin && (
                                    <button
                                        type="button"
                                        className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setActiveTab('analytics')}
                                    >
                                        Аналитика
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Search and Add Button */}
                        {activeTab !== 'analytics' && (
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="col-md-6">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Търси..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="btn btn-success"
                                    onClick={() => {
                                        if (activeTab === 'customers') {
                                            setShowCustomerForm(true);
                                            setEditingCustomer(null);
                                            resetCustomerForm();
                                        } else if (isAdmin) {
                                            setShowPromotionForm(true);
                                            setEditingPromotion(null);
                                            resetPromotionForm();
                                        }
                                    }}
                                >
                                    {activeTab === 'customers' ? 'Добави клиент' : 'Добави промоция'}
                                </button>
                            </div>
                        )}

                        {/* Customers Tab */}
                        {activeTab === 'customers' && (
                            <div className="card">
                                <div className="card-header">
                                    <h5>Клиенти с лоялни карти</h5>
                                </div>
                                <div className="card-body">
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Зареждане...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Име</th>
                                                        <th>Телефон</th>
                                                        <th>Лоялна карта</th>
                                                        <th>Точки</th>
                                                        <th>Общо похарчени</th>
                                                        <th>Статус</th>
                                                        <th>Действия</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredCustomers.map((customer) => (
                                                        <tr key={customer.customerId}>
                                                            <td>{customer.firstName} {customer.lastName}</td>
                                                            <td>{customer.phoneNumber}</td>
                                                            <td>
                                                                {customer.loyaltyCardBarcode ? (
                                                                    <span className="badge bg-success">
                                                                        {customer.loyaltyCardBarcode}
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge bg-secondary">Няма карта</span>
                                                                )}
                                                            </td>
                                                            <td>{customer.loyaltyPoints || 0}</td>
                                                            <td>{customer.totalSpent?.toFixed(2) || '0.00'} €</td>
                                                            <td>
                                                                <span className={`badge ${customer.isLoyaltyActive ? 'bg-success' : 'bg-warning'}`}>
                                                                    {customer.isLoyaltyActive ? 'Активна' : 'Неактивна'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {isAdmin && (
                                                                    <div className="btn-group btn-group-sm">
                                                                        <button
                                                                            className="btn btn-outline-primary"
                                                                            onClick={() => editCustomer(customer)}
                                                                        >
                                                                            Редактирай
                                                                        </button>
                                                                        {customer.isLoyaltyActive ? (
                                                                            <button
                                                                                className="btn btn-outline-warning"
                                                                                onClick={() => deactivateLoyaltyCard(customer.customerId)}
                                                                            >
                                                                                Деактивирай
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                className="btn btn-outline-success"
                                                                                onClick={() => activateLoyaltyCard(customer.customerId)}
                                                                            >
                                                                                Активирай
                                                                            </button>
                                                                        )}
                                                                    </div>
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
                        )}

                        {/* Promotions Tab */}
                        {activeTab === 'promotions' && isAdmin && (
                            <div className="card">
                                <div className="card-header">
                                    <h5>Правила за промоции</h5>
                                </div>
                                <div className="card-body">
                                    {loading ? (
                                        <div className="text-center">
                                            <div className="spinner-border" role="status">
                                                <span className="visually-hidden">Зареждане...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>Име</th>
                                                        <th>Тип</th>
                                                        <th>Отстъпка</th>
                                                        <th>Активна</th>
                                                        <th>Приоритет</th>
                                                        <th>Използвания</th>
                                                        <th>Действия</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredPromotions.map((promotion) => (
                                                        <tr key={promotion.ruleId}>
                                                            <td>{promotion.name}</td>
                                                            <td>
                                                                <span className="badge bg-info">
                                                                    {promotion.ruleType}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {promotion.discountType === 'PERCENTAGE' ? (
                                                                    `${(promotion.discountValue * 100).toFixed(0)}%`
                                                                ) : (
                                                                    `${promotion.discountValue} €`
                                                                )}
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${promotion.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                                    {promotion.isActive ? 'Да' : 'Не'}
                                                                </span>
                                                            </td>
                                                            <td>{promotion.priority}</td>
                                                            <td>{promotion.currentUsage || 0}</td>
                                                            <td>
                                                                <button
                                                                    className="btn btn-outline-primary btn-sm"
                                                                    onClick={() => editPromotion(promotion)}
                                                                >
                                                                    Редактирай
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
                        )}

                        {/* Analytics Tab */}
                        {activeTab === 'analytics' && isAdmin && (
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5>🏆 Топ клиенти</h5>
                                        </div>
                                        <div className="card-body">
                                            {loading ? (
                                                <div className="text-center">
                                                    <div className="spinner-border" role="status">
                                                        <span className="visually-hidden">Зареждане...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Клиент</th>
                                                                <th>Точки</th>
                                                                <th>Общо похарчени</th>
                                                                <th>Поръчки</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {topCustomers.map((customer, index) => (
                                                                <tr key={customer.customerId}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{customer.firstName} {customer.lastName}</td>
                                                                    <td>
                                                                        <span className="badge bg-primary">
                                                                            {customer.loyaltyPoints || 0}
                                                                        </span>
                                                                    </td>
                                                                    <td>{customer.totalSpent?.toFixed(2) || '0.00'} €</td>
                                                                    <td>{customer.totalOrders || 0}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5>📊 Най-използвани промоции</h5>
                                        </div>
                                        <div className="card-body">
                                            {loading ? (
                                                <div className="text-center">
                                                    <div className="spinner-border" role="status">
                                                        <span className="visually-hidden">Зареждане...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table table-striped">
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Промоция</th>
                                                                <th>Тип</th>
                                                                <th>Отстъпка</th>
                                                                <th>Използвания</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mostUsedPromotions.map((promotion, index) => (
                                                                <tr key={promotion.ruleId}>
                                                                    <td>{index + 1}</td>
                                                                    <td>{promotion.name}</td>
                                                                    <td>
                                                                        <span className="badge bg-info">
                                                                            {promotion.ruleType}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        {promotion.discountType === 'PERCENTAGE' ? (
                                                                            `${(promotion.discountValue * 100).toFixed(0)}%`
                                                                        ) : (
                                                                            `${promotion.discountValue} €`
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-success">
                                                                            {promotion.currentUsage || 0}
                                                                        </span>
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
                        )}
                    </div>
                </div>
            </div>

            {/* Customer Form Modal */}
            {showCustomerForm && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingCustomer ? 'Редактирай клиент' : 'Добави нов клиент'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowCustomerForm(false);
                                        setEditingCustomer(null);
                                        resetCustomerForm();
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handleCustomerSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Име</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={customerForm.firstName}
                                                    onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Фамилия</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={customerForm.lastName}
                                                    onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Телефон</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={customerForm.phoneNumber}
                                                    onChange={(e) => setCustomerForm({ ...customerForm, phoneNumber: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Имейл</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={customerForm.email}
                                                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Баркод на лоялна карта</label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={customerForm.loyaltyCardBarcode}
                                                onChange={(e) => {
                                                    const barcode = e.target.value;
                                                    setCustomerForm({ ...customerForm, loyaltyCardBarcode: barcode });
                                                    // Auto-disable scan mode when barcode is entered (usually scanner sends Enter after barcode)
                                                    if (barcode.trim().length > 0 && isScanMode) {
                                                        // Small delay to allow Enter key to be processed
                                                        setTimeout(() => setIsScanMode(false), 100);
                                                    }
                                                }}
                                                onKeyPress={(e) => {
                                                    // Disable scan mode when Enter is pressed (barcode scanner usually sends Enter)
                                                    if (e.key === 'Enter' && isScanMode) {
                                                        e.preventDefault();
                                                        setIsScanMode(false);
                                                        toast.success("Баркодът е сканиран");
                                                    }
                                                }}
                                                placeholder={isScanMode ? "Сканирайте баркода..." : "Въведете баркод или сканирайте"}
                                                ref={loyaltyCardBarcodeInputRef}
                                            />
                                            <button
                                                type="button"
                                                className={`btn ${isScanMode ? 'btn-success' : 'btn-outline-success'}`}
                                                onClick={startScanMode}
                                                title="Сканирай с баркод пистолет"
                                            >
                                                <i className="bi bi-upc-scan"></i> Сканирай
                                            </button>
                                        </div>
                                        {isScanMode && (
                                            <small className="form-text text-muted">Сканиращ режим активен - насочете скенера към баркода</small>
                                        )}
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={customerForm.isLoyaltyActive}
                                                        onChange={(e) => setCustomerForm({ ...customerForm, isLoyaltyActive: e.target.checked })}
                                                    />
                                                    <label className="form-check-label">
                                                        Лоялната карта е активна
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Статус</label>
                                                <select
                                                    className="form-select"
                                                    value={customerForm.status}
                                                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                                                >
                                                    <option value="ACTIVE">Активен</option>
                                                    <option value="INACTIVE">Неактивен</option>
                                                    <option value="SUSPENDED">Спрян</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Бележки</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={customerForm.notes}
                                            onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowCustomerForm(false);
                                            setEditingCustomer(null);
                                            resetCustomerForm();
                                        }}
                                    >
                                        Отказ
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Запазване...' : 'Запази'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Promotion Form Modal */}
            {showPromotionForm && isAdmin && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {editingPromotion ? 'Редактирай правило за промоция' : 'Добави ново правило за промоция'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowPromotionForm(false);
                                        setEditingPromotion(null);
                                        resetPromotionForm();
                                    }}
                                ></button>
                            </div>
                            <form onSubmit={handlePromotionSubmit}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Име на правилото</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={promotionForm.name}
                                                    onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Тип на правилото</label>
                                                <select
                                                    className="form-select"
                                                    value={promotionForm.ruleType}
                                                    onChange={(e) => setPromotionForm({ ...promotionForm, ruleType: e.target.value })}
                                                >
                                                    <option value="PRODUCT">За конкретен продукт</option>
                                                    <option value="CATEGORY">За категория продукти</option>
                                                    <option value="QUANTITY">Купи X вземи Y</option>
                                                    <option value="AMOUNT">При сума над X €</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Описание</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={promotionForm.description}
                                            onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="mb-3">
                                                <label className="form-label">Тип отстъпка</label>
                                                <select
                                                    className="form-select"
                                                    value={promotionForm.discountType}
                                                    onChange={(e) => setPromotionForm({ ...promotionForm, discountType: e.target.value })}
                                                >
                                                    <option value="PERCENTAGE">Процент</option>
                                                    <option value="FIXED_AMOUNT">Фиксирана сума</option>
                                                    <option value="BUY_X_GET_Y">Купи X вземи Y</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    {promotionForm.discountType === 'PERCENTAGE' ? 'Процент отстъпка' : 'Сума отстъпка'}
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    step={promotionForm.discountType === 'PERCENTAGE' ? '0.01' : '0.01'}
                                                    min="0"
                                                    max={promotionForm.discountType === 'PERCENTAGE' ? '1' : undefined}
                                                    value={promotionForm.discountValue}
                                                    onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="mb-3">
                                                <label className="form-label">Приоритет</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="0"
                                                    value={promotionForm.priority}
                                                    onChange={(e) => setPromotionForm({ ...promotionForm, priority: parseInt(e.target.value) || 0 })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Валидна от</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={promotionForm.validFrom}
                                                    onChange={(e) => setPromotionForm({ ...promotionForm, validFrom: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Валидна до</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={promotionForm.validUntil}
                                                    onChange={(e) => setPromotionForm({ ...promotionForm, validUntil: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={promotionForm.isActive}
                                                        onChange={(e) => setPromotionForm({ ...promotionForm, isActive: e.target.checked })}
                                                    />
                                                    <label className="form-check-label">
                                                        Правилото е активно
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <div className="form-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={promotionForm.requiresLoyaltyCard}
                                                        onChange={(e) => setPromotionForm({ ...promotionForm, requiresLoyaltyCard: e.target.checked })}
                                                    />
                                                    <label className="form-check-label">
                                                        Изисква лоялна карта
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowPromotionForm(false);
                                            setEditingPromotion(null);
                                            resetPromotionForm();
                                        }}
                                    >
                                        Отказ
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Запазване...' : 'Запази'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoyaltyManagement;
