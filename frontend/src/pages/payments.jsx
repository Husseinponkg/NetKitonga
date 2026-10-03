import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function Payments() {
	const navigate = useNavigate();
	const location = useLocation();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const [paymentList, setPaymentList] = useState([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [loading, setLoading] = useState(true);

	const user = getStoredTenantUser();

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

	const getSessionTenantId = () => getTenantId();

	useEffect(() => {
		const fetchPayments = async () => {
			try {
				setLoading(true);
				const tenantId = getSessionTenantId();
				if (!tenantId) {
					setErrorMessage("Tenant session is missing. Please login again.");
					setLoading(false);
					return;
				}
				const response = await fetch(`${API_BASE_URL}/payments/history?tenant_id=${tenantId}`);
				if (!response.ok) throw new Error("Unable to load payment history.");
				setPaymentList(await response.json());
				setErrorMessage("");
			} catch (error) {
				setErrorMessage(error.message);
			} finally {
				setLoading(false);
			}
		};

		fetchPayments();
	}, []);

	const formatCurrency = (amount) => {
		return `TZS ${Number(amount).toLocaleString()}`;
	};

	const getStatusClass = (status) => {
		const statusMap = {
			'completed': 'status-completed',
			'pending': 'status-pending',
			'failed': 'status-failed',
			'cancelled': 'status-cancelled',
			'refunded': 'status-refunded'
		};
		return statusMap[status?.toLowerCase()] || 'status-default';
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	return (
		<div className="payments-root">
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

				.payments-root {
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

				/* ===== MESSAGE ===== */
				.message-box {
					padding: 12px 16px;
					margin-bottom: 18px;
					border-radius: 4px;
					font-weight: 700;
					font-size: 0.8rem;
					display: flex;
					align-items: center;
					gap: 8px;
					animation: fadeIn 0.3s ease-out;
				}

				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(-6px); }
					to { opacity: 1; transform: translateY(0); }
				}

				.message-error {
					background: rgba(229, 9, 20, 0.08);
					border: 1px solid rgba(229, 9, 20, 0.25);
					color: #ff5252;
				}

				.message-loading {
					background: rgba(70, 211, 105, 0.08);
					border: 1px solid rgba(70, 211, 105, 0.2);
					color: #46d369;
				}

				/* ===== TABLE SECTION ===== */
				.table-section {
					background: #0d0d0d;
					border: 1px solid #1a1a1a;
					border-radius: 6px;
					padding: 20px;
					min-width: 0;
				}

				.table-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 16px;
					flex-wrap: wrap;
					gap: 10px;
					padding-bottom: 12px;
					border-bottom: 1px solid #1a1a1a;
				}

				.table-header h3 {
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

				.payment-count {
					font-size: 0.65rem;
					color: #666;
					background: #141414;
					padding: 4px 12px;
					border-radius: 3px;
					font-weight: 700;
					letter-spacing: 0.6px;
					text-transform: uppercase;
					border: 1px solid #1a1a1a;
				}

				.table-wrapper {
					overflow-x: auto;
					-webkit-overflow-scrolling: touch;
					border-radius: 4px;
					border: 1px solid #1a1a1a;
				}

				.table-wrapper::-webkit-scrollbar { height: 6px; }
				.table-wrapper::-webkit-scrollbar-track { background: #000; }
				.table-wrapper::-webkit-scrollbar-thumb { background: #262626; border-radius: 3px; }

				table {
					width: 100%;
					border-collapse: collapse;
					font-size: 0.82rem;
					min-width: 720px;
				}

				thead tr { background: #000000; }

				thead th {
					padding: 11px 14px;
					text-align: left;
					font-weight: 900;
					color: #666;
					font-size: 0.62rem;
					text-transform: uppercase;
					letter-spacing: 1.2px;
					white-space: nowrap;
					border-bottom: 1px solid #1a1a1a;
				}

				tbody tr {
					border-bottom: 1px solid #141414;
					transition: background 0.15s ease;
				}

				tbody tr:last-child { border-bottom: none; }
				tbody tr:hover { background: #121212; }

				tbody td {
					padding: 11px 14px;
					color: #e5e5e5;
					vertical-align: middle;
				}

				.reference-code {
					font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
					font-size: 0.7rem;
					background: #141414;
					padding: 3px 8px;
					border-radius: 3px;
					color: #b3b3b3;
					word-break: break-all;
					border: 1px solid #1f1f1f;
					display: inline-block;
				}

				.customer-mac {
					font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
					font-size: 0.7rem;
					color: #808080;
				}

				.amount-value {
					font-weight: 900;
					color: #e50914;
					font-size: 0.82rem;
					white-space: nowrap;
				}

				.gateway-badge {
					display: inline-block;
					padding: 3px 10px;
					border-radius: 3px;
					font-size: 0.6rem;
					font-weight: 900;
					background: #141414;
					color: #b3b3b3;
					text-transform: uppercase;
					letter-spacing: 0.8px;
					border: 1px solid #1f1f1f;
				}

				.status-badge {
					display: inline-block;
					padding: 3px 10px;
					border-radius: 3px;
					font-size: 0.6rem;
					font-weight: 900;
					text-transform: uppercase;
					letter-spacing: 0.8px;
					white-space: nowrap;
				}

				.status-completed {
					background: rgba(70, 211, 105, 0.12);
					color: #46d369;
				}

				.status-pending {
					background: rgba(251, 192, 45, 0.12);
					color: #fbc02d;
				}

				.status-failed {
					background: rgba(229, 9, 20, 0.12);
					color: #ff5252;
				}

				.status-cancelled {
					background: rgba(158, 158, 158, 0.12);
					color: #bdbdbd;
				}

				.status-refunded {
					background: rgba(100, 149, 237, 0.12);
					color: #6495ed;
				}

				.status-default {
					background: rgba(255, 255, 255, 0.05);
					color: #808080;
				}

				.date-time {
					font-size: 0.7rem;
					color: #808080;
					white-space: nowrap;
					font-family: 'SF Mono', 'Monaco', monospace;
				}

				/* ===== EMPTY ===== */
				.empty-state {
					text-align: center;
					padding: 50px 20px;
					color: #808080;
				}

				.empty-state .empty-icon {
					font-size: 2.6rem;
					margin-bottom: 12px;
					display: block;
					opacity: 0.35;
				}

				.empty-state p {
					margin: 0;
					font-size: 0.85rem;
					color: #b3b3b3;
					font-weight: 800;
					text-transform: uppercase;
					letter-spacing: 0.4px;
				}

				.empty-state .sub-text {
					margin-top: 8px;
					font-size: 0.72rem;
					color: #666;
					font-weight: 400;
					text-transform: none;
					letter-spacing: 0;
				}

				/* ============================================================
				   RESPONSIVE
				   ============================================================ */

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

					.message-box { padding: 10px 12px; font-size: 0.75rem; margin-bottom: 14px; }

					.table-section { padding: 16px; }

					.table-header { flex-direction: column; align-items: flex-start; }
					.table-header h3 { font-size: 0.82rem; }
					.count-badge { font-size: 0.62rem; padding: 2px 8px; }
					.payment-count { font-size: 0.6rem; padding: 3px 8px; }

					table { min-width: 620px; font-size: 0.75rem; }
					thead th { padding: 9px 11px; font-size: 0.58rem; }
					tbody td { padding: 9px 11px; }

					.reference-code { font-size: 0.62rem; padding: 2px 6px; }
					.customer-mac { font-size: 0.62rem; }
					.amount-value { font-size: 0.72rem; }
					.gateway-badge { font-size: 0.55rem; padding: 2px 7px; }
					.status-badge { font-size: 0.55rem; padding: 2px 8px; }
					.date-time { font-size: 0.62rem; }

					.empty-state { padding: 40px 16px; }
					.empty-state .empty-icon { font-size: 2.2rem; }
				}

				@media (max-width: 400px) {
					.top-bar { padding: 10px 12px; height: 48px; }
					.top-bar-title { font-size: 0.8rem; }
					.status-pill span:not(.status-dot) { display: none; }
					.status-pill { padding: 5px 8px; }

					.scroll-body { padding: 12px 10px 28px; }
					.table-section { padding: 14px; }

					table { min-width: 560px; }
					thead th { padding: 8px 10px; font-size: 0.55rem; }
					tbody td { padding: 8px 10px; font-size: 0.7rem; }
				}

				@media (hover: none) {
					tbody tr:hover { background: transparent; }
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
							Payments <span>History</span>
						</h1>
					</div>
					<div className="top-bar-right">
						<div className="status-pill">
							<span className="status-dot"></span>
							<span>Live</span>
						</div>
					</div>
				</div>

				{/* Scroll Body */}
				<div className="scroll-body">
					{errorMessage && (
						<div className="message-box message-error">
							⚠️ {errorMessage}
						</div>
					)}

					{loading && !errorMessage && (
						<div className="message-box message-loading">
							⏳ Loading payment history...
						</div>
					)}

					<div className="table-section">
						<div className="table-header">
							<h3>
								Transaction Records
								<span className="count-badge">{paymentList.length}</span>
							</h3>
							{!loading && !errorMessage && (
								<span className="payment-count">
									{paymentList.length} payment{paymentList.length !== 1 ? 's' : ''} found
								</span>
							)}
						</div>

						{!loading && !errorMessage && (
							<>
								{paymentList.length === 0 ? (
									<div className="empty-state">
										<span className="empty-icon">💳</span>
										<p>No payment transactions found</p>
										<div className="sub-text">Payments will appear here once customers complete purchases</div>
									</div>
								) : (
									<div className="table-wrapper">
										<table>
											<thead>
												<tr>
													<th>Reference</th>
													<th>Customer</th>
													<th>Amount</th>
													<th>Gateway</th>
													<th>Status</th>
													<th>Created</th>
												</tr>
											</thead>
											<tbody>
												{paymentList.map((payment) => (
													<tr key={payment.id}>
														<td>
															<span className="reference-code">
																{payment.gateway_reference || 'N/A'}
															</span>
														</td>
														<td>
															<span className="customer-mac">
																{payment.buyer_mac || 'N/A'}
															</span>
														</td>
														<td>
															<span className="amount-value">
																{formatCurrency(payment.amount)}
															</span>
														</td>
														<td>
															<span className="gateway-badge">
																{payment.payment_gateway || 'N/A'}
															</span>
														</td>
														<td>
															<span className={`status-badge ${getStatusClass(payment.status)}`}>
																{payment.status || 'Unknown'}
															</span>
														</td>
														<td>
															<span className="date-time">
																{payment.created_at ? formatDate(payment.created_at) : 'N/A'}
															</span>
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default Payments;