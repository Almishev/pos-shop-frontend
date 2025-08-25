import './Explore.css';
import {useContext, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import DisplayCategory from "../../components/DisplayCategory/DisplayCategory.jsx";
import DisplayItems from "../../components/DisplayItems/DisplayItems.jsx";
import CustomerForm from "../../components/CustomerForm/CustomerForm.jsx";
import CartItems from "../../components/CartItems/CartItems.jsx";
import CartSummary from "../../components/CartSummary/CartSummary.jsx";
import BarcodeScanner from "../../components/BarcodeScanner/BarcodeScanner.jsx";

const Explore = () => {
    const {categories, addToCart} = useContext(AppContext);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

    const handleItemFound = (item) => {
        if (addToCart) {
            addToCart(item);
        }
        setShowBarcodeScanner(false);
    };

    return (
        <div className="explore-container text-light">
            <div className="left-column">
                <div className="first-row" style={{overflowY: 'auto'}}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5><i className="bi bi-grid"></i> Categories</h5>
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-light btn-sm"
                                onClick={() => window.location.reload()}
                                title="Refresh"
                            >
                                <i className="bi bi-arrow-clockwise"></i> Refresh
                            </button>
                            <button 
                                className="btn btn-warning btn-sm"
                                onClick={() => setShowBarcodeScanner(true)}
                            >
                                <i className="bi bi-upc-scan"></i> Scan Barcode
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
                        setMobileNumber={setMobileNumber}
                        setCustomerName={setCustomerName}
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
                    />
                </div>
            </div>

            {showBarcodeScanner && (
                <BarcodeScanner
                    onItemFound={handleItemFound}
                    onClose={() => setShowBarcodeScanner(false)}
                />
            )}
        </div>
    )
}

export default Explore;