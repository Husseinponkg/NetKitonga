import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function Settings() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentUser = getStoredTenantUser();
    const [form, setForm] = useState({ business_name: "", system_name: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const tenantId = getTenantId();
                if (!tenantId) {
                    setMessage("Tenant session is missing. Please login again.");
                    setLoading(false);
                    return;
                }
                const url = `${API_BASE_URL}/settings?tenant_id=${encodeURIComponent(tenantId)}&_ts=${Date.now()}`;
                const response = await fetch(url);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail || data.message || {});
                    throw new Error(detail || "Could not load settings.");
                }
                setForm({ ...data, password: "" });
                setMessage("");
            } catch (error) {
                console.error("Failed to load settings:", error);
                setMessage(error.message || "Could not load settings.");
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setSaving(true);

        const tenantId = getTenantId();
        if (!tenantId) {
            setMessage("Tenant session is missing. Please login again.");
            setSaving(false);
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenant_id: tenantId, ...form }),
            });
            const result = await response.json();
            if (!response.ok) {
                const detail = typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail || result.message || {});
                throw new Error(detail || "Could not save settings.");
            }
            
            localStorage.setItem("tenantUser", JSON.stringify({ 
                ...currentUser, 
                business_name: form.business_name, 
                email: form.email 
            }));
            
            setForm({ ...form, password: "" });
            setMessage(result.message || "Settings saved successfully!");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-root">
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

                .settings-root {
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

                /* ===== CONTAINER ===== */
                .settings-container {
                    max-width: 640px;
                    width: 100%;
                    margin: 0 auto;
                }

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

                .message-loading {
                    background: rgba(70, 211, 105, 0.08);
                    border: 1px solid rgba(70, 211, 105, 0.2);
                    color: #46d369;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* ===== CARD ===== */
                .settings-card {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 24px;
                }

                .settings-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    padding-bottom: 14px;
                    border-bottom: 1px solid #1a1a1a;
                }

                .settings-header-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 4px;
                    background: #e50914;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.9rem;
                    flex-shrink: 0;
                }

                .settings-header h2 {
                    margin: 0;
                    font-size: 0.9rem;
                    font-weight: 900;
                    color: #ffffff;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                }

                .settings-header p {
                    margin: 2px 0 0 0;
                    font-size: 0.65rem;
                    color: #666;
                    font-weight: 400;
                }

                /* ===== FORM ===== */
                .form-group { margin-bottom: 16px; }

                .form-group label {
                    display: block;
                    font-size: 0.6rem;
                    font-weight: 800;
                    color: #808080;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                }

                .form-group label .required { color: #e50914; margin-left: 3px; }

                .form-group input {
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

                .form-group input:focus {
                    border-color: #e50914;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.12);
                }

                .form-group input::placeholder { color: #4d4d4d; }

                .form-hint {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 6px;
                    font-size: 0.65rem;
                    color: #666;
                    font-weight: 500;
                }

                /* ===== ACTIONS ===== */
                .form-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 22px;
                }

                .form-actions button {
                    flex: 1;
                    padding: 12px 14px;
                    border: none;
                    border-radius: 4px;
                    font-weight: 900;
                    font-size: 0.7rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: inherit;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    height: 44px;
                }

                .submit-btn {
                    background: #e50914;
                    color: #ffffff;
                }

                .submit-btn:hover:not(:disabled) { background: #f6121d; }
                .submit-btn:active:not(:disabled) { transform: scale(0.98); }

                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .submit-btn .spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .reset-btn {
                    background: transparent;
                    color: #b3b3b3;
                    border: 1px solid #333;
                }

                .reset-btn:hover:not(:disabled) {
                    background: #141414;
                    color: #ffffff;
                    border-color: #666;
                }

                .reset-btn:active:not(:disabled) { transform: scale(0.97); }

                .reset-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* ===== INFO BOX ===== */
                .info-box {
                    background: #000000;
                    border: 1px solid #1a1a1a;
                    border-radius: 4px;
                    padding: 12px 14px;
                    margin-top: 18px;
                }

                .info-box p {
                    margin: 0;
                    font-size: 0.7rem;
                    color: #808080;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    line-height: 1.5;
                    font-family: 'SF Mono', 'Monaco', monospace;
                }

                .info-box .info-icon {
                    font-size: 1em;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .info-box strong {
                    color: #b3b3b3;
                    font-weight: 800;
                    text-transform: uppercase;
                    font-size: 0.62rem;
                    letter-spacing: 0.8px;
                }

                /* ============================================================
                   RESPONSIVE
                   ============================================================ */

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

                    .settings-card { padding: 18px; }

                    .settings-header-icon { width: 30px; height: 30px; font-size: 0.8rem; }
                    .settings-header h2 { font-size: 0.82rem; }
                    .settings-header p { font-size: 0.6rem; }

                    .form-group input { font-size: 0.82rem; height: 44px; }

                    .form-actions { flex-direction: column; }
                    .form-actions button { width: 100%; }

                    .info-box p {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 4px;
                    }
                }

                @media (max-width: 400px) {
                    .top-bar { padding: 10px 12px; height: 48px; }
                    .top-bar-title { font-size: 0.8rem; }
                    .status-pill span:not(.status-dot) { display: none; }
                    .status-pill { padding: 5px 8px; }

                    .scroll-body { padding: 12px 10px 28px; }
                    .settings-card { padding: 16px; }

                    .form-group input { font-size: 0.8rem; height: 44px; }
                    .form-actions button { height: 46px; font-size: 0.68rem; }
                }

                @media (hover: none) {
                    .submit-btn:hover:not(:disabled) { transform: none; }
                    .reset-btn:hover:not(:disabled) { transform: none; }
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
                            {currentUser?.business_name ? currentUser.business_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="sidebar-user-info">
                            <p>{currentUser?.business_name || "Guest"}</p>
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
                            Settings <span>Configuration</span>
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
                    <div className="settings-container">
                        {message && (
                            <div className={`message-box ${message.includes("successfully") || message.includes("saved") ? "message-success" : "message-error"}`}>
                                {message.includes("successfully") || message.includes("saved") ? "✓" : "⚠"} {message}
                            </div>
                        )}

                        {loading && !message && (
                            <div className="message-box message-loading">
                                ⏳ Loading settings...
                            </div>
                        )}

                        {!loading && (
                            <div className="settings-card">
                                <div className="settings-header">
                                    <div className="settings-header-icon">🏢</div>
                                    <div>
                                        <h2>Business Configuration</h2>
                                        <p>Update your business and system preferences</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    <div className="form-group">
                                        <label>
                                            Business Name
                                            <span className="required">*</span>
                                        </label>
                                        <input
                                            required
                                            name="business_name"
                                            value={form.business_name}
                                            onChange={handleChange}
                                            placeholder="e.g., ABC Internet Services"
                                            autoComplete="organization"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            System Name
                                            <span className="required">*</span>
                                        </label>
                                        <input
                                            required
                                            name="system_name"
                                            value={form.system_name}
                                            onChange={handleChange}
                                            placeholder="e.g., Hotspot Management System"
                                            autoComplete="off"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Email Address
                                            <span className="required">*</span>
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="admin@yourbusiness.com"
                                            autoComplete="email"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Leave blank to keep current password"
                                            autoComplete="new-password"
                                        />
                                        <span className="form-hint">
                                            🔒 Enter a new password only if you want to change it
                                        </span>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="submit-btn"
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <>
                                                    <span className="spinner"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>💾 Save Settings</>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setForm({ ...form, password: "" });
                                                setMessage("");
                                            }}
                                            className="reset-btn"
                                            disabled={saving}
                                        >
                                            Clear Password
                                        </button>
                                    </div>
                                </form>

                                <div className="info-box">
                                    <p>
                                        <span className="info-icon">ℹ</span>
                                        <span>
                                            <strong>Tenant ID:</strong> {currentUser.id || 1} · <strong>Role:</strong> {currentUser.role || 'Admin'}
                                            {form.business_name && ` · ${form.business_name}`}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;