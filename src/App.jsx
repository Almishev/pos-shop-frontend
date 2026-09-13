import React from "react";
import Menubar from "./components/Menubar/Menubar.jsx";
import {Navigate, Route, Routes, useLocation, useParams} from "react-router-dom";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import ManageCategory from "./pages/ManageCategory/ManageCategory.jsx";
import ManageUsers from "./pages/ManageUsers/ManageUsers.jsx";
import ManageItems from "./pages/ManageItems/ManageItems.jsx";
import ManageFiscalDevices from "./pages/ManageFiscalDevices/ManageFiscalDevices.jsx";
import InventoryManagement from "./pages/InventoryManagement/InventoryManagement.jsx";
import ItemEditPage from "./pages/ItemEdit/ItemEditPage.jsx";
import DeliveriesPage from "./pages/Deliveries/DeliveriesPage.jsx";
import LoyaltyManagement from "./pages/LoyaltyManagement/LoyaltyManagement.jsx";
import ExcelImportPage from "./pages/ExcelImport/ExcelImportPage.jsx";
import Explore from "./pages/Explore/Explore.jsx";
import {Toaster, toast} from "react-hot-toast";
import Login from "./pages/Login/Login.jsx";
import OrderHistory from "./pages/OrderHistory/OrderHistory.jsx";
import UnifiedReports from "./pages/Reports/UnifiedReports.jsx";
import LabelManagement from "./components/Labels/LabelManagement.jsx";
import {useContext} from "react";
import {AuthContext} from "./context/AppContext.jsx";
import NotFound from "./pages/NotFound/NotFound.jsx";

const App = () => {
    const location = useLocation();
    // AuthContext only — cart/catalog updates must not remount routed pages
    const {auth} = useContext(AuthContext);

    const LoginRoute = ({element}) => {
        if(auth.token) {
            const home = auth.role === "ROLE_ADMIN" ? "/dashboard" : "/explore";
            return <Navigate to={home} replace />;
        }
        return element;
    }

    const ProtectedRoute = ({element, allowedRoles}) => {
        const params = useParams();
        
        if (!auth.token) {
            return <Navigate to="/login" replace />;
        }

        if (allowedRoles && !allowedRoles.includes(auth.role)) {
            if (auth.role === "ROLE_ADMIN" && allowedRoles.includes("ROLE_USER") && !allowedRoles.includes("ROLE_ADMIN")) {
                toast.error(
                    "Влезте с потребител касиер за продажби, контрол на касата и сменен отчет.",
                    { id: "admin-cashier-only", duration: 5000 }
                );
            }
            const fallback = auth.role === "ROLE_ADMIN" ? "/dashboard" : "/explore";
            return <Navigate to={fallback} replace />;
        }

        return React.cloneElement(element, params);
    }

    return (
        <div>
            {location.pathname !== "/login" && location.pathname !== '/' && <Menubar />}
            <Toaster />
            <Routes>
                <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} allowedRoles={['ROLE_ADMIN']} />} />
                <Route path="/explore" element={<ProtectedRoute element={<Explore />} allowedRoles={['ROLE_USER']} />} />
                {/*Admin only routes*/}
                <Route path="/category" element={<ProtectedRoute element={<ManageCategory />} allowedRoles={['ROLE_ADMIN']} />} />
                <Route path="/users" element={<ProtectedRoute element={<ManageUsers />} allowedRoles={["ROLE_ADMIN"]} />} />
                <Route path="/items" element={<ProtectedRoute element={<ManageItems />} allowedRoles={["ROLE_ADMIN"]} /> } />
                <Route path="/fiscal-devices" element={<ProtectedRoute element={<ManageFiscalDevices />} allowedRoles={["ROLE_ADMIN"]} />} />
                <Route path="/inventory" element={<ProtectedRoute element={<InventoryManagement />} allowedRoles={["ROLE_ADMIN"]} />} />
                <Route path="/inventory/:id" element={<ProtectedRoute element={<ItemEditPage />} allowedRoles={["ROLE_ADMIN"]} />} />
                <Route path="/deliveries" element={<ProtectedRoute element={<DeliveriesPage />} allowedRoles={["ROLE_ADMIN"]} />} />
                <Route path="/loyalty" element={<ProtectedRoute element={<LoyaltyManagement />} allowedRoles={["ROLE_USER", "ROLE_ADMIN"]} />} />
                <Route path="/excel-import" element={<ProtectedRoute element={<ExcelImportPage />} allowedRoles={["ROLE_ADMIN"]} />} />
                <Route path="/labels" element={<ProtectedRoute element={<LabelManagement />} allowedRoles={["ROLE_ADMIN"]} />} />

                <Route path="/login" element={<LoginRoute element={<Login />} />} />
                <Route path="/orders" element={<ProtectedRoute element={<OrderHistory />} allowedRoles={['ROLE_USER', 'ROLE_ADMIN']} />} />
                <Route path="/reports" element={<ProtectedRoute element={<UnifiedReports />} allowedRoles={["ROLE_USER", "ROLE_ADMIN"]} />} />
                <Route path="/" element={<Login />} />
                <Route path="*" element={<NotFound />} />

            </Routes>
        </div>
    );
}

export default App;