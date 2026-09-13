import './Category.css';

const Category = ({categoryName, numberOfItems, bgColor, isSelected, onClick}) => {
    return (
        <button
            type="button"
            className={`category-chip ${isSelected ? 'category-chip-selected' : ''}`}
            style={{ '--chip-bg': bgColor || '#495057' }}
            onClick={onClick}
            title={categoryName}
        >
            <span className="category-chip-name text-truncate">{categoryName}</span>
            <span className="category-chip-count">{numberOfItems}</span>
        </button>
    )
}

export default Category;
