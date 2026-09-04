import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Income() {
    const [stats, setStats] = useState({
        completed_count: 0,
        completed_total: 0,
        pending_count: 0,
        pending_total: 0,
        failed_count: 0,
        failed_total: 0,
        total_count: 0,
        total_amount: 0,
    });
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || 1;
    };

    const fetchData = async () => {
        setLoading(true);
        setError("");
        const tenantId = getTenantId();
        try {
            const [statsRes, historyRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/payments/income/stats?tenant_id=${tenantId}`),
                fetch(`${API_BASE_URL}/api/payments/history?tenant_id=${tenantId}`),
            ]);

            if (!statsRes.ok) throw new Error("Failed to load income stats");
            if (!historyRes.ok) throw new Error("Failed to load payment history");

            const statsData = await statsRes.json();
            setStats(statsData);

            const historyData = await historyRes.json();
            setPayments(Array.isArray(historyData) ? historyData : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fmt = (n) =>
        new Intl.NumberFormat("en-TZ", {
            style: "currency",
            currency: "TZS",
            minimumFractionDigits: 0,
        }).format(n || 0);

    const StatCard = ({ label, value, color, icon, bgColor }) => (
        <div
            style={{
                flex: "1 1 160px",
                padding: "20px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(30, 30, 30, 0.8)",
                border: `1px solid ${bgColor || "rgba(255, 255, 255, 0.1)"}`,
                textAlign: "center",
                transition: "all 0.3s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
                animation: "fadeIn 0.6s ease-out",
                animationFillMode: "both",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.backgroundColor = "rgba(30, 30, 30, 1)";
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(229, 9, 20, 0.15)`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "rgba(30, 30, 30, 0.8)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>{icon}</div>
            <div style={{ fontSize: "0.8rem", color: "#b3b3b3", fontWeight: 600, marginBottom: "8px", letterSpacing: "0.3px", textTransform: "uppercase" }}>
                {label}
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: color || "#e5e5e5" }}>
                {value}
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            padding: "20px",
            margin: 0,
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

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .income-container {
                    max-width: 1300px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 32px;
                    animation: fadeIn 0.6s ease-out;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .header-title h1 {
                    margin: 0;
                    font-size: 2rem;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                }

                .header-emoji {
                    font-size: 2.2rem;
                }

                .header-subtitle {
                    font-size: 0.9rem;
                    color: #b3b3b3;
                    margin: 8px 0 0 0;
                    line-height: 1.4;
                }

                .header-badge {
                    background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
                    color: white;
                    padding: 6px 14px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .error-box {
                    padding: 14px 16px;
                    border-radius: 6px;
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff6b6b;
                    border: 1px solid rgba(229, 9, 20, 0.3);
                    margin-bottom: 24px;
                    font-weight: 500;
                    animation: fadeIn 0.3s ease-out;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .loading-box {
                    text-align: center;
                    padding: 60px 20px;
                    color: #b3b3b3;
                    font-size: 1rem;
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    animation: fadeIn 0.4s ease-out;
                }

                .spinner {
                    display: inline-block;
                    width: 36px;
                    height: 36px;
                    border: 3px solid rgba(229, 9, 20, 0.2);
                    border-top-color: #e50914;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 16px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
                    gap: 14px;
                    margin-bottom: 32px;
                }

                .stats-grid > div {
                    animation: fadeIn 0.6s ease-out;
                    animation-fill-mode: both;
                }

                .stats-grid > div:nth-child(1) { animation-delay: 0.05s; }
                .stats-grid > div:nth-child(2) { animation-delay: 0.10s; }
                .stats-grid > div:nth-child(3) { animation-delay: 0.15s; }
                .stats-grid > div:nth-child(4) { animation-delay: 0.20s; }
                .stats-grid > div:nth-child(5) { animation-delay: 0.25s; }

                .table-wrapper {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                    animation: fadeIn 0.8s ease-out;
                    transition: all 0.3s ease;
                }

                .table-wrapper:hover {
                    border-color: rgba(229, 9, 20, 0.3);
                }

                .table-header {
                    padding: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    background: rgba(20, 20, 20, 0.8);
                }

                .table-header h2 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #ffffff;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .count-badge {
                    background: #e50914;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .table-scroll {
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                thead {
                    background: rgba(20, 20, 20, 0.6);
                }

                thead th {
                    padding: 12px 14px;
                    text-align: left;
                    font-weight: 600;
                    color: #b3b3b3;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                tbody tr {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s ease;
                }

                tbody tr:hover {
                    background: rgba(30, 30, 30, 1);
                }

                tbody td {
                    padding: 12px 14px;
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .status-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .status-completed {
                    background: rgba(76, 175, 80, 0.15);
                    color: #81c784;
                }

                .status-pending {
                    background: rgba(255, 193, 7, 0.15);
                    color: #fbc02d;
                }

                .status-failed {
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff5252;
                }

                .ref-code {
                    font-family: 'Courier New', monospace;
                    font-size: 0.75rem;
                    background: rgba(255, 255, 255, 0.08);
                    padding: 3px 8px;
                    border-radius: 4px;
                    display: inline-block;
                    font-weight: 500;
                    color: #b3b3b3;
                }

                .empty-state {
                    text-align: center;
                    padding: 50px 20px;
                    color: #b3b3b3;
                }

                .empty-icon {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 12px;
                    opacity: 0.5;
                }

                .empty-state p {
                    font-size: 0.95rem;
                    margin: 0;
                }

                .empty-state p:last-child {
                    font-size: 0.8rem;
                    opacity: 0.6;
                    margin-top: 6px;
                }

                /* Tablet Responsive */
                @media (max-width: 768px) {
                    .income-container {
                        padding: 0;
                    }

                    .header-title h1 {
                        font-size: 1.6rem;
                    }

                    .header-emoji {
                        font-size: 1.8rem;
                    }

                    .header-subtitle {
                        font-size: 0.85rem;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 12px;
                    }

                    .table-header h2 {
                        font-size: 1rem;
                    }

                    thead th, tbody td {
                        padding: 10px 12px;
                        font-size: 0.8rem;
                    }
                }

                /* Mobile Responsive */
                @media (max-width: 480px) {
                    .page-header {
                        margin-bottom: 24px;
                    }

                    .header-content {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .header-title h1 {
                        font-size: 1.3rem;
                    }

                    .header-emoji {
                        font-size: 1.6rem;
                    }

                    .header-subtitle {
                        font-size: 0.8rem;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 10px;
                        margin-bottom: 24px;
                    }

                    .table-header {
                        flex-direction: column;
                        align-items: flex-start;
                        padding: 12px;
                    }

                    .table-header h2 {
                        font-size: 0.95rem;
                    }

                    thead th, tbody td {
                        padding: 8px 10px;
                        font-size: 0.75rem;
                    }

                    .ref-code {
                        font-size: 0.7rem;
                        padding: 2px 6px;
                    }

                    .status-badge {
                        font-size: 0.7rem;
                        padding: 2px 8px;
                    }
                }

                /* Extra small devices */
                @media (max-width: 360px) {
                    .header-title h1 {
                        font-size: 1.1rem;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .table-scroll {
                        font-size: 0.8rem;
                    }
                }
            `}</style>

            <div className="income-container">
                {/* Page Header */}
                <div className="page-header">
                    <div className="header-content">
                        <div className="header-title">
                            <span className="header-emoji">💰</span>
                            <div>
                                <h1>Income Overview</h1>
                                <p className="header-subtitle">
                                    Track your hospitality revenue and payment activity
                                </p>
                            </div>
                        </div>
                        <div className="header-badge">
                            Live
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-box">
                        <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="loading-box">
                        <div className="spinner"></div>
                        <div>Loading income data...</div>
                        <div style={{ fontSize: "0.8rem", marginTop: "6px", opacity: 0.6 }}>
                            Fetching your revenue information
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <StatCard 
                                label="Total Revenue" 
                                value={fmt(stats.completed_total)} 
                                color="#81c784" 
                                icon="🏆"
                                bgColor="rgba(76, 175, 80, 0.2)"
                            />
                            <StatCard 
                                label="Completed" 
                                value={`${stats.completed_count}`} 
                                color="#81c784" 
                                icon="✓"
                                bgColor="rgba(76, 175, 80, 0.2)"
                            />
                            <StatCard 
                                label="Pending" 
                                value={`${stats.pending_count}`} 
                                color="#fbc02d" 
                                icon="⏳"
                                bgColor="rgba(255, 193, 7, 0.2)"
                            />
                            <StatCard 
                                label="Failed" 
                                value={`${stats.failed_count}`} 
                                color="#ff5252" 
                                icon="✕"
                                bgColor="rgba(229, 9, 20, 0.2)"
                            />
                            <StatCard 
                                label="All Transactions" 
                                value={stats.total_count} 
                                color="#b3b3b3" 
                                icon="📊"
                                bgColor="rgba(179, 179, 179, 0.15)"
                            />
                        </div>

                        {/* Payment History Table */}
                        <div className="table-wrapper">
                            <div className="table-header">
                                <h2>
                                    Payment History
                                    <span className="count-badge">{payments.length}</span>
                                </h2>
                            </div>
                            <div className="table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Reference</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>MAC</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.length === 0 ? (
                                            <tr>
                                                <td colSpan="6">
                                                    <div className="empty-state">
                                                        <span className="empty-icon">📭</span>
                                                        <p>No payments recorded yet</p>
                                                        <p>Transactions will appear here once processed</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            payments.map((p) => (
                                                <tr key={p.id}>
                                                    <td style={{ fontWeight: 600, color: "#e50914" }}>
                                                        #{p.id}
                                                    </td>
                                                    <td>
                                                        <span className="ref-code">{p.gateway_reference}</span>
                                                    </td>
                                                    <td style={{ fontWeight: 600 }}>
                                                        {fmt(p.amount)}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge status-${p.status}`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: "0.8rem" }}>
                                                        {p.buyer_mac}
                                                    </td>
                                                    <td style={{ fontSize: "0.8rem", color: "#b3b3b3" }}>
                                                        {new Date(p.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Income;