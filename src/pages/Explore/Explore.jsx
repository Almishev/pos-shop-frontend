import './Explore.css';
import {useContext, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import DisplayCategory from "../../components/DisplayCategory/DisplayCategory.jsx";
import DisplayItems from "../../components/DisplayItems/DisplayItems.jsx";
import CustomerForm from "../../components/CustomerForm/CustomerForm.jsx";
import CartItems from "../../components/CartItems/CartItems.jsx";
import CartSummary from "../../components/CartSummary/CartSummary.jsx";
import BarcodeScanner from "../../components/BarcodeScanner/BarcodeScanner.jsx";
import LoyaltyService from "../../Service/LoyaltyService.js";
import toast from "react-hot-toast";

const Explore = () => {
    const {categories, addToCart, cartItems} = useContext(AppContext);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [loyaltyCustomer, setLoyaltyCustomer] = useState(null);
    const [loyaltyCardBarcode, setLoyaltyCardBarcode] = useState("");
    const [showLoyaltyScanner, setShowLoyaltyScanner] = useState(false);

    const handleItemFound = (item) => {
        if (addToCart) {
            addToCart(item);
        }
        setShowBarcodeScanner(false);
    };

    const handleLoyaltyCardFound = async (barcode) => {
        try {
            const response = await LoyaltyService.getCustomerByLoyaltyCard(barcode);
            setLoyaltyCustomer(response.data);
            setLoyaltyCardBarcode(barcode);
            toast.success(`Лоялна карта разпозната: ${response.data.firstName} ${response.data.lastName}`);
        } catch (error) {
            toast.error('Лоялна карта не е намерена');
            console.error('Error finding loyalty customer:', error);
        }
        setShowLoyaltyScanner(false);
    };

    const handlePhoneNumberChange = async (phone) => {
        setMobileNumber(phone);
        if (phone && phone.length >= 10) {
            try {
                const response = await LoyaltyService.getCustomerByPhone(phone);
                setLoyaltyCustomer(response.data);
                toast.success(`Клиент намерен: ${response.data.firstName} ${response.data.lastName}`);
            } catch (error) {
                // Phone not found, that's okay
                setLoyaltyCustomer(null);
            }
        } else {
            setLoyaltyCustomer(null);
        }
    };

    const clearLoyaltyCustomer = () => {
        setLoyaltyCustomer(null);
        setLoyaltyCardBarcode("");
        setMobileNumber("");
    };

    return (
        <div className="explore-container text-light">
            <div className="left-column">
                <div className="first-row" style={{overflowY: 'auto'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5><i className="bi bi-grid"></i> Категории</h5>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-light btn-sm"
                                onClick={() => window.location.reload()}
                                title="Обнови"
                            >
                                <i className="bi bi-arrow-clockwise"></i> Обнови
                            </button>
                            <button 
                                className="btn btn-warning btn-sm"
                                onClick={() => setShowBarcodeScanner(true)}
                            >
                                <i className="bi bi-upc-scan"></i> Сканирай баркод
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
                <div className="customer-form-container" style={{height: '15%'}}>
                    <CustomerForm
                        customerName={customerName}
                        mobileNumber={mobileNumber}
                        setMobileNumber={handlePhoneNumberChange}
                        setCustomerName={setCustomerName}
                        loyaltyCustomer={loyaltyCustomer}
                        loyaltyCardBarcode={loyaltyCardBarcode}
                        onLoyaltyCardScan={() => setShowLoyaltyScanner(true)}
                        onClearLoyaltyCustomer={clearLoyaltyCustomer}
                    />
                </div>
                <hr className="my-3 text-light" />
                <div className="cart-items-container" style={{height: '55%', overflowY: 'auto'}}>
                    <CartItems />
                </div>
                <div className="cart-summary-container" style={{height: '30%'}}>
                    <CartSummary
                        customerName={customerName}
                        mobileNumber={mobileNumber}
                        setMobileNumber={setMobileNumber}
                        setCustomerName={setCustomerName}
                        loyaltyCustomer={loyaltyCustomer}
                    />
                </div>
            </div>

            {showBarcodeScanner && (
                <BarcodeScanner
                    onItemFound={handleItemFound}
                    onClose={() => setShowBarcodeScanner(false)}
                />
            )}

            {showLoyaltyScanner && (
                <BarcodeScanner
                    onItemFound={handleLoyaltyCardFound}
                    onClose={() => setShowLoyaltyScanner(false)}
                    title="Сканирай лоялна карта"
                />
            )}
        </div>
    )
}

export default Explore;