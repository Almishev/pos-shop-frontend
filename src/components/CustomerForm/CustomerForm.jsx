import './CustomerForm.css';

const CustomerForm = ({customerName, mobileNumber, setMobileNumber, setCustomerName}) => {
    return (
        <div className="p-3 customer-form-container">
            <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
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
            </div>
            <div className="mb-3">
                <div className="d-flex align-items-center gap-2">
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
    )
}

export default CustomerForm;