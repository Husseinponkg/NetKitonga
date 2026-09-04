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

	// Format currency
	const formatCurrency = (amount) => {
		return `TZS ${Number(amount).toLocaleString()}`;
	};

	// Get status badge class
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

	// Format date
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
			padding: "clamp(12px, 3vw, 20px)", 
			fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif", 
			background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
			minHeight: "100vh",
			color: "#ffffff"
		}}>
			<style>{`
				* {
					box-sizing: border-box;
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
					margin-bottom: clamp(20px, 4vw, 32px);
					animation: fadeIn 0.6s ease-out;
				}

				.page-header h1 {
					font-size: clamp(1.3rem, 4vw, 2rem);
					font-weight: 700;
					color: #ffffff;
					margin: 0 0 8px 0;
					letter-spacing: -0.5px;
					word-wrap: break-word;
				}

				.page-header p {
					font-size: clamp(0.85rem, 1.5vw, 0.95rem);
					color: #b3b3b3;
					margin: 0;
				}

				.error-message {
					padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px);
					margin: 0 0 clamp(16px, 3vw, 24px) 0;
					background: rgba(229, 9, 20, 0.15);
					border: 1px solid rgba(229, 9, 20, 0.3);
					border-radius: 6px;
					color: #ff6b6b;
					font-weight: 500;
					font-size: clamp(0.8rem, 1.2vw, 0.9rem);
					animation: fadeIn 0.3s ease-out;
					word-wrap: break-word;
				}

				.loading-message {
					padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px);
					margin: 0 0 clamp(16px, 3vw, 24px) 0;
					background: rgba(100, 149, 237, 0.15);
					border: 1px solid rgba(100, 149, 237, 0.3);
					border-radius: 6px;
					color: #6495ed;
					font-weight: 500;
					font-size: clamp(0.8rem, 1.2vw, 0.9rem);
					animation: pulse 1.5s ease-in-out infinite;
					word-wrap: break-word;
				}

				.table-section {
					background: rgba(30, 30, 30, 0.8);
					border: 1px solid rgba(255, 255, 255, 0.1);
					border-radius: 8px;
					padding: clamp(16px, 3vw, 24px);
					animation: fadeIn 0.8s ease-out 0.15s both;
					overflow: hidden;
					min-width: 0;
				}

				.table-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: clamp(16px, 2.5vw, 20px);
					flex-wrap: wrap;
					gap: 12px;
				}

				.table-header h3 {
					margin: 0;
					font-size: clamp(1rem, 1.5vw, 1.1rem);
					font-weight: 600;
					color: #ffffff;
				}

				.payment-count {
					font-size: clamp(0.7rem, 1vw, 0.8rem);
					color: #b3b3b3;
					background: rgba(255, 255, 255, 0.05);
					padding: 4px 12px;
					border-radius: 4px;
				}

				.table-wrapper {
					overflow-x: auto;
					border-radius: 6px;
					-webkit-overflow-scrolling: touch;
				}

				table {
					width: 100%;
					border-collapse: collapse;
					font-size: clamp(0.75rem, 1.2vw, 0.9rem);
					min-width: 700px;
				}

				thead tr {
					background: rgba(20, 20, 20, 0.6);
					border-bottom: 1px solid rgba(255, 255, 255, 0.1);
				}

				thead th {
					padding: clamp(8px, 1.2vw, 12px) clamp(10px, 1.5vw, 14px);
					text-align: left;
					font-weight: 600;
					color: #b3b3b3;
					font-size: clamp(0.65rem, 0.9vw, 0.75rem);
					text-transform: uppercase;
					letter-spacing: 0.3px;
					white-space: nowrap;
				}

				tbody tr {
					border-bottom: 1px solid rgba(255, 255, 255, 0.05);
					transition: all 0.2s ease;
				}

				tbody tr:hover {
					background: rgba(30, 30, 30, 1);
				}

				tbody td {
					padding: clamp(8px, 1.2vw, 12px) clamp(10px, 1.5vw, 14px);
					color: #e5e5e5;
					vertical-align: middle;
				}

				.reference-code {
					font-family: 'Courier New', monospace;
					font-size: clamp(0.65rem, 0.9vw, 0.8rem);
					background: rgba(255, 255, 255, 0.05);
					padding: 2px 8px;
					border-radius: 4px;
					color: #a0aec0;
					word-break: break-all;
				}

				.customer-info {
					font-size: clamp(0.7rem, 1vw, 0.85rem);
				}

				.customer-mac {
					font-family: 'Courier New', monospace;
					font-size: clamp(0.6rem, 0.8vw, 0.75rem);
					color: #a0aec0;
				}

				.amount-value {
					font-weight: 600;
					color: #e50914;
					white-space: nowrap;
				}

				.gateway-badge {
					display: inline-block;
					padding: 2px clamp(6px, 1vw, 10px);
					border-radius: 4px;
					font-size: clamp(0.6rem, 0.8vw, 0.75rem);
					font-weight: 500;
					background: rgba(255, 255, 255, 0.05);
					color: #b3b3b3;
					text-transform: uppercase;
					white-space: nowrap;
				}

				.status-badge {
					display: inline-block;
					padding: 2px clamp(6px, 1vw, 10px);
					border-radius: 4px;
					font-size: clamp(0.6rem, 0.8vw, 0.75rem);
					font-weight: 600;
					text-transform: uppercase;
					white-space: nowrap;
				}

				.status-completed {
					background: rgba(76, 175, 80, 0.15);
					color: #81c784;
				}

				.status-pending {
					background: rgba(255, 193, 7, 0.15);
					color: #ffd54f;
				}

				.status-failed {
					background: rgba(229, 9, 20, 0.15);
					color: #ff6b6b;
				}

				.status-cancelled {
					background: rgba(158, 158, 158, 0.15);
					color: #bdbdbd;
				}

				.status-refunded {
					background: rgba(100, 149, 237, 0.15);
					color: #6495ed;
				}

				.status-default {
					background: rgba(255, 255, 255, 0.05);
					color: #b3b3b3;
				}

				.date-time {
					font-size: clamp(0.65rem, 0.9vw, 0.8rem);
					color: #a0aec0;
					white-space: nowrap;
				}

				.empty-state {
					text-align: center;
					padding: clamp(40px, 6vw, 60px) clamp(16px, 3vw, 20px);
					color: #b3b3b3;
				}

				.empty-state .empty-icon {
					font-size: 3rem;
					margin-bottom: 16px;
					display: block;
				}

				.empty-state p {
					margin: 0;
					font-size: clamp(0.9rem, 1.2vw, 1rem);
				}

				.empty-state .sub-text {
					margin-top: 8px;
					font-size: clamp(0.8rem, 1vw, 0.9rem);
					color: #666;
				}

				/* Responsive Breakpoints */
				@media (max-width: 1024px) {
					.table-section {
						max-width: 100%;
					}
				}

				@media (max-width: 768px) {
					.payments-container {
						padding: 0;
					}

					.table-header {
						flex-direction: column;
						align-items: flex-start;
					}

					table {
						min-width: 600px;
						font-size: 0.75rem;
					}

					thead th, tbody td {
						padding: 6px 8px;
					}

					.reference-code {
						font-size: 0.65rem;
					}

					.customer-mac {
						font-size: 0.6rem;
					}
				}

				@media (max-width: 480px) {
					.table-section {
						padding: 12px;
					}

					table {
						min-width: 500px;
						font-size: 0.7rem;
					}

					thead th, tbody td {
						padding: 4px 6px;
					}

					.reference-code {
						font-size: 0.55rem;
						padding: 1px 4px;
					}

					.customer-mac {
						font-size: 0.55rem;
					}

					.status-badge {
						font-size: 0.55rem;
						padding: 1px 4px;
					}

					.gateway-badge {
						font-size: 0.55rem;
						padding: 1px 4px;
					}

					.date-time {
						font-size: 0.55rem;
					}

					.amount-value {
						font-size: 0.7rem;
					}
				}

				/* Touch device optimizations */
				@media (hover: none) {
					tbody tr:hover {
						background: transparent;
					}

					tbody tr:active {
						background: rgba(30, 30, 30, 0.5);
					}
				}

				/* Print styles */
				@media print {
					table {
						min-width: 100% !important;
					}

					body {
						background: white !important;
						color: black !important;
					}

					.status-badge {
						border: 1px solid #666;
					}
				}
			`}</style>

			<div className="payments-container">
				{/* Header */}
				<div className="page-header">
					<h1>💳 Payment History</h1>
					<p>View and track all customer payments</p>
				</div>

				{/* Error Message */}
				{errorMessage && (
					<div className="error-message">
						⚠️ {errorMessage}
					</div>
				)}

				{/* Loading State */}
				{loading && !errorMessage && (
					<div className="loading-message">
						⏳ Loading payment history...
					</div>
				)}

				{/* Table Section */}
				<div className="table-section">
					<div className="table-header">
						<h3>📋 Transaction Records</h3>
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
														<div className="customer-info">
															<div className="customer-mac">
																{payment.buyer_mac || 'N/A'}
															</div>
														</div>
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