import './CustomerForm.css';

const CustomerForm = ({customerName, mobileNumber, setMobileNumber, setCustomerName, loyaltyCustomer, loyaltyCardBarcode, onLoyaltyCardScan, onClearLoyaltyCustomer}) => {
    return (
        <div className="p-3 customer-form-container">
            <div className="mb-3">
                <div className="row g-2 align-items-center">
                    <div className="col-md-6 d-flex align-items-center gap-2">
                        <label htmlFor="customerName" className="col-4">Име на клиент</label>
                        <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            id="customerName" 
                            onChange={(e) => setCustomerName(e.target.value)} 
                            value={customerName} 
                            placeholder="Оставете празно за 'Случаен клиент'"
                        />
                    </div>
                    <div className="col-md-6 d-flex align-items-center gap-2">
                        <label htmlFor="mobileNumber" className="col-4">Телефон</label>
                        <input 
                            type="text" 
                            className="form-control form-control-sm" 
                            id="mobileNumber" 
                            onChange={(e) => setMobileNumber(e.target.value)} 
                            value={mobileNumber} 
                            placeholder="Оставете празно за '0000000000'"
                        />
                    </div>
                </div>
            </div>
            
            {/* Loyalty Card Section */}
            <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
                    <label className="col-4">Лоялна карта</label>
                    <div className="d-flex gap-2 flex-grow-1">
                        {loyaltyCustomer ? (
                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                                <span className="badge bg-success">
                                    {loyaltyCustomer.firstName} {loyaltyCustomer.lastName}
                                </span>
                                <span className="badge bg-info">
                                    {loyaltyCustomer.loyaltyPoints || 0} точки
                                </span>
                                <button 
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={onClearLoyaltyCustomer}
                                >
                                    <i className="bi bi-x"></i>
                                </button>
                            </div>
                        ) : (
                            <button 
                                type="button"
                                className="btn btn-outline-warning btn-sm"
                                onClick={onLoyaltyCardScan}
                            >
                                <i className="bi bi-credit-card"></i> Сканирай карта
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CustomerForm;