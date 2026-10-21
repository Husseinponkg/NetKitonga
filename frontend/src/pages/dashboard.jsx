  import React, { useState, useEffect } from "react";
  import { Link, useNavigate, useLocation } from "react-router-dom";
  import { API_BASE_URL } from "../api";
  import "./dashboard.css";
  import { getStoredTenantUser, getTenantId } from "../session";

  function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = getStoredTenantUser();
    const tenantId = getTenantId();

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
      today_completed_count: 0,
      today_completed_total: 0,
      today_azampay_count: 0,
      today_azampay_total: 0,
      today_voucher_count: 0,
      today_voucher_total: 0,
    });
    const [activeSessions, setActiveSessions] = useState(0);
    const [loading, setLoading] = useState(true);

    const logout = () => {
      localStorage.removeItem("tenantUser");
      navigate("/");
    };

    const navItems = [
      { to: "/dashboard", label: "Dashboard", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
      { to: "/income", label: "Revenue", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
      { to: "/routers", label: "Routers", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>` },
      { to: "/packages", label: "Packages", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` },
      { to: "/vouchers", label: "Vouchers", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>` },
      { to: "/payments", label: "Payments", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>` },
      { to: "/withdrawals", label: "Withdrawals", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
      { to: "/sessions", label: "Sessions", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
      { to: "/customers", label: "Customers", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
      { to: "/branch", label: "Branches", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>` },
      { to: "/portal", label: "Portal", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>` },
      { to: "/support-desk", label: "Support Desk", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>` },
      { to: "/settings", label: "Settings", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
    ];

    const fetchData = async () => {
      if (!tenantId) return;
      try {
        const [statsRes, sessionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/payments/income/stats?tenant_id=${tenantId}`),
          fetch(`${API_BASE_URL}/sessions/active?tenant_id=${tenantId}`),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (sessionsRes.ok) {
          const data = await sessionsRes.json();
          setActiveSessions(Array.isArray(data) ? data.length : 0);
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
      const timer = setInterval(fetchData, 30000);
      return () => clearInterval(timer);
    }, [tenantId]);

    const fmt = (n) =>
      new Intl.NumberFormat("en-TZ", {
        style: "currency",
        currency: "TZS",
        minimumFractionDigits: 0,
      }).format(n || 0);

    const statsCards = [
      { label: "Today's Income", value: fmt(stats.today_completed_total), trend: "up", change: `${stats.today_completed_count} txns` },
      { label: "Total Revenue", value: fmt(stats.completed_total), trend: "up", change: `${stats.completed_count} txns` },
      { label: "Active Sessions", value: String(activeSessions), trend: "up", change: "live" },
      { label: "Pending Payments", value: String(stats.pending_count), trend: "down", change: fmt(stats.pending_total) },
    ];

    const recentActivity = [
      { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`, text: `${stats.completed_count} completed payments`, time: "All time", type: "success" },
      { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`, text: `Mobile Money: ${fmt(stats.azampay_completed_total)}`, time: `${stats.azampay_completed_count} txns`, type: "info" },
      { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`, text: `Vouchers: ${fmt(stats.voucher_completed_total)}`, time: `${stats.voucher_completed_count} txns`, type: "info" },
      { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`, text: `${stats.pending_count} pending payments`, time: fmt(stats.pending_total), type: "warning" },
      { icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`, text: `${stats.failed_count} failed payments`, time: fmt(stats.failed_total), type: "error" },
    ];

    return (
      <div className="income-root" style={{
        minHeight: "100vh",
        background: "#000000",
        fontFamily: "'Inter', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
        display: "flex",
        margin: 0,
        padding: 0,
        color: "#ffffff",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Overlay */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* ===== SIDEBAR ===== */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg></div>
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
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, color: "#b3b3b3" }} dangerouslySetInnerHTML={{ __html: item.icon }} />
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
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, color: "#b3b3b3" }} dangerouslySetInnerHTML={{ __html: item.icon }} />
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
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, color: "#b3b3b3" }} dangerouslySetInnerHTML={{ __html: item.icon }} />
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{user?.business_name?.[0] || "U"}</div>
              <div className="user-info">
                <div className="user-name">{user?.business_name || "User"}</div>
                <div className="user-role">{user?.email || ""}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              <span style={{ display: "inline-flex", alignItems: "center" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></span>
              Logout
            </button>
          </div>
        </aside>
        {/* ===== MAIN ===== */}
        <div className="main-content">
          <header className="top-bar">
            <div className="top-bar-left">
              <button className="hamburger" onClick={() => setSidebarOpen(true)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
              <div>
                <div className="top-bar-title">Dashboard <span>Overview</span></div>
                <div className="top-bar-subtitle">Welcome back, {user?.business_name || "User"}</div>
              </div>
            </div>
            <div className="top-bar-right">
              <Link to="/income" className="btn-ghost">View Reports</Link>
            </div>
          </header>
          <div className="dashboard-body">
            <div className="stats-grid">
              {statsCards.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{loading ? "..." : stat.value}</div>
                  <div className="stat-change">{stat.change}</div>
                </div>
              ))}
            </div>
            <div className="dashboard-panels">
              <div className="panel">
                <div className="panel-header">
                  <h3>Revenue Trend</h3>
                  <p className="panel-subtitle">Monthly revenue trend</p>
                </div>
                <div className="panel-body">
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
                    See Income page for detailed breakdown
                  </div>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header">
                  <h3>Recent Activity</h3>
                </div>
                <div className="panel-body">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="activity-item">
                      <span className="activity-icon" dangerouslySetInnerHTML={{ __html: act.icon }} />
                      <div className="activity-content">
                        <div className="activity-text">{act.text}</div>
                        <div className="activity-time">{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export default Dashboard;