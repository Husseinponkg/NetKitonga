import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { clearTenantSession, getStoredTenantUser, getTenantId } from "../session";

function SMS() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [customerList, setCustomerList] = useState([]);
    const [selectedNumbers, setSelectedNumbers] = useState([]);
    const [manualPhone, setManualPhone] = useState("");
    const [messageText, setMessageText] = useState("");
    const [uiMessage, setUiMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [credits, setCredits] = useState(null);
    const [buyCount, setBuyCount] = useState(10);
    const [buyPhone, setBuyPhone] = useState("");
    const [buyProvider, setBuyProvider] = useState("Mpesa");
    const [isBuying, setIsBuying] = useState(false);
    const [lastRef, setLastRef] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);
    const user = getStoredTenantUser();

    const logout = () => {
        clearTenantSession();
        navigate("/");
    };

    const navItems = [
        { to: "/dashboard", label: "Dashboard", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>` },
        { to: "/income", label: "Revenue", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
        { to: "/routers", label: "Routers", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M7.76 7.76a6 6 0 0 0 0 8.49"/><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>` },
        { to: "/packages", label: "Packages", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>` },
        { to: "/vouchers", label: "Vouchers", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>` },
        { to: "/payments", label: "Payments", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>` },
        { to: "/withdrawals", label: "Withdrawals", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>` },
        { to: "/sessions", label: "Sessions", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>` },
        { to: "/customers", label: "Customers", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>` },
        { to: "/sms", label: "SMS", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
        { to: "/branch", label: "Branches", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>` },
        { to: "/settings", label: "Settings", icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>` },
    ];

    const getSessionTenantId = () => getTenantId();

    const fetchCredits = async () => {
        try {
            const tenantId = getSessionTenantId();
            if (!tenantId) return;
            const response = await fetch(`${API_BASE_URL}/sms/credits?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                setCredits(data);
            }
        } catch {
            console.error("Failed to fetch SMS credits");
        }
    };

    const handleBuyCredits = async () => {
        const tenantId = getSessionTenantId();
        if (!tenantId || !buyPhone.trim()) {
            setIsSuccess(false);
            setUiMessage("Enter your phone number to buy credits.");
            return;
        }
        setIsBuying(true);
        try {
            const response = await fetch(`${API_BASE_URL}/sms/buy?tenant_id=${tenantId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ count: buyCount, phone_number: buyPhone.trim(), provider: buyProvider }),
            });
            const data = await response.json();
            if (response.ok) {
                setIsSuccess(true);
                setUiMessage(`Payment initiated via AzamPay. ${buyCount} SMS credits will be added after payment confirmation.`);
                // Poll for completion
                const ref = data.gateway_reference;
                let attempts = 0;
                const poll = setInterval(async () => {
                    attempts++;
                    try {
                        const stRes = await fetch(`${API_BASE_URL}/sms/purchase/status?gateway_reference=${ref}&tenant_id=${tenantId}`);
                        const stData = await stRes.json();
                        if (stData.status === "completed") {
                            clearInterval(poll);
                            setUiMessage(`Payment successful! ${stData.message}.`);
                            fetchCredits();
                        } else if (attempts >= 20) {
                            clearInterval(poll);
                            setUiMessage("Payment pending. Credits will be added once AzamPay confirms. Refresh later.");
                            fetchCredits();
                        }
                    } catch {
                        if (attempts >= 20) clearInterval(poll);
                    }
                }, 3000);
                fetchCredits();
                setLastRef(ref);
            } else {
                setIsSuccess(false);
                setUiMessage(data.detail || "Failed to initiate purchase.");
            }
        } catch {
            setIsSuccess(false);
            setUiMessage("Network error buying credits.");
        } finally {
            setIsBuying(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!lastRef) return;
        setIsConfirming(true);
        setUiMessage("");
        try {
            const tenantId = getSessionTenantId();
            const response = await fetch(`${API_BASE_URL}/sms/purchase/confirm?gateway_reference=${lastRef}&tenant_id=${tenantId}`, { method: "POST" });
            const data = await response.json();
            if (response.ok) {
                setIsSuccess(true);
                setUiMessage(data.message || "Credits added!");
                setLastRef("");
                fetchCredits();
            } else {
                setIsSuccess(false);
                setUiMessage(data.detail || "Failed to confirm payment.");
            }
        } catch {
            setIsSuccess(false);
            setUiMessage("Network error confirming payment.");
        } finally {
            setIsConfirming(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const tenantId = getSessionTenantId();
            if (!tenantId) return;
            const response = await fetch(`${API_BASE_URL}/customers/list?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                setCustomerList(data);
            }
        } catch (error) {
            console.error("Failed to fetch customers:", error);
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchCredits();
    }, []);

    const toggleNumber = (phone) => {
        setSelectedNumbers(prev =>
            prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
        );
    };

    const selectAll = () => {
        const numbers = customerList.map(c => c.phone_number).filter(Boolean);
        setSelectedNumbers(numbers);
    };

    const deselectAll = () => setSelectedNumbers([]);

    const addManualPhone = () => {
        const num = manualPhone.trim();
        if (!num) return;
        const normalized = num.startsWith("0") ? "255" + num.slice(1) : num;
        if (!selectedNumbers.includes(normalized)) {
            setSelectedNumbers(prev => [...prev, normalized]);
        }
        setManualPhone("");
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setUiMessage("");
        setIsSuccess(true);

        if (selectedNumbers.length === 0) {
            setIsSuccess(false);
            setUiMessage("Select at least one customer.");
            return;
        }
        if (!messageText.trim()) {
            setIsSuccess(false);
            setUiMessage("Enter a message.");
            return;
        }

        const tenantId = getSessionTenantId();
        if (!tenantId) {
            setIsSuccess(false);
            setUiMessage("Tenant session missing.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/sms/send?tenant_id=${tenantId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone_numbers: selectedNumbers,
                    text: messageText.trim(),
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setIsSuccess(true);
                setUiMessage(`SMS sent to ${selectedNumbers.length} customer(s). Credits used: ${data.credits_used}.`);
                setMessageText("");
                setSelectedNumbers([]);
                fetchCredits();
            } else {
                setIsSuccess(false);
                setUiMessage(data.detail || "Failed to send SMS.");
            }
        } catch {
            setIsSuccess(false);
            setUiMessage("Network error sending SMS.");
        } finally {
            setIsLoading(false);
        }
    };

    const costPerSms = 20;
    const totalCost = selectedNumbers.length * costPerSms;

    return (
        <div className="sms-root">
            <style>{`
                * { box-sizing: border-box; }
                html, body { margin: 0; padding: 0; background: #000000; overflow-y: auto; min-height: 100vh; -webkit-font-smoothing: antialiased; }

                .sms-root { display: flex; min-height: 100vh; background: #000; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

                /* ===== SIDEBAR ===== */
                .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 90; }
                .sidebar-overlay.open { display: block; }
                @media (max-width: 768px) { .sidebar-overlay { display: none; } .sidebar-overlay.open { display: block; } }

                .sidebar { width: 220px; min-height: 100vh; background: #0a0a0a; border-right: 1px solid #1a1a1a; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; z-index: 100; transition: transform 0.3s ease; }
                @media (max-width: 768px) { .sidebar { transform: translateX(-100%); } .sidebar.open { transform: translateX(0); } }

                .sidebar-brand { padding: 20px 16px 16px; border-bottom: 1px solid #1a1a1a; display: flex; align-items: center; gap: 10px; }
                .sidebar-brand-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #0ea5e9, #2563eb); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
                .sidebar-brand-text h2 { margin: 0; font-size: 1rem; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
                .sidebar-brand-text p { margin: 0; font-size: 0.6rem; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; }

                .sidebar-nav { flex: 1; padding: 12px 8px; overflow-y: auto; }
                .nav-section-label { font-size: 0.55rem; font-weight: 800; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 1.5px; padding: 8px 8px 4px; margin: 0; }
                .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.8rem; font-weight: 600; transition: all 0.2s ease; margin-bottom: 2px; }
                .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.8); }
                .nav-item.active { background: rgba(229,9,20,0.08); color: #fff; border: 1px solid rgba(229,9,20,0.15); }
                .nav-icon { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; flex-shrink: 0; }

                .sidebar-footer { padding: 16px; border-top: 1px solid #1a1a1a; }
                .sidebar-user { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
                .sidebar-user-avatar { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #e50914, #c20812); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
                .sidebar-user-info p { margin: 0; font-size: 0.8rem; font-weight: 600; color: #fff; }
                .sidebar-user-info span { font-size: 0.6rem; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.5px; }
                .sidebar-logout { width: 100%; padding: 8px; background: rgba(255,255,255,0.04); border: 1px solid #1a1a1a; border-radius: 8px; color: rgba(255,255,255,0.5); font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
                .sidebar-logout:hover { background: rgba(229,9,20,0.08); color: #ff5252; border-color: rgba(229,9,20,0.2); }

                /* ===== MAIN ===== */
                .main-wrapper { flex: 1; margin-left: 220px; min-height: 100vh; background: #0a0a0a; }
                @media (max-width: 768px) { .main-wrapper { margin-left: 0; } }

                .top-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 1px solid #1a1a1a; background: rgba(10,10,10,0.8); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 50; }
                .top-bar-left { display: flex; align-items: center; gap: 12px; }
                .hamburger { display: none; background: none; border: none; color: #fff; cursor: pointer; padding: 4px; }
                @media (max-width: 768px) { .hamburger { display: flex; } }
                .top-bar-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
                .top-bar-title span { color: rgba(255,255,255,0.3); font-weight: 400; font-size: 0.85rem; }
                .top-bar-right { display: flex; align-items: center; gap: 8px; }
                .status-pill { display: flex; align-items: center; gap: 6px; padding: 5px 12px; background: rgba(70,211,105,0.08); border: 1px solid rgba(70,211,105,0.15); border-radius: 20px; font-size: 0.7rem; font-weight: 600; color: #46d369; }
                .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #46d369; animation: pulse 2s infinite; }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

                .content { padding: 24px; max-width: 1200px; margin: 0 auto; }

                /* ===== CARDS ===== */
                .card { background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
                .card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
                .card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #fff; }
                .card-header .icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

                .msg-box { padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem; border-left: 3px solid; }
                .msg-box.success { background: rgba(70,211,105,0.08); border-color: #46d369; color: #46d369; }
                .msg-box.error { background: rgba(229,9,20,0.08); border-color: #ff5252; color: #ff5252; }

                .btn { padding: 8px 16px; border: none; border-radius: 8px; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.2s; }
                .btn-primary { background: linear-gradient(135deg, #e50914, #c20812); color: #fff; }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(229,9,20,0.3); }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                .btn-green { background: linear-gradient(135deg, #46d369, #2ea043); color: #fff; }
                .btn-green:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(70,211,105,0.3); }
                .btn-green:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

                .input { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid #1f1f1f; color: #fff; border-radius: 8px; font-size: 0.85rem; font-family: inherit; }
                .input:focus { border-color: #e50914; outline: none; box-shadow: 0 0 0 3px rgba(229,9,20,0.08); }

                .textarea { width: 100%; padding: 10px 14px; background: rgba(255,255,255,0.04); border: 1px solid #1f1f1f; color: #fff; border-radius: 8px; font-size: 0.85rem; font-family: inherit; resize: vertical; min-height: 100px; }
                .textarea:focus { border-color: #e50914; outline: none; box-shadow: 0 0 0 3px rgba(229,9,20,0.08); }

                .customer-list { max-height: 360px; overflow-y: auto; border: 1px solid #1a1a1a; border-radius: 8px; }
                .customer-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #1a1a1a; cursor: pointer; transition: background 0.15s; }
                .customer-row:hover { background: rgba(255,255,255,0.03); }
                .customer-row.selected { background: rgba(229,9,20,0.06); }
                .customer-row:last-child { border-bottom: none; }
                .customer-checkbox { width: 16px; height: 16px; accent-color: #e50914; cursor: pointer; }
                .customer-phone { font-size: 0.85rem; color: #fff; font-weight: 600; }
                .customer-mac { font-size: 0.7rem; color: rgba(255,255,255,0.3); }

                .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
                .stat-card { background: #111; border: 1px solid #1a1a1a; border-radius: 10px; padding: 16px; }
                .stat-label { font-size: 0.6rem; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                .stat-value { font-size: 1.4rem; font-weight: 800; color: #fff; }
                .stat-value.red { color: #e50914; }
                .stat-value.green { color: #46d369; }

                .buy-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 12px; }
                .buy-row input, .buy-row select { padding: 8px 12px; background: rgba(255,255,255,0.04); border: 1px solid #1f1f1f; color: #fff; border-radius: 8px; font-size: 0.85rem; font-family: inherit; }
                .buy-row input:focus, .buy-row select:focus { border-color: #e50914; outline: none; }

                @media (max-width: 768px) {
                    .content { padding: 16px; }
                    .stat-grid { grid-template-columns: 1fr 1fr; }
                    .sms-grid { grid-template-columns: 1fr !important; }
                    .buy-row { flex-direction: column; align-items: stretch; }
                    .buy-row input, .buy-row select { width: 100%; }
                }
            `}</style>

            {/* Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

            {/* ===== SIDEBAR ===== */}
            <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg></div>
                    <div className="sidebar-brand-text">
                        <h2>Net Kitonga</h2>
                        <p>Internet Supply Co.</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <p className="nav-section-label">Main</p>
                    {navItems.slice(0, 1).map((item) => (
                        <Link key={item.to} to={item.to} className={`nav-item ${location.pathname === item.to ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                            <span className="nav-icon"><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, color: "#b3b3b3" }} dangerouslySetInnerHTML={{ __html: item.icon }} /></span>
                            {item.label}
                        </Link>
                    ))}
                    <p className="nav-section-label">Operations</p>
                    {navItems.slice(1, 6).map((item) => (
                        <Link key={item.to} to={item.to} className={`nav-item ${location.pathname === item.to ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                            <span className="nav-icon"><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, color: "#b3b3b3" }} dangerouslySetInnerHTML={{ __html: item.icon }} /></span>
                            {item.label}
                        </Link>
                    ))}
                    <p className="nav-section-label">Management</p>
                    {navItems.slice(6).map((item) => (
                        <Link key={item.to} to={item.to} className={`nav-item ${location.pathname === item.to ? "active" : ""}`} onClick={() => setSidebarOpen(false)}>
                            <span className="nav-icon"><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, color: "#b3b3b3" }} dangerouslySetInnerHTML={{ __html: item.icon }} /></span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user">
                        <div className="sidebar-user-avatar">{user?.business_name ? user.business_name.charAt(0).toUpperCase() : "?"}</div>
                        <div className="sidebar-user-info">
                            <p>{user?.business_name || "Guest"}</p>
                            <span>Provider</span>
                        </div>
                    </div>
                    <button type="button" className="sidebar-logout" onClick={logout}>Logout</button>
                </div>
            </aside>

            {/* ===== MAIN ===== */}
            <div className="main-wrapper">
                <div className="top-bar">
                    <div className="top-bar-left">
                        <button className="hamburger" onClick={() => setSidebarOpen((prev) => !prev)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        </button>
                        <h1 className="top-bar-title">SMS <span>Bulk Messaging</span></h1>
                    </div>
                    <div className="top-bar-right">
                        <div className="status-pill"><span className="status-dot"></span><span>Live</span></div>
                    </div>
                </div>

                <div className="content">
                    {uiMessage && (
                        <div className={`msg-box ${isSuccess ? "success" : "error"}`}>{uiMessage}</div>
                    )}

                    {/* Stats */}
                    <div className="stat-grid">
                        <div className="stat-card">
                            <div className="stat-label">SMS Credits</div>
                            <div className="stat-value red">{credits ? credits.balance : "—"}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Cost per SMS</div>
                            <div className="stat-value">50 TSH</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Selected</div>
                            <div className="stat-value">{selectedNumbers.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Total Cost</div>
                            <div className="stat-value green">{totalCost} TSH</div>
                        </div>
                    </div>

                    {/* Buy Credits */}
                    <div className="card">
                        <div className="card-header">
                            <div className="icon" style={{ background: "rgba(70,211,105,0.1)" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#46d369" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            </div>
                            <h3>Buy SMS Credits (AzamPay)</h3>
                        </div>

                        <div className="buy-row">
                            <input type="number" min="1" value={buyCount} onChange={(e) => setBuyCount(parseInt(e.target.value) || 1)} placeholder="Qty" />
                            <input type="tel" placeholder="Phone number" value={buyPhone} onChange={(e) => setBuyPhone(e.target.value)} />
                            <select value={buyProvider} onChange={(e) => setBuyProvider(e.target.value)}>
                                <option value="Mpesa">M-Pesa</option>
                                <option value="Tigo">Tigo Pesa</option>
                                <option value="Airtel">Airtel Money</option>
                                <option value="Halopesa">Halopesa</option>
                            </select>
                            <button className="btn btn-green" onClick={handleBuyCredits} disabled={isBuying}>
                                {isBuying ? "Processing..." : `Buy ${buyCount} Credits (${buyCount * 50} TSH)`}
                            </button>
                        </div>
                    </div>

                    {/* Customers + Compose */}
                    <div className="sms-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                        <div className="card">
                            <div className="card-header">
                                <div className="icon" style={{ background: "rgba(229,9,20,0.1)" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e50914" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <h3>Customers ({customerList.length})</h3>
                            </div>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                <button className="btn btn-primary" onClick={selectAll} style={{ fontSize: "0.7rem", padding: "6px 12px" }}>Select All</button>
                                <button className="btn" onClick={deselectAll} style={{ fontSize: "0.7rem", padding: "6px 12px", background: "#1a1a1a", color: "#fff", border: "1px solid #333" }}>Deselect All</button>
                                <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", alignSelf: "center" }}>Selected: {selectedNumbers.length}</span>
                            </div>
                            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                                <input type="tel" placeholder="Enter phone number manually" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} style={{ flex: 1, padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid #1f1f1f", color: "#fff", borderRadius: "8px", fontSize: "0.85rem", fontFamily: "inherit" }} />
                                <button type="button" className="btn btn-green" onClick={addManualPhone} style={{ fontSize: "0.7rem", padding: "6px 12px" }}>Add</button>
                            </div>
                            <div className="customer-list">
                                {customerList.map((c, i) => (
                                    <div key={i} className={`customer-row ${selectedNumbers.includes(c.phone_number) ? "selected" : ""}`} onClick={() => toggleNumber(c.phone_number)}>
                                        <input type="checkbox" className="customer-checkbox" checked={selectedNumbers.includes(c.phone_number)} readOnly />
                                        <div>
                                            <div className="customer-phone">{c.phone_number}</div>
                                            <div className="customer-mac">{c.buyer_mac}</div>
                                        </div>
                                    </div>
                                ))}
                                {selectedNumbers.filter(n => !customerList.some(c => c.phone_number === n)).map((n, i) => (
                                    <div key={`manual-${i}`} className="customer-row selected" onClick={() => toggleNumber(n)}>
                                        <input type="checkbox" className="customer-checkbox" checked={true} readOnly />
                                        <div>
                                            <div className="customer-phone">{n}</div>
                                            <div className="customer-mac">Manual entry</div>
                                        </div>
                                    </div>
                                ))}
                                {customerList.length === 0 && selectedNumbers.length === 0 && (
                                    <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>No customers found</div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <div className="icon" style={{ background: "rgba(229,9,20,0.1)" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e50914" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                </div>
                                <h3>Compose Message</h3>
                            </div>
                            <form onSubmit={handleSend}>
                                <textarea
                                    className="textarea"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your SMS message here..."
                                    rows={6}
                                />
                                <div style={{ marginTop: "8px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                                    Characters: {messageText.length} | SMS parts: {Math.ceil(messageText.length / 160) || 1}
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: "12px", width: "100%" }}>
                                    {isLoading ? "Sending..." : `Send to ${selectedNumbers.length} customer(s)`}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SMS;
