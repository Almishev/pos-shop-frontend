import './CustomerForm.css';

const CustomerForm = ({customerName, mobileNumber, setMobileNumber, setCustomerName}) => {
    return (
        <div className="p-3 customer-form-container">
            <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="customerName" className="col-4">Customer name</label>
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        id="customerName" 
                        onChange={(e) => setCustomerName(e.target.value)} 
                        value={customerName} 
                        placeholder="Leave empty for 'Walk-in Customer'"
                    />
                </div>
            </div>
            <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
                    <label htmlFor="mobileNumber" className="col-4">Mobile number</label>
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        id="mobileNumber" 
                        onChange={(e) => setMobileNumber(e.target.value)} 
                        value={mobileNumber} 
                        placeholder="Leave empty for '0000000000'"
                    />
                </div>
            </div>
        </div>
    )
}

export default CustomerForm;