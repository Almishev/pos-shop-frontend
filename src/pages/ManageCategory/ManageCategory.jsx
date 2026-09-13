import { useState } from "react";
import './ManageCategory.css';
import CategoryForm from "../../components/CategoryForm/CategoryForm.jsx";
import CategoryList from "../../components/CategoryList/CategoryList.jsx";

const ManageCategory = () => {
    const [editingCategory, setEditingCategory] = useState(null);

    return (
        <div className="category-container text-light">
            <div className="left-column">
                <CategoryForm
                    editingCategory={editingCategory}
                    onCancelEdit={() => setEditingCategory(null)}
                />
            </div>
            <div className="right-column">
                <CategoryList onEditCategory={setEditingCategory} />
            </div>
        </div>
    )
}

export default ManageCategory;
