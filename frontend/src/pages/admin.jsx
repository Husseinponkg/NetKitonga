import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

const STAT_CARDS = [
    { key: "tenants", label: "Tenants", suffix: "" },
    { key: "routers", label: "Routers", suffix: "" },
    { key: "active_sessions", label: "Active Sessions", suffix: "" },
    { key: "payments_today", label: "Payments Today", suffix: " TZS" },
];

function Admin() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        tenants: 0,
        routers: 0,
        active_sessions: 0,
        payments_today: 0,
    });
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [adminUser, setAdminUser] = useState(null);

    useEffect(() => {
        const storedAdmin = localStorage.getItem("adminUser");
        if (!storedAdmin) {
            navigate("/");
        } else {
            try {
                setAdminUser(JSON.parse(storedAdmin));
            } catch {
                setAdminUser({ email: "admin" });
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchStats();
        fetchRecentLogs();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/stats`);
            if (!response.ok) throw new Error("Failed to fetch stats");
            const data = await response.json();
            setStats({
                tenants: data.tenants || 0,
                routers: data.routers || 0,
                active_sessions: data.active_sessions || 0,
                payments_today: data.payments_today || 0,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentLogs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/logs?limit=10`);
            if (!response.ok) throw new Error("Failed to fetch logs");
            const data = await response.json();
            setRecentLogs(data);
        } catch (err) {
            console.error("Failed to fetch recent logs:", err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminUser");
        navigate("/");
    };

    const StatCard = ({ title, value, suffix = "" }) => (
        <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid #1a1a1a",
            borderRadius: "12px",
            padding: "20px",
            minWidth: "160px",
            flex: "1 1 160px",
        }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                {title}
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#ffffff" }}>
                {value}{suffix}
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: "100vh",
            background: "#0f0f0f",
            color: "#ffffff",
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: "20px",
        }}>
            <style>{`
                * { box-sizing: border-box; }
                body { margin: 0; padding: 0; background: #0f0f0f; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.4s ease-out; }
                .card {
                    background: rgba(25,25,25,0.95);
                    border: 1px solid #1a1a1a;
                    border-radius: 12px;
                    padding: 20px;
                }
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th { text-align: left; padding: 12px; border-bottom: 1px solid #1a1a1a; color: rgba(255,255,255,0.5); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
                .data-table td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }
                .data-table tr:hover td { background: rgba(255,255,255,0.02); }
            `}</style>

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
                padding: "16px 20px",
                background: "rgba(25,25,25,0.95)",
                border: "1px solid #1a1a1a",
                borderRadius: "12px",
            }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Admin Dashboard</h1>
                    <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                        {adminUser ? `Logged in as ${adminUser.email}` : "System overview and monitoring"}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        background: "transparent",
                        color: "#ff5252",
                        border: "1px solid rgba(255,82,82,0.3)",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = "rgba(255,82,82,0.1)";
                        e.target.style.borderColor = "#ff5252";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = "transparent";
                        e.target.style.borderColor = "rgba(255,82,82,0.3)";
                    }}
                >
                    Logout
                </button>
            </div>

            {error && (
                <div className="fade-in" style={{
                    background: "rgba(229,9,20,0.1)",
                    border: "1px solid rgba(229,9,20,0.3)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    color: "#ff6b6b",
                    marginBottom: "16px",
                }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                {STAT_CARDS.map((card) => (
                    <StatCard
                        key={card.key}
                        title={card.label}
                        value={stats[card.key] || 0}
                        suffix={card.suffix}
                    />
                ))}
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0, fontSize: "1rem", color: "rgba(255,255,255,0.7)", marginBottom: "16px" }}>
                    Recent System Logs
                </h3>
                {recentLogs.length === 0 ? (
                    <p style={{ color: "rgba(255,255,255,0.4)" }}>No recent logs found.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Entity</th>
                                    <th>Entity ID</th>
                                    <th>Tenant</th>
                                    <th>Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{log.action}</td>
                                        <td>{log.entity_type}</td>
                                        <td>{log.entity_id ?? "-"}</td>
                                        <td>{log.business_name || `Tenant ${log.tenant_id || "-"}`}</td>
                                        <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Admin;
