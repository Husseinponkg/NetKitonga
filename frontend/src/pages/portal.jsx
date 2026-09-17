import React, { useState, useEffect } from "react";
import { API_BASE_URL as API_ROOT } from "../api";

// ====================================================================
// PROVIDER LOGOS
// --------------------------------------------------------------------
// Drop these image files into your /public folder (or adjust paths):
//   public/mpesa.png
//   public/tigo.png
//   public/airtel.png
//   public/halopesa.png
//   public/azampesa.png
// If images fail to load, the card falls back to a text placeholder.
// ====================================================================
const PROVIDERS = [
  { id: "Mpesa",    name: "M-Pesa",       logo: "./public/mpesa.jpg" },
  { id: "Tigo",     name: "Tigo Pesa",    logo: "./public/yas.png" },
  { id: "Airtel",   name: "Airtel Money", logo: "./public/airtelmoney.png" },
  { id: "Halopesa", name: "Halopesa",     logo: "./public/halopesa.jpg" },
  { id: "Azampesa", name: "Azampesa",     logo: "./public/azampesa.jpg" },
];

function Portal() {
    const [packageCatalog, setPackageCatalog] = useState([]);
    const [selectedPackageId, setSelectedPackageId] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [mnoProvider, setProvider] = useState("Mpesa");
    const [activeTab, setActiveTab] = useState("pay");
    const [voucherCode, setVoucherCode] = useState("");
    
    const [uiMessage, setUiMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [imageErrors, setImageErrors] = useState({});

    const API_BASE_URL = API_ROOT;

    const queryParams = new URLSearchParams(window.location.search);
    const pathTenantId = window.location.pathname.split("/").filter(Boolean).pop();
    const tenantId = queryParams.get("tenant_id") || pathTenantId || null;
    const branchId = queryParams.get("branch_id");
    const routerId = queryParams.get("router_id");
    const buyerMac = queryParams.get("mac") || "unknown-device";
    const routerIp = queryParams.get("router_ip");

    const [resolvedRouter, setResolvedRouter] = useState(null);

    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || tenantId;
    };

    const resolveRouterFromIp = async () => {
        if (!routerIp || routerId || tenantId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/routers/resolve?ip_address=${encodeURIComponent(routerIp)}`);
            if (!response.ok) return;
            const data = await response.json();
            setResolvedRouter(data);
        } catch (error) {
            console.error("Failed to resolve router by IP:", error);
        }
    };

    useEffect(() => {
        resolveRouterFromIp();
    }, [routerIp, routerId, tenantId]);

    const effectiveTenantId = tenantId || resolvedRouter?.tenant_id;
    const effectiveBranchId = branchId || resolvedRouter?.branch_id;
    const effectiveRouterId = routerId || resolvedRouter?.router_id;

    const fetchActivePackages = async () => {
        try {
            let url;
            const loggedInTenantId = getTenantId();
            const resolvedRouterIp = routerIp;

            if (loggedInTenantId) {
                url = `${API_BASE_URL}/packages/catalog?tenant_id=${loggedInTenantId}`;
            } else if (effectiveRouterId) {
                url = `${API_BASE_URL}/packages/public?router_id=${effectiveRouterId}`;
            } else if (resolvedRouterIp) {
                url = `${API_BASE_URL}/packages/public?router_ip=${encodeURIComponent(resolvedRouterIp)}`;
            } else {
                throw new Error("Missing tenant, router_id, or router_ip.");
            }

            const response = await fetch(url);
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
    }, [effectiveRouterId, routerIp]);

    const handlePayAndConnect = async (e) => {
        e.preventDefault();
        setUiMessage("");
        setIsLoading(true);

        if (!selectedPackageId || !phoneNumber.trim()) {
            setUiMessage("Please select a package and enter your mobile-money number.");
            setIsLoading(false);
            return;
        }

        if (!effectiveTenantId || !effectiveBranchId || !effectiveRouterId) {
            setUiMessage("This payment portal is missing the tenant, branch, or router configuration.");
            setIsLoading(false);
            return;
        }

        try {
            const buyerResponse = await fetch(`${API_BASE_URL}/api/payments/portal/buyer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tenant_id: Number(effectiveTenantId),
                    buyer_mac: buyerMac,
                    phone_number: phoneNumber.trim()
                }),
                signal: AbortSignal.timeout(15000)
            });
            const buyerResult = await buyerResponse.json();
            if (!buyerResponse.ok) throw new Error(buyerResult.detail || "Could not register this device.");

            const checkoutPayload = {
                tenant_id: Number(effectiveTenantId),
                branch_id: Number(effectiveBranchId),
                router_id: Number(effectiveRouterId),
                package_id: parseInt(selectedPackageId),
                buyer_id: buyerResult.buyer_id,
                phone_number: phoneNumber.trim(),
                provider: mnoProvider
            };

            setUiMessage("Contacting AzamPay...");
            const response = await fetch(`${API_BASE_URL}/api/payments/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(checkoutPayload),
                signal: AbortSignal.timeout(100000)
            });
            
            const result = await response.json();

            if (response.ok) {
                const gatewayMessage = result?.message || "AzamPay accepted the request. Please check your phone and enter your mobile money PIN to complete payment.";
                setUiMessage(`✨ ${gatewayMessage}`);
            } else if (response.status === 504) {
                setUiMessage("AzamPay did not respond in time. Please try again or contact support.");
            } else {
                const detail = typeof result === 'string' ? result : (result.detail || JSON.stringify(result));
                setUiMessage(`Checkout rejected: ${detail}`);
            }
        } catch (error) {
            const message = error.message || "Failed to establish communications with the billing server platform.";
            setUiMessage(`Error: ${message}`);
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

    const handleProviderSelect = (providerId) => {
        setProvider(providerId);
        if (uiMessage && !uiMessage.includes("PIN")) {
            setUiMessage("");
        }
    };

    const handleImageError = (providerId) => {
        setImageErrors((prev) => ({ ...prev, [providerId]: true }));
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
            background: "#000000",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            padding: "16px 20px",
            margin: 0,
            position: "relative",
            overflow: "hidden"
        }}>
            <style>{`
                * { box-sizing: border-box; }

                body {
                    margin: 0;
                    padding: 0;
                    background: #000000;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
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
                    border: 1px solid #1a1a1a;
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

                .tab-btn.active::before { opacity: 0.08; }

                .tab-btn:hover:not(.active) {
                    border-color: rgba(229, 9, 20, 0.2);
                    color: rgba(255,255,255,0.7);
                }

                .form-input {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid #1f1f1f;
                    color: #ffffff;
                    transition: all 0.3s ease;
                }

                .form-input:focus {
                    border-color: #e50914;
                    background: rgba(255,255,255,0.06);
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.08);
                    outline: none;
                }

                .form-input::placeholder { color: rgba(255,255,255,0.2); }

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

                .submit-btn:hover:not(:disabled)::after { opacity: 1; }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(229, 9, 20, 0.25);
                }

                .submit-btn:active:not(:disabled) { transform: scale(0.97); }

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
                    background: rgba(70, 211, 105, 0.08);
                    border-color: #46d369;
                    color: #46d369;
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
                    border: 1px solid #1a1a1a;
                    font-size: 0.7rem;
                    color: rgba(255,255,255,0.25);
                    text-align: center;
                }

                .device-info strong { color: rgba(255,255,255,0.4); }

                /* ===== PACKAGE GRID ===== */
                .package-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 10px;
                    margin-bottom: 14px;
                    max-height: 320px;
                    overflow-y: auto;
                    padding: 2px 2px 6px 2px;
                }

                .package-grid::-webkit-scrollbar { width: 3px; }
                .package-grid::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 2px; }
                .package-grid::-webkit-scrollbar-thumb { background: rgba(229, 9, 20, 0.3); border-radius: 2px; }

                .package-card {
                    background: rgba(255,255,255,0.03);
                    border: 2px solid #1a1a1a;
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

                .package-card:active:not(.selected) { transform: scale(0.97); }

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

                .package-card .pkg-details span { display: block; }

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
                    background: rgba(70, 211, 105, 0.12);
                    color: #46d369;
                    border-color: rgba(70, 211, 105, 0.1);
                }

                .package-card .pkg-badge.best-value {
                    background: rgba(212, 175, 55, 0.12);
                    color: #f5d77b;
                    border-color: rgba(212, 175, 55, 0.1);
                }

                /* ===== PROVIDER GRID ===== */
                .provider-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 8px;
                }

                .provider-card {
                    background: rgba(255,255,255,0.03);
                    border: 2px solid #1a1a1a;
                    border-radius: 8px;
                    padding: 10px 8px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    text-align: center;
                    user-select: none;
                    -webkit-tap-highlight-color: transparent;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    min-height: 100px;
                }

                .provider-card:hover:not(.selected) {
                    border-color: rgba(255,255,255,0.15);
                    background: rgba(255,255,255,0.05);
                    transform: translateY(-2px);
                }

                .provider-card:active:not(.selected) { transform: scale(0.96); }

                .provider-card.selected {
                    border-color: #e50914;
                    background: rgba(229, 9, 20, 0.08);
                    box-shadow: 0 0 24px rgba(229, 9, 20, 0.12);
                    transform: translateY(-2px);
                }

                .provider-card.selected::after {
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
                    box-shadow: 0 2px 10px rgba(229, 9, 20, 0.4);
                }

                .provider-logo-slot {
                    width: 70px;
                    height: 44px;
                    border-radius: 6px;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid #1f1f1f;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    overflow: hidden;
                    padding: 4px;
                }

                .provider-logo-slot img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    display: block;
                }

                .provider-logo-fallback {
                    font-size: 0.5rem;
                    color: rgba(255,255,255,0.2);
                    letter-spacing: 0.5px;
                    text-transform: uppercase;
                    font-weight: 800;
                    text-align: center;
                    line-height: 1.1;
                    word-break: break-word;
                }

                .provider-card.selected .provider-logo-slot {
                    border-color: rgba(229, 9, 20, 0.6);
                    background: rgba(229, 9, 20, 0.06);
                    box-shadow: 0 0 12px rgba(229, 9, 20, 0.2);
                }

                .provider-name {
                    font-size: 0.68rem;
                    font-weight: 700;
                    color: rgba(255,255,255,0.7);
                    letter-spacing: 0.2px;
                    line-height: 1.2;
                }

                .provider-card.selected .provider-name { color: #ffffff; }

                /* ===== SELECTED SUMMARY ===== */
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

                @media (max-width: 600px) {
                    .package-grid {
                        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                        gap: 8px;
                        max-height: 260px;
                    }
                    .package-card { padding: 10px 8px; }
                    .package-card .pkg-price { font-size: 0.95rem; }

                    .provider-grid {
                        grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
                        gap: 6px;
                    }
                    .provider-card { min-height: 90px; padding: 8px 6px; }
                    .provider-logo-slot { width: 58px; height: 36px; }
                    .provider-name { font-size: 0.62rem; }

                    .selected-summary { flex-direction: column; text-align: center; }
                }

                @media (max-width: 400px) {
                    .package-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
                    .package-card { padding: 8px 6px; }
                    .package-card .pkg-name { font-size: 0.75rem; }
                    .package-card .pkg-price { font-size: 0.85rem; }
                    .package-card .pkg-details { font-size: 0.55rem; }

                    .provider-grid { grid-template-columns: repeat(3, 1fr); }
                    .provider-card { min-height: 80px; }
                    .provider-logo-slot { width: 48px; height: 32px; }
                    .provider-name { font-size: 0.55rem; }
                }

                @media (hover: none) {
                    .submit-btn:hover:not(:disabled) { transform: none; box-shadow: none; }
                    .submit-btn:hover:not(:disabled)::after { opacity: 0; }
                    .package-card:hover:not(.selected) { transform: none; }
                    .provider-card:hover:not(.selected) { transform: none; }
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
                background: "rgba(13, 13, 13, 0.95)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRadius: "16px",
                padding: "24px 24px 20px",
                border: "1px solid #1a1a1a",
                boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
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
                        <span style={{ 
                            fontSize: "1.4rem",
                            width: "36px",
                            height: "36px",
                            borderRadius: "6px",
                            background: "#e50914",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontWeight: 900
                        }}>▶</span>
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: "1.6rem", 
                            fontWeight: 900,
                            letterSpacing: "-0.5px",
                            color: "#ffffff",
                            textTransform: "uppercase"
                        }}>
                            Net <span className="brand-gradient">Kitonga</span>
                        </h1>
                    </div>
                    <p style={{ 
                        margin: "2px 0 0", 
                        color: "rgba(255,255,255,0.35)", 
                        fontSize: "0.75rem",
                        letterSpacing: "1.2px",
                        textTransform: "uppercase",
                        fontWeight: 700
                    }}>
                        Internet Supply Co.
                    </p>
                    <div style={{ 
                        width: "32px", 
                        height: "2px", 
                        background: "linear-gradient(90deg, transparent, #e50914, transparent)",
                        margin: "8px auto 0"
                    }} />
                </div>

                {/* Message */}
                {uiMessage && (
                    <div className={`message-box ${uiMessage.includes("PIN") || uiMessage.includes("sent") || uiMessage.includes("Validating") || uiMessage.includes("✨") ? "success" : "error"}`}>
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
                    border: "1px solid #1a1a1a"
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
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            fontFamily: "inherit",
                            position: "relative",
                            zIndex: 1,
                            letterSpacing: "0.8px",
                            textTransform: "uppercase"
                        }}
                    >
                        Purchase
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
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            fontFamily: "inherit",
                            position: "relative",
                            zIndex: 1,
                            letterSpacing: "0.8px",
                            textTransform: "uppercase"
                        }}
                    >
                        Voucher
                    </button>
                </div>

                {activeTab === "pay" ? (
                    <form onSubmit={handlePayAndConnect}>
                        <div style={{ marginBottom: "10px" }}>
                            <label style={{ 
                                display: "block", 
                                fontSize: "0.65rem", 
                                fontWeight: 800,
                                color: "rgba(255,255,255,0.5)",
                                marginBottom: "8px",
                                letterSpacing: "1.2px",
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

                        {/* ===== PROVIDER CARDS WITH IMAGES ===== */}
                        <div style={{ marginBottom: "14px" }}>
                            <label style={{ 
                                display: "block", 
                                fontSize: "0.65rem", 
                                fontWeight: 800,
                                color: "rgba(255,255,255,0.5)",
                                marginBottom: "8px",
                                letterSpacing: "1.2px",
                                textTransform: "uppercase"
                            }}>
                                Payment Provider <span style={{ color: "#e50914" }}>*</span>
                            </label>

                            <div className="provider-grid">
                                {PROVIDERS.map((provider) => (
                                    <div
                                        key={provider.id}
                                        className={`provider-card ${mnoProvider === provider.id ? 'selected' : ''}`}
                                        onClick={() => handleProviderSelect(provider.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleProviderSelect(provider.id);
                                            }
                                        }}
                                        aria-selected={mnoProvider === provider.id}
                                    >
                                        <div className="provider-logo-slot">
                                            {!imageErrors[provider.id] && provider.logo ? (
                                                <img
                                                    src={provider.logo}
                                                    alt={provider.name}
                                                    onError={() => handleImageError(provider.id)}
                                                />
                                            ) : (
                                                <span className="provider-logo-fallback">
                                                    {provider.name}
                                                </span>
                                            )}
                                        </div>
                                        <div className="provider-name">{provider.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ 
                                display: "block", 
                                fontSize: "0.65rem", 
                                fontWeight: 800,
                                color: "rgba(255,255,255,0.5)",
                                marginBottom: "6px",
                                letterSpacing: "1.2px",
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
                                    fontFamily: "inherit"
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
                                fontSize: "0.65rem", 
                                fontWeight: 800,
                                color: "rgba(255,255,255,0.5)",
                                marginBottom: "6px",
                                letterSpacing: "1.2px",
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
                                    letterSpacing: "2px"
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