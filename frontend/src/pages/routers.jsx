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

                .routers-container {
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

                .status-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(76, 175, 80, 0.15);
                    padding: 4px 12px;
                    border-radius: 20px;
                    color: #81c784;
                    font-size: clamp(0.7rem, 1vw, 0.8rem);
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

                .content-wrapper {
                    display: grid;
                    grid-template-columns: minmax(300px, 400px) 1fr;
                    gap: clamp(16px, 3vw, 24px);
                    align-items: start;
                }

                .form-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: clamp(16px, 3vw, 24px);
                    animation: fadeIn 0.6s ease-out 0.1s both;
                    position: sticky;
                    top: 20px;
                }

                .form-section h3 {
                    margin: 0 0 clamp(16px, 2.5vw, 20px) 0;
                    font-size: clamp(1rem, 1.5vw, 1.1rem);
                    font-weight: 600;
                    color: #ffffff;
                }

                .form-group {
                    margin-bottom: clamp(12px, 2vw, 16px);
                }

                .form-group label {
                    display: block;
                    font-size: clamp(0.7rem, 1vw, 0.8rem);
                    font-weight: 600;
                    color: #b3b3b3;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: clamp(8px, 1.2vw, 10px) clamp(10px, 1.5vw, 12px);
                    background: rgba(51, 51, 51, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #ffffff;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    font-family: inherit;
                    transition: all 0.2s ease;
                    -webkit-appearance: none;
                    appearance: none;
                }

                .form-group input:focus,
                .form-group select:focus {
                    background: rgba(51, 51, 51, 1);
                    border-color: rgba(229, 9, 20, 0.5);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
                }

                .form-group input::placeholder {
                    color: #666;
                }

                .form-group select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23b3b3b3' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 36px;
                    cursor: pointer;
                }

                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 0;
                }

                .checkbox-group input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    accent-color: #e50914;
                    cursor: pointer;
                }

                .checkbox-group label {
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    color: #e5e5e5;
                    cursor: pointer;
                    text-transform: none;
                    letter-spacing: 0;
                }

                .form-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: clamp(16px, 2.5vw, 20px);
                    flex-wrap: wrap;
                }

                .form-buttons button {
                    flex: 1;
                    min-width: clamp(80px, 15vw, 100px);
                    padding: clamp(8px, 1.2vw, 10px) clamp(10px, 1.5vw, 12px);
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .submit-btn {
                    background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
                    color: white;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(229, 9, 20, 0.35);
                    background: linear-gradient(135deg, #f20916 0%, #d40a16 100%);
                }

                .submit-btn:active {
                    transform: translateY(0px);
                }

                .cancel-btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: #b3b3b3;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .script-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: clamp(16px, 3vw, 24px);
                    animation: fadeIn 0.6s ease-out 0.15s both;
                }

                .script-section h3 {
                    margin: 0 0 clamp(12px, 2vw, 16px) 0;
                    font-size: clamp(1rem, 1.5vw, 1.1rem);
                    font-weight: 600;
                    color: #ffffff;
                }

                .script-container {
                    background: #0a0a0a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    padding: 16px;
                    max-height: 350px;
                    overflow-y: auto;
                    position: relative;
                }

                .script-container pre {
                    margin: 0;
                    font-family: 'Courier New', monospace;
                    font-size: clamp(0.65rem, 0.9vw, 0.75rem);
                    color: #e2e8f0;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    line-height: 1.8;
                }

                .script-container::-webkit-scrollbar {
                    width: 6px;
                }

                .script-container::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                }

                .script-container::-webkit-scrollbar-thumb {
                    background: rgba(229, 9, 20, 0.5);
                    border-radius: 3px;
                }

                .script-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(229, 9, 20, 0.7);
                }

                .copy-btn {
                    width: 100%;
                    margin-top: 12px;
                    padding: clamp(8px, 1.2vw, 10px);
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #b3b3b3;
                    font-weight: 600;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .copy-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                }

                .list-section {
                    margin-top: clamp(24px, 4vw, 40px);
                    animation: fadeIn 0.8s ease-out 0.2s both;
                }

                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: clamp(16px, 2.5vw, 20px);
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .list-header h2 {
                    margin: 0;
                    font-size: clamp(1.1rem, 1.8vw, 1.3rem);
                    font-weight: 600;
                    color: #ffffff;
                }

                .list-header .count-badge {
                    background: rgba(229, 9, 20, 0.2);
                    color: #e50914;
                    padding: 2px 12px;
                    border-radius: 12px;
                    font-size: clamp(0.7rem, 1vw, 0.8rem);
                    font-weight: 600;
                }

                .list-header .refresh-info {
                    font-size: clamp(0.65rem, 0.9vw, 0.75rem);
                    color: #666;
                }

                .router-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: clamp(12px, 2vw, 16px);
                }

                .router-card {
                    background: rgba(30, 30, 30, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 8px;
                    padding: clamp(16px, 2vw, 20px);
                    transition: all 0.3s ease;
                    animation: fadeIn 0.5s ease-out;
                }

                .router-card:hover {
                    background: rgba(30, 30, 30, 0.9);
                    border-color: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                }

                .router-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .router-card-header h4 {
                    margin: 0;
                    font-size: clamp(0.95rem, 1.2vw, 1.05rem);
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
                    font-size: clamp(0.6rem, 0.8vw, 0.7rem);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    white-space: nowrap;
                }

                .status-online {
                    background: rgba(76, 175, 80, 0.15);
                    color: #81c784;
                }

                .status-online::before {
                    content: '';
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background: #81c784;
                    border-radius: 50%;
                    animation: pulse 2s ease-in-out infinite;
                }

                .status-offline {
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff6b6b;
                }

                .status-offline::before {
                    content: '';
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    background: #ff6b6b;
                    border-radius: 50%;
                }

                .router-details {
                    font-size: clamp(0.75rem, 1vw, 0.85rem);
                    color: #b3b3b3;
                    line-height: 2;
                }

                .router-details strong {
                    color: #888;
                    font-weight: 500;
                }

                .router-details .detail-value {
                    color: #e5e5e5;
                }

                .router-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 14px;
                    flex-wrap: wrap;
                }

                .router-actions button {
                    flex: 1;
                    min-width: 60px;
                    padding: 6px 12px;
                    border: none;
                    border-radius: 4px;
                    font-size: clamp(0.65rem, 0.8vw, 0.75rem);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }

                .edit-btn {
                    background: rgba(100, 149, 237, 0.2);
                    color: #6495ed;
                    border: 1px solid rgba(100, 149, 237, 0.3);
                }

                .edit-btn:hover {
                    background: rgba(100, 149, 237, 0.3);
                    border-color: rgba(100, 149, 237, 0.5);
                }

                .delete-btn {
                    background: rgba(229, 9, 20, 0.2);
                    color: #ff6b6b;
                    border: 1px solid rgba(229, 9, 20, 0.3);
                }

                .delete-btn:hover {
                    background: rgba(229, 9, 20, 0.3);
                    border-color: rgba(229, 9, 20, 0.5);
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
                    .content-wrapper {
                        grid-template-columns: 1fr;
                    }

                    .form-section {
                        position: static;
                        max-width: 600px;
                        margin: 0 auto;
                        width: 100%;
                    }

                    .script-section {
                        max-width: 600px;
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
                        gap: 10px;
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
                }

                @media (max-width: 480px) {
                    .form-section,
                    .script-section {
                        padding: 12px;
                    }

                    .router-card {
                        padding: 14px;
                    }

                    .router-details {
                        font-size: 0.75rem;
                        line-height: 1.8;
                    }
                }

                /* Touch device optimizations */
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
                        padding: 10px 12px;
                        min-height: 44px;
                    }

                    .copy-btn {
                        min-height: 44px;
                    }
                }

                /* Print styles */
                @media print {
                    .form-section,
                    .script-section {
                        display: none;
                    }

                    .router-actions {
                        display: none;
                    }

                    .status-badge {
                        border: 1px solid #666;
                    }

                    body {
                        background: white !important;
                        color: black !important;
                    }
                }
            `}</style>

            <div className="routers-container">
                {/* Header */}
                <div className="page-header">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <h1>📡 Routers Registry</h1>
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
                    <div className={uiMessage.includes("successfully") || uiMessage.includes("success") || uiMessage.includes("saved") ? "success-message" : "error-message"}>
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