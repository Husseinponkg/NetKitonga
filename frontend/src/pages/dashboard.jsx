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
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
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
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
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

        @keyframes shimmer {
          0% {
            box-shadow: 0 0 0 rgba(220, 20, 31, 0);
          }
          50% {
            box-shadow: 0 0 15px rgba(220, 20, 31, 0.2);
          }
          100% {
            box-shadow: 0 0 0 rgba(220, 20, 31, 0);
          }
        }

        .dashboard-container {
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          padding: 20px 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* ========== HEADER ========== */
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 28px;
          background: rgba(15, 15, 15, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(220, 20, 31, 0.15);
          border-radius: 12px;
          margin-bottom: 28px;
          animation: fadeInUp 0.6s ease-out;
          flex-wrap: wrap;
          gap: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }

        .header-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(220, 20, 31, 0.3), transparent);
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .brand-icon {
          font-size: 2.2rem;
          filter: drop-shadow(0 0 10px rgba(220, 20, 31, 0.4));
          line-height: 1;
          background: linear-gradient(135deg, #dc141f 0%, #ff4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-text h1 {
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .brand-text p {
          font-size: 0.75rem;
          color: #888888;
          margin: 4px 0 0 0;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .user-info {
          text-align: right;
          padding-right: 4px;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          line-height: 1.3;
        }

        .user-role {
          font-size: 0.7rem;
          color: #dc141f;
          margin: 2px 0 0 0;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: linear-gradient(135deg, #dc141f 0%, #b20a18 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: #ffffff;
          font-weight: 800;
          border: 2px solid rgba(220, 20, 31, 0.4);
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(220, 20, 31, 0.25);
        }

        .logout-btn {
          padding: 8px 20px;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #dc141f 0%, #ff3333 100%);
          color: #ffffff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          letter-spacing: 0.6px;
          text-transform: uppercase;
          white-space: nowrap;
          flex-shrink: 0;
          box-shadow: 0 4px 15px rgba(220, 20, 31, 0.3);
        }

        .logout-btn:hover {
          background: linear-gradient(135deg, #ff3333 0%, #ff5555 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(220, 20, 31, 0.5);
        }

        .logout-btn:active {
          transform: translateY(0);
        }

        /* ========== WELCOME SECTION ========== */
        .welcome-section {
          margin-bottom: 32px;
          animation: slideInLeft 0.6s ease-out 0.1s both;
        }

        .welcome-text {
          font-size: 1.8rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
          line-height: 1.3;
        }

        .welcome-text span {
          background: linear-gradient(135deg, #dc141f 0%, #ff4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-subtitle {
          font-size: 0.95rem;
          color: #999999;
          margin: 0;
          font-weight: 400;
          line-height: 1.5;
        }

        /* ========== MENU GRID ========== */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
          flex: 1;
          width: 100%;
        }

        .menu-card {
          background: rgba(20, 20, 20, 0.6);
          border: 1.5px solid rgba(220, 20, 31, 0.1);
          border-radius: 10px;
          padding: 22px 16px;
          text-align: center;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          animation: fadeInUp 0.6s ease-out;
          animation-fill-mode: both;
          position: relative;
          overflow: hidden;
          min-height: 120px;
          -webkit-tap-highlight-color: transparent;
          backdrop-filter: blur(4px);
        }

        .menu-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(220, 20, 31, 0.08), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .menu-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(220, 20, 31, 0.2), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .menu-card:hover::before,
        .menu-card:hover::after {
          opacity: 1;
        }

        .menu-card:hover {
          transform: translateY(-6px);
          border-color: rgba(220, 20, 31, 0.4);
          box-shadow: 0 12px 35px rgba(220, 20, 31, 0.18);
          background: rgba(25, 25, 25, 0.8);
        }

        .menu-card:active {
          transform: translateY(-2px);
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

        .menu-icon {
          font-size: 2.4rem;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .menu-card:hover .menu-icon {
          transform: scale(1.15) translateY(-2px);
        }

        .menu-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #d0d0d0;
          margin: 0;
          line-height: 1.3;
          letter-spacing: 0.2px;
        }

        .menu-card:hover .menu-label {
          color: #dc141f;
          font-weight: 800;
        }

        /* ========== FOOTER ========== */
        .footer-section {
          text-align: center;
          padding: 20px 16px;
          border-top: 1px solid rgba(220, 20, 31, 0.1);
          color: #404040;
          font-size: 0.8rem;
          animation: fadeInUp 0.8s ease-out 0.3s both;
          margin-top: auto;
          width: 100%;
          background: rgba(15, 15, 15, 0.4);
          border-radius: 8px;
        }

        .footer-text {
          margin: 0 0 6px 0;
          font-weight: 500;
          color: #888888;
          font-size: 0.9rem;
        }

        .footer-text strong {
          color: #dc141f;
          font-weight: 800;
        }

        .footer-icons {
          font-size: 1.2rem;
          letter-spacing: 8px;
          display: block;
          margin: 6px 0;
          opacity: 0.5;
        }

        .footer-copyright {
          font-size: 0.7rem;
          color: #555555;
          margin-top: 6px;
          font-weight: 400;
        }

        /* Status dot */
        .status-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00ff88;
          margin-right: 5px;
          animation: pulseDot 2.5s ease-in-out infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        /* ========== RESPONSIVE ========== */
        
        @media (max-width: 1200px) {
          .menu-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
          }

          .dashboard-container {
            padding: 18px 20px;
          }

          .menu-card {
            padding: 20px 14px;
            min-height: 115px;
            gap: 8px;
          }

          .menu-icon {
            font-size: 2.2rem;
          }

          .welcome-text {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 14px 16px;
          }

          .header-section {
            padding: 16px 20px;
            flex-direction: row;
            gap: 12px;
            margin-bottom: 20px;
          }

          .brand-icon {
            font-size: 1.8rem;
          }

          .brand-text h1 {
            font-size: 1.3rem;
          }

          .brand-text p {
            font-size: 0.65rem;
          }

          .header-right {
            gap: 12px;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
            font-size: 0.9rem;
          }

          .user-name {
            font-size: 0.85rem;
          }

          .user-role {
            font-size: 0.65rem;
          }

          .logout-btn {
            padding: 6px 14px;
            font-size: 0.7rem;
          }

          .welcome-text {
            font-size: 1.4rem;
          }

          .welcome-subtitle {
            font-size: 0.85rem;
          }

          .menu-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .menu-card {
            padding: 16px 12px;
            min-height: 105px;
            gap: 6px;
            border-radius: 8px;
          }

          .menu-icon {
            font-size: 2rem;
          }

          .menu-label {
            font-size: 0.75rem;
          }

          .footer-text {
            font-size: 0.8rem;
          }

          .welcome-section {
            margin-bottom: 24px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 10px 12px;
          }

          .header-section {
            padding: 12px 16px;
            border-bottom-width: 1px;
            gap: 8px;
            margin-bottom: 16px;
            border-radius: 8px;
          }

          .brand-icon {
            font-size: 1.5rem;
          }

          .brand-text h1 {
            font-size: 1.1rem;
          }

          .brand-text p {
            font-size: 0.6rem;
            letter-spacing: 0.8px;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
            font-size: 0.8rem;
            border-width: 1.5px;
          }

          .user-name {
            font-size: 0.75rem;
          }

          .user-role {
            font-size: 0.6rem;
          }

          .logout-btn {
            padding: 5px 10px;
            font-size: 0.65rem;
          }

          .welcome-section {
            margin-bottom: 16px;
          }

          .welcome-text {
            font-size: 1.1rem;
          }

          .welcome-subtitle {
            font-size: 0.75rem;
          }

          .menu-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }

          .menu-card {
            padding: 14px 10px;
            min-height: 90px;
            gap: 5px;
            border-radius: 6px;
          }

          .menu-icon {
            font-size: 1.6rem;
          }

          .menu-label {
            font-size: 0.7rem;
            font-weight: 700;
          }

          .footer-section {
            padding: 12px 10px;
          }

          .footer-text {
            font-size: 0.7rem;
          }

          .footer-icons {
            font-size: 1rem;
            letter-spacing: 4px;
          }

          .footer-copyright {
            font-size: 0.6rem;
          }

          .status-dot {
            width: 6px;
            height: 6px;
          }
        }

        @media (max-width: 360px) {
          .dashboard-container {
            padding: 8px 10px;
          }

          .header-section {
            padding: 10px 12px;
            gap: 6px;
          }

          .brand-icon {
            font-size: 1.3rem;
          }

          .brand-text h1 {
            font-size: 0.95rem;
          }

          .brand-text p {
            font-size: 0.55rem;
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.7rem;
          }

          .user-name {
            font-size: 0.7rem;
          }

          .user-role {
            font-size: 0.55rem;
          }

          .logout-btn {
            padding: 4px 8px;
            font-size: 0.6rem;
          }

          .welcome-text {
            font-size: 0.95rem;
          }

          .welcome-subtitle {
            font-size: 0.65rem;
          }

          .menu-grid {
            gap: 8px;
          }

          .menu-card {
            padding: 12px 8px;
            min-height: 75px;
            gap: 4px;
          }

          .menu-icon {
            font-size: 1.3rem;
          }

          .menu-label {
            font-size: 0.6rem;
          }

          .footer-text {
            font-size: 0.65rem;
          }

          .footer-icons {
            font-size: 0.8rem;
            letter-spacing: 2px;
          }
        }

        @media (max-height: 600px) and (orientation: landscape) {
          .dashboard-container {
            padding: 8px 16px;
          }

          .header-section {
            padding: 10px 16px;
            margin-bottom: 12px;
          }

          .menu-grid {
            gap: 8px;
            margin-bottom: 14px;
          }

          .menu-card {
            padding: 10px 8px;
            min-height: 65px;
            gap: 4px;
          }

          .menu-icon {
            font-size: 1.4rem;
          }

          .menu-label {
            font-size: 0.65rem;
          }

          .welcome-text {
            font-size: 1rem;
          }

          .welcome-subtitle {
            font-size: 0.7rem;
          }

          .welcome-section {
            margin-bottom: 8px;
          }

          .footer-section {
            padding: 8px 10px;
          }

          .brand-icon {
            font-size: 1.4rem;
          }

          .brand-text h1 {
            font-size: 1.05rem;
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
          }
        }

        @media (hover: none) {
          .menu-card:hover {
            transform: none;
            border-color: rgba(220, 20, 31, 0.1);
            box-shadow: 0 4px 15px rgba(220, 20, 31, 0.08);
            background: rgba(20, 20, 20, 0.6);
          }

          .menu-card:hover .menu-label {
            color: #d0d0d0;
          }

          .menu-card:hover .menu-icon {
            transform: none;
          }

          .logout-btn:hover {
            transform: none;
            box-shadow: 0 4px 15px rgba(220, 20, 31, 0.3);
          }
        }

        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .menu-card {
            border-width: 1px;
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
            Manage your internet services, billing, and network infrastructure
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
            <strong>Net Kitonga</strong> — Professional Internet & Billing Management
          </p>
          <span className="footer-icons">📶 🖥️ 🌍 📱</span>
          <p className="footer-copyright">
            © {new Date().getFullYear()} All rights reserved. Your trusted billing partner.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;