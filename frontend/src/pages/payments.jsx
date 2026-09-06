import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Payments() {
	const [paymentList, setPaymentList] = useState([]);
	const [errorMessage, setErrorMessage] = useState("");
	const [loading, setLoading] = useState(true);

	const getTenantId = () => {
		const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
		return user.id || 1;
	};

	useEffect(() => {
		const fetchPayments = async () => {
			try {
				setLoading(true);
				const response = await fetch(`${API_BASE_URL}/api/payments/history?tenant_id=${getTenantId()}`);
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
		<div style={{ 
			padding: "16px 20px", 
			fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif", 
			background: "#141414",
			minHeight: "100vh",
			color: "#ffffff",
			margin: 0,
		}}>
			<style>{`
				* {
					box-sizing: border-box;
				}

				body {
					margin: 0;
					padding: 0;
					background: #141414;
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

				@keyframes pulse {
					0%, 100% {
						opacity: 1;
					}
					50% {
						opacity: 0.5;
					}
				}

				.payments-container {
					max-width: 1400px;
					margin: 0 auto;
					width: 100%;
				}

				.page-header {
					margin-bottom: 24px;
					animation: slideIn 0.6s ease-out;
				}

				.page-header h1 {
					font-size: 1.6rem;
					font-weight: 700;
					color: #ffffff;
					margin: 0 0 4px 0;
					letter-spacing: -0.5px;
				}

				.page-header h1 span {
					color: #e50914;
				}

				.page-header p {
					font-size: 0.85rem;
					color: #808080;
					margin: 0;
				}

				.message-box {
					padding: 10px 14px;
					margin: 0 0 16px 0;
					border-radius: 4px;
					font-weight: 500;
					font-size: 0.85rem;
					animation: fadeIn 0.3s ease-out;
				}

				.message-error {
					background: rgba(229, 9, 20, 0.1);
					border: 1px solid rgba(229, 9, 20, 0.2);
					color: #ff5252;
				}

				.message-loading {
					background: rgba(100, 149, 237, 0.08);
					border: 1px solid rgba(100, 149, 237, 0.15);
					color: #6495ed;
					animation: pulse 1.5s ease-in-out infinite;
				}

				.table-section {
					background: rgba(30, 30, 30, 0.8);
					border: 1px solid rgba(255, 255, 255, 0.06);
					border-radius: 4px;
					padding: 20px;
					animation: fadeIn 0.8s ease-out 0.15s both;
					overflow: hidden;
					min-width: 0;
				}

				.table-section:hover {
					border-color: rgba(229, 9, 20, 0.15);
				}

				.table-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 16px;
					flex-wrap: wrap;
					gap: 10px;
				}

				.table-header h3 {
					margin: 0;
					font-size: 1rem;
					font-weight: 600;
					color: #ffffff;
				}

				.payment-count {
					font-size: 0.75rem;
					color: #808080;
					background: rgba(255, 255, 255, 0.05);
					padding: 4px 12px;
					border-radius: 4px;
				}

				.count-badge {
					background: rgba(229, 9, 20, 0.15);
					color: #e50914;
					padding: 2px 10px;
					border-radius: 12px;
					font-size: 0.75rem;
					font-weight: 600;
					margin-left: 8px;
				}

				.table-wrapper {
					overflow-x: auto;
					-webkit-overflow-scrolling: touch;
				}

				table {
					width: 100%;
					border-collapse: collapse;
					font-size: 0.85rem;
					min-width: 650px;
				}

				thead tr {
					background: rgba(20, 20, 20, 0.6);
					border-bottom: 1px solid rgba(255, 255, 255, 0.06);
				}

				thead th {
					padding: 8px 12px;
					text-align: left;
					font-weight: 600;
					color: #808080;
					font-size: 0.7rem;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					white-space: nowrap;
				}

				tbody tr {
					border-bottom: 1px solid rgba(255, 255, 255, 0.04);
					transition: all 0.2s ease;
				}

				tbody tr:hover {
					background: rgba(40, 40, 40, 0.8);
				}

				tbody td {
					padding: 8px 12px;
					color: #e5e5e5;
					vertical-align: middle;
				}

				.reference-code {
					font-family: 'Courier New', monospace;
					font-size: 0.7rem;
					background: rgba(255, 255, 255, 0.05);
					padding: 2px 8px;
					border-radius: 3px;
					color: #808080;
					word-break: break-all;
				}

				.customer-mac {
					font-family: 'Courier New', monospace;
					font-size: 0.7rem;
					color: #808080;
				}

				.amount-value {
					font-weight: 700;
					color: #e50914;
				}

				.gateway-badge {
					display: inline-block;
					padding: 2px 10px;
					border-radius: 3px;
					font-size: 0.65rem;
					font-weight: 500;
					background: rgba(255, 255, 255, 0.05);
					color: #808080;
					text-transform: uppercase;
					letter-spacing: 0.3px;
				}

				.status-badge {
					display: inline-block;
					padding: 2px 10px;
					border-radius: 3px;
					font-size: 0.65rem;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.3px;
				}

				.status-completed {
					background: rgba(76, 175, 80, 0.12);
					color: #81c784;
				}

				.status-pending {
					background: rgba(255, 193, 7, 0.12);
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
					font-size: 0.75rem;
					color: #808080;
					white-space: nowrap;
				}

				.empty-state {
					text-align: center;
					padding: 40px 20px;
					color: #808080;
				}

				.empty-state .empty-icon {
					font-size: 2.8rem;
					margin-bottom: 12px;
					display: block;
					opacity: 0.4;
				}

				.empty-state p {
					margin: 0;
					font-size: 0.9rem;
				}

				.empty-state .sub-text {
					margin-top: 6px;
					font-size: 0.8rem;
					color: #555;
				}

				/* Tablet */
				@media (max-width: 768px) {
					.payments-container {
						padding: 0;
					}

					.table-header {
						flex-direction: column;
						align-items: flex-start;
					}

					table {
						min-width: 550px;
						font-size: 0.8rem;
					}

					thead th, tbody td {
						padding: 6px 10px;
					}

					.reference-code {
						font-size: 0.65rem;
					}
				}

				/* Mobile */
				@media (max-width: 480px) {
					.page-header h1 {
						font-size: 1.2rem;
					}

					.table-section {
						padding: 12px;
					}

					table {
						min-width: 450px;
						font-size: 0.7rem;
					}

					thead th, tbody td {
						padding: 4px 8px;
					}

					.reference-code {
						font-size: 0.55rem;
						padding: 1px 5px;
					}

					.customer-mac {
						font-size: 0.6rem;
					}

					.status-badge {
						font-size: 0.55rem;
						padding: 1px 6px;
					}

					.gateway-badge {
						font-size: 0.55rem;
						padding: 1px 6px;
					}

					.date-time {
						font-size: 0.6rem;
					}

					.amount-value {
						font-size: 0.7rem;
					}
				}

				/* Touch devices */
				@media (hover: none) {
					tbody tr:hover {
						background: transparent;
					}

					tbody tr:active {
						background: rgba(40, 40, 40, 0.5);
					}
				}
			`}</style>

			<div className="payments-container">
				{/* Header */}
				<div className="page-header">
					<h1>💳 Payment <span>History</span></h1>
					<p>View and track all customer payments</p>
				</div>

				{/* Error Message */}
				{errorMessage && (
					<div className="message-box message-error">
						⚠️ {errorMessage}
					</div>
				)}

				{/* Loading State */}
				{loading && !errorMessage && (
					<div className="message-box message-loading">
						⏳ Loading payment history...
					</div>
				)}

				{/* Table Section */}
				<div className="table-section">
					<div className="table-header">
						<h3>
							📋 Transaction Records
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
	);
}

export default Payments;