import { useState, useRef, useEffect } from 'react';
import { findItemByBarcode, generateBarcode } from '../../Service/ItemService.js';
import toast from 'react-hot-toast';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onItemFound, onClose }) => {
    const [barcode, setBarcode] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanHistory, setScanHistory] = useState([]);
    const barcodeInputRef = useRef(null);

    useEffect(() => {
        // Focus on input when component mounts
        if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, []);

    const handleBarcodeSubmit = async (e) => {
        e.preventDefault();
        if (!barcode.trim()) return;

        setIsScanning(true);
        try {
            const response = await findItemByBarcode(barcode.trim());
            const item = response.data;
            
            // Add to scan history
            setScanHistory(prev => [item, ...prev.slice(0, 4)]);
            
            // Call parent callback
            if (onItemFound) {
                onItemFound(item);
            }
            
            toast.success(`Found: ${item.name}`);
            setBarcode('');
        } catch (error) {
            console.error(error);
            toast.error('Item not found with this barcode');
        } finally {
            setIsScanning(false);
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
                    <h5><i className="bi bi-upc-scan"></i> Barcode Scanner</h5>
                    <button className="btn-close" onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div className="barcode-scanner-body">
                    <form onSubmit={handleBarcodeSubmit}>
                        <div className="mb-3">
                            <label htmlFor="barcodeInput" className="form-label">
                                Scan or Enter Barcode
                            </label>
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                id="barcodeInput"
                                className="form-control form-control-lg text-center"
                                placeholder="Scan barcode here..."
                                value={barcode}
                                onChange={handleManualInput}
                                onKeyPress={handleKeyPress}
                                autoFocus
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
                                        <i className="bi bi-hourglass-split"></i> Scanning...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-search"></i> Find Item
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {scanHistory.length > 0 && (
                        <div className="mt-4">
                            <h6>Recent Scans</h6>
                            <div className="scan-history">
                                {scanHistory.map((item, index) => (
                                    <div key={index} className="scan-history-item">
                                        <div className="scan-item-info">
                                            <strong>{item.name}</strong>
                                            <small className="text-white d-block">
                                                Barcode: {item.barcode}
                                            </small>
                                            <span className="badge bg-warning text-dark">
                                                ₹{item.price}
                                            </span>
                                        </div>
                                        <button 
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
