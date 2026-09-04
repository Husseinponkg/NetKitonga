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

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .settings-container {
                    max-width: 700px;
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

                .loading-message {
                    padding: clamp(10px, 2vw, 12px) clamp(12px, 2vw, 16px);
                    margin: 0 0 clamp(16px, 3vw, 24px) 0;
                    background: rgba(100, 149, 237, 0.15);
                    border: 1px solid rgba(100, 149, 237, 0.3);
                    border-radius: 6px;
                    color: #6495ed;
                    font-weight: 500;
                    font-size: clamp(0.8rem, 1.2vw, 0.9rem);
                    animation: pulse 1.5s ease-in-out infinite;
                    word-wrap: break-word;
                }

                .settings-card {
                    background: rgba(30, 30, 30, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: clamp(20px, 4vw, 32px);
                    animation: fadeIn 0.6s ease-out 0.1s both;
                }

                .settings-card h2 {
                    margin: 0 0 clamp(16px, 2.5vw, 20px) 0;
                    font-size: clamp(1rem, 1.5vw, 1.1rem);
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
                    margin-bottom: clamp(16px, 2.5vw, 20px);
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

                .form-group label .required {
                    color: #e50914;
                    margin-left: 2px;
                }

                .form-group input {
                    width: 100%;
                    padding: clamp(10px, 1.5vw, 12px) clamp(12px, 1.8vw, 16px);
                    background: rgba(51, 51, 51, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: #ffffff;
                    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
                    font-family: inherit;
                    transition: all 0.2s ease;
                }

                .form-group input:focus {
                    background: rgba(51, 51, 51, 1);
                    border-color: rgba(229, 9, 20, 0.5);
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
                }

                .form-group input::placeholder {
                    color: #666;
                }

                .form-group .hint {
                    display: block;
                    margin-top: 4px;
                    font-size: clamp(0.65rem, 0.9vw, 0.75rem);
                    color: #666;
                }

                .form-group .hint .icon {
                    margin-right: 4px;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: clamp(20px, 3vw, 28px);
                }

                .form-actions button {
                    flex: 1;
                    padding: clamp(10px, 1.5vw, 12px);
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: clamp(0.85rem, 1.2vw, 0.95rem);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: inherit;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .submit-btn {
                    background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
                    color: white;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(229, 9, 20, 0.35);
                    background: linear-gradient(135deg, #f20916 0%, #d40a16 100%);
                }

                .submit-btn:active:not(:disabled) {
                    transform: translateY(0px);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .submit-btn .spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    animation: pulse 0.8s linear infinite;
                }

                .reset-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: #b3b3b3;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .reset-btn:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.2);
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
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 6px;
                    padding: clamp(12px, 2vw, 16px);
                    margin-top: clamp(16px, 2.5vw, 20px);
                }

                .info-box p {
                    margin: 0;
                    font-size: clamp(0.75rem, 1vw, 0.85rem);
                    color: #888;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }

                .info-box .info-icon {
                    font-size: 1.1em;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                /* Responsive Breakpoints */
                @media (max-width: 768px) {
                    .settings-container {
                        padding: 0;
                    }

                    .settings-card {
                        padding: clamp(16px, 3vw, 20px);
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .form-actions button {
                        width: 100%;
                    }
                }

                @media (max-width: 480px) {
                    .settings-card {
                        padding: 14px;
                    }

                    .form-group input {
                        padding: 10px 12px;
                        font-size: 0.85rem;
                    }

                    .form-actions button {
                        padding: 12px;
                        font-size: 0.9rem;
                    }
                }

                /* Touch device optimizations */
                @media (hover: none) {
                    .submit-btn:hover {
                        transform: none;
                        box-shadow: none;
                    }

                    .reset-btn:hover {
                        transform: none;
                    }

                    .form-actions button {
                        min-height: 48px;
                    }

                    .form-group input {
                        min-height: 44px;
                    }
                }

                /* Print styles */
                @media print {
                    .settings-card {
                        background: white !important;
                        border: 1px solid #ddd !important;
                    }

                    .form-actions {
                        display: none;
                    }

                    body {
                        background: white !important;
                        color: black !important;
                    }

                    .form-group input {
                        border: 1px solid #ddd !important;
                        background: white !important;
                        color: black !important;
                    }
                }
            `}</style>

            <div className="settings-container">
                {/* Header */}
                <div className="page-header">
                    <h1>⚙️ Settings</h1>
                    <p>Configure your business and system preferences</p>
                </div>

                {/* Messages */}
                {message && (
                    <div className={message.includes("successfully") || message.includes("saved") ? "success-message" : "error-message"}>
                        {message.includes("successfully") || message.includes("saved") ? "✅" : "⚠️"} {message}
                    </div>
                )}

                {loading && !message && (
                    <div className="loading-message">
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