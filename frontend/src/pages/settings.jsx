import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../api";

function Settings() {
    const currentUser = JSON.parse(localStorage.getItem("tenantUser") || "{}");
    const [form, setForm] = useState({ business_name: "", system_name: "", email: "", password: "" });
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/settings?tenant_id=${currentUser.id || 1}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.detail || "Could not load settings.");
                setForm({ ...data, password: "" });
                setMessage("");
            } catch (error) {
                setMessage(error.message);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setSaving(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tenant_id: currentUser.id || 1, ...form }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || "Could not save settings.");
            
            localStorage.setItem("tenantUser", JSON.stringify({ 
                ...currentUser, 
                business_name: form.business_name, 
                email: form.email 
            }));
            
            setForm({ ...form, password: "" });
            setMessage(result.message || "Settings saved successfully!");
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
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

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .settings-container {
                    max-width: 640px;
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

                .message-loading {
                    background: rgba(100, 149, 237, 0.08);
                    border: 1px solid rgba(100, 149, 237, 0.15);
                    color: #6495ed;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                .settings-card {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    padding: 24px;
                    animation: fadeIn 0.6s ease-out 0.1s both;
                }

                .settings-card:hover {
                    border-color: rgba(229, 9, 20, 0.15);
                }

                .settings-card h2 {
                    margin: 0 0 20px 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .settings-card h2 .icon {
                    font-size: 1.2em;
                }

                .form-group {
                    margin-bottom: 16px;
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

                .form-group label .required {
                    color: #e50914;
                    margin-left: 2px;
                }

                .form-group input {
                    width: 100%;
                    padding: 8px 12px;
                    background: rgba(20, 20, 20, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 4px;
                    color: #ffffff;
                    font-size: 0.85rem;
                    font-family: inherit;
                    transition: all 0.2s ease;
                }

                .form-group input:focus {
                    border-color: rgba(229, 9, 20, 0.4);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.08);
                    background: rgba(30, 30, 30, 0.9);
                }

                .form-group input::placeholder {
                    color: #555;
                }

                .form-group .hint {
                    display: block;
                    margin-top: 4px;
                    font-size: 0.7rem;
                    color: #555;
                }

                .form-group .hint .icon {
                    margin-right: 4px;
                }

                .form-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .form-actions button {
                    flex: 1;
                    padding: 8px 12px;
                    border: none;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .submit-btn {
                    background: #e50914;
                    color: white;
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
                }

                .reset-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: #808080;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                }

                .reset-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.08);
                    color: #ffffff;
                }

                .reset-btn:active:not(:disabled) {
                    transform: scale(0.95);
                }

                .reset-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .info-box {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 4px;
                    padding: 12px 14px;
                    margin-top: 16px;
                }

                .info-box p {
                    margin: 0;
                    font-size: 0.75rem;
                    color: #666;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }

                .info-box .info-icon {
                    font-size: 1em;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                .info-box strong {
                    color: #808080;
                }

                /* Tablet */
                @media (max-width: 768px) {
                    .settings-container {
                        padding: 0;
                    }

                    .settings-card {
                        padding: 18px;
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .form-actions button {
                        width: 100%;
                    }
                }

                /* Mobile */
                @media (max-width: 480px) {
                    .page-header h1 {
                        font-size: 1.2rem;
                    }

                    .settings-card {
                        padding: 14px;
                    }

                    .form-group input {
                        padding: 6px 10px;
                        font-size: 0.8rem;
                    }

                    .form-actions button {
                        padding: 10px 12px;
                        font-size: 0.8rem;
                    }
                }

                /* Touch devices */
                @media (hover: none) {
                    .submit-btn:hover:not(:disabled) {
                        transform: none;
                        box-shadow: none;
                    }

                    .reset-btn:hover:not(:disabled) {
                        transform: none;
                    }

                    .form-actions button {
                        min-height: 44px;
                    }

                    .form-group input {
                        min-height: 40px;
                    }
                }
            `}</style>

            <div className="settings-container">
                {/* Header */}
                <div className="page-header">
                    <h1>⚙️ <span>Settings</span></h1>
                    <p>Configure your business and system preferences</p>
                </div>

                {/* Messages */}
                {message && (
                    <div className={`message-box ${message.includes("successfully") || message.includes("saved") ? "message-success" : "message-error"}`}>
                        {message.includes("successfully") || message.includes("saved") ? "✅" : "⚠️"} {message}
                    </div>
                )}

                {loading && !message && (
                    <div className="message-box message-loading">
                        ⏳ Loading settings...
                    </div>
                )}

                {/* Settings Form */}
                {!loading && (
                    <div className="settings-card">
                        <h2>
                            <span className="icon">🏢</span>
                            Business Configuration
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>
                                    Business Name
                                    <span className="required">*</span>
                                </label>
                                <input
                                    required
                                    name="business_name"
                                    value={form.business_name}
                                    onChange={handleChange}
                                    placeholder="e.g., ABC Internet Services"
                                    autoComplete="organization"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    System Name
                                    <span className="required">*</span>
                                </label>
                                <input
                                    required
                                    name="system_name"
                                    value={form.system_name}
                                    onChange={handleChange}
                                    placeholder="e.g., Hotspot Management System"
                                    autoComplete="off"
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Email Address
                                    <span className="required">*</span>
                                </label>
                                <input
                                    required
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="admin@yourbusiness.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current password"
                                    autoComplete="new-password"
                                />
                                <span className="hint">
                                    <span className="icon">🔒</span>
                                    Enter a new password only if you want to change it
                                </span>
                            </div>

                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="submit-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>💾 Save Settings</>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setForm({ ...form, password: "" });
                                        setMessage("");
                                    }}
                                    className="reset-btn"
                                    disabled={saving}
                                >
                                    🗑️ Clear Password
                                </button>
                            </div>
                        </form>

                        <div className="info-box">
                            <p>
                                <span className="info-icon">ℹ️</span>
                                <span>
                                    <strong>Tenant ID:</strong> {currentUser.id || 1} &nbsp;|&nbsp; 
                                    <strong>Role:</strong> {currentUser.role || 'Admin'}
                                    {form.business_name && ` &nbsp;|&nbsp; ${form.business_name}`}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Settings;