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

    // Format date
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

    // Calculate session duration
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

    // Check if session is expiring soon (less than 15 minutes)
    const isExpiringSoon = (expirationTime) => {
        if (!expirationTime) return false;
        const exp = new Date(expirationTime);
        const now = new Date();
        const diffMs = exp - now;
        const diffMins = diffMs / 60000;
        return diffMins > 0 && diffMins < 15;
    };

    // Check if session is expired
    const isExpired = (expirationTime) => {
        if (!expirationTime) return false;
        const exp = new Date(expirationTime);
        const now = new Date();
        return exp < now;
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

                .sessions-container {
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

                .header-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: clamp(16px, 3vw, 24px);
                }

                .session-count {
                    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
                    color: #b3b3b3;
                }

                .session-count strong {
                    color: #ffffff;
                }

                .refresh-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: clamp(8px, 1.2vw, 10px) clamp(16px, 2vw, 20px);
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #b3b3b3;
                    font-weight: 500;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .refresh-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                }

                .refresh-btn:active {
                    transform: scale(0.95);
                }

                .refresh-btn .spinner {
                    display: inline-block;
                    animation: pulse 1s ease-in-out infinite;
                }

                .success-message {
                    padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px);
                    margin: 0 0 clamp(16px, 3vw, 24px) 0;
                    background: rgba(76, 175, 80, 0.15);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 6px;
                    color: #81c784;
                    font-weight: 500;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    animation: fadeIn 0.3s ease-out;
                    word-wrap: break-word;
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

                .table-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: clamp(16px, 3vw, 24px);
                    animation: fadeIn 0.8s ease-out 0.15s both;
                    overflow: hidden;
                    min-width: 0;
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
                    animation: slideIn 0.3s ease-out;
                }

                tbody tr:hover {
                    background: rgba(30, 30, 30, 1);
                }

                tbody td {
                    padding: clamp(8px, 1.2vw, 12px) clamp(10px, 1.5vw, 14px);
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .device-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .device-mac {
                    font-family: 'Courier New', monospace;
                    font-size: clamp(0.65rem, 0.9vw, 0.75rem);
                    color: #a0aec0;
                }

                .device-label {
                    font-size: clamp(0.6rem, 0.8vw, 0.7rem);
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .ip-address {
                    font-family: 'Courier New', monospace;
                    font-size: clamp(0.7rem, 0.9vw, 0.8rem);
                    color: #a0aec0;
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
                    font-size: clamp(0.7rem, 0.9vw, 0.8rem);
                    color: #e5e5e5;
                }

                .time-detail {
                    font-size: clamp(0.6rem, 0.8vw, 0.7rem);
                    color: #666;
                }

                .duration-badge {
                    display: inline-block;
                    padding: 1px 8px;
                    border-radius: 10px;
                    font-size: clamp(0.6rem, 0.8vw, 0.7rem);
                    font-weight: 500;
                    background: rgba(255, 255, 255, 0.05);
                    color: #b3b3b3;
                }

                .expiry-warning {
                    color: #ffd54f;
                }

                .expiry-danger {
                    color: #ff6b6b;
                }

                .terminate-btn {
                    padding: 4px 14px;
                    border: none;
                    border-radius: 4px;
                    font-size: clamp(0.65rem, 0.8vw, 0.75rem);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                    background: rgba(229, 9, 20, 0.2);
                    color: #ff6b6b;
                    border: 1px solid rgba(229, 9, 20, 0.3);
                    white-space: nowrap;
                }

                .terminate-btn:hover:not(:disabled) {
                    background: rgba(229, 9, 20, 0.3);
                    border-color: rgba(229, 9, 20, 0.5);
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
                    border-top: 2px solid #ff6b6b;
                    border-radius: 50%;
                    animation: pulse 0.8s linear infinite;
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
                        min-width: 600px;
                        font-size: 0.75rem;
                    }

                    thead th, tbody td {
                        padding: 6px 8px;
                    }

                    .device-mac {
                        font-size: 0.6rem;
                    }

                    .ip-address {
                        font-size: 0.65rem;
                    }

                    .time-main {
                        font-size: 0.65rem;
                    }

                    .time-detail {
                        font-size: 0.55rem;
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

                    .device-mac {
                        font-size: 0.55rem;
                    }

                    .ip-address {
                        font-size: 0.6rem;
                    }

                    .terminate-btn {
                        padding: 3px 10px;
                        font-size: 0.55rem;
                    }

                    .duration-badge {
                        font-size: 0.55rem;
                        padding: 1px 6px;
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

                    .terminate-btn {
                        padding: 8px 14px;
                        min-height: 36px;
                    }

                    .refresh-btn {
                        min-height: 44px;
                    }
                }

                /* Print styles */
                @media print {
                    .header-actions {
                        display: none;
                    }

                    table {
                        min-width: 100% !important;
                    }

                    .terminate-btn {
                        display: none;
                    }

                    body {
                        background: white !important;
                        color: black !important;
                    }

                    .table-section {
                        background: white !important;
                        border: 1px solid #ddd !important;
                    }
                }
            `}</style>

            <div className="sessions-container">
                {/* Header */}
                <div className="page-header">
                    <h1>🔄 Active Sessions</h1>
                    <p>Monitor and manage all active user sessions</p>
                </div>

                {/* Messages */}
                {message && (
                    <div className={message.includes("successfully") || message.includes("terminated") ? "success-message" : "error-message"}>
                        {message}
                    </div>
                )}

                {/* Actions */}
                <div className="header-actions">
                    <span className="session-count">
                        <strong>{sessions.length}</strong> active session{sessions.length !== 1 ? 's' : ''}
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
                                                    <div className="device-info">
                                                        <span className="device-mac">{session.buyer_mac || 'N/A'}</span>
                                                        {session.device_name && (
                                                            <span className="device-label">{session.device_name}</span>
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