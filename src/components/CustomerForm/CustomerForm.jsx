import './CustomerForm.css';

const CustomerForm = ({loyaltyCustomer, onLoyaltyCardScan, onClearLoyaltyCustomer}) => {
    return (
        <div className="customer-form-compact">
            <div className="customer-form-row customer-form-loyalty-only">
                {loyaltyCustomer ? (
                    <div className="loyalty-chip d-flex align-items-center gap-2 flex-grow-1">
                        <span className="badge bg-success text-truncate">
                            {loyaltyCustomer.firstName} {loyaltyCustomer.lastName}
                        </span>
                        <span className="badge bg-info">
                            {loyaltyCustomer.loyaltyPoints || 0} т.
                        </span>
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm py-0 px-1"
                            onClick={onClearLoyaltyCustomer}
                            title="Изчисти карта"
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
                        <i className="bi bi-credit-card"></i> Лоялна карта
                    </button>
                )}
            </div>
        </div>
    )
}

export default CustomerForm;
