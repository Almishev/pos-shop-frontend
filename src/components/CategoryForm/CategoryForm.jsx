import {useContext, useEffect, useState} from "react";
import toast from "react-hot-toast";
import {addCategory, updateCategory} from "../../Service/CategoryService.js";
import {AppContext} from "../../context/AppContext.jsx";

const CategoryForm = ({editingCategory = null, onCancelEdit}) => {
    const {setCategories, categories} = useContext(AppContext);
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState({
        name: "",
        description: "",
        bgColor: "#2c2c2c",
    });

    useEffect(() => {
        if (editingCategory) {
            setData({
                name: editingCategory.name || "",
                description: editingCategory.description || "",
                bgColor: editingCategory.bgColor || "#2c2c2c",
            });
        } else {
            setData({
                name: "",
                description: "",
                bgColor: "#2c2c2c",
            });
        }
    }, [editingCategory]);

    const onChangeHandler = (e) => {
        const value = e.target.value;
        const name = e.target.name;
        setData((data) => ({...data, [name]: value}));
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        setLoading(true);
        const formData = new FormData();
        formData.append("category", JSON.stringify(data));
        try {
            if (editingCategory?.categoryId) {
                const response = await updateCategory(editingCategory.categoryId, formData);
                if (response.status === 200) {
                    setCategories(categories.map(category =>
                        category.categoryId === editingCategory.categoryId ? response.data : category
                    ));
                    toast.success("Категорията е обновена");
                    onCancelEdit?.();
                }
            } else {
                const response = await addCategory(formData);
                if (response.status === 201) {
                    setCategories([...categories, response.data]);
                    toast.success("Категорията е добавена");
                    setData({
                        name: "",
                        description: "",
                        bgColor: "#2c2c2c",
                    });
                }
            }
        }catch(err) {
            console.error(err);
            toast.error(editingCategory ? "Грешка при обновяване на категория" : "Грешка при добавяне на категория");
        }finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-2 mt-2">
            <div className="row">
                <div className="card col-md-12 form-container">
                    <div className="card-body">
                        <h5 className="mb-3">{editingCategory ? "Редактиране на категория" : "Нова категория"}</h5>
                        <form onSubmit={onSubmitHandler}>
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Име</label>
                                <input type="text"
                                    name="name"
                                    id="name"
                                    className="form-control"
                                    placeholder="Име на категория"
                                    onChange={onChangeHandler}
                                    value={data.name}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="description" className="form-label">Описание</label>
                                <textarea
                                        rows="5"
                                       name="description"
                                       id="description"
                                       className="form-control"
                                       placeholder="Опишете категорията..."
                                        onChange={onChangeHandler}
                                        value={data.description}
                                ></textarea>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="bgcolor" className="form-label">Цвят на фона</label>
                                <br/>
                                <input type="color"
                                       name="bgColor"
                                       id="bgcolor"
                                       onChange={onChangeHandler}
                                       value={data.bgColor}
                                       placeholder="#ffffff"
                                />
                            </div>
                            <button type="submit"
                                    disabled={loading}
                                    className="btn btn-warning w-100">
                                {loading ? "Зареждане..." : (editingCategory ? "Запази промените" : "Запази")}
                            </button>
                            {editingCategory && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary w-100 mt-2"
                                    onClick={() => onCancelEdit?.()}
                                    disabled={loading}
                                >
                                    Отказ
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CategoryForm;
