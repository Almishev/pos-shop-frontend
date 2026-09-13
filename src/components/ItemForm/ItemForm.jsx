import {useContext, useRef, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import toast from "react-hot-toast";
import {addItem, generateBarcode} from "../../Service/ItemService.js";
import {UNIT_OF_MEASURE_OPTIONS} from "../../util/unitOfMeasure.js";

const ItemForm = () => {
    const {categories, setItemsData, itemsData, setCategories} = useContext(AppContext);
    const barcodeInputRef = useRef(null);
    const [isScanMode, setIsScanMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState({
        name: "",
        categoryId: "",
        price: "",
        description: "",
        barcode: "",
        vatRate: 0.20,
        unitOfMeasure: "pcs",
        costPrice: "",
    });

    const onChangeHandler = (e) => {
        const value = e.target.value;
        const name = e.target.name;
        setData((data) => ({...data, [name]: value}));
    }

    const handleGenerateBarcode = async () => {
        try {
            const response = await generateBarcode();
            if (response.status === 200) {
                setData(prev => ({...prev, barcode: response.data.barcode}));
                toast.success("Баркодът е генериран успешно");
            } else {
                toast.error("Грешка при генериране на баркод");
            }
        } catch (error) {
            console.error(error);
            toast.error("Грешка при генериране на баркод");
        }
    }

    const onlyDigits = (value) => (value || '').replace(/\D+/g, '');
    const ean13ChecksumValid = (code) => {
        if (!/^\d{13}$/.test(code)) return false;
        const digits = code.split('').map(Number);
        const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
        const check = (10 - (sum % 10)) % 10;
        return check === digits[12];
    };
    const upcAChecksumValid = (code) => {
        if (!/^\d{12}$/.test(code)) return false;
        const digits = code.split('').map(Number);
        const sumOdd = digits.slice(0, 11).reduce((acc, d, i) => acc + (i % 2 === 0 ? d : 0), 0);
        const sumEven = digits.slice(0, 11).reduce((acc, d, i) => acc + (i % 2 === 1 ? d : 0), 0);
        const total = (sumOdd * 3) + sumEven;
        const check = (10 - (total % 10)) % 10;
        return check === digits[11];
    };
    const ean8ChecksumValid = (code) => {
        if (!/^\d{8}$/.test(code)) return false;
        const digits = code.split('').map(Number);
        const sum = digits.slice(0, 7).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
        const check = (10 - (sum % 10)) % 10;
        return check === digits[7];
    };
    const isValidBarcode = (raw) => {
        const code = onlyDigits(raw);
        return ean13ChecksumValid(code) || upcAChecksumValid(code) || ean8ChecksumValid(code);
    };

    const startScanMode = () => {
        setIsScanMode(true);
        setTimeout(() => barcodeInputRef.current?.focus(), 0);
        toast.success("Сканиращ режим: насочете скенера към баркода и натиснете спусъка");
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        const payload = {
            ...data,
            price: data.price === "" ? null : Number(data.price),
            costPrice: data.costPrice === "" || data.costPrice === null ? null : Number(data.costPrice),
        };
        const formData = new FormData();
        formData.append("item", JSON.stringify(payload));
        try {
            const response = await addItem(formData);
            if (response.status === 201) {
                setItemsData([...itemsData, response.data]);
                setCategories((prevCategories) =>
                prevCategories.map((category) => category.categoryId === data.categoryId ? {...category, items: category.items + 1} : category));
                toast.success("Артикулът е добавен");
                setData({
                    name: "",
                    description: "",
                    price: "",
                    categoryId: "",
                    barcode: "",
                    vatRate: 0.20,
                    unitOfMeasure: "pcs",
                    costPrice: "",
                })
            } else {
                toast.error("Неуспешно добавяне на артикул");
            }
        } catch (error) {
            console.error(error);
            const status = error.response?.status;
            const data = error.response?.data;
            const msg = (typeof data === 'string' ? data : (data?.message || data?.detail || '')) || '';
            if (status === 403) {
                toast.error('Нямате права за добавяне на артикул. Влезте отново като админ (един таб / презаредете страницата).', { duration: 7000 });
            } else if (status === 401) {
                toast.error('Сесията е изтекла. Влезте отново като админ.');
            } else if (status === 409) {
                toast.error(msg || 'Артикул с този баркод вече съществува.');
            } else {
                toast.error(msg || 'Неуспешно добавяне на артикул');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="item-form-container" style={{height:'100vh', overflowY: 'auto', overflowX: 'hidden'}}>
            <div className="mx-2 mt-2">
                <div className="row">
                    <div className="card col-md-12 form-container">
                        <div className="card-body">
                            <form onSubmit={onSubmitHandler}>
                                <div className="mb-3">
                                    <label htmlFor="name" className="form-label">Име</label>
                                    <input type="text"
                                           name="name"
                                           id="name"
                                           className="form-control"
                                           placeholder="Име на артикул"
                                           onChange={onChangeHandler}
                                           value={data.name}
                                           required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="category">
                                        Категория
                                    </label>
                                    <select name="categoryId" id="category" className="form-control" onChange={onChangeHandler} value={data.categoryId} required>
                                        <option value="">--ИЗБЕРЕТЕ КАТЕГОРИЯ--</option>
                                        {categories.map((category, index) => (
                                            <option key={index} value={category.categoryId}>{category.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="barcode" className="form-label">Баркод</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            name="barcode"
                                            id="barcode"
                                            className="form-control"
                                            placeholder={isScanMode ? "Сканирайте баркода..." : "Въведете баркод или сканирайте"}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                setData(prev => ({...prev, barcode: raw}));
                                            }}
                                            value={data.barcode}
                                            ref={barcodeInputRef}
                                        />
                                        <button type="button" className="btn btn-outline-secondary" onClick={handleGenerateBarcode}>
                                            <i className="bi bi-arrow-clockwise"></i> Генерирай
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn ${isScanMode ? 'btn-success' : 'btn-outline-success'}`}
                                            onClick={startScanMode}
                                            title="Сканирай с баркод пистолет"
                                        >
                                            <i className="bi bi-upc-scan"></i> Сканирай
                                        </button>
                                    </div>
                                    <small className="form-text text-muted">Сканиращ режим приема EAN-13/UPC-A/EAN-8. Оставете празно за автоматично генериране.</small>
                                    {data.barcode && !isValidBarcode(data.barcode) && (
                                        <div className="text-danger small mt-1">Внимание: баркодът изглежда невалиден (проверка GS1).</div>
                                    )}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="vatRate" className="form-label">ДДС ставка</label>
                                    <select
                                        name="vatRate"
                                        id="vatRate"
                                        className="form-control"
                                        onChange={(e) => setData(prev => ({...prev, vatRate: parseFloat(e.target.value)}))}
                                        value={data.vatRate}
                                    >
                                        <option value={0.20}>20% (Стандартна)</option>
                                        <option value={0.09}>9% (Намалена)</option>
                                        <option value={0.00}>0% (Нулева)</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="unitOfMeasure" className="form-label">Мерна единица</label>
                                    <select
                                        name="unitOfMeasure"
                                        id="unitOfMeasure"
                                        className="form-control"
                                        onChange={onChangeHandler}
                                        value={data.unitOfMeasure}
                                        required
                                    >
                                        {UNIT_OF_MEASURE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="price" className="form-label">Продажна цена (€)</label>
                                    <input type="number" name="price" id="price" className="form-control" placeholder="0.00" step="0.01" onChange={onChangeHandler} value={data.price} required/>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="costPrice" className="form-label">Последна доставна цена (€)</label>
                                    <input
                                        type="number"
                                        name="costPrice"
                                        id="costPrice"
                                        className="form-control"
                                        placeholder="по желание"
                                        step="0.01"
                                        min="0"
                                        onChange={onChangeHandler}
                                        value={data.costPrice}
                                    />
                                    <small className="form-text text-muted">Попълва се автоматично при доставка; тук само ако искаш начална стойност. Наличност не е задължителна при създаване.</small>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Описание</label>
                                    <textarea
                                        rows="5"
                                        name="description"
                                        id="description"
                                        className="form-control"
                                        placeholder="Опишете артикула..."
                                        onChange={onChangeHandler}
                                        value={data.description}></textarea>
                                </div>
                                <button type="submit" className="btn btn-warning w-100" disabled={loading}>{loading ? "Зареждане..." : "Запази"}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ItemForm;
