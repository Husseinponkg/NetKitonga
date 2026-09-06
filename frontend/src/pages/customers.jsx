import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";

function Customers() {
    const [customerList, setCustomerList] = useState([]);
    const [uiMessage, setUiMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const customerApiUrl = `${API_BASE_URL}/customers`;

    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || 1;
    };

    const fetchCustomers = async () => {
        try {
            const tenantId = getTenantId();
            const response = await fetch(`${customerApiUrl}/list?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                setCustomerList(data);
            } else {
                console.error("Failed to extract data mapping layers from database backend.");
            }
        } catch (error) {
            console.error("Network communication failure tracking customers:", error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleDeleteCustomer = async (customerId) => {
        if (!window.confirm("Are you sure you want to permanently delete this customer device registry row?")) return;
        
        setUiMessage("");
        const tenantId = getTenantId();

        try {
            const response = await fetch(`${customerApiUrl}/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: customerId,
                    tenant_id: tenantId
                })
            });

            const result = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                setUiMessage("Customer device profile successfully removed.");
                fetchCustomers();
            } else {
                setIsSuccess(false);
                setUiMessage(`Action failed: ${result.detail || "Server constraint error"}`);
            }
        } catch (error) {
            setIsSuccess(false);
            setUiMessage("Could not trace customer deletion pipeline infrastructure.");
        }
    };

    const filteredCustomers = customerList.filter(customer => 
        customer.buyer_mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone_number && customer.phone_number.includes(searchTerm))
    );

    return (
        <div style={{
            padding: "16px 20px",
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            background: "#141414",
            minHeight: "100vh",
            color: "#ffffff",
            margin: 0,
            display: "flex",
            flexDirection: "column",
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

                .customers-container {
                    max-width: 1200px;
                    width: 100%;
                    margin: 0 auto;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    animation: slideIn 0.6s ease-out;
                }

                .header-content {
                    flex: 1;
                    min-width: 200px;
                }

                .header-content h1 {
                    font-size: 1.6rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.5px;
                }

                .header-content h1 span {
                    color: #e50914;
                }

                .header-content p {
                    color: #808080;
                    margin: 0;
                    font-size: 0.85rem;
                    line-height: 1.4;
                }

                .search-box {
                    flex: 0 0 auto;
                    min-width: 200px;
                    animation: fadeIn 0.6s ease-out 0.1s both;
                }

                .search-box input {
                    width: 100%;
                    padding: 8px 14px;
                    background: rgba(30, 30, 30, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    color: #ffffff;
                    font-size: 0.85rem;
                    font-family: inherit;
                    transition: all 0.3s ease;
                }

                .search-box input::placeholder {
                    color: #666;
                }

                .search-box input:focus {
                    background: rgba(40, 40, 40, 0.9);
                    border-color: rgba(229, 9, 20, 0.4);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.08);
                }

                .message-box {
                    padding: 10px 14px;
                    margin-bottom: 20px;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: 500;
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

                .table-container {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    overflow: hidden;
                    animation: fadeIn 0.8s ease-out;
                    flex: 1;
                }

                .table-container:hover {
                    border-color: rgba(229, 9, 20, 0.15);
                }

                .table-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                    min-width: 500px;
                }

                thead tr {
                    background: rgba(20, 20, 20, 0.8);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                }

                thead th {
                    padding: 10px 14px;
                    text-align: left;
                    font-weight: 600;
                    color: #808080;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                tbody tr {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    transition: all 0.2s ease;
                }

                tbody tr:hover {
                    background: rgba(40, 40, 40, 0.8);
                }

                tbody td {
                    padding: 10px 14px;
                    color: #e5e5e5;
                }

                .id-cell {
                    color: #808080;
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .mac-address {
                    font-family: 'Courier New', monospace;
                    font-size: 0.75rem;
                    background: rgba(255, 255, 255, 0.06);
                    padding: 2px 8px;
                    border-radius: 3px;
                    color: #81c784;
                    font-weight: 500;
                    display: inline-block;
                }

                .phone-number {
                    color: #6495ed;
                    font-weight: 500;
                }

                .anonymous {
                    color: #808080;
                    font-size: 0.75rem;
                    opacity: 0.6;
                }

                .timestamp {
                    color: #808080;
                    font-size: 0.8rem;
                }

                .action-cell {
                    text-align: right;
                }

                .delete-btn {
                    padding: 4px 12px;
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff5252;
                    border: 1px solid rgba(229, 9, 20, 0.2);
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 0.7rem;
                    font-weight: 700;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .delete-btn:hover {
                    background: #e50914;
                    color: #ffffff;
                    border-color: #e50914;
                    box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
                }

                .delete-btn:active {
                    transform: scale(0.95);
                }

                .empty-state {
                    text-align: center;
                    padding: 50px 20px;
                    color: #808080;
                }

                .empty-icon {
                    font-size: 2.5rem;
                    display: block;
                    margin-bottom: 10px;
                    opacity: 0.4;
                }

                .empty-text {
                    font-size: 0.9rem;
                    margin: 0;
                }

                .empty-sub {
                    font-size: 0.75rem;
                    margin: 4px 0 0 0;
                    opacity: 0.5;
                }

                /* Tablet */
                @media (max-width: 768px) {
                    .customers-container {
                        padding: 0;
                    }

                    .header-section {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 12px;
                    }

                    .header-content h1 {
                        font-size: 1.3rem;
                    }

                    .search-box {
                        min-width: 100%;
                    }

                    table {
                        font-size: 0.8rem;
                    }

                    thead th, tbody td {
                        padding: 8px 12px;
                    }

                    .delete-btn {
                        padding: 3px 10px;
                        font-size: 0.65rem;
                    }
                }

                /* Mobile */
                @media (max-width: 480px) {
                    .header-section {
                        gap: 10px;
                        margin-bottom: 16px;
                    }

                    .header-content h1 {
                        font-size: 1.1rem;
                    }

                    .header-content p {
                        font-size: 0.75rem;
                    }

                    .search-box input {
                        padding: 6px 12px;
                        font-size: 0.8rem;
                    }

                    table {
                        font-size: 0.7rem;
                        min-width: 400px;
                    }

                    thead th, tbody td {
                        padding: 6px 10px;
                    }

                    .id-cell {
                        font-size: 0.7rem;
                    }

                    .mac-address {
                        font-size: 0.65rem;
                        padding: 2px 6px;
                    }

                    .delete-btn {
                        padding: 3px 8px;
                        font-size: 0.6rem;
                    }

                    .timestamp {
                        font-size: 0.7rem;
                    }

                    .message-box {
                        font-size: 0.8rem;
                        padding: 8px 12px;
                        margin-bottom: 16px;
                    }

                    .empty-state {
                        padding: 30px 16px;
                    }

                    .empty-icon {
                        font-size: 2rem;
                    }

                    .empty-text {
                        font-size: 0.8rem;
                    }
                }

                /* Small phones */
                @media (max-width: 360px) {
                    .header-content h1 {
                        font-size: 0.95rem;
                    }

                    table {
                        min-width: 320px;
                        font-size: 0.65rem;
                    }

                    thead th, tbody td {
                        padding: 5px 8px;
                    }

                    .mac-address {
                        font-size: 0.6rem;
                        padding: 1px 5px;
                    }

                    .delete-btn {
                        padding: 2px 6px;
                        font-size: 0.55rem;
                    }
                }

                /* Landscape phones */
                @media (max-height: 600px) and (orientation: landscape) {
                    .header-section {
                        margin-bottom: 12px;
                    }

                    .table-container {
                        max-height: 55vh;
                    }

                    .header-content h1 {
                        font-size: 1.1rem;
                    }
                }
            `}</style>

            <div className="customers-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-content">
                        <h1>👥 Connected <span>Devices</span></h1>
                        <p>Monitor and manage customer device profiles on your network</p>
                    </div>
                    
                    {/* Search Box */}
                    <div className="search-box">
                        <input 
                            type="text" 
                            placeholder="Search MAC or phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Message */}
                {uiMessage && (
                    <div className={`message-box ${isSuccess ? "message-success" : "message-error"}`}>
                        {uiMessage}
                    </div>
                )}

                {/* Table */}
                <div className="table-container">
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Device MAC</th>
                                    <th>Phone Number</th>
                                    <th>Discovered</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="empty-state">
                                                <span className="empty-icon">📭</span>
                                                <p className="empty-text">No devices found</p>
                                                <p className="empty-sub">Connect a device to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td className="id-cell">#{customer.id}</td>
                                            <td>
                                                <span className="mac-address">
                                                    {customer.buyer_mac.toUpperCase()}
                                                </span>
                                            </td>
                                            <td>
                                                {customer.phone_number ? (
                                                    <span className="phone-number">{customer.phone_number}</span>
                                                ) : (
                                                    <span className="anonymous">Anonymous</span>
                                                )}
                                            </td>
                                            <td className="timestamp">
                                                {new Date(customer.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="action-cell">
                                                <button 
                                                    onClick={() => handleDeleteCustomer(customer.id)}
                                                    className="delete-btn"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Customers;