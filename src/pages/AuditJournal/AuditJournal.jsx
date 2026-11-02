import {useState} from "react";
import {fetchAudit} from "../../Service/AuditService.js";
import toast from "react-hot-toast";

const ACTIONS = [
    { value: "", label: "Всички" },
    { value: "LOGIN", label: "Вход" },
    { value: "LOGOUT", label: "Изход" },
    { value: "USER_CREATE", label: "Въвеждане на оператор" },
    { value: "USER_CHANGE", label: "Промяна на оператор" },
    { value: "STORNO", label: "Сторно" },
    { value: "VOID", label: "Анулиране" },
    { value: "NOMENCLATURE_CHANGE", label: "Номенклатура" }
];

const labelOf = (action) => ACTIONS.find((item) => item.value === action)?.label || action;

const AuditJournal = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [operatorCode, setOperatorCode] = useState("");
    const [action, setAction] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async (event) => {
        event?.preventDefault();
        setLoading(true);
        try {
            const response = await fetchAudit({
                from,
                to,
                operatorCode: operatorCode || undefined,
                action: action || undefined
            });
            setRows(response.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Дневникът не се зареди");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid py-3 text-light">
            <h3>Одитен дневник</h3>
            <form className="row g-2 align-items-end mb-3" onSubmit={load}>
                <div className="col-md-2">
                    <label className="form-label">От</label>
                    <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} required />
                </div>
                <div className="col-md-2">
                    <label className="form-label">До</label>
                    <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} required />
                </div>
                <div className="col-md-2">
                    <label className="form-label">Код на оператор</label>
                    <input className="form-control" value={operatorCode} maxLength={4} onChange={(e) => setOperatorCode(e.target.value.replace(/\D/g, "").slice(0, 4))} />
                </div>
                <div className="col-md-3">
                    <label className="form-label">Действие</label>
                    <select className="form-select" value={action} onChange={(e) => setAction(e.target.value)}>
                        {ACTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                </div>
                <div className="col-md-2">
                    <button className="btn btn-warning" disabled={loading}>{loading ? "Зареждане..." : "Покажи"}</button>
                </div>
            </form>
            <div className="table-responsive">
                <table className="table table-striped table-sm">
                    <thead>
                    <tr>
                        <th>Дата и час</th>
                        <th>Оператор</th>
                        <th>Код</th>
                        <th>Роля</th>
                        <th>Действие</th>
                        <th>УНП</th>
                        <th>Описание</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td>{row.occurredAt?.replace("T", " ")}</td>
                            <td>{row.operatorName}</td>
                            <td>{row.operatorCode || "—"}</td>
                            <td>{row.role || "—"}</td>
                            <td>{labelOf(row.action)}</td>
                            <td>{row.uniqueSaleNumber || "—"}</td>
                            <td>{row.description}</td>
                        </tr>
                    ))}
                    {rows.length === 0 && (
                        <tr><td colSpan={7}>Няма записи за избрания филтър.</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditJournal;
