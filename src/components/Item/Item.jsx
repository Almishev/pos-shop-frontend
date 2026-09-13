import './Item.css';
import {useContext} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import { formatMoney } from "../../util/formatMoney.js";

const Item = ({itemName, itemPrice, itemId, itemBarcode, itemVatRate}) => {
    const {addToCart} = useContext(AppContext);
    const handleAddToCart = () => {
        addToCart({
            name: itemName,
            price: itemPrice,
            quantity: 1,
            itemId: itemId,
            barcode: itemBarcode,
            vatRate: itemVatRate ?? 0.20
        });
    }
    return (
        <div className="item-card p-2 bg-dark rounded h-100 d-flex align-items-center gap-2">
            <div className="flex-grow-1 min-width-0">
                <h6 className="mb-0 text-light item-card-name text-truncate" title={itemName}>{itemName}</h6>
                {itemBarcode && (
                    <small className="text-secondary d-block text-truncate">
                        <i className="bi bi-upc-scan"></i> {itemBarcode}
                    </small>
                )}
                <p className="mb-0 fw-bold text-warning item-card-price">
                    {formatMoney(itemPrice)}
                </p>
            </div>
            <button className="btn btn-success btn-sm flex-shrink-0" onClick={handleAddToCart} title="Добави">
                <i className="bi bi-plus"></i>
            </button>
        </div>
    )
}

export default Item;
