import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function Income() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [stats, setStats] = useState({
        completed_count: 0,
        completed_total: 0,
        pending_count: 0,
        pending_total: 0,
        failed_count: 0,
        failed_total: 0,
        total_count: 0,
        total_amount: 0,
        voucher_completed_count: 0,
        voucher_completed_total: 0,
        azampay_completed_count: 0,
        azampay_completed_total: 0,
    });
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    const fetchData = async () => {
        setLoading(true);
        setError("");
        const tenantId = getSessionTenantId();
        if (!tenantId) {
            setLoading(false);
            setError("Tenant session is missing. Please login again.");
            return;
        }
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch(`${API_BASE_URL}/payments/income/stats?tenant_id=${tenantId}`),
                fetch(`${API_BASE_URL}/payments/history?tenant_id=${tenantId}`),
            ]);

            if (!statsRes.ok) {
                const text = await statsRes.text();
                throw new Error(`Failed to load income stats: ${statsRes.status} ${text}`);
            }
            if (!historyRes.ok) {
                const text = await historyRes.text();
                throw new Error(`Failed to load payment history: ${historyRes.status} ${text}`);
            }

            const statsData = await statsRes.json();
            setStats(statsData);

            const historyData = await historyRes.json();
            setPayments(Array.isArray(historyData) ? historyData : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fmt = (n) =>
        new Intl.NumberFormat("en-TZ", {
            style: "currency",
            currency: "TZS",
            minimumFractionDigits: 0,
        }).format(n || 0);

    const statCards = [
        { label: "Combined Income", value: fmt(stats.completed_total), color: "#46d369", icon: "💰" },
        { label: "Mobile Money Income", value: fmt(stats.azampay_completed_total), color: "#e50914", icon: "📱" },
        { label: "Voucher Income", value: fmt(stats.voucher_completed_total), color: "#fbc02d", icon: "🎟️" },
        { label: "Completed", value: `${stats.completed_count}`, color: "#46d369", icon: "✓" },
        { label: "Pending", value: `${stats.pending_count}`, color: "#fbc02d", icon: "⏳" },
        { label: "Failed", value: `${stats.failed_count}`, color: "#ff5252", icon: "✕" },
        { label: "All Transactions", value: stats.total_count, color: "#b3b3b3", icon: "📊" },
    ];

    return (
        <div className="income-root">
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

                .income-root {
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

                /* ===== ERROR ===== */
                .error-box {
                    padding: 12px 16px;
                    border-radius: 4px;
                    background: rgba(229, 9, 20, 0.08);
                    color: #ff5252;
                    border: 1px solid rgba(229, 9, 20, 0.25);
                    margin-bottom: 18px;
                    font-weight: 700;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                /* ===== LOADING ===== */
                .loading-box {
                    text-align: center;
                    padding: 60px 20px;
                    color: #808080;
                    font-size: 0.9rem;
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .spinner {
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(229, 9, 20, 0.15);
                    border-top-color: #e50914;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 14px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* ===== STATS ===== */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 12px;
                    margin-bottom: 22px;
                }

                .stat-card {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 18px 14px;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.22s ease;
                    min-height: 118px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    animation: fadeIn 0.5s ease-out;
                    animation-fill-mode: both;
                }

                .stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: #e50914;
                }

                .stat-card:hover {
                    transform: translateY(-3px);
                    border-color: #262626;
                }

                .stat-icon {
                    font-size: 1.5rem;
                    margin-bottom: 6px;
                    line-height: 1;
                }

                .stat-label {
                    font-size: 0.6rem;
                    color: #808080;
                    font-weight: 800;
                    margin-bottom: 6px;
                    letter-spacing: 1.1px;
                    text-transform: uppercase;
                }

                .stat-value {
                    font-size: 1.35rem;
                    font-weight: 900;
                    line-height: 1.2;
                    letter-spacing: -0.5px;
                    word-break: break-word;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .stats-grid > div:nth-child(1) { animation-delay: 0.05s; }
                .stats-grid > div:nth-child(2) { animation-delay: 0.10s; }
                .stats-grid > div:nth-child(3) { animation-delay: 0.15s; }
                .stats-grid > div:nth-child(4) { animation-delay: 0.20s; }
                .stats-grid > div:nth-child(5) { animation-delay: 0.25s; }

                /* ===== TABLE ===== */
                .table-wrapper {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    overflow: hidden;
                }

                .table-header {
                    padding: 14px 18px;
                    border-bottom: 1px solid #1a1a1a;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
                    background: #0d0d0d;
                }

                .table-header h2 {
                    margin: 0;
                    font-size: 0.9rem;
                    color: #ffffff;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                }

                .count-badge {
                    background: #e50914;
                    color: white;
                    padding: 3px 10px;
                    border-radius: 3px;
                    font-size: 0.68rem;
                    font-weight: 900;
                    letter-spacing: 0.5px;
                }

                .table-scroll {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .table-scroll::-webkit-scrollbar { height: 6px; }
                .table-scroll::-webkit-scrollbar-track { background: #000; }
                .table-scroll::-webkit-scrollbar-thumb { background: #262626; border-radius: 3px; }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.82rem;
                    min-width: 640px;
                }

                thead {
                    background: #000000;
                }

                thead th {
                    padding: 11px 16px;
                    text-align: left;
                    font-weight: 900;
                    color: #666;
                    font-size: 0.62rem;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                    border-bottom: 1px solid #1a1a1a;
                    white-space: nowrap;
                }

                tbody tr {
                    border-bottom: 1px solid #141414;
                    transition: background 0.15s ease;
                }

                tbody tr:last-child { border-bottom: none; }
                tbody tr:hover { background: #121212; }

                tbody td {
                    padding: 11px 16px;
                    color: #e5e5e5;
                    vertical-align: middle;
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

                .status-completed {
                    background: rgba(70, 211, 105, 0.12);
                    color: #46d369;
                }

                .status-pending {
                    background: rgba(251, 192, 45, 0.12);
                    color: #fbc02d;
                }

                .status-failed {
                    background: rgba(229, 9, 20, 0.12);
                    color: #ff5252;
                }

                .ref-code {
                    font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
                    font-size: 0.68rem;
                    background: #141414;
                    padding: 3px 8px;
                    border-radius: 3px;
                    display: inline-block;
                    font-weight: 500;
                    color: #b3b3b3;
                    border: 1px solid #1f1f1f;
                }

                .id-cell {
                    font-weight: 900;
                    color: #e50914;
                }

                .amount-cell {
                    font-weight: 700;
                }

                .muted-cell {
                    font-size: 0.72rem;
                    color: #808080;
                    font-family: 'SF Mono', 'Monaco', monospace;
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

                .empty-state p:last-child {
                    font-size: 0.72rem;
                    opacity: 0.7;
                    margin-top: 8px;
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

                    .error-box { padding: 10px 12px; font-size: 0.75rem; margin-bottom: 14px; }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin-bottom: 16px;
                    }

                    .stat-card {
                        min-height: 100px;
                        padding: 14px 10px;
                    }

                    .stat-icon { font-size: 1.3rem; }
                    .stat-value { font-size: 1.1rem; }
                    .stat-label { font-size: 0.56rem; }

                    .table-header { padding: 12px 14px; }
                    .table-header h2 { font-size: 0.82rem; }
                    .count-badge { font-size: 0.62rem; padding: 2px 8px; }

                    thead th { padding: 9px 12px; font-size: 0.58rem; }
                    tbody td { padding: 9px 12px; font-size: 0.75rem; }

                    .ref-code { font-size: 0.6rem; padding: 2px 6px; }
                    .status-badge { font-size: 0.58rem; padding: 2px 8px; }
                    .muted-cell { font-size: 0.65rem; }

                    .loading-box { padding: 40px 16px; font-size: 0.82rem; }
                }

                @media (max-width: 400px) {
                    .top-bar { padding: 10px 12px; height: 48px; }
                    .top-bar-title { font-size: 0.8rem; }
                    .status-pill span:not(.status-dot) { display: none; }
                    .status-pill { padding: 5px 8px; }

                    .scroll-body { padding: 12px 10px 28px; }

                    .stats-grid { gap: 8px; }
                    .stat-card { min-height: 88px; padding: 12px 8px; }
                    .stat-icon { font-size: 1.15rem; }
                    .stat-value { font-size: 1rem; }
                    .stat-label { font-size: 0.52rem; }

                    table { min-width: 520px; }
                    thead th { padding: 8px 10px; font-size: 0.55rem; }
                    tbody td { padding: 8px 10px; font-size: 0.7rem; }
                }

                @media (hover: none) {
                    .stat-card:hover { transform: none; }
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
                            Income <span>Overview</span>
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
                    {error && (
                        <div className="error-box">
                            <span style={{ fontSize: "1rem" }}>⚠️</span>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-box">
                            <div className="spinner"></div>
                            <div>Loading income data...</div>
                            <div style={{ fontSize: "0.72rem", marginTop: "6px", opacity: 0.5 }}>
                                Fetching your revenue information
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="stats-grid">
                                {statCards.map((s, i) => (
                                    <div key={i} className="stat-card">
                                        <div className="stat-icon">{s.icon}</div>
                                        <div className="stat-label">{s.label}</div>
                                        <div className="stat-value" style={{ color: s.color }}>
                                            {s.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="table-wrapper">
                                <div className="table-header">
                                    <h2>
                                        Payment History
                                        <span className="count-badge">{payments.length}</span>
                                    </h2>
                                </div>
                                <div className="table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Reference</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>MAC</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6">
                                                        <div className="empty-state">
                                                            <span className="empty-icon">📭</span>
                                                            <p>No payments recorded yet</p>
                                                            <p>Transactions will appear here once processed</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                payments.map((p) => (
                                                    <tr key={p.id}>
                                                        <td className="id-cell">#{p.id}</td>
                                                        <td>
                                                            <span className="ref-code">{p.gateway_reference}</span>
                                                        </td>
                                                        <td className="amount-cell">{fmt(p.amount)}</td>
                                                        <td>
                                                            <span className={`status-badge status-${p.status}`}>
                                                                {p.status}
                                                            </span>
                                                        </td>
                                                        <td className="muted-cell">{p.buyer_mac}</td>
                                                        <td className="muted-cell">
                                                            {new Date(p.created_at).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Income;