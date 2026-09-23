import './Explore.css';
import {useCallback, useContext, useEffect, useRef, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import DisplayCategory from "../../components/DisplayCategory/DisplayCategory.jsx";
import DisplayItems from "../../components/DisplayItems/DisplayItems.jsx";
import CustomerForm from "../../components/CustomerForm/CustomerForm.jsx";
import CartItems from "../../components/CartItems/CartItems.jsx";
import CartSummary from "../../components/CartSummary/CartSummary.jsx";
import BarcodeScanner from "../../components/BarcodeScanner/BarcodeScanner.jsx";
import LoyaltyService from "../../Service/LoyaltyService.js";
import {findItemByBarcode} from "../../Service/ItemService.js";
import toast from "react-hot-toast";

const MIN_BARCODE_LENGTH = 4;
/** Scanner wedges type very fast; gap resets the buffer (human typing in other fields is paused separately). */
const SCAN_GAP_MS = 120;

const Explore = () => {
    const {categories, addToCart, itemsData} = useContext(AppContext);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [loyaltyCustomer, setLoyaltyCustomer] = useState(null);
    const [showLoyaltyScanner, setShowLoyaltyScanner] = useState(false);
    const [scanBusy, setScanBusy] = useState(false);

    const scanInputRef = useRef(null);
    const scanBusyRef = useRef(false);
    const bufferRef = useRef('');
    const lastKeyAtRef = useRef(0);
    const showLoyaltyRef = useRef(false);

    useEffect(() => {
        showLoyaltyRef.current = showLoyaltyScanner;
    }, [showLoyaltyScanner]);

    const isTypingInOtherField = useCallback(() => {
        const active = document.activeElement;
        if (!active || active === scanInputRef.current) return false;
        const tag = active.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
        if (active.isContentEditable) return true;
        return false;
    }, []);

    const shouldPauseProductScan = useCallback(() => {
        if (showLoyaltyRef.current) return true;
        if (document.querySelector('.payment-modal-overlay')) return true;
        if (document.querySelector('.qty-numpad-overlay')) return true;
        if (document.querySelector('.barcode-scanner-overlay')) return true;
        if (document.querySelector('.receipt-popup-overlay')) return true;
        if (isTypingInOtherField()) return true;
        return false;
    }, [isTypingInOtherField]);

    const focusScanInput = useCallback(() => {
        if (shouldPauseProductScan()) return;
        const el = scanInputRef.current;
        if (!el || el.disabled) return;
        if (document.activeElement === el) return;
        try {
            el.focus({preventScroll: true});
        } catch (_) {
            /* ignore */
        }
    }, [shouldPauseProductScan]);

    const lookupAndAdd = useCallback(async (rawCode) => {
        const code = String(rawCode || '').trim();
        if (code.length < MIN_BARCODE_LENGTH) return;
        if (scanBusyRef.current) return;

        scanBusyRef.current = true;
        setScanBusy(true);
        bufferRef.current = '';
        try {
            const response = await findItemByBarcode(code);
            const item = response.data;
            if (addToCart) {
                const fromCatalog = (itemsData || []).find(
                    (it) => it.itemId === item.itemId || (item.barcode && it.barcode === item.barcode)
                );
                const unitPrice = fromCatalog?.isPromo && fromCatalog?.effectivePrice != null
                    ? fromCatalog.effectivePrice
                    : (fromCatalog?.effectivePrice != null
                        ? fromCatalog.effectivePrice
                        : (item.effectivePrice != null ? item.effectivePrice : item.price));
                addToCart({
                    ...item,
                    ...(fromCatalog || {}),
                    price: unitPrice,
                    quantity: 1,
                    vatRate: item.vatRate ?? fromCatalog?.vatRate ?? 0.20
                });
            }
            toast.success(item.name);
        } catch (error) {
            console.error(error);
            toast.error('Артикул с този баркод не е намерен');
        } finally {
            scanBusyRef.current = false;
            setScanBusy(false);
            if (scanInputRef.current) {
                scanInputRef.current.value = '';
            }
            // Always re-arm after a scan — no button needed
            setTimeout(focusScanInput, 50);
        }
    }, [addToCart, itemsData, focusScanInput]);

    // Re-arm focus after busy / loyalty modal ends
    useEffect(() => {
        if (scanBusy) return;
        if (showLoyaltyScanner) return;
        const t = setTimeout(focusScanInput, 80);
        return () => clearTimeout(t);
    }, [scanBusy, showLoyaltyScanner, focusScanInput]);

    // Keep scanner ready continuously while cashier is on Explore (except real fields/modals)
    useEffect(() => {
        focusScanInput();
        const tick = setInterval(() => {
            if (!shouldPauseProductScan() && !scanBusyRef.current) {
                focusScanInput();
            }
        }, 400);
        return () => clearInterval(tick);
    }, [focusScanInput, shouldPauseProductScan]);

    // Document-level wedge listener — works even if hidden input briefly loses focus
    useEffect(() => {
        const onKeyDown = (e) => {
            if (shouldPauseProductScan()) {
                bufferRef.current = '';
                return;
            }
            if (scanBusyRef.current) return;

            // Don't steal modifier shortcuts
            if (e.ctrlKey || e.altKey || e.metaKey) return;

            if (e.key === 'Enter') {
                const code = bufferRef.current.trim() || (scanInputRef.current?.value || '').trim();
                bufferRef.current = '';
                if (scanInputRef.current) scanInputRef.current.value = '';
                if (code.length >= MIN_BARCODE_LENGTH) {
                    e.preventDefault();
                    e.stopPropagation();
                    lookupAndAdd(code);
                }
                return;
            }

            if (e.key === 'Escape') {
                bufferRef.current = '';
                if (scanInputRef.current) scanInputRef.current.value = '';
                return;
            }

            // Printable character from scanner (or focused capture input)
            if (e.key.length === 1) {
                const now = Date.now();
                if (now - lastKeyAtRef.current > SCAN_GAP_MS) {
                    bufferRef.current = '';
                }
                lastKeyAtRef.current = now;
                bufferRef.current += e.key;

                // Keep hidden input in sync when it has focus
                if (document.activeElement === scanInputRef.current && scanInputRef.current) {
                    // browser already inserts into input; buffer is backup
                } else if (document.activeElement !== scanInputRef.current) {
                    // Capture when focus was lost (e.g. after toast / cart click)
                    // Prevent character from activating focused buttons
                    if (document.activeElement?.tagName === 'BUTTON' || document.activeElement === document.body) {
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [shouldPauseProductScan, lookupAndAdd]);

    // Restore focus after UI clicks (categories / products), not when typing in fields
    useEffect(() => {
        const onPointerDown = (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;
            if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
            if (target.closest('.barcode-scanner-overlay, .payment-modal-overlay, .qty-numpad-overlay, .receipt-popup-overlay')) return;
            setTimeout(focusScanInput, 50);
        };

        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                setTimeout(focusScanInput, 50);
            }
        };

        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown, true);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [focusScanInput]);

    useEffect(() => {
        if (!showLoyaltyScanner) {
            setTimeout(focusScanInput, 80);
        }
    }, [showLoyaltyScanner, focusScanInput]);

    const handleLoyaltyCardFound = async (barcode) => {
        try {
            const response = await LoyaltyService.getCustomerByLoyaltyCard(barcode);
            setLoyaltyCustomer(response.data);
            toast.success(`Лоялна карта: ${response.data.firstName} ${response.data.lastName}`);
        } catch (error) {
            toast.error('Лоялна карта не е намерена');
            console.error('Error finding loyalty customer:', error);
        }
        setShowLoyaltyScanner(false);
    };

    const clearLoyaltyCustomer = () => {
        setLoyaltyCustomer(null);
    };

    // Status only — scanning works via document listener without clicking
    const scannerPaused = showLoyaltyScanner || scanBusy || shouldPauseProductScan();

    return (
        <div className="explore-container text-light">
            <input
                ref={scanInputRef}
                type="text"
                className="explore-barcode-capture"
                aria-label="Скенер за баркод"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                // Never disable for scanBusy — disabling drops focus permanently until next click
                disabled={showLoyaltyScanner}
                tabIndex={0}
            />

            <div className="left-column">
                <div className="first-row" style={{overflowY: 'auto'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5><i className="bi bi-grid"></i> Категории</h5>
                        <div className="d-flex align-items-center gap-2">
                            <span
                                className={`explore-scan-status btn btn-sm ${scannerPaused ? 'paused' : 'active'}`}
                                title={scannerPaused
                                    ? 'Скенерът е на пауза (модал / поле за писане)'
                                    : 'Скенерът е винаги готов — сканирай директно'}
                            >
                                <i className="bi bi-upc-scan"></i>
                                {showLoyaltyScanner
                                    ? 'Скенер на пауза'
                                    : scanBusy
                                        ? 'Обработка…'
                                        : scannerPaused
                                            ? 'Скенер на пауза'
                                            : 'Скенер активен'}
                            </span>
                            <button
                                className="btn btn-outline-light btn-sm"
                                onClick={() => window.location.reload()}
                                title="Обнови"
                            >
                                <i className="bi bi-arrow-clockwise"></i> Обнови
                            </button>
                        </div>
                    </div>
                    <DisplayCategory
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        categories={categories} />
                </div>
                <hr className="horizontal-line" />
                <div className="second-row" style={{overflowY: 'auto'}}>
                    <DisplayItems selectedCategory={selectedCategory} />
                </div>
            </div>
            <div className="right-column d-flex flex-column">
                <div className="customer-form-container">
                    <CustomerForm
                        loyaltyCustomer={loyaltyCustomer}
                        onLoyaltyCardScan={() => setShowLoyaltyScanner(true)}
                        onClearLoyaltyCustomer={clearLoyaltyCustomer}
                    />
                </div>
                <hr className="my-2 text-secondary opacity-50" />
                <div className="cart-items-container">
                    <CartItems />
                </div>
                <div className="cart-summary-container">
                    <CartSummary
                        loyaltyCustomer={loyaltyCustomer}
                        onClearLoyaltyCustomer={clearLoyaltyCustomer}
                    />
                </div>
            </div>

            {showLoyaltyScanner && (
                <BarcodeScanner
                    mode="loyalty"
                    onItemFound={handleLoyaltyCardFound}
                    onClose={() => setShowLoyaltyScanner(false)}
                    title="Сканирай лоялна карта"
                />
            )}
        </div>
    )
}

export default Explore;
