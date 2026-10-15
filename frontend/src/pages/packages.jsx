import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL as API_ROOT } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function PackagesDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [packageName, setPackageName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [durationValue, setDurationValue] = useState("");
    const [durationUnit, setDurationUnit] = useState("hours");
    const [dataQuotaGb, setDataQuotaGb] = useState("0");
    const [statusToggle, setStatusToggle] = useState("active");
    const [mikrotikRateLimit, setMikrotikRateLimit] = useState("5M/2M");

    const [catalogList, setCatalogList] = useState([]);
    const [uiMessage, setUiMessage] = useState("");
    const [editingPackageId, setEditingPackageId] = useState(null);

    const API_BASE_URL = `${API_ROOT}/packages`;

    const user = getStoredTenantUser();

    const logout = () => {
        clearTenantSession();
        navigate("/");
    };

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/income", label: "Revenue", icon: "💰" },
    { to: "/routers", label: "Routers", icon: "📡" },
    { to: "/packages", label: "Packages", icon: "📦" },
    { to: "/vouchers", label: "Vouchers", icon: "🎟️" },
    { to: "/payments", label: "Payments", icon: "💳" },
    { to: "/withdrawals", label: "Withdrawals", icon: "💸" },
    { to: "/sessions", label: "Sessions", icon: "⏱️" },
    { to: "/customers", label: "Customers", icon: "👥" },
    { to: "/branch", label: "Branches", icon: "🏢" },
    { to: "/portal", label: "Portal", icon: "🌐" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ];

    const getSessionTenantId = () => getTenantId();

    const fetchCatalog = async () => {
        try {
            const tenantId = getSessionTenantId();
            if (!tenantId) {
                setCatalogList([]);
                return;
            }
            const response = await fetch(`${API_BASE_URL}/catalog?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                setCatalogList(data);
            }
        } catch (error) {
            console.error("Error occurred while executing catalog request mapping:", error);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setUiMessage("");

        const calculatedSeconds = durationUnit === "days" 
            ? parseInt(durationValue) * 86400 
            : parseInt(durationValue) * 3600;

        const calculatedBytes = parseFloat(dataQuotaGb) * 1024 * 1024 * 1024;
        const tenantId = getSessionTenantId();
        if (!tenantId) {
            setUiMessage("Tenant session is missing. Please login again.");
            return;
        }

        const packageData = {
            package_name: packageName,
            description: description || null,
            price: parseFloat(price),
            duration_seconds: calculatedSeconds,
            data_quota_bytes: Math.round(calculatedBytes),
            mikrotik_rate_limit: mikrotikRateLimit || null,
            wifidog_max_down_bandwidth: 5242880, 
            wifidog_max_up_bandwidth: 2097152,
            status: statusToggle
        };

        try {
            let url = `${API_BASE_URL}/create?tenant_id=${tenantId}`;
            let method = "POST";

            if (editingPackageId) {
                url = `${API_BASE_URL}/update?tenant_id=${tenantId}`;
                method = "PUT";
                packageData.package_id = editingPackageId;
            }

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageData)
            });

            if (response.ok) {
                setUiMessage(editingPackageId ? "Package updated successfully!" : "Package created successfully!");
                clearFormFields();
                fetchCatalog();
            } else {
                setUiMessage("Failed to execute database record write operations.");
            }
        } catch (error) {
            setUiMessage("Communication failure with platform billing server core.");
        }
    };

    const handleDeletePackage = async (id) => {
        if (!window.confirm("Are you sure you want to remove this bundle package option from your catalog?")) return;
        setUiMessage("");
        
        try {
            const tenantId = getSessionTenantId();
            if (!tenantId) {
                setUiMessage("Tenant session is missing. Please login again.");
                return;
            }
            const response = await fetch(`${API_BASE_URL}/delete?tenant_id=${tenantId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ package_id: id })
            });

            if (response.ok) {
                setUiMessage("Package permanently deleted from registry.");
                fetchCatalog();
            }
        } catch (error) {
            console.error("Error executing catalog row removal:", error);
        }
    };

    const startEditing = (pkg) => {
        setEditingPackageId(pkg.id);
        setPackageName(pkg.package_name);
        setDescription(pkg.description || "");
        setPrice(pkg.price);
        setDurationValue(pkg.duration_seconds >= 86400 ? pkg.duration_seconds / 86400 : pkg.duration_seconds / 3600);
        setDurationUnit(pkg.duration_seconds >= 86400 ? "days" : "hours");
        setDataQuotaGb((pkg.data_quota_bytes / (1024 ** 3)).toString());
        setMikrotikRateLimit(pkg.mikrotik_rate_limit || "5M/2M");
        setStatusToggle(pkg.status);
    };

    const clearFormFields = () => {
        setPackageName("");
        setDescription("");
        setPrice("");
        setDurationValue("");
        setEditingPackageId(null);
        setDataQuotaGb("0");
        setMikrotikRateLimit("5M/2M");
        setStatusToggle("active");
        setDurationUnit("hours");
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return "Unlimited";
        const gb = bytes / (1024 ** 3);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
    };

    const formatDuration = (seconds) => {
        if (seconds >= 86400) {
            const days = seconds / 86400;
            return `${days} Day${days > 1 ? 's' : ''}`;
        }
        const hours = seconds / 3600;
        return `${hours} Hour${hours > 1 ? 's' : ''}`;
    };

    return (
        <div className="packages-root">
            <style>{`
                * { box-sizing: border-box; }

                html, body {
                    margin: 0;
                    padding: 0;
                    background: #000000;
                    overflow-y: auto;
                    min-height: 100vh;
                    -webkit-font-smoothing: antialiased;
                }

                .packages-root {
                    position: fixed;
                    inset: 0;
                    background: #000000;
                    font-family: 'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif;
                    color: #ffffff;
                    display: flex;
                    overflow: hidden;
                }

                /* ===== SIDEBAR ===== */
                .sidebar {
                    width: 250px;
                    height: 100vh;
                    background: #000000;
                    border-right: 1px solid #1a1a1a;
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    overflow-y: auto;
                    z-index: 100;
                }

                .sidebar::-webkit-scrollbar { width: 4px; }
                .sidebar::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }

                .sidebar-brand {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 20px 18px;
                    border-bottom: 1px solid #1a1a1a;
                    flex-shrink: 0;
                }

                .sidebar-brand-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 4px;
                    background: #e50914;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.95rem;
                    color: #fff;
                    font-weight: 900;
                    flex-shrink: 0;
                }

                .sidebar-brand-text h2 {
                    font-size: 1rem;
                    font-weight: 900;
                    color: #ffffff;
                    margin: 0;
                    letter-spacing: -0.3px;
                    line-height: 1.15;
                    text-transform: uppercase;
                }

                .sidebar-brand-text p {
                    font-size: 0.55rem;
                    color: #666;
                    margin: 3px 0 0 0;
                    letter-spacing: 1.4px;
                    text-transform: uppercase;
                    font-weight: 700;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 12px 10px;
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    overflow-y: auto;
                }

                .nav-section-label {
                    font-size: 0.55rem;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 1.6px;
                    font-weight: 800;
                    padding: 12px 14px 5px 14px;
                    margin: 0;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 9px 14px;
                    border-radius: 4px;
                    text-decoration: none;
                    color: #b3b3b3;
                    font-size: 0.8rem;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    position: relative;
                }

                .nav-item:hover {
                    background: #141414;
                    color: #ffffff;
                }

                .nav-item.active {
                    background: #141414;
                    color: #ffffff;
                    box-shadow: inset 3px 0 0 #e50914;
                }

                .nav-item.active .nav-icon svg { fill: #e50914; }

                .nav-icon {
                    width: 18px;
                    height: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .nav-icon svg {
                    width: 16px;
                    height: 16px;
                    fill: #737373;
                    transition: fill 0.15s ease;
                }

                .nav-item:hover .nav-icon svg { fill: #ffffff; }

                .sidebar-footer {
                    padding: 12px;
                    border-top: 1px solid #1a1a1a;
                    flex-shrink: 0;
                }

                .sidebar-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 10px;
                    border-radius: 4px;
                    background: #0d0d0d;
                    margin-bottom: 10px;
                    border: 1px solid #1a1a1a;
                }

                .sidebar-user-avatar {
                    width: 30px;
                    height: 30px;
                    border-radius: 4px;
                    background: #e50914;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    color: #fff;
                    font-weight: 900;
                    flex-shrink: 0;
                }

                .sidebar-user-info p {
                    margin: 0;
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #fff;
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 120px;
                }

                .sidebar-user-info span {
                    font-size: 0.55rem;
                    color: #e50914;
                    font-weight: 700;
                    letter-spacing: 0.4px;
                    text-transform: uppercase;
                }

                .sidebar-logout {
                    width: 100%;
                    padding: 9px;
                    background: #e50914;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.68rem;
                    font-weight: 900;
                    font-family: inherit;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    transition: all 0.15s ease;
                }

                .sidebar-logout:hover { background: #f6121d; }

                /* ===== OVERLAY ===== */
                .sidebar-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.85);
                    z-index: 99;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }

                .sidebar-overlay.open {
                    opacity: 1;
                    pointer-events: auto;
                }

                /* ===== MAIN ===== */
                .main-wrapper {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    overflow: hidden;
                    background: #000000;
                }

                /* ===== SLIM HEADER ===== */
                .top-bar {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 24px;
                    background: #000000;
                    border-bottom: 1px solid #1a1a1a;
                    height: 58px;
                    z-index: 10;
                }

                .top-bar-left { display: flex; align-items: center; gap: 12px; }

                .hamburger {
                    display: none;
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.3rem;
                    cursor: pointer;
                    padding: 4px;
                    line-height: 1;
                }

                .top-bar-title {
                    font-size: 1.05rem;
                    font-weight: 900;
                    color: #ffffff;
                    margin: 0;
                    letter-spacing: -0.3px;
                    text-transform: uppercase;
                }

                .top-bar-title span { color: #e50914; }

                .top-bar-right {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.6rem;
                    color: #46d369;
                    font-weight: 800;
                    background: #0d0d0d;
                    padding: 5px 10px;
                    border-radius: 3px;
                    border: 1px solid #1a1a1a;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                .status-dot {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background: #46d369;
                    border-radius: 50%;
                    animation: pulseDot 2s ease-in-out infinite;
                }

                @keyframes pulseDot {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }

                /* ===== SCROLL BODY ===== */
                .scroll-body {
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 22px 24px 40px;
                    -webkit-overflow-scrolling: touch;
                }

                .scroll-body::-webkit-scrollbar { width: 6px; }
                .scroll-body::-webkit-scrollbar-track { background: #000; }
                .scroll-body::-webkit-scrollbar-thumb { background: #262626; border-radius: 3px; }
                .scroll-body::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }

                /* ===== MESSAGE ===== */
                .message-box {
                    padding: 12px 16px;
                    margin-bottom: 18px;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    animation: fadeIn 0.3s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .message-success {
                    background: rgba(70, 211, 105, 0.08);
                    border: 1px solid rgba(70, 211, 105, 0.25);
                    color: #46d369;
                }

                .message-error {
                    background: rgba(229, 9, 20, 0.08);
                    border: 1px solid rgba(229, 9, 20, 0.25);
                    color: #ff5252;
                }

                /* ===== MAIN GRID ===== */
                .content-wrapper {
                    display: grid;
                    grid-template-columns: minmax(300px, 380px) 1fr;
                    gap: 16px;
                    align-items: start;
                }

                /* ===== FORM ===== */
                .form-section {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 20px;
                }

                .form-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 18px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #1a1a1a;
                }

                .form-header-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    background: #e50914;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.85rem;
                    flex-shrink: 0;
                }

                .form-header h3 {
                    margin: 0;
                    font-size: 0.85rem;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                }

                .form-header p {
                    margin: 2px 0 0 0;
                    font-size: 0.65rem;
                    color: #666;
                    font-weight: 400;
                }

                .form-group { margin-bottom: 12px; }

                .form-group label {
                    display: block;
                    font-size: 0.6rem;
                    font-weight: 800;
                    color: #808080;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 10px 12px;
                    background: #000000;
                    border: 1px solid #1f1f1f;
                    border-radius: 4px;
                    color: #ffffff;
                    font-size: 0.85rem;
                    font-family: inherit;
                    transition: all 0.15s ease;
                    -webkit-appearance: none;
                    appearance: none;
                    height: 42px;
                }

                .form-group input:focus,
                .form-group select:focus {
                    border-color: #e50914;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.12);
                }

                .form-group input::placeholder { color: #4d4d4d; }

                .form-group select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23808080' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 34px;
                    cursor: pointer;
                }

                .form-group select option { background: #0d0d0d; color: #fff; }

                .duration-group {
                    display: flex;
                    gap: 8px;
                }

                .duration-group input { flex: 1; min-width: 0; }
                .duration-group select { flex: 0 0 110px; }

                .form-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: 16px;
                }

                .form-buttons button {
                    flex: 1;
                    padding: 12px 14px;
                    border: none;
                    border-radius: 4px;
                    font-weight: 900;
                    font-size: 0.7rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: inherit;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    height: 44px;
                }

                .submit-btn { background: #e50914; color: #ffffff; }
                .submit-btn:hover { background: #f6121d; }
                .submit-btn:active { transform: scale(0.98); }

                .cancel-btn {
                    background: transparent;
                    color: #b3b3b3;
                    border: 1px solid #333;
                }

                .cancel-btn:hover {
                    background: #141414;
                    color: #ffffff;
                    border-color: #666;
                }

                /* ===== TABLE SECTION ===== */
                .table-section {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 20px;
                    min-width: 0;
                }

                .table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .table-header h3 {
                    margin: 0;
                    font-size: 0.9rem;
                    font-weight: 900;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                }

                .count-badge {
                    background: #e50914;
                    color: #ffffff;
                    padding: 3px 10px;
                    border-radius: 3px;
                    font-size: 0.68rem;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                }

                .table-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    border-radius: 4px;
                    border: 1px solid #1a1a1a;
                }

                .table-wrapper::-webkit-scrollbar { height: 6px; }
                .table-wrapper::-webkit-scrollbar-track { background: #000; }
                .table-wrapper::-webkit-scrollbar-thumb { background: #262626; border-radius: 3px; }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.82rem;
                    min-width: 620px;
                }

                thead tr { background: #000000; }

                thead th {
                    padding: 11px 14px;
                    text-align: left;
                    font-weight: 900;
                    color: #666;
                    font-size: 0.62rem;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    white-space: nowrap;
                    border-bottom: 1px solid #1a1a1a;
                }

                tbody tr {
                    border-bottom: 1px solid #141414;
                    transition: background 0.15s ease;
                }

                tbody tr:last-child { border-bottom: none; }
                tbody tr:hover { background: #121212; }

                tbody td {
                    padding: 11px 14px;
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .pkg-name {
                    font-weight: 800;
                    color: #ffffff;
                    font-size: 0.85rem;
                    line-height: 1.3;
                }

                .pkg-desc {
                    font-size: 0.68rem;
                    color: #808080;
                    margin-top: 3px;
                }

                .price-value {
                    font-weight: 900;
                    color: #e50914;
                    font-size: 0.85rem;
                    white-space: nowrap;
                }

                .duration-cell {
                    color: #b3b3b3;
                    font-size: 0.78rem;
                    font-weight: 500;
                }

                .status-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 3px;
                    font-size: 0.62rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                }

                .status-active {
                    background: rgba(70, 211, 105, 0.12);
                    color: #46d369;
                }

                .status-inactive {
                    background: rgba(229, 9, 20, 0.12);
                    color: #ff5252;
                }

                .action-buttons {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .action-btn {
                    padding: 7px 12px;
                    border: 1px solid transparent;
                    border-radius: 4px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    white-space: nowrap;
                    font-family: inherit;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .edit-btn {
                    background: transparent;
                    color: #b3b3b3;
                    border-color: #262626;
                }

                .edit-btn:hover {
                    background: #141414;
                    color: #ffffff;
                    border-color: #404040;
                }

                .delete-btn {
                    background: rgba(229, 9, 20, 0.08);
                    color: #ff5252;
                    border-color: rgba(229, 9, 20, 0.2);
                }

                .delete-btn:hover {
                    background: #e50914;
                    color: #ffffff;
                    border-color: #e50914;
                }

                .catalog-count {
                    margin-top: 14px;
                    font-size: 0.65rem;
                    color: #666;
                    text-align: right;
                    font-weight: 700;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                }

                /* ===== EMPTY ===== */
                .empty-state {
                    text-align: center;
                    padding: 50px 20px;
                    color: #808080;
                }

                .empty-icon {
                    font-size: 2.6rem;
                    display: block;
                    margin-bottom: 12px;
                    opacity: 0.35;
                }

                .empty-state p {
                    font-size: 0.85rem;
                    margin: 0;
                    color: #b3b3b3;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }

                .empty-sub {
                    font-size: 0.72rem;
                    margin: 8px 0 0 0;
                    color: #666;
                    font-weight: 400;
                    text-transform: none;
                    letter-spacing: 0;
                }

                /* ============================================================
                   RESPONSIVE
                   ============================================================ */

                @media (max-width: 1100px) {
                    .content-wrapper { grid-template-columns: 1fr; }
                }

                @media (max-width: 900px) {
                    .sidebar {
                        position: fixed;
                        top: 0;
                        left: 0;
                        transform: translateX(-100%);
                        box-shadow: 6px 0 50px rgba(0, 0, 0, 0.9);
                    }
                    .sidebar.open { transform: translateX(0); }
                    .sidebar-overlay { display: block; }
                    .hamburger { display: block; }
                    .top-bar { padding: 12px 18px; height: 54px; }
                    .top-bar-title { font-size: 0.95rem; }
                    .scroll-body { padding: 18px 18px 36px; }
                }

                @media (max-width: 640px) {
                    .top-bar { padding: 10px 14px; height: 50px; }
                    .top-bar-title { font-size: 0.85rem; letter-spacing: 0.2px; }
                    .status-pill { font-size: 0.55rem; padding: 4px 8px; }
                    .scroll-body { padding: 14px 12px 32px; }

                    .message-box { padding: 10px 12px; font-size: 0.75rem; margin-bottom: 14px; }

                    .content-wrapper { gap: 12px; }

                    .form-section,
                    .table-section { padding: 16px; }

                    .form-header-icon { width: 28px; height: 28px; font-size: 0.75rem; }
                    .form-header h3 { font-size: 0.78rem; }
                    .form-header p { font-size: 0.6rem; }

                    .form-group input,
                    .form-group select { font-size: 0.82rem; height: 44px; }

                    .duration-group select { flex: 0 0 95px; }

                    .form-buttons { flex-direction: column; }
                    .form-buttons button { width: 100%; }

                    .table-header h3 { font-size: 0.82rem; }
                    .count-badge { font-size: 0.62rem; padding: 2px 8px; }

                    table { min-width: 520px; font-size: 0.75rem; }
                    thead th { padding: 9px 11px; font-size: 0.58rem; }
                    tbody td { padding: 9px 11px; }

                    .pkg-name { font-size: 0.78rem; }
                    .pkg-desc { font-size: 0.62rem; }
                    .price-value { font-size: 0.78rem; }
                    .duration-cell { font-size: 0.72rem; }

                    .action-buttons { flex-direction: column; gap: 4px; }
                    .action-btn { width: 100%; height: 36px; font-size: 0.6rem; }

                    .empty-state { padding: 40px 16px; }
                    .empty-icon { font-size: 2.2rem; }
                }

                @media (max-width: 400px) {
                    .top-bar { padding: 10px 12px; height: 48px; }
                    .top-bar-title { font-size: 0.8rem; }
                    .status-pill span:not(.status-dot) { display: none; }
                    .status-pill { padding: 5px 8px; }

                    .scroll-body { padding: 12px 10px 28px; }
                    .form-section, .table-section { padding: 14px; }

                    table { min-width: 460px; }
                    thead th { padding: 8px 10px; font-size: 0.55rem; }
                    tbody td { padding: 8px 10px; font-size: 0.7rem; }
                }

                @media (hover: none) {
                    .submit-btn:hover { transform: none; }
                    .edit-btn:hover, .delete-btn:hover { transform: none; }
                }
            `}</style>

            {/* Overlay */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* ===== SIDEBAR ===== */}
            <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">▶</div>
                    <div className="sidebar-brand-text">
                        <h2>Net Kitonga</h2>
                        <p>Internet Supply Co.</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <p className="nav-section-label">Main</p>
                    {navItems.slice(0, 1).map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`nav-item ${location.pathname === item.to ? "active" : ""}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">
                                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</span>
                            </span>
                            {item.label}
                        </Link>
                    ))}

                    <p className="nav-section-label">Operations</p>
                    {navItems.slice(1, 6).map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`nav-item ${location.pathname === item.to ? "active" : ""}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">
                                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</span>
                            </span>
                            {item.label}
                        </Link>
                    ))}

                    <p className="nav-section-label">Management</p>
                    {navItems.slice(6).map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`nav-item ${location.pathname === item.to ? "active" : ""}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="nav-icon">
                                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</span>
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">
                            {user?.business_name ? user.business_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="sidebar-user-info">
                            <p>{user?.business_name || "Guest"}</p>
                            <span>Provider</span>
                        </div>
                    </div>
                    <button type="button" className="sidebar-logout" onClick={logout}>
                        Logout
                    </button>
                    <p style={{ margin: '8px 0 0', fontSize: '0.6rem', color: '#4d4d4d', textAlign: 'center', letterSpacing: '0.5px' }}>fontwandell co tz 2026</p>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <div className="main-wrapper">
                {/* Slim Header */}
                <div className="top-bar">
                    <div className="top-bar-left">
                        <button
                            className="hamburger"
                            onClick={() => setSidebarOpen((prev) => !prev)}
                        >
                            ☰
                        </button>
                        <h1 className="top-bar-title">
                            Packages <span>Configuration</span>
                        </h1>
                    </div>
                    <div className="top-bar-right">
                        <div className="status-pill">
                            <span className="status-dot"></span>
                            <span>Active</span>
                        </div>
                    </div>
                </div>

                {/* Scroll Body */}
                <div className="scroll-body">
                    {uiMessage && (
                        <div className={`message-box ${uiMessage.includes("Failed") || uiMessage.includes("Communication") || uiMessage.includes("failed") ? "message-error" : "message-success"}`}>
                            {uiMessage}
                        </div>
                    )}

                    <div className="content-wrapper">
                        {/* FORM */}
                        <form onSubmit={handleSubmitForm} className="form-section">
                            <div className="form-header">
                                <div className="form-header-icon">
                                    {editingPackageId ? "✏️" : "➕"}
                                </div>
                                <div>
                                    <h3>{editingPackageId ? "Edit Package" : "New Package"}</h3>
                                    <p>{editingPackageId ? "Update configuration" : "Create a hotspot bundle"}</p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Package Name</label>
                                <input
                                    type="text"
                                    required
                                    value={packageName}
                                    onChange={(e) => setPackageName(e.target.value)}
                                    placeholder="e.g., Basic Plan"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Short marketing text"
                                />
                            </div>

                            <div className="form-group">
                                <label>Price (TZS)</label>
                                <input
                                    type="number"
                                    required
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
                                />
                            </div>

                            <div className="form-group">
                                <label>Access Duration</label>
                                <div className="duration-group">
                                    <input
                                        type="number"
                                        required
                                        value={durationValue}
                                        onChange={(e) => setDurationValue(e.target.value)}
                                        placeholder="1"
                                    />
                                    <select
                                        value={durationUnit}
                                        onChange={(e) => setDurationUnit(e.target.value)}
                                    >
                                        <option value="hours">Hours</option>
                                        <option value="days">Days</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Data Limit</label>
                                <select
                                    value={dataQuotaGb}
                                    onChange={(e) => setDataQuotaGb(e.target.value)}
                                >
                                    <option value="0">Unlimited</option>
                                    <option value="1">1 GB</option>
                                    <option value="5">5 GB</option>
                                    <option value="10">10 GB</option>
                                    <option value="20">20 GB</option>
                                    <option value="50">50 GB</option>
                                    <option value="100">100 GB</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Speed Limit</label>
                                <input
                                    type="text"
                                    value={mikrotikRateLimit}
                                    onChange={(e) => setMikrotikRateLimit(e.target.value)}
                                    placeholder="e.g., 5M/2M"
                                />
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={statusToggle}
                                    onChange={(e) => setStatusToggle(e.target.value)}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="form-buttons">
                                <button type="submit" className="submit-btn">
                                    {editingPackageId ? "Update" : "Create"}
                                </button>
                                {editingPackageId && (
                                    <button
                                        type="button"
                                        onClick={clearFormFields}
                                        className="cancel-btn"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* TABLE */}
                        <div className="table-section">
                            <div className="table-header">
                                <h3>
                                    Package Catalog
                                    <span className="count-badge">{catalogList.length}</span>
                                </h3>
                            </div>

                            {catalogList.length === 0 ? (
                                <div className="empty-state">
                                    <span className="empty-icon">📦</span>
                                    <p>No packages found</p>
                                    <div className="empty-sub">Create your first bundle above</div>
                                </div>
                            ) : (
                                <>
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Package</th>
                                                    <th>Price</th>
                                                    <th>Duration</th>
                                                    <th>Data</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {catalogList.map((pkg) => (
                                                    <tr key={pkg.id}>
                                                        <td>
                                                            <div className="pkg-name">{pkg.package_name}</div>
                                                            {pkg.description && <div className="pkg-desc">{pkg.description}</div>}
                                                        </td>
                                                        <td>
                                                            <span className="price-value">TZS {Number(pkg.price).toLocaleString()}</span>
                                                        </td>
                                                        <td className="duration-cell">{formatDuration(pkg.duration_seconds)}</td>
                                                        <td className="duration-cell">{formatBytes(pkg.data_quota_bytes)}</td>
                                                        <td>
                                                            <span className={`status-badge status-${pkg.status}`}>
                                                                {pkg.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="action-buttons">
                                                                <button
                                                                    onClick={() => startEditing(pkg)}
                                                                    className="action-btn edit-btn"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePackage(pkg.id)}
                                                                    className="action-btn delete-btn"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="catalog-count">
                                        {catalogList.length} package{catalogList.length !== 1 ? 's' : ''} in catalog
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PackagesDashboard;