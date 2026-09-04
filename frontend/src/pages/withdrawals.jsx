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
            ? { bg: "#dcfce7", color: "#166534" }
            : s === "rejected"
              ? { bg: "#fee2e2", color: "#991b1b" }
              : { bg: "#fef9c3", color: "#854d0e" };

    return (
        <main style={{ padding: "20px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
            <h1 style={{ marginTop: 0, color: "#0f172a", marginBottom: "20px" }}>Withdrawals</h1>

            {message && (
                <div
                    style={{
                        padding: "12px",
                        marginBottom: "20px",
                        borderRadius: "6px",
                        backgroundColor: message.includes("success") ? "#dcfce7" : "#fee2e2",
                        color: message.includes("success") ? "#166534" : "#991b1b",
                        border: `1px solid ${message.includes("success") ? "#86efac" : "#fca5a5"}`,
                    }}
                >
                    {message}
                </div>
            )}

            {loading ? (
                <div style={{ color: "#64748b" }}>Loading wallet data...</div>
            ) : (
                <>
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                            marginBottom: "30px",
                        }}
                    >
                        <div
                            style={{
                                flex: "1 1 200px",
                                padding: "20px",
                                borderRadius: "10px",
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "6px" }}>Total Earned</div>
                            <div style={{ fontSize: "22px", fontWeight: "700", color: "#166534" }}>{fmt(wallet.total_earned)}</div>
                        </div>
                        <div
                            style={{
                                flex: "1 1 200px",
                                padding: "20px",
                                borderRadius: "10px",
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "6px" }}>Total Withdrawn</div>
                            <div style={{ fontSize: "22px", fontWeight: "700", color: "#a16207" }}>{fmt(wallet.total_withdrawn)}</div>
                        </div>
                        <div
                            style={{
                                flex: "1 1 200px",
                                padding: "20px",
                                borderRadius: "10px",
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "6px" }}>Available Balance</div>
                            <div style={{ fontSize: "22px", fontWeight: "700", color: "#0284c7" }}>{fmt(wallet.current_balance)}</div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "40px",
                            flexWrap: "wrap",
                            alignItems: "flex-start",
                        }}
                    >
                        <form
                            onSubmit={handleRequest}
                            style={{
                                width: "380px",
                                backgroundColor: "#fff",
                                padding: "24px",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                flexShrink: 0,
                            }}
                        >
                            <h3 style={{ marginTop: 0, color: "#0f172a" }}>Request Withdrawal</h3>

                            <label style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}>Amount (TZS):</label>
                            <input
                                type="number"
                                required
                                min="1"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginBottom: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    boxSizing: "border-box",
                                }}
                            />

                            <label style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}>Mobile Money Number:</label>
                            <input
                                type="tel"
                                required
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="e.g. 0712345678"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginBottom: "12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    boxSizing: "border-box",
                                }}
                            />

                            <label style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}>Provider:</label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginBottom: "16px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "14px",
                                    boxSizing: "border-box",
                                    backgroundColor: "white",
                                }}
                            >
                                <option value="Mpesa">M-Pesa</option>
                                <option value="Tigo">Tigo Pesa</option>
                                <option value="Airtel">Airtel Money</option>
                                <option value="Halopesa">Halopesa</option>
                            </select>

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    backgroundColor: submitting ? "#94a3b8" : "#0284c7",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: submitting ? "wait" : "pointer",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                }}
                            >
                                {submitting ? "Processing..." : "Request Withdrawal"}
                            </button>
                        </form>

                        <div
                            style={{
                                flex: 1,
                                minWidth: "600px",
                                backgroundColor: "#fff",
                                padding: "24px",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}
                        >
                            <h3 style={{ marginTop: 0, color: "#0f172a" }}>Withdrawal History</h3>
                            {withdrawals.length === 0 ? (
                                <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>
                                    No withdrawals yet.
                                </p>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                                                <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                                                <th style={{ padding: "12px", textAlign: "left" }}>Amount</th>
                                                <th style={{ padding: "12px", textAlign: "left" }}>Provider</th>
                                                <th style={{ padding: "12px", textAlign: "left" }}>Mobile Number</th>
                                                <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                                                <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {withdrawals.map((w) => {
                                                const st = statusColor(w.status);
                                                return (
                                                    <tr key={w.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                        <td style={{ padding: "12px" }}>{w.id}</td>
                                                        <td style={{ padding: "12px", fontWeight: 500 }}>{fmt(w.amount)}</td>
                                                        <td style={{ padding: "12px" }}>{w.payout_provider}</td>
                                                        <td style={{ padding: "12px" }}>{w.mobile_money_number}</td>
                                                        <td style={{ padding: "12px" }}>
                                                            <span
                                                                style={{
                                                                    display: "inline-block",
                                                                    padding: "3px 10px",
                                                                    borderRadius: "12px",
                                                                    fontSize: "12px",
                                                                    fontWeight: 600,
                                                                    backgroundColor: st.bg,
                                                                    color: st.color,
                                                                }}
                                                            >
                                                                {w.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px", fontSize: "13px", color: "#475569" }}>
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
        </main>
    );
}

export default Withdrawals;
