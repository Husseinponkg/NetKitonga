import React, { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import { getTenantId } from "../session";

function Subscription() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState("");
    const [provider, setProvider] = useState("Mpesa");
    const [status, setStatus] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [paymentPending, setPaymentPending] = useState(false);

    const tenantId = getTenantId();

    const loadStatus = useCallback(async () => {
        if (!tenantId) return;
        const res = await fetch(`${API_BASE_URL}/subscriptions/status?tenant_id=${tenantId}`);
        if (res.ok) {
            const data = await res.json();
            setStatus(data);
            if (data.active) navigate("/dashboard");
            else if (data.payment_status === "pending") setPaymentPending(true);
        }
    }, [tenantId, navigate]);

    // Load the subscription state from the server when this page opens.
    // eslint-disable-next-line react/set-state-in-effect
    useEffect(() => { loadStatus(); }, [loadStatus]);

    useEffect(() => {
        if (!tenantId || !paymentPending) return undefined;

        const timer = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/subscriptions/status?tenant_id=${tenantId}`);
                if (!res.ok) throw new Error("Could not check payment status.");
                const data = await res.json();
                setStatus(data);
                if (data.active) {
                    setPaymentPending(false);
                    navigate("/dashboard");
                } else if (data.payment_status === "failed") {
                    setPaymentPending(false);
                    setMessage("Payment was not completed. Please try again.");
                }
            } catch (error) {
                setMessage(error.message || "Could not check payment status.");
            }
        }, 3000);

        return () => clearInterval(timer);
    }, [tenantId, paymentPending, navigate]);

    const handlePay = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        try {
            const res = await fetch(`${API_BASE_URL}/subscriptions/checkout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenant_id: Number(tenantId), phone_number: phone.trim(), provider }),
            });
            const data = await res.json();
            if (!res.ok) {
                const detail = data.detail;
                if (detail && typeof detail === "object" && detail.status === "pending") {
                    setPaymentPending(true);
                }
                throw new Error(
                    (typeof detail === "string" ? detail : detail?.message)
                    || data.message
                    || "Checkout failed"
                );
            }
            setMessage(data.message || "Payment initiated. Complete it on your phone.");
            setPaymentPending(data.status === "pending");
        } catch (err) {
            setMessage(typeof err.message === "string" ? err.message : "Checkout failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", color: "#fff" }}>
            <div style={{ background: "#1a1a1a", padding: 32, borderRadius: 12, width: 400 }}>
                <h2>Subscription Required</h2>
                <p>Monthly subscription: 10,000 TZS</p>
                {status && (
                    <>
                        <p>Status: {status.subscription_status}</p>
                        {status.trial_ends_at && status.subscription_status === "expired" && (
                            <p>Your 30-day free period started when your account was registered.</p>
                        )}
                        {status.payment_status === "pending" && (
                            <p>Mobile payment is pending. Complete the prompt on your phone; access will continue once payment is confirmed.</p>
                        )}
                    </>
                )}
                {message && <p>{message}</p>}
                <form onSubmit={handlePay}>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" style={{ width: "100%", padding: 10, marginBottom: 10 }} required />
                    <select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 10 }}>
                        <option value="Mpesa">M-Pesa</option>
                        <option value="Airtel">Airtel</option>
                        <option value="Tigo">Tigo</option>
                        <option value="Halopesa">Halopesa</option>
                        <option value="Azampesa">Azampesa</option>
                    </select>
                    <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, background: "#e50914", border: "none", color: "#fff", cursor: "pointer" }}>
                        {loading ? "Processing..." : "Pay 10,000 TZS"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Subscription;
