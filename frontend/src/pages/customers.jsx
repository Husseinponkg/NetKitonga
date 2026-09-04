import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../api";

function Customers() {
    // Structural state control hooks for data management and feedback
    const [customerList, setCustomerList] = useState([]);
    const [uiMessage, setUiMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const customerApiUrl = `${API_BASE_URL}/customers`;

    // Extracts context session mapping profile key tokens
    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || 1; // Fallback context tracker index
    };

    // 1. READ: Fetches active portal customer records belonging to the tenant profile
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

    // 2. DELETE: Purges a customer profile out of the multi-tenant database ledger
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
                fetchCustomers(); // Auto-refresh data visualization arrays instantly
            } else {
                setIsSuccess(false);
                setUiMessage(`Action failed: ${result.detail || "Server constraint error"}`);
            }
        } catch (error) {
            setIsSuccess(false);
            setUiMessage("Could not trace customer deletion pipeline infrastructure.");
        }
    };

    // Filter items list array dynamically via search term text inputs
    const filteredCustomers = customerList.filter(customer => 
        customer.buyer_mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone_number && customer.phone_number.includes(searchTerm))
    );

    return (
        <div style={{
            padding: "20px",
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

                .customers-container {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                    animation: fadeIn 0.6s ease-out;
                }

                .header-content {
                    flex: 1;
                    min-width: 250px;
                }

                .header-content h1 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.5px;
                }

                .header-content p {
                    color: #b3b3b3;
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }

                .search-box {
                    flex: 0 0 auto;
                    min-width: 240px;
                    animation: fadeIn 0.6s ease-out 0.1s both;
                }

                .search-box input {
                    width: 100%;
                    padding: 10px 14px;
                    background: rgba(51, 51, 51, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #ffffff;
                    font-size: 0.9rem;
                    font-family: inherit;
                    transition: all 0.3s ease;
                }

                .search-box input::placeholder {
                    color: #666;
                }

                .search-box input:focus {
                    background: rgba(51, 51, 51, 1);
                    border-color: rgba(229, 9, 20, 0.5);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
                }

                .message-box {
                    padding: 12px 16px;
                    margin-bottom: 24px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    animation: fadeIn 0.3s ease-out;
                }

                .message-success {
                    background: rgba(76, 175, 80, 0.15);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    color: #81c784;
                }

                .message-error {
                    background: rgba(229, 9, 20, 0.15);
                    border: 1px solid rgba(229, 9, 20, 0.3);
                    color: #ff6b6b;
                }

                .table-container {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    overflow: hidden;
                    animation: fadeIn 0.8s ease-out;
                }

                .table-wrapper {
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                thead tr {
                    background: rgba(20, 20, 20, 0.6);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                thead th {
                    padding: 12px 14px;
                    text-align: left;
                    font-weight: 600;
                    color: #b3b3b3;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                tbody tr {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s ease;
                }

                tbody tr:hover {
                    background: rgba(30, 30, 30, 1);
                }

                tbody td {
                    padding: 12px 14px;
                    color: #e5e5e5;
                }

                .id-cell {
                    color: #b3b3b3;
                    font-size: 0.85rem;
                }

                .mac-address {
                    font-family: 'Courier New', monospace;
                    font-size: 0.8rem;
                    background: rgba(255, 255, 255, 0.08);
                    padding: 3px 8px;
                    border-radius: 4px;
                    color: #81c784;
                    font-weight: 500;
                }

                .phone-number {
                    color: #6495ed;
                    font-weight: 500;
                }

                .anonymous {
                    color: #b3b3b3;
                    font-size: 0.8rem;
                    opacity: 0.7;
                }

                .timestamp {
                    color: #b3b3b3;
                    font-size: 0.85rem;
                }

                .action-cell {
                    text-align: right;
                }

                .delete-btn {
                    padding: 6px 12px;
                    background: rgba(229, 9, 20, 0.2);
                    color: #ff6b6b;
                    border: 1px solid rgba(229, 9, 20, 0.3);
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    font-weight: 600;
                    font-family: inherit;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .delete-btn:hover {
                    background: #e50914;
                    color: #ffffff;
                    border-color: #e50914;
                    box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
                }

                .delete-btn:active {
                    transform: scale(0.98);
                }

                .empty-state {
                    text-align: center;
                    padding: 50px 20px;
                    color: #b3b3b3;
                }

                .empty-icon {
                    font-size: 2.5rem;
                    display: block;
                    margin-bottom: 12px;
                    opacity: 0.5;
                }

                .empty-text {
                    font-size: 0.95rem;
                    margin: 0;
                }

                /* Tablet Responsive */
                @media (max-width: 768px) {
                    .customers-container {
                        padding: 0;
                    }

                    .header-section {
                        flex-direction: column;
                        gap: 16px;
                    }

                    .header-content h1 {
                        font-size: 1.4rem;
                    }

                    .search-box {
                        min-width: 100%;
                    }

                    table {
                        font-size: 0.85rem;
                    }

                    thead th, tbody td {
                        padding: 10px 12px;
                    }

                    .delete-btn {
                        padding: 5px 10px;
                        font-size: 0.75rem;
                    }
                }

                /* Mobile Responsive */
                @media (max-width: 480px) {
                    .header-section {
                        flex-direction: column;
                        gap: 12px;
                    }

                    .header-content h1 {
                        font-size: 1.2rem;
                    }

                    .header-content p {
                        font-size: 0.8rem;
                    }

                    .search-box {
                        min-width: 100%;
                    }

                    .search-box input {
                        padding: 8px 12px;
                        font-size: 0.85rem;
                    }

                    .table-wrapper {
                        overflow-x: auto;
                    }

                    table {
                        font-size: 0.75rem;
                        min-width: 600px;
                    }

                    thead th, tbody td {
                        padding: 8px 10px;
                    }

                    .id-cell {
                        font-size: 0.75rem;
                    }

                    .mac-address {
                        font-size: 0.7rem;
                        padding: 2px 6px;
                    }

                    .delete-btn {
                        padding: 4px 8px;
                        font-size: 0.7rem;
                    }

                    .timestamp {
                        font-size: 0.75rem;
                    }
                }

                /* Extra small devices */
                @media (max-width: 360px) {
                    .header-content h1 {
                        font-size: 1rem;
                    }

                    table {
                        font-size: 0.7rem;
                    }

                    thead th, tbody td {
                        padding: 6px 8px;
                    }
                }
            `}</style>

            <div className="customers-container">
                {/* Header Section */}
                <div className="header-section">
                    <div className="header-content">
                        <h1>👥 Connected Devices</h1>
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