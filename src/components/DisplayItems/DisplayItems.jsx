import {useContext, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import Item from "../Item/Item.jsx";
import SearchBox from "../SearchBox/SearchBox.jsx";

const DisplayItems = ({selectedCategory}) => {
    const {itemsData} = useContext(AppContext);
    const [searchText, setSearchText] = useState("");

    const filteredItems = itemsData.filter(item => {
        if(!selectedCategory) return true;
        return item.categoryId === selectedCategory;
    }).filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.barcode && item.barcode.toLowerCase().includes(searchText.toLowerCase()))
    );

    return (
        <div className="p-2">
            <div className="d-flex justify-content-end mb-2">
                <SearchBox onSearch={setSearchText} placeholder="Търси по име или баркод..." />
            </div>
            <div className="row g-2">
                {filteredItems.map((item) => (
                    <div key={item.itemId} className="col-xl-3 col-lg-3 col-md-4 col-sm-6">
                        <Item
                            itemName={item.name}
                            itemPrice={item.isPromo ? item.effectivePrice : item.price}
                            itemId={item.itemId}
                            itemBarcode={item.barcode}
                            itemVatRate={item.vatRate}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DisplayItems;