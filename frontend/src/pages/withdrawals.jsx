import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Withdrawals() {
    const [wallet, setWallet] = useState({ total_earned: 0, total_withdrawn: 0, current_balance: 0 });
    const [withdrawals, setWithdrawals] = useState([]);
    const [amount, setAmount] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [provider, setProvider] = useState("Mpesa");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || 1;
    };

    const fetchWallet = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/withdrawals/balance?tenant_id=${getTenantId()}`);
            if (res.ok) {
                const data = await res.json();
                setWallet(data);
            }
        } catch (err) {
            console.error("Error fetching wallet:", err);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/withdrawals/history?tenant_id=${getTenantId()}`);
            if (res.ok) {
                const data = await res.json();
                setWithdrawals(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Error fetching withdrawals:", err);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchWallet(), fetchHistory()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRequest = async (e) => {
        e.preventDefault();
        setMessage("");
        setSubmitting(true);

        const withdrawAmount = parseFloat(amount);
        if (!withdrawAmount || withdrawAmount <= 0) {
            setMessage("Enter a valid amount.");
            setSubmitting(false);
            return;
        }
        if (withdrawAmount > wallet.current_balance) {
            setMessage("Insufficient balance.");
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/withdrawals/request?tenant_id=${getTenantId()}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: withdrawAmount,
                    mobile_money_number: mobileNumber.trim(),
                    payout_provider: provider
                })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage("Withdrawal request submitted successfully!");
                setAmount("");
                setMobileNumber("");
                loadData();
            } else {
                setMessage(data.detail || "Withdrawal request failed.");
            }
        } catch (err) {
            setMessage("Could not communicate with server.");
        } finally {
            setSubmitting(false);
        }
    };

    const fmt = (n) =>
        new Intl.NumberFormat("en-TZ", {
            style: "currency",
            currency: "TZS",
            minimumFractionDigits: 0,
        }).format(n || 0);

    const statusColor = (s) =>
        s === "approved"
            ? { bg: "rgba(76, 175, 80, 0.12)", color: "#81c784" }
            : s === "rejected"
              ? { bg: "rgba(229, 9, 20, 0.12)", color: "#ff5252" }
              : { bg: "rgba(255, 193, 7, 0.12)", color: "#fbc02d" };

    return (
        <main style={{ 
            padding: "16px 20px", 
            background: "#141414", 
            color: "#ffffff", 
            minHeight: "100vh",
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
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

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .withdrawals-container {
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

                .loading-box {
                    text-align: center;
                    padding: 40px 20px;
                    color: #808080;
                    font-size: 0.9rem;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 14px;
                    margin-bottom: 24px;
                }

                .stat-card {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 18px 16px;
                    text-align: center;
                    transition: all 0.3s ease;
                    animation: fadeIn 0.6s ease-out;
                }

                .stat-card:hover {
                    border-color: rgba(229, 9, 20, 0.15);
                    transform: translateY(-2px);
                }

                .stat-card .stat-label {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #808080;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 6px;
                }

                .stat-card .stat-value {
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: #e50914;
                }

                .stat-card .stat-value.earned {
                    color: #e50914;
                }

                .stat-card .stat-value.withdrawn {
                    color: #808080;
                }

                .stat-card .stat-value.balance {
                    color: #81c784;
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
                    margin-bottom: 14px;
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
                    box-sizing: border-box;
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
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23808080' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 36px;
                    cursor: pointer;
                }

                .form-group select option {
                    background: #1a1a1a;
                    color: #ffffff;
                }

                .submit-btn {
                    width: 100%;
                    padding: 10px;
                    background: #e50914;
                    color: #ffffff;
                    border: none;
                    border-radius: 4px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    margin-top: 4px;
                }

                .submit-btn:hover:not(:disabled) {
                    background: #f40612;
                    transform: scale(1.02);
                    box-shadow: 0 4px 20px rgba(229, 9, 20, 0.3);
                }

                .submit-btn:active:not(:disabled) {
                    transform: scale(0.98);
                }

                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .submit-btn .spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-right: 8px;
                }

                .history-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 20px;
                    animation: fadeIn 0.8s ease-out 0.15s both;
                    overflow: hidden;
                    min-width: 0;
                }

                .history-section:hover {
                    border-color: rgba(229, 9, 20, 0.15);
                }

                .history-section h3 {
                    margin: 0 0 16px 0;
                    font-size: 1rem;
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

                .table-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                    min-width: 600px;
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
                }

                tbody tr:hover {
                    background: rgba(40, 40, 40, 0.8);
                }

                tbody td {
                    padding: 8px 12px;
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .status-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .amount-highlight {
                    font-weight: 600;
                    color: #e50914;
                }

                .date-text {
                    font-size: 0.75rem;
                    color: #808080;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #808080;
                }

                .empty-state .empty-icon {
                    font-size: 2.8rem;
                    display: block;
                    margin-bottom: 10px;
                    opacity: 0.4;
                }

                .empty-state p {
                    margin: 0;
                    font-size: 0.9rem;
                }

                .empty-state .sub-text {
                    margin-top: 4px;
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

                    .history-section {
                        max-width: 100%;
                    }
                }

                @media (max-width: 768px) {
                    .withdrawals-container {
                        padding: 0;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 10px;
                    }

                    table {
                        min-width: 500px;
                        font-size: 0.8rem;
                    }

                    thead th, tbody td {
                        padding: 6px 10px;
                    }
                }

                @media (max-width: 480px) {
                    .page-header h1 {
                        font-size: 1.2rem;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                    }

                    .stat-card {
                        padding: 14px 12px;
                    }

                    .stat-card .stat-value {
                        font-size: 1.1rem;
                    }

                    .form-section {
                        padding: 14px;
                    }

                    .history-section {
                        padding: 14px;
                    }

                    table {
                        min-width: 400px;
                        font-size: 0.7rem;
                    }

                    thead th, tbody td {
                        padding: 4px 8px;
                    }

                    .status-badge {
                        font-size: 0.55rem;
                        padding: 1px 6px;
                    }

                    .date-text {
                        font-size: 0.65rem;
                    }
                }

                /* Touch devices */
                @media (hover: none) {
                    .submit-btn:hover:not(:disabled) {
                        transform: none;
                        box-shadow: none;
                    }

                    .stat-card:hover {
                        transform: none;
                    }

                    tbody tr:hover {
                        background: transparent;
                    }

                    .submit-btn {
                        min-height: 44px;
                    }

                    .form-group input,
                    .form-group select {
                        min-height: 40px;
                    }
                }
            `}</style>

            <div className="withdrawals-container">
                {/* Header */}
                <div className="page-header">
                    <h1>🏦 <span>Withdrawals</span></h1>
                    <p>Withdraw your earnings to mobile money</p>
                </div>

                {/* Message */}
                {message && (
                    <div className={`message-box ${message.includes("successfully") ? "message-success" : "message-error"}`}>
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="loading-box">
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
                        Loading wallet data...
                    </div>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-label">Total Earned</div>
                                <div className="stat-value earned">{fmt(wallet.total_earned)}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Total Withdrawn</div>
                                <div className="stat-value withdrawn">{fmt(wallet.total_withdrawn)}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Available Balance</div>
                                <div className="stat-value balance">{fmt(wallet.current_balance)}</div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="content-wrapper">
                            {/* Form */}
                            <form onSubmit={handleRequest} className="form-section">
                                <h3>💸 Request Withdrawal</h3>

                                <div className="form-group">
                                    <label>Amount (TZS)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mobile Money Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        placeholder="e.g. 0712345678"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Provider</label>
                                    <select
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                    >
                                        <option value="Mpesa">📱 M-Pesa</option>
                                        <option value="Tigo">📱 Tigo Pesa</option>
                                        <option value="Airtel">📱 Airtel Money</option>
                                        <option value="Halopesa">📱 Halopesa</option>
                                        <option value="Azampesa">📱 Azampesa</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="submit-btn"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        "Request Withdrawal"
                                    )}
                                </button>
                            </form>

                            {/* History */}
                            <div className="history-section">
                                <h3>
                                    📋 Withdrawal History
                                    <span className="count-badge">{withdrawals.length}</span>
                                </h3>

                                {withdrawals.length === 0 ? (
                                    <div className="empty-state">
                                        <span className="empty-icon">🏦</span>
                                        <p>No withdrawals yet</p>
                                        <div className="sub-text">Request your first withdrawal above</div>
                                    </div>
                                ) : (
                                    <div className="table-wrapper">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Amount</th>
                                                    <th>Provider</th>
                                                    <th>Mobile Number</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {withdrawals.map((w) => {
                                                    const st = statusColor(w.status);
                                                    return (
                                                        <tr key={w.id}>
                                                            <td style={{ color: "#808080", fontSize: "0.8rem" }}>
                                                                #{w.id}
                                                            </td>
                                                            <td className="amount-highlight">
                                                                {fmt(w.amount)}
                                                            </td>
                                                            <td style={{ color: "#808080" }}>
                                                                {w.payout_provider}
                                                            </td>
                                                            <td style={{ color: "#808080", fontSize: "0.8rem" }}>
                                                                {w.mobile_money_number}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className="status-badge"
                                                                    style={{
                                                                        backgroundColor: st.bg,
                                                                        color: st.color,
                                                                    }}
                                                                >
                                                                    {w.status}
                                                                </span>
                                                            </td>
                                                            <td className="date-text">
                                                                {new Date(w.created_at).toLocaleString()}
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
                    </>
                )}
            </div>
        </main>
    );
}

export default Withdrawals;