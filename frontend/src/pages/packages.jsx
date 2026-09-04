import React, { useState, useEffect } from "react";
import { API_BASE_URL as API_ROOT } from "../api";

function PackagesDashboard() {
    // Form and Telemetry State Control Hooks
    const [packageName, setPackageName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [durationValue, setDurationValue] = useState("");
    const [durationUnit, setDurationUnit] = useState("hours");
    const [dataQuotaGb, setDataQuotaGb] = useState("0");
    const [statusToggle, setStatusToggle] = useState("active");
    const [mikrotikRateLimit, setMikrotikRateLimit] = useState("5M/2M");

    // UI tracking state hooks to manage items list grids and update processes
    const [catalogList, setCatalogList] = useState([]);
    const [uiMessage, setUiMessage] = useState("");
    const [editingPackageId, setEditingPackageId] = useState(null);

    const API_BASE_URL = `${API_ROOT}/packages`;
    
    // Core tracking index key pulled straight from active context
    const getTenantId = () => {
        const user = JSON.parse(localStorage.getItem("tenantUser") || "{}");
        return user.id || 1;
    };

    // 1. READ: Fetch all available packages according to tenant ID profile
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

    // 2. CREATE / UPDATE: Submits form context objects down to database layers
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

            // If an active edit row is identified, flip routing destinations to PUT update endpoints
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

    // 3. DELETE: Purges a package profile template out of the product library
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

    // Populates input fields inline to handle edit operations safely
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

    // Format bytes to human readable
    const formatBytes = (bytes) => {
        if (bytes === 0) return "Unlimited";
        const gb = bytes / (1024 ** 3);
        return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 ** 2)).toFixed(1)} MB`;
    };

    // Format seconds to human readable duration
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
            padding: "clamp(12px, 3vw, 20px)", 
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

                .packages-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    width: 100%;
                }

                .page-header {
                    margin-bottom: clamp(20px, 4vw, 32px);
                    animation: fadeIn 0.6s ease-out;
                }

                .page-header h1 {
                    font-size: clamp(1.3rem, 4vw, 2rem);
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.5px;
                    word-wrap: break-word;
                }

                .page-header p {
                    font-size: clamp(0.85rem, 1.5vw, 0.95rem);
                    color: #b3b3b3;
                    margin: 0;
                }

                .success-message {
                    padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px);
                    margin: 0 0 clamp(16px, 3vw, 24px) 0;
                    background: rgba(76, 175, 80, 0.15);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 6px;
                    color: #81c784;
                    font-weight: 500;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    animation: fadeIn 0.3s ease-out;
                    word-wrap: break-word;
                }

                .error-message {
                    padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px);
                    margin: 0 0 clamp(16px, 3vw, 24px) 0;
                    background: rgba(229, 9, 20, 0.15);
                    border: 1px solid rgba(229, 9, 20, 0.3);
                    border-radius: 6px;
                    color: #ff6b6b;
                    font-weight: 500;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    animation: fadeIn 0.3s ease-out;
                    word-wrap: break-word;
                }

                .content-wrapper {
                    display: grid;
                    grid-template-columns: minmax(280px, 350px) 1fr;
                    gap: clamp(16px, 3vw, 24px);
                    align-items: start;
                }

                .form-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: clamp(16px, 3vw, 24px);
                    animation: fadeIn 0.6s ease-out 0.1s both;
                    position: sticky;
                    top: 20px;
                }

                .form-section h3 {
                    margin: 0 0 clamp(16px, 2.5vw, 20px) 0;
                    font-size: clamp(1rem, 1.5vw, 1.1rem);
                    font-weight: 600;
                    color: #ffffff;
                }

                .form-group {
                    margin-bottom: clamp(12px, 2vw, 16px);
                }

                .form-group label {
                    display: block;
                    font-size: clamp(0.7rem, 1vw, 0.8rem);
                    font-weight: 600;
                    color: #b3b3b3;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                .form-group input,
                .form-group select {
                    width: 100%;
                    padding: clamp(8px, 1.2vw, 10px) clamp(10px, 1.5vw, 12px);
                    background: rgba(51, 51, 51, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #ffffff;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    font-family: inherit;
                    transition: all 0.2s ease;
                    -webkit-appearance: none;
                    appearance: none;
                }

                .form-group input:focus,
                .form-group select:focus {
                    background: rgba(51, 51, 51, 1);
                    border-color: rgba(229, 9, 20, 0.5);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
                }

                .form-group input::placeholder {
                    color: #666;
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
                    flex: 0 0 clamp(100px, 15vw, 120px);
                }

                .form-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: clamp(16px, 2.5vw, 20px);
                    flex-wrap: wrap;
                }

                .form-buttons button {
                    flex: 1;
                    min-width: clamp(80px, 15vw, 100px);
                    padding: clamp(8px, 1.2vw, 10px) clamp(10px, 1.5vw, 12px);
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .submit-btn {
                    background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
                    color: white;
                }

                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(229, 9, 20, 0.35);
                    background: linear-gradient(135deg, #f20916 0%, #d40a16 100%);
                }

                .submit-btn:active {
                    transform: translateY(0px);
                }

                .cancel-btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: #b3b3b3;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                .cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .table-section {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: clamp(16px, 3vw, 24px);
                    animation: fadeIn 0.8s ease-out 0.15s both;
                    overflow: hidden;
                    min-width: 0;
                }

                .table-section h3 {
                    margin: 0 0 clamp(16px, 2.5vw, 20px) 0;
                    font-size: clamp(1rem, 1.5vw, 1.1rem);
                    font-weight: 600;
                    color: #ffffff;
                }

                .empty-state {
                    text-align: center;
                    padding: clamp(30px, 5vw, 40px) clamp(16px, 3vw, 20px);
                    color: #b3b3b3;
                }

                .empty-state p {
                    margin: 0;
                    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
                }

                .table-wrapper {
                    overflow-x: auto;
                    border-radius: 6px;
                    -webkit-overflow-scrolling: touch;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: clamp(0.75rem, 1.2vw, 0.9rem);
                    min-width: 600px;
                }

                thead tr {
                    background: rgba(20, 20, 20, 0.6);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                thead th {
                    padding: clamp(8px, 1.2vw, 12px) clamp(10px, 1.5vw, 14px);
                    text-align: left;
                    font-weight: 600;
                    color: #b3b3b3;
                    font-size: clamp(0.65rem, 0.9vw, 0.75rem);
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                    white-space: nowrap;
                }

                tbody tr {
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.2s ease;
                }

                tbody tr:hover {
                    background: rgba(30, 30, 30, 1);
                }

                tbody td {
                    padding: clamp(8px, 1.2vw, 12px) clamp(10px, 1.5vw, 14px);
                    color: #e5e5e5;
                    vertical-align: middle;
                }

                .pkg-name {
                    font-weight: 600;
                    color: #ffffff;
                    word-break: break-word;
                }

                .pkg-desc {
                    font-size: clamp(0.65rem, 0.9vw, 0.8rem);
                    color: #b3b3b3;
                    margin-top: 2px;
                    word-break: break-word;
                }

                .price-value {
                    font-weight: 600;
                    color: #e50914;
                    white-space: nowrap;
                }

                .status-badge {
                    display: inline-block;
                    padding: 2px clamp(6px, 1vw, 10px);
                    border-radius: 4px;
                    font-size: clamp(0.6rem, 0.8vw, 0.75rem);
                    font-weight: 600;
                    text-transform: uppercase;
                    white-space: nowrap;
                }

                .status-active {
                    background: rgba(76, 175, 80, 0.15);
                    color: #81c784;
                }

                .status-inactive {
                    background: rgba(229, 9, 20, 0.15);
                    color: #ff6b6b;
                }

                .action-buttons {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                }

                .action-btn {
                    padding: 4px clamp(6px, 1vw, 10px);
                    border: none;
                    border-radius: 4px;
                    font-size: clamp(0.6rem, 0.8vw, 0.75rem);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    min-height: 28px;
                }

                .edit-btn {
                    background: rgba(100, 149, 237, 0.2);
                    color: #6495ed;
                    border: 1px solid rgba(100, 149, 237, 0.3);
                }

                .edit-btn:hover {
                    background: rgba(100, 149, 237, 0.3);
                    border-color: rgba(100, 149, 237, 0.5);
                }

                .edit-btn:active {
                    transform: scale(0.95);
                }

                .delete-btn {
                    background: rgba(229, 9, 20, 0.2);
                    color: #ff6b6b;
                    border: 1px solid rgba(229, 9, 20, 0.3);
                }

                .delete-btn:hover {
                    background: rgba(229, 9, 20, 0.3);
                    border-color: rgba(229, 9, 20, 0.5);
                }

                .delete-btn:active {
                    transform: scale(0.95);
                }

                .catalog-count {
                    margin-top: 12px;
                    font-size: clamp(0.7rem, 1vw, 0.8rem);
                    color: #b3b3b3;
                    text-align: right;
                }

                /* Responsive Breakpoints */
                @media (max-width: 1024px) {
                    .content-wrapper {
                        grid-template-columns: 1fr;
                    }

                    .form-section {
                        position: static;
                        max-width: 600px;
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
                        flex: 0 0 100px;
                    }

                    .action-buttons {
                        flex-direction: column;
                        gap: 4px;
                    }

                    .action-btn {
                        width: 100%;
                        text-align: center;
                        padding: 6px 8px;
                    }

                    .form-buttons {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .form-buttons button {
                        width: 100%;
                        min-width: unset;
                    }

                    /* Mobile table adjustments */
                    table {
                        min-width: 500px;
                        font-size: 0.75rem;
                    }

                    thead th, tbody td {
                        padding: 6px 8px;
                    }

                    .pkg-desc {
                        display: none;
                    }
                }

                @media (max-width: 480px) {
                    .form-section {
                        padding: 12px;
                    }

                    .table-section {
                        padding: 12px;
                    }

                    table {
                        min-width: 400px;
                        font-size: 0.7rem;
                    }

                    thead th, tbody td {
                        padding: 4px 6px;
                    }

                    .pkg-name {
                        font-size: 0.75rem;
                    }

                    .price-value {
                        font-size: 0.75rem;
                    }

                    .status-badge {
                        font-size: 0.55rem;
                        padding: 1px 4px;
                    }

                    .action-btn {
                        font-size: 0.55rem;
                        padding: 4px 6px;
                        min-height: 22px;
                    }

                    .duration-group {
                        flex-wrap: nowrap;
                    }

                    .duration-group select {
                        flex: 0 0 80px;
                        font-size: 0.7rem;
                    }

                    .duration-group input {
                        font-size: 0.7rem;
                    }
                }

                /* Touch device optimizations */
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

                /* Print styles */
                @media print {
                    .form-section {
                        display: none;
                    }

                    .action-buttons {
                        display: none;
                    }

                    .status-badge {
                        border: 1px solid #666;
                    }

                    body {
                        background: white !important;
                        color: black !important;
                    }
                }
            `}</style>

            <div className="packages-container">
                {/* Header */}
                <div className="page-header">
                    <h1>📦 Bundle & Pricing Configuration</h1>
                    <p>Create and manage your hotspot packages</p>
                </div>

                {/* Message */}
                {uiMessage && (
                    <div className={uiMessage.includes("Failed") || uiMessage.includes("Communication") ? "error-message" : "success-message"}>
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
                                {editingPackageId ? "Update" : "Create"}
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
                        <h3>Available Packages</h3>
                        
                        {catalogList.length === 0 ? (
                            <div className="empty-state">
                                <p>No packages found. Create your first bundle!</p>
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
                                                                Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeletePackage(pkg.id)}
                                                                className="action-btn delete-btn"
                                                            >
                                                                Delete
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