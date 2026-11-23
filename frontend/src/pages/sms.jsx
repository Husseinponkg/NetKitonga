import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";
import { getTenantId } from "../session";

function SMS() {
    const [customerList, setCustomerList] = useState([]);
    const [selectedNumbers, setSelectedNumbers] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [uiMessage, setUiMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const getSessionTenantId = () => getTenantId();

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
                setUiMessage(`SMS sent to ${selectedNumbers.length} customer(s).`);
                setMessageText("");
                setSelectedNumbers([]);
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

    const costPerSms = 5;
    const sellPrice = 100;
    const totalCost = selectedNumbers.length * costPerSms;
    const totalRevenue = selectedNumbers.length * sellPrice;

    return (
        <div style={{ padding: "20px", color: "#fff", background: "#0f0f0f", minHeight: "100vh" }}>
            <h1 style={{ color: "#e50914" }}>Bulk SMS</h1>
            <p style={{ color: "#888" }}>Send mobile SMS to your customers. Cost: {costPerSms} TSH/SMS, Sell: {sellPrice} TSH/SMS</p>

            {uiMessage && (
                <div style={{ padding: "10px", marginBottom: "15px", borderRadius: "6px", background: isSuccess ? "rgba(70,211,105,0.1)" : "rgba(229,9,20,0.1)", borderLeft: `3px solid ${isSuccess ? "#46d369" : "#ff5252"}`, color: isSuccess ? "#46d369" : "#ff5252" }}>
                    {uiMessage}
                </div>
            )}

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                    <h3>Customers ({customerList.length})</h3>
                    <div style={{ marginBottom: "10px" }}>
                        <button onClick={selectAll} style={{ marginRight: "8px", padding: "6px 12px", background: "#e50914", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Select All</button>
                        <button onClick={deselectAll} style={{ padding: "6px 12px", background: "#333", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Deselect All</button>
                        <span style={{ marginLeft: "10px", color: "#888" }}>Selected: {selectedNumbers.length}</span>
                    </div>
                    <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #333", borderRadius: "6px" }}>
                        {customerList.map((c, i) => (
                            <div key={i} onClick={() => toggleNumber(c.phone_number)} style={{ padding: "8px 12px", borderBottom: "1px solid #222", cursor: "pointer", background: selectedNumbers.includes(c.phone_number) ? "rgba(229,9,20,0.1)" : "transparent" }}>
                                <input type="checkbox" checked={selectedNumbers.includes(c.phone_number)} readOnly style={{ marginRight: "8px" }} />
                                <span>{c.phone_number}</span>
                                <span style={{ color: "#666", marginLeft: "10px", fontSize: "12px" }}>{c.buyer_mac}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: "300px" }}>
                    <h3>Compose Message</h3>
                    <form onSubmit={handleSend}>
                        <textarea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            placeholder="Type your SMS message here..."
                            rows={6}
                            style={{ width: "100%", padding: "10px", background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: "6px", resize: "vertical" }}
                        />
                        <div style={{ marginTop: "10px", color: "#888", fontSize: "13px" }}>
                            Characters: {messageText.length} | SMS parts: {Math.ceil(messageText.length / 160) || 1}
                        </div>
                        <div style={{ marginTop: "10px", color: "#888", fontSize: "13px" }}>
                            Total cost: {totalCost} TSH | Potential revenue: {totalRevenue} TSH
                        </div>
                        <button type="submit" disabled={isLoading} style={{ marginTop: "15px", padding: "10px 20px", background: "#e50914", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}>
                            {isLoading ? "Sending..." : `Send to ${selectedNumbers.length} customer(s)`}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SMS;
