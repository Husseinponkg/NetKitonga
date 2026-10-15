import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function Branch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentUser = getStoredTenantUser();
  const tenantId = getTenantId();

  const [branch_name, setBranchName] = useState("");
  const [branch_location, setBranchLocation] = useState("");
  const [branch_email, setBranchEmail] = useState("");
  const [branch_phone, setBranchPhone] = useState("");
  const [branch_manager, setBranchManager] = useState("");
  const [branches, setBranches] = useState([]);
  const [branchEarnings, setBranchEarnings] = useState({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!tenantId) {
      setError("Tenant session is missing. Please login again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/branch/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenant_id: Number(tenantId),
          branch_name,
          branch_location,
          branch_email,
          branch_phone,
          branch_manager
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || "Branch created successfully");
        fetchBranches();
        setBranchName("");
        setBranchLocation("");
        setBranchEmail("");
        setBranchPhone("");
        setBranchManager("");
      } else {
        setError(data.message || data.detail || "Failed to create branch");
      }
    } catch (error) {
      console.error("Error creating branch:", error);
      setError("Error creating branch");
    }
  };

  const fetchBranches = async () => {
    if (!tenantId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/branch/all?tenant_id=${tenantId}`);
      const data = await response.json();
      setBranches(Array.isArray(data.branches) ? data.branches : []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchEarnings = async () => {
    if (!tenantId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/branch/earnings?tenant_id=${tenantId}`);
      if (!response.ok) return;
      const data = await response.json();
      const map = {};
      (data.branches || []).forEach((item) => {
        map[item.branch_id] = item;
      });
      setBranchEarnings(map);
    } catch (error) {
      console.error("Error fetching branch earnings:", error);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchEarnings();
  }, [tenantId]);

  return (
    <div className="branch-root">
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

        .branch-root {
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

        .submit-btn:hover {
          background: #f6121d;
        }

        .submit-btn:active {
          transform: scale(0.98);
        }

        .message {
          padding: 10px 14px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-top: 12px;
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

        /* ===== BRANCHES SECTION ===== */
        .branches-section {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 6px;
          padding: 20px;
          min-width: 0;
        }

        .branches-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1a1a1a;
          flex-wrap: wrap;
          gap: 8px;
        }

        .branches-header h3 {
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

        /* ===== BRANCH CARDS GRID ===== */
        .branches-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }

        .branch-card {
          background: #000000;
          border: 1px solid #1a1a1a;
          border-radius: 6px;
          padding: 16px;
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
          animation: fadeIn 0.5s ease-out;
          animation-fill-mode: both;
        }

        .branch-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: #e50914;
          opacity: 0;
          transition: opacity 0.22s;
        }

        .branch-card:hover {
          border-color: #262626;
          transform: translateY(-2px);
        }

        .branch-card:hover::before { opacity: 1; }

        .branch-card:nth-child(1) { animation-delay: 0.05s; }
        .branch-card:nth-child(2) { animation-delay: 0.10s; }
        .branch-card:nth-child(3) { animation-delay: 0.15s; }
        .branch-card:nth-child(4) { animation-delay: 0.20s; }
        .branch-card:nth-child(5) { animation-delay: 0.25s; }
        .branch-card:nth-child(6) { animation-delay: 0.30s; }

        .branch-name {
          font-size: 0.9rem;
          font-weight: 900;
          color: #ffffff;
          margin: 0 0 14px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 12px;
          border-bottom: 1px solid #1a1a1a;
          letter-spacing: -0.1px;
        }

        .branch-name-icon {
          width: 26px;
          height: 26px;
          border-radius: 4px;
          background: #e50914;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          flex-shrink: 0;
        }

        .branch-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .branch-info-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          font-size: 0.75rem;
          padding: 6px 0;
          border-bottom: 1px solid #141414;
        }

        .branch-info-item:last-child { border-bottom: none; }

        .branch-info-label {
          color: #666;
          font-weight: 800;
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .branch-info-value {
          color: #e5e5e5;
          word-break: break-word;
          flex: 1;
          text-align: right;
          font-weight: 500;
        }

        .location { color: #46d369; }
        .email { color: #ffffff; }
        .phone { color: #fbc02d; }
        .manager { color: #b3b3b3; }

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

        .empty-text {
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

          .form-section,
          .branches-section { padding: 16px; }

          .form-header-icon { width: 28px; height: 28px; font-size: 0.75rem; }
          .form-header h3 { font-size: 0.78rem; }
          .form-header p { font-size: 0.6rem; }

          .form-group input { font-size: 0.82rem; height: 44px; }
          .submit-btn { height: 44px; font-size: 0.68rem; }

          .branches-header h3 { font-size: 0.82rem; }
          .count-badge { font-size: 0.62rem; padding: 2px 8px; }

          .branches-grid { grid-template-columns: 1fr; gap: 12px; }
          .branch-card { padding: 14px; }

          .branch-name { font-size: 0.85rem; }
          .branch-name-icon { width: 24px; height: 24px; font-size: 0.7rem; }

          .branch-info-item { font-size: 0.72rem; }
          .branch-info-label { font-size: 0.55rem; }

          .empty-state { padding: 40px 16px; }
          .empty-icon { font-size: 2.2rem; }
        }

        @media (max-width: 400px) {
          .top-bar { padding: 10px 12px; height: 48px; }
          .top-bar-title { font-size: 0.8rem; }
          .status-pill span:not(.status-dot) { display: none; }
          .status-pill { padding: 5px 8px; }

          .scroll-body { padding: 12px 10px 28px; }
          .form-section, .branches-section { padding: 14px; }
          .branch-card { padding: 12px; }

          .branch-info-item {
            flex-direction: column;
            gap: 2px;
            align-items: flex-start;
          }
          .branch-info-value {
            text-align: left;
          }
        }

        @media (hover: none) {
          .submit-btn:hover { transform: none; }
          .branch-card:hover { transform: none; }
          .branch-card:hover::before { opacity: 0; }
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
              Branches <span>Management</span>
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
          <div className="content-wrapper">
            {/* FORM */}
            <form onSubmit={handleSubmit} className="form-section">
              <div className="form-header">
                <div className="form-header-icon">➕</div>
                <div>
                  <h3>Add New Branch</h3>
                  <p>Register a new location</p>
                </div>
              </div>

              <div className="form-group">
                <label>Branch Name</label>
                <input
                  type="text"
                  value={branch_name}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g., Downtown Branch"
                  required
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={branch_location}
                  onChange={(e) => setBranchLocation(e.target.value)}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={branch_email}
                  onChange={(e) => setBranchEmail(e.target.value)}
                  placeholder="branch@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={branch_phone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  placeholder="+255 xxx xxx xxx"
                  required
                />
              </div>

              <div className="form-group">
                <label>Manager Name</label>
                <input
                  type="text"
                  value={branch_manager}
                  onChange={(e) => setBranchManager(e.target.value)}
                  placeholder="Manager's name"
                  required
                />
              </div>

              <button type="submit" className="submit-btn">Create Branch</button>

              {success && <div className="message message-success">{success}</div>}
              {error && <div className="message message-error">{error}</div>}
            </form>

            {/* BRANCHES */}
            <div className="branches-section">
              <div className="branches-header">
                <h3>
                  Your Branches
                  <span className="count-badge">{branches.length}</span>
                </h3>
              </div>

              {branches.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏪</span>
                  <p className="empty-text">No branches created yet</p>
                  <p className="empty-sub">Add your first branch using the form</p>
                </div>
              ) : (
                <div className="branches-grid">
                  {branches.map((b) => (
                    <div key={b.id} className="branch-card">
                      <h3 className="branch-name">
                        <span className="branch-name-icon">📍</span>
                        {b.branch_name}
                      </h3>

                      <div className="branch-info">
                        <div className="branch-info-item">
                          <span className="branch-info-label">Location</span>
                          <span className="branch-info-value location">{b.branch_location}</span>
                        </div>

                        <div className="branch-info-item">
                          <span className="branch-info-label">Email</span>
                          <span className="branch-info-value email">{b.branch_email}</span>
                        </div>

                        <div className="branch-info-item">
                          <span className="branch-info-label">Phone</span>
                          <span className="branch-info-value phone">{b.branch_phone}</span>
                        </div>

                        <div className="branch-info-item">
                          <span className="branch-info-label">Manager</span>
                          <span className="branch-info-value manager">{b.branch_manager}</span>
                        </div>

                        <div className="branch-info-item">
                          <span className="branch-info-label">Earnings</span>
                          <span className="branch-info-value" style={{ color: "#46d369", fontWeight: 800 }}>
                            {branchEarnings[b.id] ? Number(branchEarnings[b.id].completed_total || 0).toLocaleString() : "0"} TZS
                          </span>
                        </div>

                        <div className="branch-info-item">
                          <span className="branch-info-label">Transactions</span>
                          <span className="branch-info-value">
                            {branchEarnings[b.id] ? Number(branchEarnings[b.id].completed_transactions || 0).toLocaleString() : "0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Branch;