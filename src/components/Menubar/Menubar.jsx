import './Menubar.css';
import {assets} from "../../assets/assets.js";
import {Link, Links, useLocation, useNavigate} from "react-router-dom";
import {useContext} from "react";
import {AppContext} from "../../context/AppContext.jsx";

const Menubar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {setAuthData, auth} = useContext(AppContext);
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setAuthData(null, null);
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
                                    <Link className={`nav-link ${isActive('/inventory') ? 'fw-bold text-warning': ''}`} to="/inventory">📦 Склад</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/excel-import') ? 'fw-bold text-warning': ''}`} to="/excel-import">Excel</Link>
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
                    {
                        isAdmin && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link ${isActive('/reports') ? 'fw-bold text-warning': ''}`} to="/reports">📊 Отчети</Link>
                                </li>
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        🏪 Фискални
                                    </a>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <Link className="dropdown-item" to="/fiscal-devices">
                                                <i className="bi bi-printer me-2"></i>
                                                Фискални устройства
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/fiscal-reports">
                                                <i className="bi bi-file-earmark-text me-2"></i>
                                                Фискални отчети
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        )
                    }
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
        </nav>
    )
}

export default Menubar;