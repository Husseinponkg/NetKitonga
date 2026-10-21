  import React, { useState, useEffect } from "react";
  import { Link, useNavigate, useLocation } from "react-router-dom";
  import { API_BASE_URL } from "../api";
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
      { to: "/support-desk", label: "Support Desk", icon: "🎧" },
      { to: "/settings", label: "Settings", icon: "⚙️" },
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
      { icon: "💳", text: `${stats.completed_count} completed payments`, time: "All time", type: "success" },
      { icon: "📱", text: `Mobile Money: ${fmt(stats.azampay_completed_total)}`, time: `${stats.azampay_completed_count} txns`, type: "info" },
      { icon: "🎟️", text: `Vouchers: ${fmt(stats.voucher_completed_total)}`, time: `${stats.voucher_completed_count} txns`, type: "info" },
      { icon: "⏳", text: `${stats.pending_count} pending payments`, time: fmt(stats.pending_total), type: "warning" },
      { icon: "✕", text: `${stats.failed_count} failed payments`, time: fmt(stats.failed_total), type: "error" },
    ];

    return (
      <div style={{
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
            <div className="user-card">
              <div className="user-avatar">{user?.business_name?.[0] || "U"}</div>
              <div className="user-info">
                <div className="user-name">{user?.business_name || "User"}</div>
                <div className="user-role">{user?.email || ""}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              <span style={{ fontSize: '1rem' }}>🚪</span>
              Logout
            </button>
          </div>
        </aside>
        {/* ===== MAIN ===== */}
        <div className="main-content">
          <header className="top-bar">
            <div className="top-bar-left">
              <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
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
                      <span className="activity-icon">{act.icon}</span>
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