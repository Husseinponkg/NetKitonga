import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Sessions() {
    const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
    const tenantId = user.id || 1;
    const [sessions, setSessions] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [terminatingId, setTerminatingId] = useState(null);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/sessions/active?tenant_id=${tenantId}`);
            if (!response.ok) throw new Error("Could not load active sessions.");
            setSessions(await response.json());
            setMessage("");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    const terminate = async (sessionId) => {
        if (!window.confirm("Are you sure you want to terminate this session?")) return;
        
        try {
            setTerminatingId(sessionId);
            const response = await fetch(`${API_BASE_URL}/sessions/terminate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenant_id: tenantId, session_id: sessionId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || "Could not terminate session.");
            setMessage(result.message || "Session terminated successfully!");
            loadSessions();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setTerminatingId(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSessionDuration = (startTime) => {
        if (!startTime) return 'N/A';
        const start = new Date(startTime);
        const now = new Date();
        const diffMs = now - start;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    const isExpiringSoon = (expirationTime) => {
        if (!expirationTime) return false;
        const exp = new Date(expirationTime);
        const now = new Date();
        const diffMs = exp - now;
        const diffMins = diffMs / 60000;
        return diffMins > 0 && diffMins < 15;
    };

    const isExpired = (expirationTime) => {
        if (!expirationTime) return false;
        const exp = new Date(expirationTime);
        const now = new Date();
        return exp < now;
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

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .sessions-container {
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

                .header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .session-count {
                    font-size: 0.85rem;
                    color: #808080;
                }

                .session-count strong {
                    color: #ffffff;
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

                .refresh-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    color: #808080;
                    font-weight: 500;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .refresh-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.12);
                    color: #ffffff;
                }

                .refresh-btn:active:not(:disabled) {
                    transform: scale(0.95);
                }

                .refresh-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .refresh-btn .spinner {
                    display: inline-block;
                    animation: spin 1s linear infinite;
                }

                .message-box {
                    padding: 10px 14px;
                    margin: 0 0 16px 0;
                    border-radius: 4px;
                    font-weight: 500;
                    font-size: 0.85rem;
                    animation: fadeIn 0.3s ease-out;
                }

                .message-success {
                    background: rgba(76, 175, 80, 0.1);
                    border: 1px solid rgba(76, 175, 80, 0.2);
                    color: #81c784;
                }

                .message-error {
                    background: rgba(229, 9, 20, 0.1);
                    border: 1px solid rgba(229, 9, 20, 0.2);
                    color: #ff5252;
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
                    animation: slideIn 0.3s ease-out;
                }

                tbody tr:hover {
                    background: rgba(40, 40, 40, 0.8);
                }

                tbody td {
                    padding: 8px 12px;
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .device-mac {
                    font-family: 'Courier New', monospace;
                    font-size: 0.7rem;
                    color: #808080;
                }

                .device-label {
                    font-size: 0.6rem;
                    color: #555;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .ip-address {
                    font-family: 'Courier New', monospace;
                    font-size: 0.75rem;
                    color: #808080;
                }

                .router-name {
                    font-weight: 500;
                    color: #e5e5e5;
                }

                .time-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .time-main {
                    font-size: 0.75rem;
                    color: #e5e5e5;
                }

                .time-detail {
                    font-size: 0.65rem;
                    color: #555;
                }

                .duration-badge {
                    display: inline-block;
                    padding: 1px 8px;
                    border-radius: 10px;
                    font-size: 0.65rem;
                    font-weight: 500;
                    background: rgba(255, 255, 255, 0.05);
                    color: #808080;
                }

                .expiry-warning {
                    color: #fbc02d;
                }

                .expiry-danger {
                    color: #ff5252;
                }

                .terminate-btn {
                    padding: 4px 14px;
                    border: none;
                    border-radius: 3px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    background: rgba(229, 9, 20, 0.12);
                    color: #ff5252;
                    border: 1px solid rgba(229, 9, 20, 0.15);
                    white-space: nowrap;
                }

                .terminate-btn:hover:not(:disabled) {
                    background: rgba(229, 9, 20, 0.2);
                    border-color: rgba(229, 9, 20, 0.3);
                }

                .terminate-btn:active:not(:disabled) {
                    transform: scale(0.95);
                }

                .terminate-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .terminate-btn .loading-spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-top: 2px solid #ff5252;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
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
                    .sessions-container {
                        padding: 0;
                    }

                    .header-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .refresh-btn {
                        justify-content: center;
                    }

                    table {
                        min-width: 550px;
                        font-size: 0.8rem;
                    }

                    thead th, tbody td {
                        padding: 6px 10px;
                    }

                    .device-mac {
                        font-size: 0.65rem;
                    }

                    .ip-address {
                        font-size: 0.7rem;
                    }

                    .time-main {
                        font-size: 0.7rem;
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

                    .device-mac {
                        font-size: 0.55rem;
                    }

                    .ip-address {
                        font-size: 0.6rem;
                    }

                    .terminate-btn {
                        padding: 3px 10px;
                        font-size: 0.6rem;
                    }

                    .duration-badge {
                        font-size: 0.55rem;
                        padding: 1px 6px;
                    }

                    .time-main {
                        font-size: 0.65rem;
                    }

                    .time-detail {
                        font-size: 0.55rem;
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

                    .terminate-btn {
                        padding: 8px 14px;
                        min-height: 36px;
                    }

                    .refresh-btn {
                        min-height: 40px;
                    }
                }
            `}</style>

            <div className="sessions-container">
                {/* Header */}
                <div className="page-header">
                    <h1>🔄 Active <span>Sessions</span></h1>
                    <p>Monitor and manage all active user sessions</p>
                </div>

                {/* Messages */}
                {message && (
                    <div className={`message-box ${message.includes("successfully") || message.includes("terminated") ? "message-success" : "message-error"}`}>
                        {message}
                    </div>
                )}

                {/* Actions */}
                <div className="header-actions">
                    <span className="session-count">
                        <strong>{sessions.length}</strong> active session{sessions.length !== 1 ? 's' : ''}
                        <span className="count-badge">{sessions.length}</span>
                    </span>
                    <button 
                        type="button" 
                        onClick={loadSessions} 
                        className="refresh-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner">⟳</span> Loading...
                            </>
                        ) : (
                            <>🔄 Refresh</>
                        )}
                    </button>
                </div>

                {/* Table Section */}
                <div className="table-section">
                    {loading && sessions.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">⏳</span>
                            <p>Loading active sessions...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">🟢</span>
                            <p>No active sessions</p>
                            <div className="sub-text">All users are currently offline</div>
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Device</th>
                                        <th>IP Address</th>
                                        <th>Router</th>
                                        <th>Started</th>
                                        <th>Expires</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessions.map((session) => {
                                        const expiringSoon = isExpiringSoon(session.expiration_time);
                                        const expired = isExpired(session.expiration_time);
                                        const duration = getSessionDuration(session.start_time);
                                        
                                        return (
                                            <tr key={session.session_id}>
                                                <td>
                                                    <div>
                                                        <div className="device-mac">{session.buyer_mac || 'N/A'}</div>
                                                        {session.device_name && (
                                                            <div className="device-label">{session.device_name}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="ip-address">{session.assigned_ip || 'N/A'}</span>
                                                </td>
                                                <td>
                                                    <span className="router-name">{session.router_name || session.router_id || 'N/A'}</span>
                                                </td>
                                                <td>
                                                    <div className="time-info">
                                                        <span className="time-main">{formatDate(session.start_time)}</span>
                                                        <span className="time-detail">
                                                            <span className="duration-badge">⏱ {duration}</span>
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="time-info">
                                                        <span className={`time-main ${expired ? 'expiry-danger' : expiringSoon ? 'expiry-warning' : ''}`}>
                                                            {formatDate(session.expiration_time)}
                                                        </span>
                                                        {expired && (
                                                            <span className="time-detail expiry-danger">⚠️ Expired</span>
                                                        )}
                                                        {expiringSoon && !expired && (
                                                            <span className="time-detail expiry-warning">⏳ Expiring soon</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => terminate(session.session_id)}
                                                        className="terminate-btn"
                                                        disabled={terminatingId === session.session_id}
                                                    >
                                                        {terminatingId === session.session_id ? (
                                                            <span className="loading-spinner"></span>
                                                        ) : (
                                                            '⛔ Terminate'
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Sessions;