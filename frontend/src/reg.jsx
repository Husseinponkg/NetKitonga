import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./api";

function Register() {
    const navigate = useNavigate();
    const [registered, setRegistered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [businessName, setBusinessName] = useState("");
    const [systemName, setSystemName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const registerUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", 
                },
                body: JSON.stringify({ 
                    business_name: businessName, 
                    system_name: systemName, 
                    email, 
                    password 
                }),
            });
            
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.detail || data.message || "Failed to register user");
            }
            
            const data = await response.json();
            console.log("User registered:", data);
            setRegistered(true);
            setError(null);
            setTimeout(() => navigate("/"), 1200);
        }
        catch (error) {
            console.error("Error registering user:", error);
            setError(error.message);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            padding: "16px",
            margin: 0,
        }}>
            <style>{`
                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                    padding: 0;
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

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                .register-container {
                    width: 100%;
                    max-width: 420px;
                    animation: fadeIn 0.6s ease-out;
                }

                .logo-section {
                    margin-bottom: 32px;
                    text-align: center;
                }

                .logo {
                    font-size: 2.8rem;
                    margin-bottom: 12px;
                    display: inline-block;
                }

                .brand-name {
                    font-size: 2.4rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0;
                    letter-spacing: -0.5px;
                }

                .brand-subtitle {
                    font-size: 0.9rem;
                    color: #b3b3b3;
                    margin-top: 6px;
                    font-weight: 500;
                }

                .register-box {
                    background: rgba(25, 25, 25, 0.95);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 32px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                }

                .register-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 8px 0;
                }

                .register-description {
                    font-size: 0.9rem;
                    color: #b3b3b3;
                    margin: 0 0 28px 0;
                    line-height: 1.5;
                }

                .form-group {
                    margin-bottom: 18px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #e5e5e5;
                    margin-bottom: 8px;
                    letter-spacing: 0.3px;
                }

                .form-group input {
                    width: 100%;
                    padding: 14px 16px;
                    font-size: 1rem;
                    font-family: 'Inter', system-ui, sans-serif;
                    background: rgba(51, 51, 51, 0.8);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 6px;
                    color: #ffffff;
                    transition: all 0.3s ease;
                    outline: none;
                }

                .form-group input::placeholder {
                    color: #808080;
                }

                .form-group input:focus {
                    background: rgba(51, 51, 51, 1);
                    border-color: rgba(229, 9, 20, 0.5);
                    box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
                }

                .register-button {
                    width: 100%;
                    padding: 12px 16px;
                    font-size: 1.05rem;
                    font-weight: 600;
                    font-family: 'Inter', system-ui, sans-serif;
                    background: linear-gradient(135deg, #e50914 0%, #c20812 100%);
                    color: #ffffff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                    letter-spacing: 0.5px;
                    margin-top: 12px;
                }

                .register-button:hover:not(:disabled) {
                    background: linear-gradient(135deg, #f20916 0%, #d40a16 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(229, 9, 20, 0.35);
                }

                .register-button:active:not(:disabled) {
                    transform: translateY(0);
                }

                .register-button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: #ffffff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                .login-section {
                    margin-top: 24px;
                    text-align: center;
                    font-size: 0.9rem;
                    color: #b3b3b3;
                }

                .login-link {
                    background: none;
                    border: none;
                    color: #e5e5e5;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'Inter', system-ui, sans-serif;
                    font-size: 0.9rem;
                    padding: 0;
                    transition: all 0.2s ease;
                    text-decoration: underline;
                }

                .login-link:hover {
                    color: #ffffff;
                    opacity: 0.8;
                }

                .error-message {
                    background: rgba(229, 9, 20, 0.15);
                    border: 1px solid rgba(229, 9, 20, 0.3);
                    border-radius: 6px;
                    padding: 12px 16px;
                    color: #ff6b6b;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-top: 14px;
                    text-align: center;
                    animation: fadeIn 0.3s ease-out;
                }

                .success-message {
                    background: rgba(76, 175, 80, 0.15);
                    border: 1px solid rgba(76, 175, 80, 0.3);
                    border-radius: 6px;
                    padding: 12px 16px;
                    color: #4caf50;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-top: 14px;
                    text-align: center;
                    animation: fadeIn 0.3s ease-out;
                }

                .info-section {
                    margin-top: 28px;
                    padding-top: 24px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    text-align: center;
                }

                .info-text {
                    font-size: 0.85rem;
                    color: #808080;
                    line-height: 1.6;
                    margin: 0;
                }

                .info-text strong {
                    color: #e5e5e5;
                    font-weight: 600;
                }

                /* Tablet and smaller */
                @media (max-width: 768px) {
                    .register-container {
                        max-width: 100%;
                    }

                    .logo {
                        font-size: 2.4rem;
                    }

                    .brand-name {
                        font-size: 2rem;
                    }

                    .register-box {
                        padding: 28px 24px;
                    }

                    .register-title {
                        font-size: 1.6rem;
                    }
                }

                /* Mobile */
                @media (max-width: 480px) {
                    .register-container {
                        max-width: 100%;
                    }

                    .logo-section {
                        margin-bottom: 24px;
                    }

                    .logo {
                        font-size: 2rem;
                    }

                    .brand-name {
                        font-size: 1.6rem;
                    }

                    .brand-subtitle {
                        font-size: 0.85rem;
                    }

                    .register-box {
                        padding: 24px 20px;
                        border-radius: 6px;
                    }

                    .register-title {
                        font-size: 1.4rem;
                        margin-bottom: 6px;
                    }

                    .register-description {
                        font-size: 0.85rem;
                        margin-bottom: 22px;
                    }

                    .form-group {
                        margin-bottom: 16px;
                    }

                    .form-group label {
                        font-size: 0.8rem;
                    }

                    .form-group input {
                        padding: 12px 14px;
                        font-size: 1rem;
                    }

                    .register-button {
                        padding: 11px 14px;
                        font-size: 1rem;
                    }

                    .info-section {
                        margin-top: 22px;
                        padding-top: 18px;
                    }

                    .info-text {
                        font-size: 0.8rem;
                    }

                    .login-section {
                        font-size: 0.85rem;
                    }
                }

                /* Extra small devices */
                @media (max-width: 360px) {
                    .logo {
                        font-size: 1.8rem;
                    }

                    .brand-name {
                        font-size: 1.4rem;
                    }

                    .register-box {
                        padding: 20px 16px;
                    }

                    .register-title {
                        font-size: 1.2rem;
                    }

                    .form-group input {
                        padding: 11px 12px;
                        font-size: 0.95rem;
                    }
                }
            `}</style>

            <div className="register-container">
                <div className="logo-section">
                    <div className="logo">🏨</div>
                    <h1 className="brand-name">Net Kitonga</h1>
                    <p className="brand-subtitle">Hotspot Supply Co.</p>
                </div>

                <div className="register-box">
                    <h2 className="register-title">Create Account</h2>
                    <p className="register-description">
                        Join our platform and start managing your supplies
                    </p>

                    <form onSubmit={registerUser}>
                        <div className="form-group">
                            <label htmlFor="businessName">Business Name</label>
                            <input
                                id="businessName"
                                type="text"
                                placeholder="Your business name"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="systemName">System Name</label>
                            <input
                                id="systemName"
                                type="text"
                                placeholder="System identifier"
                                value={systemName}
                                onChange={(e) => setSystemName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="register-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="login-section">
                        Already have an account?{" "}
                        <button
                            type="button"
                            className="login-link"
                            onClick={() => navigate("/")}
                        >
                            Sign In
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    {registered && (
                        <div className="success-message">
                            ✓ Account created successfully!
                        </div>
                    )}

                    <div className="info-section">
                        <p className="info-text">
                            <strong>Net Kitonga</strong> — Your trusted partner in hotspot supply. 
                            Connecting businesses with premium quality essentials.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;