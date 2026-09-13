import {useContext, useState} from "react";
import {useNavigate} from "react-router-dom";
import {AppContext} from "../../context/AppContext.jsx";
import {deleteItem, searchItems} from "../../Service/ItemService.js";
import toast from "react-hot-toast";
import { formatMoney } from "../../util/formatMoney.js";
import './ItemList.css';

const ItemList = () => {
    const navigate = useNavigate();
    const {itemsData, setItemsData} = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const filteredItems = itemsData.filter((item) => {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.barcode && item.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    })

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        try {
            const response = await searchItems(searchTerm);
            setSearchResults(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Търсенето се провали");
        } finally {
            setIsSearching(false);
        }
    }

    const removeItem = async (itemId) => {
        try {
            const response = await deleteItem(itemId);
            if (response.status === 204) {
                const updatedItems = itemsData.filter(item => item.itemId !== itemId);
                setItemsData(updatedItems);
                toast.success("Артикулът е изтрит");
            } else {
                toast.error("Неуспешно изтриване на артикул");
            }
        }catch(err) {
            console.error(err);
            toast.error("Неуспешно изтриване на артикул");
        }
    }

    const displayItems = searchResults || filteredItems;

    const editItem = (item) => {
        const itemId = item.itemId;
        if (!itemId) {
            toast.error('Артикулът няма валиден ID');
            return;
        }
        navigate(`/inventory/${itemId}`);
    };

    return (
        <div className="category-list-container" style={{height:'100vh', overflowY: 'auto', overflowX: 'hidden'}}>
            <div className="row">
                <div className="input-group mb-3">
                    <input type="text"
                           name="keyword"
                           id="keyword"
                           placeholder="Търси по име или баркод"
                           className="form-control"
                           onChange={(e) => setSearchTerm(e.target.value)}
                           value={searchTerm}
                           onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        className="btn btn-warning" 
                        onClick={handleSearch}
                        disabled={isSearching}
                    >
                        {isSearching ? (
                            <i className="bi bi-hourglass-split"></i>
                        ) : (
                            <i className="bi bi-search"></i>
                        )}
                    </button>
                </div>
                {searchResults && (
                    <div className="mb-3">
                        <button 
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => {
                                setSearchResults(null);
                                setSearchTerm("");
                            }}
                        >
                            <i className="bi bi-x-circle"></i> Изчисти търсенето
                        </button>
                        <span className="ms-2 text-muted">
                            Намерени {searchResults.length} резултата
                        </span>
                    </div>
                )}
            </div>
            <div className="row g-3">
                {displayItems.map((item, index) => (
                    <div className="col-lg-12" key={index}>
                        <div className="card p-3 bg-dark item-card">
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h6 className="mb-1 text-white">{item.name}</h6>
                                    <p className="mb-1 text-white">
                                        Категория: {item.categoryName}
                                    </p>
                                    {item.barcode && (
                                        <p className="mb-1 text-white small">
                                            <i className="bi bi-upc-scan"></i> Баркод: {item.barcode}
                                        </p>
                                    )}
                                    {!item.isPromo ? (
                                        <span className="mb-0 text-block badge rounded-pill text-bg-warning">
                                            {formatMoney(item.price)}
                                        </span>
                                    ) : (
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="text-muted text-decoration-line-through small">
                                                {formatMoney(item.price)}
                                            </span>
                                            <span className="badge rounded-pill text-bg-danger">
                                                {formatMoney(item.effectivePrice)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => editItem(item)}
                                        title="Редактирай артикул"
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.itemId)} title="Изтрий">
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ItemList;