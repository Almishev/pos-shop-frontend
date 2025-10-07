import React, { useState, useEffect, useContext } from 'react';
import { toast } from 'react-hot-toast';
import LabelService from '../../Service/LabelService';
import { getDbIdByItemId } from '../../Service/ItemService.js';
import PromotionService from '../../Service/PromotionService';
import { AppContext } from '../../context/AppContext';
import './LabelTemplates.css';

const LabelManagement = () => {
    const { itemsData, categories } = useContext(AppContext);
    const [selectedLabelType, setSelectedLabelType] = useState('price');
    
    // Debug: Log itemsData
    console.log('LabelManagement - itemsData:', itemsData);
    console.log('LabelManagement - categories:', categories);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [promoItems, setPromoItems] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [previewHTML, setPreviewHTML] = useState('');
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [activePromotions, setActivePromotions] = useState([]);

    // Промо етикет форма
    const [promoForm, setPromoForm] = useState({
        itemId: '',
        oldPrice: '',
        newPrice: '',
        promoStart: '',
        promoEnd: ''
    });

    useEffect(() => {
        loadTemplates();
        loadActivePromotions();
    }, []);

    const loadTemplates = async () => {
        try {
            const templatesData = await LabelService.getLabelTemplates();
            setTemplates(templatesData);
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const loadActivePromotions = async () => {
        try {
            const promos = await PromotionService.getActivePromotions();
            setActivePromotions(promos || []);
        } catch (e) {
            console.warn('Failed to load promotions', e);
        }
    };

    const refreshData = () => {
        window.location.reload();
    };

    const handleLabelTypeChange = (type) => {
        setSelectedLabelType(type);
        setSelectedItems([]);
        setSelectedCategories([]);
        setPromoItems([]);
        setShowPreview(false);
    };

    const handleItemSelect = (item) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.itemId === item.itemId);
            if (exists) {
                return prev.filter(i => i.itemId !== item.itemId);
            } else {
                return [...prev, item];
            }
        });
    };

    const getCategoryId = (c) => (c && (c.id ?? c.categoryId));

    const handleCategorySelect = (category) => {
        const normalized = { ...category, id: getCategoryId(category) };
        setSelectedCategories(prev => {
            const exists = prev.find(c => getCategoryId(c) === getCategoryId(normalized));
            if (exists) {
                return prev.filter(c => getCategoryId(c) !== getCategoryId(normalized));
            } else {
                return [...prev.map(c => ({ ...c, id: getCategoryId(c) })), normalized];
            }
        });
    };

    const handlePromoFormChange = (field, value) => {
        setPromoForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addPromoItem = () => {
        if (!promoForm.itemId || !promoForm.oldPrice || !promoForm.newPrice) {
            toast.error('Моля, попълнете всички полета');
            return;
        }

        const item = itemsData.find(i => i.itemId == promoForm.itemId);
        if (!item) {
            toast.error('Продуктът не е намерен');
            return;
        }

        const promoItem = {
            ...item,
            oldPrice: parseFloat(promoForm.oldPrice),
            newPrice: parseFloat(promoForm.newPrice),
            promoStart: promoForm.promoStart,
            promoEnd: promoForm.promoEnd
        };

        setPromoItems(prev => [...prev, promoItem]);
        setPromoForm({
            itemId: '',
            oldPrice: '',
            newPrice: '',
            promoStart: '',
            promoEnd: ''
        });
        toast.success('Промо продуктът е добавен');
    };

    const removePromoItem = (itemId) => {
        setPromoItems(prev => prev.filter(item => item.itemId !== itemId));
    };

    const generatePreview = async () => {
        try {
            setLoading(true);
            let previewData = {};
            let htmlContent = '';

            switch (selectedLabelType) {
                case 'price':
                    if (selectedItems.length === 0) {
                        toast.error('Моля, изберете поне един продукт');
                        return;
                    }
                    previewData = { type: 'price', items: selectedItems };
                    htmlContent = selectedItems.map(item => 
                        LabelService.generatePriceLabelHTML(item)
                    ).join('');
                    break;

                case 'shelf':
                    if (selectedCategories.length === 0) {
                        toast.error('Моля, изберете поне една категория');
                        return;
                    }
                    previewData = { type: 'shelf', categories: selectedCategories };
                    htmlContent = selectedCategories.map(category => 
                        LabelService.generateShelfLabelHTML(category)
                    ).join('');
                    break;

                case 'promo':
                    if (promoItems.length === 0) {
                        toast.error('Моля, добавете поне един промо продукт');
                        return;
                    }
                    previewData = { type: 'promo', items: promoItems };
                    htmlContent = promoItems.map(item => 
                        LabelService.generatePromoLabelHTML(item)
                    ).join('');
                    break;

                default:
                    toast.error('Невалиден тип етикет');
                    return;
            }

            setPreviewHTML(htmlContent);
            setShowPreview(true);
        } catch (error) {
            console.error('Error generating preview:', error);
            toast.error('Грешка при генериране на преглед');
        } finally {
            setLoading(false);
        }
    };

    const printLabels = async () => {
        try {
            setLoading(true);
            let result;

            switch (selectedLabelType) {
                case 'price':
                    if (selectedItems.length === 0) {
                        toast.error('Моля, изберете поне един продукт');
                        return;
                    }
                    // Simplified: generate client-side HTML, no backend call
                    {
                        const htmlContent = selectedItems.map(item => 
                            LabelService.generatePriceLabelHTML(item)
                        ).join('');
                        LabelService.printLabels(htmlContent, 'price');
                        toast.success('Етикетите са готови за печат');
                        return;
                    }

                case 'shelf':
                    if (selectedCategories.length === 0) {
                        toast.error('Моля, изберете поне една категория');
                        return;
                    }
                    result = await LabelService.printShelfLabels(selectedCategories);
                    break;

                case 'promo':
                    if (promoItems.length === 0) {
                        toast.error('Моля, добавете поне един промо продукт');
                        return;
                    }
                    {
                        const htmlContent = promoItems.map(item => 
                            LabelService.generatePromoLabelHTML(item)
                        ).join('');
                        LabelService.printLabels(htmlContent, 'promo');
                        toast.success('Етикетите са готови за печат');
                        return;
                    }

                default:
                    toast.error('Невалиден тип етикет');
                    return;
            }

            if (result.success) {
                toast.success(result.message);
                // Ако няма предварителен преглед, генерирай HTML от резултата на бекенда
                const htmlContent = previewHTML && previewHTML.length > 0
                    ? previewHTML
                    : (result.labels ? result.labels.map(l => l.html).join('') : '');
                LabelService.printLabels(htmlContent, selectedLabelType);
            }
        } catch (error) {
            console.error('Error printing labels:', error);
            toast.error('Грешка при печат на етикети');
        } finally {
            setLoading(false);
        }
    };

    const bulkPrintAll = async () => {
        try {
            setLoading(true);
            const result = await LabelService.bulkPrintAllItems();
            if (result.success) {
                toast.success(result.message);
                // Генериране на HTML за всички продукти
                const htmlContent = result.labels.map(label => label.html).join('');
                LabelService.printLabels(htmlContent, 'всички продукти');
            }
        } catch (error) {
            console.error('Error in bulk print:', error);
            toast.error('Грешка при масов печат');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="label-management">
            <h2 className="text-light mb-4">
                <i className="bi bi-tags me-2"></i>
                Управление на етикети
            </h2>

            {/* Label Type Selector */}
            <div className="label-type-selector">
                <button 
                    className={`label-type-btn ${selectedLabelType === 'price' ? 'active' : ''}`}
                    onClick={() => handleLabelTypeChange('price')}
                >
                    <i className="bi bi-tag me-2"></i>
                    Ценови етикети
                </button>
                <button 
                    className={`label-type-btn ${selectedLabelType === 'shelf' ? 'active' : ''}`}
                    onClick={() => handleLabelTypeChange('shelf')}
                >
                    <i className="bi bi-grid me-2"></i>
                    Рафтови етикети
                </button>
                <button 
                    className={`label-type-btn ${selectedLabelType === 'promo' ? 'active' : ''}`}
                    onClick={() => handleLabelTypeChange('promo')}
                >
                    <i className="bi bi-percent me-2"></i>
                    Промо етикети
                </button>
            </div>

            {/* Price Labels Section */}
            {selectedLabelType === 'price' && (
                <div className="label-form">
                    <h4 className="text-light mb-3">Избор на продукти за ценови етикети</h4>
                    {!itemsData || itemsData.length === 0 ? (
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Няма налични продукти. Моля, проверете дали продуктите са заредени правилно.
                            <button className="btn btn-sm btn-outline-warning ms-2" onClick={refreshData}>
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Презареди
                            </button>
                        </div>
                    ) : (
                        <div className="row">
                            {itemsData.map(item => {
                            const isSelected = !!selectedItems.find(i => i.itemId === item.itemId);
                            return (
                            <div key={item.itemId} className="col-md-4 mb-3">
                                <div 
                                    className="card"
                                    style={{ cursor: 'pointer', background: '#2c3335', border: isSelected ? '2px solid #ffc107' : '1px solid #6c757d' }}
                                    onClick={() => handleItemSelect(item)}
                                >
                                    <div className="card-body p-2">
                                        <h6 className="card-title text-light mb-1">{item.name}</h6>
                                        <p className="card-text text-warning mb-1">{LabelService.formatPrice(item.price)}</p>
                                        <small className="text-muted">{item.barcode}</small>
                                    </div>
                                </div>
                            </div>
                            )})}
                        </div>
                    )}
                    <div className="mt-3">
                        <strong className="text-light">Избрани продукти: {selectedItems.length}</strong>
                    </div>
                </div>
            )}

            {/* Shelf Labels Section */}
            {selectedLabelType === 'shelf' && (
                <div className="label-form">
                    <h4 className="text-light mb-3">Избор на категории за рафтови етикети</h4>
                    {!categories || categories.length === 0 ? (
                        <div className="alert alert-warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Няма налични категории. Моля, проверете дали категориите са заредени правилно.
                            <button className="btn btn-sm btn-outline-warning ms-2" onClick={refreshData}>
                                <i className="bi bi-arrow-clockwise me-1"></i>
                                Презареди
                            </button>
                        </div>
                    ) : (
                        <div className="row">
                            {categories.map(category => {
                            const catId = getCategoryId(category);
                            const isSelected = !!selectedCategories.find(c => getCategoryId(c) === catId);
                            return (
                            <div key={catId} className="col-md-4 mb-3">
                                <div 
                                    className="card"
                                    style={{ cursor: 'pointer', background: '#2c3335', border: isSelected ? '2px solid #ffc107' : '1px solid #6c757d' }}
                                    onClick={() => handleCategorySelect(category)}
                                >
                                    <div className="card-body p-2">
                                        <h6 className="card-title text-light mb-1">{category.name}</h6>
                                        <small className="text-muted">{category.description || 'Без описание'}</small>
                                    </div>
                                </div>
                            </div>
                            )})}
                        </div>
                    )}
                    <div className="mt-3">
                        <strong className="text-light">Избрани категории: {selectedCategories.length}</strong>
                    </div>
                </div>
            )}

            {/* Promo Labels Section */}
            {selectedLabelType === 'promo' && (
                <div className="label-form">
                    <h4 className="text-light mb-3">Създаване на промо етикети</h4>
                    
                    {/* Promo Form */}
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Продукт</label>
                            <select 
                                className="form-control"
                                value={promoForm.itemId}
                                onChange={(e) => handlePromoFormChange('itemId', e.target.value)}
                            >
                                <option value="">Изберете продукт</option>
                                {itemsData && itemsData.length > 0 ? itemsData.map(item => (
                                    <option key={item.itemId} value={item.itemId}>
                                        {item.name} - {LabelService.formatPrice(item.price)}
                                    </option>
                                )) : (
                                    <option value="" disabled>Няма налични продукти</option>
                                )}
                            </select>
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Стара цена</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="form-control"
                                value={promoForm.oldPrice}
                                onChange={(e) => handlePromoFormChange('oldPrice', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">Нова цена</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="form-control"
                                value={promoForm.newPrice}
                                onChange={(e) => handlePromoFormChange('newPrice', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">От дата</label>
                            <input 
                                type="date" 
                                className="form-control"
                                value={promoForm.promoStart}
                                onChange={(e) => handlePromoFormChange('promoStart', e.target.value)}
                            />
                        </div>
                        <div className="col-md-2">
                            <label className="form-label">До дата</label>
                            <input 
                                type="date" 
                                className="form-control"
                                value={promoForm.promoEnd}
                                onChange={(e) => handlePromoFormChange('promoEnd', e.target.value)}
                            />
                        </div>
                    </div>
                <div className="d-flex gap-2">
                    <button 
                        className="btn label-btn-success"
                        onClick={addPromoItem}
                    >
                        <i className="bi bi-plus me-2"></i>
                        Добави промо продукт
                    </button>
                    <button
                        className="btn label-btn-white"
                        onClick={async () => {
                            try {
                                if (!promoForm.itemId || !promoForm.newPrice || !promoForm.promoStart || !promoForm.promoEnd) {
                                    toast.error('Попълни продукт, нова цена и период');
                                    return;
                                }
                                const selected = itemsData.find(i => i.itemId == promoForm.itemId);
                                if (!selected) { toast.error('Продуктът не е намерен'); return; }
                                let itemDbId = selected.id;
                                if (!itemDbId) {
                                    try {
                                        itemDbId = await getDbIdByItemId(selected.itemId);
                                    } catch (e) {
                                        console.warn('Failed to resolve DB id by itemId', e);
                                    }
                                }
                                await PromotionService.createPromotion({
                                    itemDbId,
                                    itemId: selected.itemId,
                                    promoPrice: promoForm.newPrice,
                                    startDate: promoForm.promoStart,
                                    endDate: promoForm.promoEnd
                                });
                                toast.success('Промоцията е записана');
                            } catch (e) {
                                console.error(e);
                                toast.error('Грешка при запис на промоция');
                            }
                        }}
                    >
                        <i className="bi bi-save me-2"></i>
                        Запази промоцията
                    </button>
                </div>

                    {/* Promo Items List */}
                    {promoItems.length > 0 && (
                        <div className="mt-3">
                            <h5 className="text-light">Промо продукти:</h5>
                            {promoItems.map(item => (
                                <div key={item.itemId} className="d-flex justify-content-between align-items-center bg-dark p-2 rounded mb-2">
                                    <div>
                                        <strong className="text-light">{item.name}</strong>
                                        <span className="text-muted ms-2">
                                            {LabelService.formatPrice(item.oldPrice)} → {LabelService.formatPrice(item.newPrice)}
                                        </span>
                                    </div>
                                    <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => removePromoItem(item.itemId)}
                                    >
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-4">
                        <h5 className="text-light mb-2">Активни промоции</h5>
                        <div className="table-responsive">
                            <table className="table table-dark table-striped align-middle">
                                <thead>
                                    <tr>
                                        <th>Артикул</th>
                                        <th>Нова цена</th>
                                        <th>От</th>
                                        <th>До</th>
                                        <th className="text-end">Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activePromotions.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted">Няма активни промоции</td>
                                        </tr>
                                    ) : activePromotions.map(p => (
                                        <tr key={p.id}>
                                            <td>{p.name}</td>
                                            <td>{LabelService.formatPrice(p.promoPrice)}</td>
                                            <td>{new Date(p.startAt).toLocaleString('bg-BG')}</td>
                                            <td>{new Date(p.endAt).toLocaleString('bg-BG')}</td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    title="Изтриване на промоцията"
                                                    onClick={async () => {
                                                        try {
                                                            await PromotionService.deletePromotion(p.id);
                                                            toast.success('Промоцията е изтрита');
                                                            loadActivePromotions();
                                                        } catch (e) {
                                                            toast.error('Грешка при изтриване');
                                                        }
                                                    }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="label-actions">
                <button 
                    className="btn label-btn-secondary"
                    onClick={generatePreview}
                    disabled={loading}
                >
                    <i className="bi bi-eye me-2"></i>
                    Предварителен преглед
                </button>
                <button 
                    className="btn label-btn-primary"
                    onClick={printLabels}
                    disabled={loading}
                >
                    <i className="bi bi-printer me-2"></i>
                    Печат етикети
                </button>
                <button 
                    className="btn label-btn-success"
                    onClick={bulkPrintAll}
                    disabled={loading}
                >
                    <i className="bi bi-collection me-2"></i>
                    Масов печат (всички продукти)
                </button>
            </div>

            {/* Preview */}
            {showPreview && (
                <div className="mt-4">
                    <h4 className="text-light mb-3">Предварителен преглед</h4>
                    <div className="label-preview-container">
                        <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center mt-3">
                    <div className="spinner-border text-warning" role="status">
                        <span className="visually-hidden">Зареждане...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabelManagement;
