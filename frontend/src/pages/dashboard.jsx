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
    { to: "/dashboard", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
    { to: "/income", label: "Revenue", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.79.72 1.49 1.97 1.49 1.28 0 1.72-.68 1.72-1.36 0-.83-.44-1.28-1.72-1.7-1.84-.58-3.67-1.13-3.67-3.44 0-1.71 1.24-2.83 2.83-3.21V4.5h2.67v1.94c1.66.36 2.77 1.5 2.88 3.09h-1.96c-.1-.79-.68-1.42-1.86-1.42-1.06 0-1.66.55-1.66 1.28 0 .74.55 1.13 1.72 1.53 1.86.6 3.67 1.19 3.67 3.55 0 1.79-1.24 2.94-2.87 3.62z" },
    { to: "/routers", label: "Routers", icon: "M12 21l-3-4h6l-3 4zm-6.36-6.36l1.41-1.41C8.66 11.62 10.24 11 12 11s3.34.62 4.95 2.23l1.41-1.41C16.37 9.83 14.28 9 12 9s-4.37.83-6.36 2.82zM2.93 11.93l1.41-1.41C6.31 8.55 9.02 7.5 12 7.5s5.69 1.05 7.66 3.02l1.41-1.41C18.66 6.7 15.49 5.5 12 5.5S5.34 6.7 2.93 9.09v2.84z" },
    { to: "/packages", label: "Packages", icon: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
    { to: "/vouchers", label: "Vouchers", icon: "M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 5.5h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2z" },
    { to: "/payments", label: "Payments", icon: "M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" },
    { to: "/withdrawals", label: "Withdrawals", icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" },
    { to: "/sessions", label: "Sessions", icon: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" },
    { to: "/customers", label: "Customers", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
    { to: "/branch", label: "Branches", icon: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" },
    { to: "/portal", label: "Portal", icon: "M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" },
    { to: "/settings", label: "Settings", icon: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" },
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
    }}>
      <style>{`
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          background: #000000;
          overflow-x: hidden;
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
                <svg viewBox="0 0 24 24"><path d={item.icon} /></svg>
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
                <svg viewBox="0 0 24 24"><path d={item.icon} /></svg>
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
                <svg viewBox="0 0 24 24"><path d={item.icon} /></svg>
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
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              ☰
            </button>
            <div>
              <h1 className="topbar-title">
                Welcome, <span>{user?.business_name || "Valued Partner"}</span>
              </h1>
              <p className="topbar-breadcrumb">Dashboard / Overview</p>
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-status">
              <span className="status-dot"></span>
              Online
            </div>
            <div className="topbar-avatar">
              {user?.business_name ? user.business_name.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        </header>

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
                    <svg viewBox="0 0 24 24"><path d={item.icon} /></svg>
                  </div>
                  <p className="menu-label">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="footer-section">
            <p className="footer-text">
              <strong>Net Kitonga</strong> — Internet & Billing Management
            </p>
            <p className="footer-copyright">
              © {new Date().getFullYear()} Net Kitonga. All rights reserved.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;