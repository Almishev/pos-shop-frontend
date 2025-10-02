import './Item.css';
import {useContext} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import {assets} from "../../assets/assets.js";

const Item = ({itemName, itemPrice, itemImage, itemId, itemBarcode, itemVatRate}) => {
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
        <div className="p-3 bg-dark rounded shadow-sm h-100 d-flex align-items-center item-card">
            <div style={{position: "relative", marginRight: "15px"}}>
                <img src={itemImage || assets.supermarket} alt={itemName} className="item-image" />
            </div>

            <div className="flex-grow-1 ms-2">
                <h6 className="mb-1 text-light">{itemName}</h6>
                {itemBarcode && (
                    <small className="text-light d-block mb-1">
                        <i className="bi bi-upc-scan"></i> {itemBarcode}
                    </small>
                )}
                <p className="mb-0 fw-bold text-light">
                    {(new Intl.NumberFormat('bg-BG', {style:'currency', currency:'BGN'})).format(itemPrice)}
                </p>
            </div>

            <div className="d-flex flex-column justify-content-between align-items-center ms-3"
                style={{height: "100%"}}>
                <i className="bi bi-cart-plus fs-4 text-warning"></i>
                <button className="btn btn-success btn-sm" onClick={handleAddToCart}>
                    <i className="bi bi-plus"></i>
                </button>
            </div>
        </div>
    )
}

export default Item;