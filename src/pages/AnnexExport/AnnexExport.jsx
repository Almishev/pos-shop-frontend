import {useEffect, useState} from "react";
import {downloadAnnexCsv, fetchAnnexTable} from "../../Service/AnnexExportService.js";
import {fetchOperators} from "../../Service/AuditService.js";
import FiscalService from "../../Service/FiscalService.js";
import toast from "react-hot-toast";

const TABLES = [
    ["18.1", "18.1 Обобщени продажби"],
    ["18.2", "18.2 Плащания"],
    ["18.3", "18.3 Редове на продажби"],
    ["18.4", "18.4 Сторно"],
    ["18.5", "18.5 Анулирани"],
    ["18.6", "18.6 Доставки"],
    ["18.7", "18.7 Редове на доставки"],
    ["18.8", "18.8 Движение на стоки"],
    ["18.9.operators", "18.9 Оператори"],
    ["18.9.roles", "18.9 Роли"],
    ["18.9.rights", "18.9 Права"],
    ["18.9.payments", "18.9 Видове плащания"],
    ["18.9.actions", "18.9 Видове действия"],
    ["18.9.sites", "18.9 Обекти"],
    ["18.9.workplaces", "18.9 Работни места"],
    ["18.9.customers", "18.9 Клиенти"],
    ["18.9.suppliers", "18.9 Доставчици"]
];

const AnnexExport = () => {
    const today = new Date().toISOString().slice(0, 10);
    const [table, setTable] = useState("18.1");
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(today);
    const [device, setDevice] = useState("");
    const [operatorCode, setOperatorCode] = useState("");
    const [devices, setDevices] = useState([]);
    const [operators, setOperators] = useState([]);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        FiscalService.getAllDevices().then((devices) => setDevices(devices || [])).catch(() => setDevices([]));
        fetchOperators().then((response) => setOperators(response.data || [])).catch(() => setOperators([]));
    }, []);

    const params = () => ({
        table,
        from,
        to,
        device: device || undefined,
        operatorCode: operatorCode || undefined
    });

    const show = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetchAnnexTable(params());
            setData(response.data);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Таблицата не се зареди");
        } finally {
            setLoading(false);
        }
    };

    const download = async () => {
        try {
            const response = await downloadAnnexCsv(params());
            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${table}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            toast.error("Файлът не се свали");
        }
    };

    return (
        <div className="container-fluid py-3 text-light">
            <h3>Експорт по приложение № 29, т. 18</h3>
            <form className="row g-2 align-items-end mb-3" onSubmit={show}>
                <div className="col-md-3">
                    <label className="form-label">Таблица</label>
                    <select className="form-select" value={table} onChange={(e) => setTable(e.target.value)}>
                        {TABLES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                    </select>
                </div>
                <div className="col-md-2">
                    <label className="form-label">От</label>
                    <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} required />
                </div>
                <div className="col-md-2">
                    <label className="form-label">До</label>
                    <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} required />
                </div>
                <div className="col-md-2">
                    <label className="form-label">Фискално устройство</label>
                    <select className="form-select" value={device} onChange={(e) => setDevice(e.target.value)}>
                        <option value="">Всички</option>
                        {devices.map((item) => (
                            <option key={item.serialNumber} value={item.individualNumber || ""}>
                                {item.individualNumber || item.serialNumber}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-2">
                    <label className="form-label">Оператор</label>
                    <select className="form-select" value={operatorCode} onChange={(e) => setOperatorCode(e.target.value)}>
                        <option value="">Всички</option>
                        {operators.filter((user) => user.operatorCode).map((user) => (
                            <option key={user.userId} value={user.operatorCode}>
                                {user.operatorCode} {user.name || ""}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-md-1">
                    <button className="btn btn-warning" disabled={loading}>Покажи</button>
                </div>
            </form>
            {data && (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">{data.title}</h5>
                        <button type="button" className="btn btn-outline-light btn-sm" onClick={download}>Свали CSV</button>
                    </div>
                    <div className="table-responsive">
                        <table className="table table-striped table-sm">
                            <thead>
                            <tr>{data.columns.map((column) => <th key={column}>{column}</th>)}</tr>
                            </thead>
                            <tbody>
                            {(data.rows || []).map((row, index) => (
                                <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>
                            ))}
                            {(data.rows || []).length === 0 && (
                                <tr><td colSpan={data.columns.length}>Няма редове за периода.</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnnexExport;
