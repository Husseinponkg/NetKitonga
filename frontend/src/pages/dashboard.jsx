import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("tenantUser") || "null");

  const logout = () => {
    localStorage.removeItem("tenantUser");
    navigate("/");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      padding: "0",
      margin: 0,
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          animation: fadeIn 0.6s ease-out;
        }

        /* Header Styles */
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-icon {
          font-size: 2.2rem;
        }

        .brand-text h1 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .brand-text p {
          font-size: 0.85rem;
          color: #b3b3b3;
          margin: 4px 0 0 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .user-info {
          text-align: right;
        }

        .user-name {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .user-role {
          font-size: 0.85rem;
          color: #b3b3b3;
          margin: 2px 0 0 0;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: #ffffff;
          font-weight: 700;
        }

        .logout-btn {
          padding: 8px 20px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(229, 9, 20, 0.35);
          background: linear-gradient(135deg, #f20916 0%, #d40a16 100%);
        }

        .logout-btn:active {
          transform: translateY(0);
        }

        /* Welcome Section */
        .welcome-section {
          margin-bottom: 32px;
          animation: slideIn 0.6s ease-out 0.1s both;
        }

        .welcome-text {
          font-size: 1.4rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 8px 0;
        }

        .welcome-subtitle {
          font-size: 0.95rem;
          color: #b3b3b3;
          margin: 0;
        }

        /* Menu Grid */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }

        .menu-card {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 20px 16px;
          text-align: center;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          animation: fadeIn 0.6s ease-out;
          animation-fill-mode: both;
        }

        .menu-card:nth-child(1) { animation-delay: 0.05s; }
        .menu-card:nth-child(2) { animation-delay: 0.10s; }
        .menu-card:nth-child(3) { animation-delay: 0.15s; }
        .menu-card:nth-child(4) { animation-delay: 0.20s; }
        .menu-card:nth-child(5) { animation-delay: 0.25s; }
        .menu-card:nth-child(6) { animation-delay: 0.30s; }
        .menu-card:nth-child(7) { animation-delay: 0.35s; }
        .menu-card:nth-child(8) { animation-delay: 0.40s; }
        .menu-card:nth-child(9) { animation-delay: 0.45s; }
        .menu-card:nth-child(10) { animation-delay: 0.50s; }

        .menu-card:hover {
          background: rgba(30, 30, 30, 1);
          border-color: rgba(229, 9, 20, 0.5);
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(229, 9, 20, 0.2);
        }

        .menu-card:active {
          transform: translateY(-2px);
        }

        .menu-icon {
          font-size: 2rem;
        }

        .menu-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #e5e5e5;
          margin: 0;
          white-space: nowrap;
        }

        /* Footer */
        .footer-section {
          text-align: center;
          padding: 24px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #808080;
          font-size: 0.85rem;
          animation: fadeIn 0.8s ease-out 0.3s both;
        }

        .footer-text {
          margin: 0 0 8px 0;
        }

        .footer-icons {
          font-size: 1rem;
          letter-spacing: 4px;
          display: block;
          margin-bottom: 8px;
          opacity: 0.6;
        }

        .footer-copyright {
          font-size: 0.75rem;
          color: #666;
          margin-top: 8px;
        }

        /* Tablet Responsive */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }

          .header-section {
            flex-direction: column;
            align-items: flex-start;
            margin-bottom: 32px;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .user-info {
            text-align: left;
          }

          .welcome-text {
            font-size: 1.2rem;
          }

          .menu-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }

          .menu-card {
            padding: 16px 12px;
          }

          .menu-icon {
            font-size: 1.6rem;
          }

          .menu-label {
            font-size: 0.8rem;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .dashboard-container {
            padding: 12px;
          }

          .header-section {
            flex-direction: column;
            gap: 12px;
            margin-bottom: 24px;
          }

          .brand-text h1 {
            font-size: 1.4rem;
          }

          .brand-text p {
            font-size: 0.75rem;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }

          .user-info {
            text-align: left;
          }

          .user-name {
            font-size: 0.9rem;
          }

          .user-role {
            font-size: 0.75rem;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }

          .logout-btn {
            padding: 6px 14px;
            font-size: 0.8rem;
            white-space: nowrap;
          }

          .welcome-section {
            margin-bottom: 24px;
          }

          .welcome-text {
            font-size: 1rem;
          }

          .welcome-subtitle {
            font-size: 0.85rem;
          }

          .menu-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 32px;
          }

          .menu-card {
            padding: 14px 10px;
            gap: 6px;
          }

          .menu-icon {
            font-size: 1.4rem;
          }

          .menu-label {
            font-size: 0.75rem;
          }

          .footer-section {
            padding: 16px 12px;
          }

          .footer-text {
            font-size: 0.75rem;
          }

          .footer-icons {
            font-size: 0.9rem;
            letter-spacing: 2px;
          }
        }

        /* Extra small devices */
        @media (max-width: 360px) {
          .brand-text h1 {
            font-size: 1.2rem;
          }

          .menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .menu-label {
            font-size: 0.7rem;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header */}
        <div className="header-section">
          <div className="brand-section">
            <span className="brand-icon">🏨</span>
            <div className="brand-text">
              <h1>Net Kitonga</h1>
              <p>Hotspot Supply Co.</p>
            </div>
          </div>

          <div className="header-right">
            <div className="user-info">
              <p className="user-name">{user?.business_name || "Guest"}</p>
              <p className="user-role">Business Owner</p>
            </div>
            <div className="user-avatar">
              {user?.business_name ? user.business_name.charAt(0).toUpperCase() : "?"}
            </div>
            <button type="button" className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <p className="welcome-text">
            Welcome back, {user?.business_name || "Valued Partner"}
          </p>
          <p className="welcome-subtitle">
            Manage your hotspot supplies and grow your business
          </p>
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          <Link to="/income" className="menu-card">
            <span className="menu-icon">💰</span>
            <p className="menu-label">Income</p>
          </Link>

          <Link to="/routers" className="menu-card">
            <span className="menu-icon">📡</span>
            <p className="menu-label">Routers</p>
          </Link>

          <Link to="/packages" className="menu-card">
            <span className="menu-icon">📦</span>
            <p className="menu-label">Packages</p>
          </Link>

          <Link to="/payments" className="menu-card">
            <span className="menu-icon">💳</span>
            <p className="menu-label">Payments</p>
          </Link>

          <Link to="/withdrawals" className="menu-card">
            <span className="menu-icon">🏦</span>
            <p className="menu-label">Withdrawals</p>
          </Link>

          <Link to="/sessions" className="menu-card">
            <span className="menu-icon">🕐</span>
            <p className="menu-label">Sessions</p>
          </Link>

          <Link to="/customers" className="menu-card">
            <span className="menu-icon">👥</span>
            <p className="menu-label">Customers</p>
          </Link>

          <Link to="/branch" className="menu-card">
            <span className="menu-icon">🏪</span>
            <p className="menu-label">Branches</p>
          </Link>

          <Link to="/portal" className="menu-card">
            <span className="menu-icon">🚪</span>
            <p className="menu-label">Portal</p>
          </Link>

          <Link to="/settings" className="menu-card">
            <span className="menu-icon">⚙️</span>
            <p className="menu-label">Settings</p>
          </Link>
        </div>

        {/* Footer */}
        <div className="footer-section">
          <p className="footer-text">
            Net Kitonga — Your trusted hotispot supply partner
          </p>
          <span className="footer-icons">🍽️ 🛏️ 🧴 🍷</span>
          <p className="footer-copyright">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;