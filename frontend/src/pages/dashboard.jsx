import React, { useState } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";

// ===== Pages =====
import Income from "./income";
import Routers from "./routers";
import Packages from "./packages";
import Vouchers from "./vouchers";
import Payments from "./payments";
import Withdrawals from "./withdrawals";
import Sessions from "./sessions";
import Customers from "./customers";
import Branch from "./branch";
import Portal from "./portal";
import Settings from "./settings";

const MENU_ITEMS = [
  { path: "/dashboard/income",      icon: "💰", label: "Revenue",     desc: "Mapato yote" },
  { path: "/dashboard/routers",     icon: "📡", label: "Routers",     desc: "Vifaa vya mtandao" },
  { path: "/dashboard/packages",    icon: "📦", label: "Packages",    desc: "Vifurushi" },
  { path: "/dashboard/vouchers",    icon: "🎟️", label: "Vouchers",    desc: "Kadi za wifi" },
  { path: "/dashboard/payments",    icon: "💳", label: "Payments",    desc: "Malipo" },
  { path: "/dashboard/withdrawals", icon: "🏦", label: "Withdrawals", desc: "Utoaji pesa" },
  { path: "/dashboard/sessions",    icon: "🕐", label: "Sessions",    desc: "Vikao vya watumiaji" },
  { path: "/dashboard/customers",   icon: "👥", label: "Customers",   desc: "Wateja" },
  { path: "/dashboard/branch",      icon: "🏪", label: "Branches",    desc: "Matawi" },
  { path: "/dashboard/portal",      icon: "🚪", label: "Portal",      desc: "Portal ya mteja" },
  { path: "/dashboard/settings",    icon: "⚙️", label: "Settings",    desc: "Mipangilio" },
];

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("tenantUser") || "null");
  const businessName = user?.business_name || "Guest";
  const initial = businessName.charAt(0).toUpperCase();

  const logout = () => {
    localStorage.removeItem("tenantUser");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  const currentPage = MENU_ITEMS.find((m) => isActive(m.path));

  return (
    <div className="dashboard-root">
      {/* ============================================================
          CSS — NETFLIX STYLE (Black + Red)
          ============================================================ */}
      <style>{`
        * { box-sizing: border-box; }

        body {
          margin: 0;
          padding: 0;
          background: #0a0a0a;
          font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
          color: #fff;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .dashboard-root {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #141414 100%);
        }

        /* ============ SIDEBAR ============ */
        .sidebar {
          width: 280px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #0d0d0d 0%, #0a0a0a 100%);
          border-right: 1px solid rgba(220, 20, 31, 0.15);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100;
        }

        .sidebar::-webkit-scrollbar { width: 6px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(220, 20, 31, 0.3);
          border-radius: 3px;
        }
        .sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(220, 20, 31, 0.6);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 24px 22px;
          border-bottom: 1px solid rgba(220, 20, 31, 0.12);
          position: relative;
        }

        .sidebar-brand::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 22px;
          right: 22px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(220, 20, 31, 0.4), transparent);
        }

        .brand-icon {
          font-size: 2rem;
          line-height: 1;
          background: linear-gradient(135deg, #dc141f 0%, #ff4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 10px rgba(220, 20, 31, 0.4));
        }

        .brand-text h1 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.4px;
          line-height: 1.2;
        }

        .brand-text p {
          font-size: 0.65rem;
          color: #777;
          margin: 3px 0 0 0;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          color: #b0b0b0;
          font-family: inherit;
          font-size: 0.9rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          width: 100%;
          -webkit-tap-highlight-color: transparent;
        }

        .nav-item:hover {
          background: rgba(220, 20, 31, 0.08);
          color: #fff;
          border-color: rgba(220, 20, 31, 0.2);
          transform: translateX(3px);
        }

        .nav-item-active {
          background: linear-gradient(90deg, rgba(220, 20, 31, 0.18), rgba(220, 20, 31, 0.05));
          color: #fff;
          border-color: rgba(220, 20, 31, 0.4);
          box-shadow: 0 4px 20px rgba(220, 20, 31, 0.15);
        }

        .nav-item-active .nav-label {
          color: #dc141f;
          font-weight: 800;
        }

        .nav-icon {
          font-size: 1.3rem;
          line-height: 1;
          flex-shrink: 0;
          width: 24px;
          text-align: center;
          transition: transform 0.25s ease;
        }

        .nav-item:hover .nav-icon,
        .nav-item-active .nav-icon {
          transform: scale(1.15);
        }

        .nav-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .nav-label {
          font-size: 0.88rem;
          font-weight: 600;
          color: inherit;
          line-height: 1.2;
          letter-spacing: 0.2px;
          transition: color 0.2s ease;
        }

        .nav-desc {
          font-size: 0.68rem;
          color: #666;
          font-weight: 400;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-item:hover .nav-desc,
        .nav-item-active .nav-desc {
          color: #999;
        }

        .nav-indicator {
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 3px;
          background: linear-gradient(180deg, #dc141f, #ff4444);
          border-radius: 0 3px 3px 0;
          box-shadow: 0 0 12px rgba(220, 20, 31, 0.6);
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid rgba(220, 20, 31, 0.12);
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: linear-gradient(135deg, #dc141f 0%, #b20a18 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: #fff;
          font-weight: 800;
          border: 2px solid rgba(220, 20, 31, 0.4);
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(220, 20, 31, 0.25);
        }

        .user-info {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 0.82rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.65rem;
          color: #dc141f;
          margin: 2px 0 0 0;
          font-weight: 600;
          letter-spacing: 0.4px;
        }

        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00ff88;
          margin-right: 5px;
          animation: pulseDot 2.5s ease-in-out infinite;
          vertical-align: middle;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.6; transform: scale(0.85); }
        }

        .logout-btn {
          padding: 9px 16px;
          font-size: 0.72rem;
          font-weight: 700;
          font-family: inherit;
          background: linear-gradient(135deg, #dc141f 0%, #ff3333 100%);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          letter-spacing: 0.6px;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(220, 20, 31, 0.3);
          width: 100%;
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, #ff3333 0%, #ff5555 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(220, 20, 31, 0.5);
        }

        .logout-btn:active { transform: translateY(0); }

        /* ============ MAIN CONTENT ============ */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 100vh;
        }

        .topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 28px;
          background: rgba(13, 13, 13, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(220, 20, 31, 0.15);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .menu-toggle {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .menu-toggle:hover { background: rgba(220, 20, 31, 0.1); }

        .menu-toggle span {
          display: block;
          width: 22px;
          height: 2px;
          background: #dc141f;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .topbar-title {
          flex: 1;
          min-width: 0;
        }

        .topbar-title h2 {
          font-size: 1.4rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.4px;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .topbar-title p {
          font-size: 0.75rem;
          color: #777;
          margin: 3px 0 0 0;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar-avatar {
          width: 38px;
          height: 38px;
          font-size: 0.9rem;
        }

        .page-content {
          flex: 1;
          padding: 28px;
          overflow-y: auto;
          animation: fadeInUp 0.4s ease-out;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ============ PAGE HEADINGS ============ */
        .page-header {
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(220, 20, 31, 0.12);
          position: relative;
        }

        .page-header::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, #dc141f, #ff4444);
          border-radius: 2px;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 800;
          color: #fff;
          margin: 0 0 8px 0;
          letter-spacing: -0.6px;
          line-height: 1.15;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .page-header h1 .page-icon {
          font-size: 2rem;
          line-height: 1;
          filter: drop-shadow(0 2px 6px rgba(220, 20, 31, 0.3));
        }

        .page-header h1 span.highlight {
          background: linear-gradient(135deg, #dc141f 0%, #ff4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-header p {
          font-size: 0.92rem;
          color: #999;
          margin: 0;
          font-weight: 400;
          line-height: 1.5;
          max-width: 700px;
        }

        /* ============ CARDS / STATS ============ */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(20, 20, 20, 0.8) 0%, rgba(15, 15, 15, 0.9) 100%);
          border: 1px solid rgba(220, 20, 31, 0.15);
          border-radius: 10px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #dc141f, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(220, 20, 31, 0.4);
          box-shadow: 0 12px 35px rgba(220, 20, 31, 0.15);
        }

        .stat-card:hover::before { opacity: 1; }

        .stat-label {
          font-size: 0.7rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          line-height: 1.1;
          letter-spacing: -0.5px;
        }

        .stat-value.red {
          background: linear-gradient(135deg, #dc141f 0%, #ff4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-change {
          font-size: 0.72rem;
          color: #00ff88;
          margin: 6px 0 0 0;
          font-weight: 600;
        }

        .stat-change.down { color: #ff4444; }

        /* ============ TABLE ============ */
        .data-table {
          width: 100%;
          background: rgba(20, 20, 20, 0.6);
          border: 1px solid rgba(220, 20, 31, 0.15);
          border-radius: 10px;
          overflow: hidden;
          border-collapse: collapse;
        }

        .data-table thead {
          background: rgba(220, 20, 31, 0.08);
        }

        .data-table th {
          padding: 14px 16px;
          text-align: left;
          font-size: 0.72rem;
          font-weight: 700;
          color: #dc141f;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid rgba(220, 20, 31, 0.2);
        }

        .data-table td {
          padding: 14px 16px;
          font-size: 0.85rem;
          color: #d0d0d0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .data-table tbody tr { transition: background 0.2s ease; }
        .data-table tbody tr:hover { background: rgba(220, 20, 31, 0.06); }
        .data-table tbody tr:last-child td { border-bottom: none; }

        /* ============ OVERLAY (mobile) ============ */
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 90;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 1024px) {
          .sidebar { width: 250px; }
          .page-content { padding: 22px; }
          .topbar { padding: 14px 22px; }
          .page-header h1 { font-size: 1.7rem; }
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            transform: translateX(-100%);
            width: 280px;
            box-shadow: 8px 0 40px rgba(0, 0, 0, 0.6);
          }

          .sidebar-open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .menu-toggle { display: flex; }

          .page-content { padding: 18px 16px; }
          .topbar { padding: 12px 16px; }
          .topbar-title h2 { font-size: 1.15rem; }
          .topbar-title p { font-size: 0.68rem; }

          .page-header h1 { font-size: 1.4rem; gap: 8px; }
          .page-header h1 .page-icon { font-size: 1.5rem; }
          .page-header p { font-size: 0.82rem; }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
          }

          .stat-value { font-size: 1.5rem; }
        }

        @media (max-width: 480px) {
          .page-content { padding: 14px 12px; }
          .topbar { padding: 10px 12px; gap: 10px; }
          .topbar-title h2 { font-size: 1rem; }
          .topbar-title p { font-size: 0.62rem; }
          .topbar-avatar { width: 34px; height: 34px; font-size: 0.8rem; }

          .page-header {
            margin-bottom: 20px;
            padding-bottom: 14px;
          }

          .page-header h1 { font-size: 1.15rem; flex-wrap: wrap; }
          .page-header h1 .page-icon { font-size: 1.3rem; }
          .page-header p { font-size: 0.75rem; }

          .stat-card { padding: 16px; }
          .stat-value { font-size: 1.3rem; }

          .nav-item { padding: 10px 12px; }
          .nav-icon { font-size: 1.15rem; }
          .nav-label { font-size: 0.82rem; }
          .nav-desc { font-size: 0.62rem; }

          .data-table th,
          .data-table td {
            padding: 10px 12px;
            font-size: 0.75rem;
          }
        }

        @media (max-width: 360px) {
          .page-content { padding: 10px 8px; }
          .topbar { padding: 8px 10px; }
          .topbar-title h2 { font-size: 0.9rem; }
          .page-header h1 { font-size: 1rem; }
          .page-header p { font-size: 0.7rem; }
          .stat-value { font-size: 1.15rem; }
        }

        @media (hover: none) {
          .nav-item:hover { transform: none; }
          .stat-card:hover { transform: none; }
          .logout-btn:hover { transform: none; }
        }
      `}</style>

      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">▶</span>
          <div className="brand-text">
            <h1>Net Kitonga</h1>
            <p>Internet Supply Co.</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-item ${isActive(item.path) ? "nav-item-active" : ""}`}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">
                <span className="nav-label">{item.label}</span>
                <span className="nav-desc">{item.desc}</span>
              </span>
              {isActive(item.path) && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initial}</div>
            <div className="user-info">
              <p className="user-name">
                <span className="status-dot" />
                {businessName}
              </p>
              <p className="user-role">✦ Network Provider</p>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>

          <div className="topbar-title">
            <h2>
              {currentPage?.icon} {currentPage?.label || "Dashboard"}
            </h2>
            <p>Net Kitonga — Billing Management</p>
          </div>

          <div className="topbar-right">
            <div className="user-avatar topbar-avatar">{initial}</div>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="income"      element={<Income />} />
            <Route path="routers"     element={<Routers />} />
            <Route path="packages"    element={<Packages />} />
            <Route path="vouchers"    element={<Vouchers />} />
            <Route path="payments"    element={<Payments />} />
            <Route path="withdrawals" element={<Withdrawals />} />
            <Route path="sessions"    element={<Sessions />} />
            <Route path="customers"   element={<Customers />} />
            <Route path="branch"      element={<Branch />} />
            <Route path="portal"      element={<Portal />} />
            <Route path="settings"    element={<Settings />} />
            <Route path="*" element={<Navigate to="income" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;