import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";

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
    });
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const user = JSON.parse(localStorage.getItem("tenantUser") || "null");

    const logout = () => {
        localStorage.removeItem("tenantUser");
        navigate("/");
    };

    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
        { to: "/income", label: "Revenue", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.79.72 1.49 1.97 1.49 1.28 0 1.72-.68 1.72-1.36 0-.83-.44-1.28-1.72-1.7-1.84-.58-3.67-1.13-3.67-3.44 0-1.71 1.24-2.83 2.83-3.21V4.5h2.67v1.94c1.66.36 2.77 1.5 2.88 3.09h-1.96c-.1-.79-.68-1.42-1.86-1.42-1.06 0-1.66.55-1.66 1.28 0 .74.55 1.13 1.72 1.53 1.86.6 3.67 1.19 3.67 3.55 0 1.79-1.24 2.94-2.87 3.62z" },
        { to: "/routers", label: "Routers", icon: "M12 21l-3-4h6l-3 4zm-6.36-6.36l1.41-1.41C8.66 11.62 10.24 11 12 11s3.34.62 4.95 2.23l1.41-1.41C16.37 9.83 14.28 9 12 9s-4.37.83-6.36 2.82zM2.93 11.93l1.41-1.41C6.31 8.55 9.02 7.5 12 7.5s5.69 1.05 7.66 3.02l1.41-1.41C18.66 6.7 15.49 5.5 12 5.5S5.34 6.7 2.93 9.09v2.84z" },
        { to: "/packages", label: "Packages", icon: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
        { to: "/vouchers", label: "Vouchers", icon: "M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 5.5h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2z" },
        { to: "/payments", label: "Payments", icon: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" },
        { to: "/withdrawals", label: "Withdrawals", icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" },
        { to: "/sessions", label: "Sessions", icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" },
        { to: "/customers", label: "Customers", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
        { to: "/branch", label: "Branches", icon: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" },
        { to: "/portal", label: "Portal", icon: "M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
        { to: "/settings", label: "Settings", icon: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" },
    ];

    const getTenantId = () => {
        const u = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return u.id || 1;
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");
        const tenantId = getTenantId();
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/payments/income/stats?tenant_id=${tenantId}`),
                fetch(`${API_BASE_URL}/api/payments/history?tenant_id=${tenantId}`),
            ]);

            if (!statsRes.ok) throw new Error("Failed to load income stats");
            if (!historyRes.ok) throw new Error("Failed to load payment history");

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
        { label: "Total Revenue", value: fmt(stats.completed_total), color: "#46d369", icon: "💰" },
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
                    overflow: hidden;
                    height: 100%;
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
                                <svg viewBox="0 0 24 24"><path d={item.icon} /></svg>
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
                                <svg viewBox="0 0 24 24"><path d={item.icon} /></svg>
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
                                <svg viewBox="0 0 24 24"><path d={item.icon} /></svg>
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