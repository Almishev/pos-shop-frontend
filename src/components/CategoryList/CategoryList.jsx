import './CategoryList.css';
import {useContext, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import {deleteCategory} from "../../Service/CategoryService.js";
import toast from "react-hot-toast";

const CategoryList = ({onEditCategory}) => {
    const {categories, setCategories} = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteByCategoryId = async (categoryId) => {
        try {
            const response = await deleteCategory(categoryId);
            if (response.status === 204) {
                const updatedCategories = categories.filter(category => category.categoryId !== categoryId);
                setCategories(updatedCategories);
                toast.success("Категорията е изтрита");
            } else {
                toast.error("Неуспешно изтриване на категория");
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || "";
            if (msg.includes("foreign key") || msg.includes("tbl_items") || msg.includes("referenced") || msg.includes("existing items")) {
                toast.error("Категорията има артикули — преместете/изтрийте ги първо");
            } else {
                toast.error("Неуспешно изтриване на категория");
            }
        }
    }

    return (
        <div className="category-list-container" style={{height:'100vh', overflowY: 'auto', overflowX: 'hidden'}}>
            <div className="row pe-2">
                <div className="input-group mb-3">
                    <input type="text"
                           name="keyword"
                           id="keyword"
                           placeholder="Търси по ключова дума"
                           className="form-control"
                            onChange={(e) => setSearchTerm(e.target.value)}
                           value={searchTerm}
                    />
                    <span className="input-group-text bg-warning">
                        <i className="bi bi-search"></i>
                    </span>
                </div>
            </div>
            <div className="row g-3 pe-2">
                {filteredCategories.map((category, index) => (
                    <div key={index} className="col-12">
                        <div className="card p-3 category-card" style={{backgroundColor: category.bgColor}}>
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <h5 className="mb-1 text-white">{category.name}</h5>
                                    <p className="mb-0 text-white">{category.items} артикула</p>
                                </div>
                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => onEditCategory?.(category)}
                                        title="Редактирай категория"
                                    >
                                        <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => deleteByCategoryId(category.categoryId)}
                                        title="Изтрий"
                                    >
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

export default CategoryList;
