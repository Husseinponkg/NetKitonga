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

    const StatCard = ({ label, value, color, icon }) => (
        <div
            style={{
                padding: "18px 14px",
                borderRadius: "4px",
                backgroundColor: "rgba(30, 30, 30, 0.8)",
                border: `1px solid rgba(255, 255, 255, 0.06)`,
                textAlign: "center",
                transition: "all 0.3s ease",
                cursor: "default",
                position: "relative",
                overflow: "hidden",
                animation: "fadeIn 0.6s ease-out",
                animationFillMode: "both",
                minHeight: "120px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.backgroundColor = "rgba(35, 35, 35, 0.9)";
                e.currentTarget.style.borderColor = "rgba(229, 9, 20, 0.3)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(229, 9, 20, 0.12)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.backgroundColor = "rgba(30, 30, 30, 0.8)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            <div style={{ fontSize: "1.6rem", marginBottom: "6px", lineHeight: "1" }}>{icon}</div>
            <div style={{ fontSize: "0.7rem", color: "#808080", fontWeight: 600, marginBottom: "6px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {label}
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: color || "#e5e5e5", lineHeight: "1.2" }}>
                {value}
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: "#141414",
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            padding: "16px 20px",
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
                    width: 100%;
                    margin: 0 auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .page-header {
                    margin-bottom: 24px;
                    animation: slideIn 0.6s ease-out;
                }

                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .header-title h1 {
                    margin: 0;
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.5px;
                }

                .header-title h1 span {
                    color: #e50914;
                }

                .header-emoji {
                    font-size: 2rem;
                    line-height: 1;
                }

                .header-subtitle {
                    font-size: 0.85rem;
                    color: #808080;
                    margin: 4px 0 0 0;
                    line-height: 1.4;
                }

                .header-badge {
                    background: #e50914;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .error-box {
                    padding: 12px 14px;
                    border-radius: 4px;
                    background: rgba(229, 9, 20, 0.12);
                    color: #ff5252;
                    border: 1px solid rgba(229, 9, 20, 0.2);
                    margin-bottom: 20px;
                    font-weight: 500;
                    animation: fadeIn 0.3s ease-out;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.9rem;
                }

                .loading-box {
                    text-align: center;
                    padding: 60px 20px;
                    color: #808080;
                    font-size: 0.95rem;
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    animation: fadeIn 0.4s ease-out;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .spinner {
                    display: inline-block;
                    width: 32px;
                    height: 32px;
                    border: 3px solid rgba(229, 9, 20, 0.15);
                    border-top-color: #e50914;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 14px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                    margin-bottom: 24px;
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
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    overflow: hidden;
                    animation: fadeIn 0.8s ease-out;
                    transition: all 0.3s ease;
                    flex: 1;
                }

                .table-wrapper:hover {
                    border-color: rgba(229, 9, 20, 0.2);
                }

                .table-header {
                    padding: 14px 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
                    background: rgba(20, 20, 20, 0.8);
                }

                .table-header h2 {
                    margin: 0;
                    font-size: 1rem;
                    color: #ffffff;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .count-badge {
                    background: #e50914;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                }

                .table-scroll {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                    min-width: 600px;
                }

                thead {
                    background: rgba(20, 20, 20, 0.6);
                }

                thead th {
                    padding: 10px 14px;
                    text-align: left;
                    font-weight: 600;
                    color: #808080;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                tbody tr {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    transition: all 0.2s ease;
                }

                tbody tr:hover {
                    background: rgba(40, 40, 40, 0.8);
                }

                tbody td {
                    padding: 10px 14px;
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .status-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    border-radius: 3px;
                    font-size: 0.7rem;
                    font-weight: 700;
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

                .ref-code {
                    font-family: 'Courier New', monospace;
                    font-size: 0.7rem;
                    background: rgba(255, 255, 255, 0.06);
                    padding: 2px 8px;
                    border-radius: 3px;
                    display: inline-block;
                    font-weight: 500;
                    color: #808080;
                }

                .empty-state {
                    text-align: center;
                    padding: 50px 20px;
                    color: #808080;
                }

                .empty-icon {
                    font-size: 2.8rem;
                    display: block;
                    margin-bottom: 10px;
                    opacity: 0.4;
                }

                .empty-state p {
                    font-size: 0.9rem;
                    margin: 0;
                }

                .empty-state p:last-child {
                    font-size: 0.75rem;
                    opacity: 0.5;
                    margin-top: 4px;
                }

                /* Tablet */
                @media (max-width: 768px) {
                    .income-container {
                        padding: 0;
                    }

                    .header-title h1 {
                        font-size: 1.5rem;
                    }

                    .header-emoji {
                        font-size: 1.6rem;
                    }

                    .header-subtitle {
                        font-size: 0.8rem;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                        gap: 10px;
                    }

                    thead th, tbody td {
                        padding: 8px 12px;
                        font-size: 0.8rem;
                    }
                }

                /* Mobile */
                @media (max-width: 480px) {
                    .page-header {
                        margin-bottom: 16px;
                    }

                    .header-content {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 8px;
                    }

                    .header-title h1 {
                        font-size: 1.2rem;
                    }

                    .header-emoji {
                        font-size: 1.4rem;
                    }

                    .header-subtitle {
                        font-size: 0.75rem;
                    }

                    .header-badge {
                        font-size: 0.6rem;
                        padding: 3px 10px;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 8px;
                        margin-bottom: 16px;
                    }

                    .stats-grid > div {
                        min-height: 90px;
                        padding: 12px 10px;
                    }

                    .stats-grid > div > div:first-child {
                        font-size: 1.3rem;
                    }

                    .stats-grid > div > div:last-child {
                        font-size: 1.1rem;
                    }

                    .table-header {
                        padding: 10px 12px;
                    }

                    .table-header h2 {
                        font-size: 0.9rem;
                    }

                    thead th, tbody td {
                        padding: 6px 10px;
                        font-size: 0.7rem;
                    }

                    .ref-code {
                        font-size: 0.6rem;
                        padding: 2px 6px;
                    }

                    .status-badge {
                        font-size: 0.6rem;
                        padding: 2px 8px;
                    }

                    .loading-box {
                        padding: 40px 16px;
                        font-size: 0.85rem;
                    }

                    .error-box {
                        font-size: 0.8rem;
                        padding: 10px 12px;
                    }
                }

                /* Small phones */
                @media (max-width: 360px) {
                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 6px;
                    }

                    .stats-grid > div {
                        min-height: 80px;
                        padding: 10px 8px;
                    }

                    .stats-grid > div > div:first-child {
                        font-size: 1.1rem;
                    }

                    .stats-grid > div > div:last-child {
                        font-size: 1rem;
                    }

                    .stats-grid > div > div:nth-child(2) {
                        font-size: 0.6rem;
                    }

                    .header-title h1 {
                        font-size: 1rem;
                    }

                    table {
                        min-width: 480px;
                    }

                    thead th, tbody td {
                        padding: 5px 8px;
                        font-size: 0.65rem;
                    }
                }

                /* Landscape phones */
                @media (max-height: 600px) and (orientation: landscape) {
                    .stats-grid {
                        grid-template-columns: repeat(5, 1fr);
                        gap: 8px;
                    }

                    .stats-grid > div {
                        min-height: 70px;
                        padding: 10px 8px;
                    }

                    .page-header {
                        margin-bottom: 12px;
                    }

                    .table-wrapper {
                        max-height: 50vh;
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
                                <h1>Income <span>Overview</span></h1>
                                <p className="header-subtitle">
                                    Track your revenue and payment activity
                                </p>
                            </div>
                        </div>
                        <div className="header-badge">
                            ● Live
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-box">
                        <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="loading-box">
                        <div className="spinner"></div>
                        <div>Loading income data...</div>
                        <div style={{ fontSize: "0.75rem", marginTop: "4px", opacity: 0.5 }}>
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
                            />
                            <StatCard 
                                label="Completed" 
                                value={`${stats.completed_count}`} 
                                color="#81c784" 
                                icon="✓"
                            />
                            <StatCard 
                                label="Pending" 
                                value={`${stats.pending_count}`} 
                                color="#fbc02d" 
                                icon="⏳"
                            />
                            <StatCard 
                                label="Failed" 
                                value={`${stats.failed_count}`} 
                                color="#ff5252" 
                                icon="✕"
                            />
                            <StatCard 
                                label="All Transactions" 
                                value={stats.total_count} 
                                color="#b3b3b3" 
                                icon="📊"
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
                                                    <td style={{ fontWeight: 700, color: "#e50914" }}>
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
                                                    <td style={{ fontSize: "0.75rem", color: "#808080" }}>
                                                        {p.buyer_mac}
                                                    </td>
                                                    <td style={{ fontSize: "0.75rem", color: "#808080" }}>
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