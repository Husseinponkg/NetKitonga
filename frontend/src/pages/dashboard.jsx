  import React, { useState } from "react";
  import { Link, useNavigate, useLocation } from "react-router-dom";

  function Dashboard() {
    console.log("Dashboard rendered");
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const user = JSON.parse(localStorage.getItem("tenantUser") || "null");
    console.log("Dashboard user:", user);

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

    const stats = [
      { label: "Total Revenue", value: "0", trend: "up", change: "0%" },
      { label: "Active Routers", value: "0", trend: "up", change: "0%" },
      { label: "Total Customers", value: "0", trend: "up", change: "0%" },
      { label: "Active Sessions", value: "0", trend: "down", change: "0%" },
    ];

    const monthlyRevenue = [
      { month: "Jan", value: 0 },
      { month: "Feb", value: 0 },
      { month: "Mar", value: 0 },
      { month: "Apr", value: 0 },
      { month: "May", value: 0 },
      { month: "Jun", value: 0 },
      { month: "Jul", value: 0 },
      { month: "Aug", value: 0 },
      { month: "Sep", value: 0 },
    ];

    const recentActivity = [
      { icon: "💳", text: "No recent payments", time: "—", type: "muted" },
      { icon: "📡", text: "No router activity", time: "—", type: "muted" },
      { icon: "👥", text: "No new customers", time: "—", type: "muted" },
      { icon: "🏦", text: "No withdrawals processed", time: "—", type: "muted" },
      { icon: "🎟️", text: "No vouchers generated", time: "—", type: "muted" },
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
          <main className="content-area">
            {/* Page Header */}
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  Business <span>Overview</span>
                </h1>
                <p className="page-subtitle">
                  Real-time performance metrics across your network infrastructure
                </p>
              </div>
              <div className="page-actions">
                <Link to="/income" className="btn-ghost">View Reports</Link>
                <Link to="/packages" className="btn-primary">+ New Package</Link>
              </div>
            </div>

            {/* Stat Cards – all zeros */}
            <div className="stats-grid">
              {stats.map((stat, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-header">
                    <p className="stat-label">{stat.label}</p>
                    <div className="stat-icon">
                      {i === 0 && "💰"}
                      {i === 1 && "📡"}
                      {i === 2 && "👥"}
                      {i === 3 && "🕐"}
                    </div>
                  </div>
                  <p className="stat-value">{stat.value}</p>
                  <span className={`stat-change ${stat.trend}`}>
                    {stat.trend === "up" ? "▲" : "▼"} {stat.change}
                    <span className="stat-change-label">vs last month</span>
                  </span>
                </div>
              ))}
            </div>

            {/* Chart + Activity */}
            <div className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Revenue Performance</h3>
                    <p className="panel-subtitle">Monthly revenue trend</p>
                  </div>
                  <Link to="/income" className="panel-link">View →</Link>
                </div>
                <div className="chart-container">
                  {monthlyRevenue.map((item, i) => (
                    <div className="chart-bar-wrapper" key={i}>
                      <div className="chart-bar" />
                      <span className="chart-bar-label">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Recent Activity</h3>
                    <p className="panel-subtitle">Live updates</p>
                  </div>
                </div>
                <div className="activity-list">
                  {recentActivity.map((activity, i) => (
                    <div className="activity-item" key={i}>
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-body">
                        <p className="activity-text">{activity.text}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="panel" style={{ marginBottom: "24px" }}>
              <div className="panel-header">
                <div>
                  <h3 className="panel-title">Quick Actions</h3>
                  <p className="panel-subtitle">Jump straight into your tools</p>
                </div>
              </div>
              <div className="menu-grid">
                {navItems.slice(1).map((item) => (
                  <Link key={item.to} to={item.to} className="menu-card">
                    <div className="menu-card-icon">
                      <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{item.icon}</span>
                    </div>
                    <p className="menu-label">{item.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer */}
  <div className="footer-section">
    <p className="footer-text">
      <strong>fontwandell co tz 2026</strong>
    </p>
  </div>
          </main>
        </div>
      </div>
    );
  }

  export default Dashboard;
