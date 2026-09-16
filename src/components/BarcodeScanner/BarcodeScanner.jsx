import { useState, useRef, useEffect } from 'react';
import { findItemByBarcode } from '../../Service/ItemService.js';
import toast from 'react-hot-toast';
import './BarcodeScanner.css';

/**
 * Modal barcode capture.
 * mode="item" (default): lookup product by barcode, pass item to onItemFound
 * mode="loyalty": pass raw barcode string to onItemFound (no product lookup)
 */
const BarcodeScanner = ({ onItemFound, onClose, title = 'Сканирай баркод', mode = 'item' }) => {
    const [barcode, setBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanHistory, setScanHistory] = useState([]);
    const barcodeInputRef = useRef(null);

    useEffect(() => {
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    const handleBarcodeSubmit = async (e) => {
        e.preventDefault();
        const code = barcode.trim();
        if (!code) return;

        setIsScanning(true);
        try {
            if (mode === 'loyalty') {
                if (onItemFound) {
                    await onItemFound(code);
                }
                setBarcode('');
                return;
            }

            const response = await findItemByBarcode(code);
            const item = response.data;

            setScanHistory(prev => [item, ...prev.slice(0, 4)]);

            if (onItemFound) {
                onItemFound(item);
            }

            toast.success(`Намерен: ${item.name}`);
            setBarcode('');
        } catch (error) {
            console.error(error);
            toast.error(mode === 'loyalty'
                ? 'Лоялна карта не е намерена'
                : 'Артикул с този баркод не е намерен');
        } finally {
            setIsScanning(false);
            setTimeout(() => barcodeInputRef.current?.focus(), 0);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleBarcodeSubmit(e);
        }
    };

    const handleManualInput = (e) => {
        setBarcode(e.target.value);
    };

    return (
        <div className="barcode-scanner-overlay">
            <div className="barcode-scanner-modal">
                <div className="barcode-scanner-header">
                    <h5><i className="bi bi-upc-scan"></i> {title}</h5>
                    <button type="button" className="btn-close" onClick={onClose} aria-label="Затвори">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className="barcode-scanner-body">
                    <form onSubmit={handleBarcodeSubmit}>
                        <div className="mb-3">
                            <label htmlFor="barcodeInput" className="form-label">
                                {mode === 'loyalty' ? 'Сканирай или въведи лоялна карта' : 'Сканирай или въведи баркод'}
                            </label>
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                id="barcodeInput"
                                className="form-control form-control-lg text-center"
                                placeholder={mode === 'loyalty' ? 'Баркод на картата...' : 'Баркод на продукта...'}
                                value={barcode}
                                onChange={handleManualInput}
                                onKeyPress={handleKeyPress}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>

                        <div className="d-grid gap-2">
                            <button
                                type="submit"
                                className="btn btn-warning btn-lg"
                                disabled={isScanning || !barcode.trim()}
                            >
                                {isScanning ? (
                                    <>
                                        <i className="bi bi-hourglass-split"></i> Обработка...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-search"></i> {mode === 'loyalty' ? 'Намери карта' : 'Намери артикул'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {mode === 'item' && scanHistory.length > 0 && (
                        <div className="mt-4">
                            <h6>Последни сканирания</h6>
                            <div className="scan-history">
                                {scanHistory.map((item, index) => (
                                    <div key={index} className="scan-history-item">
                                        <div className="scan-item-info">
                                            <strong>{item.name}</strong>
                                            <small className="text-white d-block">
                                                Баркод: {item.barcode}
                                            </small>
                                            <span className="badge bg-warning text-dark">
                                                €{item.price}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={() => onItemFound && onItemFound(item)}
                                        >
                                            <i className="bi bi-plus"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
