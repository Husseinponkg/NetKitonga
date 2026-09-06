import React, { useState, useEffect } from "react";
import { API_BASE_URL as API_ROOT } from "../api";

function Routers() {
    const [routerName, setRouterName] = useState("");
    const [driverType, setDriverType] = useState("mikrotik_radius");
    const [nasIdentifier, setNasIdentifier] = useState("");
    const [radiusSecret, setRadiusSecret] = useState("");
    const [gwId, setGwId] = useState("");
    const [macAddress, setMacAddress] = useState("");
    const [isLicensed, setIsLicensed] = useState(true);

    const [routerList, setRouterList] = useState([]);
    const [provisioningScript, setProvisioningScript] = useState("");
    const [uiMessage, setUiMessage] = useState("");
    const [editingRouterId, setEditingRouterId] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = `${API_ROOT}/routers`;

    const fetchRouters = async () => {
        try {
            const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
            const tenantId = user.id || 1;

            const response = await fetch(`${API_BASE_URL}?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                setRouterList(Array.isArray(data.routers) ? data.routers : []);
            }
        } catch (error) {
            console.error("Error fetching routers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRouters();
    }, []);

    useEffect(() => {
        const statusTimer = setInterval(async () => {
            setRouterList((currentRouters) => {
                currentRouters.forEach(async (router) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/status?router_id=${router.id}`);
                        if (!response.ok) return;
                        const status = await response.json();
                        setRouterList((latestRouters) => latestRouters.map((latestRouter) =>
                            latestRouter.id === router.id
                                ? { ...latestRouter, status: status.status }
                                : latestRouter
                        ));
                    } catch (error) {
                        console.error("Error checking router status:", error);
                    }
                });
                return currentRouters;
            });
        }, 10000);

        return () => clearInterval(statusTimer);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUiMessage("");
        setProvisioningScript("");

        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        const tenantId = user.id || 1;

        const routerData = {
            tenant_id: tenantId,
            branch_id: 1,
            router_name: routerName,
            driver_type: driverType,
            nas_identifier: driverType === "mikrotik_radius" ? nasIdentifier : null,
            radius_secret: driverType === "mikrotik_radius" ? radiusSecret : null,
            gw_id: driverType === "ruijie_wifidog" ? gwId : null,
            mac_address: macAddress,
            is_licensed: isLicensed,
            status: "offline",
            last_heartbeat_at: null
        };

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(routerData)
            });

            const result = await response.json();

            if (response.ok) {
                setUiMessage("Router successfully saved to PostgreSQL!");
                if (result.configuration && result.configuration.hardware_config_block) {
                    setProvisioningScript(result.configuration.hardware_config_block);
                }
                clearForm();
                fetchRouters();
            } else {
                setUiMessage(`Registration failed: ${result.detail || result.message}`);
            }
        } catch (error) {
            setUiMessage("Could not communicate with the billing server engine.");
        }
    };

    const handleUpdate = async (routerId) => {
        setUiMessage("");
        const response = await fetch(`${API_BASE_URL}/update`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                router_id: routerId,
                router_name: routerName,
                driver_type: driverType,
                nas_identifier: driverType === "mikrotik_radius" ? nasIdentifier : null,
                radius_secret: driverType === "mikrotik_radius" ? radiusSecret : null,
                gw_id: driverType === "ruijie_wifidog" ? gwId : null,
                mac_address: macAddress,
                is_licensed: isLicensed,
                status: "offline"
            })
        });

        const result = await response.json();
        if (response.ok) {
            setUiMessage("Router configuration updated successfully!");
            setEditingRouterId(null);
            clearForm();
            fetchRouters();
        } else {
            setUiMessage(`Update failed: ${result.detail || result.message}`);
        }
    };

    const deleteRouter = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ router_id: id })
            });
            const result = await response.json();
            if (response.ok) {
                setUiMessage("Router deleted successfully.");
                fetchRouters();
            } else {
                setUiMessage(`Delete failed: ${result.detail || result.message}`);
            }
        } catch (error) {
            console.error("Error deleting router:", error);
        }
    };

    const startEditing = (router) => {
        setEditingRouterId(router.id);
        setRouterName(router.router_name);
        setDriverType(router.driver_type);
        setMacAddress(router.mac_address || "");
        if (router.driver_type === "mikrotik_radius") {
            setNasIdentifier(router.nas_identifier || "");
            setRadiusSecret(router.radius_secret || "");
            setGwId("");
        } else {
            setGwId(router.gw_id || "");
            setNasIdentifier("");
            setRadiusSecret("");
        }
    };

    const clearForm = () => {
        setRouterName("");
        setNasIdentifier("");
        setRadiusSecret("");
        setGwId("");
        setMacAddress("");
        setEditingRouterId(null);
        setProvisioningScript("");
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

                .routers-container {
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

                .status-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(76, 175, 80, 0.1);
                    padding: 4px 12px;
                    border-radius: 4px;
                    color: #81c784;
                    font-size: 0.75rem;
                    font-weight: 500;
                }

                .status-indicator .dot {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background: #81c784;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
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

                .content-wrapper {
                    display: grid;
                    grid-template-columns: minmax(280px, 380px) 1fr;
                    gap: 20px;
                    align-items: start;
                }

                .form-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 20px;
                    animation: fadeIn 0.6s ease-out 0.1s both;
                    position: sticky;
                    top: 20px;
                }

                .form-section:hover {
                    border-color: rgba(229, 9, 20, 0.15);
                }

                .form-section h3 {
                    margin: 0 0 16px 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #ffffff;
                }

                .form-group {
                    margin-bottom: 12px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #808080;
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: 8px 12px;
                    background: rgba(20, 20, 20, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    color: #ffffff;
                    font-size: 0.85rem;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    -webkit-appearance: none;
                    appearance: none;
                }

                .form-group input:focus,
                .form-group select:focus {
                    border-color: rgba(229, 9, 20, 0.4);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.08);
                    background: rgba(30, 30, 30, 0.9);
                }

                .form-group input::placeholder {
                    color: #555;
                }

                .form-group select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23808080' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 36px;
                    cursor: pointer;
                }

                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 2px 0;
                }

                .checkbox-group input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    accent-color: #e50914;
                    cursor: pointer;
                }

                .checkbox-group label {
                    font-size: 0.85rem;
                    color: #e5e5e5;
                    cursor: pointer;
                    text-transform: none;
                    letter-spacing: 0;
                }

                .form-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: 16px;
                    flex-wrap: wrap;
                }

                .form-buttons button {
                    flex: 1;
                    min-width: 80px;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .submit-btn {
                    background: #e50914;
                    color: white;
                }

                .submit-btn:hover {
                    background: #f40612;
                    transform: scale(1.02);
                    box-shadow: 0 4px 20px rgba(229, 9, 20, 0.3);
                }

                .submit-btn:active {
                    transform: scale(0.98);
                }

                .cancel-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: #808080;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .script-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 20px;
                    animation: fadeIn 0.6s ease-out 0.15s both;
                }

                .script-section:hover {
                    border-color: rgba(229, 9, 20, 0.15);
                }

                .script-section h3 {
                    margin: 0 0 12px 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #ffffff;
                }

                .script-container {
                    background: #0a0a0a;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 14px;
                    max-height: 300px;
                    overflow-y: auto;
                    position: relative;
                }

                .script-container pre {
                    margin: 0;
                    font-family: 'Courier New', monospace;
                    font-size: 0.7rem;
                    color: #81c784;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    line-height: 1.8;
                }

                .script-container::-webkit-scrollbar {
                    width: 4px;
                }

                .script-container::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.03);
                }

                .script-container::-webkit-scrollbar-thumb {
                    background: rgba(229, 9, 20, 0.4);
                    border-radius: 2px;
                }

                .copy-btn {
                    width: 100%;
                    margin-top: 10px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    color: #808080;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .copy-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                }

                .list-section {
                    margin-top: 28px;
                    animation: fadeIn 0.8s ease-out 0.2s both;
                }

                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .list-header h2 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
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

                .refresh-info {
                    font-size: 0.7rem;
                    color: #555;
                }

                .router-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 14px;
                }

                .router-card {
                    background: rgba(30, 30, 30, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 16px 18px;
                    transition: all 0.3s ease;
                    animation: fadeIn 0.5s ease-out;
                }

                .router-card:hover {
                    background: rgba(35, 35, 35, 0.8);
                    border-color: rgba(229, 9, 20, 0.15);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }

                .router-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 10px;
                }

                .router-card-header h4 {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #ffffff;
                    word-break: break-word;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    white-space: nowrap;
                }

                .status-online {
                    background: rgba(76, 175, 80, 0.12);
                    color: #81c784;
                }

                .status-online::before {
                    content: '';
                    display: inline-block;
                    width: 5px;
                    height: 5px;
                    background: #81c784;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                }

                .status-offline {
                    background: rgba(229, 9, 20, 0.12);
                    color: #ff5252;
                }

                .status-offline::before {
                    content: '';
                    display: inline-block;
                    width: 5px;
                    height: 5px;
                    background: #ff5252;
                    border-radius: 50%;
                }

                .router-details {
                    font-size: 0.8rem;
                    color: #808080;
                    line-height: 1.8;
                }

                .router-details strong {
                    color: #666;
                    font-weight: 500;
                }

                .router-details .detail-value {
                    color: #e5e5e5;
                }

                .router-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                    flex-wrap: wrap;
                }

                .router-actions button {
                    flex: 1;
                    min-width: 60px;
                    padding: 5px 10px;
                    border: none;
                    border-radius: 3px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }

                .edit-btn {
                    background: rgba(100, 149, 237, 0.15);
                    color: #6495ed;
                    border: 1px solid rgba(100, 149, 237, 0.2);
                }

                .edit-btn:hover {
                    background: rgba(100, 149, 237, 0.25);
                }

                .delete-btn {
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff5252;
                    border: 1px solid rgba(229, 9, 20, 0.2);
                }

                .delete-btn:hover {
                    background: rgba(229, 9, 20, 0.25);
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
                @media (max-width: 1024px) {
                    .content-wrapper {
                        grid-template-columns: 1fr;
                    }

                    .form-section {
                        position: static;
                        max-width: 500px;
                        margin: 0 auto;
                        width: 100%;
                    }

                    .script-section {
                        max-width: 500px;
                        margin: 0 auto;
                        width: 100%;
                    }
                }

                @media (max-width: 768px) {
                    .routers-container {
                        padding: 0;
                    }

                    .router-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-buttons {
                        flex-direction: column;
                    }

                    .form-buttons button {
                        width: 100%;
                        min-width: unset;
                    }

                    .router-actions {
                        flex-direction: column;
                    }

                    .router-actions button {
                        width: 100%;
                    }

                    .list-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .page-header h1 {
                        font-size: 1.3rem;
                    }
                }

                @media (max-width: 480px) {
                    .form-section,
                    .script-section {
                        padding: 14px;
                    }

                    .router-card {
                        padding: 12px 14px;
                    }

                    .router-details {
                        font-size: 0.75rem;
                    }
                }

                /* Touch devices */
                @media (hover: none) {
                    .submit-btn:hover {
                        transform: none;
                        box-shadow: none;
                    }

                    .router-card:hover {
                        transform: none;
                        box-shadow: none;
                    }

                    .edit-btn:hover, .delete-btn:hover {
                        transform: none;
                    }

                    .router-actions button {
                        padding: 8px 12px;
                        min-height: 40px;
                    }

                    .copy-btn {
                        min-height: 40px;
                    }
                }
            `}</style>

            <div className="routers-container">
                {/* Header */}
                <div className="page-header">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                        <div>
                            <h1>📡 Routers <span>Registry</span></h1>
                            <p>Manage your network infrastructure</p>
                        </div>
                        <div className="status-indicator">
                            <span className="dot"></span>
                            System Active
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {uiMessage && (
                    <div className={`message-box ${uiMessage.includes("successfully") || uiMessage.includes("success") || uiMessage.includes("saved") || uiMessage.includes("updated") ? "message-success" : "message-error"}`}>
                        {uiMessage}
                    </div>
                )}

                {/* Main Content */}
                <div className="content-wrapper">
                    {/* Form Section */}
                    <form onSubmit={editingRouterId ? (e) => { e.preventDefault(); handleUpdate(editingRouterId); } : handleSubmit} className="form-section">
                        <h3>
                            {editingRouterId ? "✏️ Edit Router" : "➕ Register New Router"}
                        </h3>

                        <div className="form-group">
                            <label>Router Name</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., Main Office Router"
                                value={routerName}
                                onChange={(e) => setRouterName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Driver Type</label>
                            <select
                                value={driverType}
                                onChange={(e) => setDriverType(e.target.value)}
                            >
                                <option value="mikrotik_radius">MikroTik RouterOS (RADIUS)</option>
                                <option value="ruijie_wifidog">Ruijie / OpenWrt (Wifidog)</option>
                            </select>
                        </div>

                        {driverType === "mikrotik_radius" ? (
                            <>
                                <div className="form-group">
                                    <label>NAS Identifier</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., nas-01"
                                        value={nasIdentifier}
                                        onChange={(e) => setNasIdentifier(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>RADIUS Secret</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="Enter shared secret"
                                        value={radiusSecret}
                                        onChange={(e) => setRadiusSecret(e.target.value)}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="form-group">
                                <label>Gateway ID</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., gw-001"
                                    value={gwId}
                                    onChange={(e) => setGwId(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>MAC Address</label>
                            <input
                                type="text"
                                required
                                placeholder="AA:BB:CC:DD:EE:FF"
                                value={macAddress}
                                onChange={(e) => setMacAddress(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    checked={isLicensed}
                                    onChange={(e) => setIsLicensed(e.target.checked)}
                                    id="licensed"
                                />
                                <label htmlFor="licensed">✅ Licensed Router</label>
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" className="submit-btn">
                                {editingRouterId ? "💾 Update" : "🚀 Register"}
                            </button>
                            {editingRouterId && (
                                <button type="button" onClick={clearForm} className="cancel-btn">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Script Section */}
                    {provisioningScript && (
                        <div className="script-section">
                            <h3>🚀 Deployment Script</h3>
                            <div className="script-container">
                                <pre>{provisioningScript}</pre>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(provisioningScript);
                                    setUiMessage("📋 Script copied to clipboard!");
                                }}
                                className="copy-btn"
                            >
                                📋 Copy Script
                            </button>
                        </div>
                    )}
                </div>

                {/* Router List */}
                <div className="list-section">
                    <div className="list-header">
                        <h2>
                            📡 Registered Routers
                            <span className="count-badge">{routerList.length}</span>
                        </h2>
                        <span className="refresh-info">🔄 Auto-refresh every 10s</span>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <span className="empty-icon">⏳</span>
                            <p>Loading routers...</p>
                        </div>
                    ) : routerList.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <p>No routers registered yet</p>
                            <div className="sub-text">Add your first router using the form above</div>
                        </div>
                    ) : (
                        <div className="router-grid">
                            {routerList.map((router) => (
                                <div key={router.id} className="router-card">
                                    <div className="router-card-header">
                                        <h4>{router.router_name}</h4>
                                        <span className={`status-badge ${router.status === "online" ? "status-online" : "status-offline"}`}>
                                            {router.status === "online" ? "Online" : "Offline"}
                                        </span>
                                    </div>

                                    <div className="router-details">
                                        <div><strong>Driver:</strong> <span className="detail-value">{router.driver_type}</span></div>
                                        <div><strong>MAC:</strong> <span className="detail-value">{router.mac_address}</span></div>
                                        <div><strong>Licensed:</strong> <span className="detail-value">{router.is_licensed ? "✅ Yes" : "❌ No"}</span></div>
                                        {router.driver_type === "mikrotik_radius" && router.nas_identifier && (
                                            <div><strong>NAS ID:</strong> <span className="detail-value">{router.nas_identifier}</span></div>
                                        )}
                                        {router.driver_type === "ruijie_wifidog" && router.gw_id && (
                                            <div><strong>GW ID:</strong> <span className="detail-value">{router.gw_id}</span></div>
                                        )}
                                    </div>

                                    <div className="router-actions">
                                        <button
                                            onClick={() => startEditing(router)}
                                            className="edit-btn"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete router "${router.router_name}"?`)) {
                                                    deleteRouter(router.id);
                                                }
                                            }}
                                            className="delete-btn"
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Routers;