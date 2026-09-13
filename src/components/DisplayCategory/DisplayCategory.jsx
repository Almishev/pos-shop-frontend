import './DisplayCategory.css';
import Category from "../Category/Category.jsx";

const DisplayCategory = ({selectedCategory, setSelectedCategory, categories}) => {
    const totalItems = categories.reduce((acc, cat) => acc + cat.items, 0);

    return (
        <div className="row g-2 category-row">
            <div className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                <Category
                    categoryName="Всички артикули"
                    numberOfItems={totalItems}
                    bgColor="#6c757d"
                    isSelected={selectedCategory === ""}
                    onClick={() => setSelectedCategory("")}
                />
            </div>
            {categories.map(category => (
                <div key={category.categoryId} className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
                    <Category
                        categoryName={category.name}
                        numberOfItems={category.items}
                        bgColor={category.bgColor}
                        isSelected={selectedCategory === category.categoryId}
                        onClick={() => setSelectedCategory(category.categoryId)}
                    />
                </div>
            ))}
        </div>
    )
}

export default DisplayCategory;
