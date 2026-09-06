import React, { useState, useEffect } from "react";
import { API_BASE_URL as API_ROOT } from "../api";

function Portal() {
    const [packageCatalog, setPackageCatalog] = useState([]);
    const [selectedPackageId, setSelectedPackageId] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [mnoProvider, setProvider] = useState("Mpesa");
    const [activeTab, setActiveTab] = useState("pay");
    const [voucherCode, setVoucherCode] = useState("");
    
    const [uiMessage, setUiMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const API_BASE_URL = API_ROOT;

    const queryParams = new URLSearchParams(window.location.search);
    const tenantId = queryParams.get("tenant_id");
    const branchId = queryParams.get("branch_id");
    const routerId = queryParams.get("router_id");
    const buyerMac = queryParams.get("mac") || "unknown-device";

    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || tenantId;
    };

    const fetchActivePackages = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/packages/catalog?tenant_id=${getTenantId()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server returned ${response.status}`);
            }
            const data = await response.json();
            setPackageCatalog(Array.isArray(data) ? data : []);
            if (data.length > 0) {
                setSelectedPackageId(data[0].id);
            }
        } catch (error) {
            console.error("Error retrieving packages catalog:", error);
            setUiMessage(`Could not retrieve packages: ${error.message}`);
        }
    };

    useEffect(() => {
        fetchActivePackages();
    }, []);

    const handlePayAndConnect = async (e) => {
        e.preventDefault();
        setUiMessage("");
        setIsLoading(true);

        if (!selectedPackageId || !phoneNumber.trim()) {
            setUiMessage("Please select a package and enter your mobile-money number.");
            setIsLoading(false);
            return;
        }

        if (!tenantId || !branchId || !routerId) {
            setUiMessage("This payment portal is missing the tenant, branch, or router configuration.");
            setIsLoading(false);
            return;
        }

        try {
            const buyerResponse = await fetch(`${API_BASE_URL}/api/payments/portal/buyer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: Number(tenantId),
                    buyer_mac: buyerMac,
                    phone_number: phoneNumber.trim()
                })
            });
            const buyerResult = await buyerResponse.json();
            if (!buyerResponse.ok) throw new Error(buyerResult.detail || "Could not register this device.");

            const checkoutPayload = {
                tenant_id: Number(tenantId),
                branch_id: Number(branchId),
                router_id: Number(routerId),
                package_id: parseInt(selectedPackageId),
                buyer_id: buyerResult.buyer_id,
                phone_number: phoneNumber.trim(),
                provider: mnoProvider
            };

            const response = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutPayload)
            });
            
            const result = await response.json();

            if (response.ok) {
                setUiMessage("✨ USSD Push Prompt sent! Enter your mobile money PIN on your phone to complete your payment and connect.");
            } else {
                setUiMessage(`Checkout rejected: ${result.detail || "Check input data parameters."}`);
            }
        } catch (error) {
            setUiMessage(error.message || "Failed to establish communications with the billing server platform.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoucherActivation = async (e) => {
        e.preventDefault();
        setUiMessage("Validating your token code voucher...");
    };

    const formatDurationText = (seconds) => {
        if (seconds >= 86400) {
            const days = seconds / 86400;
            return `${days} Day${days > 1 ? 's' : ''}`;
        }
        const hours = seconds / 3600;
        return `${hours} Hour${hours > 1 ? 's' : ''}`;
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return "Unlimited";
        const gb = bytes / (1024 ** 3);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
    };

    const handlePackageSelect = (packageId) => {
        setSelectedPackageId(packageId);
        if (uiMessage && !uiMessage.includes("PIN")) {
            setUiMessage("");
        }
    };

    const getSelectedPackage = () => {
        return packageCatalog.find(pkg => pkg.id === selectedPackageId);
    };

    const selectedPackage = getSelectedPackage();

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            background: "#141414",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            padding: "16px 20px",
            margin: 0,
            position: "relative",
            overflow: "hidden"
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

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes glowPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(229, 9, 20, 0.05); }
                    50% { box-shadow: 0 0 40px rgba(229, 9, 20, 0.12); }
                }
                @keyframes cardHover {
                    0% { transform: translateY(0px); }
                    100% { transform: translateY(-4px); }
                }

                .glow-pulse {
                    animation: glowPulse 3s ease-in-out infinite;
                }

                .brand-gradient {
                    background: linear-gradient(135deg, #e50914, #ff0a1a, #e50914);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shimmer 3s linear infinite;
                }

                .tab-btn {
                    background: transparent;
                    color: rgba(255,255,255,0.4);
                    border: 1px solid rgba(255,255,255,0.06);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    -webkit-tap-highlight-color: transparent;
                }

                .tab-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, #e50914, #c20812);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .tab-btn.active {
                    color: #ffffff;
                    border-color: #e50914;
                    box-shadow: 0 0 30px rgba(229, 9, 20, 0.1);
                }

                .tab-btn.active::before {
                    opacity: 0.08;
                }

                .tab-btn:hover:not(.active) {
                    border-color: rgba(229, 9, 20, 0.2);
                    color: rgba(255,255,255,0.7);
                }

                .form-input, .form-select {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.06);
                    color: #ffffff;
                    transition: all 0.3s ease;
                }

                .form-input:focus, .form-select:focus {
                    border-color: #e50914;
                    background: rgba(255,255,255,0.06);
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.08);
                    outline: none;
                }

                .form-input::placeholder {
                    color: rgba(255,255,255,0.2);
                }

                .form-select option {
                    background: #1a1a1a;
                    color: #ffffff;
                }

                .submit-btn {
                    background: linear-gradient(135deg, #e50914, #c20812);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    -webkit-tap-highlight-color: transparent;
                }

                .submit-btn::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, #ff0a1a, #d40a16);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .submit-btn:hover:not(:disabled)::after {
                    opacity: 1;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(229, 9, 20, 0.25);
                }

                .submit-btn:active:not(:disabled) {
                    transform: scale(0.97);
                }

                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .spinner {
                    border: 2px solid rgba(255,255,255,0.1);
                    border-top-color: #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .message-box {
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-size: 0.85rem;
                    animation: fadeIn 0.4s ease-out;
                    border-left: 3px solid;
                }

                .message-box.success {
                    background: rgba(76, 175, 80, 0.08);
                    border-color: #81c784;
                    color: #81c784;
                }

                .message-box.error {
                    background: rgba(229, 9, 20, 0.08);
                    border-color: #ff5252;
                    color: #ff5252;
                }

                .device-info {
                    background: rgba(255,255,255,0.03);
                    border-radius: 6px;
                    padding: 8px 14px;
                    border: 1px solid rgba(255,255,255,0.04);
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.25);
                    text-align: center;
                }

                .device-info strong {
                    color: rgba(255,255,255,0.4);
                }

                .package-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 10px;
                    margin-bottom: 14px;
                    max-height: 320px;
                    overflow-y: auto;
                    padding: 2px 2px 6px 2px;
                }

                .package-grid::-webkit-scrollbar {
                    width: 3px;
                }

                .package-grid::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                    border-radius: 2px;
                }

                .package-grid::-webkit-scrollbar-thumb {
                    background: rgba(229, 9, 20, 0.3);
                    border-radius: 2px;
                }

                .package-card {
                    background: rgba(255,255,255,0.03);
                    border: 2px solid rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 14px 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    text-align: center;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                }

                .package-card:hover:not(.selected) {
                    border-color: rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    transform: translateY(-2px);
                }

                .package-card:active:not(.selected) {
                    transform: scale(0.97);
                }

                .package-card.selected {
                    border-color: #e50914;
                    background: rgba(229, 9, 20, 0.06);
                    box-shadow: 0 0 20px rgba(229, 9, 20, 0.08);
                    transform: translateY(-2px);
                }

                .package-card.selected::after {
                    content: '✓';
                    position: absolute;
                    top: -7px;
                    right: -7px;
                    background: #e50914;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    font-size: 11px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 10px rgba(229, 9, 20, 0.3);
                }

                .package-card .pkg-name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #ffffff;
                    margin-bottom: 3px;
                }

                .package-card .pkg-price {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #e50914;
                    margin-bottom: 3px;
                }

                .package-card .pkg-details {
                    font-size: 0.65rem;
                    color: rgba(255,255,255,0.35);
                    line-height: 1.6;
                }

                .package-card .pkg-details span {
                    display: block;
                }

                .package-card .pkg-badge {
                    display: inline-block;
                    padding: 1px 8px;
                    border-radius: 12px;
                    font-size: 0.55rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    background: rgba(229, 9, 20, 0.12);
                    color: #e50914;
                    border: 1px solid rgba(229, 9, 20, 0.1);
                    margin-top: 4px;
                }

                .package-card .pkg-badge.popular {
                    background: rgba(76, 175, 80, 0.12);
                    color: #81c784;
                    border-color: rgba(76, 175, 80, 0.1);
                }

                .package-card .pkg-badge.best-value {
                    background: rgba(212, 175, 55, 0.12);
                    color: #f5d77b;
                    border-color: rgba(212, 175, 55, 0.1);
                }

                .selected-summary {
                    background: rgba(229, 9, 20, 0.04);
                    border: 1px solid rgba(229, 9, 20, 0.08);
                    border-radius: 8px;
                    padding: 10px 14px;
                    margin-bottom: 14px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 6px;
                    animation: fadeIn 0.3s ease-out;
                }

                .selected-summary .summary-label {
                    font-size: 0.6rem;
                    color: rgba(255,255,255,0.3);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .selected-summary .summary-name {
                    font-weight: 600;
                    color: #ffffff;
                    font-size: 0.9rem;
                }

                .selected-summary .summary-price {
                    font-weight: 700;
                    color: #e50914;
                    font-size: 1rem;
                }

                /* Mobile */
                @media (max-width: 600px) {
                    .package-grid {
                        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                        gap: 8px;
                        max-height: 260px;
                    }

                    .package-card {
                        padding: 10px 8px;
                    }

                    .package-card .pkg-price {
                        font-size: 0.95rem;
                    }

                    .selected-summary {
                        flex-direction: column;
                        text-align: center;
                    }
                }

                @media (max-width: 400px) {
                    .package-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 6px;
                    }

                    .package-card {
                        padding: 8px 6px;
                    }

                    .package-card .pkg-name {
                        font-size: 0.75rem;
                    }

                    .package-card .pkg-price {
                        font-size: 0.85rem;
                    }

                    .package-card .pkg-details {
                        font-size: 0.55rem;
                    }
                }

                /* Touch devices */
                @media (hover: none) {
                    .submit-btn:hover:not(:disabled) {
                        transform: none;
                        box-shadow: none;
                    }

                    .submit-btn:hover:not(:disabled)::after {
                        opacity: 0;
                    }

                    .package-card:hover:not(.selected) {
                        transform: none;
                    }
                }
            `}</style>

            {/* Background Orbs */}
            <div style={{
                position: "absolute",
                top: "-30%",
                right: "-20%",
                width: "400px",
                height: "400px",
                background: "radial-gradient(circle, rgba(229, 9, 20, 0.04), transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none"
            }} />
            <div style={{
                position: "absolute",
                bottom: "-30%",
                left: "-20%",
                width: "350px",
                height: "350px",
                background: "radial-gradient(circle, rgba(229, 9, 20, 0.03), transparent 70%)",
                borderRadius: "50%",
                pointerEvents: "none"
            }} />

            <div style={{
                maxWidth: "560px",
                width: "100%",
                background: "rgba(20, 20, 20, 0.95)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRadius: "16px",
                padding: "24px 24px 20px",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                position: "relative",
                animation: "slideUp 0.5s ease-out",
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "18px" }}>
                    <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        gap: "10px",
                        marginBottom: "2px"
                    }}>
                        <span style={{ fontSize: "1.8rem" }}>🌐</span>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: "1.6rem", 
                            fontWeight: 700,
                            letterSpacing: "-0.5px",
                            color: "#ffffff"
                        }}>
                            Net <span className="brand-gradient">Kitonga</span>
                        </h1>
                    </div>
                    <p style={{ 
                        margin: "2px 0 0", 
                        color: "rgba(255,255,255,0.35)", 
                        fontSize: "0.8rem",
                        letterSpacing: "0.3px"
                    }}>
                        Hospitality Internet Solutions
                    </p>
                    <div style={{ 
                        width: "32px", 
                        height: "2px", 
                        background: "linear-gradient(90deg, transparent, #e50914, transparent)",
                        margin: "6px auto 0"
                    }} />
                </div>

                {/* Message */}
                {uiMessage && (
                    <div className={`message-box ${uiMessage.includes("PIN") || uiMessage.includes("sent") || uiMessage.includes("Validating") ? "success" : "error"}`}>
                        {uiMessage}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ 
                    display: "flex", 
                    gap: "6px", 
                    marginBottom: "16px",
                    background: "rgba(255,255,255,0.03)",
                    padding: "4px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.04)"
                }}>
                    <button 
                        type="button" 
                        onClick={() => { setActiveTab("pay"); setUiMessage(""); }} 
                        className={`tab-btn ${activeTab === "pay" ? "active" : ""}`}
                        style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            fontFamily: "inherit",
                            position: "relative",
                            zIndex: 1,
                            letterSpacing: "0.3px"
                        }}
                    >
                        💳 Purchase
                    </button>
                    <button 
                        type="button" 
                        onClick={() => { setActiveTab("voucher"); setUiMessage(""); }} 
                        className={`tab-btn ${activeTab === "voucher" ? "active" : ""}`}
                        style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            fontFamily: "inherit",
                            position: "relative",
                            zIndex: 1,
                            letterSpacing: "0.3px"
                        }}
                    >
                        🎫 Voucher
                    </button>
                </div>

                {/* Forms */}
                {activeTab === "pay" ? (
                    <form onSubmit={handlePayAndConnect}>
                        <div style={{ marginBottom: "10px" }}>
                            <label style={{ 
                                display: "block", 
                                fontSize: "0.7rem", 
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.4)",
                                marginBottom: "6px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase"
                            }}>
                                Select Package <span style={{ color: "#e50914" }}>*</span>
                            </label>
                            
                            {packageCatalog.length === 0 ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "24px",
                                    color: "rgba(255,255,255,0.25)",
                                    fontSize: "0.85rem"
                                }}>
                                    <span style={{ display: "block", fontSize: "1.8rem", marginBottom: "6px" }}>⏳</span>
                                    Loading packages...
                                </div>
                            ) : (
                                <>
                                    <div className="package-grid">
                                        {packageCatalog.map((pkg) => (
                                            <div
                                                key={pkg.id}
                                                className={`package-card ${selectedPackageId === pkg.id ? 'selected' : ''}`}
                                                onClick={() => handlePackageSelect(pkg.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handlePackageSelect(pkg.id);
                                                    }
                                                }}
                                                aria-selected={selectedPackageId === pkg.id}
                                            >
                                                <div className="pkg-name">{pkg.package_name}</div>
                                                <div className="pkg-price">TZS {Number(pkg.price).toLocaleString()}</div>
                                                <div className="pkg-details">
                                                    <span>⏱ {formatDurationText(pkg.duration_seconds)}</span>
                                                    <span>📊 {formatBytes(pkg.data_quota_bytes)}</span>
                                                    {pkg.mikrotik_rate_limit && (
                                                        <span>⚡ {pkg.mikrotik_rate_limit}</span>
                                                    )}
                                                </div>
                                                {pkg.is_popular && (
                                                    <span className="pkg-badge popular">⭐ Popular</span>
                                                )}
                                                {pkg.is_best_value && (
                                                    <span className="pkg-badge best-value">🏆 Best Value</span>
                                                )}
                                                {!pkg.is_popular && !pkg.is_best_value && (
                                                    <span className="pkg-badge">Available</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Selected Package Summary */}
                                    {selectedPackage && (
                                        <div className="selected-summary">
                                            <div>
                                                <div className="summary-label">Selected Package</div>
                                                <div className="summary-name">{selectedPackage.package_name}</div>
                                            </div>
                                            <div>
                                                <div className="summary-label">Total</div>
                                                <div className="summary-price">TZS {Number(selectedPackage.price).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ 
                                display: "block", 
                                fontSize: "0.7rem", 
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.4)",
                                marginBottom: "4px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase"
                            }}>
                                Payment Provider <span style={{ color: "#e50914" }}>*</span>
                            </label>
                            <select 
                                value={mnoProvider} 
                                onChange={(e) => setProvider(e.target.value)} 
                                className="form-select"
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                    fontFamily: "inherit",
                                    appearance: "none",
                                    cursor: "pointer"
                                }}
                            >
                                <option value="Mpesa">📱 Vodacom M-Pesa</option>
                                <option value="Tigo">📱 Tigo Pesa</option>
                                <option value="Airtel">📱 Airtel Money</option>
                                <option value="Halopesa">📱 Halopesa</option>
                                <option value="Azampesa">📱 Azampesa</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ 
                                display: "block", 
                                fontSize: "0.7rem", 
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.4)",
                                marginBottom: "4px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase"
                            }}>
                                Phone Number <span style={{ color: "#e50914" }}>*</span>
                            </label>
                            <input 
                                type="tel" 
                                required 
                                placeholder="e.g., 0712345678" 
                                value={phoneNumber} 
                                onChange={(e) => setPhoneNumber(e.target.value)} 
                                className="form-input"
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || packageCatalog.length === 0 || !selectedPackageId} 
                            className="submit-btn"
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "none",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                fontFamily: "inherit",
                                color: "#ffffff",
                                cursor: "pointer",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner" style={{ width: "18px", height: "18px", display: "inline-block" }} />
                                    Processing...
                                </>
                            ) : (
                                "💳 Pay & Connect"
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVoucherActivation}>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ 
                                display: "block", 
                                fontSize: "0.7rem", 
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.4)",
                                marginBottom: "4px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase"
                            }}>
                                Voucher Code <span style={{ color: "#e50914" }}>*</span>
                            </label>
                            <input 
                                required 
                                value={voucherCode} 
                                onChange={(e) => setVoucherCode(e.target.value)} 
                                placeholder="Enter voucher code" 
                                className="form-input"
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    fontSize: "0.85rem",
                                    fontFamily: "inherit",
                                    textTransform: "uppercase",
                                    letterSpacing: "2px",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="submit-btn"
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "none",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                fontFamily: "inherit",
                                color: "#ffffff",
                                cursor: "pointer",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px"
                            }}
                        >
                            🎫 Activate Voucher
                        </button>
                    </form>
                )}

                {/* Device Info */}
                <div className="device-info" style={{ marginTop: "16px" }}>
                    <span style={{ marginRight: "4px" }}>📡</span>
                    <strong>Device:</strong> {buyerMac}
                </div>

                {/* Footer */}
                <div style={{ 
                    marginTop: "12px", 
                    textAlign: "center", 
                    fontSize: "0.6rem", 
                    color: "rgba(255,255,255,0.08)",
                    letterSpacing: "0.5px"
                }}>
                    © {new Date().getFullYear()} Net Kitonga — Secure Payment Gateway
                </div>
            </div>
        </div>
    );
}

export default Portal;