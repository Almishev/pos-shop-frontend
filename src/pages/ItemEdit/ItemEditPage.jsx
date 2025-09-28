import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';
import { getItemById, updateItem, generateBarcode } from '../../Service/ItemService';
import './ItemEditPage.css';

const ItemEditPage = () => {
    console.log('=== ItemEditPage COMPONENT STARTING ===');
    
    const { id } = useParams();
    const navigate = useNavigate();
    const { categories } = useContext(AppContext);
    
    console.log('ItemEditPage - id from params:', id);
    console.log('ItemEditPage - id type:', typeof id);
    console.log('ItemEditPage - id length:', id?.length);
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        price: '',
        description: '',
        barcode: '',
        vatRate: 0.20,
        imgUrl: ''
    });

    useEffect(() => {
        console.log('=== ItemEditPage useEffect triggered ===');
        console.log('id in useEffect:', id);
        if (id) {
            console.log('id exists, calling loadItemData');
            loadItemData();
        } else {
            console.log('id is missing, showing error and navigating back');
            toast.error('Невалиден ID на артикул');
            navigate('/inventory');
        }
    }, [id]);

    const loadItemData = async () => {
        console.log('=== loadItemData STARTED ===');
        console.log('Loading item with ID:', id);
        console.log('Item ID type:', typeof id);
        console.log('Item ID length:', id?.length);
        try {
            setLoading(true);
            console.log('Calling getItemById with:', id);
            const response = await getItemById(id);
            console.log('getItemById response:', response);
            const item = response.data;
            console.log('Item data:', item);
            
            setFormData({
                name: item.name || '',
                categoryId: item.categoryId || '',
                price: item.price || '',
                description: item.description || '',
                barcode: item.barcode || '',
                vatRate: item.vatRate || 0.20,
                imgUrl: item.imgUrl || ''
            });
            
            if (item.imgUrl) {
                setImagePreview(item.imgUrl);
            }
        } catch (error) {
            toast.error('Грешка при зареждане на артикула');
            console.error('Error loading item:', error);
            navigate('/inventory');
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateBarcode = async () => {
        try {
            const response = await generateBarcode();
            if (response.status === 200) {
                setFormData(prev => ({ ...prev, barcode: response.data.barcode }));
                toast.success("Баркодът е генериран успешно");
            } else {
                toast.error("Грешка при генериране на баркод");
            }
        } catch (error) {
            console.error(error);
            toast.error("Грешка при генериране на баркод");
        }
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast.error('Името на артикула е задължително');
            return false;
        }
        if (!formData.categoryId) {
            toast.error('Категорията е задължителна');
            return false;
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            toast.error('Цената трябва да е по-голяма от 0');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            
            const formDataToSend = new FormData();
            formDataToSend.append('item', JSON.stringify({
                name: formData.name,
                categoryId: formData.categoryId,
                price: parseFloat(formData.price),
                description: formData.description,
                barcode: formData.barcode,
                vatRate: parseFloat(formData.vatRate)
            }));
            
            if (image) {
                formDataToSend.append('file', image);
            }
            
            await updateItem(id, formDataToSend);
            toast.success('Артикулът е обновен успешно');
            navigate('/inventory');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Грешка при обновяване на артикула');
            console.error('Error updating item:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate('/inventory');
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Зареждане...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="item-edit-page">
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>✏️ Редактиране на артикул</h2>
                            <button 
                                className="btn btn-secondary"
                                onClick={handleCancel}
                            >
                                <i className="bi bi-arrow-left me-2"></i>
                                Назад към склада
                            </button>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Име на артикула *</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        placeholder="Въведете име на артикула"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Категория *</label>
                                                    <select
                                                        className="form-select"
                                                        name="categoryId"
                                                        value={formData.categoryId}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="">Изберете категория</option>
                                                        {categories.map((category) => (
                                                            <option key={category.categoryId} value={category.categoryId}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">Цена (лв.) *</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control"
                                                        name="price"
                                                        value={formData.price}
                                                        onChange={handleInputChange}
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label">ДДС ставка</label>
                                                    <select
                                                        className="form-select"
                                                        name="vatRate"
                                                        value={formData.vatRate}
                                                        onChange={handleInputChange}
                                                    >
                                                        <option value={0.20}>20% (Стандартна)</option>
                                                        <option value={0.09}>9% (Намалена)</option>
                                                        <option value={0.00}>0% (Нулева)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Баркод</label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        name="barcode"
                                                        value={formData.barcode}
                                                        onChange={handleInputChange}
                                                        placeholder="Въведете или генерирайте баркод"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={handleGenerateBarcode}
                                                    >
                                                        <i className="bi bi-upc-scan"></i> Генерирай
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">Описание</label>
                                                <textarea
                                                    className="form-control"
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    rows="3"
                                                    placeholder="Описание на артикула..."
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-4">
                                            <div className="mb-3">
                                                <label className="form-label">Снимка</label>
                                                <div className="image-upload-container">
                                                    {imagePreview && (
                                                        <div className="image-preview mb-3">
                                                            <img
                                                                src={imagePreview}
                                                                alt="Preview"
                                                                className="img-thumbnail"
                                                                style={{ maxWidth: '200px', maxHeight: '200px' }}
                                                            />
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                    <small className="form-text text-muted">
                                                        Оставете празно за да запазите текущата снимка
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 mt-4">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Запазване...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-check-circle me-2"></i>
                                                    Запази промените
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            <i className="bi bi-x-circle me-2"></i>
                                            Отказ
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemEditPage;
