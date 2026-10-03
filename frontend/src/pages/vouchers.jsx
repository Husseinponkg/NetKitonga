import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function formatDate(value) {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function Vouchers() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [packages, setPackages] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [packageId, setPackageId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const tenantId = getTenantId();
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

  const loadData = async () => {
    setLoading(true);
    if (!tenantId) {
      setMessage("Tenant session is missing. Please login again.");
      setLoading(false);
      return;
    }
    try {
      const [packageResponse, voucherResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/packages/catalog?tenant_id=${tenantId}`),
        fetch(`${API_BASE_URL}/vouchers?tenant_id=${tenantId}`),
      ]);

      if (!packageResponse.ok || !voucherResponse.ok) {
        throw new Error("Unable to load voucher data.");
      }

      const packageData = await packageResponse.json();
      setPackages(packageData.filter((item) => item.status === "active"));
      setVouchers(await voucherResponse.json());
    } catch (error) {
      setMessage(error.message || "Unable to load voucher data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setCreating(true);

    if (!tenantId) {
      setMessage("Tenant session is missing. Please login again.");
      setCreating(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/vouchers/create?tenant_id=${tenantId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: Number(packageId),
          quantity: Number(quantity),
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        const detail = typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail || result.message || {});
        throw new Error(detail || "Voucher creation failed.");
      }

      setMessage(`${result.length} voucher${result.length === 1 ? "" : "s"} created successfully.`);
      setVouchers((current) => [...result, ...current]);
      setQuantity(1);
      setExpiresAt("");
    } catch (error) {
      setMessage(error.message || "Voucher creation failed.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="vouchers-root">
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

        .vouchers-root {
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

        /* ===== PANELS ===== */
        .panel {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1a1a1a;
        }

        .panel-header-icon {
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

        .panel-header-text h3 {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        .panel-header-text p {
          margin: 2px 0 0 0;
          font-size: 0.65rem;
          color: #666;
          font-weight: 400;
        }

        /* ===== VOUCHER FORM ===== */
        .voucher-form {
          display: grid;
          grid-template-columns: 1.7fr 0.7fr 1.2fr auto;
          gap: 12px;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 0;
        }

        .form-group label {
          font-size: 0.6rem;
          font-weight: 800;
          color: #808080;
          text-transform: uppercase;
          letter-spacing: 1.2px;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #1f1f1f;
          border-radius: 4px;
          background: #000000;
          color: #ffffff;
          font-size: 0.85rem;
          font-family: inherit;
          transition: all 0.15s ease;
          box-sizing: border-box;
          height: 42px;
        }

        .form-group input:focus,
        .form-group select:focus {
          border-color: #e50914;
          outline: none;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.12);
        }

        .form-group input::placeholder {
          color: #4d4d4d;
        }

        .form-group input[type="datetime-local"] {
          color-scheme: dark;
        }

        .form-group select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%23808080' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 34px;
          cursor: pointer;
        }

        .form-group select option {
          background: #0d0d0d;
          color: #ffffff;
        }

        .submit-btn {
          padding: 10px 18px;
          border: none;
          border-radius: 4px;
          background: #e50914;
          color: #ffffff;
          font-weight: 900;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          white-space: nowrap;
          height: 42px;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .submit-btn:hover:not(:disabled) {
          background: #f6121d;
        }

        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }

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
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ===== TABLE ===== */
        .table-section h3 {
          margin: 0 0 16px 0;
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

        .voucher-code {
          font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
          font-weight: 900;
          color: #e50914;
          letter-spacing: 0.08em;
          font-size: 0.8rem;
        }

        .package-name {
          color: #ffffff;
          font-weight: 600;
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

        .status-used {
          background: rgba(158, 158, 158, 0.12);
          color: #bdbdbd;
        }

        .status-expired {
          background: rgba(229, 9, 20, 0.12);
          color: #ff5252;
        }

        .status-default {
          background: rgba(255, 255, 255, 0.05);
          color: #808080;
        }

        .date-text {
          font-size: 0.72rem;
          color: #808080;
          font-family: 'SF Mono', 'Monaco', monospace;
        }

        /* ===== EMPTY / LOADING ===== */
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

        .empty-state a {
          color: #e50914;
          text-decoration: none;
          font-weight: 900;
          font-size: 0.72rem;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          display: inline-block;
          margin-top: 8px;
        }

        .empty-state a:hover {
          text-decoration: underline;
        }

        .loading-text {
          color: #808080;
          padding: 40px 0;
          text-align: center;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.6px;
          text-transform: uppercase;
        }

        /* ============================================================
           RESPONSIVE
           ============================================================ */

        @media (max-width: 1000px) {
          .voucher-form {
            grid-template-columns: 1fr 1fr;
          }
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

        @media (max-width: 700px) {
          .voucher-form {
            grid-template-columns: 1fr;
          }
          .submit-btn { width: 100%; }
        }

        @media (max-width: 640px) {
          .top-bar { padding: 10px 14px; height: 50px; }
          .top-bar-title { font-size: 0.85rem; letter-spacing: 0.2px; }
          .status-pill { font-size: 0.55rem; padding: 4px 8px; }
          .scroll-body { padding: 14px 12px 32px; }

          .message-box { padding: 10px 12px; font-size: 0.75rem; margin-bottom: 14px; }

          .panel { padding: 16px; margin-bottom: 12px; }

          .panel-header-icon { width: 28px; height: 28px; font-size: 0.75rem; }
          .panel-header-text h3 { font-size: 0.78rem; }
          .panel-header-text p { font-size: 0.6rem; }

          .form-group input,
          .form-group select { font-size: 0.82rem; height: 44px; }
          .submit-btn { height: 44px; font-size: 0.68rem; }

          .table-section h3 { font-size: 0.82rem; }
          .count-badge { font-size: 0.62rem; padding: 2px 8px; }

          table { min-width: 520px; font-size: 0.75rem; }
          thead th { padding: 9px 11px; font-size: 0.58rem; }
          tbody td { padding: 9px 11px; }

          .voucher-code { font-size: 0.72rem; }
          .date-text { font-size: 0.65rem; }
          .status-badge { font-size: 0.58rem; padding: 2px 8px; }

          .empty-state { padding: 40px 16px; }
          .empty-icon { font-size: 2.2rem; }
        }

        @media (max-width: 400px) {
          .top-bar { padding: 10px 12px; height: 48px; }
          .top-bar-title { font-size: 0.8rem; }
          .status-pill span:not(.status-dot) { display: none; }
          .status-pill { padding: 5px 8px; }

          .scroll-body { padding: 12px 10px 28px; }
          .panel { padding: 14px; }

          table { min-width: 460px; }
          thead th { padding: 8px 10px; font-size: 0.55rem; }
          tbody td { padding: 8px 10px; font-size: 0.7rem; }

          .voucher-code { font-size: 0.68rem; }
        }

        @media (hover: none) {
          .submit-btn:hover:not(:disabled) { transform: none; }
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
              Vouchers <span>Registry</span>
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
          {message && (
            <div className={`message-box ${message.includes("successfully") ? "message-success" : "message-error"}`}>
              {message}
            </div>
          )}

          {/* Create Panel */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-header-icon">🎫</div>
              <div className="panel-header-text">
                <h3>Generate Vouchers</h3>
                <p>Create access codes from your active packages</p>
              </div>
            </div>

            {packages.length === 0 && !loading ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <p>No active packages</p>
                <p><Link to="/packages">Manage packages →</Link></p>
              </div>
            ) : (
              <form className="voucher-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="voucher-package">Package</label>
                  <select
                    id="voucher-package"
                    value={packageId}
                    onChange={(event) => setPackageId(event.target.value)}
                    required
                  >
                    <option value="">Select a package</option>
                    {packages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.package_name} - TZS {Number(item.price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="voucher-quantity">Quantity</label>
                  <input
                    id="voucher-quantity"
                    type="number"
                    min="1"
                    max="500"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="voucher-expiry">Expires (optional)</label>
                  <input
                    id="voucher-expiry"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                </div>

                <button className="submit-btn" type="submit" disabled={creating || !packageId}>
                  {creating ? (
                    <>
                      <span className="spinner"></span>
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </form>
            )}
          </div>

          {/* History Panel */}
          <div className="panel">
            <h3>
              Voucher History
              <span className="count-badge">{vouchers.length}</span>
            </h3>

            {loading ? (
              <div className="loading-text">Loading vouchers...</div>
            ) : vouchers.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🎫</span>
                <p>No vouchers yet</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Package</th>
                      <th>Status</th>
                      <th>Expires</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((voucher) => {
                      const statusClass = voucher.status === 'active' ? 'status-active' :
                                        voucher.status === 'used' ? 'status-used' :
                                        voucher.status === 'expired' ? 'status-expired' : 'status-default';
                      return (
                        <tr key={voucher.id}>
                          <td className="voucher-code">{voucher.code}</td>
                          <td className="package-name">{voucher.package_name}</td>
                          <td>
                            <span className={`status-badge ${statusClass}`}>
                              {voucher.status}
                            </span>
                          </td>
                          <td className="date-text">{formatDate(voucher.expires_at)}</td>
                          <td className="date-text">{formatDate(voucher.created_at)}</td>
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

export default Vouchers;