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
      {/* Decorative background orbs */}
      <div style={{
        position: "fixed",
        top: "-20%",
        right: "-10%",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none",
        animation: "floatOrb 8s ease-in-out infinite",
        zIndex: 0,
      }} />
      <div style={{
        position: "fixed",
        bottom: "-15%",
        left: "-5%",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(229,9,20,0.05) 0%, transparent 70%)",
        borderRadius: "50%",
        pointerEvents: "none",
        animation: "floatOrb 10s ease-in-out infinite reverse",
        zIndex: 0,
      }} />

      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 5px rgba(229,9,20,0.3); }
          50% { box-shadow: 0 0 20px rgba(229,9,20,0.6); }
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          background: #000000;
          overflow-y: auto;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }

        /* ===== SIDEBAR ===== */
        .sidebar {
          width: 250px;
          min-height: 100vh;
          background: #000000;
          border-right: 1px solid #1a1a1a;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow-y: auto;
          animation: slideInLeft 0.5s ease-out;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 22px 20px;
          border-bottom: 1px solid #1a1a1a;
        }

        .sidebar-brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 4px;
          background: #e50914;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: #fff;
          flex-shrink: 0;
          font-weight: 900;
          letter-spacing: -1px;
        }

        .sidebar-brand-text h2 {
          font-size: 1.05rem;
          font-weight: 900;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.4px;
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
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .nav-section-label {
          font-size: 0.58rem;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 1.6px;
          font-weight: 800;
          padding: 14px 14px 6px 14px;
          margin: 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 4px;
          text-decoration: none;
          color: #b3b3b3;
          font-size: 0.82rem;
          font-weight: 500;
          transition: all 0.15s ease;
          position: relative;
          letter-spacing: 0.1px;
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
          width: 17px;
          height: 17px;
          fill: #737373;
          transition: fill 0.15s ease;
        }

        .nav-item:hover .nav-icon svg { fill: #ffffff; }

        .sidebar-footer {
          padding: 14px 12px;
          border-top: 1px solid #1a1a1a;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 4px;
          background: #0d0d0d;
          margin-bottom: 10px;
          border: 1px solid #1a1a1a;
        }

        .sidebar-user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: #e50914;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #fff;
          font-weight: 900;
          flex-shrink: 0;
        }

        .sidebar-user-info p {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 130px;
        }

        .sidebar-user-info span {
          font-size: 0.58rem;
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
          font-size: 0.7rem;
          font-weight: 800;
          font-family: inherit;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: all 0.15s ease;
        }

        .sidebar-logout:hover {
          background: #f6121d;
        }

        /* ===== MAIN ===== */
        .main-wrapper {
          margin-left: 250px;
          flex: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #000000;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: #000000;
          border-bottom: 1px solid #1a1a1a;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .topbar-left { display: flex; align-items: center; gap: 14px; }

        .topbar-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.2px;
        }

        .topbar-title span { color: #e50914; }

        .topbar-breadcrumb {
          font-size: 0.7rem;
          color: #666;
          margin-top: 2px;
          font-weight: 400;
          letter-spacing: 0.3px;
        }

        .topbar-right { display: flex; align-items: center; gap: 14px; }

        .topbar-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          color: #46d369;
          font-weight: 700;
          background: #0d0d0d;
          padding: 6px 12px;
          border-radius: 3px;
          border: 1px solid #1a1a1a;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #46d369;
          animation: pulseDot 2s ease-in-out infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .topbar-avatar {
          width: 34px;
          height: 34px;
          border-radius: 4px;
          background: #e50914;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #fff;
          font-weight: 900;
        }

        /* ===== CONTENT ===== */
        .content-area {
          flex: 1;
          padding: 28px 32px 32px;
          animation: fadeIn 0.4s ease-out;
          max-width: 1500px;
          width: 100%;
          margin: 0 auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 28px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 900;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.8px;
          line-height: 1.1;
        }

        .page-title span { color: #e50914; }

        .page-subtitle {
          font-size: 0.85rem;
          color: #808080;
          margin: 0;
          font-weight: 400;
        }

        .page-actions { display: flex; gap: 10px; }

        .btn-primary {
          padding: 10px 20px;
          background: #e50914;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 800;
          font-family: inherit;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary:hover {
          background: #f6121d;
        }

        .btn-ghost {
          padding: 10px 20px;
          background: transparent;
          color: #b3b3b3;
          border: 1px solid #333;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 800;
          font-family: inherit;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .btn-ghost:hover {
          background: #141414;
          border-color: #666;
          color: #fff;
        }

        /* ===== STATS ===== */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 6px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #e50914;
        }

        .stat-card:hover {
          border-color: #333;
          transform: translateY(-3px);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .stat-label {
          font-size: 0.65rem;
          color: #808080;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-weight: 800;
          margin: 0;
        }

        .stat-icon {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          background: #141414;
          border: 1px solid #1a1a1a;
        }

        .stat-value {
          font-size: 1.9rem;
          font-weight: 900;
          color: #ffffff;
          margin: 0 0 10px 0;
          letter-spacing: -1px;
          line-height: 1;
        }

        .stat-change {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 3px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .stat-change.up {
          color: #46d369;
          background: rgba(70, 211, 105, 0.08);
        }

        .stat-change.down {
          color: #e50914;
          background: rgba(229, 9, 20, 0.08);
        }

        .stat-change-label {
          color: #666;
          font-size: 0.65rem;
          font-weight: 500;
          margin-left: 6px;
          text-transform: none;
          letter-spacing: 0;
        }

        /* ===== GRID ===== */
        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }

        .panel {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 6px;
          padding: 22px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }

        .panel-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.1px;
          text-transform: uppercase;
        }

        .panel-subtitle {
          font-size: 0.68rem;
          color: #666;
          margin: 4px 0 0 0;
          font-weight: 400;
        }

        .panel-link {
          font-size: 0.68rem;
          color: #e50914;
          text-decoration: none;
          font-weight: 800;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          transition: color 0.15s;
        }

        .panel-link:hover { color: #f6121d; }

        /* ===== CHART ===== */
        .chart-container {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
          height: 200px;
          padding-top: 24px;
        }

        .chart-bar-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          height: 100%;
          justify-content: flex-end;
        }

        .chart-bar {
          width: 100%;
          max-width: 36px;
          border-radius: 3px 3px 0 0;
          background: #1f1f1f;
          border-top: 2px solid #333;
          transition: all 0.25s ease;
          position: relative;
          min-height: 4px;
          height: 4px !important;
        }

        .chart-bar:hover {
          background: #e50914;
          border-top-color: #e50914;
        }

        .chart-bar-label {
          font-size: 0.62rem;
          color: #666;
          font-weight: 700;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        /* ===== ACTIVITY ===== */
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 8px;
          border-radius: 4px;
          transition: background 0.15s;
        }

        .activity-item:hover { background: #141414; }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          background: #141414;
          border: 1px solid #1a1a1a;
          flex-shrink: 0;
          opacity: 0.6;
        }

        .activity-body { flex: 1; min-width: 0; }

        .activity-text {
          font-size: 0.78rem;
          color: #808080;
          margin: 0 0 3px 0;
          line-height: 1.4;
          font-weight: 500;
        }

        .activity-time {
          font-size: 0.63rem;
          color: #4d4d4d;
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* ===== QUICK ACTIONS ===== */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .menu-card {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 6px;
          padding: 18px 12px;
          text-align: center;
          text-decoration: none;
          color: #ffffff;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
          min-height: 100px;
          -webkit-tap-highlight-color: transparent;
        }

        .menu-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #141414;
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .menu-card:hover {
          transform: translateY(-4px);
          border-color: #e50914;
        }

        .menu-card:hover::before { opacity: 1; }

        .menu-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #141414;
          border: 1px solid #1a1a1a;
          transition: all 0.25s ease;
          z-index: 1;
        }

        .menu-card-icon svg {
          width: 19px;
          height: 19px;
          fill: #808080;
          transition: fill 0.25s ease;
        }

        .menu-card:hover .menu-card-icon {
          background: #e50914;
          border-color: #e50914;
        }

        .menu-card:hover .menu-card-icon svg { fill: #ffffff; }

        .menu-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #808080;
          margin: 0;
          line-height: 1.3;
          z-index: 1;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: color 0.25s;
        }

        .menu-card:hover .menu-label { color: #ffffff; }

        /* ===== FOOTER ===== */
        .footer-section {
          text-align: center;
          padding: 22px 16px;
          border-top: 1px solid #1a1a1a;
          margin-top: 32px;
        }

        .footer-text {
          margin: 0 0 6px 0;
          font-weight: 600;
          color: #666;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .footer-text strong {
          color: #e50914;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .footer-copyright {
          font-size: 0.62rem;
          color: #4d4d4d;
          margin: 0;
          letter-spacing: 0.4px;
        }

        /* ===== MOBILE ===== */
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

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1300px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .content-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 900px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open {
            transform: translateX(0);
            box-shadow: 6px 0 50px rgba(0, 0, 0, 0.9);
          }
          .main-wrapper { margin-left: 0; }
          .hamburger { display: block; }
          .sidebar-overlay { display: block; }
          .topbar { padding: 14px 18px; }
          .content-area { padding: 20px 18px; }
          .menu-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .menu-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .page-title { font-size: 1.35rem; }
          .stat-value { font-size: 1.5rem; }
          .content-area { padding: 16px 14px; }
          .topbar { padding: 12px 14px; }
          .topbar-title { font-size: 0.82rem; }
          .topbar-breadcrumb { display: none; }
          .page-actions { display: none; }
          .panel { padding: 16px; }
          .chart-container { height: 150px; }
        }

        @media (max-width: 400px) {
          .stat-card { padding: 14px 12px; }
          .stat-value { font-size: 1.25rem; }
          .stat-label { font-size: 0.58rem; }
          .stat-icon { width: 28px; height: 28px; font-size: 0.85rem; }
          .menu-card { min-height: 85px; padding: 14px 8px; }
          .menu-card-icon { width: 34px; height: 34px; }
          .menu-card-icon svg { width: 16px; height: 16px; }
          .menu-label { font-size: 0.65rem; }
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