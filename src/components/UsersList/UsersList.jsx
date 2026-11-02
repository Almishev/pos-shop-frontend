import {useState} from "react";
import {deleteUser} from "../../Service/UserService.js";
import toast from "react-hot-toast";

const UsersList = ({users, setUsers, onEdit}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredUsers = users.filter(user =>
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deleteByUserId = async (id) => {
        try {
            await deleteUser(id);
            setUsers(prevUsers => prevUsers.filter(user => user.userId !== id));
            toast.success("Потребителят е изтрит");
        }catch (e) {
            console.error(e);
            toast.error("Неуспешно изтриване на потребител");
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
                {
                    filteredUsers.map((user, index) => (
                        <div key={index} className="col-12">
                            <div className="card p-3 bg-dark" style={{maxWidth: '100%'}}>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <h5 className="mb-1 text-white">{user.name || "—"}</h5>
                                        <p className="mb-0 text-white">{user.email}</p>
                                        <p className="mb-0 text-white-50">Оператор: {user.operatorCode || "—"}</p>
                                        <p className="mb-0 text-white-50">{user.position || "Без длъжност"} · {roleLabel(user.role)}</p>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-warning btn-sm" onClick={() => onEdit(user)}>
                                            Допълни
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteByUserId(user.userId)}>
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default UsersList;

function roleLabel(role) {
    if (role === "ROLE_ADMIN") return "Администратор";
    if (role === "ROLE_AUDITOR") return "Одитор";
    return "Касиер";
}