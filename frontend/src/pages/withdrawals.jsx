import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function Withdrawals() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [wallet, setWallet] = useState({ total_earned: 0, total_withdrawn: 0, current_balance: 0 });
    const [incomeBreakdown, setIncomeBreakdown] = useState({ voucher_total: 0, mobile_money_total: 0 });
    const [withdrawals, setWithdrawals] = useState([]);
    const [amount, setAmount] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [provider, setProvider] = useState("Mpesa");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

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

    const fetchWallet = async () => {
        try {
            const tenantId = getSessionTenantId();
            if (!tenantId) {
                setWallet({ total_earned: 0, total_withdrawn: 0, current_balance: 0 });
                return;
            }
            const res = await fetch(`${API_BASE_URL}/withdrawals/balance?tenant_id=${tenantId}`);
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (err) {
            console.error("Error fetching wallet:", err);
        }
    };

    const fetchIncomeBreakdown = async () => {
        try {
            const tenantId = getSessionTenantId();
            if (!tenantId) {
                setIncomeBreakdown({ voucher_total: 0, mobile_money_total: 0 });
                return;
            }
            const res = await fetch(`${API_BASE_URL}/payments/income/stats?tenant_id=${tenantId}`);
            if (res.ok) {
                const data = await res.json();
                setIncomeBreakdown({
                    voucher_total: data.voucher_completed_total || 0,
                    mobile_money_total: data.azampay_completed_total || 0,
                });
            }
        } catch (err) {
            console.error("Error fetching income breakdown:", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const tenantId = getSessionTenantId();
            if (!tenantId) {
                setWithdrawals([]);
                return;
            }
            const res = await fetch(`${API_BASE_URL}/withdrawals/history?tenant_id=${tenantId}`);
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching withdrawals:", err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchWallet(), fetchIncomeBreakdown(), fetchHistory()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRequest = async (e) => {
        e.preventDefault();
        setMessage("");
        setSubmitting(true);

        const tenantId = getSessionTenantId();
        if (!tenantId) {
            setMessage("Tenant session is missing. Please login again.");
            setSubmitting(false);
            return;
        }

        const withdrawAmount = parseFloat(amount);
        if (!withdrawAmount || withdrawAmount <= 0) {
            setMessage("Enter a valid amount.");
            setSubmitting(false);
            return;
        }
        if (withdrawAmount > wallet.current_balance) {
            setMessage("Insufficient balance.");
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/withdrawals/request?tenant_id=${tenantId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: withdrawAmount,
                    mobile_money_number: mobileNumber.trim(),
                    payout_provider: provider
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("Withdrawal request submitted successfully!");
                setAmount("");
                setMobileNumber("");
                loadData();
            } else {
                setMessage(data.detail || "Withdrawal request failed.");
            }
        } catch (err) {
            setMessage("Could not communicate with server.");
        } finally {
            setSubmitting(false);
        }
    };

    const fmt = (n) =>
        new Intl.NumberFormat("en-TZ", {
            style: "currency",
            currency: "TZS",
            minimumFractionDigits: 0,
        }).format(n || 0);

    const getStatusClass = (s) => {
        if (s === "approved") return "status-approved";
        if (s === "rejected") return "status-rejected";
        return "status-pending-w";
    };

    return (
        <div className="withdrawals-root">
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

                .withdrawals-root {
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

                /* ===== LOADING ===== */
                .loading-box {
                    text-align: center;
                    padding: 60px 20px;
                    color: #808080;
                    font-size: 0.85rem;
                    font-weight: 700;
                    letter-spacing: 0.6px;
                    text-transform: uppercase;
                }

                .loading-icon {
                    font-size: 2rem;
                    margin-bottom: 12px;
                    display: block;
                }

                /* ===== STATS ===== */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 14px;
                    margin-bottom: 22px;
                }

                .stat-card {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 18px 16px;
                    text-align: center;
                    transition: all 0.22s ease;
                    position: relative;
                    overflow: hidden;
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

                .stat-card:nth-child(1) { animation-delay: 0.05s; }
                .stat-card:nth-child(2) { animation-delay: 0.10s; }
                .stat-card:nth-child(3) { animation-delay: 0.15s; }

                .stat-label {
                    font-size: 0.6rem;
                    font-weight: 800;
                    color: #808080;
                    text-transform: uppercase;
                    letter-spacing: 1.1px;
                    margin-bottom: 8px;
                }

                .stat-value {
                    font-size: 1.35rem;
                    font-weight: 900;
                    letter-spacing: -0.5px;
                    word-break: break-word;
                }

                .stat-value.earned { color: #e50914; }
                .stat-value.withdrawn { color: #b3b3b3; }
                .stat-value.balance { color: #46d369; }

                /* ===== CONTENT GRID ===== */
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

                .submit-btn {
                    width: 100%;
                    padding: 12px;
                    background: #e50914;
                    color: #ffffff;
                    border: none;
                    border-radius: 4px;
                    font-weight: 900;
                    font-size: 0.7rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    font-family: inherit;
                    margin-top: 8px;
                    letter-spacing: 1.2px;
                    text-transform: uppercase;
                    height: 44px;
                }

                .submit-btn:hover:not(:disabled) { background: #f6121d; }
                .submit-btn:active:not(:disabled) { transform: scale(0.98); }
                .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .submit-btn .spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-right: 8px;
                    vertical-align: middle;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* ===== HISTORY ===== */
                .history-section {
                    background: #0d0d0d;
                    border: 1px solid #1a1a1a;
                    border-radius: 6px;
                    padding: 20px;
                    min-width: 0;
                }

                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #1a1a1a;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .history-header h3 {
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

                .id-cell {
                    color: #808080;
                    font-size: 0.75rem;
                    font-family: 'SF Mono', 'Monaco', monospace;
                }

                .amount-highlight {
                    font-weight: 900;
                    color: #e50914;
                    white-space: nowrap;
                }

                .provider-cell {
                    color: #ffffff;
                    font-weight: 600;
                }

                .mobile-cell {
                    color: #808080;
                    font-size: 0.75rem;
                    font-family: 'SF Mono', 'Monaco', monospace;
                }

                .status-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 3px;
                    font-size: 0.6rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    white-space: nowrap;
                }

                .status-approved {
                    background: rgba(70, 211, 105, 0.12);
                    color: #46d369;
                }

                .status-rejected {
                    background: rgba(229, 9, 20, 0.12);
                    color: #ff5252;
                }

                .status-pending-w {
                    background: rgba(251, 192, 45, 0.12);
                    color: #fbc02d;
                }

                .date-text {
                    font-size: 0.7rem;
                    color: #808080;
                    white-space: nowrap;
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
                    margin: 0;
                    font-size: 0.85rem;
                    color: #b3b3b3;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }

                .empty-sub {
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

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin-bottom: 16px;
                    }

                    .stat-card { padding: 14px 10px; }
                    .stat-label { font-size: 0.56rem; margin-bottom: 6px; }
                    .stat-value { font-size: 1.05rem; }

                    .form-section,
                    .history-section { padding: 16px; }

                    .form-header-icon { width: 28px; height: 28px; font-size: 0.75rem; }
                    .form-header h3 { font-size: 0.78rem; }
                    .form-header p { font-size: 0.6rem; }

                    .form-group input,
                    .form-group select { font-size: 0.82rem; height: 44px; }
                    .submit-btn { height: 44px; font-size: 0.68rem; }

                    .history-header h3 { font-size: 0.82rem; }
                    .count-badge { font-size: 0.62rem; padding: 2px 8px; }

                    table { min-width: 520px; font-size: 0.75rem; }
                    thead th { padding: 9px 11px; font-size: 0.58rem; }
                    tbody td { padding: 9px 11px; }

                    .amount-highlight { font-size: 0.75rem; }
                    .mobile-cell { font-size: 0.68rem; }
                    .date-text { font-size: 0.62rem; }
                    .status-badge { font-size: 0.55rem; padding: 2px 8px; }

                    .empty-state { padding: 40px 16px; }
                    .empty-icon { font-size: 2.2rem; }
                }

                @media (max-width: 400px) {
                    .top-bar { padding: 10px 12px; height: 48px; }
                    .top-bar-title { font-size: 0.8rem; }
                    .status-pill span:not(.status-dot) { display: none; }
                    .status-pill { padding: 5px 8px; }

                    .scroll-body { padding: 12px 10px 28px; }
                    .form-section, .history-section { padding: 14px; }

                    .stats-grid { gap: 8px; }
                    .stat-card { padding: 12px 8px; }
                    .stat-value { font-size: 0.95rem; }

                    table { min-width: 460px; }
                    thead th { padding: 8px 10px; font-size: 0.55rem; }
                    tbody td { padding: 8px 10px; font-size: 0.7rem; }
                }

                @media (hover: none) {
                    .submit-btn:hover:not(:disabled) { transform: none; }
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
                        Withdraw
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
                            Withdrawals <span>Center</span>
                        </h1>
                    </div>
                    <div className="top-bar-right">
                        <div className="status-pill">
                            <span className="status-dot"></span>
                            <span>Online</span>
                        </div>
                    </div>
                </div>

                {/* Scroll Body */}
                <div className="scroll-body">
                    {message && (
                        <div className={`message-box ${message.includes("successfully") ? "message-success" : "message-error"}`}>
                            {message}
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-box">
                            <span className="loading-icon">⏳</span>
                            Loading wallet data...
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-label">Mobile Money Earnings</div>
                                    <div className="stat-value earned">{fmt(wallet.total_earned)}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Voucher Earnings</div>
                                    <div className="stat-value" style={{ color: "#fbc02d" }}>{fmt(incomeBreakdown.voucher_total)}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Total Withdrawn</div>
                                    <div className="stat-value withdrawn">{fmt(wallet.total_withdrawn)}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Available Balance</div>
                                    <div className="stat-value balance">{fmt(wallet.current_balance)}</div>
                                </div>
                            </div>

                            <div style={{
                                background: "rgba(229,9,20,0.06)",
                                border: "1px solid rgba(229,9,20,0.2)",
                                borderRadius: "6px",
                                padding: "12px 16px",
                                marginBottom: "18px",
                                fontSize: "0.75rem",
                                color: "rgba(255,255,255,0.7)",
                                fontWeight: 600,
                            }}>
                                ℹ️ Only mobile money earnings are withdrawable. Voucher revenue is excluded from withdrawal balance.
                            </div>

                            {/* Content */}
                            <div className="content-wrapper">
                                {/* Form */}
                                <form onSubmit={handleRequest} className="form-section">
                                    <div className="form-header">
                                        <div className="form-header-icon">💸</div>
                                        <div>
                                            <h3>Request Withdrawal</h3>
                                            <p>Transfer to mobile money</p>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Amount (TZS)</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Enter amount"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Mobile Money Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            placeholder="e.g. 0712345678"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Provider</label>
                                        <select
                                            value={provider}
                                            onChange={(e) => setProvider(e.target.value)}
                                        >
                                            <option value="Mpesa">M-Pesa</option>
                                            <option value="Tigo">Tigo Pesa</option>
                                            <option value="Airtel">Airtel Money</option>
                                            <option value="Halopesa">Halopesa</option>
                                            <option value="Azampesa">Azampesa</option>
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="submit-btn"
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner"></span>
                                                Processing...
                                            </>
                                        ) : (
                                            "Request Withdrawal"
                                        )}
                                    </button>
                                </form>

                                {/* History */}
                                <div className="history-section">
                                    <div className="history-header">
                                        <h3>
                                            Withdrawal History
                                            <span className="count-badge">{withdrawals.length}</span>
                                        </h3>
                                    </div>

                                    {withdrawals.length === 0 ? (
                                        <div className="empty-state">
                                            <span className="empty-icon">🏦</span>
                                            <p>No withdrawals yet</p>
                                            <div className="empty-sub">Request your first withdrawal above</div>
                                        </div>
                                    ) : (
                                        <div className="table-wrapper">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Amount</th>
                                                        <th>Provider</th>
                                                        <th>Mobile Number</th>
                                                        <th>Status</th>
                                                        <th>Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {withdrawals.map((w) => (
                                                        <tr key={w.id}>
                                                            <td className="id-cell">#{w.id}</td>
                                                            <td className="amount-highlight">
                                                                {fmt(w.amount)}
                                                            </td>
                                                            <td className="provider-cell">
                                                                {w.payout_provider}
                                                            </td>
                                                            <td className="mobile-cell">
                                                                {w.mobile_money_number}
                                                            </td>
                                                            <td>
                                                                <span className={`status-badge ${getStatusClass(w.status)}`}>
                                                                    {w.status}
                                                                </span>
                                                            </td>
                                                            <td className="date-text">
                                                                {new Date(w.created_at).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Withdrawals;