import React, { useState, useEffect } from "react";
import { API_BASE_URL as API_ROOT } from "../api";

function PackagesDashboard() {
    const [packageName, setPackageName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [durationValue, setDurationValue] = useState("");
    const [durationUnit, setDurationUnit] = useState("hours");
    const [dataQuotaGb, setDataQuotaGb] = useState("0");
    const [statusToggle, setStatusToggle] = useState("active");
    const [mikrotikRateLimit, setMikrotikRateLimit] = useState("5M/2M");

    const [catalogList, setCatalogList] = useState([]);
    const [uiMessage, setUiMessage] = useState("");
    const [editingPackageId, setEditingPackageId] = useState(null);

    const API_BASE_URL = `${API_ROOT}/packages`;
    
    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || 1;
    };

    const fetchCatalog = async () => {
        try {
            const tenantId = getTenantId();
            const response = await fetch(`${API_BASE_URL}/catalog?tenant_id=${tenantId}`);
            if (response.ok) {
                const data = await response.json();
                setCatalogList(data);
            }
        } catch (error) {
            console.error("Error occurred while executing catalog request mapping:", error);
        }
    };

    useEffect(() => {
        fetchCatalog();
    }, []);

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setUiMessage("");

        const calculatedSeconds = durationUnit === "days" 
            ? parseInt(durationValue) * 86400 
            : parseInt(durationValue) * 3600;

        const calculatedBytes = parseFloat(dataQuotaGb) * 1024 * 1024 * 1024;
        const tenantId = getTenantId();

        const packageData = {
            package_name: packageName,
            description: description || null,
            price: parseFloat(price),
            duration_seconds: calculatedSeconds,
            data_quota_bytes: Math.round(calculatedBytes),
            mikrotik_rate_limit: mikrotikRateLimit || null,
            wifidog_max_down_bandwidth: 5242880, 
            wifidog_max_up_bandwidth: 2097152,
            status: statusToggle
        };

        try {
            let url = `${API_BASE_URL}/create?tenant_id=${tenantId}`;
            let method = "POST";

            if (editingPackageId) {
                url = `${API_BASE_URL}/update?tenant_id=${tenantId}`;
                method = "PUT";
                packageData.package_id = editingPackageId;
            }

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(packageData)
            });

            if (response.ok) {
                setUiMessage(editingPackageId ? "Package updated successfully!" : "Package created successfully!");
                clearFormFields();
                fetchCatalog();
            } else {
                setUiMessage("Failed to execute database record write operations.");
            }
        } catch (error) {
            setUiMessage("Communication failure with platform billing server core.");
        }
    };

    const handleDeletePackage = async (id) => {
        if (!window.confirm("Are you sure you want to remove this bundle package option from your catalog?")) return;
        setUiMessage("");
        
        try {
            const tenantId = getTenantId();
            const response = await fetch(`${API_BASE_URL}/delete?tenant_id=${tenantId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ package_id: id })
            });

            if (response.ok) {
                setUiMessage("Package permanently deleted from registry.");
                fetchCatalog();
            }
        } catch (error) {
            console.error("Error executing catalog row removal:", error);
        }
    };

    const startEditing = (pkg) => {
        setEditingPackageId(pkg.id);
        setPackageName(pkg.package_name);
        setDescription(pkg.description || "");
        setPrice(pkg.price);
        setDurationValue(pkg.duration_seconds >= 86400 ? pkg.duration_seconds / 86400 : pkg.duration_seconds / 3600);
        setDurationUnit(pkg.duration_seconds >= 86400 ? "days" : "hours");
        setDataQuotaGb((pkg.data_quota_bytes / (1024 ** 3)).toString());
        setMikrotikRateLimit(pkg.mikrotik_rate_limit || "5M/2M");
        setStatusToggle(pkg.status);
    };

    const clearFormFields = () => {
        setPackageName("");
        setDescription("");
        setPrice("");
        setDurationValue("");
        setEditingPackageId(null);
        setDataQuotaGb("0");
        setMikrotikRateLimit("5M/2M");
        setStatusToggle("active");
        setDurationUnit("hours");
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return "Unlimited";
        const gb = bytes / (1024 ** 3);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
    };

    const formatDuration = (seconds) => {
        if (seconds >= 86400) {
            const days = seconds / 86400;
            return `${days} Day${days > 1 ? 's' : ''}`;
        }
        const hours = seconds / 3600;
        return `${hours} Hour${hours > 1 ? 's' : ''}`;
    };

    return (
        <div style={{ 
            padding: "16px 20px", 
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif", 
            background: "#141414",
            minHeight: "100vh",
            color: "#ffffff",
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

                .packages-container {
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

                .content-wrapper {
                    display: grid;
                    grid-template-columns: minmax(280px, 360px) 1fr;
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
                    margin-bottom: 12px;
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
                    -webkit-appearance: none;
                    appearance: none;
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
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23808080' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 36px;
                    cursor: pointer;
                }

                .duration-group {
                    display: flex;
                    gap: 8px;
                }

                .duration-group input {
                    flex: 1;
                    min-width: 0;
                }

                .duration-group select {
                    flex: 0 0 100px;
                }

                .form-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: 16px;
                    flex-wrap: wrap;
                }

                .form-buttons button {
                    flex: 1;
                    min-width: 80px;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .submit-btn {
                    background: #e50914;
                    color: white;
                }

                .submit-btn:hover {
                    background: #f40612;
                    transform: scale(1.02);
                    box-shadow: 0 4px 20px rgba(229, 9, 20, 0.3);
                }

                .submit-btn:active {
                    transform: scale(0.98);
                }

                .cancel-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: #808080;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .table-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 20px;
                    animation: fadeIn 0.8s ease-out 0.15s both;
                    overflow: hidden;
                    min-width: 0;
                }

                .table-section:hover {
                    border-color: rgba(229, 9, 20, 0.15);
                }

                .table-section h3 {
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

                .empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: #808080;
                }

                .empty-state p {
                    margin: 0;
                    font-size: 0.9rem;
                }

                .empty-sub {
                    font-size: 0.75rem;
                    margin: 4px 0 0 0;
                    opacity: 0.5;
                }

                .table-wrapper {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.85rem;
                    min-width: 550px;
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

                .pkg-name {
                    font-weight: 600;
                    color: #ffffff;
                }

                .pkg-desc {
                    font-size: 0.7rem;
                    color: #808080;
                    margin-top: 2px;
                }

                .price-value {
                    font-weight: 700;
                    color: #e50914;
                }

                .status-badge {
                    display: inline-block;
                    padding: 2px 10px;
                    border-radius: 3px;
                    font-size: 0.65rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .status-active {
                    background: rgba(76, 175, 80, 0.12);
                    color: #81c784;
                }

                .status-inactive {
                    background: rgba(229, 9, 20, 0.12);
                    color: #ff5252;
                }

                .action-buttons {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .action-btn {
                    padding: 4px 10px;
                    border: none;
                    border-radius: 3px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    font-family: inherit;
                }

                .edit-btn {
                    background: rgba(100, 149, 237, 0.15);
                    color: #6495ed;
                    border: 1px solid rgba(100, 149, 237, 0.2);
                }

                .edit-btn:hover {
                    background: rgba(100, 149, 237, 0.25);
                }

                .delete-btn {
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff5252;
                    border: 1px solid rgba(229, 9, 20, 0.2);
                }

                .delete-btn:hover {
                    background: rgba(229, 9, 20, 0.25);
                }

                .catalog-count {
                    margin-top: 12px;
                    font-size: 0.75rem;
                    color: #555;
                    text-align: right;
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

                    .table-section {
                        max-width: 100%;
                    }
                }

                @media (max-width: 768px) {
                    .packages-container {
                        padding: 0;
                    }

                    .duration-group {
                        flex-wrap: nowrap;
                    }

                    .duration-group select {
                        flex: 0 0 90px;
                    }

                    .action-buttons {
                        flex-direction: column;
                        gap: 4px;
                    }

                    .action-btn {
                        width: 100%;
                        text-align: center;
                        padding: 5px 8px;
                    }

                    .form-buttons {
                        flex-direction: column;
                    }

                    .form-buttons button {
                        width: 100%;
                        min-width: unset;
                    }

                    table {
                        min-width: 450px;
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

                    .form-section {
                        padding: 14px;
                    }

                    .table-section {
                        padding: 14px;
                    }

                    table {
                        min-width: 380px;
                        font-size: 0.7rem;
                    }

                    thead th, tbody td {
                        padding: 4px 8px;
                    }

                    .pkg-name {
                        font-size: 0.75rem;
                    }

                    .pkg-desc {
                        font-size: 0.6rem;
                    }

                    .price-value {
                        font-size: 0.75rem;
                    }

                    .status-badge {
                        font-size: 0.55rem;
                        padding: 1px 6px;
                    }

                    .action-btn {
                        font-size: 0.6rem;
                        padding: 3px 6px;
                    }

                    .duration-group select {
                        flex: 0 0 75px;
                        font-size: 0.75rem;
                    }

                    .duration-group input {
                        font-size: 0.75rem;
                    }
                }

                /* Touch devices */
                @media (hover: none) {
                    .submit-btn:hover {
                        transform: none;
                        box-shadow: none;
                    }

                    .edit-btn:hover, .delete-btn:hover {
                        transform: none;
                    }

                    .action-btn {
                        padding: 8px 10px;
                        min-height: 36px;
                    }
                }
            `}</style>

            <div className="packages-container">
                {/* Header */}
                <div className="page-header">
                    <h1>📦 Bundle <span>Configuration</span></h1>
                    <p>Create and manage your hotspot packages</p>
                </div>

                {/* Message */}
                {uiMessage && (
                    <div className={`message-box ${uiMessage.includes("Failed") || uiMessage.includes("Communication") || uiMessage.includes("failed") ? "message-error" : "message-success"}`}>
                        {uiMessage}
                    </div>
                )}

                {/* Main Content */}
                <div className="content-wrapper">
                    {/* Form Section */}
                    <form onSubmit={handleSubmitForm} className="form-section">
                        <h3>
                            {editingPackageId ? "✏️ Edit Package" : "➕ New Package"}
                        </h3>

                        <div className="form-group">
                            <label>Package Name</label>
                            <input 
                                type="text" 
                                required 
                                value={packageName} 
                                onChange={(e) => setPackageName(e.target.value)} 
                                placeholder="e.g., Basic Plan"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <input 
                                type="text" 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Short marketing text"
                            />
                        </div>

                        <div className="form-group">
                            <label>Price (TZS)</label>
                            <input 
                                type="number" 
                                required 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                                placeholder="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>Access Duration</label>
                            <div className="duration-group">
                                <input 
                                    type="number" 
                                    required 
                                    value={durationValue} 
                                    onChange={(e) => setDurationValue(e.target.value)} 
                                    placeholder="1"
                                />
                                <select 
                                    value={durationUnit} 
                                    onChange={(e) => setDurationUnit(e.target.value)}
                                >
                                    <option value="hours">Hour(s)</option>
                                    <option value="days">Day(s)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Data Limit</label>
                            <select 
                                value={dataQuotaGb} 
                                onChange={(e) => setDataQuotaGb(e.target.value)}
                            >
                                <option value="0">Unlimited</option>
                                <option value="1">1 GB</option>
                                <option value="5">5 GB</option>
                                <option value="10">10 GB</option>
                                <option value="20">20 GB</option>
                                <option value="50">50 GB</option>
                                <option value="100">100 GB</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Speed Limit</label>
                            <input 
                                type="text" 
                                value={mikrotikRateLimit} 
                                onChange={(e) => setMikrotikRateLimit(e.target.value)} 
                                placeholder="e.g., 5M/2M"
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select 
                                value={statusToggle} 
                                onChange={(e) => setStatusToggle(e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" className="submit-btn">
                                {editingPackageId ? "💾 Update" : "🚀 Create"}
                            </button>
                            {editingPackageId && (
                                <button 
                                    type="button" 
                                    onClick={clearFormFields}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Table Section */}
                    <div className="table-section">
                        <h3>
                            📋 Package Catalog
                            <span className="count-badge">{catalogList.length}</span>
                        </h3>
                        
                        {catalogList.length === 0 ? (
                            <div className="empty-state">
                                <p>No packages found</p>
                                <div className="empty-sub">Create your first bundle above</div>
                            </div>
                        ) : (
                            <>
                                <div className="table-wrapper">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Package</th>
                                                <th>Price</th>
                                                <th>Duration</th>
                                                <th>Data</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {catalogList.map((pkg) => (
                                                <tr key={pkg.id}>
                                                    <td>
                                                        <div className="pkg-name">{pkg.package_name}</div>
                                                        {pkg.description && <div className="pkg-desc">{pkg.description}</div>}
                                                    </td>
                                                    <td>
                                                        <span className="price-value">TZS {Number(pkg.price).toLocaleString()}</span>
                                                    </td>
                                                    <td>{formatDuration(pkg.duration_seconds)}</td>
                                                    <td>{formatBytes(pkg.data_quota_bytes)}</td>
                                                    <td>
                                                        <span className={`status-badge status-${pkg.status}`}>
                                                            {pkg.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="action-buttons">
                                                            <button 
                                                                onClick={() => startEditing(pkg)}
                                                                className="action-btn edit-btn"
                                                            >
                                                                ✏️ Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeletePackage(pkg.id)}
                                                                className="action-btn delete-btn"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="catalog-count">
                                    {catalogList.length} package{catalogList.length !== 1 ? 's' : ''} in catalog
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PackagesDashboard;