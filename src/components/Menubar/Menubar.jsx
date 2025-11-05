import './Menubar.css';
import {assets} from "../../assets/assets.js";
import {Link, Links, useLocation, useNavigate} from "react-router-dom";
import {useContext, useState} from "react";
import {AppContext} from "../../context/AppContext.jsx";
import CashDrawerControl from "../CashDrawerControl/CashDrawerControl.jsx";

const Menubar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {setAuthData, auth} = useContext(AppContext);
    const [showCashDrawer, setShowCashDrawer] = useState(false);
    const logout = () => {
        // Изчистваме ВСИЧКИ auth данни от localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("name");
        // Изчистваме и state-а
        setAuthData(null, null, null, null);
        navigate("/login");
    }

    const isActive = (path) => {
        return location.pathname === path;
    }

    const isAdmin = auth.role === "ROLE_ADMIN";

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-2">
            <a className="navbar-brand" href="#">
                <img src={assets.logo} alt="Logo" height="40"/>
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse p-2" id="navbarNav">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                        <Link className={`nav-link ${isActive('/dashboard') ? 'fw-bold text-warning': ''}`} to="/dashboard">Табло</Link>
                    </li>
                    <li className="nav-item">
                        <Link className={`nav-link ${isActive('/explore') ? 'fw-bold text-warning': ''}`} to="/explore">Продажби</Link>
                    </li>
                    {
                        isAdmin && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/items') ? 'fw-bold text-warning': ''}`} to="/items">Артикули</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/category') ? 'fw-bold text-warning': ''}`} to="/category">Категории</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/users') ? 'fw-bold text-warning': ''}`} to="/users">Потребители</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/inventory') ? 'fw-bold text-warning': ''}`} to="/inventory">Склад</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/excel-import') ? 'fw-bold text-warning': ''}`} to="/excel-import">Excel</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/labels') ? 'fw-bold text-warning': ''}`} to="/labels"> Етикети</Link>
                                </li>
                            </>
                        )
                    }
                    <li className="nav-item">
                        <Link className={`nav-link ${isActive('/loyalty') ? 'fw-bold text-warning': ''}`} to="/loyalty">Лоялност</Link>
                    </li>
                    <li className="nav-item">
                        <Link className={`nav-link ${isActive('/orders') ? 'fw-bold text-warning': ''}`} to="/orders">Поръчки</Link>
                    </li>
                    <li className="nav-item">
                        <Link className={`nav-link ${isActive('/reports') ? 'fw-bold text-warning': ''}`} to="/reports">Отчети</Link>
                    </li>
                    {
                        isAdmin && (
                            <li className="nav-item">
                                <Link className={`nav-link ${isActive('/fiscal-devices') ? 'fw-bold text-warning': ''}`} to="/fiscal-devices">Фискални у-ва</Link>
                            </li>
                        )
                    }
                </ul>
                {/* Right actions */}
                <ul className="navbar-nav me-3">
                    <li className="nav-item">
                        <button
                            type="button"
                            className="btn btn-sm btn-warning"
                            onClick={() => setShowCashDrawer(true)}
                            title="Контрол на касата"
                        >
                            <i className="bi bi-cash-coin me-1"></i>
                            Контрол на касата
                        </button>
                    </li>
                </ul>
                {/*Add the dropdown for userprofile*/}
                <ul className="navbar-nav ms-auto ms-md-0 me-3 me-lg-4">
                    <li className="nav-item dropdown">
                        <a href="#" className="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <img src={assets.profile} alt="" height={32} width={32} />
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                            <li>
                                <a href="#!" className="dropdown-item">
                                    Настройки
                                </a>
                            </li>
                            <li>
                                <a href="#!" className="dropdown-item">
                                    Дневник
                                </a>
                            </li>
                            <li>
                                <hr className="dropdown-divider" />
                            </li>
                            <li>
                                <a href="#!" className="dropdown-item" onClick={logout}>
                                    Изход
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
            {/* Cash Drawer Modal */}
            {showCashDrawer && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title"><i className="bi bi-cash-coin me-2"></i>Контрол на касата</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCashDrawer(false)}></button>
                            </div>
                            <div className="modal-body">
                                <CashDrawerControl />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCashDrawer(false)}>Затвори</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}

export default Menubar;