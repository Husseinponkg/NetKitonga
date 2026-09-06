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
      background: "#141414",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      padding: "0",
      margin: 0,
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          background: #141414;
          overflow-x: hidden;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(229, 9, 20, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(229, 9, 20, 0.2);
          }
        }

        .dashboard-container {
          max-width: 1440px;
          width: 100%;
          margin: 0 auto;
          padding: 16px 24px 12px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* Header */
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: rgba(20, 20, 20, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 2px solid #e50914;
          border-radius: 8px 8px 0 0;
          margin-bottom: 20px;
          animation: fadeInUp 0.6s ease-out;
          flex-wrap: wrap;
          gap: 10px;
          position: sticky;
          top: 0;
          z-index: 100;
          width: 100%;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .brand-icon {
          font-size: 1.8rem;
          filter: drop-shadow(0 0 20px rgba(229, 9, 20, 0.3));
          line-height: 1;
        }

        .brand-text h1 {
          font-size: 1.4rem;
          font-weight: 800;
          color: #e50914;
          margin: 0;
          letter-spacing: -0.5px;
          text-shadow: 0 0 30px rgba(229, 9, 20, 0.2);
          line-height: 1.2;
        }

        .brand-text p {
          font-size: 0.6rem;
          color: #808080;
          margin: 0;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .user-info {
          text-align: right;
          padding-right: 2px;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
        }

        .user-role {
          font-size: 0.65rem;
          color: #e50914;
          margin: 0;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          border-radius: 4px;
          background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: #ffffff;
          font-weight: 800;
          border: 2px solid rgba(229, 9, 20, 0.3);
          flex-shrink: 0;
        }

        .logout-btn {
          padding: 6px 16px;
          font-size: 0.7rem;
          font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          background: #e50914;
          color: #ffffff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .logout-btn:hover {
          background: #f40612;
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(229, 9, 20, 0.4);
        }

        .logout-btn:active {
          transform: scale(0.95);
        }

        /* Welcome Section */
        .welcome-section {
          margin-bottom: 20px;
          animation: slideInLeft 0.6s ease-out 0.1s both;
          padding: 0 2px;
        }

        .welcome-text {
          font-size: 1.4rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 4px 0;
          letter-spacing: -0.3px;
          line-height: 1.3;
        }

        .welcome-text span {
          color: #e50914;
        }

        .welcome-subtitle {
          font-size: 0.85rem;
          color: #808080;
          margin: 0;
          font-weight: 400;
          line-height: 1.4;
        }

        /* Menu Grid */
        .menu-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 24px;
          flex: 1;
          width: 100%;
        }

        .menu-card {
          background: rgba(30, 30, 30, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 4px;
          padding: 16px 10px;
          text-align: center;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
          position: relative;
          overflow: hidden;
          min-height: 100px;
          -webkit-tap-highlight-color: transparent;
        }

        .menu-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(229, 9, 20, 0.05), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .menu-card:hover::before {
          opacity: 1;
        }

        .menu-card:active {
          transform: scale(0.96);
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
        .menu-card:nth-child(11) { animation-delay: 0.55s; }

        .menu-card:hover {
          transform: translateY(-3px);
          border-color: rgba(229, 9, 20, 0.3);
          box-shadow: 0 8px 25px rgba(229, 9, 20, 0.12);
          background: rgba(35, 35, 35, 0.9);
        }

        .menu-icon {
          font-size: 2rem;
          transition: transform 0.3s ease;
          line-height: 1;
        }

        .menu-card:hover .menu-icon {
          transform: scale(1.1);
        }

        .menu-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #e5e5e5;
          margin: 0;
          line-height: 1.2;
        }

        .menu-card:hover .menu-label {
          color: #e50914;
        }

        /* Footer */
        .footer-section {
          text-align: center;
          padding: 16px 12px 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          color: #404040;
          font-size: 0.75rem;
          animation: fadeInUp 0.8s ease-out 0.3s both;
          margin-top: auto;
          width: 100%;
        }

        .footer-text {
          margin: 0 0 4px 0;
          font-weight: 400;
          color: #808080;
        }

        .footer-text strong {
          color: #e50914;
          font-weight: 700;
        }

        .footer-icons {
          font-size: 1rem;
          letter-spacing: 6px;
          display: block;
          margin-bottom: 4px;
          opacity: 0.4;
        }

        .footer-copyright {
          font-size: 0.6rem;
          color: #333;
          margin-top: 4px;
        }

        /* Status dot */
        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00ff88;
          margin-right: 4px;
          animation: pulseDot 2s ease-in-out infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        /* ====== RESPONSIVE GRID ====== */
        
        /* Default: 4 columns for large screens */
        .menu-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        /* Tablets & small laptops: 3 columns */
        @media (max-width: 1024px) {
          .dashboard-container {
            padding: 14px 20px 10px;
          }

          .menu-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }

          .menu-card {
            padding: 18px 12px;
            min-height: 110px;
          }

          .menu-icon {
            font-size: 2.2rem;
          }

          .welcome-text {
            font-size: 1.5rem;
          }
        }

        /* Tablets: 3 columns */
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 12px 16px 8px;
          }

          .header-section {
            padding: 10px 12px;
            flex-direction: row;
            gap: 8px;
            border-radius: 6px 6px 0 0;
          }

          .brand-icon {
            font-size: 1.5rem;
          }

          .brand-text h1 {
            font-size: 1.2rem;
          }

          .brand-text p {
            font-size: 0.55rem;
          }

          .header-right {
            gap: 8px;
          }

          .user-avatar {
            width: 34px;
            height: 34px;
            font-size: 0.85rem;
          }

          .user-name {
            font-size: 0.8rem;
          }

          .user-role {
            font-size: 0.6rem;
          }

          .logout-btn {
            padding: 5px 12px;
            font-size: 0.65rem;
          }

          .welcome-text {
            font-size: 1.3rem;
          }

          .welcome-subtitle {
            font-size: 0.8rem;
          }

          .menu-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }

          .menu-card {
            padding: 14px 8px;
            min-height: 95px;
            gap: 6px;
          }

          .menu-icon {
            font-size: 1.8rem;
          }

          .menu-label {
            font-size: 0.75rem;
          }

          .footer-text {
            font-size: 0.7rem;
          }
        }

        /* Mobile: 2 columns */
        @media (max-width: 480px) {
          .dashboard-container {
            padding: 8px 8px 4px;
          }

          .header-section {
            padding: 8px 10px;
            border-bottom-width: 1.5px;
            gap: 6px;
            margin-bottom: 12px;
            border-radius: 4px 4px 0 0;
          }

          .brand-icon {
            font-size: 1.3rem;
          }

          .brand-text h1 {
            font-size: 1rem;
          }

          .brand-text p {
            font-size: 0.5rem;
            letter-spacing: 0.5px;
          }

          .user-avatar {
            width: 30px;
            height: 30px;
            font-size: 0.75rem;
            border-width: 1.5px;
          }

          .user-name {
            font-size: 0.7rem;
          }

          .user-role {
            font-size: 0.55rem;
          }

          .logout-btn {
            padding: 4px 10px;
            font-size: 0.6rem;
          }

          .welcome-section {
            margin-bottom: 12px;
          }

          .welcome-text {
            font-size: 1rem;
          }

          .welcome-subtitle {
            font-size: 0.7rem;
          }

          .menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }

          .menu-card {
            padding: 12px 6px;
            min-height: 80px;
            gap: 5px;
            border-radius: 3px;
          }

          .menu-card:active {
            transform: scale(0.95);
          }

          .menu-icon {
            font-size: 1.5rem;
          }

          .menu-label {
            font-size: 0.65rem;
            font-weight: 600;
          }

          .footer-section {
            padding: 10px 6px 4px;
          }

          .footer-text {
            font-size: 0.6rem;
          }

          .footer-icons {
            font-size: 0.8rem;
            letter-spacing: 3px;
          }

          .footer-copyright {
            font-size: 0.55rem;
          }

          .status-dot {
            width: 5px;
            height: 5px;
          }
        }

        /* Very small phones: 2 columns with smaller cards */
        @media (max-width: 360px) {
          .dashboard-container {
            padding: 6px 6px 4px;
          }

          .header-section {
            padding: 6px 8px;
            gap: 4px;
          }

          .brand-icon {
            font-size: 1.1rem;
          }

          .brand-text h1 {
            font-size: 0.85rem;
          }

          .brand-text p {
            font-size: 0.45rem;
          }

          .user-avatar {
            width: 26px;
            height: 26px;
            font-size: 0.65rem;
          }

          .user-name {
            font-size: 0.65rem;
          }

          .user-role {
            font-size: 0.5rem;
          }

          .logout-btn {
            padding: 3px 8px;
            font-size: 0.55rem;
          }

          .welcome-text {
            font-size: 0.85rem;
          }

          .welcome-subtitle {
            font-size: 0.6rem;
          }

          .menu-grid {
            gap: 6px;
          }

          .menu-card {
            padding: 10px 4px;
            min-height: 65px;
            gap: 4px;
          }

          .menu-icon {
            font-size: 1.2rem;
          }

          .menu-label {
            font-size: 0.55rem;
          }

          .footer-text {
            font-size: 0.55rem;
          }

          .footer-icons {
            font-size: 0.7rem;
            letter-spacing: 2px;
          }
        }

        /* Landscape phones */
        @media (max-height: 600px) and (orientation: landscape) {
          .dashboard-container {
            padding: 6px 16px 4px;
          }

          .header-section {
            padding: 6px 12px;
            margin-bottom: 10px;
          }

          .menu-grid {
            gap: 6px;
            margin-bottom: 12px;
          }

          .menu-card {
            padding: 8px 6px;
            min-height: 60px;
          }

          .menu-icon {
            font-size: 1.2rem;
          }

          .menu-label {
            font-size: 0.6rem;
          }

          .welcome-text {
            font-size: 0.9rem;
          }

          .welcome-subtitle {
            font-size: 0.65rem;
          }

          .welcome-section {
            margin-bottom: 8px;
          }

          .footer-section {
            padding: 6px 8px 2px;
          }

          .brand-icon {
            font-size: 1.2rem;
          }

          .brand-text h1 {
            font-size: 1rem;
          }

          .user-avatar {
            width: 28px;
            height: 28px;
            font-size: 0.7rem;
          }
        }

        /* Touch devices - remove hover effects on touch */
        @media (hover: none) {
          .menu-card:hover {
            transform: none;
            border-color: rgba(255, 255, 255, 0.06);
            box-shadow: none;
            background: rgba(30, 30, 30, 0.8);
          }

          .menu-card:hover .menu-label {
            color: #e5e5e5;
          }

          .menu-card:hover .menu-icon {
            transform: none;
          }

          .logout-btn:hover {
            transform: none;
            box-shadow: none;
          }
        }

        /* High DPI screens */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .menu-card {
            border-width: 0.5px;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Header */}
        <div className="header-section">
          <div className="brand-section">
            <span className="brand-icon">▶</span>
            <div className="brand-text">
              <h1>Net Kitonga</h1>
              <p>Internet Supply Co.</p>
            </div>
          </div>

          <div className="header-right">
            <div className="user-info">
              <p className="user-name">
                <span className="status-dot"></span>
                {user?.business_name || "Guest"}
              </p>
              <p className="user-role">✦ Network Provider</p>
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
            Welcome back, <span>{user?.business_name || "Valued Partner"}</span>
          </p>
          <p className="welcome-subtitle">
            Manage your internet services and network infrastructure
          </p>
        </div>

        {/* Menu Grid */}
        <div className="menu-grid">
          <Link to="/income" className="menu-card">
            <span className="menu-icon">💰</span>
            <p className="menu-label">Revenue</p>
          </Link>

          <Link to="/routers" className="menu-card">
            <span className="menu-icon">📡</span>
            <p className="menu-label">Routers</p>
          </Link>

          <Link to="/packages" className="menu-card">
            <span className="menu-icon">📦</span>
            <p className="menu-label">Packages</p>
          </Link>

          <Link to="/vouchers" className="menu-card">
            <span className="menu-icon">🎟️</span>
            <p className="menu-label">Vouchers</p>
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
            <strong>Net Kitonga</strong> — Your trusted internet supply partner
          </p>
          <span className="footer-icons">📶 🖥️ 🌍 📱</span>
          <p className="footer-copyright">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;