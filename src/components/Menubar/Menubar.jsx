import './Menubar.css';
import {assets} from "../../assets/assets.js";
import {Link, useLocation, useNavigate} from "react-router-dom";
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
        // Допълнително изчистване на всички други възможни ключове
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('auth') || key.startsWith('user') || key.startsWith('session')) {
                localStorage.removeItem(key);
            }
        });
        // Изчистваме и state-а
        setAuthData(null, null, null, null);
        // Принудително навигация с replace за да изчистим history
        navigate("/login", { replace: true });
    }

    const isActive = (path) => {
        return location.pathname === path;
    }

    const isCatalogSection = location.pathname === '/items'
        || location.pathname === '/category';

    const isWarehouseSection = location.pathname === '/inventory'
        || location.pathname.startsWith('/inventory/')
        || location.pathname === '/deliveries'
        || location.pathname === '/excel-import';

    const isManagementSection = location.pathname === '/users'
        || location.pathname === '/labels'
        || location.pathname === '/loyalty';

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
                    {
                        isAdmin && (
                            <li className="nav-item">
                                <Link className={`nav-link ${isActive('/dashboard') ? 'fw-bold text-warning': ''}`} to="/dashboard">Табло</Link>
                            </li>
                        )
                    }
                    {
                        !isAdmin && (
                            <li className="nav-item">
                                <Link className={`nav-link ${isActive('/explore') ? 'fw-bold text-warning': ''}`} to="/explore">Продажби</Link>
                            </li>
                        )
                    }
                    {
                        isAdmin && (
                            <>
                                <li className="nav-item dropdown">
                                    <a
                                        href="#"
                                        className={`nav-link dropdown-toggle ${
                                            isCatalogSection ? 'fw-bold text-warning' : ''
                                        }`}
                                        id="catalogDropdown"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        Каталог
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="catalogDropdown">
                                        <li>
                                            <Link className={`dropdown-item ${isActive('/items') ? 'active' : ''}`} to="/items">
                                                Артикули
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className={`dropdown-item ${isActive('/category') ? 'active' : ''}`} to="/category">
                                                Категории
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                                <li className="nav-item dropdown">
                                    <a
                                        href="#"
                                        className={`nav-link dropdown-toggle ${
                                            isWarehouseSection ? 'fw-bold text-warning' : ''
                                        }`}
                                        id="warehouseDropdown"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        Склад
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="warehouseDropdown">
                                        <li>
                                            <Link className={`dropdown-item ${location.pathname === '/inventory' || location.pathname.startsWith('/inventory/') ? 'active' : ''}`} to="/inventory">
                                                Склад
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className={`dropdown-item ${isActive('/deliveries') ? 'active' : ''}`} to="/deliveries">
                                                Доставки
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className={`dropdown-item ${isActive('/excel-import') ? 'active' : ''}`} to="/excel-import">
                                                Excel
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                                <li className="nav-item dropdown">
                                    <a
                                        href="#"
                                        className={`nav-link dropdown-toggle ${
                                            isManagementSection ? 'fw-bold text-warning' : ''
                                        }`}
                                        id="managementDropdown"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        Управление
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="managementDropdown">
                                        <li>
                                            <Link className={`dropdown-item ${isActive('/users') ? 'active' : ''}`} to="/users">
                                                Потребители
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className={`dropdown-item ${isActive('/labels') ? 'active' : ''}`} to="/labels">
                                                Етикети
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className={`dropdown-item ${isActive('/loyalty') ? 'active' : ''}`} to="/loyalty">
                                                Лоялност
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        )
                    }
                    {
                        !isAdmin && (
                            <li className="nav-item">
                                <Link className={`nav-link ${isActive('/loyalty') ? 'fw-bold text-warning': ''}`} to="/loyalty">Лоялност</Link>
                            </li>
                        )
                    }
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
                {/* Right actions — cash drawer is cashier-only */}
                {!isAdmin && (
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
                )}
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
            {!isAdmin && showCashDrawer && (
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