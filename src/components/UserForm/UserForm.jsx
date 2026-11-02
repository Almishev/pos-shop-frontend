import {useEffect, useState} from "react";
import {addUser, updateUser} from "../../Service/UserService.js";
import toast from "react-hot-toast";

const emptyForm = () => ({
    firstName: "",
    middleName: "",
    lastName: "",
    position: "",
    email: "",
    password: "",
    role: "ROLE_USER",
    operatorCode: ""
});

const UserForm = ({setUsers, editing, onClearEdit}) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(emptyForm());

    useEffect(() => {
        if (!editing) {
            setData(emptyForm());
            return;
        }
        setData({
            firstName: editing.firstName || "",
            middleName: editing.middleName || "",
            lastName: editing.lastName || "",
            position: editing.position || "",
            email: editing.email || "",
            password: "",
            role: editing.role || "ROLE_USER",
            operatorCode: editing.operatorCode || ""
        });
    }, [editing]);

    const onChangeHandler = (e) => {
        const name = e.target.name;
        let value = e.target.value;
        if (name === "password") {
            value = value.replace(/\D/g, "").slice(0, 12);
        }
        if (name === "operatorCode") {
            value = value.replace(/\D/g, "").slice(0, 4);
        }
        setData((current) => ({ ...current, [name]: value }));
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (!editing && !/^\d{4,12}$/.test(data.password)) {
            toast.error("Паролата трябва да е само цифри (4–12)");
            return;
        }
        if (data.operatorCode && !/^\d{4}$/.test(data.operatorCode)) {
            toast.error("Кодът на оператора трябва да е 4 цифри");
            return;
        }
        if (!data.firstName.trim() || !data.middleName.trim() || !data.lastName.trim() || !data.position.trim()) {
            toast.error("Трите имена и длъжността са задължителни");
            return;
        }
        setLoading(true);
        try {
            if (editing) {
                const response = await updateUser(editing.userId, data);
                setUsers((prevUsers) => prevUsers.map((user) => user.userId === editing.userId ? response.data : user));
                toast.success("Потребителят е обновен");
                onClearEdit();
            } else {
                const response = await addUser(data);
                setUsers((prevUsers) => [...prevUsers, response.data]);
                toast.success("Потребителят е добавен");
                setData(emptyForm());
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Грешка при запис на потребител");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-2 mt-2">
            <div className="row">
                <div className="card col-md-12 form-container">
                    <div className="card-body">
                        <form onSubmit={onSubmitHandler}>
                            <div className="mb-3">
                                <label htmlFor="firstName" className="form-label">Име</label>
                                <input type="text" name="firstName" id="firstName" className="form-control" required
                                       onChange={onChangeHandler} value={data.firstName} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="middleName" className="form-label">Презиме</label>
                                <input type="text" name="middleName" id="middleName" className="form-control" required
                                       onChange={onChangeHandler} value={data.middleName} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="lastName" className="form-label">Фамилия</label>
                                <input type="text" name="lastName" id="lastName" className="form-control" required
                                       onChange={onChangeHandler} value={data.lastName} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="position" className="form-label">Длъжност</label>
                                <input type="text" name="position" id="position" className="form-control" required
                                       onChange={onChangeHandler} value={data.position} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Имейл</label>
                                <input type="email" name="email" id="email" className="form-control" required
                                       onChange={onChangeHandler} value={data.email} disabled={Boolean(editing)} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="role" className="form-label">Роля</label>
                                <select name="role" id="role" className="form-select" value={data.role} onChange={onChangeHandler}>
                                    <option value="ROLE_USER">Касиер</option>
                                    <option value="ROLE_ADMIN">Администратор</option>
                                    <option value="ROLE_AUDITOR">Одитор</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="operatorCode" className="form-label">Код на оператор (4 цифри)</label>
                                <input type="text" name="operatorCode" id="operatorCode" className="form-control"
                                       placeholder="празно = следващ свободен" inputMode="numeric" maxLength={4}
                                       onChange={onChangeHandler} value={data.operatorCode} />
                            </div>
                            {!editing && (
                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label">Парола (само цифри)</label>
                                    <input type="password" name="password" id="password" className="form-control"
                                           placeholder="напр. 555555" inputMode="numeric" pattern="[0-9]*" maxLength={12}
                                           onChange={onChangeHandler} value={data.password} required />
                                </div>
                            )}
                            <button type="submit" className="btn btn-warning w-100" disabled={loading}>
                                {loading ? "Зареждане..." : "Запази"}
                            </button>
                            {editing && (
                                <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onClearEdit}>
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

export default UserForm;
