import React, { useState, useEffect } from "react";
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

    const tenantId = getTenantId();

    const loadStatus = async () => {
        if (!tenantId) return;
        const res = await fetch(`${API_BASE_URL}/subscriptions/status?tenant_id=${tenantId}`);
        if (res.ok) {
            const data = await res.json();
            setStatus(data);
            if (data.active) navigate("/dashboard");
        }
    };

    useEffect(() => { loadStatus(); }, []);

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
            if (!res.ok) throw new Error(data.detail || data.message || "Checkout failed");
            setMessage("Payment initiated. Complete on your phone.");
            // poll status
            const timer = setInterval(async () => {
                const r = await fetch(`${API_BASE_URL}/subscriptions/status?tenant_id=${tenantId}`);
                if (r.ok) {
                    const d = await r.json();
                    if (d.active) {
                        clearInterval(timer);
                        navigate("/dashboard");
                    }
                }
            }, 3000);
        } catch (err) {
            setMessage(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f", color: "#fff" }}>
            <div style={{ background: "#1a1a1a", padding: 32, borderRadius: 12, width: 400 }}>
                <h2>Subscription Required</h2>
                <p>Monthly subscription: 10,000 TZS</p>
                {status && <p>Status: {status.subscription_status}</p>}
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
