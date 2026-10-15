import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function Sessions() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = getStoredTenantUser();
    const tenantId = getTenantId();
    const [sessions, setSessions] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [terminatingId, setTerminatingId] = useState(null);

    const currentUser = getStoredTenantUser();

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

    const loadSessions = async () => {
        try {
            setLoading(true);
            if (!tenantId) {
                setSessions([]);
                setMessage("Tenant session is missing. Please login again.");
                setLoading(false);
                return;
            }
            const response = await fetch(`${API_BASE_URL}/sessions/active?tenant_id=${tenantId}`);
            if (!response.ok) throw new Error("Could not load active sessions.");
            setSessions(await response.json());
            setMessage("");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    const terminate = async (sessionId) => {
        if (!window.confirm("Are you sure you want to terminate this session?")) return;
        
        try {
            setTerminatingId(sessionId);
            if (!tenantId) {
                setMessage("Tenant session is missing. Please login again.");
                setTerminatingId(null);
                return;
            }
            const response = await fetch(`${API_BASE_URL}/sessions/terminate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenant_id: tenantId, session_id: sessionId }),
            });
            const result = await response.json();
            if (!response.ok) {
                const detail = typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail || result.message || {});
                throw new Error(detail || "Could not terminate session.");
            }
            setMessage(result.message || "Session terminated successfully!");
            loadSessions();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setTerminatingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSessionDuration = (startTime) => {
        if (!startTime) return 'N/A';
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    const isExpiringSoon = (expirationTime) => {
        if (!expirationTime) return false;
        const exp = new Date(expirationTime);
        const now = new Date();
        const diffMs = exp - now;
        const diffMins = diffMs / 60000;
        return diffMins > 0 && diffMins < 15;
    };

    const isExpired = (expirationTime) => {
        if (!expirationTime) return false;
        const exp = new Date(expirationTime);
        const now = new Date();
        return exp < now;
    };

    return (
        <div className="sessions-root">
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

                .sessions-root {
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

                /* ===== HEADER ACTIONS ===== */
                .header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .session-count {
                    font-size: 0.75rem;
                    color: #808080;
                    font-weight: 700;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .session-count strong {
                    color: #ffffff;
                    font-weight: 900;
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

                .refresh-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: transparent;
                    border: 1px solid #262626;
                    border-radius: 4px;
                    color: #b3b3b3;
                    font-weight: 900;
                    font-size: 0.65rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: inherit;
                    letter-spacing: 1.1px;
                    text-transform: uppercase;
                    height: 40px;
                }

                .refresh-btn:hover:not(:disabled) {
                    background: #141414;
                    color: #ffffff;
                    border-color: #404040;
                }

                .refresh-btn:active:not(:disabled) {
                    transform: scale(0.97);
                }

                .refresh-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .refresh-btn .spinner {
                    display: inline-block;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* ===== TABLE ===== */
                .table-section {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 20px;
                    min-width: 0;
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
                    min-width: 720px;
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
                    animation: fadeIn 0.3s ease-out;
                }

                tbody tr:last-child { border-bottom: none; }
                tbody tr:hover { background: #121212; }

                tbody td {
                    padding: 11px 14px;
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .device-mac {
                    font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
                    font-size: 0.72rem;
                    color: #b3b3b3;
                    font-weight: 600;
                }

                .device-label {
                    font-size: 0.58rem;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    margin-top: 3px;
                    font-weight: 700;
                }

                .ip-address {
                    font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
                    font-size: 0.72rem;
                    color: #808080;
                }

                .router-name {
                    font-weight: 700;
                    color: #ffffff;
                }

                .time-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .time-main {
                    font-size: 0.72rem;
                    color: #b3b3b3;
                    font-family: 'SF Mono', 'Monaco', monospace;
                    white-space: nowrap;
                }

                .time-detail {
                    font-size: 0.6rem;
                    color: #666;
                }

                .duration-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 3px;
                    font-size: 0.6rem;
                    font-weight: 900;
                    background: #141414;
                    color: #b3b3b3;
                    border: 1px solid #1f1f1f;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                .expiry-warning { color: #fbc02d !important; }
                .expiry-danger { color: #ff5252 !important; }

                .terminate-btn {
                    padding: 8px 14px;
                    border-radius: 4px;
                    font-size: 0.62rem;
                    font-weight: 900;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: inherit;
                    background: rgba(229, 9, 20, 0.08);
                    color: #ff5252;
                    border: 1px solid rgba(229, 9, 20, 0.2);
                    white-space: nowrap;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    height: 36px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .terminate-btn:hover:not(:disabled) {
                    background: #e50914;
                    color: #ffffff;
                    border-color: #e50914;
                }

                .terminate-btn:active:not(:disabled) {
                    transform: scale(0.96);
                }

                .terminate-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .loading-spinner {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 2px solid rgba(255, 255, 255, 0.15);
                    border-top: 2px solid #ff5252;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                /* ===== EMPTY ===== */
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #808080;
                }

                .empty-state .empty-icon {
                    font-size: 2.6rem;
                    margin-bottom: 12px;
                    display: block;
                    opacity: 0.35;
                }

                .empty-state p {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #b3b3b3;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }

                .empty-state .sub-text {
                    margin-top: 8px;
                    font-size: 0.72rem;
                    color: #666;
                    font-weight: 400;
                    text-transform: none;
                    letter-spacing: 0;
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

                    .header-actions { flex-direction: column; align-items: stretch; }
                    .refresh-btn { justify-content: center; }
                    .session-count { font-size: 0.68rem; }

                    .table-section { padding: 16px; }

                    table { min-width: 620px; font-size: 0.75rem; }
                    thead th { padding: 9px 11px; font-size: 0.58rem; }
                    tbody td { padding: 9px 11px; }

                    .device-mac { font-size: 0.65rem; }
                    .ip-address { font-size: 0.65rem; }
                    .time-main { font-size: 0.65rem; }
                    .duration-badge { font-size: 0.55rem; padding: 1px 6px; }
                    .terminate-btn { height: 40px; font-size: 0.58rem; padding: 6px 12px; }

                    .empty-state { padding: 40px 16px; }
                    .empty-state .empty-icon { font-size: 2.2rem; }
                }

                @media (max-width: 400px) {
                    .top-bar { padding: 10px 12px; height: 48px; }
                    .top-bar-title { font-size: 0.8rem; }
                    .status-pill span:not(.status-dot) { display: none; }
                    .status-pill { padding: 5px 8px; }

                    .scroll-body { padding: 12px 10px 28px; }
                    .table-section { padding: 14px; }

                    table { min-width: 560px; }
                    thead th { padding: 8px 10px; font-size: 0.55rem; }
                    tbody td { padding: 8px 10px; font-size: 0.7rem; }
                }

                @media (hover: none) {
                    tbody tr:hover { background: transparent; }
                    .terminate-btn:hover:not(:disabled) {
                        background: rgba(229, 9, 20, 0.08);
                        color: #ff5252;
                        border-color: rgba(229, 9, 20, 0.2);
                    }
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
                            Active <span>Sessions</span>
                        </h1>
                    </div>
                    <div className="top-bar-right">
                        <div className="status-pill">
                            <span className="status-dot"></span>
                            <span>Live</span>
                        </div>
                    </div>
                </div>

                {/* Scroll Body */}
                <div className="scroll-body">
                    {message && (
                        <div className={`message-box ${message.includes("successfully") || message.includes("terminated") ? "message-success" : "message-error"}`}>
                            {message}
                        </div>
                    )}

                    <div className="header-actions">
                        <span className="session-count">
                            <strong>{sessions.length}</strong> active session{sessions.length !== 1 ? 's' : ''}
                            <span className="count-badge">{sessions.length}</span>
                        </span>
                        <button
                            type="button"
                            onClick={loadSessions}
                            className="refresh-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner">⟳</span> Loading...
                                </>
                            ) : (
                                <>Refresh</>
                            )}
                        </button>
                    </div>

                    <div className="table-section">
                        {loading && sessions.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">⏳</span>
                                <p>Loading active sessions</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">🟢</span>
                                <p>No active sessions</p>
                                <div className="sub-text">All users are currently offline</div>
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Device</th>
                                            <th>IP Address</th>
                                            <th>Router</th>
                                            <th>Started</th>
                                            <th>Expires</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.map((session) => {
                                            const expiringSoon = isExpiringSoon(session.expiration_time);
                                            const expired = isExpired(session.expiration_time);
                                            const duration = getSessionDuration(session.start_time);
                                            
                                            return (
                                                <tr key={session.session_id}>
                                                    <td>
                                                        <div>
                                                            <div className="device-mac">{session.buyer_mac || 'N/A'}</div>
                                                            {session.device_name && (
                                                                <div className="device-label">{session.device_name}</div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="ip-address">{session.assigned_ip || 'N/A'}</span>
                                                    </td>
                                                    <td>
                                                        <span className="router-name">{session.router_name || session.router_id || 'N/A'}</span>
                                                    </td>
                                                    <td>
                                                        <div className="time-info">
                                                            <span className="time-main">{formatDate(session.start_time)}</span>
                                                            <span className="time-detail">
                                                                <span className="duration-badge">{duration}</span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="time-info">
                                                            <span className={`time-main ${expired ? 'expiry-danger' : expiringSoon ? 'expiry-warning' : ''}`}>
                                                                {formatDate(session.expiration_time)}
                                                            </span>
                                                            {expired && (
                                                                <span className="time-detail expiry-danger">⚠ Expired</span>
                                                            )}
                                                            {expiringSoon && !expired && (
                                                                <span className="time-detail expiry-warning">⏳ Expiring soon</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            onClick={() => terminate(session.session_id)}
                                                            className="terminate-btn"
                                                            disabled={terminatingId === session.session_id}
                                                        >
                                                            {terminatingId === session.session_id ? (
                                                                <span className="loading-spinner"></span>
                                                            ) : (
                                                                'Terminate'
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Sessions;